import { render, screen, fireEvent } from '@testing-library/react';
import SceneEditorBottomActions from '../SceneEditorBottomActions';

describe('SceneEditorBottomActions', () => {
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
    render(<SceneEditorBottomActions {...defaultProps} />);

    expect(screen.getByTestId('scene-editor-bottom-actions-undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('scene-editor-bottom-actions-redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('scene-editor-bottom-actions-preview-button')).toBeInTheDocument();
    expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toBeInTheDocument();
  });

  it('renders with custom testId', () => {
    render(<SceneEditorBottomActions {...defaultProps} testId="custom-actions" />);

    expect(screen.getByTestId('custom-actions')).toBeInTheDocument();
  });

  describe('Undo button', () => {
    it('is disabled when canUndo is false', () => {
      render(<SceneEditorBottomActions {...defaultProps} canUndo={false} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-undo-button')).toBeDisabled();
    });

    it('is enabled when canUndo is true', () => {
      render(<SceneEditorBottomActions {...defaultProps} canUndo={true} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-undo-button')).not.toBeDisabled();
    });

    it('calls onUndo when clicked', () => {
      const onUndo = jest.fn();
      render(<SceneEditorBottomActions {...defaultProps} canUndo={true} onUndo={onUndo} />);

      fireEvent.click(screen.getByTestId('scene-editor-bottom-actions-undo-button'));
      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redo button', () => {
    it('is disabled when canRedo is false', () => {
      render(<SceneEditorBottomActions {...defaultProps} canRedo={false} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-redo-button')).toBeDisabled();
    });

    it('is enabled when canRedo is true', () => {
      render(<SceneEditorBottomActions {...defaultProps} canRedo={true} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-redo-button')).not.toBeDisabled();
    });

    it('calls onRedo when clicked', () => {
      const onRedo = jest.fn();
      render(<SceneEditorBottomActions {...defaultProps} canRedo={true} onRedo={onRedo} />);

      fireEvent.click(screen.getByTestId('scene-editor-bottom-actions-redo-button'));
      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preview button', () => {
    it('shows inactive state when preview is off', () => {
      render(<SceneEditorBottomActions {...defaultProps} previewMode={false} />);

      const button = screen.getByTestId('scene-editor-bottom-actions-preview-button');
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveClass('bg-gray-700');
    });

    it('shows active state when preview is on', () => {
      render(<SceneEditorBottomActions {...defaultProps} previewMode={true} />);

      const button = screen.getByTestId('scene-editor-bottom-actions-preview-button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('calls onTogglePreview when clicked', () => {
      const onTogglePreview = jest.fn();
      render(
        <SceneEditorBottomActions {...defaultProps} onTogglePreview={onTogglePreview} />
      );

      fireEvent.click(screen.getByTestId('scene-editor-bottom-actions-preview-button'));
      expect(onTogglePreview).toHaveBeenCalledTimes(1);
    });
  });

  describe('Save button', () => {
    it('is disabled when not dirty', () => {
      render(<SceneEditorBottomActions {...defaultProps} isDirty={false} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toBeDisabled();
    });

    it('is enabled when dirty', () => {
      render(<SceneEditorBottomActions {...defaultProps} isDirty={true} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).not.toBeDisabled();
    });

    it('calls onSave when clicked', () => {
      const onSave = jest.fn();
      render(<SceneEditorBottomActions {...defaultProps} isDirty={true} onSave={onSave} />);

      fireEvent.click(screen.getByTestId('scene-editor-bottom-actions-save-button'));
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('is disabled when saving', () => {
      render(
        <SceneEditorBottomActions {...defaultProps} isDirty={true} saveStatus="saving" />
      );

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toBeDisabled();
    });

    it('shows "Saving" text when saving', () => {
      render(
        <SceneEditorBottomActions {...defaultProps} isDirty={true} saveStatus="saving" />
      );

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toHaveTextContent(
        'Saving'
      );
    });

    it('shows "Saved" text when saved', () => {
      render(<SceneEditorBottomActions {...defaultProps} saveStatus="saved" />);

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toHaveTextContent(
        'Saved'
      );
    });

    it('shows "Error" text when error', () => {
      render(<SceneEditorBottomActions {...defaultProps} saveStatus="error" />);

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toHaveTextContent(
        'Error'
      );
    });

    it('shows "Save" text when idle', () => {
      render(<SceneEditorBottomActions {...defaultProps} saveStatus="idle" />);

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toHaveTextContent(
        'Save'
      );
    });
  });

  describe('Layout and styling', () => {
    it('is fixed above the mobile navigation bar', () => {
      render(<SceneEditorBottomActions {...defaultProps} />);

      const actions = screen.getByTestId('scene-editor-bottom-actions');
      expect(actions).toHaveClass('fixed', 'bottom-16', 'left-0', 'right-0');
    });

    it('has high z-index', () => {
      render(<SceneEditorBottomActions {...defaultProps} />);

      const actions = screen.getByTestId('scene-editor-bottom-actions');
      expect(actions).toHaveClass('z-40');
    });

    it('is hidden on desktop (md:hidden)', () => {
      render(<SceneEditorBottomActions {...defaultProps} />);

      const actions = screen.getByTestId('scene-editor-bottom-actions');
      expect(actions).toHaveClass('md:hidden');
    });

    it('has touch-manipulation class on all buttons', () => {
      render(
        <SceneEditorBottomActions
          {...defaultProps}
          canUndo={true}
          canRedo={true}
          isDirty={true}
        />
      );

      expect(screen.getByTestId('scene-editor-bottom-actions-undo-button')).toHaveClass(
        'touch-manipulation'
      );
      expect(screen.getByTestId('scene-editor-bottom-actions-redo-button')).toHaveClass(
        'touch-manipulation'
      );
      expect(screen.getByTestId('scene-editor-bottom-actions-preview-button')).toHaveClass(
        'touch-manipulation'
      );
      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toHaveClass(
        'touch-manipulation'
      );
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on undo button', () => {
      render(<SceneEditorBottomActions {...defaultProps} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-undo-button')).toHaveAttribute(
        'aria-label',
        'Undo'
      );
    });

    it('has aria-label on redo button', () => {
      render(<SceneEditorBottomActions {...defaultProps} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-redo-button')).toHaveAttribute(
        'aria-label',
        'Redo'
      );
    });

    it('has aria-label on save button', () => {
      render(<SceneEditorBottomActions {...defaultProps} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-save-button')).toHaveAttribute(
        'aria-label',
        'Save changes'
      );
    });

    it('has aria-pressed on preview button', () => {
      render(<SceneEditorBottomActions {...defaultProps} previewMode={true} />);

      expect(screen.getByTestId('scene-editor-bottom-actions-preview-button')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });
});
