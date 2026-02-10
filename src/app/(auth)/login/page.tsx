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
  const { isAuthenticated, isAuthEnabled, isLoading, isDeviceAuth, deviceName } = useAuth();

  // Get redirect URL from query params or default to home.
  // Only allow relative paths starting with '/' to prevent open redirects.
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  // Device-auth users redirected here by middleware (indicated by ?redirect param)
  // should be sent to their destination since they're authenticated at device level.
  const hasRedirectParam = searchParams.has('redirect');

  // Redirect if already authenticated (with JWT, not device auth) or auth is disabled.
  // Device-authenticated users may stay on login to upgrade, unless middleware sent them here.
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthEnabled || (isAuthenticated && !isDeviceAuth)) {
        router.replace(redirectTo);
      } else if (isDeviceAuth && hasRedirectParam) {
        router.replace(redirectTo);
      }
    }
  }, [isLoading, isAuthEnabled, isAuthenticated, isDeviceAuth, hasRedirectParam, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If auth is disabled, JWT-authenticated, or device-auth redirected by middleware, show nothing
  if (!isAuthEnabled || (isAuthenticated && !isDeviceAuth) || (isDeviceAuth && hasRedirectParam)) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 sm:p-8">
      {isDeviceAuth && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md text-sm text-emerald-800 dark:text-emerald-200">
          Currently using device access{deviceName ? ` (${deviceName})` : ''}. Sign in to access your full account.
        </div>
      )}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
        Sign In
      </h2>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
