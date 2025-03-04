import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth is initialized
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login');
      } 
      // If authenticated but email not verified, redirect to verification notice
      else if (user && !user.isEmailVerified) {
        router.push('/verify-email-notice');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show nothing while loading or redirecting
  if (isLoading || !isAuthenticated || (user && !user.isEmailVerified)) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  // If authenticated and email verified, render children
  return <>{children}</>;
};