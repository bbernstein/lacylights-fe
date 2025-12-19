'use client';

import { useWebSocket } from '@/contexts/WebSocketContext';
import { useEffect, useState } from 'react';

/**
 * Format relative time in a human-readable format
 */
function formatRelativeTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);

  if (seconds < 1) {
    return 'just now';
  } else if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  }
}

/**
 * Status information for display
 */
interface StatusInfo {
  color: string;
  bgColor: string;
  label: string;
  tooltip: string;
}

/**
 * Connection Status Indicator Component
 *
 * Displays the current WebSocket connection status with:
 * - Color-coded indicator dot
 * - Status label (Live, Stale, Reconnecting, Offline, Idle)
 * - Time since last message
 * - Tooltip with detailed information
 *
 * Color meanings:
 * - Green: Connected and receiving updates
 * - Yellow: Connected but no recent updates (stale)
 * - Orange: Reconnecting after disconnect
 * - Red: Disconnected or error
 * - Gray: No active subscriptions (idle)
 */
export default function ConnectionStatusIndicator() {
  const { connectionState, lastMessageTime, isStale } = useWebSocket();
  const [relativeTime, setRelativeTime] = useState<string>('Never');

  // Update relative time every second
  useEffect(() => {
    if (!lastMessageTime) {
      setRelativeTime('Never');
      return;
    }

    const updateRelativeTime = () => {
      const timeSinceLastMessage = Date.now() - lastMessageTime;
      setRelativeTime(formatRelativeTime(timeSinceLastMessage));
    };

    // Update immediately
    updateRelativeTime();

    // Update every second
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastMessageTime]);

  /**
   * Get status information based on current connection state
   */
  const getStatusInfo = (): StatusInfo => {
    // Stale connection (connected but no recent messages)
    if (connectionState === 'connected' && isStale) {
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-500',
        label: 'Stale',
        tooltip: 'Connected but no recent updates',
      };
    }

    // Normal connection states
    switch (connectionState) {
      case 'connected':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-500',
          label: 'Live',
          tooltip: 'Real-time updates active',
        };
      case 'reconnecting':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-500',
          label: 'Reconnecting',
          tooltip: 'Attempting to reconnect',
        };
      case 'disconnected':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-500',
          label: 'Offline',
          tooltip: 'No connection to server',
        };
      case 'error':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-500',
          label: 'Error',
          tooltip: 'Connection error occurred',
        };
      case 'connecting':
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-500',
          label: 'Idle',
          tooltip: 'No active subscriptions',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className="flex items-center space-x-2"
      title={`${statusInfo.tooltip}${lastMessageTime ? ` • Last update: ${relativeTime}` : ''}`}
    >
      {/* Status indicator dot */}
      <div
        className={`w-2 h-2 rounded-full ${statusInfo.bgColor}`}
        aria-label={`Connection status: ${statusInfo.label}`}
      />

      {/* Status label */}
      <span className={`text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>

      {/* Time since last message (only show if we've received at least one message) */}
      {lastMessageTime && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {relativeTime}
        </span>
      )}
    </div>
  );
}
