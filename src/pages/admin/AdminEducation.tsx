import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';

type EducationRow = Database['public']['Tables']['education']['Row'];
type EducationInsert = Database['public']['Tables']['education']['Insert'];

type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

const AdminEducation: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
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
    description: null
  });

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
            media: mediaData as MediaAttachment[]
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
      const { error } = await supabase
        .from('education')
        .insert([newEducation]);

      if (error) throw error;

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
        description: null
      });
      fetchEducation();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Error adding education: ${errorMessage}`
      });
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this education entry?')) {
      return;
    }

    try {
      // Delete media attachments first
      await supabase
        .from('media_attachments')
        .delete()
        .eq('reference_id', id)
        .eq('reference_type', 'education');

      // Then delete the education entry
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
        message: `Error deleting education: ${errorMessage}`
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
        <h1 className="text-2xl font-bold">Education</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Education
        </button>
      </div>

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
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Education Modal */}
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
            <h2 className="text-xl font-bold mb-4">Add New Education</h2>
            <form onSubmit={handleAddEducation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <input
                  type="text"
                  value={newEducation.school}
                  onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={newEducation.field_of_study}
                  onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Month
                  </label>
                  <select
                    value={newEducation.start_month}
                    onChange={(e) => setNewEducation({ ...newEducation, start_month: parseInt(e.target.value) })}
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
                    value={newEducation.start_year}
                    onChange={(e) => setNewEducation({ ...newEducation, start_year: parseInt(e.target.value) })}
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
                    value={newEducation.end_month ?? ''}
                    onChange={(e) => setNewEducation({ ...newEducation, end_month: e.target.value ? parseInt(e.target.value) : null })}
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
                    value={newEducation.end_year ?? ''}
                    onChange={(e) => setNewEducation({ ...newEducation, end_year: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree
                </label>
                <input
                  type="text"
                  value={newEducation.degree ?? ''}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <input
                  type="text"
                  value={newEducation.grade ?? ''}
                  onChange={(e) => setNewEducation({ ...newEducation, grade: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activities
                </label>
                <textarea
                  value={newEducation.activities ?? ''}
                  onChange={(e) => setNewEducation({ ...newEducation, activities: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEducation.description ?? ''}
                  onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
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
                  Add Education
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminEducation;
