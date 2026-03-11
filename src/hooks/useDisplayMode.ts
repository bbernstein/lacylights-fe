import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lacylights-display-mode';

export type DisplayMode = 'dmx' | 'percent';

/**
 * Hook for managing the DMX value display mode preference stored in localStorage.
 *
 * - 'dmx' (default): Show raw DMX values (0-255)
 * - 'percent': Show values as percentages (0.0%-100.0%)
 */
export function useDisplayMode() {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>('dmx');

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dmx' || stored === 'percent') {
        setDisplayModeState(stored);
      }
    } catch {
      // localStorage may not be available (SSR, privacy mode, etc.)
    }
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage may not be available
    }
  }, []);

  return {
    displayMode,
    setDisplayMode,
    isDmxMode: displayMode === 'dmx',
    isPercentMode: displayMode === 'percent',
  };
}
