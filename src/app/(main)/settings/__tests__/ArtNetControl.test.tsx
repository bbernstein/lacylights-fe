import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import ArtNetControl from '../ArtNetControl';
import { GET_SYSTEM_INFO, SET_ARTNET_ENABLED, SYSTEM_INFO_UPDATED } from '@/graphql/settings';

const mockSystemInfoEnabled = {
  artnetBroadcastAddress: '192.168.1.255',
  artnetEnabled: true,
  fadeUpdateRateHz: 60,
};

const mockSystemInfoDisabled = {
  artnetBroadcastAddress: '',
  artnetEnabled: false,
  fadeUpdateRateHz: 60,
};

const mockArtNetStatusDisabled = {
  enabled: false,
  broadcastAddress: '',
};

const createMocks = (enabled: boolean, mutationResult?: typeof mockArtNetStatusDisabled): MockedResponse[] => [
  {
    request: {
      query: GET_SYSTEM_INFO,
    },
    result: {
      data: {
        systemInfo: enabled ? mockSystemInfoEnabled : mockSystemInfoDisabled,
      },
    },
  },
  {
    request: {
      query: SYSTEM_INFO_UPDATED,
    },
    result: {
      data: {
        systemInfoUpdated: enabled ? mockSystemInfoEnabled : mockSystemInfoDisabled,
      },
    },
  },
  ...(mutationResult
    ? [
        {
          request: {
            query: SET_ARTNET_ENABLED,
            variables: {
              enabled: !enabled,
              fadeTime: enabled ? 3 : null,
            },
          },
          result: {
            data: {
              setArtNetEnabled: mutationResult,
            },
          },
        },
      ]
    : []),
];

const renderComponent = (mocks: MockedResponse[]) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ArtNetControl />
    </MockedProvider>
  );
};

describe('ArtNetControl', () => {
  it('renders enabled state correctly', async () => {
    renderComponent(createMocks(true));

    await waitFor(() => {
      expect(screen.getByText('ArtNet Output')).toBeInTheDocument();
    });

    expect(screen.getByText('ArtNet is transmitting DMX data to fixtures')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders disabled state with warning', async () => {
    renderComponent(createMocks(false));

    await waitFor(() => {
      expect(screen.getByText('ArtNet Output')).toBeInTheDocument();
    });

    expect(screen.getByText('ArtNet is disabled - other controllers can take over')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/Blackout Mode Active/)).toBeInTheDocument();
  });

  it('shows fade options when enabled and clicked', async () => {
    renderComponent(createMocks(true));

    await waitFor(() => {
      expect(screen.getByText('Show fade options')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show fade options'));

    expect(screen.getByText('Hide options')).toBeInTheDocument();
    expect(screen.getByText('Fade time when disabling:')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
  });

  it('does not show fade options when disabled', async () => {
    renderComponent(createMocks(false));

    await waitFor(() => {
      expect(screen.getByText('ArtNet Output')).toBeInTheDocument();
    });

    expect(screen.queryByText('Show fade options')).not.toBeInTheDocument();
  });

  it('toggle button has correct aria-label', async () => {
    renderComponent(createMocks(true));

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Toggle ArtNet output');
  });

  it('allows changing fade time', async () => {
    renderComponent(createMocks(true));

    await waitFor(() => {
      expect(screen.getByText('Show fade options')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show fade options'));

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });

    expect(input).toHaveValue(5);
  });

  it('toggles ArtNet state on click and calls mutation with correct variables', async () => {
    let mutationCalled = false;
    const mocks: MockedResponse[] = [
      {
        request: { query: GET_SYSTEM_INFO },
        result: { data: { systemInfo: mockSystemInfoEnabled } },
      },
      {
        request: { query: SYSTEM_INFO_UPDATED },
        result: { data: { systemInfoUpdated: mockSystemInfoEnabled } },
      },
      {
        request: {
          query: SET_ARTNET_ENABLED,
          variables: { enabled: false, fadeTime: 3 },
        },
        result: () => {
          mutationCalled = true;
          return { data: { setArtNetEnabled: mockArtNetStatusDisabled } };
        },
      },
      // Mock for refetch after mutation
      {
        request: { query: GET_SYSTEM_INFO },
        result: { data: { systemInfo: mockSystemInfoDisabled } },
      },
    ];

    renderComponent(mocks);

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Verify mutation was called with correct variables
    await waitFor(() => {
      expect(mutationCalled).toBe(true);
    });
  });

  it('displays error message when toggle fails', async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: { query: GET_SYSTEM_INFO },
        result: { data: { systemInfo: mockSystemInfoEnabled } },
      },
      {
        request: { query: SYSTEM_INFO_UPDATED },
        result: { data: { systemInfoUpdated: mockSystemInfoEnabled } },
      },
      {
        request: {
          query: SET_ARTNET_ENABLED,
          variables: { enabled: false, fadeTime: 3 },
        },
        error: new Error('Network error'),
      },
    ];

    renderComponent(errorMocks);

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to toggle ArtNet/)).toBeInTheDocument();
    });
  });

  it('allows typing any fade time value, validates on submit', async () => {
    renderComponent(createMocks(true));

    await waitFor(() => {
      expect(screen.getByText('Show fade options')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show fade options'));

    const input = screen.getByRole('spinbutton');

    // Test value above max - can be typed but will show error on toggle
    fireEvent.change(input, { target: { value: '50' } });
    expect(input).toHaveValue(50);

    // Test value below min
    fireEvent.change(input, { target: { value: '-5' } });
    expect(input).toHaveValue(-5);

    // Valid value
    fireEvent.change(input, { target: { value: '5' } });
    expect(input).toHaveValue(5);
  });

  it('shows error when toggle is clicked with invalid fade time', async () => {
    renderComponent(createMocks(true));

    await waitFor(() => {
      expect(screen.getByText('Show fade options')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Show fade options'));

    const input = screen.getByRole('spinbutton');

    // Set invalid value above max
    fireEvent.change(input, { target: { value: '50' } });

    // Click toggle switch to disable ArtNet
    const toggleSwitch = screen.getByRole('switch', { name: /toggle artnet/i });
    fireEvent.click(toggleSwitch);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Fade time must be between 0 and 30 seconds/i)).toBeInTheDocument();
    });
  });
});
