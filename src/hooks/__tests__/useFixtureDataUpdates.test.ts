import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { useFixtureDataUpdates } from '../useFixtureDataUpdates';
import { FIXTURE_DATA_CHANGED_SUBSCRIPTION } from '../../graphql/entitySubscriptions';
import { GET_LOOK } from '../../graphql/looks';
import { EntityDataChangeType } from '../../types';

const mockProjectId = 'test-project-123';
const mockLookId = 'test-look-456';

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('useFixtureDataUpdates', () => {
  describe('subscription setup', () => {
    it('subscribes to fixture data changes', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              fixtureDataChanged: null,
            },
          },
        },
      ];

      // Hook should not throw when rendered
      expect(() => {
        renderHook(() => useFixtureDataUpdates({ projectId: mockProjectId }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });

    it('accepts optional lookId for refetch', () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              fixtureDataChanged: null,
            },
          },
        },
      ];

      expect(() => {
        renderHook(
          () => useFixtureDataUpdates({ projectId: mockProjectId, lookId: mockLookId }),
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
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              fixtureDataChanged: null,
            },
          },
        },
      ];

      const onDataChange = jest.fn();

      expect(() => {
        renderHook(
          () => useFixtureDataUpdates({ projectId: mockProjectId, onDataChange }),
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
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: project1 },
          },
          result: {
            data: {
              fixtureDataChanged: null,
            },
          },
        },
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: project2 },
          },
          result: {
            data: {
              fixtureDataChanged: null,
            },
          },
        },
      ];

      expect(() => {
        renderHook(() => useFixtureDataUpdates({ projectId: project1 }), {
          wrapper: createMockProvider(mocks),
        });
        renderHook(() => useFixtureDataUpdates({ projectId: project2 }), {
          wrapper: createMockProvider(mocks),
        });
      }).not.toThrow();
    });
  });

  describe('GraphQL subscription validation', () => {
    it('subscription is defined', () => {
      expect(FIXTURE_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(FIXTURE_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });

    it('subscription has expected structure', () => {
      const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString).toContain('fixtureDataChanged');
      expect(subscriptionString).toContain('$projectId');
      expect(subscriptionString).toContain('fixtureIds');
      expect(subscriptionString).toContain('changeType');
      expect(subscriptionString).toContain('timestamp');
    });
  });

  describe('subscription data handling', () => {
    it('calls onDataChange callback when subscription data arrives', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        fixtureDataChanged: {
          fixtureIds: ['fixture-1', 'fixture-2'],
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useFixtureDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait for the subscription to emit and the callback to be called
      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', ['fixture-1', 'fixture-2']);
        },
        { timeout: 2000 }
      );
    });

    it('triggers refetch when lookId is provided and subscription data arrives', async () => {
      const mockSubscriptionData = {
        fixtureDataChanged: {
          fixtureIds: ['fixture-1'],
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      // Track whether the GET_LOOK query was called
      let queryCalled = false;

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_LOOK,
            variables: { id: mockLookId },
          },
          result: () => {
            queryCalled = true;
            return {
              data: {
                look: {
                  id: mockLookId,
                  name: 'Test Look',
                  description: 'A test look',
                  createdAt: '2023-01-01T00:00:00Z',
                  updatedAt: '2023-01-01T00:00:00Z',
                  project: {
                    id: mockProjectId,
                    name: 'Test Project',
                    layoutCanvasWidth: 2000,
                    layoutCanvasHeight: 2000,
                  },
                  fixtureValues: [],
                },
              },
            };
          },
        },
      ];

      renderHook(
        () => useFixtureDataUpdates({ projectId: mockProjectId, lookId: mockLookId }),
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
        fixtureDataChanged: {
          fixtureIds: ['new-fixture-1'],
          projectId: mockProjectId,
          changeType: 'CREATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useFixtureDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('CREATED', ['new-fixture-1']);
        },
        { timeout: 2000 }
      );
    });

    it('handles DELETED change type', async () => {
      const onDataChange = jest.fn();
      const mockSubscriptionData = {
        fixtureDataChanged: {
          fixtureIds: ['deleted-fixture-1'],
          projectId: mockProjectId,
          changeType: 'DELETED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useFixtureDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('DELETED', ['deleted-fixture-1']);
        },
        { timeout: 2000 }
      );
    });

    it('handles multiple fixture IDs in a single update', async () => {
      const onDataChange = jest.fn();
      const fixtureIds = ['fixture-1', 'fixture-2', 'fixture-3', 'fixture-4', 'fixture-5'];
      const mockSubscriptionData = {
        fixtureDataChanged: {
          fixtureIds,
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
      ];

      renderHook(
        () => useFixtureDataUpdates({ projectId: mockProjectId, onDataChange }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', fixtureIds);
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
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          error: subscriptionError,
        },
      ];

      // Hook should not throw when subscription errors occur
      expect(() => {
        renderHook(() => useFixtureDataUpdates({ projectId: mockProjectId }), {
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
        fixtureDataChanged: {
          fixtureIds: ['fixture-1'],
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      const queryError = new Error('Network error during refetch');

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_LOOK,
            variables: { id: mockLookId },
          },
          error: queryError,
        },
      ];

      const onDataChange = jest.fn();

      // Hook should not throw when refetch fails
      expect(() => {
        renderHook(
          () =>
            useFixtureDataUpdates({
              projectId: mockProjectId,
              lookId: mockLookId,
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
          expect(onDataChange).toHaveBeenCalledWith('UPDATED', ['fixture-1']);
        },
        { timeout: 2000 }
      );

      // The error should be logged
      await waitFor(
        () => {
          expect(console.error).toHaveBeenCalledWith(
            'Failed to refetch look data for fixture updates:',
            expect.any(Error)
          );
        },
        { timeout: 2000 }
      );
    });

    it('does not refetch when lookId is not provided', async () => {
      const mockSubscriptionData = {
        fixtureDataChanged: {
          fixtureIds: ['fixture-1'],
          projectId: mockProjectId,
          changeType: 'UPDATED' as EntityDataChangeType,
          timestamp: new Date().toISOString(),
        },
      };

      let queryCalled = false;

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: mockSubscriptionData,
          },
        },
        {
          request: {
            query: GET_LOOK,
            variables: { id: mockLookId },
          },
          result: () => {
            queryCalled = true;
            return { data: { look: null } };
          },
        },
      ];

      const onDataChange = jest.fn();

      renderHook(
        () =>
          useFixtureDataUpdates({
            projectId: mockProjectId,
            // Note: lookId is NOT provided
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait for callback
      await waitFor(
        () => {
          expect(onDataChange).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Query should NOT have been called since no lookId was provided
      expect(queryCalled).toBe(false);
    });
  });

  describe('Skip condition', () => {
    it('should skip subscription when projectId is empty', async () => {
      const onDataChange = jest.fn();
      let subscriptionSkipped = true;

      const mocks: MockedResponse[] = [
        {
          request: {
            query: FIXTURE_DATA_CHANGED_SUBSCRIPTION,
            variables: { projectId: '' },
          },
          result: () => {
            subscriptionSkipped = false;
            return {
              data: {
                fixtureDataChanged: {
                  projectId: '',
                  changeType: 'UPDATED',
                  fixtureIds: ['fixture-123'],
                },
              },
            };
          },
        },
      ];

      renderHook(
        () =>
          useFixtureDataUpdates({
            projectId: '',
            lookId: 'look-123',
            onDataChange,
          }),
        {
          wrapper: createMockProvider(mocks),
        }
      );

      // Wait a bit to ensure subscription would have been established if not skipped
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Subscription should have been skipped
      expect(subscriptionSkipped).toBe(true);
      expect(onDataChange).not.toHaveBeenCalled();
    });
  });
});
