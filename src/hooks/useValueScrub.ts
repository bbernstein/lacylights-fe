import { useCallback, useRef, useEffect, RefObject } from 'react';

/**
 * Options for the useValueScrub hook
 */
export interface UseValueScrubOptions {
  /** Current value */
  value: number;
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value */
  max: number;
  /** Callback when value changes during scrubbing */
  onChange: (value: number) => void;
  /** Callback when scrubbing completes (touch release) or after each wheel change */
  onChangeComplete?: (value: number) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /**
   * Pixels of wheel delta or touch movement per 1 unit value change.
   * Higher = slower/more precise. Default: 2 for wheel, 4 for touch.
   */
  wheelSensitivity?: number;
  touchSensitivity?: number;
  /**
   * Multiplier applied when Shift key is held (for finer control).
   * Default: 0.1 (10x slower when Shift held)
   */
  shiftMultiplier?: number;
}

/**
 * Return type for useValueScrub hook
 */
export interface UseValueScrubReturn {
  /** Props to spread on the target element for wheel events */
  wheelProps: {
    onWheel: (e: React.WheelEvent) => void;
  };
  /** Props to spread on the target element for touch scrubbing */
  touchScrubProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };
  /** Whether a touch scrub is currently active */
  isScrubbing: boolean;
  /** Ref to attach for capturing wheel events (prevents page scroll) */
  containerRef: RefObject<HTMLDivElement>;
}

// Constants for gesture detection
const DEFAULT_WHEEL_SENSITIVITY = 2; // pixels of deltaY per unit change
const DEFAULT_TOUCH_SENSITIVITY = 4; // pixels of touch movement per unit change
const DEFAULT_SHIFT_MULTIPLIER = 0.1; // 10x slower when shift held
const TOUCH_SCRUB_THRESHOLD = 5; // pixels before we consider it a scrub gesture

/**
 * Hook that enables value adjustment via trackpad scroll and touch scrubbing.
 *
 * For trackpad/mouse:
 * - Two-finger scroll (or mouse wheel) over the element adjusts the value
 * - Scroll up increases value, scroll down decreases
 * - Hold Shift for finer control
 *
 * For mobile touch:
 * - Touch and drag vertically to adjust value
 * - Drag up increases value, drag down decreases
 * - Faster drag = faster value change
 *
 * @param options - Configuration options
 * @returns Event handlers and state for the scrub gesture
 *
 * @example
 * ```tsx
 * function ValueSlider({ value, onChange }) {
 *   const { wheelProps, touchScrubProps, containerRef } = useValueScrub({
 *     value,
 *     min: 0,
 *     max: 255,
 *     onChange,
 *   });
 *
 *   return (
 *     <div ref={containerRef} {...wheelProps}>
 *       <input type="range" value={value} {...touchScrubProps} />
 *       <input type="number" value={value} {...touchScrubProps} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useValueScrub(options: UseValueScrubOptions): UseValueScrubReturn {
  const {
    value,
    min,
    max,
    onChange,
    onChangeComplete,
    disabled = false,
    wheelSensitivity = DEFAULT_WHEEL_SENSITIVITY,
    touchSensitivity = DEFAULT_TOUCH_SENSITIVITY,
    shiftMultiplier = DEFAULT_SHIFT_MULTIPLIER,
  } = options;

  // Track touch state
  const touchStartY = useRef<number | null>(null);
  const touchStartValue = useRef<number>(value);
  const isScrubbing = useRef(false);
  const accumulatedDelta = useRef(0);
  const lastValue = useRef(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep lastValue in sync and reset accumulated delta on external value changes
  useEffect(() => {
    lastValue.current = value;
    // Reset accumulation on external value changes to prevent drift
    accumulatedDelta.current = 0;
  }, [value]);

  /**
   * Clamp value to min/max bounds
   */
  const clamp = useCallback(
    (val: number): number => Math.max(min, Math.min(max, Math.round(val))),
    [min, max]
  );

  /**
   * Handle wheel events (trackpad two-finger scroll or mouse wheel)
   * Negative deltaY = scroll up = increase value
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;

      // Prevent page scrolling when over the scrub area
      e.preventDefault();
      e.stopPropagation();

      // Calculate value change from wheel delta
      // Negative deltaY means scrolling up, which should increase value
      const sensitivity = e.shiftKey
        ? wheelSensitivity / shiftMultiplier
        : wheelSensitivity;

      const delta = -e.deltaY / sensitivity;

      // Accumulate sub-unit changes for smooth adjustment
      accumulatedDelta.current += delta;

      // Only apply changes when we've accumulated at least 1 unit
      if (Math.abs(accumulatedDelta.current) >= 1) {
        const change = Math.trunc(accumulatedDelta.current);
        accumulatedDelta.current -= change;

        const newValue = clamp(lastValue.current + change);
        if (newValue !== lastValue.current) {
          lastValue.current = newValue;
          onChange(newValue);
          // For wheel events, trigger complete after each change since
          // there's no clear "end" event like touch
          onChangeComplete?.(newValue);
        }
      }
    },
    [disabled, wheelSensitivity, shiftMultiplier, clamp, onChange, onChangeComplete]
  );

  /**
   * Handle touch start - begin tracking for potential scrub gesture
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      // Only track single-finger touches for scrubbing
      if (e.touches.length !== 1) return;

      touchStartY.current = e.touches[0].clientY;
      touchStartValue.current = value;
      isScrubbing.current = false;
      accumulatedDelta.current = 0;
    },
    [disabled, value]
  );

  /**
   * Handle touch move - update value based on vertical movement
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || touchStartY.current === null) return;
      if (e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY.current - currentY; // Positive = moved up

      // Check if we've exceeded the scrub threshold
      if (!isScrubbing.current && Math.abs(deltaY) > TOUCH_SCRUB_THRESHOLD) {
        isScrubbing.current = true;

        // Provide haptic feedback on mobile when scrub starts
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }

      if (isScrubbing.current) {
        // Prevent default to avoid scrolling the page while scrubbing
        e.preventDefault();

        // Calculate new value based on movement from start position
        const valueChange = deltaY / touchSensitivity;
        const newValue = clamp(touchStartValue.current + valueChange);

        if (newValue !== lastValue.current) {
          lastValue.current = newValue;
          onChange(newValue);
        }
      }
    },
    [disabled, touchSensitivity, clamp, onChange]
  );

  /**
   * Handle touch end - finalize the scrub gesture
   */
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Capture scrubbing state before reset
      const wasScrubbing = isScrubbing.current;

      if (wasScrubbing && onChangeComplete) {
        onChangeComplete(lastValue.current);
      }

      // Reset touch tracking state
      touchStartY.current = null;
      isScrubbing.current = false;
      accumulatedDelta.current = 0;

      // Prevent the touch from triggering click on the input if we were scrubbing
      if (wasScrubbing) {
        e.preventDefault();
      }
    },
    [onChangeComplete]
  );

  /**
   * Handle touch cancel - reset state when touch is interrupted
   */
  const handleTouchCancel = useCallback(() => {
    // Reset touch tracking state without triggering onChangeComplete
    touchStartY.current = null;
    isScrubbing.current = false;
    accumulatedDelta.current = 0;
  }, []);

  // Attach passive: false wheel listener to container to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent default scrolling when wheel event occurs over our container
      e.preventDefault();
    };

    // Use passive: false to allow preventDefault
    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [disabled]);

  return {
    wheelProps: {
      onWheel: handleWheel,
    },
    touchScrubProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    isScrubbing: isScrubbing.current,
    containerRef,
  };
}
