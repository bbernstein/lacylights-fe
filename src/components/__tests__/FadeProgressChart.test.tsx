import { render, screen } from '@testing-library/react';
import FadeProgressChart from '../FadeProgressChart';

describe('FadeProgressChart', () => {
  describe('rendering', () => {
    it('renders SVG element', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with data-testid for easy selection', () => {
      render(<FadeProgressChart progress={50} />);
      expect(screen.getByTestId('fade-progress-chart')).toBeInTheDocument();
    });

    it('includes aria-label for accessibility', () => {
      const { container } = render(<FadeProgressChart progress={75} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade progress: 75%');
    });
  });

  describe('progress visualization', () => {
    it('does not render filled path at 0 progress', () => {
      const { container } = render(<FadeProgressChart progress={0} />);
      const paths = container.querySelectorAll('path');
      // Should only have the outline curve path
      expect(paths.length).toBe(1);
    });

    it('renders filled path at non-zero progress', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const paths = container.querySelectorAll('path');
      // Should have outline + filled path
      expect(paths.length).toBe(2);
    });

    it('renders filled path at 100% progress', () => {
      const { container } = render(<FadeProgressChart progress={100} />);
      const paths = container.querySelectorAll('path');
      // Should have outline + filled path
      expect(paths.length).toBe(2);
    });

    it('renders progress indicator line during active fade', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const line = container.querySelector('line');
      expect(line).toBeInTheDocument();
    });

    it('renders progress indicator dot during active fade', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('does not render progress line at 0', () => {
      const { container } = render(<FadeProgressChart progress={0} />);
      const line = container.querySelector('line');
      expect(line).not.toBeInTheDocument();
    });

    it('does not render progress line at 100', () => {
      const { container } = render(<FadeProgressChart progress={100} />);
      // At 100%, should show completion dot but no vertical line
      const lines = container.querySelectorAll('line');
      // No progress indicator lines (only grid lines if showPercentLabels)
      expect(lines.length).toBe(0);
    });

    it('renders completion dot at 100%', () => {
      const { container } = render(<FadeProgressChart progress={100} />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('dimensions', () => {
    it('applies custom dimensions', () => {
      const { container } = render(
        <FadeProgressChart progress={50} width={300} height={100} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '300');
      expect(svg).toHaveAttribute('height', '100');
    });

    it('uses default dimensions when not specified', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '60');
    });
  });

  describe('intensity label', () => {
    it('shows intensity label when enabled', () => {
      render(<FadeProgressChart progress={50} showIntensityLabel />);
      // With EASE_IN_OUT_SINE, 50% progress = 50% intensity
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('does not show intensity label by default', () => {
      render(<FadeProgressChart progress={50} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('shows eased intensity value, not linear progress', () => {
      render(
        <FadeProgressChart
          progress={25}
          easingType="EASE_IN_OUT_CUBIC"
          showIntensityLabel
        />
      );
      // At 25% linear progress with EASE_IN_OUT_CUBIC, intensity should be ~6%
      // (4 * 0.25^3 = 0.0625 = 6.25%)
      expect(screen.getByText('6%')).toBeInTheDocument();
    });
  });

  describe('percent labels', () => {
    it('shows percent labels when enabled', () => {
      render(<FadeProgressChart progress={50} showPercentLabels />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('does not show percent labels by default', () => {
      render(<FadeProgressChart progress={50} />);
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('shows grid lines when percent labels enabled', () => {
      const { container } = render(
        <FadeProgressChart progress={50} showPercentLabels />
      );
      // Should have 2 grid lines + 1 progress indicator line
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(3);
    });
  });

  describe('easing types', () => {
    it('uses EASE_IN_OUT_SINE as default', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('accepts LINEAR easing type', () => {
      const { container } = render(
        <FadeProgressChart progress={50} easingType="LINEAR" />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('accepts EASE_IN_OUT_CUBIC easing type', () => {
      const { container } = render(
        <FadeProgressChart progress={50} easingType="EASE_IN_OUT_CUBIC" />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('accepts EASE_OUT_EXPONENTIAL easing type', () => {
      const { container } = render(
        <FadeProgressChart progress={50} easingType="EASE_OUT_EXPONENTIAL" />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('accepts S_CURVE easing type', () => {
      const { container } = render(
        <FadeProgressChart progress={50} easingType="S_CURVE" />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('progress clamping', () => {
    it('handles progress below 0', () => {
      const { container } = render(<FadeProgressChart progress={-10} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade progress: 0%');
    });

    it('handles progress above 100', () => {
      const { container } = render(<FadeProgressChart progress={150} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade progress: 100%');
    });
  });

  describe('className prop', () => {
    it('applies custom className to container', () => {
      render(<FadeProgressChart progress={50} className="custom-class" />);
      const container = screen.getByTestId('fade-progress-chart');
      expect(container).toHaveClass('custom-class');
    });
  });
});
