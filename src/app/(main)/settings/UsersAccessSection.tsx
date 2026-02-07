'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';
import { useQuery, useMutation } from '@apollo/client';
import { GET_AUTH_SETTINGS, GET_USERS, GET_DEVICES, UPDATE_AUTH_SETTINGS } from '@/graphql/auth';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import UserManagementModal from '@/components/UserManagementModal';
import DeviceManagementModal from '@/components/DeviceManagementModal';

/**
 * Users & Access section for the Settings page.
 * Shows authentication status and provides access to user management.
 * Only visible when user has canManageUsers permission or when auth is disabled in admin mode.
 */
export default function UsersAccessSection() {
  const { isAuthEnabled, isAuthenticated, user } = useAuth();
  const { canManageUsers, mode } = useUserMode();
  const [enableError, setEnableError] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Determine if this section should be shown
  // Show if:
  // 1. User has canManageUsers permission (auth enabled, admin user)
  // 2. Auth is disabled AND user is in admin mode (allows enabling auth)
  const shouldShow = canManageUsers || (!isAuthEnabled && mode === 'admin');

  // Fetch auth settings (only when section will render and auth is enabled)
  const { data: authSettingsData } = useQuery(GET_AUTH_SETTINGS, {
    skip: !isAuthEnabled || !shouldShow,
  });

  // Fetch users list (only when auth is enabled and user can manage)
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS, {
    skip: !isAuthEnabled || !canManageUsers,
  });

  // Fetch devices list (only when auth is enabled and user can manage)
  const { data: devicesData, loading: devicesLoading } = useQuery(GET_DEVICES, {
    skip: !isAuthEnabled || !canManageUsers,
  });

  // Mutation to enable auth
  const [updateAuthSettings, { loading: updating }] = useMutation(UPDATE_AUTH_SETTINGS, {
    refetchQueries: [{ query: GET_AUTH_SETTINGS }],
  });

  if (!shouldShow) {
    return null;
  }

  const authSettings = authSettingsData?.authSettings;
  const users = usersData?.users || [];
  const devices = devicesData?.devices || [];

  const handleEnableAuth = async () => {
    setEnableError(null);
    try {
      await updateAuthSettings({
        variables: {
          input: {
            authEnabled: true,
          },
        },
      });
      // The page will re-render when auth status changes
      // User will need to log in with the default admin credentials
    } catch (err) {
      setEnableError(err instanceof Error ? err.message : 'Failed to enable authentication');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Users & Access</h2>

      <div className="space-y-4">
        {/* Auth Status Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isAuthEnabled ? 'Authentication is enabled' : 'Authentication is disabled'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAuthEnabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {isAuthEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {/* Show enable button when auth is disabled */}
          {!isAuthEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Important:</strong> Before enabling authentication, ensure the backend has these environment variables set:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 list-disc list-inside">
                      <li><code className="bg-amber-100 dark:bg-amber-800/30 px-1 rounded">AUTH_ENABLED=true</code></li>
                      <li><code className="bg-amber-100 dark:bg-amber-800/30 px-1 rounded">DEFAULT_ADMIN_PASSWORD=your-password</code> (required, min 8 chars)</li>
                      <li><code className="bg-amber-100 dark:bg-amber-800/30 px-1 rounded">DEFAULT_ADMIN_EMAIL</code> (optional, defaults to admin@lacylights.local)</li>
                    </ul>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                      Restart the backend after setting these, then return here to log in.
                    </p>
                  </div>
                </div>
              </div>

              {enableError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{enableError}</p>
                </div>
              )}

              <button
                onClick={handleEnableAuth}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Enabling...' : 'Enable Authentication'}
              </button>
            </div>
          )}

          {/* Show auth methods when enabled */}
          {isAuthEnabled && authSettings && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Allowed methods:</strong>{' '}
                {authSettings.allowedMethods?.join(', ') || 'password'}
              </div>
              {authSettings.deviceAuthEnabled && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <strong>Device authentication:</strong> Enabled
                </div>
              )}
            </div>
          )}
        </div>

        {/* Only show user/device management when auth is enabled */}
        {isAuthEnabled && (
          <>
            {/* Users Card */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Users
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {usersLoading
                        ? 'Loading...'
                        : `${users.length} user${users.length !== 1 ? 's' : ''} registered`}
                    </p>
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setIsUserModalOpen(true)}
                >
                  Manage Users
                </button>
              </div>

              {/* Quick user list */}
              {!usersLoading && users.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    {users.slice(0, 3).map((u: { id: string; email: string; name?: string; role: string }) => (
                      <div key={u.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {u.name || u.email}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          u.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                    {users.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{users.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Devices Card */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ComputerDesktopIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Devices
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {devicesLoading
                        ? 'Loading...'
                        : `${devices.length} device${devices.length !== 1 ? 's' : ''} registered`}
                    </p>
                  </div>
                </div>
                <button
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setIsDeviceModalOpen(true)}
                >
                  Manage Devices
                </button>
              </div>

              {/* Quick device list */}
              {!devicesLoading && devices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    {devices.slice(0, 3).map((d: { id: string; name: string; isAuthorized: boolean; defaultRole: string }) => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {d.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          d.isAuthorized
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {d.isAuthorized ? 'Authorized' : 'Pending'}
                        </span>
                      </div>
                    ))}
                    {devices.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{devices.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Info */}
            {isAuthenticated && user && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Your Account
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                  {user.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Name:</span>
                      <span className="text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Role:</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
      <DeviceManagementModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </div>
  );
}
