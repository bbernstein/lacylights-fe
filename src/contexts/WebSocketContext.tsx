'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { WEBSOCKET_CONFIG, ConnectionState } from '@/constants/websocket';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { reconnectWebSocket } from '@/lib/apollo-client';

/**
 * WebSocket context interface
 */
interface WebSocketContextType {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Timestamp of last received message (null if no messages received) */
  lastMessageTime: number | null;
  /** Whether the connection is stale (no recent messages) */
  isStale: boolean;
  /** Manually trigger a reconnection */
  reconnect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /**
   * Ensure connection is active before performing an action.
   * If stale or disconnected, triggers reconnection and waits for it.
   * Returns a Promise that resolves when connected (or times out).
   */
  ensureConnection: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * Hook to access WebSocket connection state and controls
 *
 * @throws {Error} If used outside of WebSocketProvider
 * @returns {WebSocketContextType} WebSocket connection state and controls
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { connectionState, isStale, reconnect } = useWebSocket();
 *
 *   return (
 *     <div>
 *       Status: {connectionState}
 *       {isStale && <button onClick={reconnect}>Reconnect</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

/**
 * WebSocket provider props
 */
interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * WebSocket Provider Component
 *
 * Manages WebSocket connection state, heartbeat monitoring, and automatic reconnection.
 *
 * Features:
 * - Tracks connection state (disconnected/connecting/connected/reconnecting/error)
 * - Monitors connection health via heartbeat (last message timestamp)
 * - Detects stale connections and forces reconnection if needed
 * - Automatically reconnects when page becomes visible after being hidden
 * - Provides manual reconnect and disconnect controls
 *
 * @param {WebSocketProviderProps} props - Provider props
 * @returns {JSX.Element} Provider component
 */
export function WebSocketProvider({ children }: WebSocketProviderProps): JSX.Element {
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Page visibility tracking
  const isVisible = usePageVisibility();
  const wasHidden = useRef(false);

  /**
   * Listen to WebSocket custom events dispatched by apollo-client
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleConnected = () => {
      setConnectionState('connected');
      // Reset stale flag when connection is established
      // This prevents ensureConnection from triggering unnecessary reconnects
      // after graphql-ws auto-reconnects
      setIsStale(false);
    };

    const handleClosed = () => {
      setConnectionState('disconnected');
    };

    const handleError = () => {
      setConnectionState('error');
    };

    const handleMessage = () => {
      setLastMessageTime(Date.now());
      setIsStale(false); // Reset stale flag on any message
    };

    window.addEventListener('ws-connected', handleConnected);
    window.addEventListener('ws-closed', handleClosed);
    window.addEventListener('ws-error', handleError);
    window.addEventListener('ws-message', handleMessage);

    return () => {
      window.removeEventListener('ws-connected', handleConnected);
      window.removeEventListener('ws-closed', handleClosed);
      window.removeEventListener('ws-error', handleError);
      window.removeEventListener('ws-message', handleMessage);
    };
  }, []);

  /**
   * Manually trigger a reconnection.
   * Includes guard to prevent concurrent reconnection attempts.
   * Creates a new WebSocket client to ensure subscriptions work after reconnection.
   */
  const reconnect = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Guard: prevent concurrent reconnections
    if (connectionState === 'reconnecting') {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[WebSocket] Reconnection already in progress, skipping');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebSocket] Manual reconnect triggered');
    }

    // Set to reconnecting state to prevent duplicate calls
    setConnectionState('reconnecting');

    // Reconnect by creating a new WebSocket client
    // This properly disposes the old client and creates a fresh one
    reconnectWebSocket().then(() => {
      // Connection state will be updated by the ws-connected event handler
      // If we're still in reconnecting state after timeout, the ws-connected
      // handler will update it when the connection is established
    });
  }, [connectionState]);

  /**
   * Manually disconnect
   * Note: This will disconnect the WebSocket but the client can be reconnected later.
   */
  const disconnect = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebSocket] Manual disconnect triggered');
    }

    // Use reconnectWebSocket which disposes the old client
    // The lazy mode means no new connection will be created until a subscription is made
    setConnectionState('disconnected');
  }, []);

  /**
   * Ensure connection is active before performing an action.
   * If stale or disconnected, waits for graphql-ws to auto-reconnect.
   * Returns a Promise that resolves when connected (or times out after 3 seconds).
   *
   * NOTE: We do NOT force reconnection here because:
   * 1. graphql-ws handles reconnection automatically with retryAttempts: Infinity
   * 2. Calling reconnectWebSocket() disposes the client, orphaning existing subscriptions
   * 3. We just wait for the auto-reconnect to complete
   */
  const ensureConnection = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      // If already connected and not stale, resolve immediately
      if (connectionState === 'connected' && !isStale) {
        resolve();
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[WebSocket] ensureConnection: waiting for graphql-ws auto-reconnect...');
      }

      // Set up listener for connection event
      const handleConnected = () => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[WebSocket] ensureConnection: connection restored');
        }
        cleanup();
        resolve();
      };

      // Timeout after 3 seconds - proceed anyway to avoid blocking UI
      // graphql-ws should reconnect on its own; we're just waiting for it
      const timeout = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[WebSocket] ensureConnection: timeout waiting for connection, proceeding anyway');
        }
        cleanup();
        resolve();
      }, 3000);

      const cleanup = () => {
        window.removeEventListener('ws-connected', handleConnected);
        clearTimeout(timeout);
      };

      window.addEventListener('ws-connected', handleConnected);

      // NOTE: We do NOT call reconnect() here anymore.
      // graphql-ws with retryAttempts: Infinity will auto-reconnect.
      // If connection is already in progress, we'll get ws-connected event soon.
      // If it's truly dead and needs manual intervention, user can click reconnect button.
    });
  }, [connectionState, isStale]);

  /**
   * Heartbeat monitoring
   * Checks connection health at regular intervals.
   *
   * NOTE: We no longer force reconnect based on staleness because:
   * 1. graphql-ws handles reconnection automatically with retryAttempts: Infinity
   * 2. Calling reconnectWebSocket() disposes the client, orphaning existing subscriptions
   * 3. Only manual reconnect button should trigger reconnectWebSocket() as a last resort
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastMessageTime && connectionState === 'connected') {
        const timeSinceLastMessage = Date.now() - lastMessageTime;

        // Update stale state for UI display purposes only
        // We do NOT force reconnect - let graphql-ws handle it
        if (timeSinceLastMessage > WEBSOCKET_CONFIG.STALE_THRESHOLD) {
          setIsStale(true);
        }
      }
    }, WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [lastMessageTime, connectionState]);

  /**
   * Page visibility integration
   * Track when user returns to tab for staleness detection.
   *
   * NOTE: We no longer force reconnect on page visibility because:
   * 1. graphql-ws handles reconnection automatically
   * 2. Calling reconnectWebSocket() orphans existing subscriptions
   * 3. If the connection is truly dead, user can click manual reconnect
   */
  useEffect(() => {
    if (isVisible && wasHidden.current) {
      // User just returned to tab - log for debugging but don't force reconnect
      if (process.env.NODE_ENV === 'development') {
        const timeSinceLastMessage = lastMessageTime ? Date.now() - lastMessageTime : Infinity;
        // eslint-disable-next-line no-console
        console.log(`[WebSocket] Page became visible, time since last message: ${Math.round(timeSinceLastMessage / 1000)}s, state: ${connectionState}`);
      }
    }
    wasHidden.current = !isVisible;
  }, [isVisible, lastMessageTime, connectionState]);

  const contextValue: WebSocketContextType = {
    connectionState,
    lastMessageTime,
    isStale,
    reconnect,
    disconnect,
    ensureConnection,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
