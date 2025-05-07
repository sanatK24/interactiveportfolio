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

export type SortOrder = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel('blog-posts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blog_posts',
      }, () => {
        fetchPosts();
      })
      .subscribe();

    setSubscription(channel);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortOrder]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      let sortedPosts = data || [];
      switch (sortOrder) {
        case 'newest':
          sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'oldest':
          sortedPosts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'title_asc':
          sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'title_desc':
          sortedPosts.sort((a, b) => b.title.localeCompare(a.title));
          break;
      }

      setPosts(sortedPosts);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError('Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading, error, sortOrder, setSortOrder };
}