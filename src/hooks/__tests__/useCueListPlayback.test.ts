import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { useCueListPlayback } from '../useCueListPlayback';
import { GET_CUE_LIST_PLAYBACK_STATUS, CUE_LIST_PLAYBACK_SUBSCRIPTION } from '../../graphql/cueLists';
import { FADE_PROGRESS_THRESHOLD } from '../../constants/playback';

const mockCueListId = 'test-cuelist-123';
const mockPlaybackStatus = {
  cueListId: mockCueListId,
  currentCueIndex: 1,
  isPlaying: true,
  currentCue: {
    id: 'cue-1',
    name: 'Test Cue',
    cueNumber: 1,
    fadeInTime: 2.0,
    fadeOutTime: 3.0,
    followTime: null,
    notes: 'Test notes',
  },
  fadeProgress: 0.5,
  lastUpdated: '2023-01-01T12:00:00Z',
};

const createMockProvider = (mocks: any[]) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
};

const createMocksWithSubscription = (cueListId: string, queryResult: any, subscriptionResult: any = null) => {
  const mocks = [
    {
      request: {
        query: GET_CUE_LIST_PLAYBACK_STATUS,
        variables: { cueListId },
      },
      result: queryResult,
    },
    {
      request: {
        query: CUE_LIST_PLAYBACK_SUBSCRIPTION,
        variables: { cueListId },
      },
      result: subscriptionResult || {
        data: {
          cueListPlaybackUpdated: queryResult?.data?.cueListPlaybackStatus || null,
        },
      },
    },
  ];
  return mocks;
};

describe('useCueListPlayback', () => {
  describe('initial state', () => {
    it('returns initial loading state', () => {
      const mocks = createMocksWithSubscription(mockCueListId, {
        data: {
          cueListPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.playbackStatus).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it('handles empty cueListId parameter', () => {
      const mocks = createMocksWithSubscription('', {
        data: {
          cueListPlaybackStatus: null,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(''), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.playbackStatus).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('query data handling', () => {
    it('loads initial playback status from query', async () => {
      const mocks = createMocksWithSubscription(mockCueListId, {
        data: {
          cueListPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus).toEqual(mockPlaybackStatus);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles query errors', async () => {
      const queryError = new Error('Query failed');
      const mocks = [
        {
          request: {
            query: GET_CUE_LIST_PLAYBACK_STATUS,
            variables: { cueListId: mockCueListId },
          },
          error: queryError,
        },
        {
          request: {
            query: CUE_LIST_PLAYBACK_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: {
              cueListPlaybackUpdated: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles null query data', async () => {
      const mocks = createMocksWithSubscription(mockCueListId, {
        data: {
          cueListPlaybackStatus: null,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('constants and configuration', () => {
    it('uses correct fade progress threshold constant', () => {
      expect(FADE_PROGRESS_THRESHOLD).toBeDefined();
      expect(typeof FADE_PROGRESS_THRESHOLD).toBe('number');
      expect(FADE_PROGRESS_THRESHOLD).toBe(1);
    });
  });

  describe('hook return values', () => {
    it('returns correct interface structure', async () => {
      const mocks = createMocksWithSubscription(mockCueListId, {
        data: {
          cueListPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
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
      const mocks = createMocksWithSubscription(mockCueListId, {
        data: {
          cueListPlaybackStatus: mockPlaybackStatus,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
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
            query: GET_CUE_LIST_PLAYBACK_STATUS,
            variables: { cueListId: mockCueListId },
          },
          error: queryError,
        },
        {
          request: {
            query: CUE_LIST_PLAYBACK_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: {
              cueListPlaybackUpdated: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Query error');
      });
    });
  });

  describe('hook functionality', () => {
    it('handles different cue list IDs', async () => {
      const cueList1 = 'cuelist-1';
      const cueList2 = 'cuelist-2';

      const mocks1 = createMocksWithSubscription(cueList1, {
        data: {
          cueListPlaybackStatus: { ...mockPlaybackStatus, cueListId: cueList1 },
        },
      });
      const mocks2 = createMocksWithSubscription(cueList2, {
        data: {
          cueListPlaybackStatus: { ...mockPlaybackStatus, cueListId: cueList2 },
        },
      });
      const mocks = [...mocks1, ...mocks2];

      const { result: result1 } = renderHook(() => useCueListPlayback(cueList1), {
        wrapper: createMockProvider(mocks),
      });

      const { result: result2 } = renderHook(() => useCueListPlayback(cueList2), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result1.current.playbackStatus?.cueListId).toBe(cueList1);
        expect(result2.current.playbackStatus?.cueListId).toBe(cueList2);
      });
    });

    it('handles playback status properties', async () => {
      const customStatus = {
        cueListId: mockCueListId,
        currentCueIndex: 5,
        isPlaying: false,
        currentCue: null,
        fadeProgress: 0.0,
        lastUpdated: '2023-12-01T10:00:00Z',
      };

      const mocks = createMocksWithSubscription(mockCueListId, {
        data: {
          cueListPlaybackStatus: customStatus,
        },
      });

      const { result } = renderHook(() => useCueListPlayback(mockCueListId), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.playbackStatus?.currentCueIndex).toBe(5);
        expect(result.current.playbackStatus?.isPlaying).toBe(false);
        expect(result.current.playbackStatus?.currentCue).toBeNull();
        expect(result.current.playbackStatus?.fadeProgress).toBe(0.0);
      });
    });
  });

  describe('GraphQL operation validation', () => {
    it('uses correct GraphQL query', () => {
      expect(GET_CUE_LIST_PLAYBACK_STATUS).toBeDefined();
      expect(GET_CUE_LIST_PLAYBACK_STATUS.kind).toBe('Document');
    });

    it('query has expected structure', () => {
      const queryString = GET_CUE_LIST_PLAYBACK_STATUS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString).toContain('cueListPlaybackStatus');
      expect(queryString).toContain('$cueListId');
    });
  });
});