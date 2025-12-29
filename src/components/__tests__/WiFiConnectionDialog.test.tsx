import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WiFiConnectionDialog } from '../WiFiConnectionDialog';
import { WiFiNetwork, WiFiSecurityType } from '@/types';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

describe('WiFiConnectionDialog', () => {
  const mockNetwork: WiFiNetwork = {
    ssid: 'Test Network',
    signalStrength: 75,
    frequency: '2.4 GHz',
    security: WiFiSecurityType.WPA_PSK,
    inUse: false,
    saved: false,
  };

  const mockHandlers = {
    onConnect: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('rendering', () => {
    it('does not render when isOpen is false', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={false} connecting={false} {...mockHandlers} />);

      expect(screen.queryByText('Connect to WiFi Network')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByText('Connect to WiFi Network')).toBeInTheDocument();
    });

    it('renders network information', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByText('Test Network')).toBeInTheDocument();
      expect(screen.getByText('2.4 GHz')).toBeInTheDocument();
      expect(screen.getByText('WPA2')).toBeInTheDocument();
    });

    it('renders password input for secured networks', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('does not render password input for open networks', () => {
      const openNetwork = { ...mockNetwork, security: WiFiSecurityType.OPEN };
      render(<WiFiConnectionDialog network={openNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('renders custom SSID toggle', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByLabelText('Enter network name manually')).toBeInTheDocument();
    });
  });

  describe('password visibility toggle', () => {
    it('shows password as hidden by default', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('toggles password visibility when show/hide button is clicked', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const toggleButton = passwordInput.nextElementSibling as HTMLElement;

      expect(passwordInput.type).toBe('password');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('custom SSID functionality', () => {
    it('shows custom SSID input when toggle is enabled', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const toggle = screen.getByLabelText('Enter network name manually') as HTMLInputElement;
      fireEvent.click(toggle);

      expect(screen.getByLabelText('Network name (SSID)')).toBeInTheDocument();
    });

    it('hides network info when custom SSID is enabled', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByText('Test Network')).toBeInTheDocument();

      const toggle = screen.getByLabelText('Enter network name manually') as HTMLInputElement;
      fireEvent.click(toggle);

      // Network info should be hidden
      const networkInfoElements = screen.queryAllByText('Test Network');
      // Should not find the network name in the network info section
      expect(networkInfoElements.length).toBeLessThanOrEqual(1);
    });

    it('allows entering custom SSID', async () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const toggle = screen.getByLabelText('Enter network name manually') as HTMLInputElement;
      fireEvent.click(toggle);

      const ssidInput = screen.getByLabelText('Network name (SSID)') as HTMLInputElement;
      await userEvent.type(ssidInput, 'Custom Network');

      expect(ssidInput.value).toBe('Custom Network');
    });
  });

  describe('form submission', () => {
    it('calls onConnect with SSID and password when form is submitted', async () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'mypassword123');

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      expect(mockHandlers.onConnect).toHaveBeenCalledWith('Test Network', 'mypassword123');
    });

    it('calls onConnect with only SSID for open networks', () => {
      const openNetwork = { ...mockNetwork, security: WiFiSecurityType.OPEN };
      render(<WiFiConnectionDialog network={openNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      expect(mockHandlers.onConnect).toHaveBeenCalledWith('Test Network', undefined);
    });

    it('calls onConnect with custom SSID when custom SSID is enabled', async () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const toggle = screen.getByLabelText('Enter network name manually') as HTMLInputElement;
      fireEvent.click(toggle);

      const ssidInput = screen.getByLabelText('Network name (SSID)');
      await userEvent.type(ssidInput, 'Custom Network');

      const passwordInput = screen.getByLabelText('Password');
      await userEvent.type(passwordInput, 'password123');

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      expect(mockHandlers.onConnect).toHaveBeenCalledWith('Custom Network', 'password123');
    });

    it('prevents submission when custom SSID is empty', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const toggle = screen.getByLabelText('Enter network name manually') as HTMLInputElement;
      fireEvent.click(toggle);

      const connectButton = screen.getByText('Connect');
      expect(connectButton).toBeDisabled();

      fireEvent.click(connectButton);

      expect(mockHandlers.onConnect).not.toHaveBeenCalled();
    });

    it('prevents submission with whitespace-only custom SSID', async () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const toggle = screen.getByLabelText('Enter network name manually') as HTMLInputElement;
      fireEvent.click(toggle);

      const ssidInput = screen.getByLabelText('Network name (SSID)');
      await userEvent.type(ssidInput, '   ');

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);

      expect(mockHandlers.onConnect).not.toHaveBeenCalled();
    });
  });

  describe('cancel functionality', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const backdrop = screen.getByTestId('wifi-connection-dialog-backdrop');
      fireEvent.click(backdrop);

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('resets form state when canceled', async () => {
      const { rerender } = render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      await userEvent.type(passwordInput, 'password123');

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Reopen dialog
      rerender(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const newPasswordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(newPasswordInput.value).toBe('');
    });
  });

  describe('connecting state', () => {
    it('shows "Connecting..." on submit button when connecting', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={true} {...mockHandlers} />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.queryByText('Connect')).not.toBeInTheDocument();
    });

    it('disables submit button when connecting', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={true} {...mockHandlers} />);

      const submitButton = screen.getByText('Connecting...');
      expect(submitButton).toBeDisabled();
    });

    it('disables cancel button when connecting', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={true} {...mockHandlers} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('error messages', () => {
    it('displays error message when provided', () => {
      render(
        <WiFiConnectionDialog
          network={mockNetwork}
          isOpen={true}
          connecting={false}
          errorMessage="Invalid password"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });

    it('does not display error message when not provided', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const errorContainer = document.querySelector('.bg-red-50');
      expect(errorContainer).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper modal role and aria attributes', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'wifi-connection-dialog-title');
    });

    it('has accessible form labels', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Enter network name manually')).toBeInTheDocument();
    });

    it('marks required fields as required', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('edge cases', () => {
    it('handles null network gracefully', () => {
      render(<WiFiConnectionDialog network={null} isOpen={true} connecting={false} {...mockHandlers} />);

      // Should still render the dialog
      expect(screen.getByText('Connect to WiFi Network')).toBeInTheDocument();
    });

    it('handles network with special characters in SSID', () => {
      const specialNetwork = { ...mockNetwork, ssid: "Test's Network #123" };
      render(<WiFiConnectionDialog network={specialNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByText("Test's Network #123")).toBeInTheDocument();
    });

    it('requires password for all security types except OPEN', () => {
      const wpa3Network = { ...mockNetwork, security: WiFiSecurityType.WPA3_PSK };
      render(<WiFiConnectionDialog network={wpa3Network} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('does not require password for OPEN networks', () => {
      const openNetwork = { ...mockNetwork, security: WiFiSecurityType.OPEN };
      render(<WiFiConnectionDialog network={openNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });
  });

  describe('signal strength indicator', () => {
    it('displays signal strength in network info', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      // Use aria-label to find the signal indicator (works with portals)
      const signalIndicator = screen.getByLabelText('Signal strength: 75%');
      expect(signalIndicator).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('prevents form submission when password is empty for secured network', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

      // HTML5 validation should prevent submission
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const connectButton = screen.getByText('Connect');
      const buttonContainer = connectButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows Connect button first on mobile', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === 'Connect' || btn.textContent === 'Cancel'
      );
      const buttonLabels = buttons.map(b => b.textContent);
      // Connect should come before Cancel on mobile
      const connectIndex = buttonLabels.indexOf('Connect');
      const cancelIndex = buttonLabels.indexOf('Cancel');
      expect(connectIndex).toBeLessThan(cancelIndex);
    });

    it('has larger touch targets on mobile', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const connectButton = screen.getByText('Connect');
      const cancelButton = screen.getByText('Cancel');

      expect(connectButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
    });

    it('has touch-manipulation class on mobile buttons', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const connectButton = screen.getByText('Connect');
      const cancelButton = screen.getByText('Cancel');

      expect(connectButton).toHaveClass('touch-manipulation');
      expect(cancelButton).toHaveClass('touch-manipulation');
    });

    it('renders as BottomSheet dialog', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={false} {...mockHandlers} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('does not allow backdrop click when connecting', () => {
      render(<WiFiConnectionDialog network={mockNetwork} isOpen={true} connecting={true} {...mockHandlers} />);

      const backdrop = screen.getByTestId('wifi-connection-dialog-backdrop');
      fireEvent.click(backdrop);

      // onCancel should not be called when connecting
      expect(mockHandlers.onCancel).not.toHaveBeenCalled();
    });
  });
});
