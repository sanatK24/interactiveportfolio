import React from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '../../hooks/useExperience';
import type { Database } from '../../types/supabase';

type ExperienceRow = Database['public']['Tables']['experience']['Row'];
type MediaAttachment = Database['public']['Tables']['media_attachments']['Row'];

type ExperienceWithMedia = ExperienceRow & {
  media_attachments: MediaAttachment[];
};

const formatMonth = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

const Experience: React.FC = () => {
  const { experience, loading, error } = useExperience();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-48 h-4 bg-gray-200 rounded-full"></div>
              <div className="mt-2 w-32 h-4 bg-gray-200 rounded-full"></div>
              <div className="mt-2 w-48 h-4 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Experience</h1>
      <div className="space-y-4">
        {experience?.map((exp: ExperienceWithMedia) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{exp.title}</h3>
                <p className="text-gray-600">
                  {exp.company_name} • {exp.location}
                </p>
                <p className="text-gray-600">
                  {formatMonth(exp.start_month)} {exp.start_year} - 
                  {exp.end_month && exp.end_year ? 
                    `${formatMonth(exp.end_month)} ${exp.end_year}` : 
                    'Present'}
                </p>
                {exp.skills_used && exp.skills_used.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Skills:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {exp.skills_used.map((skill: string, skillIndex: number) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {exp.description && (
                  <div className="mt-2">
                    <span className="font-medium">Description:</span>
                    <div className="mt-1">
                      <p className="text-gray-600">{exp.description}</p>
                    </div>
                  </div>
                )}
                {exp.media_attachments && exp.media_attachments.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Supporting Documents:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {exp.media_attachments.map((media: MediaAttachment, mediaIndex: number) => (
                        <a
                          key={mediaIndex}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {media.title || media.description || `Document ${mediaIndex + 1}`}
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
    </div>
  );
};

export default Experience;
