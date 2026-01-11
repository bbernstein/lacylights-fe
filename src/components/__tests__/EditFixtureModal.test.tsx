import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import EditFixtureModal from '../EditFixtureModal';
import {
  GET_MANUFACTURERS,
  GET_MODELS,
  UPDATE_FIXTURE_INSTANCE,
  DELETE_FIXTURE_INSTANCE,
  GET_PROJECT_FIXTURES,
} from '../../graphql/fixtures';
import { FixtureType, ChannelType, FadeBehavior } from '../../types';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

// Mock Autocomplete to simplify testing
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
        <div data-testid="options">
          {options.map((option: string, index: number) => (
            <button key={index} onClick={() => onSelect?.(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };
});

const mockFixture = {
  id: 'fixture-1',
  name: 'Test Fixture',
  description: 'Test description',
  universe: 1,
  startChannel: 10,
  tags: [],
  projectOrder: 1,
  createdAt: '2023-01-01T12:00:00Z',
  definitionId: 'def-1',
  manufacturer: 'ETC',
  model: 'S4 LED',
  type: FixtureType.LED_PAR,
  modeName: 'Basic',
  channelCount: 4,
  project: {
    id: 'project-1',
    name: 'Test Project',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    fixtures: [],
    scenes: [],
    cueLists: [],
    users: [],
    layoutCanvasWidth: 2000,
    layoutCanvasHeight: 2000,
  },
  channels: [
    { id: 'ch-1', offset: 0, name: 'Red', type: ChannelType.RED, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: 'ch-2', offset: 1, name: 'Green', type: ChannelType.GREEN, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: 'ch-3', offset: 2, name: 'Blue', type: ChannelType.BLUE, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: 'ch-4', offset: 3, name: 'White', type: ChannelType.WHITE, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
  ],
  __typename: 'FixtureInstance',
};

const mockProjectFixtures = {
  id: 'project-1',
  fixtures: [
    {
      id: 'fixture-2',
      name: 'Other Fixture',
      description: '',
      universe: 1,
      startChannel: 1,
      tags: [],
      projectOrder: 2,
      createdAt: '2023-01-01T12:00:00Z',
      definitionId: 'def-2',
      manufacturer: 'Chauvet',
      model: 'Par LED',
      type: FixtureType.LED_PAR,
      modeName: 'RGBW',
      channelCount: 4,
      channels: [
        { id: 'ch-5', offset: 0, name: 'Red', type: ChannelType.RED, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: 'ch-6', offset: 1, name: 'Green', type: ChannelType.GREEN, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: 'ch-7', offset: 2, name: 'Blue', type: ChannelType.BLUE, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
        { id: 'ch-8', offset: 3, name: 'White', type: ChannelType.WHITE, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
      ],
      __typename: 'FixtureInstance',
    },
  ],
  __typename: 'Project',
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  fixture: mockFixture,
  onFixtureUpdated: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_PROJECT_FIXTURES,
      variables: { projectId: 'project-1' },
    },
    result: {
      data: {
        project: mockProjectFixtures,
      },
    },
  },
  {
    request: {
      query: GET_MANUFACTURERS,
      variables: { search: undefined },
    },
    result: {
      data: {
        fixtureDefinitions: [
          { manufacturer: 'ETC' },
          { manufacturer: 'Chauvet' },
          { manufacturer: 'Martin' },
        ],
      },
    },
  },
  {
    request: {
      query: GET_MANUFACTURERS,
      variables: { search: 'ETC' },
    },
    result: {
      data: {
        fixtureDefinitions: [
          { manufacturer: 'ETC' },
        ],
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
        fixtureDefinitions: [
          {
            id: 'model-1',
            model: 'S4 LED',
            modes: [
              { id: 'mode-1', name: 'Basic', channelCount: 4 },
              { id: 'mode-2', name: 'Extended', channelCount: 8 },
            ],
          },
        ],
      },
    },
  },
  {
    request: {
      query: UPDATE_FIXTURE_INSTANCE,
      variables: {
        id: 'fixture-1',
        input: {
          name: 'Updated Fixture',
          description: 'Updated description',
          universe: 1,
          startChannel: 10,
        },
      },
    },
    result: {
      data: {
        updateFixtureInstance: {
          id: 'fixture-1',
          name: 'Updated Fixture',
          description: 'Updated description',
          universe: 1,
          startChannel: 10,
          manufacturer: 'ETC',
          model: 'S4 LED',
          modeName: 'Basic',
          channelCount: 4,
        },
      },
    },
  },
  {
    request: {
      query: DELETE_FIXTURE_INSTANCE,
      variables: { id: 'fixture-1' },
    },
    result: {
      data: {
        deleteFixtureInstance: true,
      },
    },
  },
];

const renderWithProvider = (mocks = createMocks(), props = {}) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <EditFixtureModal {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('EditFixtureModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      renderWithProvider(createMocks(), { isOpen: false });
      expect(screen.queryByRole('heading', { name: 'Edit Fixture' })).not.toBeInTheDocument();
    });

    it('renders nothing when no fixture provided', () => {
      renderWithProvider(createMocks(), { fixture: null });
      expect(screen.queryByRole('heading', { name: 'Edit Fixture' })).not.toBeInTheDocument();
    });

    it('renders modal when open with fixture', () => {
      renderWithProvider();
      expect(screen.getByRole('heading', { name: 'Edit Fixture' })).toBeInTheDocument();
      expect(screen.getByText('Update Fixture')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders form fields with fixture data', () => {
      renderWithProvider();
      expect(screen.getByDisplayValue('Test Fixture')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Universe
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Start Channel
    });

    it('displays fixture information in form', () => {
      renderWithProvider();
      expect(screen.getByDisplayValue('Test Fixture')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('allows editing fixture name', async () => {
      renderWithProvider();
      const nameInput = screen.getByDisplayValue('Test Fixture');

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'New Name');
      expect(nameInput).toHaveValue('New Name');
    });

    it('allows editing description', async () => {
      renderWithProvider();
      const descInput = screen.getByDisplayValue('Test description');

      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'New description');
      expect(descInput).toHaveValue('New description');
    });

    it('universe input is editable', () => {
      renderWithProvider();
      const universeInput = screen.getByDisplayValue('1');

      expect(universeInput).toBeInTheDocument();
      expect(universeInput).not.toBeDisabled();
      expect(universeInput).toHaveAttribute('type', 'text');
    });

    it('start channel input is editable', () => {
      renderWithProvider();
      const channelInput = screen.getByDisplayValue('10');

      expect(channelInput).toBeInTheDocument();
      expect(channelInput).not.toBeDisabled();
      expect(channelInput).toHaveAttribute('type', 'text');
    });
  });

  describe('modal actions', () => {
    it('calls onClose when Cancel is clicked', async () => {
      renderWithProvider();

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('shows delete confirmation when Delete is clicked', async () => {
      renderWithProvider();

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('allows canceling delete confirmation', async () => {
      renderWithProvider();

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      const cancelDeleteButton = screen.getByText('Cancel', { selector: 'button:not(:first-of-type)' });
      await userEvent.click(cancelDeleteButton);

      expect(screen.queryByText('Are you sure you want to delete this fixture?')).not.toBeInTheDocument();
    });

    it('displays form correctly', () => {
      renderWithProvider();

      const nameInput = screen.getByDisplayValue('Test Fixture');
      const updateButton = screen.getByText('Update Fixture');

      expect(nameInput).toBeInTheDocument();
      expect(updateButton).toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('shows delete button', () => {
      renderWithProvider();

      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute('type', 'button');
    });
  });

  describe('fixture details display', () => {
    it('displays form with current values', () => {
      renderWithProvider();

      expect(screen.getByLabelText('Fixture Name')).toHaveValue('Test Fixture');
      expect(screen.getByLabelText('Description')).toHaveValue('Test description');
      expect(screen.getByLabelText('Universe')).toHaveValue('1');
      expect(screen.getByLabelText('Start Channel')).toHaveValue('10');
    });
  });

  describe('validation', () => {
    it('has form validation attributes', () => {
      renderWithProvider();

      // Text inputs use inputMode for numeric keyboard on mobile
      const universeInput = screen.getByLabelText('Universe');
      expect(universeInput).toHaveAttribute('inputMode', 'numeric');

      const channelInput = screen.getByLabelText('Start Channel');
      expect(channelInput).toHaveAttribute('inputMode', 'numeric');

      const nameInput = screen.getByLabelText('Fixture Name');
      expect(nameInput).toHaveAttribute('required');
    });
  });

  describe('error handling', () => {
    it('shows update button properly', () => {
      renderWithProvider();

      const updateButton = screen.getByText('Update Fixture');
      expect(updateButton).toBeInTheDocument();
      expect(updateButton).toHaveAttribute('type', 'submit');
    });

    it('handles GraphQL loading errors gracefully', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: 'project-1' },
          },
          error: new Error('Network error'),
        },
      ];

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Should still render the modal
      expect(screen.getByRole('heading', { name: 'Edit Fixture' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      renderWithProvider();

      expect(screen.getByLabelText('Fixture Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Universe')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Channel')).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      renderWithProvider();

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Fixture' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderWithProvider();

      expect(screen.getByRole('heading', { name: 'Edit Fixture' })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles fixture without project', () => {
      const fixtureWithoutProject = { ...mockFixture, project: null };
      renderWithProvider(createMocks(), { fixture: fixtureWithoutProject });

      expect(screen.getByRole('heading', { name: 'Edit Fixture' })).toBeInTheDocument();
    });

    it('handles fixture without channels', () => {
      const fixtureWithoutChannels = { ...mockFixture, channels: [] };
      renderWithProvider(createMocks(), { fixture: fixtureWithoutChannels });

      expect(screen.getByRole('heading', { name: 'Edit Fixture' })).toBeInTheDocument();
    });

    it('displays channel input', () => {
      renderWithProvider();

      const channelInput = screen.getByDisplayValue('10');
      expect(channelInput).toBeInTheDocument();
      expect(channelInput).toHaveValue('10');
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', () => {
      renderWithProvider();

      const updateButton = screen.getByRole('button', { name: 'Update Fixture' });
      const buttonContainer = updateButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows Update Fixture button first on mobile', () => {
      renderWithProvider();

      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === 'Update Fixture' || btn.textContent === 'Cancel' || btn.textContent === 'Delete Fixture'
      );
      const buttonLabels = buttons.map(b => b.textContent);
      const updateIndex = buttonLabels.indexOf('Update Fixture');
      const cancelIndex = buttonLabels.indexOf('Cancel');
      expect(updateIndex).toBeLessThan(cancelIndex);
    });

    it('has larger touch targets on mobile', () => {
      renderWithProvider();

      const updateButton = screen.getByRole('button', { name: 'Update Fixture' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const deleteButton = screen.getByRole('button', { name: 'Delete Fixture' });

      expect(updateButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
      expect(deleteButton).toHaveClass('min-h-[44px]');
    });

    it('has touch-manipulation class on mobile buttons', () => {
      renderWithProvider();

      const updateButton = screen.getByRole('button', { name: 'Update Fixture' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const deleteButton = screen.getByRole('button', { name: 'Delete Fixture' });

      expect(updateButton).toHaveClass('touch-manipulation');
      expect(cancelButton).toHaveClass('touch-manipulation');
      expect(deleteButton).toHaveClass('touch-manipulation');
    });

    it('renders as BottomSheet dialog', () => {
      renderWithProvider();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});