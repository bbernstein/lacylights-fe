import { render, screen } from '@testing-library/react';
import { ReconnectCountdown } from '../ReconnectCountdown';

describe('ReconnectCountdown', () => {
  describe('renders countdown timer', () => {
    it('displays the countdown number', () => {
      render(<ReconnectCountdown countdown={45} maxSeconds={90} isPolling />);
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('displays seconds label', () => {
      render(<ReconnectCountdown countdown={30} maxSeconds={60} isPolling />);
      expect(screen.getByText('seconds')).toBeInTheDocument();
    });

    it('displays waiting message', () => {
      render(<ReconnectCountdown countdown={30} maxSeconds={60} isPolling />);
      expect(
        screen.getByText('Waiting for server to come back online...')
      ).toBeInTheDocument();
    });
  });

  describe('displays correct remaining time', () => {
    it('shows 90 seconds when at max', () => {
      render(<ReconnectCountdown countdown={90} maxSeconds={90} isPolling />);
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('shows 0 seconds at minimum', () => {
      render(<ReconnectCountdown countdown={0} maxSeconds={90} isPolling />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows middle values correctly', () => {
      render(<ReconnectCountdown countdown={42} maxSeconds={90} isPolling />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('shows progress circle', () => {
    it('renders SVG progress circle', () => {
      const { container } = render(
        <ReconnectCountdown countdown={45} maxSeconds={90} isPolling />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders both background and progress circles', () => {
      const { container } = render(
        <ReconnectCountdown countdown={45} maxSeconds={90} isPolling />
      );

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });
  });

  describe('renders animated loading dots', () => {
    it('renders three animated dots', () => {
      const { container } = render(
        <ReconnectCountdown countdown={30} maxSeconds={60} isPolling />
      );

      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });
  });

  describe('returns null when not polling', () => {
    it('renders nothing when isPolling is false', () => {
      const { container } = render(
        <ReconnectCountdown countdown={25} maxSeconds={60} isPolling={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('displays countdown in visible text', () => {
      render(<ReconnectCountdown countdown={25} maxSeconds={60} isPolling />);

      // The countdown should be clearly visible
      expect(screen.getByText('25')).toBeVisible();
    });
  });
});
