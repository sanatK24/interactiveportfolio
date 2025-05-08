import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import type { Database } from '../../types/supabase';

type ContactMessage = Database['public']['Tables']['messages']['Row'];

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
        .from('messages')
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

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      addToast({
        type: 'success',
        message: 'Message marked as read',
      });
      fetchMessages();
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to mark message as read',
      });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contact Messages</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-8">Loading messages...</div>
        ) : (
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400">
                No messages found
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {message.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {message.email}
                      </p>
                      <p className="mt-2 text-gray-700 dark:text-gray-300">
                        {message.content}
                      </p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(message.created_at || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!message.is_read && (
                        <button
                          onClick={() => markAsRead(message.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContact;