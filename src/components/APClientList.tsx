'use client';

import { APClient } from '@/types';

interface APClientListProps {
  clients: APClient[];
  className?: string;
}

/**
 * AP Client List Component
 * Shows the list of devices connected to the hotspot
 */
export function APClientList({ clients, className = '' }: APClientListProps) {
  if (clients.length === 0) {
    return (
      <div className={`text-center py-6 text-gray-500 dark:text-gray-400 ${className}`}>
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p>No devices connected yet</p>
        <p className="text-sm mt-1">Connect your phone or laptop to the hotspot to continue setup</p>
      </div>
    );
  }

  const formatConnectedTime = (connectedAt: string) => {
    try {
      const date = new Date(connectedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Connected Devices ({clients.length})
      </h4>
      <div className="space-y-2">
        {clients.map((client) => (
          <div
            key={client.macAddress}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {client.hostname || 'Unknown Device'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {client.ipAddress && <span className="mr-2">{client.ipAddress}</span>}
                  <span className="font-mono text-gray-400 dark:text-gray-500">
                    {client.macAddress}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatConnectedTime(client.connectedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
