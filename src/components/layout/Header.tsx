import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Moon, Sun, Command } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toggleCommandPalette } = useCommandPalette();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Expertise', href: '/skills' },
    { name: 'Background', href: '/education' },
    { name: 'Blog', href: '/blog' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/contact' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleCommandPalette = () => {
    toggleCommandPalette();
  };

  return (
    <header className="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className="text-blue-600 dark:text-blue-400"
          >
            <Command size={28} onClick={handleCommandPalette} />
          </motion.div>
          <span className="font-bold text-xl text-gray-800 dark:text-white">Sanat's Portfolio</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-base font-medium transition-colors duration-300 ${
                location.pathname === item.href
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleCommandPalette}
              className="hidden md:flex items-center text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-300"
            >
              <Command size={16} className="mr-2" /> 
              <span>Command</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 rounded">
                Ctrl K
              </kbd>
            </motion.button>

            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="container mx-auto py-4 px-4 flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-medium py-2 ${
                    location.pathname === item.href
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <button 
                onClick={toggleCommandPalette}
                className="flex items-center text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 w-full"
              >
                <Command size={16} className="mr-2" />
                <span>Command Palette</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;