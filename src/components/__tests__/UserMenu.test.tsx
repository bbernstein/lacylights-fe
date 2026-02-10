import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from '../UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

// Mock the hooks
jest.mock('@/contexts/AuthContext');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('UserMenu', () => {
  const mockPush = jest.fn();
  const mockLogout = jest.fn();
  const mockLogoutAll = jest.fn();

  const baseAuthContext = {
    user: null,
    isAuthenticated: false,
    isAuthEnabled: true,
    isLoading: false,
    isDeviceAuth: false,
    deviceName: null,
    login: jest.fn(),
    logout: mockLogout,
    logoutAll: mockLogoutAll,
    refresh: jest.fn(),
    register: jest.fn(),
    hasPermission: jest.fn(),
    isAdmin: false,
  };

  const authenticatedUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    emailVerified: true,
    phoneVerified: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    groups: [],
    permissions: [],
  };

  const adminUser = {
    ...authenticatedUser,
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockLogout.mockResolvedValue(undefined);
    mockLogoutAll.mockResolvedValue(undefined);
  });

  describe('when auth is disabled', () => {
    it('returns null', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        isAuthEnabled: false,
      });

      const { container } = render(<UserMenu />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when loading', () => {
    it('shows loading placeholder', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        isLoading: true,
      });

      render(<UserMenu />);
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        isAuthenticated: false,
      });
    });

    it('shows Sign In button', () => {
      render(<UserMenu />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('navigates to /login when Sign In is clicked', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button'));

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: authenticatedUser,
        isAuthenticated: true,
      });
    });

    it('shows user avatar with initials', () => {
      render(<UserMenu />);

      // Should show "TU" for "Test User"
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('shows first letter of email when no name', () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: { ...authenticatedUser, name: undefined },
        isAuthenticated: true,
      });

      render(<UserMenu />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('opens dropdown when avatar is clicked', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(<UserMenu />);

      // Open dropdown
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
      });
    });

    it('calls logout and redirects when Sign Out is clicked', async () => {
      render(<UserMenu />);

      // Open dropdown
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      // Click Sign Out
      await userEvent.click(screen.getByText('Sign Out'));

      expect(mockLogout).toHaveBeenCalled();
      // Redirect happens when no token and no device auth cookie
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('does not show Sign Out All Devices for non-admin users', async () => {
      render(<UserMenu />);

      // Open dropdown
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.queryByText('Sign Out All Devices')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated as admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: adminUser,
        isAuthenticated: true,
        isAdmin: true,
      });
    });

    it('shows Admin badge', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows Sign Out All Devices option', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.getByText('Sign Out All Devices')).toBeInTheDocument();
    });

    it('calls logoutAll when Sign Out All Devices is clicked', async () => {
      render(<UserMenu />);

      // Open dropdown
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      // Click Sign Out All Devices
      await userEvent.click(screen.getByText('Sign Out All Devices'));

      expect(mockLogoutAll).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('when device-authenticated', () => {
    const deviceUser = {
      id: 'device-user-1',
      email: 'device@example.com',
      name: 'Device User',
      role: UserRole.USER,
      emailVerified: false,
      phoneVerified: false,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      groups: [],
      permissions: [],
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: deviceUser,
        isAuthenticated: true,
        isDeviceAuth: true,
        deviceName: 'Stage Manager iPad',
      });
    });

    it('shows device icon instead of user initials', () => {
      render(<UserMenu />);
      // Should not show user initials
      expect(screen.queryByText('DU')).not.toBeInTheDocument();
    });

    it('shows device name in dropdown', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.getByText('Stage Manager iPad')).toBeInTheDocument();
      expect(screen.getByText('Device Access')).toBeInTheDocument();
    });

    it('shows Sign In option instead of Sign Out', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    it('navigates to /login when Sign In is clicked', async () => {
      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));
      await userEvent.click(screen.getByText('Sign In'));

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('does not show Admin badge even if user has admin role', async () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: { ...deviceUser, role: UserRole.ADMIN },
        isAuthenticated: true,
        isDeviceAuth: true,
        deviceName: 'Admin Device',
        isAdmin: true,
      });

      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('shows fallback device name when deviceName is null', async () => {
      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: deviceUser,
        isAuthenticated: true,
        isDeviceAuth: true,
        deviceName: null,
      });

      render(<UserMenu />);

      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      expect(screen.getByText('Device')).toBeInTheDocument();
    });
  });

  describe('logout error handling', () => {
    it('still redirects to login even if logout fails', async () => {
      // Setup before rendering
      mockLogout.mockRejectedValueOnce(new Error('Logout failed'));

      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: authenticatedUser,
        isAuthenticated: true,
      });

      render(<UserMenu />);

      // Open dropdown
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      // Wait for dropdown to be visible
      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      // Click Sign Out - this should still redirect even though logout throws
      await userEvent.click(screen.getByText('Sign Out'));

      // Should still redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('still redirects to login even if logoutAll fails', async () => {
      // Setup before rendering
      mockLogoutAll.mockRejectedValueOnce(new Error('Logout all failed'));

      mockUseAuth.mockReturnValue({
        ...baseAuthContext,
        user: adminUser,
        isAuthenticated: true,
        isAdmin: true,
      });

      render(<UserMenu />);

      // Open dropdown
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }));

      // Wait for dropdown to be visible
      await waitFor(() => {
        expect(screen.getByText('Sign Out All Devices')).toBeInTheDocument();
      });

      // Click Sign Out All Devices - this should still redirect even though logoutAll throws
      await userEvent.click(screen.getByText('Sign Out All Devices'));

      // Should still redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });
});
