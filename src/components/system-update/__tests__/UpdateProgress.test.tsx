import { render, screen } from '@testing-library/react';
import { UpdateProgress, UpdateState } from '../UpdateProgress';

describe('UpdateProgress', () => {
  describe('returns null for idle state', () => {
    it('renders nothing when state is idle', () => {
      const { container } = render(<UpdateProgress currentState="idle" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('renders error state', () => {
    it('renders error state without error message', () => {
      render(<UpdateProgress currentState="error" />);

      expect(screen.getByText('Update Failed')).toBeInTheDocument();
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    it('renders error state with error message', () => {
      const errorMessage = 'Connection timeout occurred';
      render(
        <UpdateProgress currentState="error" errorMessage={errorMessage} />
      );

      expect(screen.getByText('Update Failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('renders all progress steps for each state', () => {
    const states: UpdateState[] = [
      'checking',
      'ready',
      'updating',
      'restarting',
      'reconnecting',
      'verifying',
      'complete',
    ];

    states.forEach((state) => {
      it(`renders progress container for ${state} state`, () => {
        const { container } = render(<UpdateProgress currentState={state} />);
        expect(container.firstChild).not.toBeNull();
      });
    });
  });

  describe('shows current step with ellipsis', () => {
    it('adds ellipsis to checking step', () => {
      render(<UpdateProgress currentState="checking" />);
      expect(screen.getByText(/Checking for updates\.\.\./)).toBeInTheDocument();
    });

    it('adds ellipsis to updating step', () => {
      render(<UpdateProgress currentState="updating" />);
      expect(
        screen.getByText(/Downloading & installing\.\.\./)
      ).toBeInTheDocument();
    });

    it('adds ellipsis to reconnecting step', () => {
      render(<UpdateProgress currentState="reconnecting" />);
      expect(
        screen.getByText(/Reconnecting to server\.\.\./)
      ).toBeInTheDocument();
    });
  });

  describe('marks completed steps with checkmark', () => {
    it('shows checkmarks for completed steps when in updating state', () => {
      render(<UpdateProgress currentState="updating" />);

      // Should have checkmarks for checking and ready steps
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(2);
    });

    it('shows checkmarks for all steps when complete', () => {
      render(<UpdateProgress currentState="complete" />);

      // All 7 steps should have checkmarks
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(7);
    });
  });

  describe('correct styling for completed/current/pending steps', () => {
    it('applies completed styling (green) to past steps', () => {
      const { container } = render(<UpdateProgress currentState="updating" />);

      const completedIcons = container.querySelectorAll('.bg-green-500');
      expect(completedIcons.length).toBeGreaterThan(0);
    });

    it('applies current styling (blue, animated) to current step', () => {
      const { container } = render(<UpdateProgress currentState="updating" />);

      const currentIcon = container.querySelector('.bg-blue-500.animate-pulse');
      expect(currentIcon).toBeInTheDocument();
    });

    it('applies pending styling (gray) to future steps', () => {
      const { container } = render(<UpdateProgress currentState="checking" />);

      const pendingIcons = container.querySelectorAll('.bg-gray-600');
      expect(pendingIcons.length).toBeGreaterThan(0);
    });
  });
});
