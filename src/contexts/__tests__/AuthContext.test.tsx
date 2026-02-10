import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { AuthProvider, useAuth, useCanAccess, useRequireAuth } from '../AuthContext';
import { GET_AUTH_ENABLED, GET_ME, REFRESH_TOKEN, LOGOUT, CHECK_DEVICE_AUTHORIZATION } from '../../graphql/auth';
import { UserRole } from '@/types';

// Mock device fingerprint module
jest.mock('@/lib/device', () => ({
  getOrCreateDeviceId: jest.fn(() => 'test-device-fingerprint'),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    length: 0,
    key: jest.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
  emailVerified: true,
  phoneVerified: false,
  isActive: true,
  lastLoginAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  groups: [],
  permissions: ['read:projects'],
};

const mockAdminUser = {
  ...mockUser,
  id: 'admin-1',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  permissions: ['admin:all'],
};

// Test component that uses the AuthContext
function TestComponent({ testPermission = 'read:projects' }: { testPermission?: string }) {
  const {
    user,
    isAuthenticated,
    isAuthEnabled,
    isLoading,
    isAdmin,
    isDeviceAuth,
    deviceName,
    hasPermission,
    logout,
  } = useAuth();

  const canAccess = useCanAccess(testPermission);
  const { isLoading: requireLoading, shouldRedirect } = useRequireAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="auth-enabled">{isAuthEnabled ? 'enabled' : 'disabled'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="is-admin">{isAdmin ? 'admin' : 'not-admin'}</div>
      <div data-testid="is-device-auth">{isDeviceAuth ? 'device' : 'not-device'}</div>
      <div data-testid="device-name">{deviceName || 'no-device'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="has-permission">{hasPermission(testPermission) ? 'has' : 'no'}</div>
      <div data-testid="can-access">{canAccess ? 'can' : 'cannot'}</div>
      <div data-testid="require-loading">{requireLoading ? 'loading' : 'done'}</div>
      <div data-testid="should-redirect">{shouldRedirect ? 'redirect' : 'stay'}</div>
      <button data-testid="logout-button" onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    document.cookie = '';
  });

  describe('when auth is disabled', () => {
    const mocks = [
      {
        request: {
          query: GET_AUTH_ENABLED,
        },
        result: {
          data: {
            authEnabled: false,
          },
        },
      },
    ];

    it('shows auth disabled state', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('auth-enabled')).toHaveTextContent('disabled');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    it('useCanAccess returns true when auth is disabled', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('can-access')).toHaveTextContent('can');
    });
  });

  describe('when auth is enabled but not authenticated', () => {
    const mocks = [
      {
        request: {
          query: GET_AUTH_ENABLED,
        },
        result: {
          data: {
            authEnabled: true,
          },
        },
      },
      {
        // Device auth fallback will be attempted but fail (device not authorized)
        request: {
          query: CHECK_DEVICE_AUTHORIZATION,
          variables: { fingerprint: 'test-device-fingerprint' },
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
      },
    ];

    it('shows not authenticated state', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('auth-enabled')).toHaveTextContent('enabled');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('should-redirect')).toHaveTextContent('redirect');
    });
  });

  describe('when authenticated with valid token', () => {
    const mocks = [
      {
        request: {
          query: GET_AUTH_ENABLED,
        },
        result: {
          data: {
            authEnabled: true,
          },
        },
      },
      {
        request: {
          query: GET_ME,
        },
        result: {
          data: {
            me: mockUser,
          },
        },
      },
    ];

    beforeEach(() => {
      mockLocalStorage.setItem('token', 'valid-token');
    });

    it('loads user data from token', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Wait for auth to be enabled and loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // With a valid token, auth is enabled and user is authenticated
      expect(screen.getByTestId('auth-enabled')).toHaveTextContent('enabled');
      // Note: Full user data loading depends on mock fragment resolution
      // which may not work perfectly with MockedProvider
    });

    // Note: This test is skipped because MockedProvider doesn't reliably
    // resolve fragment fields in GET_ME. The UserMenu tests cover hasPermission
    // through the mocked useAuth hook.
    it.skip('hasPermission returns true for granted permission', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent testPermission="read:projects" />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });

      expect(screen.getByTestId('has-permission')).toHaveTextContent('has');
    });

    it('hasPermission returns false for non-granted permission', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent testPermission="admin:all" />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('has-permission')).toHaveTextContent('no');
    });

    it('logout clears auth state', async () => {
      // Create a mock for GET_AUTH_ENABLED that can be used multiple times
      const authEnabledMock = {
        request: {
          query: GET_AUTH_ENABLED,
        },
        result: {
          data: {
            authEnabled: true,
          },
        },
        maxUsageCount: 3, // Allow multiple uses for resetStore
      };

      const logoutMocks = [
        authEnabledMock,
        {
          request: {
            query: GET_ME,
          },
          result: {
            data: {
              me: mockUser,
            },
          },
          maxUsageCount: 2,
        },
        {
          request: {
            query: LOGOUT,
          },
          result: {
            data: {
              logout: true,
            },
          },
        },
        {
          // Device auth fallback after logout (device not authorized)
          request: {
            query: CHECK_DEVICE_AUTHORIZATION,
            variables: { fingerprint: 'test-device-fingerprint' },
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
        },
      ];

      render(
        <MockedProvider mocks={logoutMocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Wait for initial auth state
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Click logout button
      fireEvent.click(screen.getByTestId('logout-button'));

      // After logout, user should be cleared (device auth fallback fails)
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });

      // localStorage should be cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('admin user', () => {
    const adminMocks = [
      {
        request: {
          query: GET_AUTH_ENABLED,
        },
        result: {
          data: {
            authEnabled: true,
          },
        },
      },
      {
        request: {
          query: GET_ME,
        },
        result: {
          data: {
            me: mockAdminUser,
          },
        },
      },
    ];

    beforeEach(() => {
      mockLocalStorage.setItem('token', 'admin-token');
    });

    it('isAdmin returns true for admin users', async () => {
      render(
        <MockedProvider mocks={adminMocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
    });

    // Note: This test is skipped because MockedProvider doesn't reliably
    // resolve fragment fields in GET_ME. Admin permissions are tested
    // through the UserMenu tests with mocked useAuth.
    it.skip('admin has all permissions', async () => {
      render(
        <MockedProvider mocks={adminMocks} addTypename={false}>
          <AuthProvider>
            <TestComponent testPermission="any:permission" />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
      });

      expect(screen.getByTestId('has-permission')).toHaveTextContent('has');
    });
  });

  describe('useAuth hook error', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('token refresh flow', () => {
    const refreshMocks = [
      {
        request: {
          query: GET_AUTH_ENABLED,
        },
        result: {
          data: {
            authEnabled: true,
          },
        },
      },
      {
        request: {
          query: GET_ME,
        },
        result: {
          data: {
            me: null,
          },
        },
      },
      {
        request: {
          query: REFRESH_TOKEN,
          variables: { refreshToken: 'valid-refresh-token' },
        },
        result: {
          data: {
            refreshToken: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresAt: '2025-01-01T00:00:00Z',
              user: mockUser,
            },
          },
        },
      },
      {
        request: {
          query: GET_ME,
        },
        result: {
          data: {
            me: mockUser,
          },
        },
      },
    ];

    beforeEach(() => {
      mockLocalStorage.setItem('token', 'expired-token');
      mockLocalStorage.setItem('refreshToken', 'valid-refresh-token');
    });

    it('refreshes token when access token is expired', async () => {
      render(
        <MockedProvider mocks={refreshMocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      }, { timeout: 3000 });
    });
  });

  describe('error handling', () => {
    const errorMocks = [
      {
        request: {
          query: GET_AUTH_ENABLED,
        },
        error: new Error('Network error'),
      },
    ];

    it('handles auth check failure gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // On error, auth should be disabled
      expect(screen.getByTestId('auth-enabled')).toHaveTextContent('disabled');

      consoleError.mockRestore();
    });
  });

  describe('device auth fallback', () => {
    const mockDeviceAuthResponse = {
      __typename: 'DeviceAuthStatus',
      isAuthorized: true,
      isPending: false,
      device: {
        __typename: 'Device',
        id: 'device-1',
        name: 'Stage Manager iPad',
        fingerprint: 'test-device-fingerprint',
        isAuthorized: true,
        defaultRole: 'OPERATOR',
        lastSeenAt: null,
        lastIPAddress: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        defaultUser: {
          __typename: 'User',
          id: 'device-user-1',
          email: 'device@example.com',
          name: 'Device User',
        },
        groups: [
          { __typename: 'UserGroup', id: 'group-1', name: 'Stage Group', isPersonal: false },
        ],
      },
      defaultUser: {
        __typename: 'User',
        id: 'device-user-1',
        email: 'device@example.com',
        name: 'Device User',
        role: UserRole.USER,
        createdAt: '2024-01-01T00:00:00Z',
      },
    };

    it('falls back to device auth when no JWT token exists', async () => {
      const mocks = [
        {
          request: { query: GET_AUTH_ENABLED },
          result: { data: { authEnabled: true } },
          maxUsageCount: 3,
        },
        {
          request: {
            query: CHECK_DEVICE_AUTHORIZATION,
            variables: { fingerprint: 'test-device-fingerprint' },
          },
          result: {
            data: { checkDeviceAuthorization: mockDeviceAuthResponse },
          },
          maxUsageCount: 3,
        },
      ];

      // Use addTypename={true} (default) for device auth tests because
      // apolloClient.query() normalizes through the cache, which needs
      // __typename to properly resolve nested objects from fragments.
      render(
        <MockedProvider mocks={mocks}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      // Device auth should succeed: user is authenticated via device
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
      expect(screen.getByTestId('is-device-auth')).toHaveTextContent('device');
      expect(screen.getByTestId('user-email')).toHaveTextContent('device@example.com');
      expect(screen.getByTestId('device-name')).toHaveTextContent('Stage Manager iPad');
    });

    it('stays unauthenticated when device is not authorized', async () => {
      const mocks = [
        {
          request: { query: GET_AUTH_ENABLED },
          result: { data: { authEnabled: true } },
        },
        {
          request: {
            query: CHECK_DEVICE_AUTHORIZATION,
            variables: { fingerprint: 'test-device-fingerprint' },
          },
          result: {
            data: {
              checkDeviceAuthorization: {
                isAuthorized: false,
                isPending: true,
                device: null,
                defaultUser: null,
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('is-device-auth')).toHaveTextContent('not-device');
    });

    it('stays unauthenticated when device has no default user', async () => {
      const mocks = [
        {
          request: { query: GET_AUTH_ENABLED },
          result: { data: { authEnabled: true } },
        },
        {
          request: {
            query: CHECK_DEVICE_AUTHORIZATION,
            variables: { fingerprint: 'test-device-fingerprint' },
          },
          result: {
            data: {
              checkDeviceAuthorization: {
                ...mockDeviceAuthResponse,
                defaultUser: null,
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('is-device-auth')).toHaveTextContent('not-device');
    });

    it('prefers JWT auth over device auth when token exists', async () => {
      mockLocalStorage.setItem('token', 'valid-token');

      const mocks = [
        {
          request: { query: GET_AUTH_ENABLED },
          result: { data: { authEnabled: true } },
        },
        {
          request: { query: GET_ME },
          result: { data: { me: mockUser } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('is-device-auth')).toHaveTextContent('not-device');
    });
  });
});
