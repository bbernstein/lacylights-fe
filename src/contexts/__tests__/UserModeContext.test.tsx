import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { UserModeProvider, useUserMode } from '../UserModeContext';

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
  } = useUserMode();

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="canManageUsers">{canManageUsers ? 'yes' : 'no'}</div>
      <div data-testid="canEditContent">{canEditContent ? 'yes' : 'no'}</div>
      <div data-testid="canPlayback">{canPlayback ? 'yes' : 'no'}</div>
      <div data-testid="canView">{canView ? 'yes' : 'no'}</div>
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
});
