import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddCueDialog from '../AddCueDialog';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';
const mockUseIsMobile = useIsMobile as jest.Mock;

const mockScenes = [
  { id: 'scene-1', name: 'Scene 1', description: 'First scene' },
  { id: 'scene-2', name: 'Scene 2', description: 'Second scene' },
  { id: 'scene-3', name: 'Scene 3', description: 'Third scene' },
];

describe('AddCueDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    cueListId: 'cue-list-1',
    currentCueNumber: 5,
    currentSceneId: 'scene-2',
    scenes: mockScenes,
    defaultFadeInTime: 3,
    defaultFadeOutTime: 3,
    onAdd: mockOnAdd,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <AddCueDialog {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders dialog when isOpen is true', () => {
      render(<AddCueDialog {...defaultProps} />);
      expect(screen.getByText('Add Cue')).toBeInTheDocument();
      expect(screen.getByText('Insert a new cue after the current position in the cue list.')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<AddCueDialog {...defaultProps} />);
      expect(screen.getByLabelText('Cue Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Cue Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Scene *')).toBeInTheDocument();
      expect(screen.getByLabelText('Create a copy of the scene')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<AddCueDialog {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Add Only')).toBeInTheDocument();
      expect(screen.getByText('Add & Edit')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('auto-calculates cue number as current + 0.5', () => {
      render(<AddCueDialog {...defaultProps} currentCueNumber={5} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      expect(cueNumberInput.value).toBe('5.5');
    });

    it('sets cue number to 1 when current is -1', () => {
      render(<AddCueDialog {...defaultProps} currentCueNumber={-1} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      expect(cueNumberInput.value).toBe('1');
    });

    it('defaults to current scene when provided', () => {
      render(<AddCueDialog {...defaultProps} currentSceneId="scene-2" />);
      const sceneSelect = screen.getByLabelText('Scene *') as HTMLSelectElement;
      expect(sceneSelect.value).toBe('scene-2');
    });

    it('defaults to first scene when no current scene', () => {
      render(<AddCueDialog {...defaultProps} currentSceneId={null} />);
      const sceneSelect = screen.getByLabelText('Scene *') as HTMLSelectElement;
      expect(sceneSelect.value).toBe('scene-1');
    });

    it('generates default cue name based on cue number', () => {
      render(<AddCueDialog {...defaultProps} currentCueNumber={5} />);
      const cueNameInput = screen.getByLabelText('Cue Name') as HTMLInputElement;
      expect(cueNameInput.value).toBe('Cue 5');
    });

    it('"Create a copy" checkbox is checked by default', () => {
      render(<AddCueDialog {...defaultProps} />);
      const createCopyCheckbox = screen.getByLabelText('Create a copy of the scene') as HTMLInputElement;
      expect(createCopyCheckbox.checked).toBe(true);
    });
  });

  describe('Form Interactions', () => {
    it('updates cue number when changed', () => {
      render(<AddCueDialog {...defaultProps} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      fireEvent.change(cueNumberInput, { target: { value: '7.5' } });
      expect(cueNumberInput.value).toBe('7.5');
    });

    it('updates cue name when changed', () => {
      render(<AddCueDialog {...defaultProps} />);
      const cueNameInput = screen.getByLabelText('Cue Name') as HTMLInputElement;
      fireEvent.change(cueNameInput, { target: { value: 'Opening Scene' } });
      expect(cueNameInput.value).toBe('Opening Scene');
    });

    it('updates selected scene when changed', () => {
      render(<AddCueDialog {...defaultProps} />);
      const sceneSelect = screen.getByLabelText('Scene *') as HTMLSelectElement;
      fireEvent.change(sceneSelect, { target: { value: 'scene-3' } });
      expect(sceneSelect.value).toBe('scene-3');
    });

    it('toggles create copy checkbox', () => {
      render(<AddCueDialog {...defaultProps} />);
      const createCopyCheckbox = screen.getByLabelText('Create a copy of the scene') as HTMLInputElement;
      expect(createCopyCheckbox.checked).toBe(true);
      fireEvent.click(createCopyCheckbox);
      expect(createCopyCheckbox.checked).toBe(false);
      fireEvent.click(createCopyCheckbox);
      expect(createCopyCheckbox.checked).toBe(true);
    });

    it('shows/hides advanced timing section', () => {
      render(<AddCueDialog {...defaultProps} />);
      const advancedButton = screen.getByText('Advanced Timing');

      // Initially hidden
      expect(screen.queryByLabelText(/Fade In Time/i)).not.toBeInTheDocument();

      // Click to show
      fireEvent.click(advancedButton);
      expect(screen.getByLabelText(/Fade In Time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fade Out Time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Follow Time/i)).toBeInTheDocument();

      // Click to hide
      fireEvent.click(advancedButton);
      expect(screen.queryByLabelText(/Fade In Time/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for invalid cue number', async () => {
      render(<AddCueDialog {...defaultProps} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *');
      fireEvent.change(cueNumberInput, { target: { value: '-5' } });

      const addButton = screen.getByText('Add & Edit');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Cue number must be a valid positive number')).toBeInTheDocument();
      });

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('shows error when no scene is selected', async () => {
      render(<AddCueDialog {...defaultProps} currentSceneId={null} />);
      const sceneSelect = screen.getByLabelText('Scene *');
      fireEvent.change(sceneSelect, { target: { value: '' } });

      const addButton = screen.getByText('Add & Edit');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a scene')).toBeInTheDocument();
      });

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('shows error for negative fade times', async () => {
      render(<AddCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const fadeInInput = screen.getByLabelText('Fade In Time (seconds)');
      fireEvent.change(fadeInInput, { target: { value: '-1' } });

      const addButton = screen.getByText('Add & Edit');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Fade in time must be a valid positive number')).toBeInTheDocument();
      });

      expect(mockOnAdd).not.toHaveBeenCalled();
    });
  });

  describe('Submit Actions', () => {
    it('calls onAdd with correct params when clicking "Add & Edit"', () => {
      render(<AddCueDialog {...defaultProps} />);

      // Modify some fields
      const cueNumberInput = screen.getByLabelText('Cue Number *');
      fireEvent.change(cueNumberInput, { target: { value: '6.5' } });

      const cueNameInput = screen.getByLabelText('Cue Name');
      fireEvent.change(cueNameInput, { target: { value: 'Test Cue' } });

      const sceneSelect = screen.getByLabelText('Scene *');
      fireEvent.change(sceneSelect, { target: { value: 'scene-3' } });

      // Submit
      const addEditButton = screen.getByText('Add & Edit');
      fireEvent.click(addEditButton);

      expect(mockOnAdd).toHaveBeenCalledWith({
        cueNumber: 6.5,
        name: 'Test Cue',
        sceneId: 'scene-3',
        createCopy: true,
        fadeInTime: 3,
        fadeOutTime: 3,
        followTime: undefined,
        action: 'edit',
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onAdd with action "stay" when clicking "Add Only"', () => {
      render(<AddCueDialog {...defaultProps} />);

      const addOnlyButton = screen.getByText('Add Only');
      fireEvent.click(addOnlyButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'stay',
        })
      );

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('includes custom fade times when advanced timing is used', () => {
      render(<AddCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      // Set custom fade times
      const fadeInInput = screen.getByLabelText('Fade In Time (seconds)');
      fireEvent.change(fadeInInput, { target: { value: '5' } });

      const fadeOutInput = screen.getByLabelText('Fade Out Time (seconds)');
      fireEvent.change(fadeOutInput, { target: { value: '2.5' } });

      const followTimeInput = screen.getByLabelText('Follow Time (seconds, optional)');
      fireEvent.change(followTimeInput, { target: { value: '10' } });

      // Submit
      const addEditButton = screen.getByText('Add & Edit');
      fireEvent.click(addEditButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          fadeInTime: 5,
          fadeOutTime: 2.5,
          followTime: 10,
        })
      );
    });

    it('uses default cue name when name field is empty', () => {
      render(<AddCueDialog {...defaultProps} currentCueNumber={7} />);

      // Clear the cue name
      const cueNameInput = screen.getByLabelText('Cue Name');
      fireEvent.change(cueNameInput, { target: { value: '' } });

      // Submit
      const addEditButton = screen.getByText('Add & Edit');
      fireEvent.click(addEditButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cue 7',
        })
      );
    });

    it('passes createCopy value correctly', () => {
      render(<AddCueDialog {...defaultProps} />);

      // Uncheck create copy
      const createCopyCheckbox = screen.getByLabelText('Create a copy of the scene');
      fireEvent.click(createCopyCheckbox);

      // Submit
      const addEditButton = screen.getByText('Add & Edit');
      fireEvent.click(addEditButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          createCopy: false,
        })
      );
    });
  });

  describe('Dialog Close', () => {
    it('calls onClose when clicking Cancel button', () => {
      render(<AddCueDialog {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
      render(<AddCueDialog {...defaultProps} />);
      const backdrop = screen.getByTestId('add-cue-dialog-backdrop');
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when closed and reopened', () => {
      const { rerender } = render(<AddCueDialog {...defaultProps} />);

      // Modify fields
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      fireEvent.change(cueNumberInput, { target: { value: '10' } });

      // Close
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Reopen
      rerender(<AddCueDialog {...defaultProps} currentCueNumber={7} />);

      // Should have new default value
      expect(cueNumberInput.value).toBe('7.5');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty scene list gracefully', () => {
      render(<AddCueDialog {...defaultProps} scenes={[]} currentSceneId={null} />);
      const sceneSelect = screen.getByLabelText('Scene *');
      expect(sceneSelect).toBeInTheDocument();
      // Should only have the "Select a scene..." option
      expect(sceneSelect.children.length).toBe(1);
    });

    it('handles cue number 0 correctly', () => {
      render(<AddCueDialog {...defaultProps} currentCueNumber={0} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      expect(cueNumberInput.value).toBe('0.5');
    });

    it('trims whitespace from cue name', () => {
      render(<AddCueDialog {...defaultProps} />);

      const cueNameInput = screen.getByLabelText('Cue Name');
      fireEvent.change(cueNameInput, { target: { value: '  Padded Name  ' } });

      const addEditButton = screen.getByText('Add & Edit');
      fireEvent.click(addEditButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Padded Name',
        })
      );
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    afterEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('stacks buttons vertically on mobile', () => {
      render(<AddCueDialog {...defaultProps} />);

      const addEditButton = screen.getByText('Add & Edit');
      const buttonContainer = addEditButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows primary action first on mobile', () => {
      render(<AddCueDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button').filter(btn =>
        ['Add & Edit', 'Add Only', 'Cancel'].includes(btn.textContent || '')
      );
      const buttonLabels = buttons.map(b => b.textContent);

      // Primary action (Add & Edit) should be first on mobile
      expect(buttonLabels[0]).toBe('Add & Edit');
      expect(buttonLabels[1]).toBe('Add Only');
      expect(buttonLabels[2]).toBe('Cancel');
    });

    it('has proper touch targets on mobile', () => {
      render(<AddCueDialog {...defaultProps} />);

      const addEditButton = screen.getByText('Add & Edit');
      const addOnlyButton = screen.getByText('Add Only');
      const cancelButton = screen.getByText('Cancel');

      expect(addEditButton).toHaveClass('min-h-[44px]');
      expect(addOnlyButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
    });

    it('has touch-manipulation class on mobile buttons', () => {
      render(<AddCueDialog {...defaultProps} />);

      const addEditButton = screen.getByText('Add & Edit');
      const addOnlyButton = screen.getByText('Add Only');
      const cancelButton = screen.getByText('Cancel');

      expect(addEditButton).toHaveClass('touch-manipulation');
      expect(addOnlyButton).toHaveClass('touch-manipulation');
      expect(cancelButton).toHaveClass('touch-manipulation');
    });
  });
});
