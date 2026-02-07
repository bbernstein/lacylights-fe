import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { UserModeProvider, useUserMode } from '../UserModeContext';

// Mock the AuthContext to provide default values (auth disabled)
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Default auth mock values (auth disabled)
const defaultAuthMock = {
  user: null,
  isAuthenticated: false,
  isAuthEnabled: false,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
  refresh: jest.fn(),
  register: jest.fn(),
  hasPermission: () => false,
  isAdmin: false,
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component that uses the UserModeContext
function TestComponent() {
  const {
    mode,
    setMode,
    canManageUsers,
    canEditContent,
    canPlayback,
    canView,
    isModeLocked,
    selectableModes,
  } = useUserMode();

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="canManageUsers">{canManageUsers ? 'yes' : 'no'}</div>
      <div data-testid="canEditContent">{canEditContent ? 'yes' : 'no'}</div>
      <div data-testid="canPlayback">{canPlayback ? 'yes' : 'no'}</div>
      <div data-testid="canView">{canView ? 'yes' : 'no'}</div>
      <div data-testid="isModeLocked">{isModeLocked ? 'yes' : 'no'}</div>
      <div data-testid="selectableModes">{selectableModes.join(',')}</div>
      <button data-testid="set-admin" onClick={() => setMode('admin')}>
        Set Admin
      </button>
      <button data-testid="set-editor" onClick={() => setMode('editor')}>
        Set Editor
      </button>
      <button data-testid="set-player" onClick={() => setMode('player')}>
        Set Player
      </button>
      <button data-testid="set-watcher" onClick={() => setMode('watcher')}>
        Set Watcher
      </button>
    </div>
  );
}

describe('UserModeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockUseAuth.mockReturnValue(defaultAuthMock);
  });

  describe('UserModeProvider', () => {
    it('provides default editor mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('editor');
    });

    it('provides correct permissions for default editor mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('canManageUsers')).toHaveTextContent('no');
      expect(screen.getByTestId('canEditContent')).toHaveTextContent('yes');
      expect(screen.getByTestId('canPlayback')).toHaveTextContent('yes');
      expect(screen.getByTestId('canView')).toHaveTextContent('yes');
    });

    it('restores mode from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('watcher');

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('watcher');
    });

    it('ignores invalid mode in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-mode');

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('editor');
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('editor');
    });
  });

  describe('Mode selection', () => {
    it('allows changing to watcher mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-watcher').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('watcher');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lacylights-user-mode',
        'watcher'
      );
    });

    it('allows changing to admin mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-admin').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('admin');
    });

    it('allows changing to player mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-player').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('player');
    });

    it('handles localStorage write errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      // Should not throw, mode should still change
      act(() => {
        screen.getByTestId('set-watcher').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('watcher');
    });
  });

  describe('Permission matrix', () => {
    it('provides correct permissions for admin mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-admin').click();
      });

      expect(screen.getByTestId('canManageUsers')).toHaveTextContent('yes');
      expect(screen.getByTestId('canEditContent')).toHaveTextContent('yes');
      expect(screen.getByTestId('canPlayback')).toHaveTextContent('yes');
      expect(screen.getByTestId('canView')).toHaveTextContent('yes');
    });

    it('provides correct permissions for editor mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-editor').click();
      });

      expect(screen.getByTestId('canManageUsers')).toHaveTextContent('no');
      expect(screen.getByTestId('canEditContent')).toHaveTextContent('yes');
      expect(screen.getByTestId('canPlayback')).toHaveTextContent('yes');
      expect(screen.getByTestId('canView')).toHaveTextContent('yes');
    });

    it('provides correct permissions for player mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-player').click();
      });

      expect(screen.getByTestId('canManageUsers')).toHaveTextContent('no');
      expect(screen.getByTestId('canEditContent')).toHaveTextContent('no');
      expect(screen.getByTestId('canPlayback')).toHaveTextContent('yes');
      expect(screen.getByTestId('canView')).toHaveTextContent('yes');
    });

    it('provides correct permissions for watcher mode', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-watcher').click();
      });

      expect(screen.getByTestId('canManageUsers')).toHaveTextContent('no');
      expect(screen.getByTestId('canEditContent')).toHaveTextContent('no');
      expect(screen.getByTestId('canPlayback')).toHaveTextContent('no');
      expect(screen.getByTestId('canView')).toHaveTextContent('yes');
    });
  });

  describe('useUserMode hook', () => {
    it('throws error when used outside UserModeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useUserMode must be used within a UserModeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('localStorage integration', () => {
    it('saves mode to localStorage when changed', () => {
      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      act(() => {
        screen.getByTestId('set-player').click();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lacylights-user-mode',
        'player'
      );
    });

    it('reads mode from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('player');

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'lacylights-user-mode'
      );
      expect(screen.getByTestId('mode')).toHaveTextContent('player');
    });

    it('validates stored mode value', () => {
      // Valid modes should be accepted
      const validModes = ['admin', 'editor', 'player', 'watcher'];

      for (const validMode of validModes) {
        mockLocalStorage.getItem.mockReturnValue(validMode);

        const { unmount } = render(
          <UserModeProvider>
            <TestComponent />
          </UserModeProvider>
        );

        expect(screen.getByTestId('mode')).toHaveTextContent(validMode);
        unmount();
      }
    });
  });

  describe('Auth integration', () => {
    it('forces admin mode when user is an authenticated admin', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        isAuthEnabled: true,
        isAuthenticated: true,
        user: { role: 'ADMIN' },
        isAdmin: true,
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('admin');
      expect(screen.getByTestId('canManageUsers')).toHaveTextContent('yes');
      expect(screen.getByTestId('isModeLocked')).toHaveTextContent('yes');
      expect(screen.getByTestId('selectableModes')).toHaveTextContent('');
    });

    it('prevents mode change when user is an admin', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        isAuthEnabled: true,
        isAuthenticated: true,
        user: { role: 'ADMIN' },
        isAdmin: true,
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      // Try to change mode
      act(() => {
        screen.getByTestId('set-watcher').click();
      });

      // Mode should still be admin
      expect(screen.getByTestId('mode')).toHaveTextContent('admin');
    });

    it('allows mode selection for non-admin authenticated users', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        isAuthEnabled: true,
        isAuthenticated: true,
        user: { role: 'USER' },
        isAdmin: false,
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      // Default should be editor
      expect(screen.getByTestId('mode')).toHaveTextContent('editor');
      expect(screen.getByTestId('isModeLocked')).toHaveTextContent('no');
      // Non-admin users get editor,watcher (AVAILABLE_MODES without admin)
      expect(screen.getByTestId('selectableModes')).toHaveTextContent('editor,watcher');

      // Should be able to change to watcher
      act(() => {
        screen.getByTestId('set-watcher').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('watcher');
    });

    it('prevents non-admin users from setting admin mode', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        isAuthEnabled: true,
        isAuthenticated: true,
        user: { role: 'USER' },
        isAdmin: false,
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      // Try to set admin mode
      act(() => {
        screen.getByTestId('set-admin').click();
      });

      // Mode should still be editor (the default)
      expect(screen.getByTestId('mode')).toHaveTextContent('editor');
    });

    it('allows all mode selection when auth is disabled', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthMock,
        isAuthEnabled: false,
        isAuthenticated: false,
        user: null,
        isAdmin: false,
      });

      render(
        <UserModeProvider>
          <TestComponent />
        </UserModeProvider>
      );

      expect(screen.getByTestId('isModeLocked')).toHaveTextContent('no');
      // When auth is disabled, show AVAILABLE_MODES (editor,watcher)
      expect(screen.getByTestId('selectableModes')).toHaveTextContent('editor,watcher');

      // Should be able to set admin mode when auth is disabled
      act(() => {
        screen.getByTestId('set-admin').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('admin');
    });
  });
});
