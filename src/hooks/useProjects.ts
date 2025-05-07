import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Project {
  updated_at: string;
  technologies: string[];
  id: string;
  title: string;
  description: string;
  github_url: string;
  live_url: string;
  thumbnail_url: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('is_visible', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
}