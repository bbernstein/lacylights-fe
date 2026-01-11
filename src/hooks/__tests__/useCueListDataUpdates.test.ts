import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useCueListDataUpdates } from '../useCueListDataUpdates';
import {
  CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
  GET_CUE_LIST,
} from '../../graphql/cueLists';
import { CueListDataChangeType } from '../../types';

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

  describe('subscription data handling', () => {
    it('calls onDataChange callback when subscription data arrives', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        cueListDataChanged: {
          cueListId: mockCueListId,
          changeType: 'CUE_UPDATED' as CueListDataChangeType,
          affectedCueIds: ['cue-1'],
          affectedSceneId: null,
          newSceneName: null,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: mockCueListId },
          },
          result: {
            data: {
              cueList: {
                id: mockCueListId,
                name: 'Test Cue List',
                description: 'A test cue list',
                loop: false,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z',
                project: { id: 'project-1', name: 'Test Project' },
                cues: [],
              },
            },
          },
        },
      ];

      renderHook(
        () => useCueListDataUpdates({ cueListId: mockCueListId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait for the subscription to emit and the callback to be called
      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('CUE_UPDATED');
        },
        { timeout: 2000 }
      );
    });

    it('triggers refetch when subscription data arrives', async () => {
      const mockSubscriptionData = {
        cueListDataChanged: {
          cueListId: mockCueListId,
          changeType: 'CUE_CREATED' as CueListDataChangeType,
          affectedCueIds: ['new-cue-1'],
          affectedSceneId: null,
          newSceneName: null,
          timestamp: new Date().toISOString(),
        },
      };

      // Track whether the GET_CUE_LIST query was called
      let queryCalled = false;

      const mocks: MockedResponse[] = [
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: mockCueListId },
          },
          result: () => {
            queryCalled = true;
            return {
              data: {
                cueList: {
                  id: mockCueListId,
                  name: 'Test Cue List',
                  description: 'A test cue list',
                  loop: false,
                  createdAt: '2023-01-01T00:00:00Z',
                  updatedAt: '2023-01-01T00:00:00Z',
                  project: { id: 'project-1', name: 'Test Project' },
                  cues: [],
                },
              },
            };
          },
        },
      ];

      renderHook(() => useCueListDataUpdates({ cueListId: mockCueListId }), {
        wrapper: createMockProvider(mocks),
      });

      // Wait for the subscription to emit and the refetch to be triggered
      await waitFor(
        () => {
          expect(queryCalled).toBe(true);
        },
        { timeout: 2000 }
      );
    });

    it('handles SCENE_RENAMED change type', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        cueListDataChanged: {
          cueListId: mockCueListId,
          changeType: 'SCENE_RENAMED' as CueListDataChangeType,
          affectedCueIds: ['cue-1', 'cue-2'],
          affectedSceneId: 'scene-1',
          newSceneName: 'New Scene Name',
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: CUE_LIST_DATA_CHANGED_SUBSCRIPTION,
            variables: { cueListId: mockCueListId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: mockCueListId },
          },
          result: {
            data: {
              cueList: {
                id: mockCueListId,
                name: 'Test Cue List',
                description: 'A test cue list',
                loop: false,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z',
                project: { id: 'project-1', name: 'Test Project' },
                cues: [],
              },
            },
          },
        },
      ];

      renderHook(
        () => useCueListDataUpdates({ cueListId: mockCueListId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('SCENE_RENAMED');
        },
        { timeout: 2000 }
      );
    });
  });
});
