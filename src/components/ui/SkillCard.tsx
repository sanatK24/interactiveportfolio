import React from 'react';
import { motion } from 'framer-motion';
import { Skill } from '../../types';
import { StarIcon } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  const proficiencyColor = {
    1: 'bg-red-200 dark:bg-red-900',
    2: 'bg-orange-200 dark:bg-orange-900',
    3: 'bg-yellow-200 dark:bg-yellow-900',
    4: 'bg-green-200 dark:bg-green-900',
    5: 'bg-blue-200 dark:bg-blue-900',
  }[skill.proficiency] || 'bg-gray-200 dark:bg-gray-800';

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center transition-colors duration-300"
    >
      <div className="text-blue-600 dark:text-blue-400 mb-4">{skill.icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{skill.name}</h3>
      <span className="text-sm text-gray-600 dark:text-gray-300 mb-3">{skill.category}</span>
      
      <div className="flex items-center space-x-1 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            size={16}
            className={i < skill.proficiency 
              ? "text-yellow-500 fill-yellow-500" 
              : "text-gray-300 dark:text-gray-600"
            }
          />
        ))}
      </div>
      
      <div className={`w-full h-1 mt-4 rounded-full ${proficiencyColor}`}></div>
    </motion.div>
  );
};

export default SkillCard;