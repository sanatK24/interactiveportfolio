import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Database } from '../../types/supabase';
import { formatMonth } from '../../utils/dateUtils';
import { useCertifications } from '../../hooks/useCertifications';

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

const CERTIFICATE_CATEGORIES = [
  'Hackathons',
  'Certifications',
  'Awards',
  'Projects',
  'Publications',
] as const;

type CertificateCategory = typeof CERTIFICATE_CATEGORIES[number];

const Certifications: React.FC = () => {
  const { certifications, loading, error } = useCertifications();
  const [selectedCategory, setSelectedCategory] = useState<null | CertificateCategory>(null);
  const [selectedCertification, setSelectedCertification] = useState<Database['public']['Tables']['certifications']['Row'] | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Use the hook
  useBodyScrollLock(!!selectedCertification || !!selectedImage);

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
    if (!selectedCertification?.certificate_urls) return;
    
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % selectedCertification.certificate_urls.length
      : (currentImageIndex - 1 + selectedCertification.certificate_urls.length) % selectedCertification.certificate_urls.length;
    
    setSelectedImage(selectedCertification.certificate_urls[newIndex]);
    setCurrentImageIndex(newIndex);
  };

  const filteredCertifications = selectedCategory 
    ? certifications.filter(cert => cert.category === selectedCategory)
    : certifications;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-screen"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-screen"
      >
        <p className="text-red-500">{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Certifications
      </h2>

      <div className="flex gap-4 flex-wrap mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg ${
            !selectedCategory
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All
        </button>
        {CERTIFICATE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertifications.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative group cursor-pointer max-w-md"
            onClick={() => setSelectedCertification(cert)}
          >
            <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 p-4">
                {cert.organization_logo_url && (
                  <div className="relative w-16 h-16">
                    <img
                      src={cert.organization_logo_url}
                      alt={cert.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {cert.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatMonth(cert.issue_month)} {cert.issue_year}</span>
                    <span className="text-gray-400">•</span>
                    <span>{cert.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCertification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedCertification(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto z-50"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedCertification(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  {selectedCertification.organization_logo_url && (
                    <div className="relative w-16 h-16">
                      <img
                        src={selectedCertification.organization_logo_url}
                        alt={selectedCertification.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedCertification.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatMonth(selectedCertification.issue_month)} {selectedCertification.issue_year}</span>
                      <span className="text-gray-400">•</span>
                      <span>{selectedCertification.category}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedCertification.certificate_urls && selectedCertification.certificate_urls.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Certificate Images
                      </h3>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-3">
                        {selectedCertification.certificate_urls.map((url: string, index: number) => (
                          <div key={index} className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(url, index)}>
                            <img
                              src={url}
                              alt={`Certificate ${index + 1}`}
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
              alt={`Certificate ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {selectedCertification?.certificate_urls?.length}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Certifications;
