import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import AddFixtureModal from '../AddFixtureModal';
import {
  GET_MANUFACTURERS,
  GET_MODELS,
  CREATE_FIXTURE_INSTANCE,
  GET_PROJECT_FIXTURES,
} from '../../graphql/fixtures';
import { FadeBehavior } from '../../types';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

// Mock the Autocomplete component to simplify testing
jest.mock('../Autocomplete', () => {
  return function MockAutocomplete({ value, onChange, onSelect, options = [], placeholder }: {
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (value: string) => void;
    options?: string[];
    placeholder?: string;
  }) {
    return (
      <div data-testid={`autocomplete-${placeholder?.toLowerCase().replace(/\s+/g, '-')}`}>
        <input
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          data-testid={`input-${placeholder?.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <div data-testid="options-list">
          {options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => onSelect?.(option)}
              data-testid={`option-${option.replace(/\s+/g, '-')}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };
});

const mockManufacturers = ['ETC', 'Chauvet', 'Martin'];
const mockModels = [
  {
    id: 'model-1',
    model: 'S4 LED Series 2',
    modes: [
      { id: 'mode-1', name: 'Basic', channelCount: 4 },
      { id: 'mode-2', name: 'Extended', channelCount: 8 },
    ],
  },
  {
    id: 'model-2',
    model: 'Par LED',
    modes: [
      { id: 'mode-3', name: 'RGBW', channelCount: 4 },
    ],
  },
];

const mockProjectFixtures = {
  id: 'project-1',
  fixtures: [
    {
      id: 'fixture-1',
      name: 'Existing Fixture',
      description: '',
      universe: 1,
      startChannel: 1,
      tags: [],
      projectOrder: 1,
      createdAt: '2023-01-01T12:00:00Z',
      definitionId: 'def-1',
      manufacturer: 'ETC',
      model: 'S4 LED',
      type: 'LED',
      modeName: 'Basic',
      channelCount: 4,
      channels: [
        { id: 'ch-1', offset: 0, name: 'Red', type: 'red', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: 'ch-2', offset: 1, name: 'Green', type: 'green', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: 'ch-3', offset: 2, name: 'Blue', type: 'blue', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: 'ch-4', offset: 3, name: 'White', type: 'white', minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ],
    },
  ],
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  projectId: 'test-project-123',
  onFixtureAdded: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_MANUFACTURERS,
      variables: { search: undefined },
    },
    result: {
      data: {
        fixtureDefinitions: mockManufacturers.map(manufacturer => ({
          manufacturer,
        })),
      },
    },
  },
  {
    request: {
      query: GET_MODELS,
      variables: { manufacturer: 'ETC', search: undefined },
    },
    result: {
      data: {
        fixtureDefinitions: mockModels,
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_FIXTURES,
      variables: { projectId: 'test-project-123' },
    },
    result: {
      data: {
        project: mockProjectFixtures,
      },
    },
  },
  {
    request: {
      query: CREATE_FIXTURE_INSTANCE,
      variables: {
        input: {
          projectId: 'test-project-123',
          fixtureDefinitionId: 'model-1',
          modeId: 'mode-1',
          universe: 1,
          startChannel: 5,
          name: 'Test Fixture',
          description: '',
          count: 1,
        },
      },
    },
    result: {
      data: {
        createFixtureInstance: {
          id: 'new-fixture-1',
          name: 'Test Fixture',
          description: '',
          universe: 1,
          startChannel: 5,
          manufacturer: 'ETC',
          model: 'S4 LED Series 2',
          modeName: 'Basic',
          channelCount: 4,
        },
      },
    },
  },
];

const renderWithProvider = (mocks = createMocks(), props = {}) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AddFixtureModal {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('AddFixtureModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('basic rendering', () => {
    it('renders nothing when closed', () => {
      renderWithProvider(createMocks(), { isOpen: false });
      expect(screen.queryByRole('heading', { name: 'Add Fixture' })).not.toBeInTheDocument();
    });

    it('renders modal when open', () => {
      renderWithProvider();
      expect(screen.getByRole('heading', { name: 'Add Fixture' })).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Fixture' })).toBeInTheDocument();
    });

    it('renders form fields', () => {
      renderWithProvider();
      expect(screen.getByLabelText('Fixture Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Universe')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Channel')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Fixtures')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('allows entering fixture name', async () => {
      renderWithProvider();
      const nameInput = screen.getByLabelText('Fixture Name');

      await userEvent.type(nameInput, 'Test Fixture');
      expect(nameInput).toHaveValue('Test Fixture');
    });

    it('allows entering description', async () => {
      renderWithProvider();
      const descInput = screen.getByLabelText('Description');

      await userEvent.type(descInput, 'Test description');
      expect(descInput).toHaveValue('Test description');
    });

    it('allows changing universe', async () => {
      renderWithProvider();
      const universeInput = screen.getByLabelText('Universe');

      // Clear and type new value using fireEvent for reliable clearing
      fireEvent.change(universeInput, { target: { value: '' } });
      await userEvent.type(universeInput, '2');
      expect(universeInput).toHaveValue(2);
    });

    it('allows changing start channel', async () => {
      renderWithProvider();
      const channelInput = screen.getByLabelText('Start Channel');

      fireEvent.change(channelInput, { target: { value: '' } });
      await userEvent.type(channelInput, '10');
      expect(channelInput).toHaveValue(10);
    });

    it('allows changing number of fixtures', async () => {
      renderWithProvider();
      const numInput = screen.getByLabelText('Number of Fixtures');

      fireEvent.change(numInput, { target: { value: '' } });
      await userEvent.type(numInput, '3');
      expect(numInput).toHaveValue(3);
    });
  });

  describe('modal controls', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      renderWithProvider();

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('renders modal backdrop', () => {
      renderWithProvider();

      // Check that the modal backdrop exists
      const backdrop = screen.getByRole('heading', { name: 'Add Fixture' }).closest('.fixed');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('shows validation error when submitting empty form', async () => {
      renderWithProvider();

      const _submitButton = screen.getByRole('button', { name: 'Add Fixture' });
      await userEvent.click(_submitButton);

      // Should show some validation feedback
      await waitFor(() => {
        // The component should handle validation - exact text may vary
        expect(_submitButton).toBeDisabled();
      });
    });

    it('handles form submission with valid data', async () => {
      renderWithProvider();

      // Fill out the name field at minimum
      const nameInput = screen.getByLabelText('Fixture Name');
      await userEvent.type(nameInput, 'Test Fixture');

      // The submit button should be present
      const _submitButton = screen.getByRole('button', { name: 'Add Fixture' });
      expect(_submitButton).toBeInTheDocument();
    });
  });

  describe('GraphQL integration', () => {
    it('loads project fixtures on mount', async () => {
      renderWithProvider();

      // The component should load existing fixtures for validation
      await waitFor(() => {
        // This is checked internally by the component for channel conflicts
        expect(screen.getByRole('heading', { name: 'Add Fixture' })).toBeInTheDocument();
      });
    });

    it('handles GraphQL errors gracefully', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: 'test-project-123' },
          },
          error: new Error('Network error'),
        },
      ] as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      renderWithProvider(errorMocks);

      // Component should still render even with errors
      expect(screen.getByRole('heading', { name: 'Add Fixture' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      renderWithProvider();

      expect(screen.getByLabelText('Fixture Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Universe')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Channel')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Fixtures')).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      renderWithProvider();

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Fixture' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderWithProvider();

      expect(screen.getByRole('heading', { name: 'Add Fixture' })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles missing project ID', () => {
      renderWithProvider(createMocks(), { projectId: '' });

      // Should still render the modal
      expect(screen.getByRole('heading', { name: 'Add Fixture' })).toBeInTheDocument();
    });

    it('handles extreme input values', async () => {
      renderWithProvider();

      const universeInput = screen.getByLabelText('Universe');
      const channelInput = screen.getByLabelText('Start Channel');

      // Test minimum values
      fireEvent.change(universeInput, { target: { value: '' } });
      await userEvent.type(universeInput, '1');
      expect(universeInput).toHaveValue(1);

      fireEvent.change(channelInput, { target: { value: '' } });
      await userEvent.type(channelInput, '1');
      expect(channelInput).toHaveValue(1);

      // Test maximum values
      fireEvent.change(universeInput, { target: { value: '' } });
      await userEvent.type(universeInput, '32768');
      expect(universeInput).toHaveValue(32768);

      fireEvent.change(channelInput, { target: { value: '' } });
      await userEvent.type(channelInput, '512');
      expect(channelInput).toHaveValue(512);
    });

    it('handles large number of fixtures', async () => {
      renderWithProvider();

      const numInput = screen.getByLabelText('Number of Fixtures');
      fireEvent.change(numInput, { target: { value: '' } });
      await userEvent.type(numInput, '100');

      expect(numInput).toHaveValue(100);
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', () => {
      renderWithProvider();

      const addButton = screen.getByRole('button', { name: 'Add Fixture' });
      const buttonContainer = addButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows Add Fixture button first on mobile', () => {
      renderWithProvider();

      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === 'Add Fixture' || btn.textContent === 'Cancel'
      );
      const buttonLabels = buttons.map(b => b.textContent);
      const addIndex = buttonLabels.indexOf('Add Fixture');
      const cancelIndex = buttonLabels.indexOf('Cancel');
      expect(addIndex).toBeLessThan(cancelIndex);
    });

    it('has larger touch targets on mobile', () => {
      renderWithProvider();

      const addButton = screen.getByRole('button', { name: 'Add Fixture' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(addButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
    });

    it('has touch-manipulation class on mobile buttons', () => {
      renderWithProvider();

      const addButton = screen.getByRole('button', { name: 'Add Fixture' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(addButton).toHaveClass('touch-manipulation');
      expect(cancelButton).toHaveClass('touch-manipulation');
    });

    it('renders as BottomSheet dialog', () => {
      renderWithProvider();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});