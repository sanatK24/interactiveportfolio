import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginButtons from '../components/LoginButtons';

interface LoginProps {
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

const LoginForm: React.FC<LoginProps> = ({ mode, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { session } = await signIn(email, password);
        if (!session) {
          throw new Error('No session after login');
        }
      } else {
        await signUp(email, password, true); // Always create admin accounts for now
      }
      
      // Get redirect URL from query params or default to '/admin'
      const searchParams = new URLSearchParams(location.search);
      const redirectTo = searchParams.get('redirect') || '/admin';
      
      // Use replace: true to prevent going back to login page with browser back button
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(mode === 'login' ? 'Invalid email or password' : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
            {mode === 'login' ? (
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          {mode === 'login' ? 'Admin Login' : 'Create Admin Account'}
        </h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
          >
            {mode === 'login' ? 'Create an account' : 'Back to login'}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or use a test account
            </span>
          </div>
        </div>

        <LoginButtons />
      </motion.div>
    </div>
  );
};

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return <LoginForm mode={mode} onModeChange={setMode} />;
};

export default Login;