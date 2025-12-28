import { renderHook, act } from '@testing-library/react';
import { useKeyboardAware, useKeyboardOffset, useIsKeyboardVisible } from '../useKeyboardAware';

// Mock useIsMobile hook
jest.mock('../useMediaQuery', () => ({
  useIsMobile: jest.fn(() => true), // Default to mobile
}));

import { useIsMobile } from '../useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

describe('useKeyboardAware', () => {
  let originalInnerHeight: number;
  let mockVisualViewport: {
    height: number;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  } | null;
  let visualViewportListeners: Map<string, ((event: Event) => void)[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(true);
    originalInnerHeight = window.innerHeight;
    visualViewportListeners = new Map();

    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    // Mock Visual Viewport API
    mockVisualViewport = {
      height: 800,
      addEventListener: jest.fn((event: string, listener: (event: Event) => void) => {
        if (!visualViewportListeners.has(event)) {
          visualViewportListeners.set(event, []);
        }
        visualViewportListeners.get(event)!.push(listener);
      }),
      removeEventListener: jest.fn((event: string, listener: (event: Event) => void) => {
        const listeners = visualViewportListeners.get(event);
        if (listeners) {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      }),
    };

    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: mockVisualViewport,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    visualViewportListeners.clear();
  });

  /**
   * Helper to trigger visual viewport resize
   */
  const triggerViewportResize = (newHeight: number) => {
    if (mockVisualViewport) {
      mockVisualViewport.height = newHeight;
    }
    const listeners = visualViewportListeners.get('resize');
    if (listeners) {
      listeners.forEach(listener => {
        listener(new Event('resize'));
      });
    }
  };

  describe('useKeyboardAware hook', () => {
    it('should return initial state with keyboard not visible', () => {
      const { result } = renderHook(() => useKeyboardAware());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.visibleHeight).toBe(800);
    });

    it('should detect keyboard when viewport shrinks by more than 150px', () => {
      const { result } = renderHook(() => useKeyboardAware());

      expect(result.current.isVisible).toBe(false);

      // Simulate keyboard opening (viewport shrinks by 300px)
      act(() => {
        triggerViewportResize(500);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.keyboardHeight).toBe(300);
      expect(result.current.visibleHeight).toBe(500);
    });

    it('should not detect keyboard for small viewport changes', () => {
      const { result } = renderHook(() => useKeyboardAware());

      // Simulate small viewport change (100px - less than threshold)
      act(() => {
        triggerViewportResize(700);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
    });

    it('should detect keyboard closing when viewport expands', () => {
      const { result } = renderHook(() => useKeyboardAware());

      // Open keyboard
      act(() => {
        triggerViewportResize(500);
      });

      expect(result.current.isVisible).toBe(true);

      // Close keyboard
      act(() => {
        triggerViewportResize(800);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
    });

    it('should return desktop state when not on mobile', () => {
      mockUseIsMobile.mockReturnValue(false);

      const { result } = renderHook(() => useKeyboardAware());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
      // visibleHeight should still be window.innerHeight on desktop
      expect(result.current.visibleHeight).toBe(800);
    });

    it('should add Visual Viewport event listeners on mount', () => {
      renderHook(() => useKeyboardAware());

      expect(mockVisualViewport?.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(mockVisualViewport?.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });

    it('should remove Visual Viewport event listeners on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardAware());

      unmount();

      expect(mockVisualViewport?.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(mockVisualViewport?.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });

    it('should handle focus events on mobile', () => {
      jest.useFakeTimers();

      renderHook(() => useKeyboardAware());

      // Create and focus an input element
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Trigger focusin event
      act(() => {
        const focusEvent = new FocusEvent('focusin', {
          bubbles: true,
          relatedTarget: null,
        });
        Object.defineProperty(focusEvent, 'target', { value: input });
        document.dispatchEvent(focusEvent);
      });

      // Simulate keyboard appearing after focus
      act(() => {
        triggerViewportResize(500);
        jest.advanceTimersByTime(300);
      });

      // Cleanup
      document.body.removeChild(input);
      jest.useRealTimers();
    });

    it('should handle focusout events on mobile', () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useKeyboardAware());

      // Open keyboard first
      act(() => {
        triggerViewportResize(500);
      });

      expect(result.current.isVisible).toBe(true);

      // Trigger focusout event
      act(() => {
        const focusEvent = new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: null,
        });
        document.dispatchEvent(focusEvent);
      });

      // Simulate keyboard closing
      act(() => {
        triggerViewportResize(800);
        jest.advanceTimersByTime(300);
      });

      expect(result.current.isVisible).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('useKeyboardAware fallback behavior', () => {
    beforeEach(() => {
      // Remove Visual Viewport API
      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: null,
      });
    });

    it('should fall back to window resize events without Visual Viewport API', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useKeyboardAware());

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove window resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardAware());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('useKeyboardOffset hook', () => {
    it('should return 0 when keyboard is not visible', () => {
      const { result } = renderHook(() => useKeyboardOffset());

      expect(result.current).toBe(0);
    });

    it('should return keyboard height when keyboard is visible', () => {
      const { result } = renderHook(() => useKeyboardOffset());

      // Simulate keyboard opening
      act(() => {
        triggerViewportResize(500);
      });

      expect(result.current).toBe(300);
    });
  });

  describe('useIsKeyboardVisible hook', () => {
    it('should return false when keyboard is not visible', () => {
      const { result } = renderHook(() => useIsKeyboardVisible());

      expect(result.current).toBe(false);
    });

    it('should return true when keyboard is visible', () => {
      const { result } = renderHook(() => useIsKeyboardVisible());

      // Simulate keyboard opening
      act(() => {
        triggerViewportResize(500);
      });

      expect(result.current).toBe(true);
    });
  });
});

describe('useKeyboardAware desktop behavior', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it('should not add focus event listeners on desktop', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    renderHook(() => useKeyboardAware());

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('focusin', expect.any(Function));
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('focusout', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });
});
