import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Send, MapPin, Phone, Mail, Linkedin, Github, Twitter } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          message: formData.message
        });

      if (error) throw error;

      toast.success('Message sent successfully! I will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <motion.h1
            className="text-4xl font-bold text-gray-800 dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Get In Touch
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-300 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Have a question or want to work together? Send me a message!
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">Sending...</span>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Send size={18} />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={18} className="ml-2" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
            
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                  Contact Information
                </h2>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <MapPin className="text-blue-600 dark:text-blue-400 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">Location</h3>
                      <p className="text-gray-600 dark:text-gray-300">City, State, Country</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <Phone className="text-blue-600 dark:text-blue-400 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">Phone</h3>
                      <p className="text-gray-600 dark:text-gray-300">+1 (123) 456-7890</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <Mail className="text-blue-600 dark:text-blue-400 mt-1 mr-3" size={20} />
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">Email</h3>
                      <p className="text-gray-600 dark:text-gray-300">your.email@example.com</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                  Follow Me
                </h2>
                
                <div className="flex space-x-4">
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://linkedin.com/in/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={24} />
                  </motion.a>
                  
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://github.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github size={24} />
                  </motion.a>
                  
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://twitter.com/yourusername"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter size={24} />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;