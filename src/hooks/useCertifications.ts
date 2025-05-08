import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

type Tables = Database['public']['Tables'];
type CertificationsRow = Tables['certifications']['Row'];

export const useCertifications = () => {
  const supabase = useSupabaseClient();
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
            // Convert certificate image UUIDs to URLs
            const certificateImages = cert.certificate_images?.map((imageId: string) => {
              if (!imageId) return null;
              return supabase.storage.from('certifications').getPublicUrl(imageId).data.publicUrl;
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
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [supabase]);

  return { certifications, loading, error };
};
