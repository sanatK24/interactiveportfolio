import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';

type BlogPost = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail_url: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

const AdminBlog: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to fetch blog posts',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBlogPost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addToast({
        type: 'success',
        message: 'Blog post deleted successfully',
      });
      fetchBlogPosts();
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to delete blog post',
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Blog Posts</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => window.location.href = '/admin-create'}
          >
            Add New Post
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <motion.div
              key={post.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{post.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteBlogPost(post.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Published: {new Date(post.published_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
