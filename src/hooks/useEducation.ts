import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type EducationRow = Database['public']['Tables']['education']['Row'];

type EducationWithMedia = EducationRow & {
  education_photos_urls?: string[];
  school_logo_url?: string | null;
};

export const useEducation = () => {
  // Using centralized supabase client
  const [education, setEducation] = useState<EducationWithMedia[]>([]);
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

        // Process each education entry to get file URLs
        const educationWithUrls = await Promise.all(
          educationData.map(async (edu) => {
            // Convert education photos URLs to display URLs
            const educationPhotos = edu.education_photos?.map((url: string) => {
              if (!url) return null;
              return url;
            }).filter((url: string | null): url is string => url !== null) || [];

            // Convert school logo URL to display URL
            const schoolLogo = edu.school_logo_url || null;

            return {
              ...edu,
              education_photos_urls: educationPhotos,
              school_logo_url: schoolLogo
            };
          })
        );

        setEducation(educationWithUrls);
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
