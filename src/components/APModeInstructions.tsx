'use client';

import { APConfig } from '@/types';

interface APModeInstructionsProps {
  apConfig: APConfig;
  onResetTimeout?: () => void;
  resettingTimeout?: boolean;
}

/**
 * AP Mode Instructions Component
 * Shows setup instructions when the device is in AP mode
 */
export function APModeInstructions({
  apConfig,
  onResetTimeout,
  resettingTimeout = false,
}: APModeInstructionsProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Setup Mode Active
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            Your LacyLights device is running in hotspot mode for initial configuration.
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm font-bold">
                1
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Connect your device to WiFi network: <strong className="font-mono">{apConfig.ssid}</strong>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm font-bold">
                2
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Open your browser (you&apos;ll be redirected automatically)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm font-bold">
                3
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Select your home WiFi network below to connect
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="text-amber-600 dark:text-amber-400">
              <strong>IP Address:</strong> {apConfig.ipAddress}
            </div>
            <div className="text-amber-600 dark:text-amber-400">
              <strong>Channel:</strong> {apConfig.channel}
            </div>
            {apConfig.minutesRemaining !== undefined && (
              <div className="text-amber-600 dark:text-amber-400">
                <strong>Time remaining:</strong> {apConfig.minutesRemaining} minutes
              </div>
            )}
          </div>

          {onResetTimeout && apConfig.minutesRemaining !== undefined && apConfig.minutesRemaining < 10 && (
            <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Hotspot will turn off in {apConfig.minutesRemaining} minutes
                </p>
                <button
                  onClick={onResetTimeout}
                  disabled={resettingTimeout}
                  className="px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-800 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingTimeout ? 'Resetting...' : 'Extend Time'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
