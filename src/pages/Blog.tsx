import React from 'react';
import { motion } from 'framer-motion';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { supabase } from '../lib/supabase';

const BlogPage: React.FC = () => {
  const { posts, loading, error, sortOrder, setSortOrder } = useBlogPosts();

  const handlePublish = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: true })
        .eq('id', postId);
      
      if (error) throw error;
      // Refresh posts after publishing
      fetchPosts();
    } catch (err) {
      console.error('Error publishing post:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <div className="flex gap-4">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{post.title}</h2>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                {!post.is_published && (
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>

            {post.thumbnail_url && (
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            <div className="prose prose-lg max-w-none dark:prose-invert">
              {post.excerpt}
            </div>

            <div className="mt-4">
              <a
                href={`/blog/${post.id}`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Read more →
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
function fetchPosts() {
  throw new Error('Function not implemented.');
}

