import { renderHook, act, waitFor } from '@testing-library/react';
import { useReconnectPoller } from '../useReconnectPoller';

// Mock useHealthCheck
jest.mock('../useHealthCheck', () => ({
  useHealthCheck: () => ({
    checkHealth: jest.fn().mockResolvedValue({
      isHealthy: false,
      version: null,
      gitCommit: null,
    }),
    lastResult: null,
  }),
}));

describe('useReconnectPoller', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('starts polling when called', () => {
    it('sets isPolling to true when startPolling is called', () => {
      const { result } = renderHook(() => useReconnectPoller());

      expect(result.current.isPolling).toBe(false);

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.isPolling).toBe(true);
    });

    it('initializes countdown based on maxDuration', () => {
      const { result } = renderHook(() =>
        useReconnectPoller({ maxDuration: 30000 })
      );

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.countdown).toBe(30);
    });
  });

  describe('stops polling when server returns', () => {
    it('sets isPolling to false when stopPolling is called', () => {
      const { result } = renderHook(() => useReconnectPoller());

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.isPolling).toBe(true);

      act(() => {
        result.current.stopPolling();
      });

      expect(result.current.isPolling).toBe(false);
    });
  });

  describe('countdown decrements', () => {
    it('decrements countdown every second', () => {
      const { result } = renderHook(() =>
        useReconnectPoller({ maxDuration: 10000 })
      );

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.countdown).toBe(10);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.countdown).toBe(9);
    });
  });

  describe('cleans up on unmount', () => {
    it('stops polling when component unmounts', () => {
      const { result, unmount } = renderHook(() => useReconnectPoller());

      act(() => {
        result.current.startPolling();
      });

      expect(result.current.isPolling).toBe(true);

      unmount();

      // Intervals should be cleared (no errors thrown)
    });
  });

  describe('calls callbacks', () => {
    it('calls onTimeout when countdown reaches zero', async () => {
      const onTimeout = jest.fn();
      const { result } = renderHook(() =>
        useReconnectPoller({ maxDuration: 2000, onTimeout })
      );

      act(() => {
        result.current.startPolling();
      });

      // Advance time past the max duration
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(onTimeout).toHaveBeenCalled();
      });
    });
  });

  describe('returns correct initial values', () => {
    it('returns default values before polling starts', () => {
      const { result } = renderHook(() => useReconnectPoller());

      expect(result.current.isPolling).toBe(false);
      expect(result.current.serverUp).toBe(false);
      expect(result.current.lastResult).toBeNull();
    });
  });
});
