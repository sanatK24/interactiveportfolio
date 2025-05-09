import React, { useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { toast } from 'react-toastify';
import type { Database } from '../../types/supabase';
import { supabase } from '../../context/AuthContext';

type Certification = Database['public']['Tables']['certifications']['Row'];

interface CertificationFormData {
  name: string;
  issuing_organization: string;
  issue_month: number;
  issue_year: number;
  expiration_month: number | null;
  expiration_year: number | null;
  credential_url: string | null;
  skills: string[];
  certificate_urls: string[];
  certificate_original_names: string[];
  organization_logo_url: string | null;
  organization_logo_original_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CertificateFormProps {
  certification?: Certification | null;
  onClose: () => void;
  onUpdate: (certification: Certification) => void;
}

const CertificateForm: React.FC<CertificateFormProps> = ({ certification, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<CertificationFormData>({
    name: certification?.name || '',
    issuing_organization: certification?.issuing_organization || '',
    issue_month: certification?.issue_month || new Date().getMonth() + 1,
    issue_year: certification?.issue_year || new Date().getFullYear(),
    expiration_month: certification?.expiration_month || null,
    expiration_year: certification?.expiration_year || null,
    credential_url: certification?.credential_url || null,
    skills: certification?.skills || [],
    certificate_urls: certification?.certificate_urls || [],
    certificate_original_names: certification?.certificate_original_names || [],
    organization_logo_url: certification?.organization_logo_url || null,
    organization_logo_original_name: certification?.organization_logo_original_name || null,
    created_at: certification?.created_at || null,
    updated_at: certification?.updated_at || null
  });

  const { uploadFile } = useFileUpload();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'certificate_urls' | 'organization_logo_url') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file, 'certificates');
      if (result.error) {
        throw result.error;
      }
      
      const originalName = file.name;
      const url = result.url;
      
      if (field === 'certificate_urls') {
        setFormData(prev => ({
          ...prev,
          certificate_urls: [...(prev.certificate_urls || []), url].filter((u): u is string => u !== null),
          certificate_original_names: [...(prev.certificate_original_names || []), originalName]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          organization_logo_url: url,
          organization_logo_original_name: originalName
        }));
      }
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const certificationData = {
        name: formData.name,
        issuing_organization: formData.issuing_organization,
        issue_month: formData.issue_month,
        issue_year: formData.issue_year,
        expiration_month: formData.expiration_month,
        expiration_year: formData.expiration_year,
        credential_url: formData.credential_url,
        skills: formData.skills,
        certificate_urls: formData.certificate_urls,
        certificate_original_names: formData.certificate_original_names,
        organization_logo_url: formData.organization_logo_url,
        organization_logo_original_name: formData.organization_logo_original_name,
        created_at: formData.created_at || null,
        updated_at: new Date().toISOString()
      };

      if (certification) {
        const { error: updateError } = await supabase
          .from('certifications')
          .update(certificationData)
          .eq('id', certification.id);

        if (updateError) throw updateError;
        
        onUpdate({
          ...certification,
          ...certificationData
        });
      } else {
        const { error: insertError } = await supabase
          .from('certifications')
          .insert([certificationData]);

        if (insertError) throw insertError;

        const { data: createdCert } = await supabase
          .from('certifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!createdCert) throw new Error('Failed to fetch created certification');
        
        onUpdate(createdCert);
      }

      toast.success('Certification saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error('Failed to save certification');
    }
  };

  const handleSkillsChange = (skills: string[]) => {
    setFormData(prev => ({ ...prev, skills }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issuing Organization</label>
          <input
            type="text"
            value={formData.issuing_organization}
            onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Month</label>
            <select
              value={formData.issue_month}
              onChange={(e) => setFormData({ ...formData, issue_month: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Year</label>
            <input
              type="number"
              value={formData.issue_year}
              onChange={(e) => setFormData({ ...formData, issue_year: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiration Month</label>
            <select
              value={formData.expiration_month || ''}
              onChange={(e) => setFormData({ ...formData, expiration_month: e.target.value ? parseInt(e.target.value) : null })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="">None</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiration Year</label>
            <input
              type="number"
              value={formData.expiration_year || ''}
              onChange={(e) => setFormData({ ...formData, expiration_year: e.target.value ? parseInt(e.target.value) : null })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Credential URL</label>
          <input
            type="url"
            value={formData.credential_url || ''}
            onChange={(e) => setFormData({ ...formData, credential_url: e.target.value || null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
          <input
            type="text"
            value={formData.skills.join(', ')}
            onChange={(e) => handleSkillsChange(e.target.value.split(',').map(skill => skill.trim()))}
            placeholder="Enter skills separated by commas"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'organization_logo_url')}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-400 dark:file:text-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, 'certificate_urls')}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-400 dark:file:text-blue-100"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {certification ? 'Update' : 'Create'} Certificate
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificateForm as React.FC<CertificateFormProps>;
