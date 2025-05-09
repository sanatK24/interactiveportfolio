import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlogPosts } from '../hooks/useBlogPosts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { X } from 'lucide-react';
import { format } from 'date-fns';

// Read time calculation function
const calculateReadTime = (content: string, imageCount: number = 0): string => {
  const wordsPerMinute = 200;
  const baseTime = Math.ceil(content.trim().split(/\s+/).length / wordsPerMinute);
  
  // Adjust for markdown content
  const markdownAdjustment = content.includes('```') ? -0.5 : 0; // Reduce time for code blocks
  const imageAdjustment = imageCount * 0.5; // Add 30 seconds per image
  
  // Calculate final time
  const time = Math.max(1, Math.ceil(baseTime + markdownAdjustment + imageAdjustment));
  return `${time} min read`;
};

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_published: boolean | null;
  slug: string;
}

interface CustomImageProps {
  src: string;
  alt: string;
  className?: string;
}

const BlogPage: React.FC = () => {
  const { posts, loading, error, sortOrder, setSortOrder } = useBlogPosts();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const imageRef = useRef<HTMLImageElement>(null);

  // Function to count images in markdown content
  const countImagesInPost = (content: string): number => {
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    return (content.match(imageRegex) || []).length;
  };

  // Constants for pagination
  const POSTS_PER_PAGE = 10;

  const getCurrentPagePosts = (posts: BlogPost[]) => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return posts.slice(start, start + POSTS_PER_PAGE);
  };

  const groupPostsByMonth = (posts: BlogPost[]) => {
    const grouped: [string, BlogPost[]][] = [];
    const months = new Set<string>();

    posts.forEach(post => {
      if (post.created_at) {
        const date = new Date(post.created_at);
        const month = date.toLocaleString('default', { month: 'long' });
        months.add(month);
      }
    });

    Array.from(months).forEach(month => {
      const monthPosts = posts.filter(post => {
        if (!post.created_at) return false;
        const date = new Date(post.created_at);
        return date.toLocaleString('default', { month: 'long' }) === month;
      });
      if (monthPosts.length > 0) {
        grouped.push([month, monthPosts]);
      }
    });

    return grouped;
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const CustomImage: React.FC<CustomImageProps> = ({ src, alt, className = '' }) => {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} transition-transform duration-300 hover:scale-105 cursor-pointer`}
        onClick={() => {
          // Only open lightbox in preview modal
          if (selectedPost) {
            setSelectedImage(src);
          }
        }}
      />
    );
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

  const publishedPosts = posts.filter((post: BlogPost) => post.is_published === true);
  const totalPosts = publishedPosts.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const currentPagePosts = getCurrentPagePosts(publishedPosts);
  const groupedPosts = groupPostsByMonth(currentPagePosts);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <div className="flex gap-4 flex-wrap">
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
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            View as {viewMode === 'grid' ? 'List' : 'Grid'}
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="space-y-8">
          {groupedPosts.map(([month, posts]) => (
            <div key={month}>
              <div className="text-center mb-6">
                <div className="border-b-2 border-gray-200 dark:border-gray-700">
                  <span className="bg-white dark:bg-gray-800 px-4 py-1 text-gray-600 dark:text-gray-300">
                    {month}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow hover:shadow-lg cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="relative overflow-hidden">
                      {post.thumbnail_url && (
                        <CustomImage
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({ children }) => (
                            <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{children}</p>
                          ),
                        }}
                      >
                        {post.excerpt}
                      </ReactMarkdown>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{format(new Date(post.created_at!), 'MMM d, yyyy')}</span>
                        <span>{calculateReadTime(post.content, countImagesInPost(post.content))}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedPosts.map(([month, posts]) => (
            <div key={month}>
              <div className="text-center mb-6">
                <div className="border-b-2 border-gray-200 dark:border-gray-700">
                  <span className="bg-white dark:bg-gray-800 px-4 py-1 text-gray-600 dark:text-gray-300">
                    {month}
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-shadow hover:shadow-lg cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{post.title}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {calculateReadTime(post.content, countImagesInPost(post.content))}
                        </span>
                      </div>
                      {post.thumbnail_url && (
                        <CustomImage
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({ children }) => (
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">{children}</p>
                          ),
                        }}
                      >
                        {post.excerpt}
                      </ReactMarkdown>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(post.created_at!), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPosts > POSTS_PER_PAGE && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Blog Post Preview Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden max-w-4xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {selectedPost.title}
                  </h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedPost.thumbnail_url && (
                  <CustomImage
                    src={selectedPost.thumbnail_url}
                    alt={selectedPost.title}
                    className="w-full h-64 object-cover"
                  />
                )}

                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Published on {format(new Date(selectedPost.created_at!), 'MMM d, yyyy')} • {calculateReadTime(selectedPost.content, countImagesInPost(selectedPost.content))}
                    </div>

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {selectedPost.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      {selectedImage && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeImage}
        >
          <motion.img
            src={selectedImage}
            alt=""
            ref={imageRef}
            className="max-w-full max-h-[90vh] object-contain"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
};

export default BlogPage;
