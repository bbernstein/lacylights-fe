import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ProjectManagementModal from '../ProjectManagementModal';
import { GET_PROJECTS, CREATE_PROJECT, DELETE_PROJECT, UPDATE_PROJECT, PROJECT_EXPORT } from '../../graphql/projects';

// Mock the router so navigation can be asserted
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock heroicons - need to include XMarkIcon as BottomSheet uses it
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-mark-icon">X</div>,
  TrashIcon: ({ className }: { className?: string }) => <div className={className} data-testid="trash-icon">🗑</div>,
  PlusIcon: ({ className }: { className?: string }) => <div className={className} data-testid="plus-icon">+</div>,
  PencilIcon: ({ className }: { className?: string }) => <div className={className} data-testid="pencil-icon">✏️</div>,
  ArrowDownTrayIcon: ({ className }: { className?: string }) => <div className={className} data-testid="arrow-down-tray-icon" />,
  ArrowsUpDownIcon: ({ className }: { className?: string }) => <div className={className} data-testid="arrows-up-down-icon" />,
  EllipsisVerticalIcon: ({ className }: { className?: string }) => <div className={className} data-testid="ellipsis-vertical-icon" />,
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

const renderWithProvider = (mocks: ReadonlyArray<MockedResponse> = createMocks(), props = {}) => {
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
          request: { query: GET_PROJECTS },
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
          request: { query: GET_PROJECTS },
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
          request: { query: GET_PROJECTS },
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
  describe('import / export', () => {
    const exportMock = {
      request: {
        query: PROJECT_EXPORT,
        variables: {
          projectId: 'project-2',
          options: { includeFixtures: true, includeLooks: true, includeCueLists: true },
        },
      },
      result: {
        data: {
          projectExport: {
            projectId: 'project-2',
            projectName: 'Test Project 2',
            jsonContent: '{"project":2}',
            stats: {
              fixtureDefinitionsCount: 0,
              fixtureInstancesCount: 0,
              looksCount: 0,
              cueListsCount: 0,
              cuesCount: 0,
            },
          },
        },
      },
    };

    afterEach(() => {
      delete window.lacylights;
    });

    it('toolbar Import / Export… button opens the page and closes the modal', () => {
      const onClose = jest.fn();
      renderWithProvider(createMocks(), { onClose });

      fireEvent.click(screen.getByRole('button', { name: /Import \/ Export…/ }));

      expect(onClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/import-export');
    });

    it('each row has a Save button that downloads LacyLights JSON in one click', async () => {
      const nativeDownload = jest.fn();
      window.lacylights = {
        download: nativeDownload,
        send: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
        getAppVersion: jest.fn(),
      };
      renderWithProvider([...createMocks(), exportMock]);

      const saveButtons = await screen.findAllByRole('button', {
        name: 'Save project as LacyLights file (.json)',
      });
      expect(saveButtons).toHaveLength(2);
      expect(saveButtons[1]).toHaveAttribute('title', 'Save project as LacyLights file (.json)');

      fireEvent.click(saveButtons[1]);

      await waitFor(() =>
        expect(nativeDownload).toHaveBeenCalledWith('{"project":2}', 'Test Project 2.json'),
      );
      // No format menu is shown on the row.
      expect(screen.queryByText(/QLC\+/)).not.toBeInTheDocument();
    });

    it('tracks concurrent row saves independently', async () => {
      const nativeDownload = jest.fn();
      window.lacylights = {
        download: nativeDownload,
        send: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
        getAppVersion: jest.fn(),
      };
      const exportMock1 = {
        request: {
          query: PROJECT_EXPORT,
          variables: { ...exportMock.request.variables, projectId: 'project-1' },
        },
        delay: 20,
        result: {
          data: {
            projectExport: {
              ...exportMock.result.data.projectExport,
              projectId: 'project-1',
              projectName: 'Test Project 1',
              jsonContent: '{"project":1}',
            },
          },
        },
      };
      renderWithProvider([...createMocks(), exportMock1, { ...exportMock, delay: 300 }]);

      const saveButtons = await screen.findAllByRole('button', {
        name: 'Save project as LacyLights file (.json)',
      });
      fireEvent.click(saveButtons[0]);
      fireEvent.click(saveButtons[1]);
      expect(saveButtons[0]).toBeDisabled();
      expect(saveButtons[1]).toBeDisabled();

      // The first save finishing must not re-enable the second, still-running one.
      await waitFor(() =>
        expect(nativeDownload).toHaveBeenCalledWith('{"project":1}', 'Test Project 1.json'),
      );
      await waitFor(() => expect(saveButtons[0]).toBeEnabled());
      expect(saveButtons[1]).toBeDisabled();

      await waitFor(() =>
        expect(nativeDownload).toHaveBeenCalledWith('{"project":2}', 'Test Project 2.json'),
      );
      await waitFor(() => expect(saveButtons[1]).toBeEnabled());
    });

    it('shows an error when saving fails', async () => {
      renderWithProvider([
        ...createMocks(),
        { request: exportMock.request, error: new Error('export broke') },
      ]);

      const saveButtons = await screen.findAllByRole('button', {
        name: 'Save project as LacyLights file (.json)',
      });
      fireEvent.click(saveButtons[1]);

      expect(await screen.findByText('Failed to export project. export broke')).toBeInTheDocument();
    });

    it('row overflow menu links to more export options for that project', async () => {
      const onClose = jest.fn();
      renderWithProvider(createMocks(), { onClose });

      fireEvent.click(await screen.findByRole('button', { name: 'More actions for Test Project 2' }));
      const item = screen.getByRole('menuitem', { name: /More export options…/ });
      fireEvent.click(item);

      expect(onClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/import-export?section=export&project=project-2');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
      it('clears the row menu when the modal is closed and reopened', async () => {
      const { rerender } = renderWithProvider(createMocks());
      fireEvent.click(await screen.findByRole('button', { name: 'More actions for Test Project 2' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      const renderModal = (isOpen: boolean) => (
        <MockedProvider mocks={createMocks()} addTypename={false}>
          <ProjectManagementModal {...defaultProps} isOpen={isOpen} />
        </MockedProvider>
      );
      rerender(renderModal(false));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      rerender(renderModal(true));
      await screen.findByRole('button', { name: 'More actions for Test Project 2' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it.each([
      ['footer Close button', () => screen.getByText('Close', { selector: 'button' })],
      ['header X button', () => screen.getByTestId('project-management-modal-close-button')],
    ])('clears the row menu when the modal is closed via the %s', async (_label, getButton) => {
      const onClose = jest.fn();
      renderWithProvider(createMocks(), { onClose });
      fireEvent.click(await screen.findByRole('button', { name: 'More actions for Test Project 2' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.click(getButton());

      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('a tap outside the row menu closes only the menu, never the sheet or the control underneath', async () => {
      const onClose = jest.fn();
      renderWithProvider(createMocks(), { onClose });
      fireEvent.click(await screen.findByRole('button', { name: 'More actions for Test Project 2' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // On a touch screen the tap lands on the menu's backdrop, which covers
      // the sheet, its own backdrop and the other rows' buttons.
      fireEvent.click(screen.getByTestId('context-menu-backdrop'));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('project-management-modal')).toBeInTheDocument();
    });

    it('closes the row menu when the project list scrolls, so it never drifts away from its row', async () => {
      renderWithProvider(createMocks());
      fireEvent.click(await screen.findByRole('button', { name: 'More actions for Test Project 2' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      // ContextMenu attaches its document listeners on the next frame.
      await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      });

      fireEvent.scroll(screen.getByTestId('project-management-modal'));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('activating the same row ⋯ button again closes its menu', async () => {
      renderWithProvider(createMocks());
      const trigger = await screen.findByRole('button', { name: 'More actions for Test Project 2' });

      fireEvent.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(trigger);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('another row\'s ⋯ button moves the menu to that row', async () => {
      renderWithProvider(createMocks());
      const first = await screen.findByRole('button', { name: 'More actions for Test Project 2' });
      fireEvent.click(first);
      const others = screen.getAllByRole('button', { name: /^More actions for / }).filter((b) => b !== first);
      fireEvent.click(others[0]);

      expect(screen.getAllByRole('menu')).toHaveLength(1);
      expect(others[0]).toHaveAttribute('aria-expanded', 'true');
      expect(first).toHaveAttribute('aria-expanded', 'false');
    });

    it('row menu is keyboard accessible: focus moves in, Escape closes only the menu', async () => {
      const onClose = jest.fn();
      renderWithProvider(createMocks(), { onClose });
      const trigger = await screen.findByRole('button', { name: 'More actions for Test Project 2' });
      trigger.focus();
      fireEvent.click(trigger);

      const item = screen.getByRole('menuitem', { name: /More export options…/ });
      expect(item).toHaveFocus();

      fireEvent.keyDown(item, { key: 'Escape' });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(trigger).toHaveFocus();
    });
});
});