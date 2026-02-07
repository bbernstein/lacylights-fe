'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

/**
 * Login page component.
 * Redirects to home if already authenticated or if auth is disabled.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAuthEnabled, isLoading } = useAuth();

  // Get redirect URL from query params or default to home.
  // Only allow relative paths starting with '/' to prevent open redirects.
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  // Redirect if already authenticated or auth is disabled
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthEnabled || isAuthenticated) {
        router.replace(redirectTo);
      }
    }
  }, [isLoading, isAuthEnabled, isAuthenticated, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If auth is disabled or user is authenticated, show nothing while redirecting
  if (!isAuthEnabled || isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 sm:p-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
        Sign In
      </h2>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
