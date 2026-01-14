import { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { CitizenDashboard } from './components/CitizenDashboard';
import { ContractorDashboard } from './components/ContractorDashboard';
import { SubAdminDashboard } from './components/SubAdminDashboard';
import { MainAdminDashboard } from './components/MainAdminDashboard';
import { supabase, projectId } from './utils/supabase/client';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        
        // Fetch user role
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/profile`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }
        );
        const data = await response.json();
        if (data.user) {
          setUserRole(data.user.role);
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (token: string) => {
    setAccessToken(token);
    
    // Fetch user role
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/profile`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.user && data.user.role) {
        setUserRole(data.user.role);
      } else {
        console.error('User role not found in response:', data);
        // If role is not found, try to get it from session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to fetch role again or set a default
          console.error('Failed to get user role, please try logging in again');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      // Don't leave user in blank state - show error message
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUserRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center w-full max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // If we have accessToken but no userRole yet, show loading
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center w-full max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading your dashboard...</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (userRole) {
    case 'citizen':
      return <CitizenDashboard accessToken={accessToken} onLogout={handleLogout} />;
    case 'contractor':
      return <ContractorDashboard accessToken={accessToken} onLogout={handleLogout} />;
    case 'subadmin':
      return <SubAdminDashboard accessToken={accessToken} onLogout={handleLogout} />;
    case 'admin':
      return <MainAdminDashboard accessToken={accessToken} onLogout={handleLogout} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center w-full max-w-sm">
            <p className="text-red-600 mb-4 text-sm sm:text-base break-words">Unknown user role: {userRole}</p>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">Access Token: {accessToken ? 'Present' : 'Missing'}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base min-h-[44px] min-w-[120px]"
            >
              Logout
            </button>
          </div>
        </div>
      );
  }
}