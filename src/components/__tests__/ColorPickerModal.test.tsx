import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorPickerModal from '../ColorPickerModal';

jest.mock('../ColorWheelPicker', () => {
  return function MockColorWheelPicker({ currentColor, onColorChange, onColorSelect }: unknown) {
    return (
      <div data-testid="color-wheel-picker">
        <div>Current: rgb({currentColor.r}, {currentColor.g}, {currentColor.b})</div>
        <button
          onClick={() => onColorChange({ r: 255, g: 0, b: 0 })}
        >
          Change to Red
        </button>
        <button
          onClick={() => onColorSelect({ r: 0, g: 255, b: 0 })}
        >
          Select Green
        </button>
      </div>
    );
  };
});

jest.mock('../RoscoluxSwatchPicker', () => {
  return function MockRoscoluxSwatchPicker({ currentColor, onColorSelect }: unknown) {
    return (
      <div data-testid="roscolux-swatch-picker">
        <div>Current: rgb({currentColor.r}, {currentColor.g}, {currentColor.b})</div>
        <button
          onClick={() => onColorSelect({ r: 0, g: 0, b: 255 })}
        >
          Select Blue Filter
        </button>
      </div>
    );
  };
});

describe('ColorPickerModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentColor: { r: 128, g: 128, b: 128 },
    onColorChange: jest.fn(),
    onColorSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      render(<ColorPickerModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Color Picker')).not.toBeInTheDocument();
    });

    it('renders modal when open', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByText('Color Picker')).toBeInTheDocument();
      expect(screen.getByText('Color Wheel')).toBeInTheDocument();
      expect(screen.getByText('Roscolux Filters')).toBeInTheDocument();
      expect(screen.getByText('Selected Color:')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Apply Color')).toBeInTheDocument();
    });

    it('shows color wheel tab by default', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByTestId('color-wheel-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('roscolux-swatch-picker')).not.toBeInTheDocument();
    });

    it('displays current color in preview', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByText('RGB(128, 128, 128)')).toBeInTheDocument();
    });

    it('displays current color in color preview div', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const colorPreview = screen.getByText('RGB(128, 128, 128)').parentElement?.querySelector('div');
      expect(colorPreview).toHaveStyle('background-color: rgb(128, 128, 128)');
    });
  });

  describe('tab navigation', () => {
    it('switches to roscolux tab when clicked', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const roscoluxTab = screen.getByText('Roscolux Filters');
      await userEvent.click(roscoluxTab);

      expect(screen.getByTestId('roscolux-swatch-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('color-wheel-picker')).not.toBeInTheDocument();
    });

    it('switches back to color wheel tab', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Roscolux Filters'));
      await userEvent.click(screen.getByText('Color Wheel'));

      expect(screen.getByTestId('color-wheel-picker')).toBeInTheDocument();
      expect(screen.queryByTestId('roscolux-swatch-picker')).not.toBeInTheDocument();
    });

    it('applies correct active tab styling', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const wheelTab = screen.getByText('Color Wheel');
      const roscoluxTab = screen.getByText('Roscolux Filters');

      expect(wheelTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(roscoluxTab).toHaveClass('text-gray-500');

      await userEvent.click(roscoluxTab);

      expect(roscoluxTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(wheelTab).toHaveClass('text-gray-500');
    });
  });

  describe('color updates', () => {
    it('updates selected color when color wheel changes', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });

      await waitFor(() => {
        expect(screen.getByText('RGB(255, 0, 0)')).toBeInTheDocument();
      });
    });

    it('updates selected color when roscolux filter is selected', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Roscolux Filters'));
      const selectButton = screen.getByText('Select Blue Filter');
      await userEvent.click(selectButton);

      expect(defaultProps.onColorChange).toHaveBeenCalledWith({ r: 0, g: 0, b: 255 });

      await waitFor(() => {
        expect(screen.getByText('RGB(0, 0, 255)')).toBeInTheDocument();
      });
    });

    it('updates selected color when currentColor prop changes', () => {
      const { rerender } = render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByText('RGB(128, 128, 128)')).toBeInTheDocument();

      rerender(<ColorPickerModal {...defaultProps} currentColor={{ r: 200, g: 100, b: 50 }} />);

      expect(screen.getByText('RGB(200, 100, 50)')).toBeInTheDocument();
    });
  });

  describe('modal interactions', () => {
    it('calls onClose when X button is clicked', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: '' });
      await userEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onColorSelect and onClose when Apply Color is clicked', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const applyButton = screen.getByText('Apply Color');
      await userEvent.click(applyButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({ r: 128, g: 128, b: 128 });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onColorSelect with updated color when Apply Color is clicked after color change', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const changeButton = screen.getByText('Change to Red');
      await userEvent.click(changeButton);

      const applyButton = screen.getByText('Apply Color');
      await userEvent.click(applyButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
    });

    it('calls onClose when clicking backdrop', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const backdrop = screen.getByText('Color Picker').closest('.fixed');
      fireEvent.click(backdrop!);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking modal content', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const modalContent = screen.getByText('Color Picker').parentElement;
      fireEvent.click(modalContent!);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('prevents event propagation on backdrop click', async () => {
      const handleClick = jest.fn();
      render(
        <div onClick={handleClick}>
          <ColorPickerModal {...defaultProps} />
        </div>
      );

      const backdrop = screen.getByText('Color Picker').closest('.fixed');
      fireEvent.click(backdrop!);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents event propagation on modal content click', async () => {
      const handleClick = jest.fn();
      render(
        <div onClick={handleClick}>
          <ColorPickerModal {...defaultProps} />
        </div>
      );

      const modalContent = screen.getByText('Color Picker').parentElement;
      fireEvent.click(modalContent!);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('closes modal when Escape is pressed', () => {
      render(<ColorPickerModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close modal when other keys are pressed', () => {
      render(<ColorPickerModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('adds keydown listener when modal opens', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      render(<ColorPickerModal {...defaultProps} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('removes keydown listener when modal closes', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { rerender } = render(<ColorPickerModal {...defaultProps} />);
      rerender(<ColorPickerModal {...defaultProps} isOpen={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('does not add keydown listener when modal is closed', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      render(<ColorPickerModal {...defaultProps} isOpen={false} />);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('child component integration', () => {
    it('passes correct props to ColorWheelPicker', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByText('Current: rgb(128, 128, 128)')).toBeInTheDocument();
    });

    it('passes correct props to RoscoluxSwatchPicker', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Roscolux Filters'));

      expect(screen.getByText('Current: rgb(128, 128, 128)')).toBeInTheDocument();
    });

    it('handles ColorWheelPicker onColorSelect callback', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const selectButton = screen.getByText('Select Green');
      await userEvent.click(selectButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({ r: 0, g: 255, b: 0 });
    });
  });

  describe('accessibility', () => {
    it('has proper button roles', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /color wheel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /roscolux filters/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply color/i })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /color picker/i })).toBeInTheDocument();
    });

    it('has proper focus management', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const wheelTab = screen.getByText('Color Wheel');
      const roscoluxTab = screen.getByText('Roscolux Filters');

      expect(wheelTab.tagName).toBe('BUTTON');
      expect(roscoluxTab.tagName).toBe('BUTTON');
    });
  });

  describe('styling', () => {
    it('applies correct modal backdrop classes', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const backdrop = screen.getByText('Color Picker').closest('.fixed');
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'z-50');
    });

    it('applies correct modal content classes', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const modalContent = screen.getByText('Color Picker').parentElement?.parentElement;
      expect(modalContent).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-xl');
    });

    it('applies correct tab button classes', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const activeTab = screen.getByText('Color Wheel');
      const inactiveTab = screen.getByText('Roscolux Filters');

      expect(activeTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(inactiveTab).toHaveClass('text-gray-500');
    });

    it('applies correct button classes', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const applyButton = screen.getByText('Apply Color');

      expect(cancelButton).toHaveClass('bg-gray-100', 'dark:bg-gray-700');
      expect(applyButton).toHaveClass('bg-blue-600', 'text-white');
    });
  });

  describe('edge cases', () => {
    it('handles color with zero values', () => {
      render(<ColorPickerModal {...defaultProps} currentColor={{ r: 0, g: 0, b: 0 }} />);

      expect(screen.getByText('RGB(0, 0, 0)')).toBeInTheDocument();
    });

    it('handles color with maximum values', () => {
      render(<ColorPickerModal {...defaultProps} currentColor={{ r: 255, g: 255, b: 255 }} />);

      expect(screen.getByText('RGB(255, 255, 255)')).toBeInTheDocument();
    });

    it('handles rapid tab switching', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const wheelTab = screen.getByText('Color Wheel');
      const roscoluxTab = screen.getByText('Roscolux Filters');

      await userEvent.click(roscoluxTab);
      await userEvent.click(wheelTab);
      await userEvent.click(roscoluxTab);

      expect(screen.getByTestId('roscolux-swatch-picker')).toBeInTheDocument();
    });

    it('handles multiple keydown events', () => {
      render(<ColorPickerModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
    });
  });
});