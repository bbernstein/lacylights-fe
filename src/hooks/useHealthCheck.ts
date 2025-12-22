/**
 * Hook for checking server health status.
 * Uses direct fetch instead of Apollo to work even when GraphQL is partially up.
 */
import { useState, useCallback } from 'react';

export interface HealthCheckResult {
  isHealthy: boolean;
  status?: string;
  version?: string;
  gitCommit?: string;
  buildTime?: string;
  error?: string;
  timestamp?: string;
}

interface UseHealthCheckOptions {
  /** Base URL for health endpoint (defaults to window.location.origin) */
  baseUrl?: string;
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Hook for performing health checks against the server.
 * Returns a function that can be called to check health.
 */
export function useHealthCheck(options: UseHealthCheckOptions = {}) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<HealthCheckResult | null>(null);

  const checkHealth = useCallback(async (): Promise<HealthCheckResult> => {
    setIsChecking(true);

    const baseUrl = options.baseUrl || getGraphQLBaseUrl();
    const timeout = options.timeout || 5000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const result: HealthCheckResult = {
          isHealthy: data.status === 'ok',
          status: data.status,
          version: data.version,
          gitCommit: data.gitCommit,
          buildTime: data.buildTime,
          timestamp: data.timestamp,
        };
        setLastResult(result);
        setIsChecking(false);
        return result;
      }

      const result: HealthCheckResult = {
        isHealthy: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
      setLastResult(result);
      setIsChecking(false);
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setLastResult(result);
      setIsChecking(false);
      return result;
    }
  }, [options.baseUrl, options.timeout]);

  return {
    checkHealth,
    isChecking,
    lastResult,
  };
}

/**
 * Get the base URL for GraphQL/health endpoints from environment or window location.
 */
function getGraphQLBaseUrl(): string {
  // Try to get from environment variable
  const envUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (envUrl) {
    // Extract base URL from GraphQL endpoint (remove /graphql path)
    try {
      const url = new URL(envUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      // If it's a relative path like /graphql, use window.location.origin
    }
  }

  // Fall back to current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export default useHealthCheck;
