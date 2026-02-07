'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER_DEVICE } from '@/graphql/auth';
import {
  getOrCreateDeviceId,
  getDeviceName,
  setDeviceName,
  requestPersistentStorage,
  isPersistentStorageGranted,
} from '@/lib/device';
import { ComputerDesktopIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import DeviceStatusCheck from './DeviceStatusCheck';

interface DeviceRegistrationProps {
  /** Called when registration is complete or device is already approved */
  onComplete?: () => void;
  /** Whether to show in a compact inline mode */
  compact?: boolean;
}

/**
 * Device registration component for browser-based device authentication.
 *
 * This component handles the device registration flow:
 * 1. Checks if device already has a stored name
 * 2. If not, shows a form to enter a device name (e.g., "Stage Manager iPad")
 * 3. On submit, registers the device with the backend
 * 4. Shows pending approval status after registration
 *
 * After a device is registered and approved by an admin, it can access the
 * system without requiring user login credentials.
 */
export default function DeviceRegistration({ onComplete, compact = false }: DeviceRegistrationProps) {
  const [deviceName, setDeviceNameState] = useState('');
  const [existingName, setExistingName] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [persistentStorage, setPersistentStorage] = useState<boolean | null>(null);

  // Check for existing device name on mount
  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    const name = getDeviceName();
    if (name) {
      setExistingName(name);
      setIsRegistered(true);
    }

    // Check persistent storage status
    isPersistentStorageGranted().then(setPersistentStorage);
  }, []);

  const [registerDevice, { loading: registering }] = useMutation(REGISTER_DEVICE, {
    onCompleted: (data) => {
      if (data?.registerDevice?.success) {
        setDeviceName(deviceName.trim());
        setExistingName(deviceName.trim());
        setIsRegistered(true);
        setError(null);
      } else if (data?.registerDevice?.message) {
        setError(`Registration failed: ${data.registerDevice.message}`);
      }
    },
    onError: (err) => {
      // Check if the device is already registered
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        // Device was previously registered - store the name and continue
        setDeviceName(deviceName.trim());
        setExistingName(deviceName.trim());
        setIsRegistered(true);
        setError(null);
      } else {
        setError(`Registration failed: ${err.message}`);
      }
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!deviceName.trim()) {
      setError('Please enter a name for this device');
      return;
    }

    if (deviceName.trim().length < 2) {
      setError('Device name must be at least 2 characters');
      return;
    }

    if (deviceName.trim().length > 100) {
      setError('Device name must be less than 100 characters');
      return;
    }

    // Request persistent storage before registering
    await requestPersistentStorage();

    await registerDevice({
      variables: {
        fingerprint: deviceId,
        name: deviceName.trim(),
      },
    });
  };

  const handleRequestPersistentStorage = async () => {
    const granted = await requestPersistentStorage();
    setPersistentStorage(granted);
  };

  // If already registered, show status check
  if (isRegistered && existingName) {
    return (
      <DeviceStatusCheck
        deviceId={deviceId}
        deviceName={existingName}
        onApproved={onComplete}
        compact={compact}
      />
    );
  }

  // Show registration form
  if (compact) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceNameState(e.target.value)}
            placeholder="e.g., Stage Manager iPad"
            disabled={registering}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={registering || !deviceName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       dark:focus:ring-offset-gray-800"
          >
            {registering ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <ComputerDesktopIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Register This Device
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Give this device a name so it can be identified
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="device-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Device Name
            </label>
            <input
              id="device-name"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceNameState(e.target.value)}
              placeholder="e.g., Stage Manager iPad, Booth Computer"
              disabled={registering}
              autoFocus
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose a descriptive name that helps identify this device.
            </p>
          </div>

          <button
            type="submit"
            disabled={registering || !deviceName.trim()}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm
                       text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       dark:focus:ring-offset-gray-800"
          >
            {registering ? (
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
                Registering...
              </div>
            ) : (
              'Register Device'
            )}
          </button>
        </form>

        {/* Device ID info */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Device ID: <code className="font-mono">{deviceId.substring(0, 8)}...</code>
          </p>

          {/* PWA persistent storage */}
          {persistentStorage === false && (
            <button
              onClick={handleRequestPersistentStorage}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Enable persistent storage for better reliability
            </button>
          )}
          {persistentStorage === true && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              Persistent storage enabled
            </p>
          )}
        </div>

        {/* Info note */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            After registration, an administrator will need to approve this device.
            Once approved, this device will have automatic access to the system.
          </p>
        </div>
      </div>
    </div>
  );
}
