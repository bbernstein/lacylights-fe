import { render, screen, fireEvent } from '@testing-library/react';
import UnsavedChangesModal from '../UnsavedChangesModal';

describe('UnsavedChangesModal', () => {
  const defaultProps = {
    isOpen: true,
    onSave: jest.fn(),
    onDiscard: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

      const closeButton = screen.getByLabelText('Close');
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

    it('should disable all buttons when saveInProgress', () => {
      render(<UnsavedChangesModal {...defaultProps} saveInProgress={true} />);

      expect(screen.getByTestId('unsaved-changes-save-button')).toBeDisabled();
      expect(screen.getByTestId('unsaved-changes-discard-button')).toBeDisabled();
      expect(screen.getByTestId('unsaved-changes-cancel-button')).toBeDisabled();
      expect(screen.getByLabelText('Close')).toBeDisabled();
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
      expect(dialog).toHaveAttribute('aria-labelledby', 'unsaved-changes-title');

      const title = screen.getByText('Unsaved Changes');
      expect(title).toHaveAttribute('id', 'unsaved-changes-title');
    });
  });
});
