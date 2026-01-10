import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lacylights-scroll-direction';

/**
 * Scroll direction preference values
 */
export type ScrollDirection = 'natural' | 'traditional';

/**
 * Hook for managing scroll/wheel direction preference stored in localStorage.
 *
 * - 'natural' (default): Drag UP = increase value (macOS natural scrolling default)
 * - 'traditional': Drag UP = decrease value (Windows/Linux default, or macOS with natural scrolling disabled)
 *
 * @returns Tuple of [preference, setPreference, invertWheelDirection]
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const [scrollDirection, setScrollDirection] = useScrollDirectionPreference();
 *
 *   return (
 *     <select value={scrollDirection} onChange={(e) => setScrollDirection(e.target.value)}>
 *       <option value="natural">Natural (macOS default)</option>
 *       <option value="traditional">Traditional (Windows/Linux)</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useScrollDirectionPreference(): [
  ScrollDirection,
  (direction: ScrollDirection) => void,
  boolean
] {
  const [direction, setDirectionState] = useState<ScrollDirection>('natural');

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'natural' || stored === 'traditional') {
        setDirectionState(stored);
      }
    } catch {
      // localStorage may not be available (SSR, privacy mode, etc.)
    }
  }, []);

  // Save preference to localStorage
  const setDirection = useCallback((newDirection: ScrollDirection) => {
    setDirectionState(newDirection);
    try {
      localStorage.setItem(STORAGE_KEY, newDirection);
    } catch {
      // localStorage may not be available
    }
  }, []);

  // Compute invertWheelDirection for useValueScrub
  const invertWheelDirection = direction === 'traditional';

  return [direction, setDirection, invertWheelDirection];
}
