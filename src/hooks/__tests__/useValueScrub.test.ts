import { renderHook, act } from '@testing-library/react';
import { useValueScrub } from '../useValueScrub';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

describe('useValueScrub', () => {
  beforeEach(() => {
    mockVibrate.mockClear();
  });

  describe('wheel events', () => {
    it('should return wheel props object', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      expect(result.current.wheelProps).toHaveProperty('onWheel');
      expect(typeof result.current.wheelProps.onWheel).toBe('function');
    });

    it('should increase value when dragging up (positive deltaY with natural scrolling)', () => {
      const onChange = jest.fn();
      const onChangeComplete = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          onChangeComplete,
        })
      );

      const wheelEvent = {
        deltaY: 10, // Drag up with natural scrolling = positive deltaY
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(wheelEvent.preventDefault).toHaveBeenCalled();
      expect(wheelEvent.stopPropagation).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
      expect(onChangeComplete).toHaveBeenCalled();
      // Value should increase (drag up = increase)
      expect(onChange.mock.calls[0][0]).toBeGreaterThan(128);
    });

    it('should decrease value when dragging down (negative deltaY with natural scrolling)', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      const wheelEvent = {
        deltaY: -10, // Drag down with natural scrolling = negative deltaY
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).toHaveBeenCalled();
      // Value should decrease (drag down = decrease)
      expect(onChange.mock.calls[0][0]).toBeLessThan(128);
    });

    it('should clamp value to max bound', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 250,
          min: 0,
          max: 255,
          onChange,
        })
      );

      const wheelEvent = {
        deltaY: 100, // Large drag up = increase toward max
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).toHaveBeenCalledWith(255);
    });

    it('should clamp value to min bound', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 5,
          min: 0,
          max: 255,
          onChange,
        })
      );

      const wheelEvent = {
        deltaY: -100, // Large drag down = decrease toward min
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('should not trigger onChange when disabled', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          disabled: true,
        })
      );

      const wheelEvent = {
        deltaY: -10,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should use finer control with shift key', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          wheelSensitivity: 2,
          shiftMultiplier: 0.1,
        })
      );

      // First, drag up without shift
      const wheelEventNoShift = {
        deltaY: 20, // Drag up = positive deltaY
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEventNoShift);
      });

      const changeWithoutShift = onChange.mock.calls[0][0] - 128;

      // Reset
      onChange.mockClear();

      // Now drag up with shift
      const { result: result2 } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          wheelSensitivity: 2,
          shiftMultiplier: 0.1,
        })
      );

      const wheelEventWithShift = {
        deltaY: 20, // Drag up = positive deltaY
        shiftKey: true,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result2.current.wheelProps.onWheel(wheelEventWithShift);
      });

      const changeWithShift = onChange.mock.calls[0][0] - 128;

      // Change with shift should be smaller than without shift
      expect(Math.abs(changeWithShift)).toBeLessThan(Math.abs(changeWithoutShift));
    });

    it('should respect custom wheel sensitivity', () => {
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();

      // Low sensitivity = larger changes per scroll
      const { result: result1 } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange: onChange1,
          wheelSensitivity: 1,
        })
      );

      // High sensitivity = smaller changes per scroll
      const { result: result2 } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange: onChange2,
          wheelSensitivity: 10,
        })
      );

      const wheelEvent = {
        deltaY: -20,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result1.current.wheelProps.onWheel(wheelEvent);
      });

      act(() => {
        result2.current.wheelProps.onWheel({
          ...wheelEvent,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        } as unknown as React.WheelEvent);
      });

      // Lower sensitivity = bigger change
      const change1 = onChange1.mock.calls[0][0] - 128;
      const change2 = onChange2.mock.calls[0][0] - 128;

      expect(Math.abs(change1)).toBeGreaterThan(Math.abs(change2));
    });

    it('should invert direction when invertWheelDirection is true', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          invertWheelDirection: true,
        })
      );

      // Positive deltaY with invert = decrease value (traditional scrolling)
      const wheelEvent = {
        deltaY: 10,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).toHaveBeenCalled();
      // With invert, positive deltaY should decrease value
      expect(onChange.mock.calls[0][0]).toBeLessThan(128);
    });

    it('should increase value with negative deltaY when invertWheelDirection is true', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          invertWheelDirection: true,
        })
      );

      // Negative deltaY with invert = increase value (traditional scrolling: scroll up = increase)
      const wheelEvent = {
        deltaY: -10,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).toHaveBeenCalled();
      // With invert, negative deltaY should increase value
      expect(onChange.mock.calls[0][0]).toBeGreaterThan(128);
    });

    it('should default invertWheelDirection to false', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          // Not specifying invertWheelDirection - should default to false
        })
      );

      // Positive deltaY without invert = increase value (natural scrolling)
      const wheelEvent = {
        deltaY: 10,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      expect(onChange).toHaveBeenCalled();
      // Without invert (default), positive deltaY should increase value
      expect(onChange.mock.calls[0][0]).toBeGreaterThan(128);
    });
  });

  describe('touch scrub events', () => {
    it('should return touch scrub props object', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      expect(result.current.touchScrubProps).toHaveProperty('onTouchStart');
      expect(result.current.touchScrubProps).toHaveProperty('onTouchMove');
      expect(result.current.touchScrubProps).toHaveProperty('onTouchEnd');
    });

    it('should initialize touch tracking on touch start', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      const touchStartEvent = {
        touches: [{ clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.touchScrubProps.onTouchStart(touchStartEvent);
      });

      // Should not trigger any change on start
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not start scrub on multi-touch', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      // Multi-touch (2 fingers)
      const touchStartEvent = {
        touches: [{ clientY: 100 }, { clientY: 200 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.touchScrubProps.onTouchStart(touchStartEvent);
      });

      // Move with 2 touches
      const touchMoveEvent = {
        touches: [{ clientY: 50 }, { clientY: 150 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.touchScrubProps.onTouchMove(touchMoveEvent);
      });

      // Should not trigger any change
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should increase value when dragging up', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          touchSensitivity: 1, // 1 pixel = 1 unit for easier testing
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move up (lower Y = up)
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 50 }], // Moved up 50px
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(onChange).toHaveBeenCalled();
      // Value should increase (moved up 50px with sensitivity 1)
      expect(onChange.mock.calls[0][0]).toBeGreaterThan(128);
    });

    it('should decrease value when dragging down', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          touchSensitivity: 1,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move down (higher Y = down)
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 150 }], // Moved down 50px
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(onChange).toHaveBeenCalled();
      // Value should decrease
      expect(onChange.mock.calls[0][0]).toBeLessThan(128);
    });

    it('should clamp touch scrub to bounds', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 250,
          min: 0,
          max: 255,
          onChange,
          touchSensitivity: 1,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move up a lot
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: -100 }], // Moved up 200px
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(onChange).toHaveBeenCalledWith(255);
    });

    it('should call onChangeComplete on touch end', () => {
      const onChange = jest.fn();
      const onChangeComplete = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          onChangeComplete,
          touchSensitivity: 1,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move to trigger scrub
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 50 }],
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      // End touch
      act(() => {
        result.current.touchScrubProps.onTouchEnd({
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(onChangeComplete).toHaveBeenCalled();
    });

    it('should not trigger change when disabled', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          disabled: true,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 50 }],
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should trigger haptic feedback when scrub starts', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          touchSensitivity: 1,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move enough to trigger scrub (past threshold)
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 90 }], // Move 10px, past 5px threshold
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should not trigger scrub with small movements', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Small movement (under threshold)
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 98 }], // Only 2px, under 5px threshold
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle touch cancel by resetting state', () => {
      const onChange = jest.fn();
      const onChangeComplete = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          onChangeComplete,
          touchSensitivity: 1,
        })
      );

      // Start touch and begin scrubbing
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 50 }],
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      // Cancel the touch (e.g., system interruption)
      act(() => {
        result.current.touchScrubProps.onTouchCancel({} as React.TouchEvent);
      });

      // onChangeComplete should NOT be called on cancel
      expect(onChangeComplete).not.toHaveBeenCalled();
    });

    it('should call preventDefault on touchEnd when was scrubbing', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          touchSensitivity: 1,
        })
      );

      // Start touch
      act(() => {
        result.current.touchScrubProps.onTouchStart({
          touches: [{ clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Move to trigger scrub
      act(() => {
        result.current.touchScrubProps.onTouchMove({
          touches: [{ clientY: 50 }],
          preventDefault: jest.fn(),
        } as unknown as React.TouchEvent);
      });

      // End touch
      const preventDefaultMock = jest.fn();
      act(() => {
        result.current.touchScrubProps.onTouchEnd({
          preventDefault: preventDefaultMock,
        } as unknown as React.TouchEvent);
      });

      // preventDefault should be called because we were scrubbing
      expect(preventDefaultMock).toHaveBeenCalled();
    });
  });

  describe('container ref', () => {
    it('should return a container ref', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
        })
      );

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });

  describe('value updates', () => {
    it('should track value changes from props', () => {
      const onChange = jest.fn();
      let currentValue = 128;

      const { result, rerender } = renderHook(() =>
        useValueScrub({
          value: currentValue,
          min: 0,
          max: 255,
          onChange,
        })
      );

      // Update prop value
      currentValue = 200;
      rerender();

      // Now scroll
      const wheelEvent = {
        deltaY: -10,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      // Should be based on new value (200), not old value (128)
      expect(onChange).toHaveBeenCalled();
      const newValue = onChange.mock.calls[0][0];
      // The change should be relative to 200, so result should be > 200
      expect(newValue).toBeGreaterThan(128);
    });
  });

  describe('edge cases', () => {
    it('should not call onChange when value at min bound and trying to decrease', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 0,
          min: 0,
          max: 255,
          onChange,
        })
      );

      // Try to decrease below min (negative deltaY = decrease in natural scrolling)
      const wheelEvent = {
        deltaY: -100,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      // Should NOT call onChange since value didn't change (already at min)
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when value at max bound and trying to increase', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 255,
          min: 0,
          max: 255,
          onChange,
        })
      );

      // Try to increase above max (positive deltaY = increase in natural scrolling)
      const wheelEvent = {
        deltaY: 100,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      // Should NOT call onChange since value didn't change (already at max)
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle custom min/max values', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 50,
          min: 10,
          max: 100,
          onChange,
        })
      );

      // Scroll to decrease (negative deltaY = decrease in natural scrolling)
      const wheelEventDown = {
        deltaY: -200,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEventDown);
      });

      // Should be clamped to custom min (10)
      expect(onChange).toHaveBeenCalledWith(10);

      onChange.mockClear();

      // Create new hook at upper end
      const { result: result2 } = renderHook(() =>
        useValueScrub({
          value: 95,
          min: 10,
          max: 100,
          onChange,
        })
      );

      // Scroll to increase (positive deltaY = increase in natural scrolling)
      const wheelEventUp = {
        deltaY: 200,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result2.current.wheelProps.onWheel(wheelEventUp);
      });

      // Should be clamped to custom max (100)
      expect(onChange).toHaveBeenCalledWith(100);
    });

    it('should round values to integers', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useValueScrub({
          value: 128,
          min: 0,
          max: 255,
          onChange,
          wheelSensitivity: 3, // This will create fractional results
        })
      );

      const wheelEvent = {
        deltaY: -5, // Small scroll
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.wheelProps.onWheel(wheelEvent);
      });

      if (onChange.mock.calls.length > 0) {
        // Value should be an integer
        expect(Number.isInteger(onChange.mock.calls[0][0])).toBe(true);
      }
    });
  });
});
