import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  HexColorPicker: ({ color, onChange }: any) => (
    <div data-testid="hex-color-picker">
      <div>Color: {color}</div>
      <button onClick={() => onChange('#ff0000')}>Change to Red</button>
      <button onClick={() => onChange('#00ff00')}>Change to Green</button>
    </div>
  ),
  RgbColorPicker: ({ color, onChange }: any) => (
    <div data-testid="rgb-color-picker">
      <div>RGB: {color.r}, {color.g}, {color.b}</div>
      <button onClick={() => onChange({ r: 255, g: 0, b: 0 })}>Change to Red RGB</button>
      <button onClick={() => onChange({ r: 0, g: 255, b: 0 })}>Change to Green RGB</button>
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
    it('renders with hex picker by default', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByTestId('hex-color-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('rgb-color-picker')).not.toBeInTheDocument();
    });

    it('renders picker mode toggle buttons', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Hex')).toBeInTheDocument();
      expect(screen.getByText('RGB')).toBeInTheDocument();
    });

    it('renders current color preview', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Current Color')).toBeInTheDocument();
    });

    it('renders color values section', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Hex:')).toBeInTheDocument();
      expect(screen.getByText('R:')).toBeInTheDocument();
      expect(screen.getByText('G:')).toBeInTheDocument();
      expect(screen.getByText('B:')).toBeInTheDocument();
    });

    it('renders preset colors section', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByText('Quick Colors')).toBeInTheDocument();
    });

    it('displays current color values', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const rgbValues = screen.getAllByText('128');
      expect(rgbValues.length).toBeGreaterThan(0);
    });
  });

  describe('picker mode switching', () => {
    it('switches to RGB picker when RGB button is clicked', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const rgbButton = screen.getByText('RGB');
      await userEvent.click(rgbButton);

      expect(screen.getByTestId('rgb-color-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('hex-color-picker')).not.toBeInTheDocument();
    });

    it('switches back to hex picker when Hex button is clicked', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const rgbButton = screen.getByText('RGB');
      const hexButton = screen.getByText('Hex');

      await userEvent.click(rgbButton);
      await userEvent.click(hexButton);

      expect(screen.getByTestId('hex-color-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('rgb-color-picker')).not.toBeInTheDocument();
    });

    it('applies correct styling to active picker mode', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexButton = screen.getByText('Hex');
      const rgbButton = screen.getByText('RGB');

      expect(hexButton).toHaveClass('bg-white', 'text-gray-900');
      expect(rgbButton).toHaveClass('text-gray-600');

      await userEvent.click(rgbButton);

      expect(rgbButton).toHaveClass('bg-white', 'text-gray-900');
      expect(hexButton).toHaveClass('text-gray-600');
    });
  });

  describe('hex color picker interaction', () => {
    it('calls onColorChange when hex picker changes color', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
    });

    it('updates hex input value when hex picker changes', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      await waitFor(() => {
        const hexInput = screen.getByDisplayValue('#FF0000');
        expect(hexInput).toBeInTheDocument();
      });
    });
  });

  describe('RGB color picker interaction', () => {
    it('calls onColorChange when RGB picker changes color', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const rgbButton = screen.getByText('RGB');
      await userEvent.click(rgbButton);

      const changeButton = screen.getByText('Change to Red RGB');
      await userEvent.click(changeButton);

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
    });

    it('updates displayed RGB values when RGB picker changes', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const rgbButton = screen.getByText('RGB');
      await userEvent.click(rgbButton);

      const changeButton = screen.getByText('Change to Red RGB');
      await userEvent.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('255')).toBeInTheDocument();
        expect(screen.getAllByText('0')).toHaveLength(2);
      });
    });
  });

  describe('hex input field', () => {
    it('updates color when valid hex is entered', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#ffffff');

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 255, g: 255, b: 255 });
    });

    it('shows invalid hex input in red color', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#invalid');

      expect(hexInput).toHaveClass('text-red-500');
    });

    it('shows valid hex input in normal color', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      expect(hexInput).toHaveClass('text-gray-900');
    });

    it('resets to valid hex on blur when invalid', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#invalid');
      fireEvent.blur(hexInput);

      expect(hexInput).toHaveValue('#808080');
    });

    it('does not change color when invalid hex is entered', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#invalid');

      expect(defaultProps.onColorChange).not.toHaveBeenCalled();
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
    it('updates local color when currentColor prop changes', () => {
      const { rerender } = render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getAllByText('128').length).toBeGreaterThan(0);

      rerender(<ColorWheelPicker {...defaultProps} currentColor={{ r: 200, g: 100, b: 50 }} />);

      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('updates hex input when currentColor prop changes', () => {
      const { rerender } = render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByDisplayValue('#808080')).toBeInTheDocument();

      rerender(<ColorWheelPicker {...defaultProps} currentColor={{ r: 200, g: 100, b: 50 }} />);

      expect(screen.getByDisplayValue('#C86432')).toBeInTheDocument();
    });
  });

  describe('color preview', () => {
    it('displays color preview with correct background color', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const colorPreview = screen.getByText('Current Color').nextElementSibling;
      expect(colorPreview).toHaveStyle('background-color: #808080');
    });

    it('updates color preview when color changes', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      await waitFor(() => {
        const colorPreview = screen.getByText('Current Color').nextElementSibling;
        expect(colorPreview).toHaveStyle('background-color: #ff0000');
      });
    });
  });

  describe('accessibility', () => {
    it('has proper button roles for picker mode toggle', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Hex' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'RGB' })).toBeInTheDocument();
    });

    it('has proper input field for hex values', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      expect(hexInput.tagName).toBe('INPUT');
      expect(hexInput).toHaveAttribute('type', 'text');
    });

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
  });

  describe('styling', () => {
    it('applies correct classes to picker mode toggle', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const toggleContainer = screen.getByText('Hex').parentElement;
      expect(toggleContainer).toHaveClass('bg-gray-100', 'dark:bg-gray-700', 'rounded-lg');
    });

    it('applies correct classes to color preview section', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const previewSection = screen.getByText('Current Color').parentElement?.parentElement;
      expect(previewSection).toHaveClass('bg-gray-50', 'dark:bg-gray-700', 'rounded-lg');
    });

    it('applies correct classes to preset color buttons', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const whitePreset = screen.getByTitle('White').querySelector('div');
      expect(whitePreset).toHaveClass('w-8', 'h-8', 'rounded-md', 'border-2');
    });
  });

  describe('edge cases', () => {
    it('handles hex validation correctly', () => {
      render(<ColorWheelPicker {...defaultProps} />);

      // Mock isValidHex functionality
      expect(screen.getByDisplayValue('#808080')).toHaveClass('text-gray-900');
    });

    it('handles color conversion errors gracefully', () => {
      // Should not crash with any color values
      expect(() => render(<ColorWheelPicker {...defaultProps} />)).not.toThrow();
      expect(() => render(<ColorWheelPicker {...defaultProps} currentColor={{ r: 0, g: 0, b: 0 }} />)).not.toThrow();
    });

    it('handles rapid picker mode switching', async () => {
      render(<ColorWheelPicker {...defaultProps} />);

      const hexButton = screen.getByText('Hex');
      const rgbButton = screen.getByText('RGB');

      await userEvent.click(rgbButton);
      await userEvent.click(hexButton);
      await userEvent.click(rgbButton);

      expect(screen.getByTestId('rgb-color-picker')).toBeInTheDocument();
    });

    it('handles extreme color values', () => {
      render(<ColorWheelPicker {...defaultProps} currentColor={{ r: 0, g: 0, b: 0 }} />);

      expect(screen.getAllByText('0')).toHaveLength(3);
    });

    it('handles maximum color values', () => {
      render(<ColorWheelPicker {...defaultProps} currentColor={{ r: 255, g: 255, b: 255 }} />);

      expect(screen.getAllByText('255')).toHaveLength(3);
    });
  });

  describe('utility function integration', () => {
    it('calls rgbToHex with correct parameters', () => {
      const colorHelpers = require('../../utils/colorHelpers');
      render(<ColorWheelPicker {...defaultProps} />);

      expect(colorHelpers.rgbToHex).toHaveBeenCalledWith(128, 128, 128);
    });

    it('calls hexToRgb when hex input changes', async () => {
      const colorHelpers = require('../../utils/colorHelpers');
      render(<ColorWheelPicker {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#FF0000');

      expect(colorHelpers.hexToRgb).toHaveBeenCalledWith('#FF0000');
    });
  });
});