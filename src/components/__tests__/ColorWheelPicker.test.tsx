import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorWheelPicker from '../ColorWheelPicker';

jest.mock('../../utils/colorHelpers', () => ({
  rgbToHex: jest.fn((r: number, g: number, b: number) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
  hexToRgb: jest.fn((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }),
}));

jest.mock('../../utils/colorConversion', () => ({
  UV_COLOR_HEX: '#8a2be2',
}));

jest.mock('react-colorful', () => ({
  HexColorPicker: ({ color, onChange }: { color: string; onChange: (color: string) => void }) => (
    <div data-testid="hex-color-picker">
      <div>Color: {color}</div>
      <button onClick={() => onChange('#ff0000')}>Change to Red</button>
      <button onClick={() => onChange('#00ff00')}>Change to Green</button>
    </div>
  ),
}));

describe('ColorWheelPicker', () => {
  const defaultProps = {
    currentColor: { r: 128, g: 128, b: 128 },
    onColorChange: jest.fn(),
    onColorSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders hex picker', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByTestId('hex-color-picker')).toBeInTheDocument();
    });

    it('renders preset colors section', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Quick Colors')).toBeInTheDocument();
    });

    it('does not render intensity slider by default', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.queryByText('Intensity')).not.toBeInTheDocument();
    });

    it('renders intensity slider when showIntensity is true', () => {
      render(<ColorWheelPicker {...defaultProps} showIntensity={true} intensity={0.8} />);

      expect(screen.getByText('Intensity')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('hex color picker interaction', () => {
    it('calls onColorChange when hex picker changes color', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
    });

    it('passes correct hex value to color picker', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Color: #808080')).toBeInTheDocument();
    });
  });

  describe('intensity slider', () => {
    it('shows current intensity percentage', () => {
      render(<ColorWheelPicker {...defaultProps} showIntensity={true} intensity={0.75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('calls onIntensityChange when slider moves', async () => {
      const onIntensityChange = jest.fn();
      render(<ColorWheelPicker {...defaultProps} showIntensity={true} intensity={0.5} onIntensityChange={onIntensityChange} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '80' } });

      expect(onIntensityChange).toHaveBeenCalledWith(0.8);
    });

    it('handles edge case of 0% intensity', () => {
      render(<ColorWheelPicker {...defaultProps} showIntensity={true} intensity={0} />);

      const percentLabels = screen.getAllByText('0%');
      expect(percentLabels.length).toBeGreaterThan(0);
    });

    it('handles edge case of 100% intensity', () => {
      render(<ColorWheelPicker {...defaultProps} showIntensity={true} intensity={1} />);

      const percentLabels = screen.getAllByText('100%');
      expect(percentLabels.length).toBeGreaterThan(0);
    });
  });

  describe('preset colors', () => {
    const expectedPresets = [
      'White', 'Warm White', 'Cool White', 'Red', 'Green', 'Blue',
      'Amber', 'UV', 'Magenta', 'Cyan', 'Yellow', 'Orange'
    ];

    it('renders all preset color buttons', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expectedPresets.forEach(preset => {
        expect(screen.getByTitle(preset)).toBeInTheDocument();
      });
    });

    it('changes color when preset is clicked', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const whitePreset = screen.getByTitle('White');
      await userEvent.click(whitePreset);

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 255, g: 255, b: 255 });
    });

    it('includes UV color preset', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const uvPreset = screen.getByTitle('UV');
      expect(uvPreset).toBeInTheDocument();
    });

    it('shows preset color tooltip on hover', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const redPreset = screen.getByTitle('Red');
      await userEvent.hover(redPreset);

      const tooltip = screen.getByText('Red');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('color updates from props', () => {
    it('updates hex value when currentColor prop changes', () => {
      const { rerender } = render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Color: #808080')).toBeInTheDocument();

      rerender(<ColorWheelPicker {...defaultProps} currentColor={{ r: 200, g: 100, b: 50 }} />);

      expect(screen.getByText('Color: #c86432')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper button roles for preset colors', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const presetButtons = screen.getAllByRole('button').filter(button =>
        button.getAttribute('title') &&
        ['White', 'Red', 'Green', 'Blue'].includes(button.getAttribute('title')!)
      );
      expect(presetButtons.length).toBeGreaterThan(0);
    });

    it('has proper title attributes for preset colors', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const whitePreset = screen.getByTitle('White');
      expect(whitePreset).toHaveAttribute('title', 'White');
    });

    it('intensity slider has proper range input', () => {
      render(<ColorWheelPicker {...defaultProps} showIntensity={true} intensity={0.5} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('type', 'range');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
    });
  });

  describe('styling', () => {
    it('applies correct classes to preset color buttons', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const whitePreset = screen.getByTitle('White').querySelector('div');
      expect(whitePreset).toHaveClass('w-8', 'h-8', 'rounded-md', 'border-2');
    });
  });

  describe('edge cases', () => {
    it('handles color conversion errors gracefully', () => {
      expect(() => render(<ColorWheelPicker {...defaultProps} />)).not.toThrow();
      expect(() => render(<ColorWheelPicker {...defaultProps} currentColor={{ r: 0, g: 0, b: 0 }} />)).not.toThrow();
    });

    it('handles extreme color values', () => {
      render(<ColorWheelPicker {...defaultProps} currentColor={{ r: 0, g: 0, b: 0 }} />);

      expect(screen.getByText('Color: #000000')).toBeInTheDocument();
    });

    it('handles maximum color values', () => {
      render(<ColorWheelPicker {...defaultProps} currentColor={{ r: 255, g: 255, b: 255 }} />);

      expect(screen.getByText('Color: #ffffff')).toBeInTheDocument();
    });
  });

  describe('utility function integration', () => {
    it('calls rgbToHex with correct parameters', () => {
      const colorHelpers = require('../../utils/colorHelpers');
      render(<ColorWheelPicker {...defaultProps} />);

      expect(colorHelpers.rgbToHex).toHaveBeenCalledWith(128, 128, 128);
    });

    it('calls hexToRgb when color picker changes', async () => {
      const colorHelpers = require('../../utils/colorHelpers');
      render(<ColorWheelPicker {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      expect(colorHelpers.hexToRgb).toHaveBeenCalledWith('#ff0000');
    });
  });
});
