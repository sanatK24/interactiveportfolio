import React, { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import type { Database } from '../../types/supabase';

type ContactMessage = Database['public']['Tables']['messages']['Row'];

const AdminContact: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and has admin role
    const checkAdmin = async () => {
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      setIsAuthenticated(!!profile?.is_admin);
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchMessages();
    // Subscribe to real-time updates
    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      console.log('Fetching messages...');
      
      if (!isAuthenticated) {
        throw new Error('Not authenticated as admin');
      }

      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Database response:', { data, error, count });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No messages found in database');
      } else {
        console.log('Messages fetched:', data.length);
      }

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error details:', error.message || error);
      addToast({
        type: 'error',
        message: `Failed to fetch messages. Error: ${error.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      if (!isAuthenticated) {
        throw new Error('Not authenticated as admin');
      }

      console.log('Marking message as read:', id);
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }

      addToast({
        type: 'success',
        message: 'Message marked as read'
      });
      fetchMessages();
    } catch (error: any) {
      console.error('Error details:', error.message || error);
      addToast({
        type: 'error',
        message: `Failed to mark message as read. Error: ${error.message || 'Unknown error'}`
      });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      if (!isAuthenticated) {
        throw new Error('Not authenticated as admin');
      }

      console.log('Deleting message:', id);
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }

      addToast({
        type: 'success',
        message: 'Message deleted successfully'
      });
      fetchMessages();
    } catch (error: any) {
      console.error('Error details:', error.message || error);
      addToast({
        type: 'error',
        message: `Failed to delete message. Error: ${error.message || 'Unknown error'}`
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Contact Messages</h1>
          <p className="text-red-600">You must be logged in as an admin to view messages</p>
        </div>
      </div>
    );
  }

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
                      {!message.is_read && (
                        <span className="mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                          Unread
                        </span>
                      )}
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