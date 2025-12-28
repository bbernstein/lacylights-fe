import { render, screen, fireEvent } from '@testing-library/react';
import BottomSheet from '../BottomSheet';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

describe('BottomSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div data-testid="content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
    document.body.style.overflow = '';
  });

  describe('Desktop mode (centered modal)', () => {
    it('renders content when open', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<BottomSheet {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<BottomSheet {...defaultProps} title="Test" />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<BottomSheet {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} title="Test" />);

      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when backdrop click is disabled', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} closeOnBackdrop={false} />);

      fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape is pressed', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when Escape is disabled', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} closeOnEscape={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('renders footer when provided', () => {
      render(
        <BottomSheet
          {...defaultProps}
          footer={<button data-testid="footer-button">Save</button>}
        />
      );
      expect(screen.getByTestId('footer-button')).toBeInTheDocument();
    });

    it('prevents body scroll when open', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { unmount } = render(<BottomSheet {...defaultProps} />);
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('applies custom maxWidth class', () => {
      render(<BottomSheet {...defaultProps} maxWidth="max-w-2xl" />);
      const sheet = screen.getByTestId('bottom-sheet');
      expect(sheet).toHaveClass('max-w-2xl');
    });

    it('applies custom testId', () => {
      render(<BottomSheet {...defaultProps} testId="custom-sheet" />);
      expect(screen.getByTestId('custom-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('custom-sheet-backdrop')).toBeInTheDocument();
    });
  });

  describe('Mobile mode (bottom sheet)', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('renders as bottom sheet on mobile', () => {
      render(<BottomSheet {...defaultProps} title="Mobile Sheet" />);
      expect(screen.getByTestId('bottom-sheet')).toBeInTheDocument();
      expect(screen.getByText('Mobile Sheet')).toBeInTheDocument();
    });

    it('shows drag handle by default on mobile', () => {
      render(<BottomSheet {...defaultProps} />);
      // The drag handle is a div with specific styling (w-10 h-1)
      const sheet = screen.getByTestId('bottom-sheet');
      expect(sheet.querySelector('.w-10.h-1')).toBeInTheDocument();
    });

    it('hides drag handle when showHandle is false', () => {
      render(<BottomSheet {...defaultProps} showHandle={false} />);
      const sheet = screen.getByTestId('bottom-sheet');
      expect(sheet.querySelector('.w-10.h-1')).not.toBeInTheDocument();
    });

    it('has rounded top corners on mobile', () => {
      render(<BottomSheet {...defaultProps} />);
      const sheet = screen.getByTestId('bottom-sheet');
      expect(sheet).toHaveClass('rounded-t-2xl');
    });

    it('has larger close button for touch on mobile', () => {
      render(<BottomSheet {...defaultProps} title="Test" />);
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toHaveClass('p-2');
    });

    it('applies fullHeightMobile when enabled', () => {
      render(<BottomSheet {...defaultProps} fullHeightMobile />);
      const sheet = screen.getByTestId('bottom-sheet');
      expect(sheet).toHaveClass('top-4');
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title is provided', () => {
      render(<BottomSheet {...defaultProps} title="Test Title" testId="my-sheet" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'my-sheet-title');
    });

    it('does not have aria-labelledby when no title', () => {
      render(<BottomSheet {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('Touch gestures on mobile', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('handles touch events for swipe to dismiss', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);
      const sheet = screen.getByTestId('bottom-sheet');

      // Simulate swipe down (more than 100px should close)
      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 100 }],
      });
      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 250 }],
      });
      fireEvent.touchEnd(sheet);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on small swipes', () => {
      const onClose = jest.fn();
      render(<BottomSheet {...defaultProps} onClose={onClose} />);
      const sheet = screen.getByTestId('bottom-sheet');

      // Simulate small swipe (less than 100px should not close)
      fireEvent.touchStart(sheet, {
        touches: [{ clientY: 100 }],
      });
      fireEvent.touchMove(sheet, {
        touches: [{ clientY: 150 }],
      });
      fireEvent.touchEnd(sheet);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
