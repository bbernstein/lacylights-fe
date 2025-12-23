import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useGlobalPlaybackStatus } from '../useGlobalPlaybackStatus';
import { GET_GLOBAL_PLAYBACK_STATUS, GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION } from '../../graphql/cueLists';

const mockPlaybackStatus = {
  isPlaying: true,
  isFading: true,
  cueListId: 'test-cuelist-123',
  cueListName: 'Main Show',
  currentCueIndex: 1,
  cueCount: 10,
  currentCueName: 'Opening',
  fadeProgress: 50,
  lastUpdated: '2023-01-01T12:00:00Z',
};

const mockNotPlayingStatus = {
  isPlaying: false,
  isFading: false,
  cueListId: null,
  cueListName: null,
  currentCueIndex: null,
  cueCount: null,
  currentCueName: null,
  fadeProgress: null,
  lastUpdated: '2023-01-01T12:00:00Z',
};

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

const createMocksWithSubscription = (queryResult: { data?: { globalPlaybackStatus?: unknown } }, subscriptionResult: unknown = null): MockedResponse[] => {
  const mocks = [
    {
      request: {
        query: GET_GLOBAL_PLAYBACK_STATUS,
      },
      result: queryResult,
    },
    {
      request: {
        query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
      },
      result: subscriptionResult || {
        data: {
          globalPlaybackStatusUpdated: queryResult?.data?.globalPlaybackStatus || null,
        },
      },
    },
  ];
  return mocks;
};

describe('useGlobalPlaybackStatus', () => {
  describe('initial state', () => {
    it('returns initial loading state', () => {
      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.playbackStatus).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('query data handling', () => {
    it('loads initial playback status from query when playing', async () => {
      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus).toEqual(mockPlaybackStatus);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('loads initial playback status from query when not playing', async () => {
      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: mockNotPlayingStatus,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus).toEqual(mockNotPlayingStatus);
        expect(result.current.playbackStatus?.isPlaying).toBe(false);
        expect(result.current.playbackStatus?.cueListId).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles query errors', async () => {
      const queryError = new Error('Query failed');
      const mocks = [
        {
          request: {
            query: GET_GLOBAL_PLAYBACK_STATUS,
          },
          error: queryError,
        },
        {
          request: {
            query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
          },
          result: {
            data: {
              globalPlaybackStatusUpdated: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles null query data', async () => {
      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: null,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('hook return values', () => {
    it('returns correct interface structure', async () => {
      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current).toHaveProperty('playbackStatus');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      await waitFor(() => {
        expect(result.current.playbackStatus).toEqual(mockPlaybackStatus);
        expect(typeof result.current.isLoading).toBe('boolean');
      });
    });

    it('combines loading states correctly', async () => {
      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('combines errors correctly', async () => {
      const queryError = new Error('Query error');
      const mocks = [
        {
          request: {
            query: GET_GLOBAL_PLAYBACK_STATUS,
          },
          error: queryError,
        },
        {
          request: {
            query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
          },
          result: {
            data: {
              globalPlaybackStatusUpdated: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Query error');
      });
    });
  });

  describe('hook functionality', () => {
    it('handles playback status properties', async () => {
      const customStatus = {
        isPlaying: true,
        isFading: false,
        cueListId: 'custom-list',
        cueListName: 'Custom Show',
        currentCueIndex: 5,
        cueCount: 20,
        currentCueName: 'Scene 5',
        fadeProgress: 100,
        lastUpdated: '2023-12-01T10:00:00Z',
      };

      const mocks = createMocksWithSubscription({
        data: {
          globalPlaybackStatus: customStatus,
        },
      });

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus?.isPlaying).toBe(true);
        expect(result.current.playbackStatus?.isFading).toBe(false);
        expect(result.current.playbackStatus?.cueListId).toBe('custom-list');
        expect(result.current.playbackStatus?.cueListName).toBe('Custom Show');
        expect(result.current.playbackStatus?.currentCueIndex).toBe(5);
        expect(result.current.playbackStatus?.cueCount).toBe(20);
        expect(result.current.playbackStatus?.currentCueName).toBe('Scene 5');
        expect(result.current.playbackStatus?.fadeProgress).toBe(100);
      });
    });
  });

  describe('Subscription updates', () => {
    it('handles subscription updates correctly', async () => {
      // Note: Subscriptions in mocked Apollo can fire immediately,
      // so we test that the hook properly handles subscription data
      const updatedStatus = { ...mockPlaybackStatus };

      const mocks = createMocksWithSubscription(
        { data: { globalPlaybackStatus: null } },
        { data: { globalPlaybackStatusUpdated: updatedStatus } }
      );

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      // Subscription data should show playing status
      await waitFor(() => {
        expect(result.current.playbackStatus?.isPlaying).toBe(true);
        expect(result.current.playbackStatus?.cueListName).toBe('Main Show');
      });
    });

    it('throttles fade progress updates based on threshold', async () => {
      const initialStatus = { ...mockPlaybackStatus, fadeProgress: 10 };
      const minorUpdate = { ...mockPlaybackStatus, fadeProgress: 10.5 }; // Less than threshold
      const majorUpdate = { ...mockPlaybackStatus, fadeProgress: 15 }; // More than threshold

      const mocks = [
        {
          request: { query: GET_GLOBAL_PLAYBACK_STATUS },
          result: { data: { globalPlaybackStatus: initialStatus } },
        },
        {
          request: { query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION },
          result: { data: { globalPlaybackStatusUpdated: minorUpdate } },
        },
        {
          request: { query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION },
          result: { data: { globalPlaybackStatusUpdated: majorUpdate } },
        },
      ];

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      // Initial fade progress
      await waitFor(() => {
        expect(result.current.playbackStatus?.fadeProgress).toBe(10);
      });

      // Minor update should be throttled (less than FADE_PROGRESS_THRESHOLD)
      // So progress should still be 10
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(result.current.playbackStatus?.fadeProgress).toBe(10);
    });

    it('always updates on important state changes regardless of fade progress', async () => {
      // Test that important state changes (cue index) trigger updates
      // even when fade progress changes are minor
      const updatedStatus = { ...mockPlaybackStatus, fadeProgress: 50.5, currentCueIndex: 2 };

      const mocks = createMocksWithSubscription(
        { data: { globalPlaybackStatus: null } },
        { data: { globalPlaybackStatusUpdated: updatedStatus } }
      );

      const { result } = renderHook(() => useGlobalPlaybackStatus(), {
        wrapper: createMockProvider(mocks),
      });

      // Subscription should provide the updated data
      await waitFor(() => {
        expect(result.current.playbackStatus?.currentCueIndex).toBe(2);
        expect(result.current.playbackStatus?.fadeProgress).toBe(50.5);
      });
    });
  });

  describe('GraphQL operation validation', () => {
    it('uses correct GraphQL query', () => {
      expect(GET_GLOBAL_PLAYBACK_STATUS).toBeDefined();
      expect(GET_GLOBAL_PLAYBACK_STATUS.kind).toBe('Document');
    });

    it('query has expected structure', () => {
      const queryString = GET_GLOBAL_PLAYBACK_STATUS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString).toContain('globalPlaybackStatus');
    });

    it('uses correct GraphQL subscription', () => {
      expect(GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION).toBeDefined();
      expect(GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION.kind).toBe('Document');
    });

    it('subscription has expected structure', () => {
      const subscriptionString = GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString).toContain('globalPlaybackStatusUpdated');
    });
  });
});
