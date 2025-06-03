import React from 'react';
import { useAuth, AccountType } from '../context/AuthContext';

const LoginButtons: React.FC = () => {
  const { directLogin, loading } = useAuth();

  const handleDirectLogin = async (accountType: AccountType) => {
    try {
      await directLogin(accountType);
    } catch (error) {
      console.error('Login failed:', error);
      // You can add toast notifications here if needed
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Quick Login</h2>
      
      <button
        onClick={() => handleDirectLogin('admin')}
        disabled={loading}
        className={`px-4 py-3 rounded-md font-medium text-white transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Signing in...' : 'Login as Admin'}
      </button>
      
      <button
        onClick={() => handleDirectLogin('user')}
        disabled={loading}
        className={`px-4 py-3 rounded-md font-medium text-white transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Signing in...' : 'Login as User'}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-sm text-gray-600 text-center">
          Using test accounts for demo purposes. In production, implement proper authentication.
        </p>
      </div>
    </div>
  );
};

export default LoginButtons;
