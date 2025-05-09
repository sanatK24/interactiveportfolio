import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import type { Database } from '../../types/supabase';
import { formatMonth } from '../../utils/dateUtils';
import { useExperience } from '../../hooks/useExperience';

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

const Experience: React.FC = () => {
  const { experience, loading, error } = useExperience();
  const [selectedExperience, setSelectedExperience] = useState<Database['public']['Tables']['experience']['Row'] | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Use the hook
  useBodyScrollLock(!!selectedExperience || !!selectedImage);

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
    if (!selectedExperience?.experience_photos) return;
    
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % selectedExperience.experience_photos.length
      : (currentImageIndex - 1 + selectedExperience.experience_photos.length) % selectedExperience.experience_photos.length;
    
    setSelectedImage(selectedExperience.experience_photos[newIndex]);
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
          Experience
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
          Experience
        </h2>
        <div className="text-red-600 dark:text-red-400">
          Error loading experience data: {String(error)}
        </div>
      </motion.div>
    );
  }

  if (!experience || experience.length === 0) {
    return (
      <motion.div
        className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Experience
        </h2>
        <div className="text-gray-500 dark:text-gray-400">
          No experience entries found.
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Experience
      </h2>
      <div className="space-y-6">
        {experience.map((exp) => (
          <motion.div
            key={exp.experience_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative group cursor-pointer max-w-md"
            onClick={() => setSelectedExperience(exp)}
          >
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 p-4">
                {exp.company_logo_url && (
                  <div className="relative w-10 h-10">
                    <img
                      src={exp.company_logo_url}
                      alt={exp.company_name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {exp.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{exp.company_name}</span>
                    <span className="text-gray-400">•</span>
                    <span>{formatMonth(exp.start_month)} {exp.start_year}</span>
                    <span className="text-gray-400">-</span>
                    <span>
                      {exp.end_month && exp.end_year 
                        ? `${formatMonth(exp.end_month)} ${exp.end_year}`
                        : 'Present'}
                    </span>
                  </div>
                  {exp.employment_type && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {exp.employment_type}
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
        {selectedExperience && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedExperience(null);
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
                  onClick={() => setSelectedExperience(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  {selectedExperience.company_logo_url && (
                    <div className="relative w-16 h-16">
                      <img
                        src={selectedExperience.company_logo_url}
                        alt={selectedExperience.company_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedExperience.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{selectedExperience.company_name}</span>
                      <span className="text-gray-400">•</span>
                      <span>{formatMonth(selectedExperience.start_month)} {selectedExperience.start_year}</span>
                      <span className="text-gray-400">-</span>
                      <span>
                        {selectedExperience.end_month && selectedExperience.end_year 
                          ? `${formatMonth(selectedExperience.end_month)} ${selectedExperience.end_year}`
                          : 'Present'}
                      </span>
                    </div>
                    {selectedExperience.employment_type && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedExperience.employment_type}
                      </p>
                    )}
                  </div>
                </div>

                {selectedExperience.location && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="font-medium">Location:</span> {selectedExperience.location}
                  </div>
                )}

                {selectedExperience.description && (
                  <div className="text-gray-700 dark:text-gray-300 mb-6">
                    {selectedExperience.description}
                  </div>
                )}

                {selectedExperience.skills_used && selectedExperience.skills_used.length > 0 && (
                  <div className="mb-6">
                    <span className="font-medium block mb-2">Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedExperience.skills_used.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExperience.experience_photos && selectedExperience.experience_photos.length > 0 && (
                  <div className="mb-6">
                    <span className="font-medium block mb-2">Related Photos:</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedExperience.experience_photos.map((url, index) => (
                        <div
                          key={index}
                          className="relative group"
                          onClick={() => handleImageClick(url, index)}
                        >
                          <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                            <ChevronRight className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            onClick={handleCloseLightbox}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto z-50"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleCloseLightbox}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    disabled={currentImageIndex === 0}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {currentImageIndex + 1} of {selectedExperience?.experience_photos?.length || 0}
                  </span>
                  <button
                    onClick={() => handleImageNavigation('next')}
                    disabled={currentImageIndex === (selectedExperience?.experience_photos?.length || 0) - 1}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="relative aspect-video">
                  <img
                    src={selectedImage}
                    alt={`Photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Experience;
