import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';
import { useFileUpload } from '../../hooks/useFileUpload';

type ExperienceRow = Database['public']['Tables']['experience']['Row'];
type ExperienceInsert = Database['public']['Tables']['experience']['Insert'];

const AdminExperience: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload();
  const [experience, setExperience] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExperience, setNewExperience] = useState<ExperienceInsert>({
    title: '',
    company_name: '',
    location: '',
    employment_type: '',
    description: '',
    start_month: 1,
    start_year: new Date().getFullYear(),
    end_month: null,
    end_year: null,
    is_current: true,
    skills_used: [] as string[],
    company_logo: null,
    related_photos: []
  });

  const [selectedCompanyLogo, setSelectedCompanyLogo] = useState<File | null>(null);
  const [selectedRelatedPhotos, setSelectedRelatedPhotos] = useState<File[]>([]);

  useEffect(() => {
    fetchExperience();
  }, [supabase]);

  const fetchExperience = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: experienceData, error: experienceError } = await supabase
        .from('experience')
        .select('*')
        .order('start_year', { ascending: false })
        .order('start_month', { ascending: false });

      if (experienceError) throw experienceError;

      setExperience(experienceData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to fetch experience: ${errorMessage}`
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
      
      // Upload related photos
      const relatedPhotos: string[] = [];
      if (selectedRelatedPhotos.length > 0) {
        for (const photo of selectedRelatedPhotos) {
          const result = await uploadFile(photo, 'experience');
          if (result.error) throw result.error;
          if (result.url) {
            relatedPhotos.push(result.url);
          }
        }
      }

      // Upload company logo
      let companyLogoUrl = null;
      if (selectedCompanyLogo) {
        const result = await uploadFile(selectedCompanyLogo, 'experience');
        if (result.error) throw result.error;
        companyLogoUrl = result.url;
      }

      // Insert experience
      const { error: insertError } = await supabase
        .from('experience')
        .insert([{
          ...newExperience,
          related_photos: relatedPhotos,
          company_logo: companyLogoUrl
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
        start_month: 1,
        start_year: new Date().getFullYear(),
        end_month: null,
        end_year: null,
        is_current: true,
        skills_used: [] as string[],
        company_logo: null,
        related_photos: []
      });
      setSelectedCompanyLogo(null);
      setSelectedRelatedPhotos([]);
      
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
      // Delete the experience entry
      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Experience entry deleted successfully'
      });

      fetchExperience();
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
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Experience
        </button>
      </div>

      <div className="space-y-4">
        {experience.map((exp) => (
          <motion.div
            key={exp.id}
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
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Experience Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
          >
            <h2 className="text-xl font-bold mb-4">Add New Experience</h2>
            <form onSubmit={handleAddExperience} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newExperience.title}
                  onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
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
                  value={newExperience.company_name}
                  onChange={(e) => setNewExperience({ ...newExperience, company_name: e.target.value })}
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
                  value={newExperience.location ?? ''}
                  onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type
                </label>
                <select
                  value={newExperience.employment_type}
                  onChange={(e) => setNewExperience({ ...newExperience, employment_type: e.target.value })}
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
                    value={newExperience.start_month}
                    onChange={(e) => setNewExperience({ ...newExperience, start_month: parseInt(e.target.value) })}
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
                    value={newExperience.start_year}
                    onChange={(e) => setNewExperience({ ...newExperience, start_year: parseInt(e.target.value) })}
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
                    value={newExperience.end_month ?? ''}
                    onChange={(e) => setNewExperience({ ...newExperience, end_month: e.target.value ? parseInt(e.target.value) : null })}
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
                    value={newExperience.end_year ?? ''}
                    onChange={(e) => setNewExperience({ ...newExperience, end_year: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newExperience.description !== null ? newExperience.description : ''}
                  onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value !== '' ? e.target.value : null })}
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
                  value={Array.isArray(newExperience.skills_used) ? newExperience.skills_used.join(', ') : ''}
                  onChange={(e) => setNewExperience({ ...newExperience, skills_used: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] })}
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
                        setSelectedCompanyLogo(e.target.files[0]);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {selectedCompanyLogo && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedCompanyLogo.name}
                    </p>
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
                        setSelectedRelatedPhotos(files);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {selectedRelatedPhotos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedRelatedPhotos.map((file, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Experience
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
