import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TechBubble {
  name: string;
  color: string;
  size: number;
  position: { x: number; y: number };
}

const TechBubbles: React.FC = () => {
  const [bubbles] = useState<TechBubble[]>([
    { name: 'React', color: '#61DAFB', size: 70, position: { x: -100, y: -50 } },
    { name: 'TypeScript', color: '#3178C6', size: 80, position: { x: 100, y: 80 } },
    { name: 'Node.js', color: '#68A063', size: 60, position: { x: 50, y: -80 } },
    { name: 'HTML5', color: '#E34F26', size: 50, position: { x: -80, y: 60 } },
    { name: 'CSS3', color: '#1572B6', size: 55, position: { x: 150, y: -30 } },
    { name: 'JavaScript', color: '#F7DF1E', size: 65, position: { x: -150, y: 0 } },
    { name: 'Git', color: '#F05032', size: 45, position: { x: 0, y: 100 } },
    { name: 'GitHub', color: '#333333', size: 40, position: { x: 100, y: 100 } },
    { name: 'Python', color: '#333333', size: 40, position: { x: -100, y: -100 } },
    { name: 'Data Analysis', color: '#333333', size: 40, position: { x: 100, y: -100 } },
  ]);

  return (
    <div className="relative h-[300px] w-full overflow-hidden">
      {bubbles.map((bubble, index) => (
        <motion.div
          key={bubble.name}
          className="absolute flex items-center justify-center rounded-full text-sm font-medium text-white cursor-grab active:cursor-grabbing"
          style={{
            backgroundColor: bubble.color,
            width: bubble.size,
            height: bubble.size,
            left: `calc(50% + ${bubble.position.x}px)`,
            top: `calc(50% + ${bubble.position.y}px)`,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            x: [0, 10, -10, 0],
            y: [0, -10, 10, 0],
          }}
          transition={{
            scale: { duration: 0.5, delay: index * 0.1 },
            x: { 
              repeat: Infinity,
              duration: 5 + index,
              ease: "easeInOut"
            },
            y: { 
              repeat: Infinity,
              duration: 6 + index,
              ease: "easeInOut"
            }
          }}
          drag
          dragConstraints={{ left: -200, right: 200, top: -150, bottom: 150 }}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 10 }}
          whileDrag={{ scale: 1.1, zIndex: 10 }}
        >
          {bubble.name}
        </motion.div>
      ))}
    </div>
  );
};

export default TechBubbles;