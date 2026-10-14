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
  /**
   * Close the menu when anything behind it scrolls. The menu is fixed at the
   * coordinates it opened at, so it would otherwise drift away from its row.
   * Opt-in: lists that scroll themselves (a cue list following the live cue)
   * would otherwise close the menu under the user's finger, and the tap meant
   * for a menu item would land on the row underneath instead.
   */
  dismissOnScroll?: boolean;
}

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/**
 * The current time on the clock the environment stamps events with
 * (`Event.timeStamp`), so it can be compared with the stamps of input events.
 */
const eventClockNow = () =>
  typeof Event === "function" ? new Event("contextmenu-opened").timeStamp : 0;

/**
 * A context menu component that appears at a specific position.
 * Dismisses when clicking or tapping outside, pressing Escape, or resizing /
 * rotating the viewport (it is fixed at the coordinates it opened at, so it
 * would otherwise drift away from the element it belongs to), and, with
 * `dismissOnScroll`, when anything behind it scrolls.
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
  dismissOnScroll = false,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  // When this menu instance opened, on the clock events are stamped with
  // (see eventClockNow), set on mount. Presses stamped earlier began before
  // the menu existed.
  const openedAtRef = useRef(0);
  // An outside press dismisses once: the pointerdown, mousedown and
  // touchstart of one press must not call onDismiss three times.
  const dismissedByPressRef = useRef(false);

  // Calculate position to avoid menu going off-screen
  const [position, setPosition] = useState({ x, y });

  // New coordinates mean a new menu instance: reset its opening time and
  // position.
  useEffect(() => {
    openedAtRef.current = eventClockNow();
    dismissedByPressRef.current = false;
    setPosition({ x, y });
  }, [x, y]);

  // Move focus into the menu on open and restore it on close (opt-in).
  useEffect(() => {
    if (!autoFocus) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // preventScroll: the menu is fixed-positioned, and a focus-induced scroll
    // would move the page under it (or, with dismissOnScroll, close it).
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

  // Close the menu on the first press outside it.
  //
  // - Listeners are attached as soon as the menu mounts, so the very first
  //   outside pointerdown dismisses (mousedown / touchstart are fallbacks for
  //   browsers without pointer events; one press dismisses only once).
  // - They listen in the capture phase on document, which runs before React's
  //   handlers on the root, so a pressed element that stops propagation of
  //   mousedown / touchstart (look board buttons, cue rows) still closes it.
  // - The press that opened the menu cannot close it: callers open on click,
  //   contextmenu, a long-press timer or touchend, all after that press's
  //   down events, and any down event stamped before the menu opened (one
  //   still being dispatched, or the mousedown / touchstart following an
  //   opening pointerdown) is ignored.
  useEffect(() => {
    const handlePressOutside = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (dismissedByPressRef.current) return;
      if (e.timeStamp < openedAtRef.current) return;
      const target = e.target as Node;
      // Presses on the backdrop are not "outside": its click handler dismisses
      // the menu once the press ends, so nothing underneath receives the tap.
      if (backdropRef.current?.contains(target)) return;

      if (menuRef.current && !menuRef.current.contains(target)) {
        dismissedByPressRef.current = true;
        onDismiss();
      }
    };

    // Scrolling anything behind the menu (the page or a list it was opened
    // from; opt-in, see dismissOnScroll) or resizing / rotating the viewport
    // would leave the fixed menu floating away from its row, so close it.
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

    const pressCapture = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", handlePressOutside, pressCapture);
    document.addEventListener("mousedown", handlePressOutside, pressCapture);
    document.addEventListener("touchstart", handlePressOutside, pressCapture);
    document.addEventListener("keydown", handleEscape);

    // Scroll and resize listeners wait a frame: scroll events are dispatched
    // once per frame, so one already queued when the menu opened (the end of
    // a momentum scroll) would otherwise close it at once.
    // cancelAnimationFrame in cleanup prevents callback execution if unmounted.
    const rafId = requestAnimationFrame(() => {
      // Capture: scroll events don't bubble, so listen on the way down.
      if (dismissOnScroll) {
        document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
      }
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);
    });

    return () => {
      cancelAnimationFrame(rafId);
      // Always remove event listeners
      document.removeEventListener("pointerdown", handlePressOutside, { capture: true });
      document.removeEventListener("mousedown", handlePressOutside, { capture: true });
      document.removeEventListener("touchstart", handlePressOutside, { capture: true });
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [onDismiss, dismissOnScroll]);

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
