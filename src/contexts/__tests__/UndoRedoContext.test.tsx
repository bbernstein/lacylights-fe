import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { UndoRedoProvider, useUndoRedo } from '../UndoRedoContext';
import { ProjectProvider } from '../ProjectContext';
import { GET_UNDO_REDO_STATUS, UNDO, REDO, OPERATION_HISTORY_CHANGED } from '@/graphql/undoRedo';
import { GET_PROJECTS, CREATE_PROJECT } from '@/graphql/projects';

const mockProjectId = 'test-project-123';

const mockProject = {
  id: mockProjectId,
  name: 'Test Project',
  description: 'A test project',
  createdAt: '2023-01-01T12:00:00Z',
  updatedAt: '2023-01-01T12:00:00Z',
  layoutCanvasWidth: 2000,
  layoutCanvasHeight: 2000,
};

const mockUndoRedoStatus = {
  projectId: mockProjectId,
  canUndo: true,
  canRedo: false,
  currentSequence: 5,
  totalOperations: 10,
  undoDescription: 'Update look "Warm Wash"',
  redoDescription: null,
};

const mockUndoResult = {
  success: true,
  message: 'Undid: Update look "Warm Wash"',
  restoredEntityId: 'look-123',
  operation: {
    id: 'op-123',
    description: 'Update look "Warm Wash"',
    operationType: 'UPDATE',
    entityType: 'LOOK',
    sequence: 4,
  },
};

const mockRedoResult = {
  success: true,
  message: 'Redid: Update look "Warm Wash"',
  restoredEntityId: 'look-123',
  operation: {
    id: 'op-123',
    description: 'Update look "Warm Wash"',
    operationType: 'UPDATE',
    entityType: 'LOOK',
    sequence: 5,
  },
};

const createMockProvider = (mocks: MockedResponse[]) => {
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MockedProvider,
      { mocks, addTypename: false },
      React.createElement(ProjectProvider, null, React.createElement(UndoRedoProvider, null, children))
    );
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

const createBaseMocks = (): MockedResponse[] => [
  {
    request: {
      query: GET_PROJECTS,
    },
    result: {
      data: {
        projects: [mockProject],
      },
    },
  },
  {
    request: {
      query: GET_UNDO_REDO_STATUS,
      variables: { projectId: mockProjectId },
    },
    result: {
      data: {
        undoRedoStatus: mockUndoRedoStatus,
      },
    },
  },
  {
    request: {
      query: OPERATION_HISTORY_CHANGED,
      variables: { projectId: mockProjectId },
    },
    result: {
      data: {
        operationHistoryChanged: mockUndoRedoStatus,
      },
    },
  },
];

describe('UndoRedoContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('useUndoRedo hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useUndoRedo());
      }).toThrow('useUndoRedo must be used within an UndoRedoProvider');

      console.error = originalError;
    });

    it('should return context with default values when no project selected', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECTS,
          },
          result: {
            data: {
              projects: [],
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          MockedProvider,
          { mocks, addTypename: false },
          React.createElement(ProjectProvider, null, React.createElement(UndoRedoProvider, null, children))
        );

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoDescription).toBeNull();
      expect(result.current.redoDescription).toBeNull();
      expect(result.current.currentSequence).toBe(0);
      expect(result.current.totalOperations).toBe(0);
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
    });
  });

  describe('Status loading', () => {
    it('should load undo/redo status from query', async () => {
      const mocks = createBaseMocks();
      const wrapper = createMockProvider(mocks);

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      await waitFor(() => {
        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.undoDescription).toBe('Update look "Warm Wash"');
        expect(result.current.currentSequence).toBe(5);
        expect(result.current.totalOperations).toBe(10);
      });
    });

    it('should track loading state correctly', async () => {
      const mocks = createBaseMocks();
      const wrapper = createMockProvider(mocks);

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      // Loading state is managed by Apollo - we verify it's a boolean
      expect(typeof result.current.isLoading).toBe('boolean');

      // After data loads, isLoading should be false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Undo action', () => {
    it('should call undo mutation and return success', async () => {
      const mocks = [
        ...createBaseMocks(),
        {
          request: {
            query: UNDO,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              undo: mockUndoResult,
            },
          },
        },
        // Refetch after mutation
        {
          request: {
            query: GET_UNDO_REDO_STATUS,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              undoRedoStatus: {
                ...mockUndoRedoStatus,
                canUndo: true,
                canRedo: true,
                currentSequence: 4,
              },
            },
          },
        },
      ];
      const wrapper = createMockProvider(mocks);

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      await waitFor(() => {
        expect(result.current.canUndo).toBe(true);
      });

      let success = false;
      await act(async () => {
        success = await result.current.undo();
      });

      expect(success).toBe(true);
      expect(result.current.lastMessage).toBe('Undid: Update look "Warm Wash"');
    });

    it('should return false when no project is selected', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECTS,
          },
          result: {
            data: {
              projects: [],
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          MockedProvider,
          { mocks, addTypename: false },
          React.createElement(ProjectProvider, null, React.createElement(UndoRedoProvider, null, children))
        );

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      let success = true;
      await act(async () => {
        success = await result.current.undo();
      });

      expect(success).toBe(false);
      expect(result.current.lastMessage).toBe('No project selected');
    });
  });

  describe('Redo action', () => {
    it('should call redo mutation and return success', async () => {
      const statusWithRedo = {
        ...mockUndoRedoStatus,
        canRedo: true,
        redoDescription: 'Update look "Warm Wash"',
      };

      const mocks = [
        {
          request: {
            query: GET_PROJECTS,
          },
          result: {
            data: {
              projects: [mockProject],
            },
          },
        },
        // Handle race condition where ProjectContext might try to create a default project
        // before the GET_PROJECTS mock returns
        {
          request: {
            query: CREATE_PROJECT,
            variables: {
              input: { name: 'Default Project', description: 'Automatically created project' },
            },
          },
          result: {
            data: {
              createProject: mockProject,
            },
          },
        },
        {
          request: {
            query: GET_UNDO_REDO_STATUS,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              undoRedoStatus: statusWithRedo,
            },
          },
        },
        {
          request: {
            query: OPERATION_HISTORY_CHANGED,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              operationHistoryChanged: statusWithRedo,
            },
          },
        },
        {
          request: {
            query: REDO,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              redo: mockRedoResult,
            },
          },
        },
        // Refetch after mutation
        {
          request: {
            query: GET_UNDO_REDO_STATUS,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              undoRedoStatus: {
                ...statusWithRedo,
                canRedo: false,
                currentSequence: 5,
              },
            },
          },
        },
      ];
      const wrapper = createMockProvider(mocks);

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      await waitFor(() => {
        expect(result.current.canRedo).toBe(true);
      });

      let success = false;
      await act(async () => {
        success = await result.current.redo();
      });

      expect(success).toBe(true);
      expect(result.current.lastMessage).toBe('Redid: Update look "Warm Wash"');
    });
  });

  describe('Context value structure', () => {
    it('should return correct interface structure', async () => {
      const mocks = createBaseMocks();
      const wrapper = createMockProvider(mocks);

      const { result } = renderHook(() => useUndoRedo(), { wrapper });

      expect(result.current).toHaveProperty('canUndo');
      expect(result.current).toHaveProperty('canRedo');
      expect(result.current).toHaveProperty('undoDescription');
      expect(result.current).toHaveProperty('redoDescription');
      expect(result.current).toHaveProperty('currentSequence');
      expect(result.current).toHaveProperty('totalOperations');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('undo');
      expect(result.current).toHaveProperty('redo');
      expect(result.current).toHaveProperty('lastMessage');

      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
    });
  });

  describe('GraphQL operations', () => {
    it('uses correct GraphQL query', () => {
      expect(GET_UNDO_REDO_STATUS).toBeDefined();
      expect(GET_UNDO_REDO_STATUS.kind).toBe('Document');
    });

    it('uses correct undo mutation', () => {
      expect(UNDO).toBeDefined();
      expect(UNDO.kind).toBe('Document');
    });

    it('uses correct redo mutation', () => {
      expect(REDO).toBeDefined();
      expect(REDO.kind).toBe('Document');
    });

    it('uses correct subscription', () => {
      expect(OPERATION_HISTORY_CHANGED).toBeDefined();
      expect(OPERATION_HISTORY_CHANGED.kind).toBe('Document');
    });
  });
});
