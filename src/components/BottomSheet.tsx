'use client';

import { useEffect, useCallback, useRef, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Swipe gesture thresholds - based on common touch UX patterns
// 10px: Prevents accidental swipes from taps or micro-movements
const SWIPE_START_THRESHOLD = 10;
// 100px: Ensures intentional dismiss gesture (roughly 1/3 of small phone height)
const SWIPE_DISMISS_THRESHOLD = 100;

// Data attribute key for scroll lock counter on document.body
// Using DOM storage avoids SSR issues and test pollution from module-level state
const SCROLL_LOCK_ATTR = 'data-scroll-lock-count';

/**
 * Gets the current scroll lock count from document.body.
 * Returns 0 if not in browser, attribute not set, or value is invalid.
 */
function getScrollLockCount(): number {
  if (typeof document === 'undefined') return 0;
  const count = parseInt(document.body.getAttribute(SCROLL_LOCK_ATTR) || '0', 10);
  // Guard against NaN (defensive programming)
  return isNaN(count) ? 0 : count;
}

/**
 * Sets the scroll lock count on document.body and manages overflow style.
 * Clamps to 0 if count would go negative (defensive programming).
 */
function setScrollLockCount(count: number): void {
  if (typeof document === 'undefined') return;
  // Clamp to 0 to prevent negative counts from cleanup edge cases
  const safeCount = Math.max(0, count);
  if (safeCount > 0) {
    document.body.setAttribute(SCROLL_LOCK_ATTR, String(safeCount));
    document.body.style.overflow = 'hidden';
  } else {
    document.body.removeAttribute(SCROLL_LOCK_ATTR);
    document.body.style.overflow = '';
  }
}

/**
 * Props for the BottomSheet component
 */
interface BottomSheetProps {
  /** Whether the bottom sheet is open */
  isOpen: boolean;
  /** Called when the sheet should close */
  onClose: () => void;
  /** Optional title displayed in the header */
  title?: string;
  /** Content to render inside the sheet */
  children: ReactNode;
  /** Whether to show the drag handle on mobile (default: true) */
  showHandle?: boolean;
  /** Whether to show the close button in header (default: true) */
  showCloseButton?: boolean;
  /** Maximum width for desktop modal (default: 'max-w-lg') */
  maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl';
  /** Whether clicking backdrop should close (default: true) */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape should close (default: true) */
  closeOnEscape?: boolean;
  /** Optional footer content */
  footer?: ReactNode;
  /** Full height on mobile (default: false) - uses max-h-[90vh] otherwise */
  fullHeightMobile?: boolean;
  /** Test ID for the component */
  testId?: string;
  /** Whether to add safe area padding to footer for mobile nav (default: true) */
  safeAreaFooter?: boolean;
  /** Whether to render via React portal to document.body (default: true) */
  usePortal?: boolean;
}

/**
 * BottomSheet component that renders as a centered modal on desktop
 * and a bottom sheet on mobile devices.
 *
 * Features:
 * - Slides up from bottom on mobile (<768px)
 * - Renders as centered modal on desktop
 * - Swipe-down to dismiss gesture on mobile
 * - Escape key to close
 * - Backdrop click to close
 * - Consistent styling with existing modals
 *
 * @example
 * ```tsx
 * <BottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Select Color"
 * >
 *   <ColorPicker />
 * </BottomSheet>
 * ```
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showHandle = true,
  showCloseButton = true,
  maxWidth = 'max-w-lg',
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  fullHeightMobile = false,
  testId = 'bottom-sheet',
  safeAreaFooter = false,
  usePortal = true,
}: BottomSheetProps) {
  const isMobile = useIsMobile();

  // Check if we're in browser environment (avoids SSR issues without flash)
  const canUsePortal = usePortal && typeof window !== 'undefined';

  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const canSwipe = useRef(false); // Only true when touch starts on handle

  // Handle escape key to close and Tab key for focus trapping
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      // Focus trapping: Cycle focus within the modal when Tab is pressed
      if (event.key === 'Tab' && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: If on first element, cycle to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: If on last element, cycle to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [onClose, closeOnEscape]
  );

  // Track whether this instance incremented the scroll lock counter
  const didIncrementScrollLockRef = useRef(false);
  // Track whether we've done initial focus (prevents re-focusing on every render)
  const didInitialFocusRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sheet is open (using DOM-based counter for multiple modals)
      setScrollLockCount(getScrollLockCount() + 1);
      didIncrementScrollLockRef.current = true;

      // Focus trapping: Focus the sheet when opened - only on initial open
      // This prevents re-focusing when handleKeyDown changes due to parent re-renders
      if (!didInitialFocusRef.current && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          // Focus the close button or first focusable element
          focusableElements[0].focus();
        }
        didInitialFocusRef.current = true;
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Only decrement if we actually incremented (prevents negative counts)
      if (didIncrementScrollLockRef.current) {
        setScrollLockCount(getScrollLockCount() - 1);
        didIncrementScrollLockRef.current = false;
      }
    };
  }, [isOpen, handleKeyDown]);

  // Reset initial focus ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      didInitialFocusRef.current = false;
    }
  }, [isOpen]);

  // Handle backdrop click to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && closeOnBackdrop) {
        onClose();
      }
    },
    [onClose, closeOnBackdrop]
  );

  // Touch handlers for swipe-to-dismiss on mobile
  // Only triggered when touch starts on the drag handle area
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !showHandle) return;

      // Only enable swipe if touch started on the handle area
      const target = e.target as HTMLElement;
      const isOnHandle = handleRef.current?.contains(target) ?? false;
      canSwipe.current = isOnHandle;

      if (!isOnHandle) return;

      const touch = e.touches[0];
      if (!touch) return; // Safety check for touch event

      dragStartY.current = touch.clientY;
      dragCurrentY.current = touch.clientY;
      isDragging.current = false;
    },
    [isMobile, showHandle]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Only process if swipe was started from handle
      if (!isMobile || !canSwipe.current || dragStartY.current === null || !showHandle) return;

      const touch = e.touches[0];
      if (!touch) return; // Safety check for touch event

      const deltaY = touch.clientY - dragStartY.current;
      dragCurrentY.current = touch.clientY;

      // Only start dragging if moved down past threshold
      if (deltaY > SWIPE_START_THRESHOLD) {
        isDragging.current = true;
      }

      // Apply transform while dragging
      if (isDragging.current && sheetRef.current && deltaY > 0) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
        sheetRef.current.style.transition = 'none';
      }
    },
    [isMobile, showHandle]
  );

  const handleTouchEnd = useCallback(() => {
    // Only process if swipe was started from handle
    if (!isMobile || !canSwipe.current || dragStartY.current === null || !showHandle) return;

    const deltaY = (dragCurrentY.current ?? 0) - dragStartY.current;

    // If dragged past dismiss threshold, close the sheet
    if (deltaY > SWIPE_DISMISS_THRESHOLD) {
      onClose();
    }

    // Reset sheet position
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }

    dragStartY.current = null;
    dragCurrentY.current = null;
    isDragging.current = false;
    canSwipe.current = false;
  }, [isMobile, showHandle, onClose]);

  if (!isOpen) return null;

  // Build sheet content based on mobile/desktop
  let sheetContent: React.ReactNode;

  if (isMobile) {
    // Mobile: Bottom sheet that slides up
    sheetContent = (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleBackdropClick}
        data-testid={`${testId}-backdrop`}
      >
        <div
          ref={sheetRef}
          className={`fixed left-0 right-0 bottom-0 bg-white dark:bg-gray-800
                     rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-out
                     ${fullHeightMobile ? 'top-4' : 'max-h-[90vh]'}
                     flex flex-col animate-slide-up`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? `${testId}-title` : undefined}
          data-testid={testId}
        >
          {/* Drag Handle - touch here to swipe-dismiss */}
          {showHandle && (
            <div
              ref={handleRef}
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              {title ? (
                <h2
                  id={`${testId}-title`}
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors touch-manipulation"
                  aria-label="Close"
                  data-testid={`${testId}-close-button`}
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {children}
          </div>

          {/* Footer - optionally with safe area padding (disabled by default for overlays) */}
          {footer && (
            <div className={`px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${safeAreaFooter ? 'pb-24' : ''}`}>
              {footer}
            </div>
          )}
          {/* Safe area spacer when no footer but safe area is explicitly requested */}
          {!footer && safeAreaFooter && (
            <div className="pb-20" />
          )}
        </div>
      </div>
    );
  } else {
    // Desktop: Centered modal
    sheetContent = (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
        data-testid={`${testId}-backdrop`}
      >
        <div
          ref={sheetRef}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${maxWidth} w-full mx-4
                     max-h-[90vh] flex flex-col animate-fade-in`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? `${testId}-title` : undefined}
          data-testid={testId}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              {title ? (
                <h2
                  id={`${testId}-title`}
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Close"
                  data-testid={`${testId}-close-button`}
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">{footer}</div>
          )}
        </div>
      </div>
    );
  }

  // Render via portal if enabled and in browser environment
  if (canUsePortal) {
    return ReactDOM.createPortal(sheetContent, document.body);
  }

  return sheetContent;
}
