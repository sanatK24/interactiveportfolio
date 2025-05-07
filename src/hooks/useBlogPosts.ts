import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface BlogPost {
  thumbnail_url: string | undefined;
  updated_at: string;
  excerpt: ReactNode;
  published_at: string | number | Date;
  id: string;
  title: string;
  content: string;
  slug: string;
  is_published: boolean;
  created_at: string;
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to fetch blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return { posts, loading, error };
}