/**
 * WebSocket Configuration Constants
 *
 * These constants control WebSocket connection behavior including keepalive intervals,
 * staleness detection, and reconnection logic.
 *
 * Important: For cue list playback, shows can have 30+ minutes between cues.
 * The connection must remain stable during long idle periods. The graphql-ws
 * keepAlive mechanism maintains the connection; we only need to detect when
 * the connection is truly dead (not just idle).
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
   * If no messages received within this time, connection is considered stale.
   * Set to 2 minutes - beyond this, we'll show a warning indicator but NOT auto-disconnect.
   */
  STALE_THRESHOLD: 120000, // 2 minutes

  /**
   * Interval for checking connection health (in milliseconds)
   */
  HEARTBEAT_CHECK_INTERVAL: 10000, // 10 seconds

  /**
   * Time threshold to force reconnection (in milliseconds)
   * For show mode, we NEVER auto-force reconnect just because of idle time.
   * The graphql-ws library handles connection drops via keepAlive pings.
   * Set to a very high value (1 hour) to effectively disable auto-force-reconnect.
   * Users can manually reconnect via the reconnect button if needed.
   */
  FORCE_RECONNECT_THRESHOLD: 3600000, // 1 hour (effectively disabled)
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
