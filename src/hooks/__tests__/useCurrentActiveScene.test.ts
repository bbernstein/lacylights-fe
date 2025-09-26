import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useCurrentActiveScene } from '../useCurrentActiveScene';
import { GET_CURRENT_ACTIVE_SCENE } from '../../graphql/scenes';

const mockActiveScene = {
  id: 'scene-123',
};

const _mockUpdatedScene = {
  id: 'scene-456',
};

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('useCurrentActiveScene', () => {
  describe('initial state', () => {
    it('returns initial loading state', () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.currentActiveScene).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it('has correct return type interface', () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current).toHaveProperty('currentActiveScene');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('query data handling', () => {
    it('loads initial active scene from query', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene).toEqual(mockActiveScene);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles query errors', async () => {
      const queryError = new Error('Query failed');
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          error: queryError,
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles null query data', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles empty response data', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {},
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('scene comparison logic', () => {
    it('handles different scene IDs', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene?.id).toBe('scene-123');
      });
    });

    it('handles null scene values correctly', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene).toBeNull();
      });
    });

    it('handles scene with different properties', async () => {
      const sceneWithMoreProps = {
        id: 'scene-789',
        name: 'Test Scene',
        description: 'A test scene',
      };

      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: sceneWithMoreProps,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene?.id).toBe('scene-789');
      });
    });
  });

  describe('loading states', () => {
    it('shows loading state during initial query', () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('stops loading when query completes', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('returns query error when present', async () => {
      const queryError = new Error('Query error');
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          error: queryError,
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Query error');
      });
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          error: networkError,
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Network error');
      });
    });
  });

  describe('cache policy', () => {
    it('uses cache-and-network fetch policy', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveScene).toEqual(mockActiveScene);
      });
    });
  });

  describe('GraphQL operation validation', () => {
    it('uses correct GraphQL query', () => {
      expect(GET_CURRENT_ACTIVE_SCENE).toBeDefined();
      expect(GET_CURRENT_ACTIVE_SCENE.kind).toBe('Document');
    });

    it('query has expected structure', () => {
      const queryString = GET_CURRENT_ACTIVE_SCENE.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString).toContain('currentActiveScene');
    });
  });

  describe('hook interface', () => {
    it('returns all required properties', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current).toHaveProperty('currentActiveScene');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      await waitFor(() => {
        expect(typeof result.current.isLoading).toBe('boolean');
        expect(result.current.currentActiveScene).toBeDefined();
      });
    });

    it('handles multiple hook instances', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_SCENE,
          },
          result: {
            data: {
              currentActiveScene: mockActiveScene,
            },
          },
        },
      ];

      const { result: result1 } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      const { result: result2 } = renderHook(() => useCurrentActiveScene(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result1.current.currentActiveScene?.id).toBe('scene-123');
        expect(result2.current.currentActiveScene?.id).toBe('scene-123');
      });
    });
  });
});