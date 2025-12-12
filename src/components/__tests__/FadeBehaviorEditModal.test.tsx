import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FadeBehaviorEditModal from '../FadeBehaviorEditModal';
import { FadeBehavior, ChannelType, InstanceChannel } from '@/types';

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

      const closeButton = screen.getByRole('button', { name: /close fade behavior modal/i });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
      const onClose = jest.fn();
      const { container } = render(<FadeBehaviorEditModal {...defaultProps} onClose={onClose} />);

      // Click on the backdrop (the outer div with bg-black)
      const backdrop = container.querySelector('.bg-black');
      if (backdrop) {
        // Simulate clicking directly on the backdrop, not a child element
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
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
});
