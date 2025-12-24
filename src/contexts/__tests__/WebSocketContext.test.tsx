import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { WebSocketProvider, useWebSocket } from '../WebSocketContext';
import { WEBSOCKET_CONFIG } from '@/constants/websocket';

// Mock the apollo-client module
const mockReconnectWebSocket = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/apollo-client', () => ({
  reconnectWebSocket: () => mockReconnectWebSocket(),
}));

// Mock the usePageVisibility hook
jest.mock('@/hooks/usePageVisibility', () => ({
  usePageVisibility: jest.fn(() => true),
}));

describe('WebSocketContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockReconnectWebSocket.mockResolvedValue(undefined);

    // Mock document.hidden for page visibility
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <WebSocketProvider>{children}</WebSocketProvider>
  );

  describe('useWebSocket hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      console.error = originalError;
    });

    it('should return context when used inside provider', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('connectionState');
      expect(result.current).toHaveProperty('lastMessageTime');
      expect(result.current).toHaveProperty('isStale');
      expect(result.current).toHaveProperty('reconnect');
      expect(result.current).toHaveProperty('disconnect');
      expect(result.current).toHaveProperty('ensureConnection');
    });
  });

  describe('Connection state management', () => {
    it('should start with disconnected state', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.lastMessageTime).toBeNull();
      expect(result.current.isStale).toBe(false);
    });

    it('should update state when ws-connected event is dispatched', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
      });

      expect(result.current.connectionState).toBe('connected');
    });

    it('should update state when ws-closed event is dispatched', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
      });

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-closed'));
      });

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should update state when ws-error event is dispatched', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-error'));
      });

      expect(result.current.connectionState).toBe('error');
    });

    it('should update lastMessageTime when ws-message event is dispatched', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      const beforeTime = Date.now();

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      expect(result.current.lastMessageTime).toBeGreaterThanOrEqual(beforeTime);
      expect(result.current.lastMessageTime).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Heartbeat monitoring', () => {
    it('should mark connection as stale after STALE_THRESHOLD', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      expect(result.current.isStale).toBe(false);

      // Advance time past STALE_THRESHOLD to trigger heartbeat check
      act(() => {
        jest.advanceTimersByTime(WEBSOCKET_CONFIG.STALE_THRESHOLD + WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL);
      });

      expect(result.current.isStale).toBe(true);
    });

    it('should reset stale flag when new message arrives', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      // Advance time to make it stale
      act(() => {
        jest.advanceTimersByTime(WEBSOCKET_CONFIG.STALE_THRESHOLD + 1000);
      });

      // Send another message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      expect(result.current.isStale).toBe(false);
    });

    it('should NOT force reconnect even after FORCE_RECONNECT_THRESHOLD (trusts graphql-ws)', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      // Advance time past FORCE_RECONNECT_THRESHOLD to trigger heartbeat check
      act(() => {
        jest.advanceTimersByTime(WEBSOCKET_CONFIG.FORCE_RECONNECT_THRESHOLD + WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL);
      });

      // Should NOT call reconnect - we trust graphql-ws to auto-reconnect
      // Calling reconnectWebSocket would orphan existing subscriptions
      expect(mockReconnectWebSocket).not.toHaveBeenCalled();
      // State should still be connected (will become stale via heartbeat check)
      expect(result.current.connectionState).toBe('connected');
      expect(result.current.isStale).toBe(true);
    });
  });

  describe('Manual controls', () => {
    it('should reconnect when reconnect is called', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
      });

      act(() => {
        result.current.reconnect();
      });

      expect(mockReconnectWebSocket).toHaveBeenCalled();
      // State is set to 'reconnecting' to prevent duplicate reconnection attempts
      expect(result.current.connectionState).toBe('reconnecting');
    });

    it('should disconnect when disconnect is called', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
      });

      act(() => {
        result.current.disconnect();
      });

      // disconnect now just sets state to disconnected (doesn't call reconnect)
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('ensureConnection', () => {
    it('should resolve immediately when connected and not stale', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      expect(result.current.connectionState).toBe('connected');
      expect(result.current.isStale).toBe(false);

      // ensureConnection should resolve immediately
      let resolved = false;
      await act(async () => {
        await result.current.ensureConnection();
        resolved = true;
      });

      expect(resolved).toBe(true);
      // Should not trigger a reconnect when already connected
      expect(mockReconnectWebSocket).not.toHaveBeenCalled();
    });

    it('should wait for ws-connected when stale (trusts graphql-ws auto-reconnect)', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      // Advance time to make it stale
      act(() => {
        jest.advanceTimersByTime(WEBSOCKET_CONFIG.STALE_THRESHOLD + WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL);
      });

      expect(result.current.isStale).toBe(true);

      // Start ensureConnection
      let resolved = false;
      const promise = act(async () => {
        const ensurePromise = result.current.ensureConnection();

        // Simulate connection restored (by graphql-ws auto-reconnect)
        act(() => {
          window.dispatchEvent(new CustomEvent('ws-connected'));
        });

        await ensurePromise;
        resolved = true;
      });

      await promise;
      expect(resolved).toBe(true);
      // Should NOT have called reconnectWebSocket - we wait for graphql-ws auto-reconnect
      expect(mockReconnectWebSocket).not.toHaveBeenCalled();
    });

    it('should wait for ws-connected when disconnected (trusts graphql-ws auto-reconnect)', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.connectionState).toBe('disconnected');

      // Start ensureConnection
      let resolved = false;
      const promise = act(async () => {
        const ensurePromise = result.current.ensureConnection();

        // Simulate connection established (by graphql-ws auto-reconnect)
        act(() => {
          window.dispatchEvent(new CustomEvent('ws-connected'));
        });

        await ensurePromise;
        resolved = true;
      });

      await promise;
      expect(resolved).toBe(true);
      // Should NOT have called reconnectWebSocket
      expect(mockReconnectWebSocket).not.toHaveBeenCalled();
    });

    it('should resolve after timeout if connection is not restored', async () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.connectionState).toBe('disconnected');

      // Start ensureConnection
      let resolved = false;
      const promise = act(async () => {
        const ensurePromise = result.current.ensureConnection();

        // Advance time to trigger timeout (3 seconds)
        jest.advanceTimersByTime(3000);

        await ensurePromise;
        resolved = true;
      });

      await promise;
      // Should resolve even without connection (timeout fallback)
      expect(resolved).toBe(true);
    });
  });

  describe('Page visibility integration', () => {
    it('should NOT reconnect when page becomes visible (trusts graphql-ws auto-reconnect)', async () => {
      const usePageVisibility = require('@/hooks/usePageVisibility').usePageVisibility;
      let isVisible = false;
      usePageVisibility.mockImplementation(() => isVisible);

      const { rerender } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a message while page is hidden
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      // Simulate page becoming hidden
      isVisible = false;
      rerender();

      // Advance time to make connection stale
      act(() => {
        jest.advanceTimersByTime(WEBSOCKET_CONFIG.STALE_THRESHOLD + 1000);
      });

      // Simulate page becoming visible
      isVisible = true;
      rerender();

      // Should NOT call reconnect - we trust graphql-ws to auto-reconnect
      // Calling reconnectWebSocket would orphan existing subscriptions
      expect(mockReconnectWebSocket).not.toHaveBeenCalled();
    });

    it('should not reconnect when page becomes visible if connection is healthy', () => {
      const usePageVisibility = require('@/hooks/usePageVisibility').usePageVisibility;
      let isVisible = false;
      usePageVisibility.mockImplementation(() => isVisible);

      const { rerender } = renderHook(() => useWebSocket(), { wrapper });

      // Connect and send a recent message
      act(() => {
        window.dispatchEvent(new CustomEvent('ws-connected'));
        window.dispatchEvent(new CustomEvent('ws-message'));
      });

      // Simulate page becoming visible (without being hidden first in this render)
      isVisible = true;
      rerender();

      // Should not reconnect because connection is healthy
      expect(mockReconnectWebSocket).not.toHaveBeenCalled();
    });
  });

  describe('Event listener cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useWebSocket(), { wrapper });
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('ws-connected', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('ws-closed', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('ws-error', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('ws-message', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
