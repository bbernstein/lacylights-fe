/**
 * WebSocket Configuration Constants
 *
 * These constants control WebSocket connection behavior including keepalive intervals,
 * staleness detection, and reconnection logic.
 */

/**
 * WebSocket connection configuration
 */
export const WEBSOCKET_CONFIG = {
  /**
   * Interval for server keepalive pings (in milliseconds)
   * Reduced from 30s to prevent proxy/network timeouts
   */
  KEEPALIVE_INTERVAL: 12000, // 12 seconds

  /**
   * Time threshold to flag a connection as stale (in milliseconds)
   * If no messages received within this time, connection is considered stale
   */
  STALE_THRESHOLD: 20000, // 20 seconds

  /**
   * Interval for checking connection health (in milliseconds)
   */
  HEARTBEAT_CHECK_INTERVAL: 5000, // 5 seconds

  /**
   * Time threshold to force reconnection (in milliseconds)
   * If connection is stale for this long, force a reconnect
   */
  FORCE_RECONNECT_THRESHOLD: 30000, // 30 seconds
} as const;

/**
 * WebSocket connection states
 */
export type ConnectionState =
  | 'disconnected' // No connection to server
  | 'connecting' // Initial connection attempt in progress
  | 'connected' // Successfully connected and healthy
  | 'reconnecting' // Attempting to reconnect after disconnect
  | 'error'; // Connection error occurred
