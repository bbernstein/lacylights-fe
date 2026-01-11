import { renderHook } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useCueListDataUpdates } from '../useCueListDataUpdates';
import { CUE_LIST_DATA_CHANGED_SUBSCRIPTION } from '../../graphql/cueLists';

const mockCueListId = 'test-cuelist-123';

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('useCueListDataUpdates', () => {
  describe('subscription setup', () => {
    it('subscribes to cue list data changes', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: {
              cueListDataChanged: null,
            },
          },
        },
      ];

      // Hook should not throw when rendered
      expect(() => {
        renderHook(() => useCueListDataUpdates({ cueListId: mockCueListId }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });

    it('accepts optional onDataChange callback', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: {
              cueListDataChanged: null,
            },
          },
        },
      ];

      const onDataChange = jest.fn();

      expect(() => {
        renderHook(() => useCueListDataUpdates({ cueListId: mockCueListId, onDataChange }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });

    it('handles different cue list IDs', () => {
      const cueList1 = 'cuelist-1';
      const cueList2 = 'cuelist-2';

      const mocks: MockedResponse[] = [
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: cueList1 },
          },
          result: {
            data: {
              cueListDataChanged: null,
            },
          },
        },
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: cueList2 },
          },
          result: {
            data: {
              cueListDataChanged: null,
            },
          },
        },
      ];

      expect(() => {
        renderHook(() => useCueListDataUpdates({ cueListId: cueList1 }), {
          wrapper: createMockProvider(mocks),
        });
        renderHook(() => useCueListDataUpdates({ cueListId: cueList2 }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });
  });

  describe('GraphQL subscription validation', () => {
    it('subscription is defined', () => {
      expect(CUE_LIST_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(CUE_LIST_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });

    it('subscription has expected structure', () => {
      const subscriptionString = CUE_LIST_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString).toContain('cueListDataChanged');
      expect(subscriptionString).toContain('$cueListId');
      expect(subscriptionString).toContain('changeType');
      expect(subscriptionString).toContain('affectedCueIds');
      expect(subscriptionString).toContain('affectedSceneId');
      expect(subscriptionString).toContain('newSceneName');
      expect(subscriptionString).toContain('timestamp');
    });
  });
});
