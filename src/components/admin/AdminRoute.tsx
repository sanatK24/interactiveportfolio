import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const { session, isAdmin, loading: authLoading } = useAuth();
  const [initialCheck, setInitialCheck] = useState(false);

  // Set initial check to true after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialCheck(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state while we're checking auth status
  if (authLoading || !initialCheck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  // If no session, redirect to login with return URL
  if (!session) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    console.log('No session, redirecting to login with return URL:', redirectTo);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  // If not admin, show unauthorized message
  if (!isAdmin) {
    console.log('User is not an admin, showing access denied');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and is an admin
  console.log('User is admin, rendering children');
  return <>{children}</>;
};

export default AdminRoute;