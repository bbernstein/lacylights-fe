import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorPickerModal from '../ColorPickerModal';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
  useIsTablet: jest.fn(() => false),
  useIsDesktop: jest.fn(() => true),
  useMediaQuery: jest.fn(() => false),
}));

// Mock StreamDockContext
jest.mock('@/contexts/StreamDockContext', () => ({
  useStreamDock: () => ({
    connectionState: 'disconnected',
    registerCuePlayerHandlers: jest.fn(),
    registerLookEditorHandlers: jest.fn(),
    registerColorPickerHandlers: jest.fn(),
    publishCueListState: jest.fn(),
    publishLookEditorState: jest.fn(),
    publishColorPickerState: jest.fn(),
  }),
}));

jest.mock('../ColorWheelPicker', () => {
  return function MockColorWheelPicker({ currentColor, onColorChange, onColorSelect }: { currentColor: { r: number; g: number; b: number }; onColorChange: (color: { r: number; g: number; b: number }) => void; onColorSelect: (color: { r: number; g: number; b: number }) => void }) {
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
  return function MockRoscoluxSwatchPicker({ currentColor, onColorSelect }: { currentColor: { r: number; g: number; b: number }; onColorSelect: (color: { r: number; g: number; b: number }) => void }) {
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

      // Find the color preview div by its style
      const colorPreviewDivs = document.querySelectorAll('div[style*="background-color"]');
      const colorPreview = Array.from(colorPreviewDivs).find(div =>
        (div as HTMLElement).style.backgroundColor === 'rgb(128, 128, 128)'
      );
      expect(colorPreview).toBeInTheDocument();
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

    it('updates selected color when currentColor prop changes and modal reopens', () => {
      const { rerender } = render(<ColorPickerModal {...defaultProps} />);

      // Check hex input value instead of RGB text (which is split across multiple elements)
      expect(screen.getByDisplayValue('#808080')).toBeInTheDocument();

      // Close the modal, update currentColor, then reopen
      rerender(<ColorPickerModal {...defaultProps} isOpen={false} />);
      rerender(<ColorPickerModal {...defaultProps} isOpen={true} currentColor={{ r: 200, g: 100, b: 50 }} />);

      expect(screen.getByDisplayValue('#C86432')).toBeInTheDocument();
    });
  });

  describe('modal interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      // BottomSheet close button has aria-label="Close"
      const closeButton = screen.getByRole('button', { name: /close/i });
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

      const backdrop = screen.getByTestId('color-picker-modal-backdrop');
      await userEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking modal content', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const modalContent = screen.getByTestId('color-picker-modal');
      await userEvent.click(modalContent);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('closes modal when Escape is pressed', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      await userEvent.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close modal when non-escape keys are pressed on backdrop', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      // Focus the backdrop (not a button) and press other keys
      const backdrop = screen.getByTestId('color-picker-modal-backdrop');
      backdrop.focus();

      await userEvent.keyboard('a');
      await userEvent.keyboard('1');

      expect(defaultProps.onClose).not.toHaveBeenCalled();
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

    it('has proper dialog role', () => {
      render(<ColorPickerModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
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

    it('handles multiple escape key presses', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      await userEvent.keyboard('{Escape}');
      await userEvent.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      // Reset to mobile
      jest.requireMock('@/hooks/useMediaQuery').useIsMobile.mockReturnValue(true);
    });

    afterEach(() => {
      // Reset back to desktop
      jest.requireMock('@/hooks/useMediaQuery').useIsMobile.mockReturnValue(false);
    });

    it('shows collapsible advanced section on mobile', () => {
      render(<ColorPickerModal {...defaultProps} />);

      // On mobile, the selected color section has a toggle button
      const selectedColorButton = screen.getByRole('button', { name: /selected color/i });
      expect(selectedColorButton).toBeInTheDocument();
    });

    it('toggles advanced section when clicked on mobile', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      // Initially collapsed on mobile
      expect(screen.queryByText('Hex:')).not.toBeInTheDocument();

      // Click to expand
      const selectedColorButton = screen.getByRole('button', { name: /selected color/i });
      await userEvent.click(selectedColorButton);

      // Now visible
      expect(screen.getByText('Hex:')).toBeInTheDocument();

      // Click to collapse
      await userEvent.click(selectedColorButton);

      // Hidden again
      expect(screen.queryByText('Hex:')).not.toBeInTheDocument();
    });

    it('stacks buttons vertically on mobile', () => {
      render(<ColorPickerModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const applyButton = screen.getByText('Apply Color');

      expect(cancelButton).toHaveClass('w-full');
      expect(applyButton).toHaveClass('w-full');
    });
  });

  describe('hex input', () => {
    it('updates color when valid 6-char hex is entered', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#0000FF');

      // Typing #0000FF doesn't trigger intermediate valid 3-char matches
      expect(defaultProps.onColorChange).toHaveBeenLastCalledWith({ r: 0, g: 0, b: 255 });
    });

    it('updates color when valid 3-char hex is entered', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, '#F00');

      // 3-char hex #F00 = #FF0000 (red)
      expect(defaultProps.onColorChange).toHaveBeenLastCalledWith({ r: 255, g: 0, b: 0 });
    });

    it('shows error styling for invalid hex', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, 'invalid');

      expect(hexInput).toHaveClass('border-red-500');
    });

    it('resets to valid hex on blur if invalid', async () => {
      render(<ColorPickerModal {...defaultProps} />);

      const hexInput = screen.getByDisplayValue('#808080');
      await userEvent.clear(hexInput);
      await userEvent.type(hexInput, 'invalid');
      await userEvent.tab();

      expect(hexInput).toHaveValue('#808080');
    });
  });
});
