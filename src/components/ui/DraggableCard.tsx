import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DraggableCardProps {
  children: ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  onDragEnd?: (position: { x: number; y: number }) => void;
  dragConstraints?: React.RefObject<HTMLElement> | boolean;
  dragElastic?: number;
  dragMomentum?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  children,
  className = '',
  initialPosition = { x: 0, y: 0 },
  onDragEnd,
  dragConstraints = true,
  dragElastic = 0.1,
  dragMomentum = true,
}) => {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden ${className}`}
      drag
      dragConstraints={typeof dragConstraints === 'boolean' ? (dragConstraints ? undefined : false) : dragConstraints}
      dragElastic={dragElastic}
      dragMomentum={dragMomentum}
      initial={{ x: initialPosition.x, y: initialPosition.y }}
      whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      onDragEnd={(event, info) => {
        if (onDragEnd) {
          onDragEnd({ x: info.point.x, y: info.point.y });
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default DraggableCard;