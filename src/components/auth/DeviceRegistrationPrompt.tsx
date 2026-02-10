'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { CHECK_DEVICE_AUTHORIZATION } from '@/graphql/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateDeviceId, isDeviceRegistered } from '@/lib/device';
import DeviceRegistration from './DeviceRegistration';
import BottomSheet from '../BottomSheet';

/**
 * Prompts the user to register their device after login.
 *
 * Renders in the main layout. When a user is authenticated but the
 * current browser/device is not registered with the backend, shows a
 * dismissable modal with the DeviceRegistration form.
 *
 * The prompt can be dismissed for the session; it will reappear on
 * next login if the device is still unregistered.
 */
export default function DeviceRegistrationPrompt() {
  const { isAuthEnabled, isAuthenticated, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [locallyRegistered, setLocallyRegistered] = useState(true);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);
    setLocallyRegistered(isDeviceRegistered());
  }, []);

  // Check backend for device status — only when the device is not already locally registered
  const shouldCheck = isAuthEnabled && isAuthenticated && !isLoading && !!deviceId && !locallyRegistered;
  const { data, loading: checkingDevice } = useQuery(CHECK_DEVICE_AUTHORIZATION, {
    variables: { fingerprint: deviceId },
    skip: !shouldCheck,
    fetchPolicy: 'network-only',
  });

  // Determine if we need to show the prompt
  const backendKnowsDevice = data?.checkDeviceAuthorization?.device != null;
  const needsRegistration = !locallyRegistered && !backendKnowsDevice;

  // Don't show if: still loading, dismissed, auth not active, or device already known
  const showPrompt = shouldCheck && !checkingDevice && !dismissed && needsRegistration;

  const handleComplete = () => {
    setDismissed(true);
    setLocallyRegistered(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!showPrompt) return null;

  return (
    <BottomSheet
      isOpen={true}
      onClose={handleDismiss}
      title="Register This Device"
      maxWidth="max-w-lg"
      testId="device-registration-prompt"
    >
      <div className="px-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Register this device so it can be managed and assigned to groups.
          You can skip this and register later from Settings.
        </p>
        <DeviceRegistration onComplete={handleComplete} compact />
        <button
          onClick={handleDismiss}
          className="mt-4 w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </BottomSheet>
  );
}
