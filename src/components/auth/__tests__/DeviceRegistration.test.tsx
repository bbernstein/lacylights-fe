import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import DeviceRegistration from '../DeviceRegistration';
import { REGISTER_DEVICE, CHECK_DEVICE_AUTHORIZATION } from '@/graphql/auth';
import * as deviceUtils from '@/lib/device';

// Mock the device utilities
jest.mock('@/lib/device', () => ({
  getOrCreateDeviceId: jest.fn(),
  getDeviceName: jest.fn(),
  setDeviceName: jest.fn(),
  requestPersistentStorage: jest.fn(),
  isPersistentStorageGranted: jest.fn(),
  DEVICE_ID_KEY: 'lacylights_device_id',
  DEVICE_NAME_KEY: 'lacylights_device_name',
}));

const mockGetOrCreateDeviceId = deviceUtils.getOrCreateDeviceId as jest.Mock;
const mockGetDeviceName = deviceUtils.getDeviceName as jest.Mock;
const mockSetDeviceName = deviceUtils.setDeviceName as jest.Mock;
const mockRequestPersistentStorage = deviceUtils.requestPersistentStorage as jest.Mock;
const mockIsPersistentStorageGranted = deviceUtils.isPersistentStorageGranted as jest.Mock;

const TEST_DEVICE_ID = 'test-device-id-12345';
const TEST_DEVICE_NAME = 'Stage Manager iPad';

const createRegisterDeviceMock = (
  fingerprint: string,
  name: string,
  error?: Error
): MockedResponse => ({
  request: {
    query: REGISTER_DEVICE,
    variables: { fingerprint, name },
  },
  ...(error
    ? { error }
    : {
        result: {
          data: {
            registerDevice: {
              __typename: 'Device',
              id: 'device-1',
              name,
              fingerprint,
              isAuthorized: false,
              defaultRole: 'PLAYER',
              lastSeenAt: null,
              lastIPAddress: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
              defaultUser: null,
            },
          },
        },
      }),
});

const createCheckDeviceMock = (fingerprint: string): MockedResponse => ({
  request: {
    query: CHECK_DEVICE_AUTHORIZATION,
    variables: { fingerprint },
  },
  result: {
    data: {
      checkDeviceAuthorization: {
        __typename: 'DeviceAuthStatus',
        isAuthorized: false,
        isPending: true,
        device: {
          __typename: 'Device',
          id: 'device-1',
          name: TEST_DEVICE_NAME,
          fingerprint,
          isAuthorized: false,
          defaultRole: 'PLAYER',
          lastSeenAt: null,
          lastIPAddress: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          defaultUser: null,
        },
        defaultUser: null,
      },
    },
  },
});

describe('DeviceRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDeviceId.mockReturnValue(TEST_DEVICE_ID);
    mockGetDeviceName.mockReturnValue(null);
    mockRequestPersistentStorage.mockResolvedValue(true);
    mockIsPersistentStorageGranted.mockResolvedValue(false);
  });

  it('renders registration form when device has no name', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    expect(screen.getByText('Register This Device')).toBeInTheDocument();
    expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register device/i })).toBeInTheDocument();
  });

  it('displays partial device ID', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    // Should show first 8 characters of device ID
    expect(screen.getByText(/test-dev\.\.\./)).toBeInTheDocument();
  });

  it('has disabled submit button when name is empty', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const submitButton = screen.getByRole('button', { name: /register device/i });

    // Button should be disabled when name is empty
    expect(submitButton).toBeDisabled();
  });

  it('validates short device name', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const input = screen.getByLabelText(/device name/i);
    fireEvent.change(input, { target: { value: 'A' } });

    const submitButton = screen.getByRole('button', { name: /register device/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('registers device successfully', async () => {
    const mocks = [
      createRegisterDeviceMock(TEST_DEVICE_ID, TEST_DEVICE_NAME),
      createCheckDeviceMock(TEST_DEVICE_ID),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const input = screen.getByLabelText(/device name/i);
    fireEvent.change(input, { target: { value: TEST_DEVICE_NAME } });

    const submitButton = screen.getByRole('button', { name: /register device/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetDeviceName).toHaveBeenCalledWith(TEST_DEVICE_NAME);
    });
  });

  it('handles registration error', async () => {
    const errorMessage = 'Network error';
    const mocks = [
      createRegisterDeviceMock(
        TEST_DEVICE_ID,
        TEST_DEVICE_NAME,
        new Error(errorMessage)
      ),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const input = screen.getByLabelText(/device name/i);
    fireEvent.change(input, { target: { value: TEST_DEVICE_NAME } });

    const submitButton = screen.getByRole('button', { name: /register device/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('handles already registered device gracefully', async () => {
    const mocks = [
      createRegisterDeviceMock(
        TEST_DEVICE_ID,
        TEST_DEVICE_NAME,
        new Error('Device already registered')
      ),
      createCheckDeviceMock(TEST_DEVICE_ID),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const input = screen.getByLabelText(/device name/i);
    fireEvent.change(input, { target: { value: TEST_DEVICE_NAME } });

    const submitButton = screen.getByRole('button', { name: /register device/i });
    fireEvent.click(submitButton);

    // Should treat as successful registration
    await waitFor(() => {
      expect(mockSetDeviceName).toHaveBeenCalledWith(TEST_DEVICE_NAME);
    });
  });

  it('shows compact form when compact prop is true', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistration compact />
      </MockedProvider>
    );

    // Compact mode should have input and register button in the same row
    expect(screen.getByPlaceholderText(/stage manager ipad/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();

    // Should not show the full form header
    expect(screen.queryByText('Register This Device')).not.toBeInTheDocument();
  });

  it('requests persistent storage before registering', async () => {
    const mocks = [
      createRegisterDeviceMock(TEST_DEVICE_ID, TEST_DEVICE_NAME),
      createCheckDeviceMock(TEST_DEVICE_ID),
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const input = screen.getByLabelText(/device name/i);
    fireEvent.change(input, { target: { value: TEST_DEVICE_NAME } });

    const submitButton = screen.getByRole('button', { name: /register device/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRequestPersistentStorage).toHaveBeenCalled();
    });
  });

  it('disables submit button when name is empty', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistration />
      </MockedProvider>
    );

    const submitButton = screen.getByRole('button', { name: /register device/i });

    // Should be disabled when input is empty
    expect(submitButton).toBeDisabled();

    // Enter a name
    const input = screen.getByLabelText(/device name/i);
    fireEvent.change(input, { target: { value: TEST_DEVICE_NAME } });

    // Should now be enabled
    expect(submitButton).not.toBeDisabled();
  });
});
