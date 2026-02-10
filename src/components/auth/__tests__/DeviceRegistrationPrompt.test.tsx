import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import DeviceRegistrationPrompt from '../DeviceRegistrationPrompt';
import { CHECK_DEVICE_AUTHORIZATION } from '@/graphql/auth';
import * as deviceUtils from '@/lib/device';

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-mark-icon">X</div>,
  ComputerDesktopIcon: ({ className }: { className?: string }) => <div className={className} data-testid="computer-icon">C</div>,
  ExclamationCircleIcon: ({ className }: { className?: string }) => <div className={className} data-testid="exclamation-icon">!</div>,
  CheckCircleIcon: ({ className }: { className?: string }) => <div className={className} data-testid="check-icon">V</div>,
  ClockIcon: ({ className }: { className?: string }) => <div className={className} data-testid="clock-icon">T</div>,
  XCircleIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-circle-icon">R</div>,
  ArrowPathIcon: ({ className }: { className?: string }) => <div className={className} data-testid="arrow-path-icon">A</div>,
}));

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false),
}));

// Mock the device utilities
jest.mock('@/lib/device', () => ({
  getOrCreateDeviceId: jest.fn(),
  getDeviceName: jest.fn(),
  setDeviceName: jest.fn(),
  isDeviceRegistered: jest.fn(),
  requestPersistentStorage: jest.fn(),
  isPersistentStorageGranted: jest.fn(),
  DEVICE_ID_KEY: 'lacylights_device_id',
  DEVICE_NAME_KEY: 'lacylights_device_name',
}));

// Mock useAuth
const mockUseAuth = {
  isAuthEnabled: true,
  isAuthenticated: true,
  isLoading: false,
  isAdmin: false,
  user: { id: 'user-1', email: 'test@test.com' },
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  hasPermission: jest.fn(),
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => mockUseAuth),
}));

const mockGetOrCreateDeviceId = deviceUtils.getOrCreateDeviceId as jest.Mock;
const mockIsDeviceRegistered = deviceUtils.isDeviceRegistered as jest.Mock;
const mockIsPersistentStorageGranted = deviceUtils.isPersistentStorageGranted as jest.Mock;

const TEST_DEVICE_ID = 'test-device-fingerprint-123';

// Mock for CHECK_DEVICE_AUTHORIZATION that returns no device (unregistered)
const unregisteredDeviceMock = {
  request: {
    query: CHECK_DEVICE_AUTHORIZATION,
    variables: { fingerprint: TEST_DEVICE_ID },
  },
  result: {
    data: {
      checkDeviceAuthorization: {
        isAuthorized: false,
        isPending: false,
        device: null,
        defaultUser: null,
      },
    },
  },
};

// Mock for CHECK_DEVICE_AUTHORIZATION that returns a registered device
const registeredDeviceMock = {
  request: {
    query: CHECK_DEVICE_AUTHORIZATION,
    variables: { fingerprint: TEST_DEVICE_ID },
  },
  result: {
    data: {
      checkDeviceAuthorization: {
        isAuthorized: true,
        isPending: false,
        device: {
          id: 'device-1',
          name: 'Test Device',
          fingerprint: TEST_DEVICE_ID,
          isAuthorized: true,
          defaultRole: 'PLAYER',
          lastSeenAt: null,
          lastIPAddress: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          defaultUser: null,
          groups: [],
        },
        defaultUser: null,
      },
    },
  },
};

describe('DeviceRegistrationPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateDeviceId.mockReturnValue(TEST_DEVICE_ID);
    mockIsDeviceRegistered.mockReturnValue(false);
    mockIsPersistentStorageGranted.mockResolvedValue(false);
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue(mockUseAuth);
  });

  it('shows registration prompt when device is not registered', async () => {
    render(
      <MockedProvider mocks={[unregisteredDeviceMock]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Register This Device')).toBeInTheDocument();
    });

    expect(screen.getByText(/Register this device so it can be managed/)).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  it('does not show when device is already registered locally', async () => {
    mockIsDeviceRegistered.mockReturnValue(true);

    const { container } = render(
      <MockedProvider mocks={[registeredDeviceMock]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    // Wait for query to settle
    await waitFor(() => {
      expect(container.querySelector('[data-testid="device-registration-prompt"]')).not.toBeInTheDocument();
    });
  });

  it('does not show when backend already knows the device', async () => {
    render(
      <MockedProvider mocks={[registeredDeviceMock]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    // Wait for the query to resolve - prompt should not appear
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.queryByText('Register This Device')).not.toBeInTheDocument();
  });

  it('does not show when auth is disabled', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ ...mockUseAuth, isAuthEnabled: false });

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.queryByText('Register This Device')).not.toBeInTheDocument();
  });

  it('does not show when user is not authenticated', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ ...mockUseAuth, isAuthenticated: false });

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.queryByText('Register This Device')).not.toBeInTheDocument();
  });

  it('dismisses when Skip for now is clicked', async () => {
    render(
      <MockedProvider mocks={[unregisteredDeviceMock]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Register This Device')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skip for now'));

    await waitFor(() => {
      expect(screen.queryByText('Register This Device')).not.toBeInTheDocument();
    });
  });

  it('dismisses when backdrop is clicked', async () => {
    render(
      <MockedProvider mocks={[unregisteredDeviceMock]} addTypename={false}>
        <DeviceRegistrationPrompt />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Register This Device')).toBeInTheDocument();
    });

    const backdrop = screen.getByTestId('device-registration-prompt-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByText('Register This Device')).not.toBeInTheDocument();
    });
  });
});
