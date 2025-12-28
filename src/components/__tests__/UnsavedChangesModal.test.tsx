import { render, screen, fireEvent } from '@testing-library/react';
import UnsavedChangesModal from '../UnsavedChangesModal';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

describe('UnsavedChangesModal', () => {
  const defaultProps = {
    isOpen: true,
    onSave: jest.fn(),
    onDiscard: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      expect(
        screen.getByText('You have unsaved changes. What would you like to do?')
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<UnsavedChangesModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('should render custom title and message', () => {
      render(
        <UnsavedChangesModal
          {...defaultProps}
          title="Custom Title"
          message="Custom message here"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message here')).toBeInTheDocument();
    });

    it('should render all three buttons', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      expect(screen.getByTestId('unsaved-changes-discard-button')).toBeInTheDocument();
      expect(screen.getByTestId('unsaved-changes-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('unsaved-changes-save-button')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onSave when Save button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('unsaved-changes-save-button'));

      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onDiscard when Discard button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('unsaved-changes-discard-button'));

      expect(defaultProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId('unsaved-changes-cancel-button'));

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when X button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const closeButton = screen.getByTestId('unsaved-changes-modal-close-button');
      fireEvent.click(closeButton);

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard interactions', () => {
    it('should call onCancel when Escape is pressed', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel on Escape when saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('backdrop interactions', () => {
    it('should call onCancel when clicking backdrop', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const backdrop = screen.getByTestId('unsaved-changes-modal-backdrop');
      fireEvent.click(backdrop);

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking modal content', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const title = screen.getByText('Unsaved Changes');
      fireEvent.click(title);

      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it('should not call onCancel when clicking backdrop while saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      const backdrop = screen.getByTestId('unsaved-changes-modal-backdrop');
      fireEvent.click(backdrop);

      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('saveInProgress state', () => {
    it('should show "Saving..." text when saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show spinner when saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      // Check for the spinner SVG
      const saveButton = screen.getByTestId('unsaved-changes-save-button');
      expect(saveButton.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('should disable all action buttons when saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      expect(screen.getByTestId('unsaved-changes-save-button')).toBeDisabled();
      expect(screen.getByTestId('unsaved-changes-discard-button')).toBeDisabled();
      expect(screen.getByTestId('unsaved-changes-cancel-button')).toBeDisabled();
    });

    it('should not call callbacks when buttons are clicked while saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      fireEvent.click(screen.getByTestId('unsaved-changes-save-button'));
      fireEvent.click(screen.getByTestId('unsaved-changes-discard-button'));
      fireEvent.click(screen.getByTestId('unsaved-changes-cancel-button'));

      // Buttons are disabled, so callbacks shouldn't be called
      // Note: disabled buttons don't fire onClick events
      expect(defaultProps.onSave).not.toHaveBeenCalled();
      expect(defaultProps.onDiscard).not.toHaveBeenCalled();
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have role="dialog" and aria-modal="true"', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to the title', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'unsaved-changes-modal-title');

      const title = screen.getByText('Unsaved Changes');
      expect(title).toHaveAttribute('id', 'unsaved-changes-modal-title');
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should stack buttons vertically on mobile', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const saveButton = screen.getByTestId('unsaved-changes-save-button');
      const buttonContainer = saveButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('should show Save button first on mobile', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const buttonLabels = buttons.map(b => b.textContent);
      // Save should come before Cancel and Discard on mobile
      const saveIndex = buttonLabels.indexOf('Save Changes');
      const cancelIndex = buttonLabels.indexOf('Cancel');
      const discardIndex = buttonLabels.indexOf('Discard');
      expect(saveIndex).toBeLessThan(cancelIndex);
      expect(cancelIndex).toBeLessThan(discardIndex);
    });

    it('should have larger touch targets on mobile', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const saveButton = screen.getByTestId('unsaved-changes-save-button');
      const cancelButton = screen.getByTestId('unsaved-changes-cancel-button');
      const discardButton = screen.getByTestId('unsaved-changes-discard-button');

      expect(saveButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
      expect(discardButton).toHaveClass('min-h-[44px]');
    });

    it('should render as BottomSheet dialog', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
