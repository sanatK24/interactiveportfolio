import React from 'react';
import { motion } from 'framer-motion';
import type { Database } from '../../types/supabase';
import { formatMonth } from '../../utils/dateUtils';
import { useEducation } from '../../hooks/useEducation';

type EducationRow = Database['public']['Tables']['education']['Row'];
type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

type EducationWithMedia = EducationRow & {
  media: MediaAttachment[];
};

const Education: React.FC = () => {
  const { education, loading, error } = useEducation();

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
                <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                <div className="w-64 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
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
        <p className="text-red-500 dark:text-red-400">Error loading education data: {error}</p>
      </motion.div>
    );
  }

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
      <div className="space-y-6">
        {education.map((edu, index) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{edu.school}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatMonth(edu.start_month)} {edu.start_year} - 
                  {edu.end_month && edu.end_year ? 
                    `${formatMonth(edu.end_month)} ${edu.end_year}` : 
                    'Present'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{edu.field_of_study}</p>
                {edu.degree && (
                  <p className="text-gray-600 dark:text-gray-400">{edu.degree}</p>
                )}
                {edu.grade && (
                  <p className="text-gray-600 dark:text-gray-400">Grade: {edu.grade}</p>
                )}
                {edu.activities && (
                  <div className="mt-2">
                    <span className="font-medium">Activities:</span>
                    <div className="mt-1">
                      <p className="text-gray-600 dark:text-gray-400">{edu.activities}</p>
                    </div>
                  </div>
                )}
                {(edu as EducationWithMedia).media && (edu as EducationWithMedia).media.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Supporting Documents:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(edu as EducationWithMedia).media.map((media: MediaAttachment, index: number) => (
                        <a
                          key={index}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {media.title || media.description || `Document ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Education;
