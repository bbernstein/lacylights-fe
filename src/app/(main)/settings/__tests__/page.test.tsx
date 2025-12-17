import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import SettingsPage from '../page';
import {
  GET_SETTINGS,
  UPDATE_SETTING,
  GET_NETWORK_INTERFACE_OPTIONS,
  GET_SYSTEM_INFO,
} from '@/graphql/settings';

// Mock the child components
jest.mock('../WiFiSettings', () => ({
  __esModule: true,
  default: () => <div data-testid="wifi-settings">WiFi Settings</div>,
}));

jest.mock('../VersionManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="version-management">Version Management</div>,
}));

jest.mock('../OFLManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="ofl-management">OFL Management</div>,
}));

const mockSettings = [
  {
    id: '1',
    key: 'artnet_broadcast_address',
    value: '192.168.1.255',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockSystemInfo = {
  artnetBroadcastAddress: '192.168.1.255',
  artnetEnabled: true,
  fadeUpdateRateHz: 60,
};

const mockNetworkInterfaces = [
  {
    name: 'eth0',
    address: '192.168.1.100',
    broadcast: '192.168.1.255',
    description: 'Ethernet (192.168.1.100)',
    interfaceType: 'ethernet',
  },
];

const createMocks = (updateSuccess = true) => [
  {
    request: {
      query: GET_SETTINGS,
    },
    result: {
      data: {
        settings: mockSettings,
      },
    },
  },
  {
    request: {
      query: GET_SYSTEM_INFO,
    },
    result: {
      data: {
        systemInfo: mockSystemInfo,
      },
    },
  },
  {
    request: {
      query: GET_NETWORK_INTERFACE_OPTIONS,
    },
    result: {
      data: {
        networkInterfaceOptions: mockNetworkInterfaces,
      },
    },
  },
  {
    request: {
      query: UPDATE_SETTING,
      variables: {
        input: {
          key: 'fade_update_rate',
          value: '80',
        },
      },
    },
    result: updateSuccess
      ? {
          data: {
            updateSetting: {
              id: '2',
              key: 'fade_update_rate',
              value: '80',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          },
        }
      : {
          errors: [{ message: 'Update failed' }],
        },
  },
];

describe('SettingsPage - Fade Update Rate Validation', () => {
  it('accepts valid values within range (10-120)', async () => {
    const mocks = createMocks(true);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    // Click edit button for fade_update_rate
    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    // Wait for input to appear
    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    // Enter valid value
    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '80' } });

    // Click save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Should not show any validation error
    await waitFor(() => {
      expect(screen.queryByText(/must be between/i)).not.toBeInTheDocument();
    });
  });

  it('rejects values below minimum (10)', async () => {
    const mocks = createMocks(false);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Fade update rate must be between 10 and 120 Hz')).toBeInTheDocument();
    });
  });

  it('rejects values above maximum (120)', async () => {
    const mocks = createMocks(false);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '150' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Fade update rate must be between 10 and 120 Hz')).toBeInTheDocument();
    });
  });

  it('handles whitespace-only input as empty', async () => {
    const mocks = createMocks(false);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a value')).toBeInTheDocument();
    });
  });

  it('rejects decimal values', async () => {
    const mocks = createMocks(false);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '60.5' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Fade update rate must be a whole number')).toBeInTheDocument();
    });
  });

  it('accepts minimum boundary value (10)', async () => {
    const mocksWithBoundary = [
      ...createMocks(false).slice(0, 3),
      {
        request: {
          query: UPDATE_SETTING,
          variables: {
            input: {
              key: 'fade_update_rate',
              value: '10',
            },
          },
        },
        result: {
          data: {
            updateSetting: {
              id: '2',
              key: 'fade_update_rate',
              value: '10',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocksWithBoundary} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '10' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText(/must be between/i)).not.toBeInTheDocument();
    });
  });

  it('accepts maximum boundary value (120)', async () => {
    const mocksWithBoundary = [
      ...createMocks(false).slice(0, 3),
      {
        request: {
          query: UPDATE_SETTING,
          variables: {
            input: {
              key: 'fade_update_rate',
              value: '120',
            },
          },
        },
        result: {
          data: {
            updateSetting: {
              id: '2',
              key: 'fade_update_rate',
              value: '120',
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocksWithBoundary} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '120' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText(/must be between/i)).not.toBeInTheDocument();
    });
  });

  it('rejects empty string input', async () => {
    const mocks = createMocks(false);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a value')).toBeInTheDocument();
    });
  });

  it('clears validation error when input changes', async () => {
    const mocks = createMocks(false);

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SettingsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Fade Update Rate (Hz)')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    const fadeRateEditButton = editButtons.find((btn) => {
      const row = btn.closest('tr');
      return row?.textContent?.includes('Fade Update Rate');
    });

    expect(fadeRateEditButton).toBeDefined();
    fireEvent.click(fadeRateEditButton!);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('60');
      expect(input).toBeInTheDocument();
    });

    // Enter invalid value
    const input = screen.getByPlaceholderText('60') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Error should appear
    await waitFor(() => {
      expect(screen.getByText('Fade update rate must be between 10 and 120 Hz')).toBeInTheDocument();
    });

    // Change input - error should clear
    fireEvent.change(input, { target: { value: '60' } });

    await waitFor(() => {
      expect(screen.queryByText('Fade update rate must be between 10 and 120 Hz')).not.toBeInTheDocument();
    });
  });
});
