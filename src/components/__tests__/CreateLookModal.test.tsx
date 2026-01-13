import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CreateLookModal from '../CreateLookModal';
import { CREATE_LOOK } from '../../graphql/looks';
import { GET_PROJECT_FIXTURES } from '../../graphql/fixtures';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockProjectId = 'project-123';
const mockOnClose = jest.fn();
const mockOnLookCreated = jest.fn();

const mockFixtures = [
  {
    id: 'fixture-1',
    name: 'Front Wash 1',
    description: 'Front wash fixture',
    manufacturer: 'Chauvet',
    model: 'SlimPAR Pro',
    type: 'LED_PAR',
    universe: 1,
    startChannel: 1,
    channelCount: 7,
    tags: [],
    projectOrder: 0,
    createdAt: '2023-01-01T00:00:00Z',
    definitionId: 'def-1',
    modeName: '7-Channel',
    channels: [
      { id: 'ch-1', offset: 0, name: 'Dimmer', type: 'INTENSITY', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-2', offset: 1, name: 'Red', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-3', offset: 2, name: 'Green', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-4', offset: 3, name: 'Blue', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-5', offset: 4, name: 'White', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-6', offset: 5, name: 'Strobe', type: 'STROBE', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'SNAP', isDiscrete: true },
      { id: 'ch-7', offset: 6, name: 'Color Macro', type: 'COLOR_MACRO', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'SNAP', isDiscrete: true },
    ],
  },
  {
    id: 'fixture-2',
    name: 'Front Wash 2',
    description: 'Front wash fixture 2',
    manufacturer: 'Chauvet',
    model: 'SlimPAR Pro',
    type: 'LED_PAR',
    universe: 1,
    startChannel: 8,
    channelCount: 7,
    tags: [],
    projectOrder: 1,
    createdAt: '2023-01-01T00:00:00Z',
    definitionId: 'def-1',
    modeName: '7-Channel',
    channels: [
      { id: 'ch-8', offset: 0, name: 'Dimmer', type: 'INTENSITY', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-9', offset: 1, name: 'Red', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-10', offset: 2, name: 'Green', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-11', offset: 3, name: 'Blue', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-12', offset: 4, name: 'White', type: 'COLOR', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'FADE', isDiscrete: false },
      { id: 'ch-13', offset: 5, name: 'Strobe', type: 'STROBE', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'SNAP', isDiscrete: true },
      { id: 'ch-14', offset: 6, name: 'Color Macro', type: 'COLOR_MACRO', defaultValue: 0, minValue: 0, maxValue: 255, fadeBehavior: 'SNAP', isDiscrete: true },
    ],
  },
];

const fixturesMock = {
  request: {
    query: GET_PROJECT_FIXTURES,
    variables: { projectId: mockProjectId },
  },
  result: {
    data: {
      project: {
        id: mockProjectId,
        fixtures: mockFixtures,
      },
    },
  },
};

const emptyFixturesMock = {
  request: {
    query: GET_PROJECT_FIXTURES,
    variables: { projectId: mockProjectId },
  },
  result: {
    data: {
      project: {
        id: mockProjectId,
        fixtures: [],
      },
    },
  },
};

describe('CreateLookModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    projectId: mockProjectId,
    onLookCreated: mockOnLookCreated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByRole('heading', { name: 'Create Look' })).toBeInTheDocument();
      expect(screen.getByText(/Create a new lighting look/)).toBeInTheDocument();
    });

    it('renders form fields', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByLabelText('Look Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Warm Wash, Blue Special, Blackout')).toBeInTheDocument();
    });

    it('renders action buttons', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Look' })).toBeInTheDocument();
    });

    it('shows fixtures list when fixtures exist', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
        expect(screen.getByText(/Front Wash 1 - Chauvet SlimPAR Pro/)).toBeInTheDocument();
        expect(screen.getByText(/Front Wash 2 - Chauvet SlimPAR Pro/)).toBeInTheDocument();
      });
    });

    it('shows warning when no fixtures exist', async () => {
      render(
        <MockedProvider mocks={[emptyFixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/No fixtures found in this project/)).toBeInTheDocument();
      });
    });
  });

  describe('form interaction', () => {
    it('updates name input value', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Look Name *');
      await userEvent.type(nameInput, 'Test Look');

      expect(nameInput).toHaveValue('Test Look');
    });

    it('updates description textarea value', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const descriptionInput = screen.getByLabelText('Description');
      await userEvent.type(descriptionInput, 'This is a test description');

      expect(descriptionInput).toHaveValue('This is a test description');
    });

    it('requires name field', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Look Name *');
      expect(nameInput).toHaveAttribute('required');
    });

    it('does not require description field', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const descriptionInput = screen.getByLabelText('Description');
      expect(descriptionInput).not.toHaveAttribute('required');
    });
  });

  describe('form submission', () => {
    it('submits form with valid data', async () => {
      const createLookMock = {
        request: {
          query: CREATE_LOOK,
          variables: {
            input: {
              name: 'Test Look',
              description: 'Test Description',
              projectId: mockProjectId,
              fixtureValues: [
                { fixtureId: 'fixture-1', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
                { fixtureId: 'fixture-2', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
              ],
            },
          },
        },
        result: {
          data: {
            createLook: {
              id: 'new-look-123',
              name: 'Test Look',
              description: 'Test Description',
              createdAt: '2023-01-01T00:00:00Z',
              fixtureValues: [],
            },
          },
        },
      };

      render(
        <MockedProvider mocks={[fixturesMock, createLookMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Look Name *');
      const descriptionInput = screen.getByLabelText('Description');
      const submitButton = screen.getByRole('button', { name: 'Create Look' });

      await userEvent.type(nameInput, 'Test Look');
      await userEvent.type(descriptionInput, 'Test Description');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLookCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('disables submit button when name is empty', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Create Look' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when name is provided and fixtures exist', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Look Name *');
      const submitButton = screen.getByRole('button', { name: 'Create Look' });

      await userEvent.type(nameInput, 'Test');

      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button when no fixtures exist', async () => {
      render(
        <MockedProvider mocks={[emptyFixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/No fixtures found/)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Look Name *');
      await userEvent.type(nameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: 'Create Look' });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when name contains only whitespace', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Look Name *');
      const submitButton = screen.getByRole('button', { name: 'Create Look' });

      await userEvent.type(nameInput, '   ');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('shows loading text when creating', async () => {
      const createLookMock = {
        request: {
          query: CREATE_LOOK,
          variables: {
            input: {
              name: 'Test',
              description: undefined,
              projectId: mockProjectId,
              fixtureValues: [
                { fixtureId: 'fixture-1', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
                { fixtureId: 'fixture-2', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
              ],
            },
          },
        },
        delay: 100,
        result: {
          data: {
            createLook: {
              id: 'new-look-123',
              name: 'Test',
              description: '',
              createdAt: '2023-01-01T00:00:00Z',
              fixtureValues: [],
            },
          },
        },
      };

      render(
        <MockedProvider mocks={[fixturesMock, createLookMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText('Look Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Look' }));

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('disables submit button while creating', async () => {
      const createLookMock = {
        request: {
          query: CREATE_LOOK,
          variables: {
            input: {
              name: 'Test',
              description: undefined,
              projectId: mockProjectId,
              fixtureValues: [
                { fixtureId: 'fixture-1', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
                { fixtureId: 'fixture-2', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
              ],
            },
          },
        },
        delay: 100,
        result: {
          data: {
            createLook: {
              id: 'new-look-123',
              name: 'Test',
              description: '',
              createdAt: '2023-01-01T00:00:00Z',
              fixtureValues: [],
            },
          },
        },
      };

      render(
        <MockedProvider mocks={[fixturesMock, createLookMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText('Look Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Look' }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Creating.../ });
        expect(button).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('displays error message on mutation failure', async () => {
      const createLookErrorMock = {
        request: {
          query: CREATE_LOOK,
          variables: {
            input: {
              name: 'Test',
              description: undefined,
              projectId: mockProjectId,
              fixtureValues: [
                { fixtureId: 'fixture-1', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
                { fixtureId: 'fixture-2', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
              ],
            },
          },
        },
        error: new Error('Failed to create look'),
      };

      render(
        <MockedProvider mocks={[fixturesMock, createLookErrorMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText('Look Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Look' }));

      await waitFor(() => {
        expect(screen.getByText('Error creating look')).toBeInTheDocument();
        expect(screen.getByText('Failed to create look')).toBeInTheDocument();
      });
    });

    it('displays error with proper styling', async () => {
      const createLookErrorMock = {
        request: {
          query: CREATE_LOOK,
          variables: {
            input: {
              name: 'Test',
              description: undefined,
              projectId: mockProjectId,
              fixtureValues: [
                { fixtureId: 'fixture-1', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
                { fixtureId: 'fixture-2', channels: [{ offset: 0, value: 0 }, { offset: 1, value: 0 }, { offset: 2, value: 0 }, { offset: 3, value: 0 }, { offset: 4, value: 0 }, { offset: 5, value: 0 }, { offset: 6, value: 0 }] },
              ],
            },
          },
        },
        error: new Error('Test error'),
      };

      render(
        <MockedProvider mocks={[fixturesMock, createLookErrorMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText('Look Name *'), 'Test');
      fireEvent.click(screen.getByRole('button', { name: 'Create Look' }));

      await waitFor(() => {
        const errorContainer = screen.getByText('Test error').closest('div.bg-red-50');
        expect(errorContainer).toHaveClass('bg-red-50', 'border', 'border-red-200');
      });
    });
  });

  describe('modal close behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const backdrop = screen.getByTestId('create-look-modal-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form fields when closing', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Look Name *') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;

      await userEvent.type(nameInput, 'Test Name');
      await userEvent.type(descriptionInput, 'Test Description');

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('renders as BottomSheet dialog', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('renders backdrop', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const backdrop = screen.getByTestId('create-look-modal-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('applies correct button styling on desktop', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('border', 'border-gray-300', 'bg-white', 'text-gray-700');

      const submitButton = screen.getByRole('button', { name: 'Create Look' });
      expect(submitButton).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const buttonContainer = screen.getByRole('button', { name: 'Create Look' }).parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows create button first on mobile', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const buttons = screen.getAllByRole('button');
      const buttonLabels = buttons.map(b => b.textContent);
      expect(buttonLabels).toContain('Create Look');
      expect(buttonLabels).toContain('Cancel');
    });

    it('has larger touch targets on mobile', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      const submitButton = screen.getByRole('button', { name: 'Create Look' });
      expect(submitButton).toHaveClass('min-h-[44px]');
    });
  });

  describe('testId', () => {
    it('has correct testId on modal', async () => {
      render(
        <MockedProvider mocks={[fixturesMock]}>
          <CreateLookModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByTestId('create-look-modal')).toBeInTheDocument();
    });
  });
});
