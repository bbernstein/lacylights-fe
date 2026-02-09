'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LoginFormProps {
  /** URL to redirect to after successful login */
  redirectTo?: string;
}

/**
 * Login form component with email and password fields.
 * Handles form validation and displays errors.
 */
export default function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect on success
      router.push(redirectTo);
    } catch (err) {
      // Handle different error types
      if (err instanceof Error) {
        // Check for specific error messages from the backend
        const message = err.message.toLowerCase();
        if (message.includes('invalid credentials') || message.includes('incorrect password')) {
          setError('Invalid email or password');
        } else if (message.includes('not found') || message.includes('no user')) {
          setError('No account found with this email');
        } else if (message.includes('disabled') || message.includes('inactive')) {
          setError('This account has been disabled');
        } else if (message.includes('locked')) {
          setError('Account is locked due to too many failed attempts. Please try again later.');
        } else {
          setError(err.message || 'An error occurred during login');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-400"
              aria-hidden="true"
            />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="you@example.com"
        />
      </div>

      {/* Password field */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter your password"
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm
                   text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   dark:focus:ring-offset-gray-800"
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Register link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Register
        </Link>
      </div>
    </form>
  );
}
