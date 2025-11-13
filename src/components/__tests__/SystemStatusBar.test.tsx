import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import SystemStatusBar from '../SystemStatusBar';
import { GET_SYSTEM_INFO, SYSTEM_INFO_UPDATED } from '@/graphql/settings';

const mockSystemInfoEnabled = {
  artnetEnabled: true,
  artnetBroadcastAddress: '192.168.1.255',
};

const mockSystemInfoDisabled = {
  artnetEnabled: false,
  artnetBroadcastAddress: '10.0.0.255',
};

const createMocks = (systemInfo = mockSystemInfoEnabled) => [
  {
    request: {
      query: GET_SYSTEM_INFO,
    },
    result: {
      data: {
        systemInfo,
      },
    },
  },
  {
    request: {
      query: SYSTEM_INFO_UPDATED,
    },
    result: {
      data: {},
    },
  },
];

describe('SystemStatusBar', () => {
  describe('Loading state', () => {
    it('shows loading message while fetching data', () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      expect(screen.getByText('Loading system status...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when query fails', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_SYSTEM_INFO,
          },
          error: new Error('Network error'),
        },
        {
          request: {
            query: SYSTEM_INFO_UPDATED,
          },
          result: {
            data: {},
          },
        },
      ];

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      await screen.findByText('Failed to load system status');
      expect(screen.getByText('Failed to load system status')).toBeInTheDocument();
    });
  });

  describe('System info display', () => {
    it('displays Art-Net status when enabled', async () => {
      const mocks = createMocks(mockSystemInfoEnabled);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      await screen.findByText('Art-Net:');
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.255')).toBeInTheDocument();
    });

    it('displays Art-Net status when disabled', async () => {
      const mocks = createMocks(mockSystemInfoDisabled);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      await screen.findByText('Art-Net:');
      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.255')).toBeInTheDocument();
    });

    it('displays broadcast address label', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      await screen.findByText('Broadcast Address:');
      expect(screen.getByText('Broadcast Address:')).toBeInTheDocument();
    });
  });

  describe('Subscription updates', () => {
    it('renders without errors when subscription is active', async () => {
      const mocks = [
        {
          request: {
            query: GET_SYSTEM_INFO,
          },
          result: {
            data: {
              systemInfo: mockSystemInfoEnabled,
            },
          },
        },
        {
          request: {
            query: SYSTEM_INFO_UPDATED,
          },
          result: {
            data: {
              systemInfoUpdated: mockSystemInfoDisabled,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      // Should eventually show the subscription data
      await screen.findByText('Art-Net:');
      expect(screen.getByText(/Enabled|Disabled/)).toBeInTheDocument();
    });
  });

  describe('Null system info', () => {
    it('returns null when systemInfo is undefined', async () => {
      const mocks = [
        {
          request: {
            query: GET_SYSTEM_INFO,
          },
          result: {
            data: {
              systemInfo: null,
            },
          },
        },
        {
          request: {
            query: SYSTEM_INFO_UPDATED,
          },
          result: {
            data: {},
          },
        },
      ];

      const { container } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <SystemStatusBar />
        </MockedProvider>
      );

      // Wait a bit for the component to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When systemInfo is null, component should render nothing
      expect(container.firstChild).toBeNull();
    });
  });
});
