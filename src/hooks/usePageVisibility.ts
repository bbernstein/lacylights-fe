import { useState, useEffect } from 'react';

/**
 * Hook that tracks page visibility using the Page Visibility API
 *
 * Returns true when the page is visible (tab is active), false when hidden.
 * Useful for detecting when the user returns to the tab after being away.
 *
 * @returns {boolean} Current visibility state of the page
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isVisible = usePageVisibility();
 *
 *   useEffect(() => {
 *     if (isVisible) {
 *       console.log('User returned to tab');
 *     }
 *   }, [isVisible]);
 * }
 * ```
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    // Handle server-side rendering
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
