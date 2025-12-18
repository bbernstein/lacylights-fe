"use client";

import { useEffect, useRef, useState } from "react";

export interface ContextMenuOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onDismiss: () => void;
}

/**
 * A context menu component that appears at a specific position.
 * Dismisses when clicking outside or pressing Escape.
 */
export default function ContextMenu({
  x,
  y,
  options,
  onDismiss,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef(true); // Track if menu was just opened
  const mountedRef = useRef(true); // Track if component is mounted

  // Calculate position to avoid menu going off-screen
  const [position, setPosition] = useState({ x, y });

  // Reset justOpenedRef and position when menu coordinates change (new menu instance)
  useEffect(() => {
    justOpenedRef.current = true;
    setPosition({ x, y });
  }, [x, y]);

  // Handle click outside to close menu
  useEffect(() => {
    mountedRef.current = true;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      // Ignore clicks if menu was just opened (prevents immediate dismissal)
      if (justOpenedRef.current) {
        justOpenedRef.current = false;
        return;
      }

      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    // Use requestAnimationFrame to add listeners on next frame
    // This ensures the opening event has finished processing
    const rafId = requestAnimationFrame(() => {
      // Only add listeners if component is still mounted
      if (mountedRef.current) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }
    });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafId);
      // Always remove event listeners
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onDismiss]);

  // Adjust position after render based on actual menu size to prevent off-screen display
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Check if menu goes off right edge
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Check if menu goes off bottom edge
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      // Ensure menu doesn't go off left or top edge
      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => {
            if (!option.disabled) {
              option.onClick();
              onDismiss();
            }
          }}
          disabled={option.disabled}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            option.className || "text-gray-700 dark:text-gray-200"
          }`}
          role="menuitem"
        >
          {option.icon && <span className="shrink-0">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
