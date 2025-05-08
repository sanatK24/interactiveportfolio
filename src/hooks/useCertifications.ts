import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

type Tables = Database['public']['Tables'];
type CertificationsRow = Tables['certifications']['Row'];
type MediaAttachmentsRow = Tables['media_attachments']['Row'];

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

        // Fetch certifications data
        const { data: certificationsData, error: certificationsError } = await supabase
          .from('certifications')
          .select('*')
          .order('issue_year', { ascending: false })
          .order('issue_month', { ascending: false });

        if (certificationsError) throw certificationsError;

        // Fetch media files for each certification
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
              media: mediaData as MediaAttachmentsRow[]
            };
          })
        );

        setCertifications(certificationsWithMedia);
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
