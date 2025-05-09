{{ ... }}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import type { Database } from '../../types/supabase';
import { useBlogPosts } from '../../hooks/useBlogPosts';

const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};

const BlogPosts: React.FC = () => {
  const { blogPosts, loading, error } = useBlogPosts();
  const [selectedPost, setSelectedPost] = useState<Database['public']['Tables']['blog_posts']['Row'] | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Use the hook
  useBodyScrollLock(!!selectedPost || !!selectedImage);

  // Handle image click
  const handleImageClick = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentImageIndex(index);
  };

  // Handle close lightbox
  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  // Handle next/previous image
  const handleImageNavigation = (direction: 'next' | 'prev') => {
    if (!selectedPost?.blog_photos) return;
    
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % selectedPost.blog_photos.length
      : (currentImageIndex - 1 + selectedPost.blog_photos.length) % selectedPost.blog_photos.length;
    
    setSelectedImage(selectedPost.blog_photos[newIndex]);
    setCurrentImageIndex(newIndex);
  };

  // ... rest of the component
{{ ... }}

                  {/* Blog Photos */}
                  {selectedPost.blog_photos && selectedPost.blog_photos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Blog Photos
                      </h3>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-3">
                        {selectedPost.blog_photos.map((url: string, index: number) => (
                          <div key={index} className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(url, index)}>
                            <img
                              src={url}
                              alt={`Blog photo ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <span className="text-white">Click to view full size</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lightbox */}
                  {selectedImage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                      onClick={handleCloseLightbox}
                    >
                      <div
                        className="relative max-w-6xl max-h-[90vh] mx-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleImageNavigation('prev')}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCloseLightbox}
                          className="absolute top-4 right-4 text-white hover:text-gray-300"
                        >
                          <X className="w-8 h-8" />
                        </button>
                        <img
                          src={selectedImage}
                          alt={`Blog photo ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                          {currentImageIndex + 1} / {selectedPost?.blog_photos?.length}
                        </div>
                      </div>
                    </motion.div>
                  )}
{{ ... }}
