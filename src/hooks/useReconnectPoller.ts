/**
 * Hook for polling the server health endpoint with countdown timer.
 * Used during system updates when the server may be restarting.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useHealthCheck, HealthCheckResult } from './useHealthCheck';

interface UseReconnectPollerOptions {
  /** Maximum duration to poll in milliseconds (default: 60000 = 1 minute) */
  maxDuration?: number;
  /** Interval between polls in milliseconds (default: 2000 = 2 seconds) */
  pollInterval?: number;
  /** Callback when server reconnects */
  onReconnect?: (healthInfo: HealthCheckResult) => void;
  /** Callback when timeout is reached */
  onTimeout?: () => void;
}

interface UseReconnectPollerResult {
  /** Seconds remaining until timeout */
  countdown: number;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Whether the server is back up */
  serverUp: boolean;
  /** Last health check result */
  lastResult: HealthCheckResult | null;
  /** Start polling */
  startPolling: () => void;
  /** Stop polling */
  stopPolling: () => void;
}

/**
 * Hook for polling the server during reconnection with a countdown timer.
 */
export function useReconnectPoller(
  options: UseReconnectPollerOptions = {}
): UseReconnectPollerResult {
  const {
    maxDuration = 60000,
    pollInterval = 2000,
    onReconnect,
    onTimeout,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [serverUp, setServerUp] = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(maxDuration / 1000));

  const { checkHealth, lastResult } = useHealthCheck();

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    // Clear any existing intervals first (avoid race condition with stopPolling)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Reset state
    setServerUp(false);
    setCountdown(Math.ceil(maxDuration / 1000));
    startTimeRef.current = Date.now();

    // Start countdown timer (updates every second)
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((maxDuration - elapsed) / 1000));
      setCountdown(remaining);

      // Check for timeout
      if (remaining <= 0) {
        stopPolling();
        onTimeout?.();
      }
    }, 1000);

    // Start polling
    const poll = async () => {
      const result = await checkHealth();

      if (result.isHealthy) {
        setServerUp(true);
        stopPolling();
        onReconnect?.(result);
      }
    };

    // Immediate first check
    poll();

    // Set up interval for subsequent checks
    pollIntervalRef.current = setInterval(poll, pollInterval);

    // Mark as polling (only set once, after all setup is complete)
    setIsPolling(true);
  }, [
    maxDuration,
    pollInterval,
    checkHealth,
    stopPolling,
    onReconnect,
    onTimeout,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    countdown,
    isPolling,
    serverUp,
    lastResult,
    startPolling,
    stopPolling,
  };
}

export default useReconnectPoller;
