import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';

type CertificationsRow = Database['public']['Tables']['certifications']['Row'];
type CertificationsInsert = Database['public']['Tables']['certifications']['Insert'];
type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

type CertificationWithMedia = CertificationsRow & {
  media: MediaAttachment[];
};

const AdminCertifications: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const [certifications, setCertifications] = useState<CertificationWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCertification, setNewCertification] = useState<CertificationsInsert>({
    name: '',
    issuing_organization: '',
    issue_year: new Date().getFullYear(),
    issue_month: new Date().getMonth() + 1,
    expiration_year: null,
    expiration_month: null,
    credential_url: '',
    skills: []
  });

  useEffect(() => {
    fetchCertifications();
  }, [supabase]);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: certificationsData, error: certificationsError } = await supabase
        .from('certifications')
        .select('*')
        .order('issue_year', { ascending: false })
        .order('issue_month', { ascending: false });

      if (certificationsError) throw certificationsError;

      // Fetch media attachments for each certification
      const certificationsWithMedia = await Promise.all(
        certificationsData.map(async (cert) => {
          const { data: mediaData, error: mediaError } = await supabase
            .from('media_attachments')
            .select('*')
            .eq('reference_id', cert.id)
            .eq('reference_type', 'certification');

          if (mediaError) throw mediaError;

          return {
            ...cert,
            media: mediaData as MediaAttachment[]
          };
        })
      );

      setCertifications(certificationsWithMedia);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to fetch certifications: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('certifications')
        .insert([newCertification]);

      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Certification added successfully'
      });

      setShowAddModal(false);
      setNewCertification({
        name: '',
        issuing_organization: '',
        issue_year: new Date().getFullYear(),
        issue_month: new Date().getMonth() + 1,
        expiration_year: null,
        expiration_month: null,
        credential_url: '',
        skills: []
      });
      fetchCertifications();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Error adding certification: ${errorMessage}`
      });
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      // Delete media attachments first
      await supabase
        .from('media_attachments')
        .delete()
        .eq('reference_id', id)
        .eq('reference_type', 'certification');

      // Then delete the certification
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Certification deleted successfully'
      });

      fetchCertifications();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Error deleting certification: ${errorMessage}`
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
        <h1 className="text-2xl font-bold">Certifications</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Certification
        </button>
      </div>

      <div className="space-y-4">
        {certifications.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{cert.name}</h3>
                <p className="text-gray-600">
                  {formatMonth(cert.issue_month)} {cert.issue_year} - 
                  {cert.expiration_year && cert.expiration_month ? 
                    `${formatMonth(cert.expiration_month)} ${cert.expiration_year}` : 
                    'Valid indefinitely'}
                </p>
                <p className="text-gray-600">Issued by: {cert.issuing_organization}</p>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Credential
                  </a>
                )}
                {cert.skills && cert.skills.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {cert.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cert.media && cert.media.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Supporting Documents:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {cert.media.map((media: MediaAttachment, index: number) => (
                        <a
                          key={index}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {media.title || media.description || `Document ${index + 1}`}
                        </a>
                      ))}
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
                  onClick={() => handleDeleteCertification(cert.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Certification Modal */}
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
            <h2 className="text-xl font-bold mb-4">Add New Certification</h2>
            <form onSubmit={handleAddCertification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={newCertification.issuing_organization}
                  onChange={(e) => setNewCertification({ ...newCertification, issuing_organization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
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
                  Add Certification
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminCertifications;
