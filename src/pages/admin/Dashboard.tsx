import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex">
          {/* Sidebar */}
          <motion.div
            className="w-64 bg-gray-800 text-white fixed h-full pt-20"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">Admin</h1>
              <div className="space-y-2">
                <a
                  href="/admin"
                  className={`block px-4 py-2 text-gray-300 hover:bg-gray-700 ${
                    location.pathname === '/admin' && 'bg-gray-700'
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/admin/projects"
                  className={`block px-4 py-2 text-gray-300 hover:bg-gray-700 ${
                    location.pathname === '/admin/projects' && 'bg-gray-700'
                  }`}
                >
                  Projects
                </a>
                <a
                  href="/admin/blog"
                  className={`block px-4 py-2 text-gray-300 hover:bg-gray-700 ${
                    location.pathname === '/admin/blog' && 'bg-gray-700'
                  }`}
                >
                  Blog
                </a>
                <a
                  href="/admin/contact"
                  className={`block px-4 py-2 text-gray-300 hover:bg-gray-700 ${
                    location.pathname === '/admin/contact' && 'bg-gray-700'
                  }`}
                >
                  Contact
                </a>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="ml-64">
            <div className="flex justify-between items-center mb-8">
              <motion.h1
                className="text-3xl font-bold text-gray-800 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {location.pathname === '/admin' && 'Dashboard'}
                {location.pathname === '/admin/projects' && 'Projects'}
                {location.pathname === '/admin/blog' && 'Blog'}
                {location.pathname === '/admin/contact' && 'Contact Messages'}
              </motion.h1>
              <motion.p
                className="text-lg text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Welcome back, {user?.email}
              </motion.p>
            </div>

            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;