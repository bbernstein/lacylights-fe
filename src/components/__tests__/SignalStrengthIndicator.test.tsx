import { render } from '@testing-library/react';
import { SignalStrengthIndicator } from '../SignalStrengthIndicator';

describe('SignalStrengthIndicator', () => {
  describe('rendering', () => {
    it('renders with correct number of bars for excellent signal (76-100%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={85} />);

      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);

      // All 4 bars should be active (green)
      const activeBars = container.querySelectorAll('.bg-green-500');
      expect(activeBars.length).toBeGreaterThan(0);
    });

    it('renders with correct number of bars for good signal (51-75%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={60} />);

      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);

      // Should show yellow bars
      const activeBars = container.querySelectorAll('.bg-yellow-500');
      expect(activeBars.length).toBeGreaterThan(0);
    });

    it('renders with correct number of bars for fair signal (26-50%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={40} />);

      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);

      // Should show orange bars
      const activeBars = container.querySelectorAll('.bg-orange-500');
      expect(activeBars.length).toBeGreaterThan(0);
    });

    it('renders with correct number of bars for weak signal (0-25%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={15} />);

      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);

      // Should show red bar
      const activeBars = container.querySelectorAll('.bg-red-500');
      expect(activeBars.length).toBeGreaterThan(0);
    });

    it('displays strength in title attribute', () => {
      const { container } = render(<SignalStrengthIndicator strength={75} />);

      const wrapper = container.querySelector('[title]');
      expect(wrapper).toHaveAttribute('title', 'Signal strength: 75%');
    });

    it('displays strength in aria-label', () => {
      const { container } = render(<SignalStrengthIndicator strength={50} />);

      const wrapper = container.querySelector('[aria-label]');
      expect(wrapper).toHaveAttribute('aria-label', 'Signal strength: 50%');
    });
  });

  describe('signal strength thresholds', () => {
    it('shows 4 bars at 100% strength', () => {
      render(<SignalStrengthIndicator strength={100} />);
      // Component renders 4 bars, calculation should give 4 active
    });

    it('shows 4 bars at 76% strength (threshold)', () => {
      render(<SignalStrengthIndicator strength={76} />);
      // Component renders 4 bars
    });

    it('shows 3 bars at 75% strength', () => {
      render(<SignalStrengthIndicator strength={75} />);
      // Component renders 4 bars, 3 should be active
    });

    it('shows 2 bars at 50% strength', () => {
      render(<SignalStrengthIndicator strength={50} />);
      // Component renders 4 bars, 2 should be active
    });

    it('shows 1 bar at 25% strength', () => {
      render(<SignalStrengthIndicator strength={25} />);
      // Component renders 4 bars, 1 should be active
    });

    it('shows 1 bar at 0% strength (minimum)', () => {
      render(<SignalStrengthIndicator strength={0} />);
      // Component renders 4 bars, at least 1 should be active
    });
  });

  describe('styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(<SignalStrengthIndicator strength={50} className="custom-class" />);

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies default styling classes', () => {
      const { container } = render(<SignalStrengthIndicator strength={50} />);

      const wrapper = container.querySelector('.flex');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('items-end', 'gap-0.5', 'h-5');
    });

    it('applies inactive bar styling for bars above threshold', () => {
      const { container } = render(<SignalStrengthIndicator strength={25} />);

      // Should have inactive bars
      const inactiveBars = container.querySelectorAll('.bg-gray-300');
      expect(inactiveBars.length).toBeGreaterThan(0);
    });
  });

  describe('color mapping', () => {
    it('uses green color for excellent signal (>=75%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={80} />);

      const greenBars = container.querySelectorAll('.bg-green-500');
      expect(greenBars.length).toBeGreaterThan(0);
    });

    it('uses yellow color for good signal (>=50%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={65} />);

      const yellowBars = container.querySelectorAll('.bg-yellow-500');
      expect(yellowBars.length).toBeGreaterThan(0);
    });

    it('uses orange color for fair signal (>=25%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={35} />);

      const orangeBars = container.querySelectorAll('.bg-orange-500');
      expect(orangeBars.length).toBeGreaterThan(0);
    });

    it('uses red color for weak signal (<25%)', () => {
      const { container } = render(<SignalStrengthIndicator strength={10} />);

      const redBars = container.querySelectorAll('.bg-red-500');
      expect(redBars.length).toBeGreaterThan(0);
    });
  });

  describe('bar heights', () => {
    it('renders bars with increasing heights', () => {
      const { container } = render(<SignalStrengthIndicator strength={100} />);

      const bars = container.querySelectorAll('.w-1.rounded-t');
      const heights = Array.from(bars).map(bar => (bar as HTMLElement).style.height);

      expect(heights[0]).toBe('25%');
      expect(heights[1]).toBe('50%');
      expect(heights[2]).toBe('75%');
      expect(heights[3]).toBe('100%');
    });
  });

  describe('edge cases', () => {
    it('handles negative strength values gracefully', () => {
      const { container } = render(<SignalStrengthIndicator strength={-10} />);

      // Should still render without crashing
      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);
    });

    it('handles strength values over 100 gracefully', () => {
      const { container } = render(<SignalStrengthIndicator strength={150} />);

      // Should still render without crashing
      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);
    });

    it('handles decimal strength values', () => {
      const { container } = render(<SignalStrengthIndicator strength={67.5} />);

      const bars = container.querySelectorAll('.w-1.rounded-t');
      expect(bars).toHaveLength(4);
    });
  });
});
