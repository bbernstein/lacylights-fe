import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import SceneEditorLayout from '../SceneEditorLayout';
import { GET_SCENE } from '@/graphql/scenes';
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

const mockScene = {
  id: 'scene-1',
  name: 'Test Scene',
  description: 'Test scene description',
  createdAt: '2023-01-01T12:00:00Z',
  updatedAt: '2023-01-02T12:00:00Z',
  project: mockProject,
  fixtureValues: [
    {
      id: 'fv-1',
      fixture: mockFixture,
      channelValues: [255, 128, 64, 200],
      __typename: 'FixtureValue',
    },
  ],
  __typename: 'Scene',
};

const mockGetSceneQuery = {
  request: {
    query: GET_SCENE,
    variables: { id: 'scene-1' },
  },
  result: {
    data: {
      scene: mockScene,
    },
  },
};

describe('SceneEditorLayout', () => {
  const defaultProps = {
    sceneId: 'scene-1',
    mode: 'channels' as const,
    onClose: jest.fn(),
    onToggleMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with channels mode', () => {
      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Back to Scenes')).toBeInTheDocument();
      expect(screen.getByText('Channel List')).toBeInTheDocument();
      expect(screen.getByText('2D Layout')).toBeInTheDocument();
      expect(screen.getByTestId('channel-list-editor')).toBeInTheDocument();
    });

    it('renders with layout mode', () => {
      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      expect(screen.getByText('Back to Scenes')).toBeInTheDocument();
      expect(screen.getByText('Channel List')).toBeInTheDocument();
      expect(screen.getByText('2D Layout')).toBeInTheDocument();
    });

    it('shows loading state in layout mode before data loads', () => {
      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      expect(screen.getByText('Loading scene...')).toBeInTheDocument();
    });
  });

  describe('mode switching', () => {
    it('highlights active mode tab', () => {
      const { rerender } = render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="channels" />
        </MockedProvider>
      );

      const channelListButton = screen.getByText('Channel List');
      const layoutButton = screen.getByText('2D Layout');

      expect(channelListButton).toHaveClass('bg-blue-600');
      expect(layoutButton).not.toHaveClass('bg-blue-600');

      rerender(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      expect(channelListButton).not.toHaveClass('bg-blue-600');
      expect(layoutButton).toHaveClass('bg-blue-600');
    });

    it('calls onToggleMode when switching to layout mode', async () => {
      const onToggleMode = jest.fn();

      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="channels" onToggleMode={onToggleMode} />
        </MockedProvider>
      );

      const layoutButton = screen.getByText('2D Layout');
      await userEvent.click(layoutButton);

      expect(onToggleMode).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleMode when switching to channels mode', async () => {
      const onToggleMode = jest.fn();

      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="layout" onToggleMode={onToggleMode} />
        </MockedProvider>
      );

      const channelListButton = screen.getByText('Channel List');
      await userEvent.click(channelListButton);

      expect(onToggleMode).toHaveBeenCalledTimes(1);
    });

    it('does not call onToggleMode when clicking current mode', async () => {
      const onToggleMode = jest.fn();

      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="channels" onToggleMode={onToggleMode} />
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
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} onClose={onClose} />
        </MockedProvider>
      );

      const backButton = screen.getByText('Back to Scenes');
      await userEvent.click(backButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('GraphQL data loading', () => {
    it('skips query when in channels mode', () => {
      const { container } = render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="channels" />
        </MockedProvider>
      );

      // Query is skipped, so no loading state or layout canvas
      expect(screen.queryByText('Loading scene...')).not.toBeInTheDocument();
      expect(screen.getByTestId('channel-list-editor')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="layout-canvas"]')).not.toBeInTheDocument();
    });

    it('fetches scene data when in layout mode', async () => {
      render(
        <MockedProvider mocks={[mockGetSceneQuery]} addTypename={false}>
          <SceneEditorLayout {...defaultProps} mode="layout" />
        </MockedProvider>
      );

      // Initially shows loading
      expect(screen.getByText('Loading scene...')).toBeInTheDocument();

      // After data loads, shows layout canvas
      await screen.findByTestId('layout-canvas');
      expect(screen.getByTestId('layout-canvas')).toBeInTheDocument();
      expect(screen.queryByText('Loading scene...')).not.toBeInTheDocument();
    });
  });
});
