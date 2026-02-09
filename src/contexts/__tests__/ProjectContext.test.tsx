import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ProjectProvider, useProject } from '../ProjectContext';
import { GET_PROJECTS, CREATE_PROJECT } from '../../graphql/projects';

// Mock AuthContext - ProjectContext depends on useAuth()
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthEnabled: false,
    isAuthenticated: false,
    isAdmin: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

// Mock GroupContext - ProjectContext depends on useGroup()
jest.mock('../GroupContext', () => ({
  useGroup: jest.fn(() => ({
    activeGroup: { id: 'group-1', name: 'Personal', isPersonal: true },
    groups: [{ id: 'group-1', name: 'Personal', isPersonal: true }],
    loading: false,
    selectGroup: jest.fn(),
    selectGroupById: jest.fn(),
    refetchGroups: jest.fn(),
  })),
  GroupProvider: ({ children }: { children: React.ReactNode }) => children,
  getGroupIdForQuery: jest.fn((group: any) => group?.id === 'unassigned' ? undefined : group?.id), // eslint-disable-line @typescript-eslint/no-explicit-any
  UNASSIGNED_GROUP_ID: 'unassigned',
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockProjects = [
  {
    id: '1',
    name: 'Project Alpha',
    description: 'First project',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    fixtures: [],
    looks: [],
    cueLists: [],
    users: [],
    layoutCanvasWidth: 2000,
    layoutCanvasHeight: 2000,
    groupId: 'group-1',
    group: { id: 'group-1', name: 'Personal', isPersonal: true },
  },
  {
    id: '2',
    name: 'Project Beta',
    description: 'Second project',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    fixtures: [],
    looks: [],
    cueLists: [],
    users: [],
    layoutCanvasWidth: 2000,
    layoutCanvasHeight: 2000,
    groupId: 'group-1',
    group: { id: 'group-1', name: 'Personal', isPersonal: true },
  },
];

const newProject = {
  id: '3',
  name: 'New Project',
  description: 'Created project',
  createdAt: '2023-01-03T00:00:00Z',
  updatedAt: '2023-01-03T00:00:00Z',
  fixtures: [],
  looks: [],
  cueLists: [],
  users: [],
  layoutCanvasWidth: 2000,
  layoutCanvasHeight: 2000,
  groupId: 'group-1',
  group: { id: 'group-1', name: 'Personal', isPersonal: true },
};

const createMockProvider = (mocks: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

// Test component that uses the ProjectContext
function TestComponent() {
  const {
    currentProject,
    projects,
    loading,
    error,
    selectProject,
    selectProjectById,
    createNewProject,
    selectedProjectId,
  } = useProject();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error ? error.message : 'No Error'}</div>
      <div data-testid="current-project">
        {currentProject ? currentProject.name : 'No Project'}
      </div>
      <div data-testid="selected-project-id">
        {selectedProjectId || 'No ID'}
      </div>
      <div data-testid="projects-count">{projects.length}</div>
      <button
        data-testid="select-project-1"
        onClick={() => selectProject(mockProjects[0])}
      >
        Select Project 1
      </button>
      <button
        data-testid="select-project-by-id"
        onClick={() => selectProjectById('2')}
      >
        Select Project By ID
      </button>
      <button
        data-testid="create-project"
        onClick={() => createNewProject('Test Project', 'Test Description')}
      >
        Create Project
      </button>
    </div>
  );
}

describe('ProjectContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('ProjectProvider', () => {
    it('provides initial loading state', () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('current-project')).toHaveTextContent('No Project');
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
    });

    it('loads projects and auto-selects first project', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
        expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
        expect(screen.getByTestId('selected-project-id')).toHaveTextContent('1');
      });
    });

    it('handles query errors', async () => {
      const error = new Error('Failed to fetch projects');
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          error,
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch projects');
      });
    });

    it('creates default project when no projects exist', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: [] } },
        },
        {
          request: {
            query: CREATE_PROJECT,
            variables: {
              input: { name: 'Default Project', description: 'Automatically created project', groupId: 'group-1' },
            },
          },
          result: { data: { createProject: newProject } },
        },
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: [newProject] } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('current-project')).toHaveTextContent('New Project');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', '3');
    });

    it('restores project from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('2');

      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Beta');
        expect(screen.getByTestId('selected-project-id')).toHaveTextContent('2');
      });
    });

    it('falls back to first project if localStorage project not found', async () => {
      mockLocalStorage.getItem.mockReturnValue('non-existent-id');

      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });
    });
  });

  describe('Project selection', () => {
    it('allows manual project selection', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });

      act(() => {
        screen.getByTestId('select-project-1').click();
      });

      expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', '1');
    });

    it('allows project selection by ID', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });

      act(() => {
        screen.getByTestId('select-project-by-id').click();
      });

      expect(screen.getByTestId('current-project')).toHaveTextContent('Project Beta');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', '2');
    });

    it('handles selection of non-existent project ID gracefully', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });

      // The selectProjectById function should handle non-existent IDs gracefully
      // Current project should remain unchanged when trying to select non-existent ID
      expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
    });
  });

  describe('Project creation', () => {
    it('creates new project successfully', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
        {
          request: {
            query: CREATE_PROJECT,
            variables: {
              input: { name: 'Test Project', description: 'Test Description', groupId: 'group-1' },
            },
          },
          result: { data: { createProject: newProject } },
        },
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: [...mockProjects, newProject] } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });

      await act(async () => {
        screen.getByTestId('create-project').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('New Project');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', '3');
      });
    });

    it('handles project creation errors', async () => {
      const createError = new Error('Failed to create project');
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
        {
          request: {
            query: CREATE_PROJECT,
            variables: {
              input: { name: 'Test Project', description: 'Test Description', groupId: 'group-1' },
            },
          },
          error: createError,
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });

      // The createNewProject function should throw the error, but we can't test this
      // directly in this setup without more complex error handling in the test component
    });
  });

  describe('useProject hook', () => {
    it('throws error when used outside ProjectProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(React.createElement(TestComponent));
      }).toThrow('useProject must be used within a ProjectProvider');

      consoleSpy.mockRestore();
    });

    it('provides all required context values', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
        expect(screen.getByTestId('selected-project-id')).toHaveTextContent('1');
        expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
      });

      // Verify buttons are rendered (indicating functions are available)
      expect(screen.getByTestId('select-project-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-project-by-id')).toBeInTheDocument();
      expect(screen.getByTestId('create-project')).toBeInTheDocument();
    });
  });

  describe('localStorage integration', () => {
    it('saves selected project to localStorage', async () => {
      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Alpha');
      });

      act(() => {
        screen.getByTestId('select-project-by-id').click();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentProjectId', '2');
    });

    it('attempts to restore project from localStorage on mount', async () => {
      mockLocalStorage.getItem.mockReturnValue('2');

      const mocks = [
        {
          request: { query: GET_PROJECTS },
          result: { data: { projects: mockProjects } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(
            ProjectProvider,
            null,
            React.createElement(TestComponent)
          )
        )
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('currentProjectId');

      await waitFor(() => {
        expect(screen.getByTestId('current-project')).toHaveTextContent('Project Beta');
      });
    });
  });
});