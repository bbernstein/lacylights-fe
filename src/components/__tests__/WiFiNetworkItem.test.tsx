import { render, screen, fireEvent } from '@testing-library/react';
import { WiFiNetworkItem } from '../WiFiNetworkItem';
import { WiFiNetwork, WiFiSecurityType } from '@/types';

describe('WiFiNetworkItem', () => {
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
    onDisconnect: jest.fn(),
    onForget: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders network SSID', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('Test Network')).toBeInTheDocument();
    });

    it('renders frequency', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('2.4 GHz')).toBeInTheDocument();
    });

    it('renders signal strength indicator', () => {
      const { container } = render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const signalIndicator = container.querySelector('[title="Signal strength: 75%"]');
      expect(signalIndicator).toBeInTheDocument();
    });

    it('renders security badge', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('WPA2')).toBeInTheDocument();
    });
  });

  describe('connected network state', () => {
    it('shows "Connected" badge when network is in use', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true };
      render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows Disconnect button when connected', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true };
      render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('Disconnect')).toBeInTheDocument();
      expect(screen.queryByText('Connect')).not.toBeInTheDocument();
    });

    it('does not show saved bookmark icon when connected', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true, saved: true };
      const { container } = render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const bookmarkIcon = container.querySelector('[aria-label="Saved network"]');
      expect(bookmarkIcon).not.toBeInTheDocument();
    });
  });

  describe('saved network state', () => {
    it('shows bookmark icon for saved networks', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      const { container } = render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const bookmarkIcon = container.querySelector('[aria-label="Saved network"]');
      expect(bookmarkIcon).toBeInTheDocument();
    });

    it('shows Forget button for saved networks', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('Forget')).toBeInTheDocument();
    });

    it('does not show Forget button for non-saved networks', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.queryByText('Forget')).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onConnect when Connect button is clicked', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      fireEvent.click(screen.getByText('Connect'));

      expect(mockHandlers.onConnect).toHaveBeenCalledTimes(1);
    });

    it('calls onDisconnect when Disconnect button is clicked', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true };
      render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      fireEvent.click(screen.getByText('Disconnect'));

      expect(mockHandlers.onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('calls onForget when Forget button is clicked', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      fireEvent.click(screen.getByText('Forget'));

      expect(mockHandlers.onForget).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading states', () => {
    it('shows "Connecting..." when connecting', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={true} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('shows "Disconnecting..." when disconnecting', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true };
      render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={true} forgetting={false} />);

      expect(screen.getByText('Disconnecting...')).toBeInTheDocument();
    });

    it('shows "Forgetting..." when forgetting', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={true} />);

      expect(screen.getByText('Forgetting...')).toBeInTheDocument();
    });

    it('disables Connect button when connecting', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={true} disconnecting={false} forgetting={false} />);

      const button = screen.getByText('Connecting...');
      expect(button).toBeDisabled();
    });

    it('disables Disconnect button when disconnecting', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true };
      render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={true} forgetting={false} />);

      const button = screen.getByText('Disconnecting...');
      expect(button).toBeDisabled();
    });

    it('disables Forget button when forgetting', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={true} />);

      const button = screen.getByText('Forgetting...');
      expect(button).toBeDisabled();
    });

    it('disables all buttons when any operation is in progress', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={true} disconnecting={false} forgetting={false} />);

      const connectButton = screen.getByText('Connecting...');
      const forgetButton = screen.getByText('Forget');

      expect(connectButton).toBeDisabled();
      expect(forgetButton).toBeDisabled();
    });
  });

  describe('styling', () => {
    it('applies hover styling classes', () => {
      const { container } = render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const networkItem = container.querySelector('.hover\\:bg-gray-50');
      expect(networkItem).toBeInTheDocument();
    });

    it('applies correct button styling for Connect button', () => {
      render(<WiFiNetworkItem network={mockNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const button = screen.getByText('Connect');
      expect(button).toHaveClass('text-blue-600');
    });

    it('applies correct button styling for Disconnect button', () => {
      const connectedNetwork = { ...mockNetwork, inUse: true };
      render(<WiFiNetworkItem network={connectedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const button = screen.getByText('Disconnect');
      expect(button).toHaveClass('text-red-600');
    });

    it('applies correct button styling for Forget button', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const button = screen.getByText('Forget');
      expect(button).toHaveClass('text-gray-600');
    });
  });

  describe('different security types', () => {
    it('renders open network correctly', () => {
      const openNetwork = { ...mockNetwork, security: WiFiSecurityType.OPEN };
      render(<WiFiNetworkItem network={openNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('renders WPA3 network correctly', () => {
      const wpa3Network = { ...mockNetwork, security: WiFiSecurityType.WPA3_PSK };
      render(<WiFiNetworkItem network={wpa3Network} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('WPA3')).toBeInTheDocument();
    });
  });

  describe('different signal strengths', () => {
    it('renders weak signal correctly', () => {
      const weakNetwork = { ...mockNetwork, signalStrength: 15 };
      const { container } = render(<WiFiNetworkItem network={weakNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const signalIndicator = container.querySelector('[title="Signal strength: 15%"]');
      expect(signalIndicator).toBeInTheDocument();
    });

    it('renders excellent signal correctly', () => {
      const strongNetwork = { ...mockNetwork, signalStrength: 95 };
      const { container } = render(<WiFiNetworkItem network={strongNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const signalIndicator = container.querySelector('[title="Signal strength: 95%"]');
      expect(signalIndicator).toBeInTheDocument();
    });
  });

  describe('different frequencies', () => {
    it('renders 5 GHz frequency correctly', () => {
      const fiveGhzNetwork = { ...mockNetwork, frequency: '5 GHz' };
      render(<WiFiNetworkItem network={fiveGhzNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      expect(screen.getByText('5 GHz')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper title for Forget button', () => {
      const savedNetwork = { ...mockNetwork, saved: true };
      render(<WiFiNetworkItem network={savedNetwork} {...mockHandlers} connecting={false} disconnecting={false} forgetting={false} />);

      const forgetButton = screen.getByTitle('Forget this network');
      expect(forgetButton).toBeInTheDocument();
    });
  });
});
