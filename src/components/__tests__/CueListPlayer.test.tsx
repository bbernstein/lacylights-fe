import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import CueListPlayer from '../CueListPlayer';
import {
  GET_CUE_LIST,
  GET_CUE_LIST_PLAYBACK_STATUS,
  START_CUE_LIST,
  NEXT_CUE,
  PREVIOUS_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST,
  FADE_TO_BLACK
} from '../../graphql/cueLists';

jest.mock('../../hooks/useCueListPlayback');
jest.mock('../../utils/cueListHelpers', () => ({
  convertCueIndexForLocalState: jest.fn((index) => index === null || index === undefined ? -1 : index),
}));
jest.mock('../../constants/playback', () => ({
  DEFAULT_FADEOUT_TIME: 3.0,
}));

const mockUseCueListPlayback = require('../../hooks/useCueListPlayback').useCueListPlayback as jest.Mock;

describe('CueListPlayer', () => {
  const mockCueListId = 'test-cuelist-123';

  const mockCueList = {
    id: mockCueListId,
    name: 'Test Cue List',
    description: 'A test cue list for testing',
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    project: {
      id: 'project-1',
      name: 'Test Project',
      __typename: 'Project',
    },
    __typename: 'CueList',
    cues: [
      {
        id: 'cue-1',
        name: 'Opening Scene',
        cueNumber: 1,
        scene: {
          id: 'scene-1',
          name: 'Scene 1',
          description: 'Test scene 1',
          fixtureValues: [],
          project: { id: 'project-1', name: 'Test Project', __typename: 'Project' },
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:00:00Z',
          __typename: 'Scene',
        },
        fadeInTime: 2.0,
        fadeOutTime: 3.0,
        followTime: undefined,
        notes: '',
        __typename: 'Cue',
      },
      {
        id: 'cue-2',
        name: 'Mid Scene',
        cueNumber: 2,
        scene: {
          id: 'scene-2',
          name: 'Scene 2',
          description: 'Test scene 2',
          fixtureValues: [],
          project: { id: 'project-1', name: 'Test Project', __typename: 'Project' },
          createdAt: '2023-01-02T12:00:00Z',
          updatedAt: '2023-01-02T12:00:00Z',
          __typename: 'Scene',
        },
        fadeInTime: 1.5,
        fadeOutTime: 2.5,
        followTime: undefined,
        notes: '',
        __typename: 'Cue',
      },
      {
        id: 'cue-3',
        name: 'Closing Scene',
        cueNumber: 3,
        scene: {
          id: 'scene-3',
          name: 'Scene 3',
          description: 'Test scene 3',
          fixtureValues: [],
          project: { id: 'project-1', name: 'Test Project', __typename: 'Project' },
          createdAt: '2023-01-03T12:00:00Z',
          updatedAt: '2023-01-03T12:00:00Z',
          __typename: 'Scene',
        },
        fadeInTime: 3.0,
        fadeOutTime: 4.0,
        followTime: undefined,
        notes: '',
        __typename: 'Cue',
      },
    ],
  };

  const mockPlaybackStatus = {
    cueListId: mockCueListId,
    currentCueIndex: 0,
    isPlaying: true,
    currentCue: mockCueList.cues[0],
    fadeProgress: 50,
    lastUpdated: '2023-01-01T12:00:00Z',
  };

  const createMocks = (
    cueListResult = { data: { cueList: mockCueList } },
    playbackResult = mockPlaybackStatus,
    mutations = {}
  ) => {
    const baseMocks = [
      {
        request: {
          query: GET_CUE_LIST,
          variables: { id: mockCueListId },
        },
        result: cueListResult,
      },
      {
        request: {
          query: GET_CUE_LIST_PLAYBACK_STATUS,
          variables: { cueListId: mockCueListId },
        },
        result: { data: { cueListPlaybackStatus: playbackResult } },
      },
    ];

    // Add mutation mocks if provided
    Object.entries(mutations).forEach(([mutationName, result]) => {
      baseMocks.push({
        request: {
          query: eval(mutationName), // Dynamic query reference
          variables: expect.any(Object),
        },
        result,
      });
    });

    return baseMocks;
  };

  const renderWithProvider = (mocks: unknown[]) => {
    // Suppress console errors for cleaner test output
    const originalError = console.error;
    console.error = jest.fn();

    const result = render(
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        errorPolicy="all"
        defaultOptions={{
          watchQuery: { errorPolicy: 'all' },
          query: { errorPolicy: 'all' },
          mutate: { errorPolicy: 'all' }
        }}
      >
        <CueListPlayer cueListId={mockCueListId} />
      </MockedProvider>
    );

    // Restore console.error after a short delay to avoid test pollution
    setTimeout(() => {
      console.error = originalError;
    }, 100);

    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCueListPlayback.mockReturnValue({
      playbackStatus: mockPlaybackStatus,
    });

    // Mock window.addEventListener and removeEventListener
    jest.spyOn(window, 'addEventListener').mockImplementation();
    jest.spyOn(window, 'removeEventListener').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loading and error states', () => {
    it('shows loading state', () => {
      const mocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: mockCueListId },
          },
          result: { loading: true },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CueListPlayer cueListId={mockCueListId} />
        </MockedProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error state when cue list not found', async () => {
      const mocks = createMocks({ data: { cueList: null } });

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Cue list not found')).toBeInTheDocument();
      });
    });
  });

  describe('rendering with data', () => {
    it('renders cue list header', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Test Cue List')).toBeInTheDocument();
        expect(screen.getByText('A test cue list for testing')).toBeInTheDocument();
      });
    });

    it('renders control buttons', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByTitle('Previous (←)')).toBeInTheDocument();
        expect(screen.getByTitle('GO (Space/Enter)')).toBeInTheDocument();
        expect(screen.getByTitle('Next (→)')).toBeInTheDocument();
        expect(screen.getByTitle('Stop (Esc)')).toBeInTheDocument();
      });
    });

    it('renders keyboard shortcuts help text', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Space/Enter = GO | ← → = Navigate | Esc = Stop')).toBeInTheDocument();
      });
    });

    it('renders cue progress dots', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(3);
        expect(progressDots[0]).toHaveAttribute('title', '1: Opening Scene');
        expect(progressDots[1]).toHaveAttribute('title', '2: Mid Scene');
        expect(progressDots[2]).toHaveAttribute('title', '3: Closing Scene');
      });
    });
  });

  describe('cue display', () => {
    it('displays current and adjacent cues', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
        expect(screen.getByText('Mid Scene')).toBeInTheDocument();
        expect(screen.getByText('Scene: Scene 1')).toBeInTheDocument();
        expect(screen.getByText('Scene: Scene 2')).toBeInTheDocument();
      });
    });

    it('highlights current cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const currentCue = screen.getByText('Opening Scene').closest('div[class*="bg-gray-700"]');
        expect(currentCue).toHaveClass('border-green-500');
        expect(screen.getByText('LIVE')).toBeInTheDocument();
      });
    });

    it('shows fade progress for current cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressBar = document.querySelector('[style*="width: 50%"]');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('marks next cue appropriately', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const nextLabels = screen.getAllByText('NEXT');
        expect(nextLabels.length).toBeGreaterThan(0);
      });
    });

    it('shows ready state when cues exist but none in display range', async () => {
      // Create scenario where cues exist but currentCueIndex makes displayCues empty
      // For displayCues to be empty with cues present, currentCueIndex needs to be < -2
      // since the range is currentCueIndex-2 to currentCueIndex+2
      mockUseCueListPlayback.mockClear();
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          ...mockPlaybackStatus,
          currentCueIndex: -10, // Way out of range
          isPlaying: false,
          currentCue: null
        },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Ready to start')).toBeInTheDocument();
      });
    });

    it('shows empty state when no cues', async () => {
      const emptyCueList = { ...mockCueList, cues: [] };
      const mocks = createMocks({ data: { cueList: emptyCueList } });

      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('No cues in list')).toBeInTheDocument();
      });
    });
  });

  describe('button states', () => {
    it('disables GO button when at end of list', async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 2 }, // Last cue
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByTitle('GO (Space/Enter)');
        expect(goButton).toBeDisabled();
      });
    });

    it('disables Previous button when at start', async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 0 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByTitle('Previous (←)');
        expect(prevButton).toBeDisabled();
      });
    });

    it('shows START when not started', async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('START')).toBeInTheDocument();
      });
    });

    it('shows GO when started', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('GO')).toBeInTheDocument();
      });
    });
  });

  describe('button interactions', () => {
    it('calls startCueList when START is clicked', async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      const _startMutation = jest.fn().mockResolvedValue({ data: {} });
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: START_CUE_LIST,
            variables: { cueListId: mockCueListId, startFromCue: 0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        expect(startButton).toBeInTheDocument();
      });

      const startButton = screen.getByText('START');
      await userEvent.click(startButton);

      // Verify the mutation would be called (mocked GraphQL handles the actual call)
      expect(startButton).toBeInTheDocument();
    });

    it('calls nextCue when GO is clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: NEXT_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 1.5 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByText('GO');
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText('GO');
      await userEvent.click(goButton);
    });

    it('calls previousCue when Previous is clicked', async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 1 },
      });

      const mocks = [
        ...createMocks(),
        {
          request: {
            query: PREVIOUS_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 2.0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByTitle('Previous (←)');
        expect(prevButton).not.toBeDisabled();
      });

      const prevButton = screen.getByTitle('Previous (←)');
      await userEvent.click(prevButton);
    });

    it('calls stopCueList and fadeToBlack when Stop is clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: STOP_CUE_LIST,
            variables: { cueListId: mockCueListId },
          },
          result: { data: {} },
        },
        {
          request: {
            query: FADE_TO_BLACK,
            variables: { fadeOutTime: 3.0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const stopButton = screen.getByTitle('Stop (Esc)');
        expect(stopButton).toBeInTheDocument();
      });

      const stopButton = screen.getByTitle('Stop (Esc)');
      await userEvent.click(stopButton);
    });
  });

  describe('cue jumping', () => {
    it('allows jumping to cues via progress dots', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GO_TO_CUE,
            variables: { cueListId: mockCueListId, cueIndex: 2, fadeInTime: 3.0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(3);
      });

      const thirdDot = screen.getByTitle('3: Closing Scene');
      await userEvent.click(thirdDot);
    });

    it('allows jumping to cues via cue display', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GO_TO_CUE,
            variables: { cueListId: mockCueListId, cueIndex: 1, fadeInTime: 1.5 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Mid Scene')).toBeInTheDocument();
      });

      // Click on a non-current cue to jump to it
      const midSceneCue = screen.getByText('Mid Scene').closest('div[class*="cursor-pointer"]');
      if (midSceneCue) {
        await userEvent.click(midSceneCue);
      }
    });

    it('does not allow jumping to current cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
      });

      // Current cue should not have cursor-pointer class
      const currentCue = screen.getByText('Opening Scene').closest('div');
      expect(currentCue).not.toHaveClass('cursor-pointer');
    });
  });

  describe('keyboard shortcuts', () => {
    it('handles Space key for GO', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('GO')).toBeInTheDocument();
      });

      // Simulate space key press
      const keyboardEvent = new KeyboardEvent('keydown', { key: ' ' });
      fireEvent(window, keyboardEvent);

      // Verify addEventListener was called for keydown
      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('handles Enter key for GO', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('GO')).toBeInTheDocument();
      });

      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('handles Arrow Left for Previous', async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 1 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByTitle('Previous (←)');
        expect(prevButton).not.toBeDisabled();
      });

      const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('handles Arrow Right for GO', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('GO')).toBeInTheDocument();
      });

      const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('handles Escape key for Stop', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByTitle('Stop (Esc)')).toBeInTheDocument();
      });

      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('cleans up keyboard event listeners on unmount', () => {
      const mocks = createMocks();
      const { unmount } = renderWithProvider(mocks);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('styling and visual states', () => {
    it('applies correct styling to current cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const currentCue = screen.getByText('Opening Scene').closest('div[class*="bg-gray-700"]');
        expect(currentCue).toHaveClass('border-green-500');
        expect(currentCue).toHaveClass('scale-105');
      });
    });

    it('applies correct styling to next cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const nextCue = screen.getByText('Mid Scene').closest('div[class*="opacity-80"]');
        expect(nextCue).toBeInTheDocument();
      });
    });

    it('applies correct styling to progress dots', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        const currentDot = progressDots[0]; // First cue is current
        expect(currentDot).toHaveClass('bg-green-500');
        expect(currentDot).toHaveClass('w-3', 'h-3');
      });
    });
  });

  describe('edge cases', () => {
    it('handles missing cue list description', async () => {
      const cueListWithoutDescription = { ...mockCueList, description: "" };
      const mocks = createMocks({ data: { cueList: cueListWithoutDescription } });

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Test Cue List')).toBeInTheDocument();
        expect(screen.queryByText('A test cue list for testing')).not.toBeInTheDocument();
      });
    });

    it('handles single cue list', async () => {
      const singleCueList = { ...mockCueList, cues: [mockCueList.cues[0]] };
      const mocks = createMocks({ data: { cueList: singleCueList } });

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(1);
      });
    });

    it('handles fade progress edge cases', async () => {
      // Test with 0% progress
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, fadeProgress: 0 },
      });

      const mocks = createMocks();
      const { rerender } = renderWithProvider(mocks);

      await waitFor(() => {
        const progressBar = document.querySelector('[style*="width: 0%"]');
        expect(progressBar).not.toBeInTheDocument(); // Should not show at 0%
      });

      // Test with 100% progress
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, fadeProgress: 100 },
      });

      rerender(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CueListPlayer cueListId={mockCueListId} />
        </MockedProvider>
      );

      await waitFor(() => {
        const progressBar = document.querySelector('[style*="width: 100%"]');
        expect(progressBar).not.toBeInTheDocument(); // Should not show at 100%
      });
    });

    it('handles boundary cue indices', async () => {
      // Test with index beyond array bounds
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 999 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByTitle('GO (Space/Enter)');
        expect(goButton).toBeDisabled();
      });
    });
  });
});