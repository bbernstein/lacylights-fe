"use client";

import { useEffect, useRef, useState, useMemo } from "react";

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

  // Calculate initial position estimate to avoid flash
  // Use conservative estimates for menu size to prevent most off-screen cases
  const initialPosition = useMemo(() => {
    const estimatedMenuWidth = 200; // Slightly larger than min-w-[160px]
    const estimatedMenuHeight = 50 + options.length * 40; // Rough estimate based on options
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

    let adjustedX = x;
    let adjustedY = y;

    // Check if menu would go off right edge
    if (x + estimatedMenuWidth > viewportWidth) {
      adjustedX = Math.max(10, viewportWidth - estimatedMenuWidth - 10);
    }

    // Check if menu would go off bottom edge
    if (y + estimatedMenuHeight > viewportHeight) {
      adjustedY = Math.max(10, viewportHeight - estimatedMenuHeight - 10);
    }

    // Ensure menu doesn't go off left or top edge
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    return { x: adjustedX, y: adjustedY };
  }, [x, y, options.length]);

  const [position, setPosition] = useState(initialPosition);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    // Add slight delay to prevent immediate dismissal from the same click that opened the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onDismiss]);

  // Fine-tune position after actual render to handle size differences
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

      // Only update if position needs adjustment from initial estimate
      if (adjustedX !== position.x || adjustedY !== position.y) {
        setPosition({ x: adjustedX, y: adjustedY });
      }
    }
  }, [x, y, position.x, position.y]);

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
