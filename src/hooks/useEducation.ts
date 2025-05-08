import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

type EducationRow = Database['public']['Tables']['education']['Row'];
type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

export const useEducation = () => {
  const supabase = useSupabaseClient();
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEducation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch education data
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
      } finally {
        setLoading(false);
      }
    };

    fetchEducation();
  }, [supabase]);

  return { education, loading, error };
};
