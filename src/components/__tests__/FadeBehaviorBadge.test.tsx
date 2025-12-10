import { render, screen, fireEvent } from '@testing-library/react';
import FadeBehaviorBadge from '../FadeBehaviorBadge';
import { FadeBehavior } from '@/types';

describe('FadeBehaviorBadge', () => {
  describe('renders correct visual for each behavior', () => {
    it('renders FADE behavior with wave icon', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} />);
      expect(screen.getByText('~')).toBeInTheDocument();
    });

    it('renders SNAP behavior with lightning icon', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP} />);
      // Lightning emoji
      expect(screen.getByText('\u26A1')).toBeInTheDocument();
    });

    it('renders SNAP_END behavior with stop icon', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP_END} />);
      // Stop emoji
      expect(screen.getByText('\u23F9')).toBeInTheDocument();
    });
  });

  describe('shows label when requested', () => {
    it('does not show label by default', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} />);
      expect(screen.queryByText('Fade')).not.toBeInTheDocument();
    });

    it('shows Fade label when showLabel is true', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} showLabel />);
      expect(screen.getByText('Fade')).toBeInTheDocument();
    });

    it('shows Snap label when showLabel is true', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP} showLabel />);
      expect(screen.getByText('Snap')).toBeInTheDocument();
    });

    it('shows Snap End label when showLabel is true', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP_END} showLabel />);
      expect(screen.getByText('Snap End')).toBeInTheDocument();
    });
  });

  describe('discrete indicator', () => {
    it('adds dot indicator for discrete channels', () => {
      render(
        <FadeBehaviorBadge
          fadeBehavior={FadeBehavior.SNAP}
          isDiscrete
          showLabel
        />
      );
      // Discrete indicator includes a dot in the label
      const badge = screen.getByTitle(/discrete channel/i);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('tooltip titles', () => {
    it('shows smooth fade tooltip for FADE', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} />);
      expect(screen.getByTitle(/smooth fade/i)).toBeInTheDocument();
    });

    it('shows instant snap tooltip for SNAP', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP} />);
      expect(screen.getByTitle(/instant snap.*start/i)).toBeInTheDocument();
    });

    it('shows snap at end tooltip for SNAP_END', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP_END} />);
      expect(screen.getByTitle(/snap.*end/i)).toBeInTheDocument();
    });
  });

  describe('click handler', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(
        <FadeBehaviorBadge
          fadeBehavior={FadeBehavior.FADE}
          onClick={handleClick}
        />
      );

      fireEvent.click(screen.getByTitle(/smooth fade/i));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', () => {
      render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} />);
      expect(() => {
        fireEvent.click(screen.getByTitle(/smooth fade/i));
      }).not.toThrow();
    });
  });

  describe('size variants', () => {
    it('applies sm size classes by default', () => {
      const { container } = render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-[10px]');
    });

    it('applies md size classes when size is md', () => {
      const { container } = render(
        <FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} size="md" />
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-xs');
    });
  });

  describe('color coding', () => {
    it('uses green colors for FADE', () => {
      const { container } = render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.FADE} />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('uses amber colors for SNAP', () => {
      const { container } = render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP} />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('uses purple colors for SNAP_END', () => {
      const { container } = render(<FadeBehaviorBadge fadeBehavior={FadeBehavior.SNAP_END} />);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-700');
    });
  });
});
