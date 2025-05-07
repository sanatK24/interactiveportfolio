import React from 'react';
import { motion } from 'framer-motion';
import DraggableCard from '../ui/DraggableCard';
import { User } from 'lucide-react';

const AboutCard: React.FC = () => {
  const constraintsRef = React.useRef(null);

  return (
    <div ref={constraintsRef} className="h-full w-full flex items-center justify-center">
      <DraggableCard 
        className="w-full max-w-md"
        dragConstraints={constraintsRef}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">About Me</h2>
            <motion.div
              whileHover={{ rotate: 20 }}
              className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400"
            >
              <User size={24} />
            </motion.div>
          </div>
          
          <div className="prose dark:prose-invert prose-blue">
            <p className="text-gray-700 dark:text-gray-300">
              I'm a Computer Engineering student passionate about creating interactive web experiences 
              that blend beautiful design with powerful functionality.
            </p>
            
            <p className="text-gray-700 dark:text-gray-300">
            My focus areas include front-end development, UI/UX design, and have a keen interest in data analysis. 
            I have a passion for exploring emerging technologies that enhance user experiences and unlock insights from data.
            </p>
            
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              <span className="font-semibold">Drag this card around!</span> This portfolio 
              showcases my skills through interactive elements like this one.
            </p>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Node.js', 'UI/UX', 'Data Analysis'].map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </DraggableCard>
    </div>
  );
};

export default AboutCard;