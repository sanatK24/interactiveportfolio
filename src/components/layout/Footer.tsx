import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Footer: React.FC = () => {
  const { isAdmin } = useAuth();

  const socialLinks = [
    { name: 'GitHub', icon: <FontAwesomeIcon icon={faGithub} size="lg" />, href: 'https://github.com/sanatK24' },
    { name: 'LinkedIn', icon: <FontAwesomeIcon icon={faLinkedin} size="lg" />, href: 'https://www.linkedin.com/in/sanat-karkhanis-3255a7214/' },
    { name: 'X', icon: <FontAwesomeIcon icon={faXTwitter} size="lg" />, href: 'https://x.com/SanatKarkhanis' }
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">About</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Computer Engineering student passionate about building interactive and accessible web experiences.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Quick Links</h3>
            <ul className="space-y-2">
              {[
                'Home',
                'Skills',
                'Certifications',
                'Background',
                'Blog',
                'Projects',
                'Contact'
              ].map((item) => (
                <li key={item}>
                  <a 
                    href={`/${item.toLowerCase() === 'home' ? '' : item.toLowerCase()}`}
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <a 
                    href="/admin"
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    Admin Dashboard
                  </a>
                </li>
              )}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Connect</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {new Date().getFullYear()} Sanat Karkhanis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;