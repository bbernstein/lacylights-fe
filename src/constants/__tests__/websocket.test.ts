import { WEBSOCKET_CONFIG, ConnectionState } from '../websocket';

describe('WebSocket Constants', () => {
  describe('WEBSOCKET_CONFIG', () => {
    it('should have correct keepalive interval', () => {
      expect(WEBSOCKET_CONFIG.KEEPALIVE_INTERVAL).toBe(12000);
    });

    it('should have correct stale threshold', () => {
      expect(WEBSOCKET_CONFIG.STALE_THRESHOLD).toBe(20000);
    });

    it('should have correct heartbeat check interval', () => {
      expect(WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL).toBe(5000);
    });

    it('should have correct force reconnect threshold', () => {
      expect(WEBSOCKET_CONFIG.FORCE_RECONNECT_THRESHOLD).toBe(30000);
    });

    it('should have stale threshold greater than keepalive interval', () => {
      expect(WEBSOCKET_CONFIG.STALE_THRESHOLD).toBeGreaterThan(
        WEBSOCKET_CONFIG.KEEPALIVE_INTERVAL
      );
    });

    it('should have force reconnect threshold greater than stale threshold', () => {
      expect(WEBSOCKET_CONFIG.FORCE_RECONNECT_THRESHOLD).toBeGreaterThan(
        WEBSOCKET_CONFIG.STALE_THRESHOLD
      );
    });

    it('should have heartbeat check interval less than stale threshold', () => {
      expect(WEBSOCKET_CONFIG.HEARTBEAT_CHECK_INTERVAL).toBeLessThan(
        WEBSOCKET_CONFIG.STALE_THRESHOLD
      );
    });
  });

  describe('ConnectionState type', () => {
    it('should accept valid connection states', () => {
      const states: ConnectionState[] = [
        'disconnected',
        'connecting',
        'connected',
        'reconnecting',
        'error',
      ];

      states.forEach((state) => {
        expect(state).toBeDefined();
      });
    });
  });
});
