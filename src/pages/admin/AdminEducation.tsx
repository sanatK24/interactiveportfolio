import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';
import { useFileUpload } from '../../hooks/useFileUpload';

type EducationRow = Database['public']['Tables']['education']['Row'];
type EducationInsert = Database['public']['Tables']['education']['Insert'];

const AdminEducation: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload();
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEducation, setNewEducation] = useState<EducationInsert>({
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
    school_logo: null,
    related_photos: []
  });

  const [selectedSchoolLogo, setSelectedSchoolLogo] = useState<File | null>(null);
  const [selectedRelatedPhotos, setSelectedRelatedPhotos] = useState<File[]>([]);

  useEffect(() => {
    fetchEducation();
  }, [supabase]);

  const fetchEducation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: educationData, error: educationError } = await supabase
        .from('education')
        .select('*')
        .order('start_year', { ascending: false })
        .order('start_month', { ascending: false });

      if (educationError) throw educationError;

      // Fetch media attachments for each education entry
      const educationWithMedia = await Promise.all(
        educationData.map(async (edu) => {
          const { data: mediaData, error: mediaError } = await supabase
            .from('media_attachments')
            .select('*')
            .eq('reference_id', edu.id)
            .eq('reference_type', 'education');

          if (mediaError) throw mediaError;

          return {
            ...edu,
            media: mediaData
          };
        })
      );

      setEducation(educationWithMedia);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to fetch education: ${errorMessage}`
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
      
      // Upload related photos
      const relatedPhotos: string[] = [];
      if (selectedRelatedPhotos.length > 0) {
        for (const photo of selectedRelatedPhotos) {
          const result = await uploadFile(photo, 'education');
          if (result.error) throw result.error;
          if (result.url) {
            relatedPhotos.push(result.url);
          }
        }
      }

      // Upload school logo
      let schoolLogoUrl = null;
      if (selectedSchoolLogo) {
        const result = await uploadFile(selectedSchoolLogo, 'education');
        if (result.error) throw result.error;
        schoolLogoUrl = result.url;
      }

      // Insert education
      const { error: insertError } = await supabase
        .from('education')
        .insert([{
          ...newEducation,
          related_photos: relatedPhotos,
          school_logo: schoolLogoUrl
        }]);

      if (insertError) throw insertError;

      addToast({
        type: 'success',
        message: 'Education entry added successfully'
      });

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
        school_logo: null,
        related_photos: []
      });
      setSelectedSchoolLogo(null);
      setSelectedRelatedPhotos([]);
      
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
        .eq('id', id);

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
            <h3 className="text-xl font-bold mb-4">Add Education Entry</h3>
            <form onSubmit={handleAddEducation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">School/College</label>
                  <input
                    type="text"
                    value={newEducation.school}
                    onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={newEducation.field_of_study}
                    onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
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
                      value={newEducation.start_month}
                      onChange={(e) => setNewEducation({ ...newEducation, start_month: parseInt(e.target.value) })}
                      className="w-1/2 p-2 border rounded"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {formatMonth(month)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newEducation.start_year}
                      onChange={(e) => setNewEducation({ ...newEducation, start_year: parseInt(e.target.value) })}
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
                      value={newEducation.end_month || ''}
                      onChange={(e) => setNewEducation({ ...newEducation, end_month: e.target.value ? parseInt(e.target.value) : null })}
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
                      value={newEducation.end_year || ''}
                      onChange={(e) => setNewEducation({ ...newEducation, end_year: e.target.value ? parseInt(e.target.value) : null })}
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
                    value={newEducation.degree || ''}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value || null })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grade</label>
                  <input
                    type="text"
                    value={newEducation.grade || ''}
                    onChange={(e) => setNewEducation({ ...newEducation, grade: e.target.value || null })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Activities</label>
                  <textarea
                    value={newEducation.activities || ''}
                    onChange={(e) => setNewEducation({ ...newEducation, activities: e.target.value || null })}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Enter activities and societies..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newEducation.description || ''}
                    onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value || null })}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Enter a description..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">School/College Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedSchoolLogo(e.target.files[0]);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {selectedSchoolLogo && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedSchoolLogo.name}
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
                      school_logo: null,
                      related_photos: []
                    });
                    setSelectedSchoolLogo(null);
                    setSelectedRelatedPhotos([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Education'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
      <div className="space-y-4">
        {education.map((edu) => (
          <motion.div
            key={edu.id}
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
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
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
