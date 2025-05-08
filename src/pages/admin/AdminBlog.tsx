import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import BlogForm from '../../components/admin/BlogEditor';
import type { Database } from '../../types/supabase';
import { supabase } from '../../context/AuthContext';

type AdminBlogPost = Database['public']['Tables']['blog_posts']['Row'];

type BlogPost = Omit<AdminBlogPost, 'is_published'> & {
  is_published: boolean;
};

const convertToBlogPost = (post: AdminBlogPost): BlogPost => ({
  ...post,
  is_published: post.is_published ?? false,
  excerpt: post.excerpt || '',
  content: post.content || '',
  thumbnail_url: post.thumbnail_url || ''
});

const AdminBlog: React.FC = () => {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const convertedPosts = postsData.map(convertToBlogPost);
      setPosts(convertedPosts);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Failed to fetch posts: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setShowForm(true);
    setEditingPost(null);
  };

  const handleEditPost = (post: AdminBlogPost) => {
    setShowForm(true);
    setEditingPost(post);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  const handlePostUpdate = async (post: AdminBlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .upsert(post);

      if (error) throw error;

      addToast({
        type: 'success',
        message: 'Post saved successfully'
      });

      await fetchPosts();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Failed to save post: ${errorMessage}`
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      await fetchPosts();
      addToast({
        type: 'success',
        message: 'Post deleted successfully'
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      addToast({
        type: 'error',
        message: `Failed to delete post: ${errorMessage}`
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <button
          onClick={handleCreatePost}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Post
        </button>
      </div>

      {showForm && (
        <BlogForm
          post={editingPost}
          onClose={handleFormClose}
          onUpdate={handlePostUpdate}
        />
      )}

      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{post.title}</h2>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Created: {new Date(post.created_at || '').toLocaleDateString()}</span>
                    {post.is_published && (
                      <span className="ml-4">Published</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleEditPost(post)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-4 text-gray-600">{post.excerpt || 'No excerpt available'}</p>

              {post.thumbnail_url && (
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="mt-4 w-full h-48 object-cover rounded-lg"
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminBlog;
