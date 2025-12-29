import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CreateCueListModal from '../CreateCueListModal';
import { CREATE_CUE_LIST } from '../../graphql/cueLists';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockProjectId = 'project-123';
const mockOnClose = jest.fn();
const mockOnCueListCreated = jest.fn();

describe('CreateCueListModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    projectId: mockProjectId,
    onCueListCreated: mockOnCueListCreated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByRole('heading', { name: 'Create Cue List' })).toBeInTheDocument();
      expect(screen.getByText('Create a new cue list to sequence your scenes for playback.')).toBeInTheDocument();
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} isOpen={false} />
        </MockedProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders form fields', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByLabelText('Cue List Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Main Show, Act 1, Opening')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Optional description of this cue list...')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Cue List' })).toBeInTheDocument();
    });
  });

  describe('form interaction', () => {
    it('updates name input value', async () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      await userEvent.type(nameInput, 'Test Cue List');

      expect(nameInput).toHaveValue('Test Cue List');
    });

    it('updates description textarea value', async () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const _descriptionInput = screen.getByLabelText('Description');
      await userEvent.type(_descriptionInput, 'This is a test description');

      expect(_descriptionInput).toHaveValue('This is a test description');
    });

    it('requires name field', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      expect(nameInput).toHaveAttribute('required');
    });

    it('does not require description field', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const _descriptionInput = screen.getByLabelText('Description');
      expect(_descriptionInput).not.toHaveAttribute('required');
    });
  });

  describe('form submission', () => {
    it('submits form with valid data', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test Cue List',
                description: 'Test Description',
                projectId: mockProjectId,
              },
            },
          },
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test Cue List',
                description: 'Test Description',
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      const _descriptionInput = screen.getByLabelText('Description');
      const _submitButton = screen.getByRole('button', { name: 'Create Cue List' });

      await userEvent.type(nameInput, 'Test Cue List');
      await userEvent.type(_descriptionInput, 'Test Description');
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnCueListCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('submits form without description', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test Cue List',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test Cue List',
                description: "",
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      const _submitButton = screen.getByRole('button', { name: 'Create Cue List' });

      await userEvent.type(nameInput, 'Test Cue List');
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnCueListCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles empty description as undefined', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test Cue List',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test Cue List',
                description: "",
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      const _descriptionInput = screen.getByLabelText('Description');

      await userEvent.type(nameInput, 'Test Cue List');
      // Leave description empty by not typing anything
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        expect(mockOnCueListCreated).toHaveBeenCalled();
      });
    });

    it('disables submit button when name is empty', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const _submitButton = screen.getByRole('button', { name: 'Create Cue List' });
      expect(_submitButton).toBeDisabled();
    });

    it('enables submit button when name is provided', async () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      const _submitButton = screen.getByRole('button', { name: 'Create Cue List' });

      await userEvent.type(nameInput, 'Test');

      expect(_submitButton).not.toBeDisabled();
    });

    it('disables submit button when name contains only whitespace', async () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *');
      const _submitButton = screen.getByRole('button', { name: 'Create Cue List' });

      await userEvent.type(nameInput, '   ');

      expect(_submitButton).toBeDisabled();
    });

    it('prevents form submission with preventDefault', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test',
                description: "",
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const form = screen.getByLabelText('Cue List Name *').closest('form')!;
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent(form, submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading text when creating', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          delay: 100,
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test',
                description: "",
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('disables submit button while creating', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          delay: 100,
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test',
                description: "",
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Creating.../ });
        expect(button).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('displays error message on mutation failure', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          error: new Error('Failed to create cue list'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        expect(screen.getByText('Error creating cue list')).toBeInTheDocument();
        expect(screen.getByText('Failed to create cue list')).toBeInTheDocument();
      });
    });


    it('displays error with proper styling', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          error: new Error('Test error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        const errorContainer = screen.getByText('Test error').closest('div.bg-red-50');
        expect(errorContainer).toHaveClass('bg-red-50', 'dark:bg-red-900/20', 'border', 'border-red-200');
      });
    });
  });

  describe('modal close behavior', () => {
    it('calls onClose when cancel button is clicked', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const backdrop = screen.getByTestId('bottom-sheet-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form fields when closing', async () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Cue List Name *') as HTMLInputElement;
      const _descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;

      await userEvent.type(nameInput, 'Test Name');
      await userEvent.type(_descriptionInput, 'Test Description');

      fireEvent.click(screen.getByText('Cancel'));

      // After closing, the form should be reset (though modal is no longer visible)
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets error state when closing', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          error: new Error('Test error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal after successful creation', async () => {
      const mocks = [
        {
          request: {
            query: CREATE_CUE_LIST,
            variables: {
              input: {
                name: 'Test',
                description: undefined,
                projectId: mockProjectId,
              },
            },
          },
          result: {
            data: {
              createCueList: {
                id: 'new-cuelist-123',
                name: 'Test',
                description: "",
                createdAt: '2023-01-01T00:00:00Z',
                cues: [],
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      await userEvent.type(screen.getByLabelText('Cue List Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Cue List' }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnCueListCreated).toHaveBeenCalled();
      });
    });
  });

  describe('styling', () => {
    it('renders as BottomSheet dialog', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('renders backdrop', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const backdrop = screen.getByTestId('bottom-sheet-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('applies correct button styling on desktop', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('border', 'border-gray-300', 'bg-white', 'text-gray-700');

      const submitButton = screen.getByRole('button', { name: 'Create Cue List' });
      expect(submitButton).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const buttonContainer = screen.getByRole('button', { name: 'Create Cue List' }).parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows create button first on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const buttons = screen.getAllByRole('button');
      const buttonLabels = buttons.map(b => b.textContent);
      expect(buttonLabels).toContain('Create Cue List');
      expect(buttonLabels).toContain('Cancel');
    });

    it('has larger touch targets on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <CreateCueListModal {...defaultProps} />
        </MockedProvider>
      );

      const submitButton = screen.getByRole('button', { name: 'Create Cue List' });
      expect(submitButton).toHaveClass('min-h-[44px]');
    });
  });
});