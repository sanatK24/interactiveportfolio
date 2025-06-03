import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Show loading state while we're checking auth status
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no session, redirect to login with return URL
  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If not admin, show unauthorized message
  if (!isAdmin) {
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
  return <>{children}</>;
};

export default AdminRoute;