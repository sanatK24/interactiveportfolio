import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';
import { useFileUpload } from '../../hooks/useFileUpload';

type EnhancedExperienceRow = Database['public']['Tables']['experience']['Row'] & {
  experience_photos_urls?: string[];
  company_logo_url?: string | null;
};

type EnhancedExperienceInsert = Database['public']['Tables']['experience']['Insert'] & {
  experience_photos_urls?: string[];
  company_logo_url?: string | null;
};

type PartialEnhancedExperienceInsert = Partial<EnhancedExperienceInsert>;

const AdminExperience: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload({
    defaultBucket: 'experience',
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 50 * 1024 * 1024
  });
  const [experience, setExperience] = useState<EnhancedExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExperience, setNewExperience] = useState<EnhancedExperienceInsert>({
    title: '',
    company_name: '',
    location: '',
    employment_type: '',
    description: '',
    start_month: new Date().getMonth() + 1,
    start_year: new Date().getFullYear(),
    end_month: null,
    end_year: null,
    is_current: true,
    skills_used: [] as string[],
    experience_photos: [],
    experience_photos_original_names: [],
    company_logo_url: null,
    company_logo_original_name: null,
    category: 'Experience'
  });

  const [experiencePhotoFiles, setExperiencePhotoFiles] = useState<File[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editedExperience, setEditedExperience] = useState<EnhancedExperienceInsert | null>(null);

  useEffect(() => {
    fetchExperience();
  }, [supabase]);

  const fetchExperience = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = supabase.from('experience').select('*');
      query.order('start_year', { ascending: false });
      query.order('start_month', { ascending: false });

      const { data: experienceData, error: experienceError } = await query;

      if (experienceError) throw experienceError;

      const experienceWithUrls = await Promise.all(
        experienceData.map(async (exp) => {
          const experiencePhotos = exp.experience_photos?.map((url: string) => {
            if (!url) return null;
            return url;
          }).filter((url: string | null): url is string => url !== null) || [];

          const companyLogo = exp.company_logo_url || null;

          return {
            ...exp,
            experience_photos_urls: experiencePhotos,
            company_logo_url: companyLogo
          };
        })
      );

      setExperience(experienceWithUrls);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to fetch experience entries: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExperience = (experienceId: string) => {
    const experienceToEdit = experience.find(e => e.experience_id === experienceId);
    if (experienceToEdit) {
      const initialEditState: EnhancedExperienceInsert = {
        ...experienceToEdit,
        experience_photos: experienceToEdit.experience_photos || [],
        experience_photos_original_names: experienceToEdit.experience_photos_original_names || [],
        company_logo_url: experienceToEdit.company_logo_url,
        company_logo_original_name: experienceToEdit.company_logo_original_name
      };
      
      setEditingExperience(experienceId);
      setEditedExperience(initialEditState);
      setShowAddModal(true);
    }
  };

  const handleUpdateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExperience || !editedExperience) return;

    try {
      setLoading(true);
      setError(null);

      // Upload experience photos
      const experiencePhotos: string[] = [];
      if (experiencePhotoFiles.length > 0) {
        for (const photo of experiencePhotoFiles) {
          const result = await uploadFile(photo, 'experience', 'experience');
          if (result.error) throw result.error;
          if (result.url) {
            experiencePhotos.push(result.url);
          }
        }
      }

      // Upload company logo
      let companyLogoUrl = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, 'experience', 'experience');
        if (result.error) throw result.error;
        companyLogoUrl = result.url;
      }

      const updateData: PartialEnhancedExperienceInsert = {
        title: editedExperience.title,
        company_name: editedExperience.company_name,
        location: editedExperience.location,
        employment_type: editedExperience.employment_type,
        description: editedExperience.description,
        start_month: editedExperience.start_month,
        start_year: editedExperience.start_year,
        end_month: editedExperience.end_month,
        end_year: editedExperience.end_year,
        is_current: editedExperience.is_current,
        skills_used: editedExperience.skills_used,
        experience_photos: experiencePhotos.length > 0 ? experiencePhotos : editedExperience.experience_photos,
        company_logo_url: companyLogoUrl || editedExperience.company_logo_url,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('experience')
        .update(updateData)
        .eq('experience_id', editingExperience);

      if (updateError) throw updateError;

      addToast({
        type: 'success',
        message: 'Experience entry updated successfully'
      });

      setShowAddModal(false);
      setEditingExperience(null);
      setEditedExperience(null);
      setLogoFile(null);
      setExperiencePhotoFiles([]);
      
      await fetchExperience();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to update experience entry: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const relatedPhotos: string[] = [];
      if (experiencePhotoFiles.length > 0) {
        for (const photo of experiencePhotoFiles) {
          const result = await uploadFile(photo, 'experience', 'experience');
          if (result.error) throw result.error;
          if (result.url) {
            relatedPhotos.push(result.url);
          }
        }
      }

      let companyLogoUrl = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, 'experience', 'experience');
        if (result.error) throw result.error;
        companyLogoUrl = result.url;
      }

      const { error: insertError } = await supabase
        .from('experience')
        .insert([{
          ...newExperience,
          experience_photos: relatedPhotos,
          company_logo_url: companyLogoUrl
        }]);

      if (insertError) throw insertError;

      addToast({
        type: 'success',
        message: 'Experience entry added successfully'
      });

      setShowAddModal(false);
      setNewExperience({
        title: '',
        company_name: '',
        location: '',
        employment_type: '',
        description: '',
        start_month: new Date().getMonth() + 1,
        start_year: new Date().getFullYear(),
        end_month: null,
        end_year: null,
        is_current: true,
        skills_used: [] as string[],
        experience_photos: [],
        experience_photos_original_names: [],
        company_logo_url: null,
        company_logo_original_name: null,
        category: 'Experience'
      });
      setLogoFile(null);
      setExperiencePhotoFiles([]);
      
      await fetchExperience();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to add experience entry: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this experience entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('experience_id', id);

      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Experience entry deleted successfully'
      });

      await fetchExperience();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Error deleting experience: ${errorMessage}`
      });
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-48 h-4 bg-gray-200 rounded-full"></div>
              <div className="mt-2 w-32 h-4 bg-gray-200 rounded-full"></div>
              <div className="mt-2 w-48 h-4 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Experience</h1>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingExperience(null);
            setEditedExperience(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Experience
        </button>
      </div>

      <div className="space-y-4">
        {experience.map((exp) => (
          <motion.div
            key={exp.experience_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{exp.title}</h3>
                <p className="text-gray-600">
                  {exp.company_name} • {exp.location}
                </p>
                <p className="text-gray-600">
                  {formatMonth(exp.start_month)} {exp.start_year} - 
                  {exp.end_month && exp.end_year ? 
                    `${formatMonth(exp.end_month)} ${exp.end_year}` : 
                    'Present'}
                </p>
                {exp.skills_used && exp.skills_used.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Skills:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {exp.skills_used.map((skill: string, skillIndex: number) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {exp.description && (
                  <div className="mt-2">
                    <span className="font-medium">Description:</span>
                    <div className="mt-1">
                      <p className="text-gray-600">{exp.description}</p>
                    </div>
                  </div>
                )}
                {exp.company_logo_url && (
                  <div className="mt-2">
                    <span className="font-medium">Company Logo:</span>
                    <div className="mt-1">
                      <img
                        src={exp.company_logo_url}
                        alt={exp.company_name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
                {exp.experience_photos_urls && exp.experience_photos_urls.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Related Photos:</span>
                    <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {exp.experience_photos_urls.map((photoUrl: string, photoIndex: number) => (
                        <img
                          key={photoIndex}
                          src={photoUrl}
                          alt={`Photo ${photoIndex + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditExperience(exp.experience_id)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteExperience(exp.experience_id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Experience Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto pt-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[calc(100vh-12rem)] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingExperience ? 'Edit Experience' : 'Add New Experience'}
            </h2>
            <form onSubmit={editingExperience ? handleUpdateExperience : handleAddExperience} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingExperience ? (editedExperience?.title ?? '') : newExperience.title}
                  onChange={(e) => {
                    if (editingExperience) {
                      setEditedExperience({ ...editedExperience!, title: e.target.value });
                    } else {
                      setNewExperience({ ...newExperience, title: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editingExperience ? (editedExperience?.company_name ?? '') : newExperience.company_name}
                  onChange={(e) => {
                    if (editingExperience) {
                      setEditedExperience({ ...editedExperience!, company_name: e.target.value });
                    } else {
                      setNewExperience({ ...newExperience, company_name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editingExperience ? (editedExperience?.location ?? '') : newExperience.location ?? ''}
                  onChange={(e) => {
                    if (editingExperience) {
                      setEditedExperience({ ...editedExperience!, location: e.target.value });
                    } else {
                      setNewExperience({ ...newExperience, location: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type
                </label>
                <select
                  value={editingExperience ? (editedExperience?.employment_type ?? '') : newExperience.employment_type}
                  onChange={(e) => {
                    if (editingExperience) {
                      setEditedExperience({ ...editedExperience!, employment_type: e.target.value });
                    } else {
                      setNewExperience({ ...newExperience, employment_type: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select employment type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Month
                  </label>
                  <select
                    value={editingExperience ? (editedExperience?.start_month ?? '') : newExperience.start_month}
                    onChange={(e) => {
                      if (editingExperience) {
                        setEditedExperience({ ...editedExperience!, start_month: parseInt(e.target.value) });
                      } else {
                        setNewExperience({ ...newExperience, start_month: parseInt(e.target.value) });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <option key={month} value={month}>
                        {formatMonth(month)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={editingExperience ? (editedExperience?.start_year ?? '') : newExperience.start_year}
                    onChange={(e) => {
                      if (editingExperience) {
                        setEditedExperience({ ...editedExperience!, start_year: parseInt(e.target.value) });
                      } else {
                        setNewExperience({ ...newExperience, start_year: parseInt(e.target.value) });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Month
                  </label>
                  <select
                    value={editingExperience ? (editedExperience?.end_month ?? '') : newExperience.end_month ?? ''}
                    onChange={(e) => {
                      if (editingExperience) {
                        setEditedExperience({ ...editedExperience!, end_month: e.target.value ? parseInt(e.target.value) : null });
                      } else {
                        setNewExperience({ ...newExperience, end_month: e.target.value ? parseInt(e.target.value) : null });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Present</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <option key={month} value={month}>
                        {formatMonth(month)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    value={editingExperience ? (editedExperience?.end_year ?? '') : newExperience.end_year ?? ''}
                    onChange={(e) => {
                      if (editingExperience) {
                        setEditedExperience({ ...editedExperience!, end_year: e.target.value ? parseInt(e.target.value) : null });
                      } else {
                        setNewExperience({ ...newExperience, end_year: e.target.value ? parseInt(e.target.value) : null });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingExperience ? (editedExperience?.description ?? '') : newExperience.description ?? ''}
                  onChange={(e) => {
                    if (editingExperience) {
                      setEditedExperience({ ...editedExperience!, description: e.target.value !== '' ? e.target.value : null });
                    } else {
                      setNewExperience({ ...newExperience, description: e.target.value !== '' ? e.target.value : null });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <input
                  type="text"
                  value={editingExperience ? 
                    (editedExperience?.skills_used ? editedExperience.skills_used.join(', ') : '') : 
                    newExperience.skills_used ? newExperience.skills_used.join(', ') : ''}
                  onChange={(e) => {
                    const skills = e.target.value ? e.target.value.split(',').map(s => s.trim()) : [];
                    if (editingExperience) {
                      setEditedExperience({ ...editedExperience!, skills_used: skills });
                    } else {
                      setNewExperience({ ...newExperience, skills_used: skills });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter skills separated by commas"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {logoFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {logoFile.name}
                    </p>
                  )}
                  {editingExperience && editedExperience?.company_logo_url && (
                    <div className="mt-2">
                      <img
                        src={editedExperience.company_logo_url}
                        alt="Current logo"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Related Photos (up to 5)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 5);
                        setExperiencePhotoFiles(files);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {experiencePhotoFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {experiencePhotoFiles.map((file, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                  {editingExperience && editedExperience?.experience_photos_urls && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {editedExperience.experience_photos_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Current photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExperience(null);
                    setEditedExperience(null);
                    setLogoFile(null);
                    setExperiencePhotoFiles([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingExperience ? 'Update Experience' : 'Add Experience'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminExperience;
