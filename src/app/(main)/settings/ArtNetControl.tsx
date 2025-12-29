'use client';

import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_SYSTEM_INFO,
  SET_ARTNET_ENABLED,
  SYSTEM_INFO_UPDATED,
} from '@/graphql/settings';
import { DEFAULT_FADEOUT_TIME } from '@/constants/playback';
import { SystemInfo } from '@/types';

/** Minimum fade time in seconds */
const MIN_FADE_TIME = 0;
/** Maximum fade time in seconds */
const MAX_FADE_TIME = 30;

/**
 * ArtNetControl component for enabling/disabling ArtNet output.
 * When disabled, all lights fade to black and ArtNet transmission stops,
 * allowing other DMX controllers on the network to take over.
 */
export default function ArtNetControl() {
  /** Fade duration in seconds when disabling ArtNet (0-30) */
  const [fadeTime, setFadeTime] = useState<number>(DEFAULT_FADEOUT_TIME);
  /** Whether to show advanced fade options */
  const [showAdvanced, setShowAdvanced] = useState(false);
  /** Error message to display to user */
  const [error, setError] = useState<string | null>(null);

  const { data: systemInfoData, refetch } = useQuery(GET_SYSTEM_INFO);
  const [setArtNetEnabled, { loading: toggling }] = useMutation(SET_ARTNET_ENABLED);

  // Subscribe to system info updates
  useSubscription(SYSTEM_INFO_UPDATED, {
    onData: () => refetch(),
  });

  const systemInfo: SystemInfo | undefined = systemInfoData?.systemInfo;
  const isEnabled = systemInfo?.artnetEnabled ?? true;

  /**
   * Toggles ArtNet output on/off.
   * When disabling, fades lights to black over the specified duration.
   * When enabling, restores ArtNet transmission immediately.
   */
  const handleToggle = async () => {
    // Prevent concurrent toggle requests (race condition)
    if (toggling) return;

    setError(null);
    try {
      await setArtNetEnabled({
        variables: {
          enabled: !isEnabled,
          // Only include fadeTime when disabling (fade to black before stopping)
          fadeTime: !isEnabled ? null : fadeTime,
        },
      });
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to toggle ArtNet: ${message}`);
      console.error('Error toggling ArtNet:', err);
    }
  };

  /**
   * Handles fade time input changes with validation.
   * Clamps values to valid range and ignores non-numeric input.
   * @param value - The new fade time value from the input
   */
  const handleFadeTimeChange = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      // Clamp to valid range
      const clamped = Math.max(MIN_FADE_TIME, Math.min(MAX_FADE_TIME, parsed));
      setFadeTime(clamped);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            ArtNet Output
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEnabled
              ? 'ArtNet is transmitting DMX data to fixtures'
              : 'ArtNet is disabled - other controllers can take over'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          role="switch"
          aria-checked={isEnabled}
          aria-label="Toggle ArtNet output"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Error message display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Advanced options - fade time (only shown when enabled) */}
      {isEnabled && (
        <div className="mt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAdvanced ? 'Hide options' : 'Show fade options'}
          </button>

          {showAdvanced && (
            <div className="mt-3 flex items-center gap-3">
              <label
                htmlFor="fadeTime"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Fade time when disabling:
              </label>
              <input
                id="fadeTime"
                type="number"
                value={fadeTime}
                onChange={(e) => handleFadeTimeChange(e.target.value)}
                min={MIN_FADE_TIME}
                max={MAX_FADE_TIME}
                step="0.5"
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                seconds
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status indicator when disabled (blackout mode) */}
      {!isEnabled && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Blackout Mode Active:</strong> No ArtNet packets are being
            transmitted. Other DMX controllers on the network can now control
            fixtures.
          </p>
        </div>
      )}
    </div>
  );
}
