'use client';

import { useQuery } from '@apollo/client';
import { GET_SYSTEM_INFO } from '@/graphql/settings';
import { SystemInfo } from '@/types';

export default function SystemStatusBar() {
  const { data, loading, error } = useQuery(GET_SYSTEM_INFO, {
    pollInterval: 5000, // Refresh every 5 seconds
  });

  if (loading && !data) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-red-600 dark:text-red-400">Failed to load system status</p>
        </div>
      </div>
    );
  }

  const systemInfo: SystemInfo | undefined = data?.systemInfo;

  if (!systemInfo) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">Art-Net:</span>
            <span className={`font-medium ${systemInfo.artnetEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {systemInfo.artnetEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">Broadcast Address:</span>
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
              {systemInfo.artnetBroadcastAddress}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
