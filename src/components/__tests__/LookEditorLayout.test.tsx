import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import LookEditorLayout, { buildFixtureChannelValues } from '../LookEditorLayout';
import { GET_LOOK } from '@/graphql/looks';
import { FixtureType, ChannelType, FadeBehavior } from '@/types';

// Mock ChannelListEditor since it's tested separately
jest.mock('../ChannelListEditor', () => {
  return function MockChannelListEditor() {
    return <div data-testid="channel-list-editor">Channel List Editor</div>;
  };
});

// Mock LayoutCanvas since it's tested separately
jest.mock('../LayoutCanvas', () => {
  return function MockLayoutCanvas() {
    return <div data-testid="layout-canvas">Layout Canvas</div>;
  };
});

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

// Mock StreamDockContext
jest.mock('@/contexts/StreamDockContext', () => ({
  useStreamDock: () => ({
    connectionState: 'disconnected',
    registerCuePlayerHandlers: jest.fn(),
    registerLookEditorHandlers: jest.fn(),
    registerColorPickerHandlers: jest.fn(),
    publishCueListState: jest.fn(),
    publishLookEditorState: jest.fn(),
    publishColorPickerState: jest.fn(),
    publishRoute: jest.fn(),
  }),
}));

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  __typename: 'Project',
};

const mockFixture = {
  id: 'fixture-1',
  name: 'Light 1',
  manufacturer: 'ETC',
  model: 'S4 LED',
  type: FixtureType.LED_PAR,
  modeName: 'RGBW',
  universe: 1,
  startChannel: 1,
  channelCount: 4,
  channels: [
    { id: 'ch-1', offset: 0, name: 'Red', type: ChannelType.RED, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: 'ch-2', offset: 1, name: 'Green', type: ChannelType.GREEN, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: 'ch-3', offset: 2, name: 'Blue', type: ChannelType.BLUE, minValue: 0, maxValue: 255, defaultValue: 0, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
    { id: 'ch-4', offset: 3, name: 'Intensity', type: ChannelType.INTENSITY, minValue: 0, maxValue: 255, defaultValue: 255, fadeBehavior: FadeBehavior.FADE, isDiscrete: false },
  ],
  __typename: 'FixtureInstance',
};

const mockLook = {
  id: 'look-1',
  name: 'Test Look',
  description: 'Test look description',
  createdAt: '2023-01-01T12:00:00Z',
  updatedAt: '2023-01-02T12:00:00Z',
  project: mockProject,
  fixtureValues: [
    {
      id: 'fv-1',
      fixture: mockFixture,
      channels: [
        { offset: 0, value: 255 },
        { offset: 1, value: 128 },
        { offset: 2, value: 64 },
        { offset: 3, value: 200 },
      ],
      __typename: 'FixtureValue',
    },
  ],
  __typename: 'Look',
};

const mockGetLookQuery = {
  request: {
    query: GET_LOOK,
    variables: { id: 'look-1' },
  },
  result: {
    data: {
      look: mockLook,
    },
  },
};

describe('LookEditorLayout', () => {
  const defaultProps = {
    lookId: 'look-1',
    mode: 'channels' as const,
    onClose: jest.fn(),
    onToggleMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with channels mode', async () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} />
        </MockedProvider>
      );

      // Both mobile and desktop toolbars render back button text
      expect(screen.getAllByText('Back to Looks').length).toBeGreaterThan(0);
      expect(screen.getByText('Channel List')).toBeInTheDocument();
      expect(screen.getByText('2D Layout')).toBeInTheDocument();
      // Wait for look data to load before checking for channel list editor
      await screen.findByTestId('channel-list-editor');
      expect(screen.getByTestId('channel-list-editor')).toBeInTheDocument();
    });

    it('renders with layout mode', async () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Both mobile and desktop toolbars render back button text
      expect(screen.getAllByText('Back to Looks').length).toBeGreaterThan(0);
      expect(screen.getByText('Channel List')).toBeInTheDocument();
      expect(screen.getByText('2D Layout')).toBeInTheDocument();
      // Wait for look data to load
      await screen.findByTestId('layout-canvas');
    });

    it('shows loading state in layout mode before data loads', () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      expect(screen.getByText('Loading look...')).toBeInTheDocument();
    });
  });

  describe('mode switching', () => {
    it('highlights active mode tab', () => {
      const { rerender } = render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="channels" />
        </MockedProvider>
      );

      const channelListButton = screen.getByText('Channel List');
      const layoutButton = screen.getByText('2D Layout');

      expect(channelListButton).toHaveClass('bg-blue-600');
      expect(layoutButton).not.toHaveClass('bg-blue-600');

      rerender(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      expect(channelListButton).not.toHaveClass('bg-blue-600');
      expect(layoutButton).toHaveClass('bg-blue-600');
    });

    it('calls onToggleMode when switching to layout mode', async () => {
      const onToggleMode = jest.fn();

      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="channels" onToggleMode={onToggleMode} />
        </MockedProvider>
      );

      const layoutButton = screen.getByText('2D Layout');
      await userEvent.click(layoutButton);

      expect(onToggleMode).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleMode when switching to channels mode', async () => {
      const onToggleMode = jest.fn();

      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" onToggleMode={onToggleMode} />
        </MockedProvider>
      );

      const channelListButton = screen.getByText('Channel List');
      await userEvent.click(channelListButton);

      expect(onToggleMode).toHaveBeenCalledTimes(1);
    });

    it('does not call onToggleMode when clicking current mode', async () => {
      const onToggleMode = jest.fn();

      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="channels" onToggleMode={onToggleMode} />
        </MockedProvider>
      );

      const channelListButton = screen.getByText('Channel List');
      await userEvent.click(channelListButton);

      expect(onToggleMode).not.toHaveBeenCalled();
    });
  });

  describe('back button', () => {
    it('calls onClose when back button is clicked', async () => {
      const onClose = jest.fn();

      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} onClose={onClose} />
        </MockedProvider>
      );

      // Use getAllByText since both mobile and desktop toolbars render the text
      // Select the desktop version (second element, as mobile toolbar renders first)
      const backButtons = screen.getAllByText('Back to Looks');
      await userEvent.click(backButtons[0]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('GraphQL data loading', () => {
    it('fetches look data in both modes for shared state', async () => {
      // Look data is now fetched in all modes to support shared state between views
      const { container } = render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="channels" />
        </MockedProvider>
      );

      // Shows loading initially while fetching look data
      expect(screen.getByText('Loading look...')).toBeInTheDocument();

      // After data loads, shows channel list editor
      await screen.findByTestId('channel-list-editor');
      expect(screen.getByTestId('channel-list-editor')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="layout-canvas"]')).not.toBeInTheDocument();
    });

    it('fetches look data when in layout mode', async () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Initially shows loading
      expect(screen.getByText('Loading look...')).toBeInTheDocument();

      // After data loads, shows layout canvas
      await screen.findByTestId('layout-canvas');
      expect(screen.getByTestId('layout-canvas')).toBeInTheDocument();
      expect(screen.queryByText('Loading look...')).not.toBeInTheDocument();
    });
  });

  describe('buildFixtureChannelValues', () => {
    it('converts dense array to sparse format', () => {
      const result = buildFixtureChannelValues('fixture-1', [255, 128, 64, 0], undefined);

      expect(result.fixtureId).toBe('fixture-1');
      expect(result.channels).toEqual([
        { offset: 0, value: 255 },
        { offset: 1, value: 128 },
        { offset: 2, value: 64 },
        { offset: 3, value: 0 },
      ]);
    });

    it('passes through sparse format unchanged', () => {
      const sparseChannels = [
        { offset: 0, value: 255 },
        { offset: 2, value: 64 },
      ];
      const result = buildFixtureChannelValues('fixture-1', sparseChannels, undefined);

      expect(result.fixtureId).toBe('fixture-1');
      expect(result.channels).toEqual(sparseChannels);
    });

    it('filters channels by active set when provided', () => {
      const activeChannels = new Set([0, 2]); // Only channels 0 and 2 are active
      const result = buildFixtureChannelValues('fixture-1', [255, 128, 64, 0], activeChannels);

      expect(result.fixtureId).toBe('fixture-1');
      expect(result.channels).toEqual([
        { offset: 0, value: 255 },
        { offset: 2, value: 64 },
      ]);
    });

    it('returns all channels when activeChannels is undefined', () => {
      const result = buildFixtureChannelValues('fixture-1', [255, 128], undefined);

      expect(result.channels).toHaveLength(2);
      expect(result.channels).toEqual([
        { offset: 0, value: 255 },
        { offset: 1, value: 128 },
      ]);
    });

    it('handles empty dense array', () => {
      const result = buildFixtureChannelValues('fixture-1', [], undefined);

      expect(result.fixtureId).toBe('fixture-1');
      expect(result.channels).toEqual([]);
    });

    it('handles empty sparse array', () => {
      const result = buildFixtureChannelValues('fixture-1', [] as { offset: number; value: number }[], undefined);

      expect(result.fixtureId).toBe('fixture-1');
      expect(result.channels).toEqual([]);
    });

    it('filters sparse channels by active set', () => {
      const sparseChannels = [
        { offset: 0, value: 255 },
        { offset: 1, value: 128 },
        { offset: 2, value: 64 },
      ];
      const activeChannels = new Set([1]); // Only channel 1 is active

      const result = buildFixtureChannelValues('fixture-1', sparseChannels, activeChannels);

      expect(result.channels).toEqual([
        { offset: 1, value: 128 },
      ]);
    });

    it('returns empty array when no channels match active set', () => {
      const activeChannels = new Set([5, 6]); // Channels that don't exist
      const result = buildFixtureChannelValues('fixture-1', [255, 128, 64], activeChannels);

      expect(result.channels).toEqual([]);
    });
  });

  describe('header display', () => {
    it('displays look name in header after loading', async () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Wait for look data to load
      await screen.findByTestId('layout-canvas');

      // Look name should be displayed in the header (may have multiple instances for mobile/desktop)
      expect(screen.getAllByText('Test Look').length).toBeGreaterThan(0);
    });

    it('shows Loading... before look name is available', () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Initially shows loading placeholder (may have multiple instances for mobile/desktop)
      expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
    });
  });

  describe('save button accessibility', () => {
    it('has aria-live attribute for screen reader announcements', async () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Wait for look data to load
      await screen.findByTestId('layout-canvas');

      // Find save button by its title
      const saveButton = screen.getByTitle('Save changes (Cmd+S)');
      expect(saveButton).toHaveAttribute('aria-live', 'polite');
    });

    it('has appropriate aria-label for current state', async () => {
      render(
        <MockedProvider mocks={[mockGetLookQuery]} addTypename={false}>
          <LookEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Wait for look data to load
      await screen.findByTestId('layout-canvas');

      // Find save button - when no changes, should indicate no changes to save
      const saveButton = screen.getByTitle('Save changes (Cmd+S)');
      expect(saveButton).toHaveAttribute('aria-label', 'No changes to save');
    });
  });
});
