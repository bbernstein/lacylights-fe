import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import WiFiSettings from '../WiFiSettings';
import {
  WIFI_NETWORKS,
  WIFI_STATUS,
  WIFI_STATUS_UPDATED,
} from '@/graphql/wifi';

// Mock WiFiNetworkItem component
jest.mock('@/components/WiFiNetworkItem', () => ({
  WiFiNetworkItem: ({ network, onConnect }: { network: { ssid: string }; onConnect: () => void }) => (
    <div data-testid={`network-${network.ssid}`}>
      <span>{network.ssid}</span>
      <button onClick={onConnect}>Connect</button>
    </div>
  ),
}));

// Mock WiFiConnectionDialog component
jest.mock('@/components/WiFiConnectionDialog', () => ({
  WiFiConnectionDialog: ({ isOpen, onClose, onConnect }: { isOpen: boolean; onClose: () => void; onConnect: (password: string) => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="connection-dialog">
        <button onClick={() => onConnect('testpassword')}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

const mockNetworksDisconnected = [
  {
    ssid: 'SavedNetwork',
    signalStrength: 70,
    frequency: '2.4 GHz',
    security: 'WPA2',
    inUse: false,
    saved: true,
  },
  {
    ssid: 'StrongNetwork',
    signalStrength: 90,
    frequency: '5 GHz',
    security: 'WPA3',
    inUse: false,
    saved: false,
  },
  {
    ssid: 'WeakNetwork',
    signalStrength: 50,
    frequency: '2.4 GHz',
    security: 'WPA2',
    inUse: false,
    saved: false,
  },
];

const mockNetworksConnected = [
  {
    ssid: 'ConnectedNetwork',
    signalStrength: 80,
    frequency: '5 GHz',
    security: 'WPA2',
    inUse: true,
    saved: true,
  },
];

const mockStatusConnected = {
  available: true,
  enabled: true,
  connected: true,
  ssid: 'ConnectedNetwork',
  signalStrength: 80,
  ipAddress: '192.168.1.100',
  frequency: '5 GHz',
};

const mockStatusDisconnected = {
  available: true,
  enabled: true,
  connected: false,
};

const createMocks = (status = mockStatusDisconnected, networks = mockNetworksDisconnected) => [
  {
    request: {
      query: WIFI_NETWORKS,
      variables: { rescan: false },
    },
    result: {
      data: {
        wifiNetworks: networks,
      },
    },
  },
  {
    request: {
      query: WIFI_STATUS,
    },
    result: {
      data: {
        wifiStatus: status,
      },
    },
  },
  {
    request: {
      query: WIFI_STATUS_UPDATED,
    },
    result: {
      data: {},
    },
  },
];

describe('WiFiSettings', () => {
  describe('Network sorting', () => {
    it('sorts saved networks first, then by signal strength', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <WiFiSettings />
        </MockedProvider>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Network Connection')).toBeInTheDocument();
      });

      // Click "Connect to a network" button to show the list
      const connectButton = screen.getByText('Connect to a network');
      fireEvent.click(connectButton);

      // Wait for networks to appear
      await waitFor(() => {
        expect(screen.getByTestId('network-SavedNetwork')).toBeInTheDocument();
      });

      // Check that saved network appears first despite weaker signal
      const networkElements = screen.getAllByTestId(/^network-/);
      expect(networkElements[0]).toHaveAttribute('data-testid', 'network-SavedNetwork');
    });
  });

  describe('Network list visibility', () => {
    it('shows "Connect to a network" button when disconnected and list hidden', async () => {
      const mocks = createMocks(mockStatusDisconnected, mockNetworksDisconnected);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <WiFiSettings />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Connect to a network')).toBeInTheDocument();
      });
    });

    it('shows compact connected view when connected and list hidden', async () => {
      const mocks = createMocks(mockStatusConnected, mockNetworksConnected);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <WiFiSettings />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Connected to ConnectedNetwork')).toBeInTheDocument();
      });

      // Should show IP address
      expect(screen.getByText(/IP: 192.168.1.100/)).toBeInTheDocument();
    });

    it('hides network list when Hide button is clicked', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <WiFiSettings />
        </MockedProvider>
      );

      // Click "Connect to a network" to show list
      await waitFor(() => {
        expect(screen.getByText('Connect to a network')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Connect to a network'));

      // Wait for Hide button to appear
      await waitFor(() => {
        expect(screen.getByText('Hide')).toBeInTheDocument();
      });

      // Click Hide button
      fireEvent.click(screen.getByText('Hide'));

      // Network list should be hidden, "Connect to a network" button should appear
      await waitFor(() => {
        expect(screen.queryByText('Hide')).not.toBeInTheDocument();
      });
    });
  });

  describe('Network count display', () => {
    it('displays network count in toolbar', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <WiFiSettings />
        </MockedProvider>
      );

      // Show network list
      await waitFor(() => {
        expect(screen.getByText('Connect to a network')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Connect to a network'));

      // Check for network count
      await waitFor(() => {
        expect(screen.getByText('3 networks found')).toBeInTheDocument();
      });
    });

    it('uses singular form for single network', async () => {
      const mocks = createMocks(mockStatusDisconnected, [mockNetworksDisconnected[0]]);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <WiFiSettings />
        </MockedProvider>
      );

      // Show network list
      await waitFor(() => {
        expect(screen.getByText('Connect to a network')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Connect to a network'));

      // Check for singular network count
      await waitFor(() => {
        expect(screen.getByText('1 network found')).toBeInTheDocument();
      });
    });
  });
});
