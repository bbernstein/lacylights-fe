'use client';

import { WiFiMode } from '@/types';

interface WiFiModeIndicatorProps {
  mode: WiFiMode;
  clientCount?: number;
  ssid?: string;
  className?: string;
}

/**
 * WiFi Mode Indicator Component
 * Shows the current WiFi mode with appropriate icon and styling:
 * - Green WiFi icon: Connected to client network
 * - Amber hotspot icon: AP mode active with client count
 * - Spinning icon: Transitioning between modes
 */
export function WiFiModeIndicator({
  mode,
  clientCount = 0,
  ssid,
  className = '',
}: WiFiModeIndicatorProps) {
  const getModeDisplay = () => {
    switch (mode) {
      case WiFiMode.CLIENT:
        return {
          icon: (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          ),
          label: ssid ? `Connected to ${ssid}` : 'Client Mode',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
        };

      case WiFiMode.AP:
        return {
          icon: (
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0"
              />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          ),
          label: `Hotspot Mode (${clientCount} connected)`,
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-200',
        };

      case WiFiMode.STARTING_AP:
        return {
          icon: (
            <svg className="w-5 h-5 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0"
              />
            </svg>
          ),
          label: 'Starting Hotspot...',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-800 dark:text-amber-200',
        };

      case WiFiMode.CONNECTING:
        return {
          icon: (
            <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0"
              />
            </svg>
          ),
          label: 'Connecting...',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
        };

      case WiFiMode.DISABLED:
        return {
          icon: (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
              />
            </svg>
          ),
          label: 'WiFi Disabled',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-600 dark:text-gray-400',
        };

      default:
        return {
          icon: null,
          label: 'Unknown',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const display = getModeDisplay();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${display.bgColor} ${display.textColor} ${className}`}
      role="status"
      aria-label={display.label}
    >
      {display.icon}
      <span className="text-sm font-medium">{display.label}</span>
    </div>
  );
}
