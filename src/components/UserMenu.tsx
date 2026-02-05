'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

/**
 * UserMenu - Header dropdown for authentication actions.
 *
 * Displays:
 * - Nothing when auth is disabled
 * - "Sign In" button when not authenticated
 * - User dropdown with logout options when authenticated
 */
export default function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthEnabled, isLoading, logout, logoutAll, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle single session logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Ignore logout errors - we're redirecting anyway
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
      router.push('/login');
    }
  };

  // Handle logout from all devices
  const handleLogoutAll = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAll();
    } catch {
      // Ignore logout errors - we're redirecting anyway
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
      router.push('/login');
    }
  };

  // Don't render anything if auth is disabled
  if (!isAuthEnabled) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  // Not authenticated - show sign in button
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Authenticated - show user menu dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar with initials */}
        <div className="h-8 w-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
          {getInitials()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {/* User info section */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {getInitials()}
                </div>
                <div className="min-w-0 flex-1">
                  {user?.name && (
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                  {isAdmin && (
                    <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>

              {isAdmin && (
                <button
                  onClick={handleLogoutAll}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50"
                >
                  <UserCircleIcon className="h-4 w-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out All Devices'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
