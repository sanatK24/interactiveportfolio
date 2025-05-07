import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon } from 'lucide-react';
import { useCommandPalette } from '../../context/CommandPaletteContext';

const CommandPalette: React.FC = () => {
  const { isOpen, closeCommandPalette, commands } = useCommandPalette();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on search term
  const filteredCommands = commands.filter(command => 
    command.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close with escape key and handle arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle command execution
  const executeCommand = (command: any) => {
    command.action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={closeCommandPalette}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center">
              <CommandIcon className="mr-2 text-gray-500 dark:text-gray-400" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands..."
                className="w-full bg-transparent border-none outline-none text-gray-800 dark:text-white"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIndex(0);
                }}
              />
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <Search className="mx-auto mb-2" size={24} />
                  <p>No commands found</p>
                </div>
              ) : (
                <ul>
                  {filteredCommands.map((command, index) => (
                    <li key={command.id}>
                      <button
                        className={`w-full px-4 py-3 text-left flex items-center justify-between ${
                          index === selectedIndex 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => executeCommand(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <span>{command.name}</span>
                        {command.shortcut && (
                          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-800 rounded">
                            {command.shortcut}
                          </kbd>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;