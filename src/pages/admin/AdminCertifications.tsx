import React, { useState, useEffect } from 'react';
import type { Database } from '../../types/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { formatMonth } from '../../utils/dateUtils';
import { useFileUpload } from '../../hooks/useFileUpload';
import { supabase } from '../../context/AuthContext';

// Extend the Supabase types to include our computed fields
type EnhancedCertificationRow = Database['public']['Tables']['certifications']['Row'] & {
  certificate_images?: string[];
  organization_logo?: string | null;
};

type EnhancedCertificationInsert = Database['public']['Tables']['certifications']['Insert'] & {
  certificate_images?: string[];
  organization_logo?: string | null;
};

type CertificateCategory = 'Hackathons' | 'Workshops' | 'Bootcamps' | 'Internships' | 'Certifications';

const AdminCertifications: React.FC = () => {
  const { addToast } = useToast();
  const { uploadFile } = useFileUpload();
  const [certifications, setCertifications] = useState<EnhancedCertificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCertification, setNewCertification] = useState<EnhancedCertificationInsert>({
    name: '',
    issuing_organization: '',
    issue_year: new Date().getFullYear(),
    issue_month: new Date().getMonth() + 1,
    expiration_year: null,
    expiration_month: null,
    credential_url: null,
    skills: [],
    certificate_original_names: [],
    certificate_urls: [],
    organization_logo_original_name: null,
    organization_logo_url: null,
    category: 'Certifications' // Default category
  });

  const [selectedCertificateImages, setSelectedCertificateImages] = useState<string[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [selectedOrganizationLogo, setSelectedOrganizationLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [editingCertification, setEditingCertification] = useState<string | null>(null);
  const [editedCertification, setEditedCertification] = useState<EnhancedCertificationInsert | null>(null);

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
          // Convert certificate URLs to display URLs
          const certificateImages = cert.certificate_urls?.map((url: string) => {
            if (!url) return null;
            return url;
          }).filter((url: string | null): url is string => url !== null) || [];

          // Convert organization logo URL to display URL
          const organizationLogo = cert.organization_logo_url || null;

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
          const result = await uploadFile(file, 'certifications');
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
        const result = await uploadFile(logoFile, 'certifications');
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
          certificate_urls: certificateImageIds,
          certificate_original_names: certificateImageIds.map(url => url.split('/').pop() || ''),
          organization_logo_url: organizationLogoId,
          organization_logo_original_name: organizationLogoId ? organizationLogoId.split('/').pop() : null,
          category: newCertification.category
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
        certificate_original_names: [],
        certificate_urls: [],
        organization_logo_original_name: null,
        organization_logo_url: null,
        category: 'Certifications'
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

  const handleEditCertification = async (cert: EnhancedCertificationRow) => {
    try {
      setLoading(true);
      setError(null);

      // Set the certification to edit
      setEditingCertification(cert.id);
      setEditedCertification({
        name: cert.name,
        issuing_organization: cert.issuing_organization,
        issue_year: cert.issue_year,
        issue_month: cert.issue_month,
        expiration_year: cert.expiration_year || null,
        expiration_month: cert.expiration_month || null,
        credential_url: cert.credential_url || null,
        skills: cert.skills || [],
        certificate_original_names: [],
        certificate_urls: [],
        organization_logo_original_name: null,
        organization_logo_url: null,
        category: cert.category || 'Certifications'
      } as EnhancedCertificationInsert);

      // Show the modal
      setShowAddModal(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        message: `Failed to edit certification: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedCertification || !editingCertification) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!editedCertification.name.trim()) {
        throw new Error('Certification name is required');
      }
      if (!editedCertification.issuing_organization.trim()) {
        throw new Error('Issuing organization is required');
      }
      if (!editedCertification.issue_year || editedCertification.issue_year < 1900) {
        throw new Error('Valid issue year is required');
      }
      if (!editedCertification.issue_month || editedCertification.issue_month < 1 || editedCertification.issue_month > 12) {
        throw new Error('Valid issue month is required');
      }

      // Upload certificate images
      const certificateImageIds: string[] = [];
      if (certificateFiles.length > 0) {
        for (const file of certificateFiles) {
          const result = await uploadFile(file, 'certifications');
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
        const result = await uploadFile(logoFile, 'certifications');
        if (result.error) {
          throw new Error(`Failed to upload organization logo: ${result.error.message}`);
        }
        if (result.url) {
          organizationLogoId = result.url;
        }
      }

      // Prepare skills array
      const skills = editedCertification.skills ? editedCertification.skills.map(skill => skill.trim()) : [];

      // Update certification
      const { error: updateError } = await supabase
        .from('certifications')
        .update({
          name: editedCertification.name.trim(),
          issuing_organization: editedCertification.issuing_organization.trim(),
          issue_year: editedCertification.issue_year,
          issue_month: editedCertification.issue_month,
          expiration_year: editedCertification.expiration_year || null,
          expiration_month: editedCertification.expiration_month || null,
          credential_url: editedCertification.credential_url || null,
          skills,
          certificate_urls: certificateImageIds.length > 0 ? certificateImageIds : undefined,
          certificate_original_names: certificateImageIds.length > 0 ? certificateImageIds.map(url => url.split('/').pop() || '') : undefined,
          organization_logo_url: organizationLogoId || undefined,
          organization_logo_original_name: organizationLogoId ? organizationLogoId.split('/').pop() : undefined,
          category: editedCertification.category
        })
        .eq('id', editingCertification);

      if (updateError) {
        throw updateError;
      }

      addToast({
        type: 'success',
        message: 'Certification updated successfully'
      });

      // Reset form state
      setShowAddModal(false);
      setEditingCertification(null);
      setEditedCertification(null);
      setNewCertification({
        name: '',
        issuing_organization: '',
        issue_year: new Date().getFullYear(),
        issue_month: new Date().getMonth() + 1,
        expiration_year: null,
        expiration_month: null,
        credential_url: null,
        skills: [],
        certificate_original_names: [],
        certificate_urls: [],
        organization_logo_original_name: null,
        organization_logo_url: null,
        category: 'Certifications'
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
        message: `Failed to update certification: ${errorMessage}`
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
            <h3 className="text-xl font-bold mb-4">{editingCertification ? 'Edit Certification' : 'Add Certification'}</h3>
            <form onSubmit={editingCertification ? handleUpdateCertification : handleAddCertification} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={editingCertification ? editedCertification?.category || 'Certifications' : newCertification.category}
                    onChange={(e) => {
                      if (editingCertification) {
                        setEditedCertification(prev => prev && {
                          ...prev,
                          category: e.target.value as CertificateCategory
                        });
                      } else {
                        setNewCertification(prev => ({
                          ...prev,
                          category: e.target.value as CertificateCategory
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Hackathons">Hackathons</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Bootcamps">Bootcamps</option>
                    <option value="Internships">Internships</option>
                    <option value="Certifications">Certifications</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editingCertification ? editedCertification?.name || '' : newCertification.name}
                    onChange={(e) => {
                      if (editingCertification) {
                        setEditedCertification(prev => prev && {
                          ...prev,
                          name: e.target.value
                        });
                      } else {
                        setNewCertification(prev => ({
                          ...prev,
                          name: e.target.value
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
                  <label className="block text-sm font-medium mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    value={editingCertification ? editedCertification?.issuing_organization || '' : newCertification.issuing_organization}
                    onChange={(e) => {
                      if (editingCertification) {
                        setEditedCertification(prev => prev && {
                          ...prev,
                          issuing_organization: e.target.value
                        });
                      } else {
                        setNewCertification(prev => ({
                          ...prev,
                          issuing_organization: e.target.value
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Date</label>
                  <div className="flex gap-2">
                    <select
                      value={editingCertification ? editedCertification?.issue_month || new Date().getMonth() + 1 : newCertification.issue_month}
                      onChange={(e) => {
                        if (editingCertification) {
                          setEditedCertification(prev => prev && {
                            ...prev,
                            issue_month: parseInt(e.target.value)
                          });
                        } else {
                          setNewCertification(prev => ({
                            ...prev,
                            issue_month: parseInt(e.target.value)
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
                      value={editingCertification ? editedCertification?.issue_year || new Date().getFullYear() : newCertification.issue_year}
                      onChange={(e) => {
                        if (editingCertification) {
                          setEditedCertification(prev => prev && {
                            ...prev,
                            issue_year: parseInt(e.target.value)
                          });
                        } else {
                          setNewCertification(prev => ({
                            ...prev,
                            issue_year: parseInt(e.target.value)
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiration Date (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      value={editingCertification ? editedCertification?.expiration_month || '' : newCertification.expiration_month || ''}
                      onChange={(e) => {
                        if (editingCertification) {
                          setEditedCertification(prev => prev && {
                            ...prev,
                            expiration_month: e.target.value ? parseInt(e.target.value) : null
                          });
                        } else {
                          setNewCertification(prev => ({
                            ...prev,
                            expiration_month: e.target.value ? parseInt(e.target.value) : null
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
                      value={editingCertification ? editedCertification?.expiration_year || '' : newCertification.expiration_year || ''}
                      onChange={(e) => {
                        if (editingCertification) {
                          setEditedCertification(prev => prev && {
                            ...prev,
                            expiration_year: e.target.value ? parseInt(e.target.value) : null
                          });
                        } else {
                          setNewCertification(prev => ({
                            ...prev,
                            expiration_year: e.target.value ? parseInt(e.target.value) : null
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
                <div>
                  <label className="block text-sm font-medium mb-1">Credential URL (Optional)</label>
                  <input
                    type="url"
                    value={editingCertification ? editedCertification?.credential_url || '' : newCertification.credential_url || ''}
                    onChange={(e) => {
                      if (editingCertification) {
                        setEditedCertification(prev => prev && {
                          ...prev,
                          credential_url: e.target.value || null
                        });
                      } else {
                        setNewCertification(prev => ({
                          ...prev,
                          credential_url: e.target.value || null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                    placeholder="https://example.com/certification"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={editingCertification ? editedCertification?.skills?.join(', ') || '' : newCertification.skills?.join(', ') || ''}
                    onChange={(e) => {
                      const skills = e.target.value.split(',').map(skill => skill.trim());
                      if (editingCertification) {
                        setEditedCertification(prev => prev && {
                          ...prev,
                          skills: skills.length > 0 ? skills : null
                        });
                      } else {
                        setNewCertification(prev => ({
                          ...prev,
                          skills: skills.length > 0 ? skills : null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      certificate_original_names: [],
                      certificate_urls: [],
                      organization_logo_original_name: null,
                      organization_logo_url: null,
                      category: 'Certifications'
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
                  {loading ? (editingCertification ? 'Updating...' : 'Adding...') : (editingCertification ? 'Update Certification' : 'Add Certification')}
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
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Credential
                  </a>
                )}
                {cert.certificate_images && cert.certificate_images.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Certificate Images</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {cert.certificate_images.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Certificate ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {cert.organization_logo && (
                  <div className="mt-4">
                    <h4 className="font-medium">Organization Logo</h4>
                    <img
                      src={cert.organization_logo}
                      alt={`${cert.issuing_organization} Logo`}
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditCertification(cert)}
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
