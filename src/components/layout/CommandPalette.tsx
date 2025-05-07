import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Command as CommandIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ name: string; href: string }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const commands = [
    { name: 'Home', href: '/' },
    { name: 'Skills', href: '/skills' },
    { name: 'Blog', href: '/blog' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/contact' },
    { name: 'Admin Projects', href: '/admin/projects' },
    { name: 'Admin Blog', href: '/admin/blog' },
    { name: 'Admin Contact', href: '/admin/contact' },
  ];

  useEffect(() => {
    if (search === '') {
      setResults(commands);
    } else {
      setResults(commands.filter(cmd =>
        cmd.name.toLowerCase().includes(search.toLowerCase())
      ));
    }
  }, [search]);

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <CommandIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to navigate..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-400"
                />
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {results.map((cmd) => (
                <button
                  key={cmd.href}
                  onClick={() => handleSelect(cmd.href)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    location.pathname === cmd.href ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  {cmd.name}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
