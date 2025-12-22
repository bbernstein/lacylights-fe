'use client';

import React from 'react';

interface ReconnectCountdownProps {
  /** Seconds remaining until timeout */
  countdown: number;
  /** Maximum seconds (for progress calculation) */
  maxSeconds?: number;
  /** Whether polling is active */
  isPolling: boolean;
}

/**
 * Displays a countdown timer during server reconnection.
 * Shows a circular progress indicator and remaining time.
 */
export function ReconnectCountdown({
  countdown,
  maxSeconds = 60,
  isPolling,
}: ReconnectCountdownProps) {
  if (!isPolling) {
    return null;
  }

  const progress = (countdown / maxSeconds) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-28 w-28">
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-1000"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        {/* Countdown text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{countdown}</span>
          <span className="text-xs text-gray-400">seconds</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-300">Waiting for server to restart...</p>
        <p className="text-xs text-gray-500">Checking connection every 2 seconds</p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default ReconnectCountdown;
