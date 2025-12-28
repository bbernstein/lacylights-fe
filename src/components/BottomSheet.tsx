'use client';

import { useEffect, useCallback, useRef, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl';
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
}: BottomSheetProps) {
  const isMobile = useIsMobile();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

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
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !showHandle) return;

      const touch = e.touches[0];
      dragStartY.current = touch.clientY;
      dragCurrentY.current = touch.clientY;
      isDragging.current = false;
    },
    [isMobile, showHandle]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || dragStartY.current === null || !showHandle) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - dragStartY.current;
      dragCurrentY.current = touch.clientY;

      // Only start dragging if moved down at least 10px
      if (deltaY > 10) {
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
    if (!isMobile || dragStartY.current === null || !showHandle) return;

    const deltaY = (dragCurrentY.current ?? 0) - dragStartY.current;

    // If dragged more than 100px down, close the sheet
    if (deltaY > 100) {
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
  }, [isMobile, showHandle, onClose]);

  if (!isOpen) return null;

  // Mobile: Bottom sheet that slides up
  if (isMobile) {
    return (
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
          {/* Drag Handle */}
          {showHandle && (
            <div className="flex justify-center pt-3 pb-2 touch-none">
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

          {/* Footer */}
          {footer && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop: Centered modal
  return (
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
