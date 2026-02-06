import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import DeviceStatusCheck from '../DeviceStatusCheck';
import { CHECK_DEVICE_AUTHORIZATION } from '@/graphql/auth';

const TEST_DEVICE_ID = 'test-device-id-12345';
const TEST_DEVICE_NAME = 'Stage Manager iPad';

interface MockStatus {
  status: 'approved' | 'pending' | 'revoked' | 'unknown';
  error?: Error;
}

const createCheckDeviceMock = (
  fingerprint: string,
  { status, error }: MockStatus
): MockedResponse => {
  if (error) {
    return {
      request: {
        query: CHECK_DEVICE_AUTHORIZATION,
        variables: { fingerprint },
      },
      error,
    };
  }

  const device = status !== 'unknown' ? {
    __typename: 'Device',
    id: 'device-1',
    name: TEST_DEVICE_NAME,
    fingerprint,
    isAuthorized: status === 'approved',
    defaultRole: 'OPERATOR',
    lastSeenAt: '2024-01-01T12:00:00Z',
    lastIPAddress: '192.168.1.100',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    defaultUser: {
      __typename: 'User',
      id: 'user-1',
      email: 'admin@lacylights.local',
      name: 'Admin User',
    },
  } : null;

  const defaultUser = status === 'approved' ? {
    __typename: 'User',
    id: 'user-1',
    email: 'admin@lacylights.local',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: '2024-01-01T00:00:00Z',
  } : null;

  return {
    request: {
      query: CHECK_DEVICE_AUTHORIZATION,
      variables: { fingerprint },
    },
    result: {
      data: {
        checkDeviceAuthorization: {
          __typename: 'DeviceAuthStatus',
          isAuthorized: status === 'approved',
          isPending: status === 'pending',
          device,
          defaultUser,
        },
      },
    },
  };
};

describe('DeviceStatusCheck', () => {
  it('shows checking state initially', () => {
    // Use multiple mocks to handle polling
    const mocks = [
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    expect(screen.getByText(/checking status/i)).toBeInTheDocument();
  });

  it('shows pending status when device is pending approval', async () => {
    // Provide multiple mocks to handle potential polling
    const mocks = [
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} pollInterval={0} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/waiting for an administrator/i)).toBeInTheDocument();
    expect(screen.getByText(TEST_DEVICE_NAME)).toBeInTheDocument();
  });

  it('shows approved status when device is authorized', async () => {
    const onApproved = jest.fn();
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'approved' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck
          deviceId={TEST_DEVICE_ID}
          deviceName={TEST_DEVICE_NAME}
          onApproved={onApproved}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/^approved$/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/authorized to access/i)).toBeInTheDocument();
    expect(onApproved).toHaveBeenCalled();
  });

  it('shows revoked status when device exists but not authorized or pending', async () => {
    const onRevoked = jest.fn();
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'revoked' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck
          deviceId={TEST_DEVICE_ID}
          deviceName={TEST_DEVICE_NAME}
          onRevoked={onRevoked}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/access revoked/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/contact an administrator/i)).toBeInTheDocument();
    expect(onRevoked).toHaveBeenCalled();
  });

  it('displays device details when approved', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'approved' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/^approved$/i)).toBeInTheDocument();
    });

    // Should show device details
    expect(screen.getByText(/role:/i)).toBeInTheDocument();
    expect(screen.getByText(/operator/i)).toBeInTheDocument();
    expect(screen.getByText(/default user:/i)).toBeInTheDocument();
    expect(screen.getByText(/admin user/i)).toBeInTheDocument();
  });

  it('shows refresh button', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    });

    // Should have refresh button
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('displays partial device ID', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/test-dev\.\.\./)).toBeInTheDocument();
    });
  });

  it('shows last checked timestamp after data loads', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/last checked:/i)).toBeInTheDocument();
    });
  });

  it('renders compact mode correctly', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck
          deviceId={TEST_DEVICE_ID}
          deviceName={TEST_DEVICE_NAME}
          compact
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    });

    // Compact mode should show device name
    expect(screen.getByText(TEST_DEVICE_NAME)).toBeInTheDocument();
  });

  it('shows polling indicator when pending', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck
          deviceId={TEST_DEVICE_ID}
          deviceName={TEST_DEVICE_NAME}
          pollInterval={5000}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/checking for approval every 5 seconds/i)).toBeInTheDocument();
    });
  });

  it('does not show polling indicator when approved', async () => {
    const mocks = [createCheckDeviceMock(TEST_DEVICE_ID, { status: 'approved' })];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/^approved$/i)).toBeInTheDocument();
    });

    // Should not show polling indicator when approved
    expect(screen.queryByText(/checking for approval/i)).not.toBeInTheDocument();
  });

  it('can click refresh button', async () => {
    const mocks = [
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
      // Second mock for the refetch
      createCheckDeviceMock(TEST_DEVICE_ID, { status: 'pending' }),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceStatusCheck deviceId={TEST_DEVICE_ID} deviceName={TEST_DEVICE_NAME} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Button should still be there after clicking
    expect(refreshButton).toBeInTheDocument();
  });
});
