import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

export type SortOrder = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

export function useBlogPosts() {
  // Using centralized supabase client
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const subscriptionRef = useRef<any>(null);

  const publishPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: true })
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Error publishing post:', error);
      throw error;
    }
  };

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

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortOrder]);

  // Function to generate a clean excerpt from content
  const generateExcerpt = (content: string): string => {
    // Remove HTML tags
    const text = content.replace(/<[^>]+>/g, '');
    // Remove markdown formatting
    const cleanText = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
    // Get first 150 characters
    const excerpt = cleanText.slice(0, 150);
    // Add ellipsis if truncated
    return excerpt.length === 150 ? `${excerpt}...` : excerpt;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = supabase.from('blog_posts').select('*');

      switch (sortOrder) {
        case 'newest':
          query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query.order('created_at', { ascending: true });
          break;
        case 'title_asc':
          query.order('title', { ascending: true });
          break;
        case 'title_desc':
          query.order('title', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Generate excerpts for posts that don't have one
      const postsWithExcerpts = data?.map(post => {
        if (!post.excerpt) {
          return {
            ...post,
            excerpt: generateExcerpt(post.content || '')
          };
        }
        return post;
      }) || [];

      setPosts(postsWithExcerpts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    error,
    sortOrder,
    setSortOrder,
    publishPost
  };
}