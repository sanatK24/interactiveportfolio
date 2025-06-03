import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginButtons: React.FC = () => {
  const { directLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    try {
      await directLogin('admin');
      navigate('/admin');
    } catch (error) {
      console.error('Admin login failed:', error);
      // You can add toast notifications here if needed
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
      
      <button
        onClick={handleAdminLogin}
        disabled={loading}
        className={`px-4 py-3 rounded-md font-medium text-white transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Signing in...' : 'Login as Admin'}
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