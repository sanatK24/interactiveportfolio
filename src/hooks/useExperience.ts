import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

type ExperienceRow = Database['public']['Tables']['experience']['Row'];
type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

type ExperienceWithMedia = ExperienceRow & {
  media_attachments: MediaAttachment[];
};

export const useExperience = () => {
  const supabase = useSupabaseClient();
  const [experience, setExperience] = useState<ExperienceWithMedia[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: experienceData, error: experienceError } = await supabase
          .from('experience')
          .select(`
            *,
            media_attachments!inner(*)
          `)
          .order('start_year', { ascending: false })
          .order('start_month', { ascending: false });

        if (experienceError) throw experienceError;

        setExperience(experienceData as ExperienceWithMedia[]);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [supabase]);

  return { experience, loading, error };
};
