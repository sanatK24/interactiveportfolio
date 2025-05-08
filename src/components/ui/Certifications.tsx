import React from 'react';
import { motion } from 'framer-motion';
import { useCertifications } from '../../hooks/useCertifications';
import { formatMonth } from '../../utils/dateUtils';
import type { Database } from '../../types/supabase';

type CertificationsRow = Database['public']['Tables']['certifications']['Row'];
type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

type CertificationWithMedia = CertificationsRow & {
  media: MediaAttachment[];
};

const Certifications: React.FC = () => {
  const { certifications, loading, error } = useCertifications();

  if (loading) {
    return (
      <motion.div
        className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Certifications
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
          Certifications
        </h2>
        <p className="text-red-500 dark:text-red-400">Error loading certifications data: {error}</p>
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
        Certifications
      </h2>
      <div className="space-y-6">
        {certifications.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + certifications.indexOf(cert) * 0.1, duration: 0.6 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{cert.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatMonth(cert.issue_month ?? 1)} {cert.issue_year} - 
                  {cert.expiration_year && cert.expiration_month ? 
                    `${formatMonth(cert.expiration_month)} ${cert.expiration_year}` : 
                    'Valid indefinitely'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Issued by: {cert.issuing_organization}</p>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Credential
                  </a>
                )}
                {cert.skills && cert.skills.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {cert.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(cert as CertificationWithMedia).media && (cert as CertificationWithMedia).media.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Supporting Documents:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(cert as CertificationWithMedia).media.map((media: MediaAttachment, index: number) => (
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

export default Certifications;
