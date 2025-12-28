import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that tracks whether a media query matches
 *
 * Uses the matchMedia API to listen for changes to a CSS media query.
 * Useful for programmatically responding to viewport changes.
 *
 * @param query - CSS media query string (e.g., '(max-width: 767px)')
 * @returns {boolean} Whether the media query currently matches
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 *   return isMobile ? <MobileView /> : <DesktopView />;
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state (SSR-safe)
  const getMatches = useCallback((): boolean => {
    if (typeof window === 'undefined') {
      return false; // Default to false on server
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState<boolean>(getMatches);

  useEffect(() => {
    // Handle server-side rendering
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value (in case it changed between render and effect)
    setMatches(mediaQuery.matches);

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoints matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

/**
 * Hook that returns whether the viewport is mobile-sized (< 768px)
 *
 * @returns {boolean} True if viewport width is less than 768px
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   return isMobile ? <MobileNav /> : <DesktopNav />;
 * }
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook that returns whether the viewport is tablet-sized (768px - 1023px)
 *
 * @returns {boolean} True if viewport width is between 768px and 1023px
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook that returns whether the viewport is desktop-sized (>= 1024px)
 *
 * @returns {boolean} True if viewport width is 1024px or greater
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook that returns whether the device is in portrait orientation
 *
 * @returns {boolean} True if device is in portrait mode
 */
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

/**
 * Hook that returns whether the device is in landscape orientation
 *
 * @returns {boolean} True if device is in landscape mode
 */
export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}
