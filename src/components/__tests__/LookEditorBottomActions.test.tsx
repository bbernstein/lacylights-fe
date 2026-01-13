import { render, screen, fireEvent } from '@testing-library/react';
import LookEditorBottomActions from '../LookEditorBottomActions';

describe('LookEditorBottomActions', () => {
  const defaultProps = {
    isDirty: false,
    canUndo: false,
    canRedo: false,
    previewMode: false,
    saveStatus: 'idle' as const,
    onSave: jest.fn(),
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    onTogglePreview: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons', () => {
    render(<LookEditorBottomActions {...defaultProps} />);

    expect(screen.getByTestId('look-editor-bottom-actions-undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('look-editor-bottom-actions-redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('look-editor-bottom-actions-preview-button')).toBeInTheDocument();
    expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toBeInTheDocument();
  });

  it('renders with custom testId', () => {
    render(<LookEditorBottomActions {...defaultProps} testId="custom-actions" />);

    expect(screen.getByTestId('custom-actions')).toBeInTheDocument();
  });

  describe('Undo button', () => {
    it('is disabled when canUndo is false', () => {
      render(<LookEditorBottomActions {...defaultProps} canUndo={false} />);

      expect(screen.getByTestId('look-editor-bottom-actions-undo-button')).toBeDisabled();
    });

    it('is enabled when canUndo is true', () => {
      render(<LookEditorBottomActions {...defaultProps} canUndo={true} />);

      expect(screen.getByTestId('look-editor-bottom-actions-undo-button')).not.toBeDisabled();
    });

    it('calls onUndo when clicked', () => {
      const onUndo = jest.fn();
      render(<LookEditorBottomActions {...defaultProps} canUndo={true} onUndo={onUndo} />);

      fireEvent.click(screen.getByTestId('look-editor-bottom-actions-undo-button'));
      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redo button', () => {
    it('is disabled when canRedo is false', () => {
      render(<LookEditorBottomActions {...defaultProps} canRedo={false} />);

      expect(screen.getByTestId('look-editor-bottom-actions-redo-button')).toBeDisabled();
    });

    it('is enabled when canRedo is true', () => {
      render(<LookEditorBottomActions {...defaultProps} canRedo={true} />);

      expect(screen.getByTestId('look-editor-bottom-actions-redo-button')).not.toBeDisabled();
    });

    it('calls onRedo when clicked', () => {
      const onRedo = jest.fn();
      render(<LookEditorBottomActions {...defaultProps} canRedo={true} onRedo={onRedo} />);

      fireEvent.click(screen.getByTestId('look-editor-bottom-actions-redo-button'));
      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preview button', () => {
    it('shows inactive state when preview is off', () => {
      render(<LookEditorBottomActions {...defaultProps} previewMode={false} />);

      const button = screen.getByTestId('look-editor-bottom-actions-preview-button');
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveClass('bg-gray-700');
    });

    it('shows active state when preview is on', () => {
      render(<LookEditorBottomActions {...defaultProps} previewMode={true} />);

      const button = screen.getByTestId('look-editor-bottom-actions-preview-button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('calls onTogglePreview when clicked', () => {
      const onTogglePreview = jest.fn();
      render(
        <LookEditorBottomActions {...defaultProps} onTogglePreview={onTogglePreview} />
      );

      fireEvent.click(screen.getByTestId('look-editor-bottom-actions-preview-button'));
      expect(onTogglePreview).toHaveBeenCalledTimes(1);
    });
  });

  describe('Save button', () => {
    it('is disabled when not dirty', () => {
      render(<LookEditorBottomActions {...defaultProps} isDirty={false} />);

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toBeDisabled();
    });

    it('is enabled when dirty', () => {
      render(<LookEditorBottomActions {...defaultProps} isDirty={true} />);

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).not.toBeDisabled();
    });

    it('calls onSave when clicked', () => {
      const onSave = jest.fn();
      render(<LookEditorBottomActions {...defaultProps} isDirty={true} onSave={onSave} />);

      fireEvent.click(screen.getByTestId('look-editor-bottom-actions-save-button'));
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('is disabled when saving', () => {
      render(
        <LookEditorBottomActions {...defaultProps} isDirty={true} saveStatus="saving" />
      );

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toBeDisabled();
    });

    it('shows "Saving" text when saving', () => {
      render(
        <LookEditorBottomActions {...defaultProps} isDirty={true} saveStatus="saving" />
      );

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toHaveTextContent(
        'Saving'
      );
    });

    it('shows "Saved" text when saved', () => {
      render(<LookEditorBottomActions {...defaultProps} saveStatus="saved" />);

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toHaveTextContent(
        'Saved'
      );
    });

    it('shows "Error" text when error', () => {
      render(<LookEditorBottomActions {...defaultProps} saveStatus="error" />);

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toHaveTextContent(
        'Error'
      );
    });

    it('shows "Save" text when idle', () => {
      render(<LookEditorBottomActions {...defaultProps} saveStatus="idle" />);

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toHaveTextContent(
        'Save'
      );
    });
  });

  describe('Layout and styling', () => {
    it('is fixed above the mobile navigation bar', () => {
      render(<LookEditorBottomActions {...defaultProps} />);

      const actions = screen.getByTestId('look-editor-bottom-actions');
      expect(actions).toHaveClass('fixed', 'bottom-16', 'left-0', 'right-0');
    });

    it('has high z-index', () => {
      render(<LookEditorBottomActions {...defaultProps} />);

      const actions = screen.getByTestId('look-editor-bottom-actions');
      expect(actions).toHaveClass('z-40');
    });

    it('is hidden on desktop (md:hidden)', () => {
      render(<LookEditorBottomActions {...defaultProps} />);

      const actions = screen.getByTestId('look-editor-bottom-actions');
      expect(actions).toHaveClass('md:hidden');
    });

    it('has touch-manipulation class on all buttons', () => {
      render(
        <LookEditorBottomActions
          {...defaultProps}
          canUndo={true}
          canRedo={true}
          isDirty={true}
        />
      );

      expect(screen.getByTestId('look-editor-bottom-actions-undo-button')).toHaveClass(
        'touch-manipulation'
      );
      expect(screen.getByTestId('look-editor-bottom-actions-redo-button')).toHaveClass(
        'touch-manipulation'
      );
      expect(screen.getByTestId('look-editor-bottom-actions-preview-button')).toHaveClass(
        'touch-manipulation'
      );
      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toHaveClass(
        'touch-manipulation'
      );
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on undo button', () => {
      render(<LookEditorBottomActions {...defaultProps} />);

      expect(screen.getByTestId('look-editor-bottom-actions-undo-button')).toHaveAttribute(
        'aria-label',
        'Undo'
      );
    });

    it('has aria-label on redo button', () => {
      render(<LookEditorBottomActions {...defaultProps} />);

      expect(screen.getByTestId('look-editor-bottom-actions-redo-button')).toHaveAttribute(
        'aria-label',
        'Redo'
      );
    });

    it('has aria-label on save button', () => {
      render(<LookEditorBottomActions {...defaultProps} />);

      expect(screen.getByTestId('look-editor-bottom-actions-save-button')).toHaveAttribute(
        'aria-label',
        'Save changes'
      );
    });

    it('has aria-pressed on preview button', () => {
      render(<LookEditorBottomActions {...defaultProps} previewMode={true} />);

      expect(screen.getByTestId('look-editor-bottom-actions-preview-button')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });
});
