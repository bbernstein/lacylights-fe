import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './useMediaQuery';

/**
 * Information about the virtual keyboard state
 */
interface KeyboardInfo {
  /** Whether the virtual keyboard is currently visible */
  isVisible: boolean;
  /** Estimated height of the keyboard in pixels (0 if not visible) */
  keyboardHeight: number;
  /** The visible viewport height when keyboard is open */
  visibleHeight: number;
}

/**
 * Hook that detects virtual keyboard visibility on mobile devices
 *
 * Uses the Visual Viewport API when available, with fallback behavior
 * for older browsers. Works best on iOS and modern Android browsers.
 *
 * Note: Virtual keyboard detection is inherently imprecise across browsers.
 * This hook uses viewport height changes to infer keyboard visibility.
 *
 * @returns {KeyboardInfo} Information about keyboard state
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { isVisible, keyboardHeight } = useKeyboardAware();
 *
 *   return (
 *     <div style={{ paddingBottom: isVisible ? keyboardHeight : 0 }}>
 *       <input type="text" placeholder="Type a message..." />
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardAware(): KeyboardInfo {
  const isMobile = useIsMobile();

  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isVisible: false,
    keyboardHeight: 0,
    visibleHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Store initial viewport height to detect changes
  const [initialHeight, setInitialHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  // Handle viewport resize (keyboard open/close)
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Use Visual Viewport API if available (more accurate)
    const visualViewport = window.visualViewport;
    let currentHeight: number;

    if (visualViewport) {
      currentHeight = visualViewport.height;
    } else {
      currentHeight = window.innerHeight;
    }

    // Keyboard is likely visible if viewport shrunk by more than 150px
    // This threshold helps avoid false positives from browser chrome changes
    const heightDifference = initialHeight - currentHeight;
    const isKeyboardVisible = heightDifference > 150;

    setKeyboardInfo({
      isVisible: isKeyboardVisible,
      keyboardHeight: isKeyboardVisible ? heightDifference : 0,
      visibleHeight: currentHeight,
    });
  }, [initialHeight]);

  // Handle focus events to detect keyboard triggers
  const handleFocusIn = useCallback(
    (event: FocusEvent) => {
      if (!isMobile) return;

      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement) {
        // Delay check to allow keyboard animation to complete
        setTimeout(handleResize, 300);
      }
    },
    [isMobile, handleResize]
  );

  const handleFocusOut = useCallback(
    (event: FocusEvent) => {
      if (!isMobile) return;

      const relatedTarget = event.relatedTarget as HTMLElement | null;
      const isInputElement =
        relatedTarget &&
        (relatedTarget.tagName === 'INPUT' ||
          relatedTarget.tagName === 'TEXTAREA' ||
          relatedTarget.isContentEditable);

      // Only reset if not focusing another input
      if (!isInputElement) {
        // Delay check to allow keyboard animation to complete
        setTimeout(handleResize, 300);
      }
    },
    [isMobile, handleResize]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial height
    setInitialHeight(window.innerHeight);

    // Use Visual Viewport API for more accurate tracking
    const visualViewport = window.visualViewport;

    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      visualViewport.addEventListener('scroll', handleResize);
    } else {
      // Fallback for browsers without Visual Viewport API
      window.addEventListener('resize', handleResize);
    }

    // Listen for focus events on mobile to detect keyboard triggers
    if (isMobile) {
      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
        visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }

      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isMobile, handleResize, handleFocusIn, handleFocusOut]);

  // On desktop, keyboard is never visible
  if (!isMobile) {
    return {
      isVisible: false,
      keyboardHeight: 0,
      visibleHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    };
  }

  return keyboardInfo;
}

/**
 * Hook that provides a bottom offset value for keyboard-aware positioning
 *
 * Returns the keyboard height when visible, or 0 when hidden.
 * Useful for adjusting bottom-positioned elements.
 *
 * @returns {number} Pixels to offset from bottom to avoid keyboard
 *
 * @example
 * ```tsx
 * function FloatingButton() {
 *   const bottomOffset = useKeyboardOffset();
 *
 *   return (
 *     <button
 *       style={{ bottom: 16 + bottomOffset }}
 *       className="fixed"
 *     >
 *       Send
 *     </button>
 *   );
 * }
 * ```
 */
export function useKeyboardOffset(): number {
  const { keyboardHeight } = useKeyboardAware();
  return keyboardHeight;
}

/**
 * Hook that returns whether the virtual keyboard is currently visible
 *
 * @returns {boolean} True if keyboard is visible
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isKeyboardVisible = useIsKeyboardVisible();
 *
 *   return (
 *     <div className={isKeyboardVisible ? 'compact' : 'full'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsKeyboardVisible(): boolean {
  const { isVisible } = useKeyboardAware();
  return isVisible;
}
