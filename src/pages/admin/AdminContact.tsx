import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

const AdminContact: React.FC = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to fetch messages',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addToast({
        type: 'success',
        message: 'Message deleted successfully',
      });
      fetchMessages();
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to delete message',
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-semibold">Contact Messages</h2>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{message.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{message.email}</p>
                </div>
                <button
                  onClick={() => deleteMessage(message.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{message.message}</p>
              <div className="flex justify-end items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Received: {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContact;