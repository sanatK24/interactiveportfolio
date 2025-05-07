import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import BlogEditor from '../../components/admin/BlogEditor';
import { BlogPostForm } from '../../components/BlogPostForm';

enum SortOrder {
  Newest = 'newest',
  Oldest = 'oldest',
  TitleAsc = 'title_asc',
  TitleDesc = 'title_desc'
}

interface AdminBlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail_url: string | undefined;
  published_at: string | number | Date | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
};

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail_url: string;
  published_at: string | number | Date;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

const convertToBlogPost = (post: AdminBlogPost): BlogPost => ({
  ...post,
  published_at: post.published_at || '',
  thumbnail_url: post.thumbnail_url || '',
  excerpt: post.excerpt || '',
  content: post.content || ''
});

const AdminBlog: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const [blogPosts, setBlogPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Newest);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    fetchBlogPosts();
  }, [sortOrder]);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: sortOrder === SortOrder.Oldest });

      if (error) throw error;
      
      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      addToast({
        type: 'error',
        message: 'Failed to fetch blog posts'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewPostSuccess = () => {
    setShowNewPostForm(false);
    fetchBlogPosts();
    addToast({
      type: 'success',
      message: 'Blog post created successfully'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <button
          onClick={() => setShowNewPostForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          New Post
        </button>
      </div>

      {showNewPostForm && (
        <div className="mb-6">
          <BlogPostForm onSuccess={handleNewPostSuccess} />
        </div>
      )}

      <div className="space-y-4">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="px-3 py-2 border rounded-md"
        >
          <option value={SortOrder.Newest}>Newest First</option>
          <option value={SortOrder.Oldest}>Oldest First</option>
          <option value={SortOrder.TitleAsc}>Title A-Z</option>
          <option value={SortOrder.TitleDesc}>Title Z-A</option>
        </select>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {blogPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{post.title}</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setEditingPost(post);
                        setShowEditor(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this post?')) {
                          try {
                            const { error } = await supabase
                              .from('blog_posts')
                              .delete()
                              .eq('id', post.id);

                            if (error) throw error;

                            fetchBlogPosts();
                            addToast({
                              type: 'success',
                              message: 'Post deleted successfully'
                            });
                          } catch (error) {
                            console.error('Error deleting post:', error);
                            addToast({
                              type: 'error',
                              message: 'Failed to delete post'
                            });
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-gray-600">{post.excerpt}</p>

                {post.thumbnail_url && (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="mt-4 w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div className="mt-4 text-sm text-gray-500">
                  Created: {new Date(post.created_at).toLocaleDateString()}
                  {post.published_at && (
                    <span className="ml-4">
                      Published: {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showEditor && editingPost && (
        <BlogEditor
          post={convertToBlogPost(editingPost)}
          onClose={() => {
            setShowEditor(false);
            setEditingPost(null);
            fetchBlogPosts();
          }}
        />
      )}
    </div>
  );
};

export default AdminBlog;
