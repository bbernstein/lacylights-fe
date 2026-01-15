import { render, screen } from '@testing-library/react';
import WaveformPreview, { WaveformIcon } from '../WaveformPreview';
import { WaveformType } from '@/generated/graphql';

// Mock requestAnimationFrame for animation tests
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  // Return a mock frame ID
  return 1;
});

const mockCancelAnimationFrame = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('WaveformPreview', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<WaveformPreview waveform={WaveformType.Sine} />);

      const preview = screen.getByRole('img', { name: /sine waveform preview/i });
      expect(preview).toBeInTheDocument();
    });

    it('renders with custom dimensions', () => {
      render(<WaveformPreview waveform={WaveformType.Sine} width={300} height={100} />);

      const preview = screen.getByRole('img', { name: /sine waveform preview/i });
      expect(preview).toHaveStyle({ width: '300px', height: '100px' });
    });

    it('renders with custom background color', () => {
      render(
        <WaveformPreview waveform={WaveformType.Sine} backgroundColor="#000000" />,
      );

      const preview = screen.getByRole('img', { name: /sine waveform preview/i });
      expect(preview).toHaveStyle({ backgroundColor: '#000000' });
    });

    it('renders with custom className', () => {
      render(<WaveformPreview waveform={WaveformType.Sine} className="custom-class" />);

      const preview = screen.getByRole('img', { name: /sine waveform preview/i });
      expect(preview).toHaveClass('custom-class');
    });

    it('includes SVG element', () => {
      const { container } = render(<WaveformPreview waveform={WaveformType.Sine} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('includes waveform path', () => {
      const { container } = render(<WaveformPreview waveform={WaveformType.Sine} />);

      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d');
    });
  });

  describe('waveform types', () => {
    it.each([
      [WaveformType.Sine, 'sine'],
      [WaveformType.Cosine, 'cosine'],
      [WaveformType.Square, 'square'],
      [WaveformType.Sawtooth, 'sawtooth'],
      [WaveformType.Triangle, 'triangle'],
      [WaveformType.Random, 'random'],
    ])('renders %s waveform', (waveformType, expectedLabel) => {
      render(<WaveformPreview waveform={waveformType} />);

      const preview = screen.getByRole('img', {
        name: new RegExp(`${expectedLabel} waveform preview`, 'i'),
      });
      expect(preview).toBeInTheDocument();
    });

    it('generates different paths for different waveform types', () => {
      const { container: sineContainer } = render(
        <WaveformPreview waveform={WaveformType.Sine} />,
      );
      const sinePath = sineContainer.querySelector('path')?.getAttribute('d');

      const { container: squareContainer } = render(
        <WaveformPreview waveform={WaveformType.Square} />,
      );
      const squarePath = squareContainer.querySelector('path')?.getAttribute('d');

      expect(sinePath).not.toBe(squarePath);
    });
  });

  describe('grid lines', () => {
    it('renders grid lines by default', () => {
      const { container } = render(<WaveformPreview waveform={WaveformType.Sine} />);

      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('hides grid lines when showGrid is false', () => {
      const { container } = render(
        <WaveformPreview waveform={WaveformType.Sine} showGrid={false} />,
      );

      // Should only have offset indicator line potentially, or none
      const lines = container.querySelectorAll('line');
      // With showGrid=false and default offset=0.5, there should be no lines
      expect(lines.length).toBe(0);
    });
  });

  describe('offset indicator', () => {
    it('shows offset indicator when offset differs from 0.5', () => {
      const { container } = render(
        <WaveformPreview waveform={WaveformType.Sine} offset={0.7} showGrid={false} />,
      );

      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(1); // Only the offset indicator
    });

    it('hides offset indicator when offset is near 0.5', () => {
      const { container } = render(
        <WaveformPreview waveform={WaveformType.Sine} offset={0.5} showGrid={false} />,
      );

      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(0);
    });
  });

  describe('animation', () => {
    it('does not start animation when animated is false', () => {
      render(<WaveformPreview waveform={WaveformType.Sine} animated={false} />);

      expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
    });

    it('starts animation when animated is true', () => {
      render(<WaveformPreview waveform={WaveformType.Sine} animated={true} />);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('cleans up animation on unmount', () => {
      const { unmount } = render(
        <WaveformPreview waveform={WaveformType.Sine} animated={true} />,
      );

      unmount();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('waveform label', () => {
    it('displays waveform type indicator', () => {
      const { container } = render(<WaveformPreview waveform={WaveformType.Sine} />);

      const labelDiv = container.querySelector('[aria-hidden="true"]');
      expect(labelDiv).toBeInTheDocument();
      expect(labelDiv).toHaveTextContent('~');
    });

    it.each([
      [WaveformType.Sine, '~'],
      [WaveformType.Cosine, '\u223F'], // ∿
      [WaveformType.Square, '\u228F\u2290'], // ⊏⊐
      [WaveformType.Sawtooth, '/|'],
      [WaveformType.Triangle, '/\\'],
      [WaveformType.Random, '~?'],
    ])('displays correct label for %s waveform', (waveformType, expectedLabel) => {
      const { container } = render(<WaveformPreview waveform={waveformType} />);

      const labelDiv = container.querySelector('[aria-hidden="true"]');
      expect(labelDiv).toHaveTextContent(expectedLabel);
    });
  });

  describe('custom styling', () => {
    it('applies custom color to waveform path', () => {
      const { container } = render(
        <WaveformPreview waveform={WaveformType.Sine} color="#ff0000" />,
      );

      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke', '#ff0000');
    });
  });

  describe('frequency effect', () => {
    it('generates path for low frequency', () => {
      const { container } = render(
        <WaveformPreview waveform={WaveformType.Sine} frequency={0.5} />,
      );

      const path = container.querySelector('path');
      expect(path).toHaveAttribute('d');
    });

    it('generates path for high frequency', () => {
      const { container } = render(
        <WaveformPreview waveform={WaveformType.Sine} frequency={4} />,
      );

      const path = container.querySelector('path');
      expect(path).toHaveAttribute('d');
    });
  });

  describe('amplitude effect', () => {
    it('generates path with reduced amplitude', () => {
      const { container: fullAmplitude } = render(
        <WaveformPreview waveform={WaveformType.Sine} amplitude={1} />,
      );
      const fullPath = fullAmplitude.querySelector('path')?.getAttribute('d');

      const { container: reducedAmplitude } = render(
        <WaveformPreview waveform={WaveformType.Sine} amplitude={0.5} />,
      );
      const reducedPath = reducedAmplitude.querySelector('path')?.getAttribute('d');

      expect(fullPath).not.toBe(reducedPath);
    });
  });
});

describe('WaveformIcon', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<WaveformIcon waveform={WaveformType.Sine} />);

      const icon = screen.getByRole('img', { name: /sine waveform/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders with custom size', () => {
      const { container } = render(<WaveformIcon waveform={WaveformType.Sine} size={32} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('renders with custom color', () => {
      const { container } = render(
        <WaveformIcon waveform={WaveformType.Sine} color="#ff0000" />,
      );

      const path = container.querySelector('path');
      expect(path).toHaveAttribute('stroke', '#ff0000');
    });

    it('applies custom className', () => {
      const { container } = render(
        <WaveformIcon waveform={WaveformType.Sine} className="custom-icon" />,
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-icon');
    });
  });

  describe('waveform types', () => {
    it.each([
      WaveformType.Sine,
      WaveformType.Cosine,
      WaveformType.Square,
      WaveformType.Sawtooth,
      WaveformType.Triangle,
      WaveformType.Random,
    ])('renders %s waveform icon', (waveformType) => {
      const { container } = render(<WaveformIcon waveform={waveformType} />);

      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d');
    });
  });

  describe('path styling', () => {
    it('has correct stroke properties', () => {
      const { container } = render(<WaveformIcon waveform={WaveformType.Sine} />);

      const path = container.querySelector('path');
      expect(path).toHaveAttribute('fill', 'none');
      expect(path).toHaveAttribute('stroke-width', '1.5');
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });
  });
});
