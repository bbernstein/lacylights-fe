import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsPortrait,
  useIsLandscape,
  BREAKPOINTS,
} from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock: jest.Mock;
  let listeners: Map<string, ((event: MediaQueryListEvent) => void)[]>;

  beforeEach(() => {
    listeners = new Map();

    matchMediaMock = jest.fn((query: string) => {
      const mediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
          if (!listeners.has(query)) {
            listeners.set(query, []);
          }
          listeners.get(query)!.push(listener);
        }),
        removeEventListener: jest.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
          const queryListeners = listeners.get(query);
          if (queryListeners) {
            const index = queryListeners.indexOf(listener);
            if (index > -1) {
              queryListeners.splice(index, 1);
            }
          }
        }),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
      return mediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    listeners.clear();
  });

  /**
   * Helper to trigger a media query change event
   * Note: Kept for potential future use; prefixed with underscore to satisfy linter
   */
  const _triggerMediaQueryChange = (query: string, matches: boolean) => {
    const queryListeners = listeners.get(query);
    if (queryListeners) {
      queryListeners.forEach(listener => {
        listener({ matches, media: query } as MediaQueryListEvent);
      });
    }
  };

  describe('useMediaQuery hook', () => {
    it('should return initial match state', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
      expect(result.current).toBe(true);
    });

    it('should return false when query does not match', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
      expect(result.current).toBe(false);
    });

    it('should update when media query changes', () => {
      let currentMatches = false;
      let changeListener: ((event: MediaQueryListEvent) => void) | null = null;

      matchMediaMock.mockReturnValue({
        matches: currentMatches,
        addEventListener: jest.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
          changeListener = listener;
        }),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        currentMatches = true;
        if (changeListener) {
          changeListener({ matches: true, media: '(max-width: 767px)' } as MediaQueryListEvent);
        }
      });

      expect(result.current).toBe(true);
    });

    it('should clean up event listener on unmount', () => {
      const removeEventListenerMock = jest.fn();
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: removeEventListenerMock,
      });

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should add event listener on mount', () => {
      const addEventListenerMock = jest.fn();
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: jest.fn(),
      });

      renderHook(() => useMediaQuery('(max-width: 767px)'));

      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should handle query changes', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === '(max-width: 500px)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      const { result, rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(max-width: 767px)' } }
      );

      expect(result.current).toBe(false);

      rerender({ query: '(max-width: 500px)' });
      expect(result.current).toBe(true);
    });
  });

  describe('useIsMobile', () => {
    it('should return true when viewport is mobile-sized', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should return false when viewport is not mobile-sized', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true when viewport is tablet-sized', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1023px)');
    });
  });

  describe('useIsDesktop', () => {
    it('should return true when viewport is desktop-sized', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)');
    });
  });

  describe('useIsPortrait', () => {
    it('should return true when device is in portrait orientation', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useIsPortrait());
      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(orientation: portrait)');
    });
  });

  describe('useIsLandscape', () => {
    it('should return true when device is in landscape orientation', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useIsLandscape());
      expect(result.current).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(orientation: landscape)');
    });
  });

  describe('BREAKPOINTS', () => {
    it('should have correct Tailwind breakpoint values', () => {
      expect(BREAKPOINTS.sm).toBe('(min-width: 640px)');
      expect(BREAKPOINTS.md).toBe('(min-width: 768px)');
      expect(BREAKPOINTS.lg).toBe('(min-width: 1024px)');
      expect(BREAKPOINTS.xl).toBe('(min-width: 1280px)');
      expect(BREAKPOINTS['2xl']).toBe('(min-width: 1536px)');
    });
  });
});

describe('useMediaQuery SSR safety', () => {
  const originalWindow = global.window;

  beforeAll(() => {
    // @ts-expect-error - Simulating SSR environment
    delete global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  it('should return false when window is undefined (SSR)', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });
});
