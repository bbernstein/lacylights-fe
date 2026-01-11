'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  UserMode,
  UserPermissions,
  DEFAULT_USER_MODE,
  ALL_MODES,
  getPermissionsForMode,
} from '@/types/userMode';

const STORAGE_KEY = 'lacylights-user-mode';

/**
 * Context type for user mode state and controls.
 */
interface UserModeContextType extends UserPermissions {
  /** Current user mode */
  mode: UserMode;
  /** Set the user mode */
  setMode: (mode: UserMode) => void;
}

const UserModeContext = createContext<UserModeContextType | undefined>(
  undefined
);

/**
 * Validates that a string is a valid UserMode.
 * Uses the ALL_MODES constant for type safety and maintainability.
 *
 * @param value - The value to validate
 * @returns True if the value is a valid UserMode
 */
function isValidUserMode(value: string | null): value is UserMode {
  return value !== null && (ALL_MODES as readonly string[]).includes(value);
}

/**
 * Provider component for user mode state.
 *
 * Manages the current user mode and persists it to localStorage.
 * Provides permission helpers derived from the current mode.
 *
 * @example
 * ```tsx
 * <UserModeProvider>
 *   <App />
 * </UserModeProvider>
 * ```
 */
export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<UserMode>(DEFAULT_USER_MODE);

  // Load mode from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidUserMode(stored)) {
        setModeState(stored);
      }
    } catch {
      // localStorage may not be available (SSR, privacy mode, etc.)
    }
  }, []);

  // Set mode and persist to localStorage
  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // localStorage may not be available
    }
  }, []);

  // Compute permissions from current mode
  const permissions = useMemo(() => getPermissionsForMode(mode), [mode]);

  const value = useMemo<UserModeContextType>(
    () => ({
      mode,
      setMode,
      ...permissions,
    }),
    [mode, setMode, permissions]
  );

  return (
    <UserModeContext.Provider value={value}>
      {children}
    </UserModeContext.Provider>
  );
}

/**
 * Hook to access user mode state and permissions.
 *
 * @returns The current mode, setMode function, and permission booleans
 * @throws Error if used outside UserModeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, canPlayback, canEditContent } = useUserMode();
 *
 *   return (
 *     <button disabled={!canPlayback}>
 *       Play
 *     </button>
 *   );
 * }
 * ```
 */
export function useUserMode(): UserModeContextType {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error('useUserMode must be used within a UserModeProvider');
  }
  return context;
}
