import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditCueDialog from '../EditCueDialog';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';
const mockUseIsMobile = useIsMobile as jest.Mock;

const mockLooks = [
  { id: 'look-1', name: 'Look 1', description: 'First look' },
  { id: 'look-2', name: 'Look 2', description: 'Second look' },
  { id: 'look-3', name: 'Look 3', description: 'Third look' },
];

const mockCue = {
  id: 'cue-1',
  cueNumber: 5,
  name: 'Test Cue',
  look: {
    id: 'look-2',
    name: 'Look 2',
  },
  fadeInTime: 3,
  fadeOutTime: 3,
  followTime: undefined,
};

describe('EditCueDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    cue: mockCue,
    looks: mockLooks,
    onUpdate: mockOnUpdate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <EditCueDialog {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders dialog when isOpen is true', () => {
      render(<EditCueDialog {...defaultProps} />);
      expect(screen.getByText('Edit Cue')).toBeInTheDocument();
      expect(screen.getByText('Update cue properties and timing settings.')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<EditCueDialog {...defaultProps} />);
      expect(screen.getByLabelText('Cue Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Cue Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Look *')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<EditCueDialog {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Save & Edit Look')).toBeInTheDocument();
    });
  });

  describe('Pre-populated Values', () => {
    it('pre-populates cue number from cue', () => {
      render(<EditCueDialog {...defaultProps} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      expect(cueNumberInput.value).toBe('5');
    });

    it('pre-populates cue name from cue', () => {
      render(<EditCueDialog {...defaultProps} />);
      const cueNameInput = screen.getByLabelText('Cue Name *') as HTMLInputElement;
      expect(cueNameInput.value).toBe('Test Cue');
    });

    it('pre-populates selected look from cue', () => {
      render(<EditCueDialog {...defaultProps} />);
      const lookSelect = screen.getByLabelText('Look *') as HTMLSelectElement;
      expect(lookSelect.value).toBe('look-2');
    });

    it('pre-populates fade times from cue', () => {
      render(<EditCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const fadeInInput = screen.getByLabelText('Fade In Time (seconds)') as HTMLInputElement;
      const fadeOutInput = screen.getByLabelText('Fade Out Time (seconds)') as HTMLInputElement;

      expect(fadeInInput.value).toBe('3');
      expect(fadeOutInput.value).toBe('3');
    });

    it('pre-populates follow time when present', () => {
      const cueWithFollow = {
        ...mockCue,
        followTime: 5,
      };

      render(<EditCueDialog {...defaultProps} cue={cueWithFollow} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const followTimeInput = screen.getByLabelText('Follow Time (seconds, optional)') as HTMLInputElement;
      expect(followTimeInput.value).toBe('5');
    });

    it('shows empty follow time when undefined', () => {
      render(<EditCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const followTimeInput = screen.getByLabelText('Follow Time (seconds, optional)') as HTMLInputElement;
      expect(followTimeInput.value).toBe('');
    });
  });

  describe('Form Interactions', () => {
    it('updates cue number when changed', () => {
      render(<EditCueDialog {...defaultProps} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      fireEvent.change(cueNumberInput, { target: { value: '7.5' } });
      expect(cueNumberInput.value).toBe('7.5');
    });

    it('updates cue name when changed', () => {
      render(<EditCueDialog {...defaultProps} />);
      const cueNameInput = screen.getByLabelText('Cue Name *') as HTMLInputElement;
      fireEvent.change(cueNameInput, { target: { value: 'Updated Cue' } });
      expect(cueNameInput.value).toBe('Updated Cue');
    });

    it('updates selected look when changed', () => {
      render(<EditCueDialog {...defaultProps} />);
      const lookSelect = screen.getByLabelText('Look *') as HTMLSelectElement;
      fireEvent.change(lookSelect, { target: { value: 'look-3' } });
      expect(lookSelect.value).toBe('look-3');
    });

    it('shows warning when look is changed', () => {
      render(<EditCueDialog {...defaultProps} />);
      const lookSelect = screen.getByLabelText('Look *') as HTMLSelectElement;

      // Change look
      fireEvent.change(lookSelect, { target: { value: 'look-3' } });

      expect(screen.getByText(/Warning: Changing look will update this cue/)).toBeInTheDocument();
    });

    it('does not show warning when look unchanged', () => {
      render(<EditCueDialog {...defaultProps} />);
      expect(screen.queryByText(/Warning: Changing look will update this cue/)).not.toBeInTheDocument();
    });

    it('shows/hides advanced timing section', () => {
      render(<EditCueDialog {...defaultProps} />);
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

    it('updates fade times in advanced section', () => {
      render(<EditCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const fadeInInput = screen.getByLabelText('Fade In Time (seconds)');
      const fadeOutInput = screen.getByLabelText('Fade Out Time (seconds)');

      fireEvent.change(fadeInInput, { target: { value: '5' } });
      fireEvent.change(fadeOutInput, { target: { value: '2.5' } });

      expect((fadeInInput as HTMLInputElement).value).toBe('5');
      expect((fadeOutInput as HTMLInputElement).value).toBe('2.5');
    });
  });

  describe('Validation', () => {
    it('shows error for invalid cue number', async () => {
      render(<EditCueDialog {...defaultProps} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *');
      fireEvent.change(cueNumberInput, { target: { value: '-5' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Cue number must be a valid positive number')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows error for empty cue name', async () => {
      render(<EditCueDialog {...defaultProps} />);
      const cueNameInput = screen.getByLabelText('Cue Name *');
      fireEvent.change(cueNameInput, { target: { value: '   ' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Cue name is required')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows error when no look is selected', async () => {
      render(<EditCueDialog {...defaultProps} />);
      const lookSelect = screen.getByLabelText('Look *');
      fireEvent.change(lookSelect, { target: { value: '' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a look')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows error for negative fade in time', async () => {
      render(<EditCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const fadeInInput = screen.getByLabelText('Fade In Time (seconds)');
      fireEvent.change(fadeInInput, { target: { value: '-1' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Fade in time must be a valid positive number')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows error for negative fade out time', async () => {
      render(<EditCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const fadeOutInput = screen.getByLabelText('Fade Out Time (seconds)');
      fireEvent.change(fadeOutInput, { target: { value: '-2' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Fade out time must be a valid positive number')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows error for negative follow time', async () => {
      render(<EditCueDialog {...defaultProps} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const followTimeInput = screen.getByLabelText('Follow Time (seconds, optional)');
      fireEvent.change(followTimeInput, { target: { value: '-5' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Follow time must be positive')).toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Submit Actions', () => {
    it('calls onUpdate with correct params when clicking "Save"', () => {
      render(<EditCueDialog {...defaultProps} />);

      // Modify some fields
      const cueNumberInput = screen.getByLabelText('Cue Number *');
      fireEvent.change(cueNumberInput, { target: { value: '6.5' } });

      const cueNameInput = screen.getByLabelText('Cue Name *');
      fireEvent.change(cueNameInput, { target: { value: 'Updated Test Cue' } });

      // Submit
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        cueId: 'cue-1',
        cueNumber: 6.5,
        name: 'Updated Test Cue',
        lookId: 'look-2',
        fadeInTime: 3,
        fadeOutTime: 3,
        followTime: null,
        action: 'stay',
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onUpdate with action "edit-look" when clicking "Save & Edit Look"', () => {
      render(<EditCueDialog {...defaultProps} />);

      const saveEditButton = screen.getByText('Save & Edit Look');
      fireEvent.click(saveEditButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'edit-look',
        })
      );

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('includes updated fade times when advanced timing is used', () => {
      render(<EditCueDialog {...defaultProps} />);

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
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fadeInTime: 5,
          fadeOutTime: 2.5,
          followTime: 10,
        })
      );
    });

    it('includes updated look when changed', () => {
      render(<EditCueDialog {...defaultProps} />);

      const lookSelect = screen.getByLabelText('Look *');
      fireEvent.change(lookSelect, { target: { value: 'look-3' } });

      // Submit
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          lookId: 'look-3',
        })
      );
    });

    it('trims whitespace from cue name', () => {
      render(<EditCueDialog {...defaultProps} />);

      const cueNameInput = screen.getByLabelText('Cue Name *');
      fireEvent.change(cueNameInput, { target: { value: '  Padded Name  ' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Padded Name',
        })
      );
    });
  });

  describe('Dialog Close', () => {
    it('calls onClose when clicking Cancel button', () => {
      render(<EditCueDialog {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
      render(<EditCueDialog {...defaultProps} />);
      const backdrop = screen.getByTestId('edit-cue-dialog-backdrop');
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when closed and reopened with different cue', () => {
      const { rerender } = render(<EditCueDialog {...defaultProps} />);

      // Modify fields
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      fireEvent.change(cueNumberInput, { target: { value: '10' } });

      // Close
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Reopen with different cue
      const differentCue = {
        ...mockCue,
        id: 'cue-2',
        cueNumber: 7,
        name: 'Different Cue',
      };
      rerender(<EditCueDialog {...defaultProps} cue={differentCue} />);

      // Should have new cue's values
      expect(cueNumberInput.value).toBe('7');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty look list gracefully', () => {
      render(<EditCueDialog {...defaultProps} looks={[]} />);
      const lookSelect = screen.getByLabelText('Look *');
      expect(lookSelect).toBeInTheDocument();
      // Should only have the "Select a look..." option
      expect(lookSelect.children.length).toBe(1);
    });

    it('handles cue with decimal number correctly', () => {
      const decimalCue = {
        ...mockCue,
        cueNumber: 5.5,
      };

      render(<EditCueDialog {...defaultProps} cue={decimalCue} />);
      const cueNumberInput = screen.getByLabelText('Cue Number *') as HTMLInputElement;
      expect(cueNumberInput.value).toBe('5.5');
    });

    it('clears follow time when set to empty string', () => {
      const cueWithFollow = {
        ...mockCue,
        followTime: 5,
      };

      render(<EditCueDialog {...defaultProps} cue={cueWithFollow} />);

      // Show advanced timing
      fireEvent.click(screen.getByText('Advanced Timing'));

      const followTimeInput = screen.getByLabelText('Follow Time (seconds, optional)');
      fireEvent.change(followTimeInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          followTime: null,
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
      render(<EditCueDialog {...defaultProps} />);

      const saveEditButton = screen.getByText('Save & Edit Look');
      const buttonContainer = saveEditButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows primary action first on mobile', () => {
      render(<EditCueDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button').filter(btn =>
        ['Save & Edit Look', 'Save', 'Cancel'].includes(btn.textContent || '')
      );
      const buttonLabels = buttons.map(b => b.textContent);

      // Primary action (Save & Edit Look) should be first on mobile
      expect(buttonLabels[0]).toBe('Save & Edit Look');
      expect(buttonLabels[1]).toBe('Save');
      expect(buttonLabels[2]).toBe('Cancel');
    });

    it('has proper touch targets on mobile', () => {
      render(<EditCueDialog {...defaultProps} />);

      const saveEditButton = screen.getByText('Save & Edit Look');
      const saveButton = screen.getByText('Save');
      const cancelButton = screen.getByText('Cancel');

      expect(saveEditButton).toHaveClass('min-h-[44px]');
      expect(saveButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
    });

    it('has touch-manipulation class on mobile buttons', () => {
      render(<EditCueDialog {...defaultProps} />);

      const saveEditButton = screen.getByText('Save & Edit Look');
      const saveButton = screen.getByText('Save');
      const cancelButton = screen.getByText('Cancel');

      expect(saveEditButton).toHaveClass('touch-manipulation');
      expect(saveButton).toHaveClass('touch-manipulation');
      expect(cancelButton).toHaveClass('touch-manipulation');
    });
  });
});
