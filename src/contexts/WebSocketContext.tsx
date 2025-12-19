'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { WEBSOCKET_CONFIG, ConnectionState } from '@/constants/websocket';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { wsClient } from '@/lib/apollo-client';

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
   * Manually trigger a reconnection
   */
  const reconnect = useCallback(() => {
    if (!wsClient || typeof window === 'undefined') {
      // No WebSocket client exists yet, nothing to reconnect
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebSocket] Manual reconnect triggered');
    }

    // Dispose the current client
    wsClient.dispose();

    // Set to disconnected state since reconnection only happens on next subscription (lazy mode)
    // The 'reconnecting' state would be misleading as the connection won't be re-established
    // until a component actually creates a new subscription
    setConnectionState('disconnected');
  }, []);

  /**
   * Manually disconnect
   */
  const disconnect = useCallback(() => {
    if (!wsClient || typeof window === 'undefined') {
      // No WebSocket client exists, nothing to disconnect
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebSocket] Manual disconnect triggered');
    }

    wsClient.dispose();
    setConnectionState('disconnected');
  }, []);

  /**
   * Heartbeat monitoring
   * Checks connection health at regular intervals
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastMessageTime && connectionState === 'connected') {
        const timeSinceLastMessage = Date.now() - lastMessageTime;

        // Update stale state
        if (timeSinceLastMessage > WEBSOCKET_CONFIG.STALE_THRESHOLD) {
          setIsStale(true);

          // Force reconnect if stale for too long
          if (timeSinceLastMessage > WEBSOCKET_CONFIG.FORCE_RECONNECT_THRESHOLD) {
            reconnect();
          }
        }
      }
    }, WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [lastMessageTime, connectionState, reconnect]);

  /**
   * Page visibility integration
   * Reconnect when user returns to tab if connection is stale
   */
  useEffect(() => {
    if (isVisible && wasHidden.current && wsClient) {
      // User just returned to tab and wsClient exists
      const timeSinceLastMessage = lastMessageTime ? Date.now() - lastMessageTime : Infinity;

      // Reconnect if connection is stale or not connected
      if (
        timeSinceLastMessage > WEBSOCKET_CONFIG.STALE_THRESHOLD ||
        connectionState !== 'connected'
      ) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[WebSocket] Page became visible, reconnecting...');
        }
        reconnect();
      }
    }
    wasHidden.current = !isVisible;
  }, [isVisible, lastMessageTime, connectionState, reconnect]);

  const contextValue: WebSocketContextType = {
    connectionState,
    lastMessageTime,
    isStale,
    reconnect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
