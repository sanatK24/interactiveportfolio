import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import type { Database } from '../../types/supabase';
import { formatMonth } from '../../utils/dateUtils';
import { useEducation } from '../../hooks/useEducation';

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

const Education: React.FC = () => {
  const { education, loading, error } = useEducation();
  const [selectedEducation, setSelectedEducation] = useState<Database['public']['Tables']['education']['Row'] | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Use the hook
  useBodyScrollLock(!!selectedEducation || !!selectedImage);

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
    if (!selectedEducation?.education_photos) return;
    
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % selectedEducation.education_photos.length
      : (currentImageIndex - 1 + selectedEducation.education_photos.length) % selectedEducation.education_photos.length;
    
    setSelectedImage(selectedEducation.education_photos[newIndex]);
    setCurrentImageIndex(newIndex);
  };

  if (loading) {
    return (
      <motion.div
        className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Education
        </h2>
        <div className="animate-pulse">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Education
        </h2>
        <div className="text-red-600 dark:text-red-400">
          Error loading education data: {error}
        </div>
      </motion.div>
    );
  }

  if (!education || education.length === 0) {
    return (
      <motion.div
        className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Education
        </h2>
        <div className="text-gray-500 dark:text-gray-400">
          No education entries found.
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Education
      </h2>
      <div className="space-y-6">
        {education.map((edu) => (
          <motion.div
            key={edu.education_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative group cursor-pointer max-w-md"
            onClick={() => setSelectedEducation(edu)}
          >
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 p-4">
                {edu.school_logo_url && (
                  <div className="relative w-10 h-10">
                    <img
                      src={edu.school_logo_url}
                      alt={edu.school}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {edu.school}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatMonth(edu.start_month)} {edu.start_year}</span>
                    <span className="text-gray-400">•</span>
                    <span>{edu.field_of_study}</span>
                  </div>
                  {edu.degree && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {edu.degree}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedEducation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedEducation(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto z-50"
              style={{ marginTop: '64px' }}
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedEducation(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  {selectedEducation.school_logo_url && (
                    <div className="relative w-16 h-16">
                      <img
                        src={selectedEducation.school_logo_url}
                        alt={selectedEducation.school}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedEducation.school}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatMonth(selectedEducation.start_month)} {selectedEducation.start_year}</span>
                      <span className="text-gray-400">•</span>
                      <span>{selectedEducation.field_of_study}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Degree and Grade */}
                  {selectedEducation.degree && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Degree:</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {selectedEducation.degree}
                      </span>
                    </div>
                  )}
                  {selectedEducation.grade && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Grade:</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {selectedEducation.grade}
                      </span>
                    </div>
                  )}

                  {/* Activities */}
                  {selectedEducation.activities && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Activities
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                        {selectedEducation.activities}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEducation.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                        {selectedEducation.description}
                      </p>
                    </div>
                  )}

                  {/* Education Photos */}
                  {selectedEducation.education_photos && selectedEducation.education_photos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Education Photos
                      </h3>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-3">
                        {selectedEducation.education_photos.map((url: string, index: number) => (
                          <div key={index} className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(url, index)}>
                            <img
                              src={url}
                              alt={`Education photo ${index + 1}`}
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
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              alt={`Education photo ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {selectedEducation?.education_photos?.length}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Education;
