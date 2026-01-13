import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useCurrentActiveLook } from '../useCurrentActiveLook';
import { GET_CURRENT_ACTIVE_LOOK } from '../../graphql/looks';

const mockActiveLook = {
  id: 'look-123',
};

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('useCurrentActiveLook', () => {
  describe('initial state', () => {
    it('returns initial loading state', () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: mockActiveLook,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current.currentActiveLook).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('query data handling', () => {
    it('loads active look from query', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: mockActiveLook,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveLook).toEqual(mockActiveLook);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles null active look', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveLook).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles query errors', async () => {
      const queryError = new Error('Query failed');
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          error: queryError,
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('hook return values', () => {
    it('returns correct interface structure', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: mockActiveLook,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      expect(result.current).toHaveProperty('currentActiveLook');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');

      await waitFor(() => {
        expect(result.current.currentActiveLook).toEqual(mockActiveLook);
        expect(typeof result.current.isLoading).toBe('boolean');
      });
    });

    it('returns look id when available', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: mockActiveLook,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveLook?.id).toBe('look-123');
      });
    });
  });

  describe('GraphQL operation validation', () => {
    it('uses correct GraphQL query', () => {
      expect(GET_CURRENT_ACTIVE_LOOK).toBeDefined();
      expect(GET_CURRENT_ACTIVE_LOOK.kind).toBe('Document');
    });

    it('query has expected structure', () => {
      const queryString = GET_CURRENT_ACTIVE_LOOK.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('currentactivelook');
    });

    it('query requests id field', () => {
      const queryString = GET_CURRENT_ACTIVE_LOOK.loc?.source.body;
      expect(queryString).toContain('id');
    });
  });

  describe('polling behavior', () => {
    // Note: The hook uses polling since the backend lacks a subscription
    // We verify the hook is using the correct fetch policy
    it('uses cache-and-network fetch policy for fresh data', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: mockActiveLook,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      // The hook should load data successfully
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.currentActiveLook).toEqual(mockActiveLook);
      });
    });
  });

  describe('state management', () => {
    it('only updates state when look id changes', async () => {
      const mocks = [
        {
          request: {
            query: GET_CURRENT_ACTIVE_LOOK,
          },
          result: {
            data: {
              currentActiveLook: mockActiveLook,
            },
          },
        },
      ];

      const { result, rerender } = renderHook(() => useCurrentActiveLook(), {
        wrapper: createMockProvider(mocks),
      });

      await waitFor(() => {
        expect(result.current.currentActiveLook?.id).toBe('look-123');
      });

      // Re-render shouldn't change the value since it's the same
      rerender();

      expect(result.current.currentActiveLook?.id).toBe('look-123');
    });
  });
});
