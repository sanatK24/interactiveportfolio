import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Tables = Database['public']['Tables'];
type CertificationsRow = Tables['certifications']['Row'];

export const useCertifications = () => {
  // Using centralized supabase client
  const [certifications, setCertifications] = useState<CertificationsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
            // Convert certificate image paths to URLs
            const certificateImages = cert.certificate_images?.map((imagePath: string) => {
              if (!imagePath) return null;
              // Assuming the paths are relative to the certifications bucket
              return supabase.storage.from('certifications').getPublicUrl(imagePath).data.publicUrl;
            }).filter((url: string | null): url is string => url !== null) || [];

            // Convert organization logo path to URL
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching certifications:', error);
        setError('Failed to fetch certifications');
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [supabase]);

  return { certifications, loading, error };
};

export default useCertifications;
