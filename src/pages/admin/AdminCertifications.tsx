import React, { useState, useEffect } from 'react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';
import { useFileUpload } from '../../hooks/useFileUpload';
import { supabase } from '../../context/AuthContext';

type CertificationsRow = Database['public']['Tables']['certifications']['Row'];
type CertificationsInsert = Database['public']['Tables']['certifications']['Insert'];

const AdminCertifications: React.FC = () => {
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload();
  const [certifications, setCertifications] = useState<CertificationsRow[]>([]);
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
    credential_url: null,
    skills: [],
    certificate_images: [],
    organization_logo: null
  });

  const [selectedCertificateImages, setSelectedCertificateImages] = useState<string[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [selectedOrganizationLogo, setSelectedOrganizationLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create query
      const query = supabase.from('certifications').select('*');

      // Add ordering
      query.order('issue_year', { ascending: false });
      query.order('issue_month', { ascending: false });

      // Execute query
      const { data: certificationsData, error: certificationsError } = await query;

      if (certificationsError) throw certificationsError;

      // Process each certification to get file URLs
      const certificationsWithUrls = await Promise.all(
        certificationsData.map(async (cert) => {
          // Convert certificate image UUIDs to URLs
          const certificateImages = cert.certificate_images?.map((imageId: string) => {
            if (!imageId) return null;
            return supabase.storage.from('certificates').getPublicUrl(imageId).data.publicUrl;
          }).filter((url: string | null): url is string => url !== null) || [];

          // Convert organization logo UUID to URL
          const organizationLogo = cert.organization_logo 
            ? supabase.storage.from('certifications').getPublicUrl(cert.organization_logo).data.publicUrl
            : null;

          return {
            ...cert,
            certificate_images: certificateImages,
            organization_logo: organizationLogo
          };
        })
      );

      setCertifications(certificationsWithUrls);
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
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!newCertification.name.trim()) {
        throw new Error('Certification name is required');
      }
      if (!newCertification.issuing_organization.trim()) {
        throw new Error('Issuing organization is required');
      }
      if (!newCertification.issue_year || newCertification.issue_year < 1900) {
        throw new Error('Valid issue year is required');
      }
      if (!newCertification.issue_month || newCertification.issue_month < 1 || newCertification.issue_month > 12) {
        throw new Error('Valid issue month is required');
      }

      // Upload certificate images
      const certificateImageIds: string[] = [];
      if (certificateFiles.length > 0) {
        for (const file of certificateFiles) {
          const result = await uploadFile(file, 'certificates');
          if (result.error) {
            throw new Error(`Failed to upload certificate image: ${result.error.message}`);
          }
          if (result.url) {
            certificateImageIds.push(result.url);
          }
        }
      }

      // Upload organization logo
      let organizationLogoId: string | null = null;
      if (logoFile) {
        const result = await uploadFile(logoFile, 'certificates');
        if (result.error) {
          throw new Error(`Failed to upload organization logo: ${result.error.message}`);
        }
        if (result.url) {
          organizationLogoId = result.url;
        }
      }

      // Prepare skills array
      const skills = newCertification.skills ? newCertification.skills.map(skill => skill.trim()) : [];

      // Insert certification
      const { error: insertError } = await supabase
        .from('certifications')
        .insert([{
          name: newCertification.name.trim(),
          issuing_organization: newCertification.issuing_organization.trim(),
          issue_year: newCertification.issue_year,
          issue_month: newCertification.issue_month,
          expiration_year: newCertification.expiration_year || null,
          expiration_month: newCertification.expiration_month || null,
          credential_url: newCertification.credential_url || null,
          skills,
          certificate_images: certificateImageIds,
          organization_logo: organizationLogoId
        }]);

      if (insertError) {
        throw insertError;
      }

      addToast({
        type: 'success',
        message: 'Certification added successfully'
      });

      // Reset form state
      setShowAddModal(false);
      setNewCertification({
        name: '',
        issuing_organization: '',
        issue_year: new Date().getFullYear(),
        issue_month: new Date().getMonth() + 1,
        expiration_year: null,
        expiration_month: null,
        credential_url: null,
        skills: [],
        certificate_images: [],
        organization_logo: null
      });
      setSelectedCertificateImages([]);
      setCertificateFiles([]);
      setSelectedOrganizationLogo(null);
      setLogoFile(null);
      
      // Refresh certifications list
      await fetchCertifications();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to add certification: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      // Delete the certification
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
        <h2 className="text-2xl font-bold">Certifications</h2>
        <p>‎ ‎ ‎‎ ‎  </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Certification
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
            <h3 className="text-xl font-bold mb-4">Add Certification</h3>
            <form onSubmit={handleAddCertification} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newCertification.name}
                    onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    value={newCertification.issuing_organization}
                    onChange={(e) => setNewCertification({ ...newCertification, issuing_organization: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Date</label>
                  <div className="flex gap-2">
                    <select
                      value={newCertification.issue_month}
                      onChange={(e) => setNewCertification({ ...newCertification, issue_month: parseInt(e.target.value) })}
                      className="w-1/2 p-2 border rounded"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {formatMonth(month)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newCertification.issue_year}
                      onChange={(e) => setNewCertification({ ...newCertification, issue_year: parseInt(e.target.value) })}
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
                  <label className="block text-sm font-medium mb-1">Expiration Date (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      value={newCertification.expiration_month || ''}
                      onChange={(e) => setNewCertification({ ...newCertification, expiration_month: e.target.value ? parseInt(e.target.value) : null })}
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
                      value={newCertification.expiration_year || ''}
                      onChange={(e) => setNewCertification({ ...newCertification, expiration_year: e.target.value ? parseInt(e.target.value) : null })}
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
                  <label className="block text-sm font-medium mb-1">Credential URL (Optional)</label>
                  <input
                    type="url"
                    value={newCertification.credential_url || ''}
                    onChange={(e) => setNewCertification({ ...newCertification, credential_url: e.target.value || null })}
                    className="w-full p-2 border rounded"
                    placeholder="https://example.com/certification"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={newCertification.skills ? newCertification.skills.join(', ') : ''}
                    onChange={(e) => {
                      const skills = e.target.value.split(',').map(skill => skill.trim());
                      setNewCertification({ ...newCertification, skills: skills.length > 0 ? skills : null });
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Certificate Images (up to 5)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 5);
                        const urls = files.map(file => URL.createObjectURL(file));
                        setCertificateFiles(files);
                        setSelectedCertificateImages(urls);
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {selectedCertificateImages.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {selectedCertificateImages.map((_, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          {certificateFiles[index]?.name || `Image ${index + 1}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setLogoFile(file);
                        setSelectedOrganizationLogo(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {selectedOrganizationLogo && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {logoFile?.name || 'Logo'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCertification({
                      name: '',
                      issuing_organization: '',
                      issue_year: new Date().getFullYear(),
                      issue_month: new Date().getMonth() + 1,
                      expiration_year: null,
                      expiration_month: null,
                      credential_url: null,
                      skills: [],
                      certificate_images: [],
                      organization_logo: null
                    });
                    setSelectedCertificateImages([]);
                    setCertificateFiles([]);
                    setSelectedOrganizationLogo(null);
                    setLogoFile(null);
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
                  {loading ? 'Adding...' : 'Add Certification'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
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
                {cert.certificate_images && cert.certificate_images.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Supporting Documents:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {cert.certificate_images.map((image: string, index: number) => (
                        <a
                          key={index}
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {image}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCertification(cert.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300"
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

export default AdminCertifications;
