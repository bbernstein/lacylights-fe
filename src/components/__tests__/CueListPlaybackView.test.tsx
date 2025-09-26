import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { MockedProvider } from '@apollo/client/testing';
import CueListPlaybackView from '../CueListPlaybackView';
import { GET_CUE_LIST, PLAY_CUE, FADE_TO_BLACK } from '../../graphql/cueLists';

const mockCueListId = 'test-cuelist-123';

const mockCueList = {
  id: mockCueListId,
  name: 'Test Cue List',
  description: 'A test cue list for playback testing',
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
      followTime: 5.0, // Has follow time
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

const createMocks = (
  cueListResult = { data: { cueList: mockCueList } },
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
  ];

  // Add mutation mocks
  const mutationMocks = [
    {
      request: { query: PLAY_CUE, variables: expect.any(Object) },
      result: { data: { playCue: { success: true } } },
    },
    {
      request: { query: FADE_TO_BLACK, variables: expect.any(Object) },
      result: { data: { fadeToBlack: { success: true } } },
    },
  ];

  Object.entries(mutations).forEach(([mutationName, result]) => {
    baseMocks.push({
      request: {
        query: eval(mutationName),
        variables: expect.any(Object),
      },
      result,
    });
  });

  return [...baseMocks, ...mutationMocks];
};

describe('CueListPlaybackView', () => {
  const mockOnClose = jest.fn();

  // Mock timers for testing intervals and timeouts
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderWithProvider = (mocks: unknown[]) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CueListPlaybackView cueListId={mockCueListId} onClose={mockOnClose} />
      </MockedProvider>
    );
  };

  describe('loading and error states', () => {
    it('shows loading state', () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      expect(screen.getByText('Loading cue list...')).toBeInTheDocument();
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
        expect(screen.getByText('A test cue list for playback testing')).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const closeButton = screen.getByTitle('Close playback view');
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('renders cue table with headers', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Cue #')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Scene')).toBeInTheDocument();
        expect(screen.getByText('In')).toBeInTheDocument();
        expect(screen.getByText('Out')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('renders all cues in table', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
        expect(screen.getByText('Mid Scene')).toBeInTheDocument();
        expect(screen.getByText('Closing Scene')).toBeInTheDocument();
        expect(screen.getByText('Scene 1')).toBeInTheDocument();
        expect(screen.getByText('Scene 2')).toBeInTheDocument();
        expect(screen.getByText('Scene 3')).toBeInTheDocument();
      });
    });

    it('renders control buttons', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('START')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('STOP')).toBeInTheDocument();
      });
    });

    it('renders keyboard shortcuts help', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Keyboard: Space/Enter = GO | ← → = Navigate | Esc = Stop')).toBeInTheDocument();
      });
    });

    it('renders current and next cue status', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Current: None')).toBeInTheDocument();
        expect(screen.getByText(/Next:.*Cue 1 - Opening Scene/)).toBeInTheDocument();
      });
    });
  });

  describe('CueRow component', () => {
    it('displays cue information correctly', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
        expect(screen.getByText('Mid Scene')).toBeInTheDocument();
        expect(screen.getByText('Closing Scene')).toBeInTheDocument();
        expect(screen.getAllByText('-')).toHaveLength(2); // No follow time for cues 1 and 3
      });
    });

    it('shows LIVE status for active cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('LIVE')).toBeInTheDocument();
      });
    });

    it('shows NEXT status for next cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('NEXT')).toBeInTheDocument();
      });
    });
  });

  describe('button states', () => {
    it('disables Previous button initially', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    it('Previous button disabled when at first cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        // Previous button should be disabled when currentCueIndex = 0 (first cue)
        expect(prevButton).toBeDisabled();
      });
    });

    it('Previous button enabled when at second cue', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      // Start first cue
      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      // Wait for first cue to finish, then manually advance to second cue
      await act(async () => {
        jest.advanceTimersByTime(2000); // Complete first cue fade
      });

      await waitFor(() => {
        const goButton = screen.getByText('GO');
        fireEvent.click(goButton); // Manually advance to second cue
      });

      await act(async () => {
        jest.advanceTimersByTime(100); // Allow state update
      });

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        // Previous button should be enabled when currentCueIndex > 0 (second cue)
        expect(prevButton).not.toBeDisabled();
      });
    });

    it('shows START button initially', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('START')).toBeInTheDocument();
        expect(screen.queryByText('GO')).not.toBeInTheDocument();
      });
    });

    it('shows GO button after starting', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('GO')).toBeInTheDocument();
        expect(screen.queryByText('START')).not.toBeInTheDocument();
      });
    });

    it('enables GO button after cue starts (no follow time)', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const goButton = screen.getByText('GO');
        expect(goButton).not.toBeDisabled();
      });
    });

    it('disables Next button when at last cue', async () => {
      const singleCueList = { ...mockCueList, cues: [mockCueList.cues[0]] };
      const mocks = createMocks({ data: { cueList: singleCueList } });
      renderWithProvider(mocks);

      // Start and advance to the single cue (index 0)
      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100); // Allow state update
      });

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        // Now that we're at the last (and only) cue, Next should be disabled
        expect(nextButton).toBeDisabled();
      });
    });

    it('enables Next button when next cue is available', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('button interactions', () => {
    it('calls playCue when START is clicked', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      // Mutation should have been called
      await waitFor(() => {
        expect(screen.getByText('LIVE')).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const closeButton = screen.getByTitle('Close playback view');
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles Previous button click', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      // Start first cue, then go to second, then go back
      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(2100); // Complete fade
      });

      await waitFor(() => {
        const goButton = screen.getByText('GO');
        fireEvent.click(goButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        fireEvent.click(prevButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: Cue 1 - Opening Scene')).toBeInTheDocument();
      });
    });

    it('handles Next button click', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(2100); // Complete fade
      });

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: Cue 2 - Mid Scene')).toBeInTheDocument();
      });
    });

    it('handles STOP button click', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const stopButton = screen.getByText('STOP');
        fireEvent.click(stopButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: None')).toBeInTheDocument();
        expect(screen.getByText('START')).toBeInTheDocument();
      });
    });
  });

  describe('keyboard shortcuts', () => {
    it('handles Space key for START/GO', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('START')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(window, { code: 'Space' });
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('LIVE')).toBeInTheDocument();
      });
    });

    it('handles Enter key for START/GO', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('START')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Enter' });
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('LIVE')).toBeInTheDocument();
      });
    });

    it('handles ArrowLeft for Previous', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      // Start first cue, then go to second, then use arrow key to go back
      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(2100);
      });

      await waitFor(() => {
        fireEvent.keyDown(window, { code: 'Space' });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: Cue 1 - Opening Scene')).toBeInTheDocument();
      });
    });

    it('handles ArrowRight for Next', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(2100);
      });

      await waitFor(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight' });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: Cue 2 - Mid Scene')).toBeInTheDocument();
      });
    });

    it('handles Escape key for STOP', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: None')).toBeInTheDocument();
      });
    });

    it('cleans up keyboard event listeners on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const mocks = createMocks();
      const { unmount } = renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Test Cue List')).toBeInTheDocument();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('fade progress tracking', () => {
    it('shows fade progress bar during cue execution', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(1000); // 50% of 2s fade
      });

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-green-600');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveStyle('width: 50%');
      });
    });

    it('hides progress bar when fade completes at 100%', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      // Initially should show progress bar
      await act(async () => {
        jest.advanceTimersByTime(1000); // 50% of 2s fade
      });

      await waitFor(() => {
        const progressBars = document.querySelectorAll('[style*="width"]');
        expect(progressBars.length).toBeGreaterThan(0);
      });

      // Complete the fade
      await act(async () => {
        jest.advanceTimersByTime(1000); // Complete the remaining 50%
      });

      await waitFor(() => {
        // Progress bar should be hidden when fade is complete (fadeProgress >= 100)
        const progressBars = document.querySelectorAll('[style*="width"]');
        const activeProgressBar = Array.from(progressBars).find(el =>
          el.getAttribute('style')?.includes('%')
        );
        // Progress bar should either be gone or show no width since fadeProgress >= 100 hides it
        expect(activeProgressBar).toBeFalsy();
      });
    });
  });

  describe('follow time automation', () => {
    it('automatically goes to next cue with follow time', async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      // Start and go to cue 2 (which has follow time)
      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(2100); // Complete fade
      });

      await waitFor(() => {
        fireEvent.keyDown(window, { code: 'Space' });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Wait for follow time (1.5s fade + 5s follow = 6.5s total)
      await act(async () => {
        jest.advanceTimersByTime(6500);
      });

      await waitFor(() => {
        expect(screen.getByText('Current: Cue 3 - Closing Scene')).toBeInTheDocument();
      });
    });
  });

  describe('timer cleanup', () => {
    it('cleans up timers on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const mocks = createMocks();
      const { unmount } = renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it('cleans up timers on stop', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        const stopButton = screen.getByText('STOP');
        fireEvent.click(stopButton);
      });

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('handles empty cue list', async () => {
      const emptyCueList = { ...mockCueList, cues: [] };
      const mocks = createMocks({ data: { cueList: emptyCueList } });
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        expect(startButton).toBeDisabled();
        expect(screen.getByText('Current: None')).toBeInTheDocument();
        expect(screen.getByText('Next: End of list')).toBeInTheDocument();
      });
    });

    it('handles cue list without description', async () => {
      const cueListNoDesc = { ...mockCueList, description: "" };
      const mocks = createMocks({ data: { cueList: cueListNoDesc } });
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Test Cue List')).toBeInTheDocument();
        expect(screen.queryByText('A test cue list for playback testing')).not.toBeInTheDocument();
      });
    });

    it('handles reaching end of cue list', async () => {
      const singleCueList = { ...mockCueList, cues: [mockCueList.cues[0]] };
      const mocks = createMocks({ data: { cueList: singleCueList } });
      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText('START');
        fireEvent.click(startButton);
      });

      await act(async () => {
        jest.advanceTimersByTime(2100);
      });

      await waitFor(() => {
        const goButton = screen.getByText('GO');
        expect(goButton).toBeDisabled();
        expect(screen.getByText('Next: End of list')).toBeInTheDocument();
      });
    });

    it('handles GraphQL errors gracefully', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: mockCueListId },
          },
          error: new Error('Network error'),
        },
      ];

      renderWithProvider(errorMocks);

      await waitFor(() => {
        expect(screen.getByText('Cue list not found')).toBeInTheDocument();
      });
    });
  });
});