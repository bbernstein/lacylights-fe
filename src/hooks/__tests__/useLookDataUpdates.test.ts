import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useLookDataUpdates } from '../useLookDataUpdates';
import { LOOK_DATA_CHANGED_SUBSCRIPTION } from '../../graphql/entitySubscriptions';
import { GET_PROJECT_LOOKS } from '../../graphql/looks';
import { EntityDataChangeType } from '../../types';

const mockProjectId = 'test-project-123';
const mockLookId = 'test-look-456';

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('useLookDataUpdates', () => {
  describe('subscription setup', () => {
    it('subscribes to look data changes', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              lookDataChanged: null,
            },
          },
        },
      ];

      // Hook should not throw when rendered
      expect(() => {
        renderHook(() => useLookDataUpdates({ projectId: mockProjectId }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });

    it('accepts optional onDataChange callback', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              lookDataChanged: null,
            },
          },
        },
      ];

      const onDataChange = jest.fn();

      expect(() => {
        renderHook(
          () => useLookDataUpdates({ projectId: mockProjectId, onDataChange }),
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
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: project1 },
          },
          result: {
            data: {
              lookDataChanged: null,
            },
          },
        },
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: project2 },
          },
          result: {
            data: {
              lookDataChanged: null,
            },
          },
        },
      ];

      expect(() => {
        renderHook(() => useLookDataUpdates({ projectId: project1 }), {
          wrapper: createMockProvider(mocks),
        });
        renderHook(() => useLookDataUpdates({ projectId: project2 }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });
  });

  describe('GraphQL subscription validation', () => {
    it('subscription is defined', () => {
      expect(LOOK_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(LOOK_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });

    it('subscription has expected structure', () => {
      const subscriptionString = LOOK_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString).toContain('lookDataChanged');
      expect(subscriptionString).toContain('$projectId');
      expect(subscriptionString).toContain('lookId');
      expect(subscriptionString).toContain('changeType');
      expect(subscriptionString).toContain('timestamp');
    });
  });

  describe('subscription data handling', () => {
    it('calls onDataChange callback when subscription data arrives', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        lookDataChanged: {
          lookId: mockLookId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useLookDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait for the subscription to emit and the callback to be called
      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', mockLookId);
        },
        { timeout: 2000 }
      );
    });

    it('triggers refetch when subscription data arrives', async () => {
      const mockSubscriptionData = {
        lookDataChanged: {
          lookId: mockLookId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      // Track whether the GET_PROJECT_LOOKS query was called
      let queryCalled = false;

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_PROJECT_LOOKS,
            variables: { projectId: mockProjectId },
          },
          result: () => {
            queryCalled = true;
            return {
              data: {
                projectLooks: [],
              },
            };
          },
        },
      ];

      renderHook(
        () => useLookDataUpdates({ projectId: mockProjectId }),
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
      const newLookId = 'new-look-123';
      const mockSubscriptionData = {
        lookDataChanged: {
          lookId: newLookId,
          projectId: mockProjectId,
          changeType: 'CREATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useLookDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('CREATED', newLookId);
        },
        { timeout: 2000 }
      );
    });

    it('handles DELETED change type', async () => {
      const onDataChange = jest.fn();
      const deletedLookId = 'deleted-look-123';
      const mockSubscriptionData = {
        lookDataChanged: {
          lookId: deletedLookId,
          projectId: mockProjectId,
          changeType: 'DELETED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useLookDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('DELETED', deletedLookId);
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
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          error: subscriptionError,
        },
      ];

      // Hook should not throw when subscription errors occur
      expect(() => {
        renderHook(() => useLookDataUpdates({ projectId: mockProjectId }), {
          wrapper: createMockProvider(mocks),
        });
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
        lookDataChanged: {
          lookId: mockLookId,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const queryError = new Error('Network error during refetch');

      const mocks: MockedResponse[] = [
        {
          request: {
            query: LOOK_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_PROJECT_LOOKS,
            variables: { projectId: mockProjectId },
          },
          error: queryError,
        },
      ];

      const onDataChange = jest.fn();

      // Hook should not throw when refetch fails
      expect(() => {
        renderHook(
          () =>
            useLookDataUpdates({
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
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', mockLookId);
        },
        { timeout: 2000 }
      );

      // The error should be logged
      await waitFor(
        () => {
          expect(console.error).toHaveBeenCalledWith(
            'Failed to refetch looks data:',
            expect.any(Error)
          );
        },
        { timeout: 2000 }
      );
    });
  });
});
