import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import ProjectManagementModal from '../ProjectManagementModal';
import { GET_PROJECTS, CREATE_PROJECT, DELETE_PROJECT, UPDATE_PROJECT } from '../../graphql/projects';

// Mock heroicons - need to include XMarkIcon as BottomSheet uses it
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-mark-icon">X</div>,
  TrashIcon: ({ className }: { className?: string }) => <div className={className} data-testid="trash-icon">🗑</div>,
  PlusIcon: ({ className }: { className?: string }) => <div className={className} data-testid="plus-icon">+</div>,
  PencilIcon: ({ className }: { className?: string }) => <div className={className} data-testid="pencil-icon">✏️</div>,
}));

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

// Mock the useProject hook
jest.mock('../../contexts/ProjectContext', () => ({
  useProject: jest.fn(),
}));

// Mock the useGroup hook
jest.mock('../../contexts/GroupContext', () => ({
  useGroup: jest.fn(() => ({
    activeGroup: { id: 'group-1', name: 'Personal', isPersonal: true },
    groups: [{ id: 'group-1', name: 'Personal', isPersonal: true }],
    selectableGroups: [{ id: 'group-1', name: 'Personal', isPersonal: true }],
    loading: false,
    selectGroup: jest.fn(),
    selectGroupById: jest.fn(),
    refetchGroups: jest.fn(),
  })),
  getGroupIdForQuery: jest.fn((group: any) => group?.id === 'unassigned' ? undefined : group?.id), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAdmin: false,
    isAuthEnabled: true,
    isAuthenticated: true,
  })),
}));

const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project 1',
    description: 'First test project',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    groupId: 'group-1',
    group: { id: 'group-1', name: 'Personal', isPersonal: true },
    __typename: 'Project',
  },
  {
    id: 'project-2',
    name: 'Test Project 2',
    description: 'Second test project',
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z',
    groupId: 'group-1',
    group: { id: 'group-1', name: 'Personal', isPersonal: true },
    __typename: 'Project',
  },
];

const mockUseProject = {
  selectedProjectId: 'project-1',
  selectProjectById: jest.fn(),
  currentProject: mockProjects[0],
  projects: mockProjects,
  loading: false,
  error: null,
  selectProject: jest.fn(),
  createNewProject: jest.fn(),
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_PROJECTS,
      variables: { groupId: 'group-1' },
    },
    result: {
      data: {
        projects: mockProjects,
      },
    },
  },
  {
    request: {
      query: CREATE_PROJECT,
      variables: {
        input: {
          name: 'New Project',
          description: 'New project description',
        },
      },
    },
    result: {
      data: {
        createProject: {
          id: 'new-project-1',
          name: 'New Project',
          description: 'New project description',
          createdAt: '2023-01-03T12:00:00Z',
          updatedAt: '2023-01-03T12:00:00Z',
          groupId: 'group-1',
          group: { id: 'group-1', name: 'Personal', isPersonal: true },
          __typename: 'Project',
        },
      },
    },
  },
  {
    request: {
      query: DELETE_PROJECT,
      variables: { id: 'project-1' },
    },
    result: {
      data: {
        deleteProject: true,
      },
    },
  },
  {
    request: {
      query: UPDATE_PROJECT,
      variables: {
        id: 'project-1',
        input: {
          name: 'Updated Project',
          description: 'Updated description',
          groupId: 'group-1',
        },
      },
    },
    result: {
      data: {
        updateProject: {
          id: 'project-1',
          name: 'Updated Project',
          description: 'Updated description',
          updatedAt: '2023-01-03T12:00:00Z',
          groupId: 'group-1',
          group: { id: 'group-1', name: 'Personal', isPersonal: true },
          __typename: 'Project',
        },
      },
    },
  },
];

const renderWithProvider = (mocks = createMocks(), props = {}) => {
  const { useProject } = require('../../contexts/ProjectContext');
  useProject.mockReturnValue(mockUseProject);

  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ProjectManagementModal {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('ProjectManagementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      renderWithProvider(createMocks(), { isOpen: false });
      expect(screen.queryByText('Manage Projects')).not.toBeInTheDocument();
    });

    it('renders modal when open', () => {
      renderWithProvider();
      expect(screen.getByText('Manage Projects')).toBeInTheDocument();
      expect(screen.getByText('New Project')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      const loadingMocks = [
        {
          request: { query: GET_PROJECTS, variables: { groupId: 'group-1' } },
          delay: 1000,
          result: { data: { projects: [] } },
        },
      ];
      renderWithProvider(loadingMocks);
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('displays projects when loaded', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      });
    });
  });

  describe('modal interactions', () => {
    it('calls onClose when Close button is clicked', async () => {
      renderWithProvider();

      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      renderWithProvider();

      const backdrop = screen.getByTestId('project-management-modal-backdrop');
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('project creation', () => {
    it('shows create form when New Project is clicked', async () => {
      renderWithProvider();

      const createButton = screen.getByText('New Project');
      await userEvent.click(createButton);

      expect(screen.getByPlaceholderText('Project Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('allows entering project details', async () => {
      renderWithProvider();

      const createButton = screen.getByText('New Project');
      await userEvent.click(createButton);

      const nameInput = screen.getByPlaceholderText('Project Name');
      const descInput = screen.getByPlaceholderText('Description (optional)');

      await userEvent.type(nameInput, 'New Project');
      await userEvent.type(descInput, 'New project description');

      expect(nameInput).toHaveValue('New Project');
      expect(descInput).toHaveValue('New project description');
    });

    it('cancels project creation', async () => {
      renderWithProvider();

      const createButton = screen.getByText('New Project');
      await userEvent.click(createButton);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.queryByLabelText('Project Name')).not.toBeInTheDocument();
    });
  });

  describe('project management', () => {
    it('displays project information', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('First test project')).toBeInTheDocument();
      });
    });

    it('shows project actions', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getAllByTestId('pencil-icon')).toHaveLength(2);
        expect(screen.getAllByTestId('trash-icon')).toHaveLength(2);
      });
    });
  });

  describe('project selection', () => {
    it('displays projects for selection', async () => {
      renderWithProvider();

      await waitFor(() => {
        const project1 = screen.getByText('Test Project 1');
        expect(project1).toBeInTheDocument();
      });

      // Check that projects are displayed with their actions
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('First test project')).toBeInTheDocument();
    });
  });

  describe('bulk operations', () => {
    it('shows bulk delete option when projects are selected', async () => {
      renderWithProvider();

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('handles project loading errors gracefully', async () => {
      const errorMocks = [
        {
          request: { query: GET_PROJECTS, variables: { groupId: 'group-1' } },
          error: new Error('Network error'),
        },
      ];

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Component should still render the modal structure
      expect(screen.getByText('Manage Projects')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper button roles', async () => {
      renderWithProvider();

      expect(screen.getByRole('button', { name: /New Project/ })).toBeInTheDocument();

      // Select All button appears after projects are loaded
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Select All/ })).toBeInTheDocument();
      });
    });

    it('has proper heading structure', () => {
      renderWithProvider();

      expect(screen.getByRole('heading', { name: 'Manage Projects' })).toBeInTheDocument();
    });

    it('has proper form inputs when creating project', async () => {
      renderWithProvider();

      const createButton = screen.getByText('New Project');
      await userEvent.click(createButton);

      expect(screen.getByPlaceholderText('Project Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('renders as BottomSheet modal', () => {
      renderWithProvider();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('displays create button properly', () => {
      renderWithProvider();

      const createButton = screen.getByText('New Project');
      expect(createButton).toHaveClass('bg-blue-500', 'text-white');
    });
  });

  describe('edge cases', () => {
    it('handles empty project list', async () => {
      const emptyMocks = [
        {
          request: { query: GET_PROJECTS, variables: { groupId: 'group-1' } },
          result: { data: { projects: [] } },
        },
      ];

      renderWithProvider(emptyMocks);

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
      });
    });

    it('handles missing project context', () => {
      const { useProject } = require('../../contexts/ProjectContext');
      useProject.mockReturnValue({
        selectedProjectId: null,
        selectProjectById: jest.fn(),
        currentProject: null,
        projects: [],
        loading: false,
        error: null,
        selectProject: jest.fn(),
        createNewProject: jest.fn(),
      });

      render(
        <MockedProvider mocks={createMocks()} addTypename={false}>
          <ProjectManagementModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Manage Projects')).toBeInTheDocument();
    });
  });
});