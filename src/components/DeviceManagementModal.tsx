'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PencilIcon, KeyIcon, XCircleIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { GET_DEVICES, UPDATE_DEVICE, CREATE_DEVICE_AUTH_CODE, REVOKE_DEVICE } from '@/graphql/auth';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DeviceRole } from '@/types/auth';

interface Device {
  id: string;
  name: string;
  fingerprint: string;
  isAuthorized: boolean;
  defaultRole: DeviceRole;
  lastSeenAt?: string;
  lastIPAddress?: string;
  createdAt: string;
  updatedAt: string;
  defaultUser?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface DeviceAuthCode {
  code: string;
  expiresAt: string;
  deviceId: string;
  /** Total TTL in seconds, captured at creation time for progress bar accuracy */
  initialTtlSeconds?: number;
}

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceManagementModal({ isOpen, onClose }: DeviceManagementModalProps) {
  const isMobile = useIsMobile();
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<DeviceAuthCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Form state for editing device
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<DeviceRole>(DeviceRole.PLAYER);

  const { data, loading, refetch } = useQuery(GET_DEVICES, {
    skip: !isOpen,
  });

  const [updateDevice, { loading: updating }] = useMutation(UPDATE_DEVICE, {
    onError: (err) => setError(`Failed to update device: ${err.message}`),
    onCompleted: () => {
      refetch();
      setEditingDevice(null);
    },
  });

  const [createDeviceAuthCode, { loading: generatingCode }] = useMutation(CREATE_DEVICE_AUTH_CODE, {
    onError: (err) => setError(`Failed to generate auth code: ${err.message}`),
    onCompleted: (data) => {
      const code = data.createDeviceAuthCode;
      // Capture the initial TTL for accurate progress bar rendering
      const initialTtl = Math.max(0, Math.floor((new Date(code.expiresAt).getTime() - Date.now()) / 1000));
      setAuthCode({ ...code, initialTtlSeconds: initialTtl });
    },
  });

  const [revokeDevice, { loading: revoking }] = useMutation(REVOKE_DEVICE, {
    onError: (err) => setError(`Failed to revoke device: ${err.message}`),
    onCompleted: () => refetch(),
  });

  const devices: Device[] = data?.devices || [];

  // Timer for auth code expiration
  useEffect(() => {
    if (!authCode) {
      setTimeRemaining(0);
      return;
    }

    const expiresAt = new Date(authCode.expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setAuthCode(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [authCode]);

  const handleStartEdit = (device: Device) => {
    setEditingDevice(device);
    setEditName(device.name);
    setEditRole(device.defaultRole);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setError(null);
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    if (!editName.trim()) {
      setError('Device name is required');
      return;
    }

    setError(null);
    await updateDevice({
      variables: {
        id: editingDevice.id,
        input: {
          name: editName.trim(),
          defaultRole: editRole,
        },
      },
    });
  };

  const handleGenerateCode = async (device: Device) => {
    setError(null);
    setCopied(false);
    await createDeviceAuthCode({
      variables: { deviceId: device.id },
    });
  };

  const handleRevokeDevice = async (device: Device) => {
    if (!confirm(`Are you sure you want to revoke authorization for "${device.name}"? The device will need to be re-authorized to connect.`)) {
      return;
    }

    setError(null);
    await revokeDevice({ variables: { id: device.id } });
  };

  const handleCopyCode = useCallback(async () => {
    if (!authCode) return;
    try {
      await navigator.clipboard.writeText(authCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy code to clipboard');
    }
  }, [authCode]);

  const handleDismissCode = () => {
    setAuthCode(null);
    setCopied(false);
  };

  const getStatusBadgeClasses = (device: Device) => {
    if (device.isAuthorized) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const getStatusText = (device: Device) => {
    return device.isAuthorized ? 'Authorized' : 'Pending';
  };

  const getRoleBadgeClasses = (role: DeviceRole) => {
    switch (role) {
      case DeviceRole.DESIGNER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case DeviceRole.OPERATOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const truncateFingerprint = (fingerprint: string) => {
    if (fingerprint.length <= 12) return fingerprint;
    return `${fingerprint.substring(0, 6)}...${fingerprint.substring(fingerprint.length - 4)}`;
  };

  const formContent = (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500 rounded text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Auth Code Display */}
      {authCode && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500 rounded-lg">
          <h3 className="text-gray-900 dark:text-white font-medium mb-2">Authorization Code</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Enter this code on the device to authorize it. The code expires in {formatTimeRemaining(timeRemaining)}.
          </p>
          <div className="flex items-center gap-3 justify-center mb-3">
            <span className="text-4xl font-mono font-bold text-blue-700 dark:text-white tracking-widest">
              {authCode.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors"
              title="Copy code"
            >
              {copied ? (
                <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-500" />
              ) : (
                <ClipboardIcon className="h-6 w-6" />
              )}
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(timeRemaining / (authCode.initialTtlSeconds || 900)) * 100}%` }}
            />
          </div>
          <button
            onClick={handleDismissCode}
            className="mt-3 w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation"
          >
            Done
          </button>
        </div>
      )}

      {/* Devices List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No devices registered yet. Devices will appear here when they first connect.
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="flex items-start gap-3 p-3 rounded bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {editingDevice?.id === device.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Device name"
                      autoFocus
                    />
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as DeviceRole)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={DeviceRole.PLAYER}>Player</option>
                      <option value={DeviceRole.OPERATOR}>Operator</option>
                      <option value={DeviceRole.DESIGNER}>Designer</option>
                    </select>
                    <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                      <button
                        onClick={handleUpdateDevice}
                        disabled={updating || !editName.trim()}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation`}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {device.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadgeClasses(device)}`}>
                        {getStatusText(device)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeClasses(device.defaultRole)}`}>
                        {device.defaultRole}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-mono">
                      {truncateFingerprint(device.fingerprint)}
                    </div>
                    {device.lastSeenAt && (
                      <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        Last seen: {new Date(device.lastSeenAt).toLocaleString()}
                        {device.lastIPAddress && ` (${device.lastIPAddress})`}
                      </div>
                    )}
                    {device.defaultUser && (
                      <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        Default user: {device.defaultUser.name || device.defaultUser.email}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editingDevice?.id !== device.id && (
                <div className="flex gap-1 items-center shrink-0">
                  <button
                    onClick={() => handleStartEdit(device)}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    title="Edit device"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {!device.isAuthorized && (
                    <button
                      onClick={() => handleGenerateCode(device)}
                      disabled={generatingCode}
                      className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation disabled:opacity-50"
                      title="Generate authorization code"
                    >
                      <KeyIcon className="h-5 w-5" />
                    </button>
                  )}
                  {device.isAuthorized && (
                    <button
                      onClick={() => handleRevokeDevice(device)}
                      disabled={revoking}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation disabled:opacity-50"
                      title="Revoke authorization"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'}`}>
      <button
        onClick={onClose}
        className={`${isMobile ? 'w-full' : ''} px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation`}
      >
        Close
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Devices"
      footer={footerContent}
      maxWidth="max-w-2xl"
      testId="device-management-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
