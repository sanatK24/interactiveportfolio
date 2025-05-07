import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import BlogEditor from '../../components/admin/BlogEditor';

enum SortOrder {
  Newest = 'newest',
  Oldest = 'oldest',
  TitleAsc = 'title_asc',
  TitleDesc = 'title_desc'
}

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
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Newest);

  useEffect(() => {
    fetchBlogPosts();
  }, [sortOrder]);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*');

      if (error) throw error;
      
      let sortedPosts = data || [];
      switch (sortOrder) {
        case SortOrder.Newest:
          sortedPosts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
          break;
        case SortOrder.Oldest:
          sortedPosts.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
          break;
        case SortOrder.TitleAsc:
          sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case SortOrder.TitleDesc:
          sortedPosts.sort((a, b) => b.title.localeCompare(a.title));
          break;
      }

      setBlogPosts(sortedPosts);
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

  const handleAddPost = () => {
    setShowEditor(true);
    setEditingPost(null);
  };

  const handleEditPost = (post: BlogPost) => {
    setShowEditor(true);
    setEditingPost(post);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">Blog Posts</h2>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value={SortOrder.Newest}>Newest First</option>
              <option value={SortOrder.Oldest}>Oldest First</option>
              <option value={SortOrder.TitleAsc}>Title A-Z</option>
              <option value={SortOrder.TitleDesc}>Title Z-A</option>
            </select>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={handleAddPost}
          >
            Add New Post
          </button>
        </div>
      </motion.div>

      {showEditor && (
        <BlogEditor
          post={editingPost}
          onClose={handleCloseEditor}
        />
      )}

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
                    onClick={() => handleEditPost(post)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
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
