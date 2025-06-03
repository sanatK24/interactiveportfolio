import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const LoginButtons: React.FC = () => {
  const { directLogin } = useAuth();
  const navigate = useNavigate();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    
    try {
      const { session, error } = await directLogin('admin');
      
      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Failed to sign in. Please try again.');
        return;
      }
      
      if (!session) {
        toast.error('No active session. Please try again.');
        return;
      }
      
      toast.success('Login successful!', {
        duration: 2000,
        icon: '👋',
        style: {
          minWidth: '250px',
        },
      });
      
      // Small delay before navigation to show the success message
      setTimeout(() => {
        navigate('/admin');
      }, 500);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error?.message || 'An unexpected error occurred. Please try again.', {
        duration: 4000,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
      
      <button
        onClick={handleAdminLogin}
        disabled={isLoggingIn}
        className={`px-4 py-3 rounded-md font-medium text-white transition-colors flex items-center justify-center space-x-2 ${
          isLoggingIn 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Login as Admin</span>
        )}
      </button>

      <div className="mt-4">
        <p className="text-sm text-gray-600 text-center">
          Use admin credentials to access the dashboard
        </p>
      </div>
    </div>
  );
};

export default LoginButtons;