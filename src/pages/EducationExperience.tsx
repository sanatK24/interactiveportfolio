import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Education from '../components/ui/Education';
import Experience from '../components/ui/Experience';

const EducationExperience: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'education' | 'experience'>('education');

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <motion.h1
            className="text-4xl font-bold text-gray-800 dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Education & Experience
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Explore my academic background and professional journey
          </motion.p>

          {/* Tab Navigation */}
          <div className="flex mb-8">
            <button
              onClick={() => setActiveTab('education')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'education'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } rounded-t-lg`}
            >
              Education
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'experience'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } rounded-t-lg`}
            >
              Experience
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-b-lg p-6">
            {activeTab === 'education' ? (
              <Education />
            ) : (
              <Experience />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationExperience;
