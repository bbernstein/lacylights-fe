import { renderHook, act, waitFor } from '@testing-library/react';
import { useHealthCheck } from '../useHealthCheck';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useHealthCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('returns healthy status when server responds', () => {
    it('returns isHealthy true when server responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '1.0.0',
            gitCommit: 'abc123',
            buildTime: '2024-01-01T00:00:00Z',
          }),
      });

      const { result } = renderHook(() => useHealthCheck());

      await act(async () => {
        const health = await result.current.checkHealth();
        expect(health.isHealthy).toBe(true);
      });
    });

    it('includes version info when healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '2.0.0',
            gitCommit: 'def456',
            buildTime: '2024-06-15T12:00:00Z',
          }),
      });

      const { result } = renderHook(() => useHealthCheck());

      await act(async () => {
        const health = await result.current.checkHealth();
        expect(health.version).toBe('2.0.0');
        expect(health.gitCommit).toBe('def456');
      });
    });
  });

  describe('returns unhealthy status on error', () => {
    it('returns isHealthy false when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useHealthCheck());

      await act(async () => {
        const health = await result.current.checkHealth();
        expect(health.isHealthy).toBe(false);
      });
    });

    it('returns isHealthy false when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useHealthCheck());

      await act(async () => {
        const health = await result.current.checkHealth();
        expect(health.isHealthy).toBe(false);
      });
    });
  });

  describe('handles timeout', () => {
    it('handles slow responses gracefully', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ version: '1.0.0' }),
                }),
              100
            );
          })
      );

      const { result } = renderHook(() => useHealthCheck());

      await act(async () => {
        const health = await result.current.checkHealth();
        expect(health.isHealthy).toBe(true);
      });
    });
  });

  describe('updates lastResult', () => {
    it('stores the last health check result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            version: '1.0.0',
            gitCommit: 'abc123',
          }),
      });

      const { result } = renderHook(() => useHealthCheck());

      await act(async () => {
        await result.current.checkHealth();
      });

      await waitFor(() => {
        expect(result.current.lastResult).not.toBeNull();
        expect(result.current.lastResult?.isHealthy).toBe(true);
      });
    });
  });
});
