'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { CHECK_DEVICE_AUTHORIZATION } from '@/graphql/auth';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface DeviceStatusCheckProps {
  /** The device fingerprint to check */
  deviceId: string;
  /** The device name for display */
  deviceName: string;
  /** Called when the device is approved */
  onApproved?: () => void;
  /** Called when the device is revoked (user may need to re-register) */
  onRevoked?: () => void;
  /** Whether to show in a compact inline mode */
  compact?: boolean;
  /** Polling interval in milliseconds (default: 5000) */
  pollInterval?: number;
}

type DeviceStatus = 'checking' | 'pending' | 'approved' | 'revoked' | 'unknown' | 'error';

/**
 * Component that checks and displays the authorization status of a device.
 *
 * This component:
 * - Polls the backend to check if the device is authorized
 * - Shows appropriate UI for PENDING, APPROVED, REVOKED states
 * - Calls onApproved when the device becomes approved
 *
 * Used after a device has been registered to show its current status
 * and wait for admin approval.
 */
export default function DeviceStatusCheck({
  deviceId,
  deviceName,
  onApproved,
  onRevoked,
  compact = false,
  pollInterval = 5000,
}: DeviceStatusCheckProps) {
  const [status, setStatus] = useState<DeviceStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const { data, loading, error, refetch } = useQuery(CHECK_DEVICE_AUTHORIZATION, {
    variables: { fingerprint: deviceId },
    skip: !deviceId,
    pollInterval: status === 'pending' ? pollInterval : 0, // Only poll when pending
    fetchPolicy: 'network-only',
  });

  // Update status based on query result
  useEffect(() => {
    if (loading && !manualRefreshing) {
      // Only show checking on initial load, not during polling
      if (status === 'checking') return;
    }

    if (error) {
      setStatus('error');
      return;
    }

    if (data?.checkDeviceAuthorization) {
      const result = data.checkDeviceAuthorization;
      setLastChecked(new Date());

      if (result.isAuthorized) {
        setStatus('approved');
        onApproved?.();
      } else if (result.isPending) {
        setStatus('pending');
      } else if (result.device) {
        // Device exists but not authorized and not pending - revoked
        setStatus('revoked');
        onRevoked?.();
      } else {
        // Device not found
        setStatus('unknown');
      }
    }

    setManualRefreshing(false);
  }, [data, loading, error, onApproved, onRevoked, status, manualRefreshing]);

  const handleRefresh = useCallback(async () => {
    setManualRefreshing(true);
    await refetch();
  }, [refetch]);

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: ArrowPathIcon,
          iconClass: 'text-gray-400 animate-spin',
          bgClass: 'bg-gray-100 dark:bg-gray-700',
          title: 'Checking Status',
          description: 'Verifying device authorization...',
          showRefresh: false,
        };
      case 'pending':
        return {
          icon: ClockIcon,
          iconClass: 'text-yellow-500',
          bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
          title: 'Pending Approval',
          description: 'Waiting for an administrator to approve this device.',
          showRefresh: true,
        };
      case 'approved':
        return {
          icon: CheckCircleIcon,
          iconClass: 'text-green-500',
          bgClass: 'bg-green-50 dark:bg-green-900/20',
          title: 'Approved',
          description: 'This device is authorized to access the system.',
          showRefresh: true,
        };
      case 'revoked':
        return {
          icon: XCircleIcon,
          iconClass: 'text-red-500',
          bgClass: 'bg-red-50 dark:bg-red-900/20',
          title: 'Access Revoked',
          description: 'This device has been revoked. Contact an administrator.',
          showRefresh: true,
        };
      case 'unknown':
        return {
          icon: XCircleIcon,
          iconClass: 'text-gray-400',
          bgClass: 'bg-gray-100 dark:bg-gray-700',
          title: 'Not Registered',
          description: 'This device is not registered. Please register it first.',
          showRefresh: true,
        };
      case 'error':
        return {
          icon: XCircleIcon,
          iconClass: 'text-red-500',
          bgClass: 'bg-red-50 dark:bg-red-900/20',
          title: 'Error',
          description: error?.message || 'Failed to check device status.',
          showRefresh: true,
        };
      default:
        return {
          icon: ArrowPathIcon,
          iconClass: 'text-gray-400',
          bgClass: 'bg-gray-100 dark:bg-gray-700',
          title: 'Unknown',
          description: 'Unknown device status.',
          showRefresh: true,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgClass}`}>
        <Icon className={`h-6 w-6 ${config.iconClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {deviceName}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
              status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' :
              status === 'revoked' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {config.title}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {config.description}
          </p>
        </div>
        {config.showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={loading || manualRefreshing}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh status"
          >
            <ArrowPathIcon className={`h-4 w-4 ${manualRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className={`shadow-lg rounded-lg p-6 ${config.bgClass}`}>
        {/* Status icon and title */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-full ${
            status === 'approved' ? 'bg-green-100 dark:bg-green-900/40' :
            status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/40' :
            status === 'revoked' ? 'bg-red-100 dark:bg-red-900/40' :
            'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Icon className={`h-8 w-8 ${config.iconClass}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {deviceName}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {config.description}
        </p>

        {/* Status-specific content */}
        {status === 'pending' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Checking for approval every {pollInterval / 1000} seconds...</span>
            </div>
          </div>
        )}

        {status === 'approved' && data?.checkDeviceAuthorization?.device && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Details
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Role:</dt>
                <dd className="text-gray-900 dark:text-white font-medium">
                  {data.checkDeviceAuthorization.device.defaultRole}
                </dd>
              </div>
              {data.checkDeviceAuthorization.defaultUser && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Default User:</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {data.checkDeviceAuthorization.defaultUser.name || data.checkDeviceAuthorization.defaultUser.email}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Refresh button and last checked */}
        <div className="flex items-center justify-between">
          {config.showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={loading || manualRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700
                         border border-gray-300 dark:border-gray-600 rounded-lg
                         hover:bg-gray-50 dark:hover:bg-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${manualRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          {lastChecked && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Device ID */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Device ID: <code className="font-mono">{deviceId.substring(0, 8)}...</code>
          </p>
        </div>
      </div>
    </div>
  );
}
