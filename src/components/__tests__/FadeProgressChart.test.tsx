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
    it('applies custom dimensions to viewBox while SVG is responsive', () => {
      const { container } = render(
        <FadeProgressChart progress={50} width={300} height={100} />
      );
      const svg = container.querySelector('svg');
      // SVG is now responsive (100% width/height)
      expect(svg).toHaveAttribute('width', '100%');
      expect(svg).toHaveAttribute('height', '100%');
      // But viewBox uses the custom dimensions for coordinate system
      expect(svg).toHaveAttribute('viewBox', '0 0 300 100');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    });

    it('uses default dimensions for viewBox when not specified', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      // SVG is now responsive (100% width/height)
      expect(svg).toHaveAttribute('width', '100%');
      expect(svg).toHaveAttribute('height', '100%');
      // But viewBox uses the default dimensions (200x60) for coordinate system
      expect(svg).toHaveAttribute('viewBox', '0 0 200 60');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
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

  describe('slide-off animation', () => {
    it('renders slide-off fill when progress is 100 and slideOffProgress > 0', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={50} />
      );
      // Should have a rect for the slide-off fill
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('does not render slide-off fill when slideOffProgress is 0', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={0} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('shows complete state when both progress and slideOffProgress are 100', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={100} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade complete: 100%');
      // Should have a single rect filling the entire area
      const rect = container.querySelector('rect');
      expect(rect).toBeInTheDocument();
    });

    it('applies transform to sliding group during slide-off', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={50} width={200} />
      );
      const g = container.querySelector('g');
      expect(g).toHaveAttribute('transform', 'translate(-100, 0)');
    });

    it('does not apply transform when not sliding', () => {
      const { container } = render(
        <FadeProgressChart progress={50} slideOffProgress={0} />
      );
      const g = container.querySelector('g');
      expect(g).not.toHaveAttribute('transform');
    });
  });

  describe('variant prop', () => {
    it('uses fadeIn variant by default', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const path = container.querySelectorAll('path')[1]; // Filled path
      expect(path).toHaveClass('text-green-500');
    });

    it('applies fadeOut variant colors when specified', () => {
      const { container } = render(
        <FadeProgressChart progress={50} variant="fadeOut" />
      );
      const path = container.querySelectorAll('path')[1]; // Filled path
      expect(path).toHaveClass('text-amber-500');
    });

    it('applies fadeIn variant colors when explicitly specified', () => {
      const { container } = render(
        <FadeProgressChart progress={50} variant="fadeIn" />
      );
      const path = container.querySelectorAll('path')[1]; // Filled path
      expect(path).toHaveClass('text-green-500');
    });
  });

  describe('responsive behavior', () => {
    it('maintains responsive width and height with complete state', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={100} width={300} height={150} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '100%');
      expect(svg).toHaveAttribute('height', '100%');
      expect(svg).toHaveAttribute('viewBox', '0 0 300 150');
    });

    it('uses w-full h-full className to fill container', () => {
      render(<FadeProgressChart progress={50} className="w-full h-full" />);
      const container = screen.getByTestId('fade-progress-chart');
      expect(container).toHaveClass('w-full');
      expect(container).toHaveClass('h-full');
    });

    it('preserves aspect ratio as none for stretching', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    });

    it('allows SVG to overflow when needed for labels', () => {
      const { container } = render(<FadeProgressChart progress={100} slideOffProgress={100} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('overflow-visible');
    });

    it('prevents overflow during active fade', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('overflow-hidden');
    });
  });

  describe('edge cases', () => {
    it('handles slideOffProgress clamping below 0', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={-10} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('handles slideOffProgress clamping above 100', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={150} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade complete: 100%');
    });

    it('handles very small progress values', () => {
      const { container } = render(<FadeProgressChart progress={0.1} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade progress: 0%');
    });

    it('handles progress near 100 but not exactly 100', () => {
      const { container } = render(<FadeProgressChart progress={99.9} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', 'Fade progress: 100%');
    });
  });

  describe('prop validation', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('returns null for zero width', () => {
      const { container } = render(<FadeProgressChart progress={50} width={0} />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      // Warning is only shown in development, but test environment is treated as development
      if (process.env.NODE_ENV !== 'production') {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'FadeProgressChart: width and height must be positive values'
        );
      }
    });

    it('returns null for zero height', () => {
      const { container } = render(<FadeProgressChart progress={50} height={0} />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      if (process.env.NODE_ENV !== 'production') {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'FadeProgressChart: width and height must be positive values'
        );
      }
    });

    it('returns null for negative width', () => {
      const { container } = render(<FadeProgressChart progress={50} width={-100} />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      if (process.env.NODE_ENV !== 'production') {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'FadeProgressChart: width and height must be positive values'
        );
      }
    });

    it('returns null for negative height', () => {
      const { container } = render(<FadeProgressChart progress={50} height={-60} />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      if (process.env.NODE_ENV !== 'production') {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'FadeProgressChart: width and height must be positive values'
        );
      }
    });
  });

  describe('accessibility', () => {
    it('includes title element for screen readers', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const title = container.querySelector('title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Fade progress: 50%');
    });

    it('includes title element in complete state', () => {
      const { container } = render(
        <FadeProgressChart progress={100} slideOffProgress={100} />
      );
      const title = container.querySelector('title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Fade complete: 100%');
    });

    it('has role="img" for semantic HTML', () => {
      const { container } = render(<FadeProgressChart progress={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
    });
  });
});
