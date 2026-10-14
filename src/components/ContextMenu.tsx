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
  /**
   * Move keyboard focus into the menu (first enabled item) when it opens and
   * restore it to the previously focused element when it closes. Use for
   * menus opened from a button so keyboard users can reach the items.
   */
  autoFocus?: boolean;
  /**
   * Cover the page with a transparent layer while the menu is open. A tap or
   * click on it only dismisses the menu: it never reaches the control
   * underneath (no click-through or ghost click on touch screens), and a
   * second tap on the button that opened the menu closes it instead of
   * reopening it. Use for menus opened from a button inside dialogs and
   * sheets, where an outside tap should not also close the dialog.
   */
  backdrop?: boolean;
}

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/**
 * A context menu component that appears at a specific position.
 * Dismisses when clicking or tapping outside, pressing Escape, scrolling
 * anything behind it, or resizing / rotating the viewport (it is fixed at
 * the coordinates it opened at, so it would otherwise drift away from the
 * element it belongs to).
 *
 * Keyboard: Arrow Up/Down, Home and End move between enabled items; Escape
 * and Tab dismiss the menu. Key presses handled inside the menu don't
 * propagate, so an enclosing dialog's Escape/focus-trap handlers don't also
 * react to them.
 */
export default function ContextMenu({
  x,
  y,
  options,
  onDismiss,
  autoFocus = false,
  backdrop = false,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef(true); // Track if menu was just opened

  // Calculate position to avoid menu going off-screen
  const [position, setPosition] = useState({ x, y });

  // Reset justOpenedRef and position when menu coordinates change (new menu instance)
  useEffect(() => {
    justOpenedRef.current = true;
    setPosition({ x, y });
  }, [x, y]);

  // Move focus into the menu on open and restore it on close (opt-in).
  useEffect(() => {
    if (!autoFocus) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // preventScroll: the menu is fixed-positioned, and a focus-induced scroll
    // would dismiss it straight away (see the scroll listener below).
    menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus({ preventScroll: true });
    const menu = menuRef.current;
    return () => {
      // Only restore when focus would otherwise be lost (inside the menu or
      // on <body>), never stealing it from somewhere the user moved to.
      const active = document.activeElement;
      const focusLost = !active || active === document.body || (menu?.contains(active) ?? false);
      if (focusLost && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [autoFocus]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [],
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (e.key) {
      case 'ArrowDown':
        next = current < 0 ? 0 : (current + 1) % items.length;
        break;
      case 'ArrowUp':
        next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      case 'Escape':
      case 'Tab':
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
        return;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (items.length > 0) items[next].focus();
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as Node;
      // Presses on the backdrop are not "outside": its click handler dismisses
      // the menu once the press ends, so nothing underneath receives the tap.
      if (backdropRef.current?.contains(target)) return;

      // Ignore the first event after opening (prevents immediate dismissal).
      // Every real press starts with pointerdown, so this consumes the
      // pointerdown and the same press's touchstart / mousedown dismisses:
      // the first tap or click outside closes the menu.
      if (justOpenedRef.current) {
        justOpenedRef.current = false;
        return;
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        onDismiss();
      }
    };

    // Scrolling anything behind the menu (the page or a list it was opened
    // from) or resizing / rotating the viewport would leave the fixed menu
    // floating away from its row, so close it instead.
    const handleScroll = (e: Event) => {
      const target = e.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      onDismiss();
    };
    const handleResize = () => onDismiss();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    // Use requestAnimationFrame to add listeners on next frame
    // This ensures the opening event has finished processing
    // cancelAnimationFrame in cleanup prevents callback execution if unmounted
    const rafId = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", handleClickOutside);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
      document.addEventListener("keydown", handleEscape);
      // Capture: scroll events don't bubble, so listen on the way down.
      document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);
    });

    return () => {
      cancelAnimationFrame(rafId);
      // Always remove event listeners
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
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

      // Only update position if it actually changed to avoid unnecessary re-renders
      setPosition((prevPosition) => {
        if (prevPosition.x === adjustedX && prevPosition.y === adjustedY) {
          return prevPosition;
        }
        return { x: adjustedX, y: adjustedY };
      });
    }
  }, [x, y]);

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
      style={{ left: position.x, top: position.y }}
      role="menu"
      onKeyDown={handleMenuKeyDown}
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
          aria-disabled={option.disabled}
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

  if (!backdrop) return menu;

  return (
    <>
      {/* Transparent layer under the menu: a tap on it only closes the menu.
          stopPropagation keeps the click from reaching React ancestors (e.g. a
          dialog's own backdrop handler when the menu is portaled from it). */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[9998]"
        aria-hidden="true"
        data-testid="context-menu-backdrop"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      />
      {menu}
    </>
  );
}
