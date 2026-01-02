'use client';

import { useQuery, useSubscription } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GET_SYSTEM_INFO, SYSTEM_INFO_UPDATED } from '@/graphql/settings';
import { SystemInfo } from '@/types';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import { useGlobalPlaybackStatus } from '@/hooks/useGlobalPlaybackStatus';

/**
 * NowPlayingButton - Shows when a cue list is playing and navigates to it
 */
function NowPlayingButton() {
  const router = useRouter();
  const { playbackStatus } = useGlobalPlaybackStatus();

  if (!playbackStatus?.isPlaying || !playbackStatus.cueListId) {
    return null;
  }

  const handleClick = () => {
    // Navigate to the cue list page with the current cue highlighted
    const cueIndex = playbackStatus.currentCueIndex ?? 0;
    router.push(`/cue-lists/${playbackStatus.cueListId}?highlightCue=${cueIndex}`);
  };

  // Format the cue position display
  const cuePosition = playbackStatus.currentCueIndex !== null && playbackStatus.cueCount !== null
    ? `${playbackStatus.currentCueIndex + 1}/${playbackStatus.cueCount}`
    : '';

  // Build accessible aria-label
  const ariaLabelParts = [
    `Now playing: ${playbackStatus.cueListName || 'Cue List'}`,
  ];

  if (
    typeof playbackStatus.currentCueIndex === 'number' &&
    typeof playbackStatus.cueCount === 'number'
  ) {
    ariaLabelParts.push(
      `cue ${playbackStatus.currentCueIndex + 1} of ${playbackStatus.cueCount}`,
    );
  }

  ariaLabelParts.push('Click to view');

  const ariaLabel = ariaLabelParts.join(', ');

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
      title={`Playing: ${playbackStatus.cueListName || 'Cue List'} - Click to view`}
      aria-label={ariaLabel}
    >
      {/* Play icon with pulse animation when fading */}
      <span className={`relative ${playbackStatus.isFading ? 'animate-pulse' : ''}`}>
        <svg
          className="w-3.5 h-3.5 text-green-600 dark:text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          role="img"
          aria-label="Playing"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="text-green-700 dark:text-green-300 font-medium truncate max-w-28">
        {playbackStatus.cueListName || 'Playing'}
      </span>
      {cuePosition && (
        <span className="text-green-600 dark:text-green-400 text-xs">
          {cuePosition}
        </span>
      )}
    </button>
  );
}

export default function SystemStatusBar() {
  // Initial query to get current system info
  const { data, loading, error } = useQuery(GET_SYSTEM_INFO);

  // Subscribe to real-time updates
  const { data: subscriptionData } = useSubscription(SYSTEM_INFO_UPDATED);

  // Use subscription data if available, otherwise fall back to query data
  const systemInfo: SystemInfo | undefined = subscriptionData?.systemInfoUpdated || data?.systemInfo;

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

  if (!systemInfo) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          {/* Art-Net status indicator - clickable link to settings */}
          <Link
            href="/settings"
            className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity"
            title={`Art-Net: ${systemInfo.artnetEnabled ? 'Enabled' : 'Disabled'}${systemInfo.artnetBroadcastAddress ? ` - ${systemInfo.artnetBroadcastAddress}` : ''} - Click to view settings`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                systemInfo.artnetEnabled
                  ? 'bg-green-500 dark:bg-green-400'
                  : 'bg-red-500 dark:bg-red-400'
              }`}
              aria-hidden="true"
            />
            {/* Show "Art-Net" text only on desktop */}
            <span className="hidden md:inline text-gray-500 dark:text-gray-400">Art-Net</span>
          </Link>

          {/* Broadcast address - hidden on mobile */}
          <div
            className="hidden md:flex items-center space-x-1"
            title={`Broadcast Address: ${systemInfo.artnetBroadcastAddress}`}
          >
            <svg
              className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Broadcast"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
            <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
              {systemInfo.artnetBroadcastAddress}
            </span>
          </div>

          {/* Now Playing button - visible on all screen sizes */}
          <NowPlayingButton />
        </div>
        {/* Connection status - hidden on mobile */}
        <div className="hidden md:block">
          <ConnectionStatusIndicator />
        </div>
      </div>
    </div>
  );
}
