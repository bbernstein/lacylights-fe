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
  AVAILABLE_MODES,
  getPermissionsForMode,
} from '@/types/userMode';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';

const STORAGE_KEY = 'lacylights-user-mode';

/**
 * Context type for user mode state and controls.
 */
interface UserModeContextType extends UserPermissions {
  /** Current user mode */
  mode: UserMode;
  /** Set the user mode */
  setMode: (mode: UserMode) => void;
  /** Whether the mode is locked (cannot be changed, e.g., for admin users) */
  isModeLocked: boolean;
  /** Available modes the user can select from */
  selectableModes: UserMode[];
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
 * When authentication is enabled:
 * - Admin users are forced to 'admin' mode and cannot change it
 * - Regular users can select from non-admin modes
 *
 * When authentication is disabled:
 * - Uses localStorage-based mode selection (original behavior)
 *
 * @example
 * ```tsx
 * <UserModeProvider>
 *   <App />
 * </UserModeProvider>
 * ```
 */
export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthEnabled, isAuthenticated, user } = useAuth();
  const [localMode, setLocalMode] = useState<UserMode>(DEFAULT_USER_MODE);

  // Determine if the current user is an admin (when auth is enabled)
  const isAdmin = isAuthEnabled && isAuthenticated && user?.role === UserRole.ADMIN;

  // Determine if mode is locked (admin users can't change their mode)
  const isModeLocked = isAdmin;

  // Determine available modes for selection
  const selectableModes = useMemo<UserMode[]>(() => {
    if (!isAuthEnabled) {
      // Auth disabled: use the default available modes
      return AVAILABLE_MODES;
    }
    if (isAdmin) {
      // Admin: mode is locked, no selection available
      return [];
    }
    // Regular authenticated user: can select non-admin modes
    return AVAILABLE_MODES.filter((m) => m !== 'admin');
  }, [isAuthEnabled, isAdmin]);

  // Compute effective mode based on auth state
  const mode = useMemo<UserMode>(() => {
    if (isAdmin) {
      // Admin users are forced to 'admin' mode
      return 'admin';
    }
    // Use local mode for non-admin users
    return localMode;
  }, [isAdmin, localMode]);

  // Load mode from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidUserMode(stored)) {
        setLocalMode(stored);
      }
    } catch {
      // localStorage may not be available (SSR, privacy mode, etc.)
    }
  }, []);

  // Set mode and persist to localStorage
  const setMode = useCallback((newMode: UserMode) => {
    // Prevent changing mode if locked (admin users with auth enabled)
    if (isModeLocked) {
      return;
    }
    // Prevent selecting admin mode if auth is enabled and user is not an admin
    if (newMode === 'admin' && isAuthEnabled && !isAdmin) {
      return;
    }
    setLocalMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // localStorage may not be available
    }
  }, [isModeLocked, isAuthEnabled, isAdmin]);

  // Compute permissions from current mode
  const permissions = useMemo(() => getPermissionsForMode(mode), [mode]);

  const value = useMemo<UserModeContextType>(
    () => ({
      mode,
      setMode,
      isModeLocked,
      selectableModes,
      ...permissions,
    }),
    [mode, setMode, isModeLocked, selectableModes, permissions]
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
 * @returns The current mode, setMode function, permission booleans,
 *          isModeLocked flag, and selectableModes array
 * @throws Error if used outside UserModeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, canPlayback, canEditContent, isModeLocked, selectableModes } = useUserMode();
 *
 *   return (
 *     <div>
 *       <button disabled={!canPlayback}>Play</button>
 *       {!isModeLocked && (
 *         <select>
 *           {selectableModes.map(m => <option key={m}>{m}</option>)}
 *         </select>
 *       )}
 *     </div>
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
