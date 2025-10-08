import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectSelector from '../ProjectSelector';

// Mock the ProjectContext
const mockSelectProject = jest.fn();
const mockUseProject = jest.fn();

jest.mock('@/contexts/ProjectContext', () => ({
  useProject: () => mockUseProject(),
}));

// Mock the CogIcon from Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CogIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="cog-icon">
      <title>Settings</title>
    </svg>
  ),
}));

// Mock the ProjectManagementModal
jest.mock('../ProjectManagementModal', () => {
  return function MockProjectManagementModal({ isOpen, onClose }: unknown) {
    return isOpen ? (
      <div data-testid="project-management-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

// Mock the ImportExportButtons
jest.mock('../ImportExportButtons', () => {
  return function MockImportExportButtons() {
    return <div data-testid="import-export-buttons">Import/Export</div>;
  };
});

const mockProjects = [
  { id: '1', name: 'Project Alpha' },
  { id: '2', name: 'Project Beta' },
  { id: '3', name: 'Project Gamma' },
];

describe('ProjectSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockUseProject.mockReturnValue({
      currentProject: mockProjects[0],
      projects: mockProjects,
      loading: false,
      selectProject: mockSelectProject,
    });
  });

  describe('loading state', () => {
    it('renders loading message when loading', () => {
      mockUseProject.mockReturnValue({
        currentProject: null,
        projects: [],
        loading: true,
        selectProject: mockSelectProject,
      });

      render(<ProjectSelector />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('applies correct loading styles', () => {
      mockUseProject.mockReturnValue({
        currentProject: null,
        projects: [],
        loading: true,
        selectProject: mockSelectProject,
      });

      render(<ProjectSelector />);

      const loadingElement = screen.getByText('Loading projects...');
      expect(loadingElement).toHaveClass('text-sm', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('no current project state', () => {
    it('renders nothing when no current project and not loading', () => {
      mockUseProject.mockReturnValue({
        currentProject: null,
        projects: mockProjects,
        loading: false,
        selectProject: mockSelectProject,
      });

      const { container } = render(<ProjectSelector />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('normal state', () => {
    it('renders current project name', () => {
      render(<ProjectSelector />);

      expect(screen.getByText('Project:')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    it('renders project selector button with correct styling', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'flex',
        'items-center',
        'space-x-2',
        'text-sm',
        'font-medium',
        'text-gray-700',
        'dark:text-gray-300',
        'hover:text-gray-900',
        'dark:hover:text-white'
      );
    });

    it('renders dropdown arrow icon', () => {
      render(<ProjectSelector />);

      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('dropdown interaction', () => {
    it('opens dropdown when button is clicked', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Use getAllByText since "Project Alpha" appears both in button and dropdown
      const alphaElements = screen.getAllByText('Project Alpha');
      expect(alphaElements).toHaveLength(2); // One in button, one in dropdown
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Project Gamma')).toBeInTheDocument();
    });

    it('closes dropdown when button is clicked again', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show dropdown
      expect(screen.getByText('Project Beta')).toBeInTheDocument();

      fireEvent.click(button);

      // Should hide dropdown
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });

    it('highlights current project in dropdown', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const projectButtons = screen.getAllByText('Project Alpha');
      const dropdownButton = projectButtons.find(el => el.tagName === 'BUTTON' && el !== button);

      expect(dropdownButton).toHaveClass('bg-gray-100', 'dark:bg-gray-600');
    });

    it('does not highlight non-current projects in dropdown', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const betaButton = screen.getByText('Project Beta');
      expect(betaButton).toHaveClass('text-gray-700', 'dark:text-gray-200');
      expect(betaButton).not.toHaveClass('bg-gray-100');
    });

    it('calls selectProject when project is selected', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const betaButton = screen.getByText('Project Beta');
      fireEvent.click(betaButton);

      expect(mockSelectProject).toHaveBeenCalledWith(mockProjects[1]);
    });

    it('closes dropdown when project is selected', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const betaButton = screen.getByText('Project Beta');
      fireEvent.click(betaButton);

      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });
  });

  describe('manage projects functionality', () => {
    it('renders manage projects button in dropdown', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Manage Projects')).toBeInTheDocument();
      expect(screen.getByTestId('cog-icon')).toBeInTheDocument();
    });

    it('opens management modal when manage projects is clicked', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const manageButton = screen.getByText('Manage Projects');
      fireEvent.click(manageButton);

      expect(screen.getByTestId('project-management-modal')).toBeInTheDocument();
    });

    it('closes dropdown when manage projects is clicked', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const manageButton = screen.getByText('Manage Projects');
      fireEvent.click(manageButton);

      // Dropdown should be closed (projects not visible)
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });

    it('closes management modal when close is clicked', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const manageButton = screen.getByText('Manage Projects');
      fireEvent.click(manageButton);

      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('project-management-modal')).not.toBeInTheDocument();
    });
  });

  describe('click outside functionality', () => {
    it('closes dropdown when clicking outside', async () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should be open
      expect(screen.getByText('Project Beta')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
      });
    });

    it('does not close dropdown when clicking inside', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Dropdown should be open
      expect(screen.getByText('Project Beta')).toBeInTheDocument();

      // Click inside dropdown
      const dropdown = screen.getByText('Project Beta').closest('div');
      fireEvent.mouseDown(dropdown!);

      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders dropdown button as proper button element', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders project selection buttons as proper buttons', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const projectButtons = screen.getAllByRole('button');
      // Should have original button + 3 project buttons + 1 manage button
      expect(projectButtons).toHaveLength(5);
    });
  });

  describe('styling', () => {
    it('applies correct dropdown styling', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const dropdown = button.parentElement?.querySelector('[class*="absolute"]');
      expect(dropdown).toHaveClass(
        'absolute',
        'right-0',
        'z-10',
        'mt-2',
        'w-56',
        'rounded-md',
        'bg-white',
        'dark:bg-gray-700',
        'shadow-lg'
      );
    });

    it('applies correct border separator styling', () => {
      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Find the separator div by its specific classes
      const container = document.querySelector('[class*="border-t border-gray-200"]');
      expect(container).toHaveClass('border-t', 'border-gray-200', 'dark:border-gray-600');
    });
  });

  describe('edge cases', () => {
    it('handles empty projects list', () => {
      mockUseProject.mockReturnValue({
        currentProject: mockProjects[0],
        projects: [],
        loading: false,
        selectProject: mockSelectProject,
      });

      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should only show manage projects button, no project buttons
      expect(screen.getByText('Manage Projects')).toBeInTheDocument();
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });

    it('handles single project', () => {
      mockUseProject.mockReturnValue({
        currentProject: mockProjects[0],
        projects: [mockProjects[0]],
        loading: false,
        selectProject: mockSelectProject,
      });

      render(<ProjectSelector />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show only one project button + manage button
      const projectButtons = screen.getAllByText('Project Alpha');
      expect(projectButtons).toHaveLength(2); // One in button, one in dropdown
    });
  });
});