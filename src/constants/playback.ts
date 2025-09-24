/**
 * Shared constants for playback and player functionality
 */

/**
 * Threshold for fade progress comparison (in percentage points).
 * Only update playback status if fadeProgress changes by at least 1 percentage point,
 * to avoid unnecessary re-renders from minor fluctuations.
 *
 * The fadeProgress value from the API is expected to be a number between 0 and 100,
 * representing the percentage completion of a fade transition. This is defined by
 * the CueListPlaybackStatus interface where fadeProgress?: number.
 *
 * The threshold of 1 means changes less than 1% are ignored, preventing excessive
 * updates during smooth fade transitions while maintaining visual accuracy.
 */
export const FADE_PROGRESS_THRESHOLD = 1;

/**
 * Pop-out player window configuration
 * Used for opening the cue list player in a separate window
 */
export const PLAYER_WINDOW = {
  width: 600,
  height: 700,
  name: 'cueListPlayer',
  features: 'resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no'
} as const;

/**
 * Default fade out time in seconds for blackout operations
 * Used when fading all lights to black
 */
export const DEFAULT_FADEOUT_TIME = 3;