import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

type ExperienceRow = Database['public']['Tables']['experience']['Row'];

export const useExperience = () => {
  const supabase = useSupabaseClient();
  const [experience, setExperience] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: experienceData, error: experienceError } = await supabase
          .from('experience')
          .select('*')
          .order('start_year', { ascending: false })
          .order('start_month', { ascending: false });

        if (experienceError) throw experienceError;

        setExperience(experienceData);
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
