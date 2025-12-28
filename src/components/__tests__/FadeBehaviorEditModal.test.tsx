import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FadeBehaviorEditModal from '../FadeBehaviorEditModal';
import { FadeBehavior, ChannelType, InstanceChannel } from '@/types';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockChannel: InstanceChannel = {
  id: 'channel-1',
  offset: 0,
  name: 'Dimmer',
  type: ChannelType.INTENSITY,
  minValue: 0,
  maxValue: 255,
  defaultValue: 0,
  fadeBehavior: FadeBehavior.FADE,
  isDiscrete: false
};

const mockDiscreteChannel: InstanceChannel = {
  ...mockChannel,
  id: 'channel-2',
  name: 'Gobo',
  type: ChannelType.GOBO,
  fadeBehavior: FadeBehavior.SNAP,
  isDiscrete: true
};

describe('FadeBehaviorEditModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    channel: mockChannel
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      expect(screen.getByText('Edit Fade Behavior')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<FadeBehaviorEditModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Edit Fade Behavior')).not.toBeInTheDocument();
    });

    it('does not render when channel is null', () => {
      render(<FadeBehaviorEditModal {...defaultProps} channel={null} />);
      expect(screen.queryByText('Edit Fade Behavior')).not.toBeInTheDocument();
    });
  });

  describe('header content', () => {
    it('displays the channel name and type', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      expect(screen.getByText(/Dimmer \(INTENSITY\)/)).toBeInTheDocument();
    });
  });

  describe('behavior options', () => {
    it('shows all three fade behavior options', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      expect(screen.getByText('Fade')).toBeInTheDocument();
      expect(screen.getByText('Snap')).toBeInTheDocument();
      expect(screen.getByText('Snap at End')).toBeInTheDocument();
    });

    it('pre-selects the current fade behavior', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      const fadeRadio = screen.getByDisplayValue(FadeBehavior.FADE);
      expect(fadeRadio).toBeChecked();
    });

    it('pre-selects SNAP when channel has SNAP behavior', () => {
      render(
        <FadeBehaviorEditModal
          {...defaultProps}
          channel={mockDiscreteChannel}
        />
      );
      const snapRadio = screen.getByDisplayValue(FadeBehavior.SNAP);
      expect(snapRadio).toBeChecked();
    });

    it('allows selecting a different behavior', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      const snapRadio = screen.getByDisplayValue(FadeBehavior.SNAP);
      fireEvent.click(snapRadio);
      expect(snapRadio).toBeChecked();
    });
  });

  describe('discrete channel warning', () => {
    it('shows warning for discrete channels', () => {
      render(
        <FadeBehaviorEditModal
          {...defaultProps}
          channel={mockDiscreteChannel}
        />
      );
      // Look for the warning box specifically
      expect(screen.getByText(/Discrete Channel:/i)).toBeInTheDocument();
    });

    it('does not show warning for non-discrete channels', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      expect(screen.queryByText(/Discrete Channel:/i)).not.toBeInTheDocument();
    });
  });

  describe('save functionality', () => {
    it('calls onSave with channel id and selected behavior', () => {
      const onSave = jest.fn();
      render(<FadeBehaviorEditModal {...defaultProps} onSave={onSave} />);

      // Select SNAP
      const snapRadio = screen.getByDisplayValue(FadeBehavior.SNAP);
      fireEvent.click(snapRadio);

      // Click save
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(onSave).toHaveBeenCalledWith('channel-1', FadeBehavior.SNAP);
    });

    it('disables save button when no change is made', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('enables save button when behavior is changed', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);

      // Select SNAP (different from current FADE)
      const snapRadio = screen.getByDisplayValue(FadeBehavior.SNAP);
      fireEvent.click(snapRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('shows saving state when isSaving is true', () => {
      render(<FadeBehaviorEditModal {...defaultProps} isSaving />);
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });

    it('disables buttons when isSaving is true', () => {
      render(<FadeBehaviorEditModal {...defaultProps} isSaving />);
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('close functionality', () => {
    it('calls onClose when cancel is clicked', () => {
      const onClose = jest.fn();
      render(<FadeBehaviorEditModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', () => {
      const onClose = jest.fn();
      render(<FadeBehaviorEditModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('fade-behavior-edit-modal-close-button');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
      const onClose = jest.fn();
      render(<FadeBehaviorEditModal {...defaultProps} onClose={onClose} />);

      // Click on the backdrop using BottomSheet's testId
      const backdrop = screen.getByTestId('fade-behavior-edit-modal-backdrop');
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      render(<FadeBehaviorEditModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('does not close when clicking modal content', () => {
    it('does not call onClose when clicking modal content', () => {
      const onClose = jest.fn();
      render(<FadeBehaviorEditModal {...defaultProps} onClose={onClose} />);

      // Click on the modal content
      fireEvent.click(screen.getByText('Fade'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      const buttonContainer = saveButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows save button first on mobile', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const buttonLabels = buttons.map(b => b.textContent);
      // Save should come before Cancel on mobile
      const saveIndex = buttonLabels.indexOf('Save');
      const cancelIndex = buttonLabels.indexOf('Cancel');
      expect(saveIndex).toBeLessThan(cancelIndex);
    });

    it('has larger touch targets on mobile', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);

      // Select a different behavior to enable the save button
      const snapRadio = screen.getByDisplayValue(FadeBehavior.SNAP);
      fireEvent.click(snapRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toHaveClass('min-h-[44px]');
    });

    it('renders as BottomSheet dialog', () => {
      render(<FadeBehaviorEditModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
