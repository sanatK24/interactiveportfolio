import React from 'react';
import { motion } from 'framer-motion';
import { useToast } from './ToastContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const toastColors: Record<ToastType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const toastIcons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-xs">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          className={`flex items-center p-4 mb-2 rounded-lg shadow-lg ${toastColors[toast.type]}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <span className="mr-2 text-white">{toastIcons[toast.type]}</span>
          <span className="text-white">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto text-white hover:text-gray-200"
          >
            ×
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default Toast;
