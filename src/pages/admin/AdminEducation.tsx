import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';
import { useFileUpload } from '../../hooks/useFileUpload';

// Extend the Supabase types to include our computed fields
type EnhancedEducationRow = Database['public']['Tables']['education']['Row'] & {
  education_photos_urls?: string[];
  school_logo_url?: string | null;
};

type EnhancedEducationInsert = Database['public']['Tables']['education']['Insert'] & {
  education_photos_urls?: string[];
  school_logo_url?: string | null;
};

type PartialEnhancedEducationInsert = Partial<EnhancedEducationInsert>;

const AdminEducation: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload({
    defaultBucket: 'education',
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 50 * 1024 * 1024
  });
  const [education, setEducation] = useState<EnhancedEducationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEducation, setNewEducation] = useState<EnhancedEducationInsert>({
    school: '',
    field_of_study: '',
    start_month: new Date().getMonth() + 1,
    start_year: new Date().getFullYear(),
    end_month: null,
    end_year: null,
    degree: null,
    grade: null,
    activities: null,
    description: null,
    education_photos: [],
    education_photos_original_names: [],
    school_logo_url: null,
    school_logo_original_name: null,
    category: 'Education'
  });

  const [educationPhotoFiles, setEducationPhotoFiles] = useState<File[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [editedEducation, setEditedEducation] = useState<EnhancedEducationInsert | null>(null);

  useEffect(() => {
    fetchEducation();
  }, [supabase]);

  const fetchEducation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create query
      const query = supabase.from('education').select('*');

      // Add ordering
      query.order('start_year', { ascending: false });
      query.order('start_month', { ascending: false });

      // Execute query
      const { data: educationData, error: educationError } = await query;

      if (educationError) throw educationError;

      // Process each education entry to get file URLs
      const educationWithUrls = await Promise.all(
        educationData.map(async (edu) => {
          // Convert education photos URLs to display URLs
          const educationPhotos = edu.education_photos?.map((url: string) => {
            if (!url) return null;
            return url;
          }).filter((url: string | null): url is string => url !== null) || [];

          // Convert school logo URL to display URL
          const schoolLogo = edu.school_logo_url || null;

          return {
            ...edu,
            education_photos_urls: educationPhotos,
            school_logo_url: schoolLogo
          };
        })
      );

      setEducation(educationWithUrls);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to fetch education entries: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEducation = (educationId: string) => {
    const educationToEdit = education.find(e => e.education_id === educationId);
    if (educationToEdit) {
      const initialEditState: EnhancedEducationInsert = {
        ...educationToEdit,
        education_photos: educationToEdit.education_photos || [],
        education_photos_original_names: educationToEdit.education_photos_original_names || [],
        school_logo_url: educationToEdit.school_logo_url,
        school_logo_original_name: educationToEdit.school_logo_original_name
      };
      
      setEditingEducation(educationId);
      setEditedEducation(initialEditState);
      setShowAddModal(true);
    }
  };

  const handleUpdateEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEducation || !editedEducation) return;

    try {
      setLoading(true);
      setError(null);

      // Upload education photos
      const educationPhotos: string[] = [];
      if (educationPhotoFiles.length > 0) {
        for (const photo of educationPhotoFiles) {
          const result = await uploadFile(photo, 'education');
          if (result.error) throw result.error;
          if (result.url) {
            educationPhotos.push(result.url);
          }
        }
      }

      // Upload school logo
      let schoolLogoUrl = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, 'education');
        if (result.error) throw result.error;
        schoolLogoUrl = result.url;
      }

      // Create update object with only the fields we want to update
      const updateData: PartialEnhancedEducationInsert = {
        school: editedEducation.school,
        field_of_study: editedEducation.field_of_study,
        start_month: editedEducation.start_month,
        start_year: editedEducation.start_year,
        end_month: editedEducation.end_month,
        end_year: editedEducation.end_year,
        degree: editedEducation.degree,
        grade: editedEducation.grade,
        activities: editedEducation.activities,
        description: editedEducation.description,
        education_photos: educationPhotos.length > 0 ? educationPhotos : editedEducation.education_photos,
        school_logo_url: schoolLogoUrl || editedEducation.school_logo_url,
        updated_at: new Date().toISOString()
      };

      // Update education
      const { error: updateError } = await supabase
        .from('education')
        .update(updateData)
        .eq('education_id', editingEducation);

      if (updateError) throw updateError;

      addToast({
        type: 'success',
        message: 'Education entry updated successfully'
      });

      setShowAddModal(false);
      setEditingEducation(null);
      setEditedEducation(null);
      setLogoFile(null);
      setEducationPhotoFiles([]);
      
      await fetchEducation();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to update education entry: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!newEducation.school.trim()) {
        throw new Error('School name is required');
      }
      if (!newEducation.field_of_study.trim()) {
        throw new Error('Field of study is required');
      }
      if (!newEducation.start_year || newEducation.start_year < 1900) {
        throw new Error('Valid start year is required');
      }
      if (!newEducation.start_month || newEducation.start_month < 1 || newEducation.start_month > 12) {
        throw new Error('Valid start month is required');
      }

      // Upload education photos
      const educationPhotos: string[] = [];
      if (educationPhotoFiles.length > 0) {
        for (const file of educationPhotoFiles) {
          const result = await uploadFile(file, 'education');
          if (result.error) {
            throw new Error(`Failed to upload education photo: ${result.error.message}`);
          }
          if (result.url) {
            educationPhotos.push(result.url);
          }
        }
      }

      // Upload school logo
      let schoolLogoUrl: string | null = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, 'education');
        if (result.error) {
          throw new Error(`Failed to upload school logo: ${result.error.message}`);
        }
        if (result.url) {
          schoolLogoUrl = result.url;
        }
      }

      // Insert education
      const { error: insertError } = await supabase
        .from('education')
        .insert([{
          school: newEducation.school.trim(),
          field_of_study: newEducation.field_of_study.trim(),
          start_month: newEducation.start_month,
          start_year: newEducation.start_year,
          end_month: newEducation.end_month || null,
          end_year: newEducation.end_year || null,
          degree: newEducation.degree || null,
          grade: newEducation.grade || null,
          activities: newEducation.activities || null,
          description: newEducation.description || null,
          education_photos: educationPhotos,
          education_photos_original_names: educationPhotos.map(url => url.split('/').pop() || ''),
          school_logo_url: schoolLogoUrl,
          school_logo_original_name: schoolLogoUrl ? schoolLogoUrl.split('/').pop() : null,
          category: newEducation.category
        }]);

      if (insertError) {
        throw insertError;
      }

      addToast({
        type: 'success',
        message: 'Education entry added successfully'
      });

      // Reset form state
      setShowAddModal(false);
      setNewEducation({
        school: '',
        field_of_study: '',
        start_month: new Date().getMonth() + 1,
        start_year: new Date().getFullYear(),
        end_month: null,
        end_year: null,
        degree: null,
        grade: null,
        activities: null,
        description: null,
        education_photos: [],
        education_photos_original_names: [],
        school_logo_url: null,
        school_logo_original_name: null,
        category: 'Education'
      });
      setEducationPhotoFiles([]);
      setLogoFile(null);
      
      await fetchEducation();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to add education entry: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this education entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('education')
        .delete()
        .eq('education_id', id);

      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Education entry deleted successfully'
      });

      fetchEducation();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Error deleting education entry: ${errorMessage}`
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
        <h2 className="text-2xl font-bold">Education</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Education
        </button>
      </div>

      {showAddModal && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">{editingEducation ? 'Edit' : 'Add'} Education Entry</h3>
            <form onSubmit={editingEducation ? handleUpdateEducation : handleAddEducation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">School/College</label>
                  <input
                    type="text"
                    value={editingEducation ? editedEducation?.school || '' : newEducation.school}
                    onChange={(e) => {
                      if (editingEducation) {
                        setEditedEducation(prev => prev && {
                          ...prev,
                          school: e.target.value
                        });
                      } else {
                        setNewEducation(prev => ({
                          ...prev,
                          school: e.target.value
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={editingEducation ? editedEducation?.field_of_study || '' : newEducation.field_of_study}
                    onChange={(e) => {
                      if (editingEducation) {
                        setEditedEducation(prev => prev && {
                          ...prev,
                          field_of_study: e.target.value
                        });
                      } else {
                        setNewEducation(prev => ({
                          ...prev,
                          field_of_study: e.target.value
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <div className="flex gap-2">
                    <select
                      value={editingEducation ? editedEducation?.start_month || new Date().getMonth() + 1 : newEducation.start_month}
                      onChange={(e) => {
                        if (editingEducation) {
                          setEditedEducation(prev => prev && {
                            ...prev,
                            start_month: parseInt(e.target.value)
                          });
                        } else {
                          setNewEducation(prev => ({
                            ...prev,
                            start_month: parseInt(e.target.value)
                          }));
                        }
                      }}
                      className="w-1/2 p-2 border rounded"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {formatMonth(month)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editingEducation ? editedEducation?.start_year || new Date().getFullYear() : newEducation.start_year}
                      onChange={(e) => {
                        if (editingEducation) {
                          setEditedEducation(prev => prev && {
                            ...prev,
                            start_year: parseInt(e.target.value)
                          });
                        } else {
                          setNewEducation(prev => ({
                            ...prev,
                            start_year: parseInt(e.target.value)
                          }));
                        }
                      }}
                      className="w-1/2 p-2 border rounded"
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      value={editingEducation ? editedEducation?.end_month || '' : newEducation.end_month || ''}
                      onChange={(e) => {
                        if (editingEducation) {
                          setEditedEducation(prev => prev && {
                            ...prev,
                            end_month: e.target.value ? parseInt(e.target.value) : null
                          });
                        } else {
                          setNewEducation(prev => ({
                            ...prev,
                            end_month: e.target.value ? parseInt(e.target.value) : null
                          }));
                        }
                      }}
                      className="w-1/2 p-2 border rounded"
                    >
                      <option value="">None</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {formatMonth(month)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editingEducation ? editedEducation?.end_year || '' : newEducation.end_year || ''}
                      onChange={(e) => {
                        if (editingEducation) {
                          setEditedEducation(prev => prev && {
                            ...prev,
                            end_year: e.target.value ? parseInt(e.target.value) : null
                          });
                        } else {
                          setNewEducation(prev => ({
                            ...prev,
                            end_year: e.target.value ? parseInt(e.target.value) : null
                          }));
                        }
                      }}
                      className="w-1/2 p-2 border rounded"
                    >
                      <option value="">None</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Degree</label>
                  <input
                    type="text"
                    value={editingEducation ? editedEducation?.degree || '' : newEducation.degree || ''}
                    onChange={(e) => {
                      if (editingEducation) {
                        setEditedEducation(prev => prev && {
                          ...prev,
                          degree: e.target.value || null
                        });
                      } else {
                        setNewEducation(prev => ({
                          ...prev,
                          degree: e.target.value || null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grade</label>
                  <input
                    type="text"
                    value={editingEducation ? editedEducation?.grade || '' : newEducation.grade || ''}
                    onChange={(e) => {
                      if (editingEducation) {
                        setEditedEducation(prev => prev && {
                          ...prev,
                          grade: e.target.value || null
                        });
                      } else {
                        setNewEducation(prev => ({
                          ...prev,
                          grade: e.target.value || null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Activities</label>
                  <textarea
                    value={editingEducation ? editedEducation?.activities || '' : newEducation.activities || ''}
                    onChange={(e) => {
                      if (editingEducation) {
                        setEditedEducation(prev => prev && {
                          ...prev,
                          activities: e.target.value || null
                        });
                      } else {
                        setNewEducation(prev => ({
                          ...prev,
                          activities: e.target.value || null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Enter activities and societies..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editingEducation ? editedEducation?.description || '' : newEducation.description || ''}
                    onChange={(e) => {
                      if (editingEducation) {
                        setEditedEducation(prev => prev && {
                          ...prev,
                          description: e.target.value || null
                        });
                      } else {
                        setNewEducation(prev => ({
                          ...prev,
                          description: e.target.value || null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Enter a description..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">School Logo</label>
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
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Education Photos (up to 5)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 5);
                        setEducationPhotoFiles(files);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {educationPhotoFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {educationPhotoFiles.map((file, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEducation({
                      school: '',
                      field_of_study: '',
                      start_month: new Date().getMonth() + 1,
                      start_year: new Date().getFullYear(),
                      end_month: null,
                      end_year: null,
                      degree: null,
                      grade: null,
                      activities: null,
                      description: null,
                      education_photos: [],
                      education_photos_original_names: [],
                      school_logo_url: null,
                      school_logo_original_name: null,
                      category: 'Education'
                    });
                    setEditingEducation(null);
                    setEditedEducation(null);
                    setLogoFile(null);
                    setEducationPhotoFiles([]);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? (editingEducation ? 'Updating...' : 'Adding...') : editingEducation ? 'Update Education' : 'Add Education'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {education.map((edu) => (
          <motion.div
            key={edu.education_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{edu.school}</h3>
                <p className="text-gray-600">
                  {formatMonth(edu.start_month)} {edu.start_year} - 
                  {edu.end_month && edu.end_year ? 
                    `${formatMonth(edu.end_month)} ${edu.end_year}` : 
                    'Present'}
                </p>
                <p className="text-gray-600">Field of Study: {edu.field_of_study}</p>
                {edu.degree && (
                  <p className="text-gray-600">Degree: {edu.degree}</p>
                )}
                {edu.grade && (
                  <p className="text-gray-600">Grade: {edu.grade}</p>
                )}
                {edu.activities && (
                  <div className="mt-2">
                    <span className="font-medium">Activities:</span>
                    <div className="mt-1">
                      <p className="text-gray-600">{edu.activities}</p>
                    </div>
                  </div>
                )}
                {edu.description && (
                  <div className="mt-2">
                    <span className="font-medium">Description:</span>
                    <div className="mt-1">
                      <p className="text-gray-600">{edu.description}</p>
                    </div>
                  </div>
                )}
                {edu.education_photos_urls && edu.education_photos_urls.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Education Photos:</span>
                    <div className="mt-1 flex gap-2">
                      {edu.education_photos_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Education photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {edu.school_logo_url && (
                  <div className="mt-2">
                    <span className="font-medium">School Logo:</span>
                    <div className="mt-1">
                      <img
                        src={edu.school_logo_url}
                        alt={edu.school}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditEducation(edu.education_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEducation(edu.education_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminEducation;
