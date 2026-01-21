import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useLookBoardDataUpdates } from '../useLookBoardDataUpdates';
import { LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION } from '../../graphql/entitySubscriptions';
import { GET_LOOK_BOARD } from '../../graphql/lookBoards';
import { EntityDataChangeType } from '../../types';

const mockProjectId = 'test-project-123';
const mockLookBoardId = 'test-board-456';

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('useLookBoardDataUpdates', () => {
  describe('subscription setup', () => {
    it('subscribes to look board data changes', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              lookBoardDataChanged: null,
            },
          },
        },
      ];

      // Hook should not throw when rendered
      expect(() => {
        renderHook(
          () =>
            useLookBoardDataUpdates({
              lookBoardId: mockLookBoardId,
              projectId: mockProjectId,
            }),
          {
            wrapper: createMockProvider(mocks),
          }
        );
      }).not.toThrow();
    });

    it('accepts optional onDataChange callback', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              lookBoardDataChanged: null,
            },
          },
        },
      ];

      const onDataChange = jest.fn();

      expect(() => {
        renderHook(
          () =>
            useLookBoardDataUpdates({
              lookBoardId: mockLookBoardId,
              projectId: mockProjectId,
              onDataChange,
            }),
          {
            wrapper: createMockProvider(mocks),
          }
        );
      }).not.toThrow();
    });

    it('handles different project IDs', () => {
      const project1 = 'project-1';
      const project2 = 'project-2';

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: project1 },
          },
          result: {
            data: {
              lookBoardDataChanged: null,
            },
          },
        },
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: project2 },
          },
          result: {
            data: {
              lookBoardDataChanged: null,
            },
          },
        },
      ];

      expect(() => {
        renderHook(
          () =>
            useLookBoardDataUpdates({
              lookBoardId: mockLookBoardId,
              projectId: project1,
            }),
          {
            wrapper: createMockProvider(mocks),
          }
        );
        renderHook(
          () =>
            useLookBoardDataUpdates({
              lookBoardId: mockLookBoardId,
              projectId: project2,
            }),
          {
            wrapper: createMockProvider(mocks),
          }
        );
      }).not.toThrow();
    });
  });

  describe('GraphQL subscription validation', () => {
    it('subscription is defined', () => {
      expect(LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });

    it('subscription has expected structure', () => {
      const subscriptionString =
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString).toContain('lookBoardDataChanged');
      expect(subscriptionString).toContain('$projectId');
      expect(subscriptionString).toContain('lookBoardId');
      expect(subscriptionString).toContain('changeType');
      expect(subscriptionString).toContain('affectedButtonIds');
      expect(subscriptionString).toContain('timestamp');
    });
  });

  describe('subscription data handling', () => {
    it('calls onDataChange callback when subscription data arrives for this board', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: mockLookBoardId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          affectedButtonIds: ['button-1', 'button-2'],
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () =>
          useLookBoardDataUpdates({
            lookBoardId: mockLookBoardId,
            projectId: mockProjectId,
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait for the subscription to emit and the callback to be called
      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', [
            'button-1',
            'button-2',
          ]);
        },
        { timeout: 2000 }
      );
    });

    it('does not call onDataChange when update is for a different board', async () => {
      const onDataChange = jest.fn();
      const differentBoardId = 'different-board-id';
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: differentBoardId, // Different board
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          affectedButtonIds: null,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () =>
          useLookBoardDataUpdates({
            lookBoardId: mockLookBoardId, // Our board
            projectId: mockProjectId,
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait and verify callback was NOT called
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(onDataChange).not.toHaveBeenCalled();
    });

    it('triggers refetch when subscription data arrives for this board', async () => {
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: mockLookBoardId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          affectedButtonIds: null,
          timestamp: new Date().toISOString(),
        },
      };

      // Track whether the GET_LOOK_BOARD query was called
      let queryCalled = false;

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_LOOK_BOARD,
            variables: { id: mockLookBoardId },
          },
          result: () => {
            queryCalled = true;
            return {
              data: {
                lookBoard: {
                  id: mockLookBoardId,
                  name: 'Test Board',
                  description: '',
                  gridSize: 50,
                  canvasWidth: 2000,
                  canvasHeight: 2000,
                  defaultFadeTime: 3,
                  buttons: [],
                  project: {
                    id: mockProjectId,
                    name: 'Test Project',
                  },
                  createdAt: '2023-01-01T00:00:00Z',
                  updatedAt: '2023-01-01T00:00:00Z',
                },
              },
            };
          },
        },
      ];

      renderHook(
        () =>
          useLookBoardDataUpdates({
            lookBoardId: mockLookBoardId,
            projectId: mockProjectId,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait for the subscription to emit and the refetch to be triggered
      await waitFor(
        () => {
          expect(queryCalled).toBe(true);
        },
        { timeout: 2000 }
      );
    });

    it('handles CREATED change type', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: mockLookBoardId,
          projectId: mockProjectId,
          changeType: 'CREATED' as EntityDataChangeType,
          affectedButtonIds: null,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () =>
          useLookBoardDataUpdates({
            lookBoardId: mockLookBoardId,
            projectId: mockProjectId,
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('CREATED', null);
        },
        { timeout: 2000 }
      );
    });

    it('handles DELETED change type', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: mockLookBoardId,
          projectId: mockProjectId,
          changeType: 'DELETED' as EntityDataChangeType,
          affectedButtonIds: null,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () =>
          useLookBoardDataUpdates({
            lookBoardId: mockLookBoardId,
            projectId: mockProjectId,
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('DELETED', null);
        },
        { timeout: 2000 }
      );
    });

    it('handles affectedButtonIds in updates', async () => {
      const onDataChange = jest.fn();
      const buttonIds = ['btn-1', 'btn-2', 'btn-3'];
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: mockLookBoardId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          affectedButtonIds: buttonIds,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () =>
          useLookBoardDataUpdates({
            lookBoardId: mockLookBoardId,
            projectId: mockProjectId,
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', buttonIds);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Suppress console.error for error handling tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('handles subscription errors gracefully', async () => {
      const subscriptionError = new Error('Subscription connection failed');

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          error: subscriptionError,
        },
      ];

      // Hook should not throw when subscription errors occur
      expect(() => {
        renderHook(
          () =>
            useLookBoardDataUpdates({
              lookBoardId: mockLookBoardId,
              projectId: mockProjectId,
            }),
          {
            wrapper: createMockProvider(mocks),
          }
        );
      }).not.toThrow();

      // Wait a bit for the error to be processed
      await waitFor(
        () => {
          expect(console.error).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('handles refetch query errors gracefully', async () => {
      const mockSubscriptionData = {
        lookBoardDataChanged: {
          lookBoardId: mockLookBoardId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          affectedButtonIds: null,
          timestamp: new Date().toISOString(),
        },
      };

      const queryError = new Error('Network error during refetch');

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_LOOK_BOARD,
            variables: { id: mockLookBoardId },
          },
          error: queryError,
        },
      ];

      const onDataChange = jest.fn();

      // Hook should not throw when refetch fails
      expect(() => {
        renderHook(
          () =>
            useLookBoardDataUpdates({
              lookBoardId: mockLookBoardId,
              projectId: mockProjectId,
              onDataChange,
            }),
          {
            wrapper: createMockProvider(mocks),
          }
        );
      }).not.toThrow();

      // The onDataChange callback should still be called even if refetch fails
      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', null);
        },
        { timeout: 2000 }
      );

      // The error should be logged
      await waitFor(
        () => {
          expect(console.error).toHaveBeenCalledWith(
            'Failed to refetch look board data:',
            expect.any(Error)
          );
        },
        { timeout: 2000 }
      );
    });
  });
});
