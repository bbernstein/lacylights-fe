import { render, screen } from '@testing-library/react';
import CueListPlaybackStatus from '../CueListPlaybackStatus';
import { useCueListPlayback } from '../../hooks/useCueListPlayback';

// Mock the custom hook
jest.mock('../../hooks/useCueListPlayback', () => ({
  useCueListPlayback: jest.fn(),
}));

const mockUseCueListPlayback = useCueListPlayback as jest.MockedFunction<typeof useCueListPlayback>;

describe('CueListPlaybackStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering states', () => {
    it('returns null when playbackStatus is null', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: null,
        isLoading: false,
        error: undefined,
      });

      const { container } = render(
        <CueListPlaybackStatus cueListId="test-123" cueCount={10} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when not playing', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 1,
          isPlaying: false,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      const { container } = render(
        <CueListPlaybackStatus cueListId="test-123" cueCount={10} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders playing status when playing', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 2,
          isPlaying: true,
          fadeProgress: 50,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      expect(screen.getByText('Playing')).toBeInTheDocument();
      expect(screen.getByText('Cue 3/10')).toBeInTheDocument();
    });
  });

  describe('cue number display', () => {
    it('shows correct cue number (1-indexed)', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={5} />);

      expect(screen.getByText('Cue 1/5')).toBeInTheDocument();
    });

    it('handles null currentCueIndex', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: null,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      expect(screen.getByText('Cue 0/10')).toBeInTheDocument();
    });

    it('handles undefined currentCueIndex', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: undefined as number | null,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      expect(screen.getByText('Cue 0/10')).toBeInTheDocument();
    });

    it('displays the last cue correctly', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 9,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      expect(screen.getByText('Cue 10/10')).toBeInTheDocument();
    });
  });

  describe('fade progress bar', () => {
    it('does not show progress bar when fadeProgress is 0', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('shows progress bar when fadeProgress is between 1-99', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 45.7,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '46%' }); // Rounded from 45.7
    });

    it('does not show progress bar when fadeProgress is 100', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 100,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('handles null fadeProgress', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: null as number | null,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('handles undefined fadeProgress', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: undefined,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('rounds fadeProgress correctly', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 75.4,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('applies transition duration to progress bar', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 50,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ transitionDuration: '150ms' });
    });
  });

  describe('styling and classes', () => {
    it('applies correct classes to playing badge', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const badge = screen.getByText('Playing').closest('span');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2', 'py-1', 'rounded-full');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      expect(badge).toHaveClass('dark:bg-green-900', 'dark:text-green-200');
    });

    it('includes animated pulse indicator', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const pulseIndicator = screen.getByText('●');
      expect(pulseIndicator).toHaveClass('animate-pulse', 'mr-1');
    });

    it('applies correct classes to cue counter', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const cueCounter = screen.getByText('Cue 1/10');
      expect(cueCounter).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400');
    });

    it('applies correct classes to progress bar container', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 50,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressContainer = document.querySelector('.w-16.bg-gray-200');
      expect(progressContainer).toHaveClass('w-16', 'bg-gray-200', 'dark:bg-gray-700', 'rounded-full', 'h-1');
    });

    it('applies correct classes to progress bar fill', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 50,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const progressFill = document.querySelector('.bg-green-600');
      expect(progressFill).toHaveClass('bg-green-600', 'h-1', 'rounded-full', 'transition-all', 'ease-linear');
    });

    it('applies flex container classes', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      const container = document.querySelector('.flex.items-center.space-x-2');
      expect(container).toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('passes correct cueListId to hook', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: null,
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="custom-id-456" cueCount={10} />);

      expect(mockUseCueListPlayback).toHaveBeenCalledWith('custom-id-456');
    });

    it('uses provided cueCount in display', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 5,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={20} />);

      expect(screen.getByText('Cue 6/20')).toBeInTheDocument();
    });

    it('handles cueCount of 0', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 0,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={0} />);

      expect(screen.getByText('Cue 1/0')).toBeInTheDocument();
    });
  });

  describe('memoization', () => {
    it('is wrapped in React.memo', () => {
      // The component is exported with memo, so it should have the $$typeof Symbol
      expect(CueListPlaybackStatus.$$typeof).toBe(Symbol.for('react.memo'));
    });

  });

  describe('edge cases', () => {
    it('handles loading state from hook', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: null,
        isLoading: true,
        error: undefined,
      });

      const { container } = render(
        <CueListPlaybackStatus cueListId="test-123" cueCount={10} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles error state from hook', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: null,
        isLoading: false,
        error: new Error('Failed to load'),
      });

      const { container } = render(
        <CueListPlaybackStatus cueListId="test-123" cueCount={10} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles very large cue numbers', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: 999,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={1000} />);

      expect(screen.getByText('Cue 1000/1000')).toBeInTheDocument();
    });

    it('handles negative currentCueIndex', () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          cueListId: 'test-123',
          currentCueIndex: -5,
          isPlaying: true,
          fadeProgress: 0,
          lastUpdated: '2023-01-01T00:00:00Z',
        },
        isLoading: false,
        error: undefined,
      });

      render(<CueListPlaybackStatus cueListId="test-123" cueCount={10} />);

      // -5 + 1 = -4, but since it's less than 0, it should show as 0
      expect(screen.getByText('Cue 0/10')).toBeInTheDocument();
    });
  });
});