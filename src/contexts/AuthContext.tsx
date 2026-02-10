'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useLazyQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_ME,
  GET_AUTH_ENABLED,
  LOGIN,
  LOGOUT,
  LOGOUT_ALL,
  REFRESH_TOKEN,
  REGISTER,
  CHECK_DEVICE_AUTHORIZATION,
} from '@/graphql/auth';
import type {
  AuthUser,
  AuthContextType,
  RegisterInput,
  DeviceAuthStatus,
  UserGroup,
} from '@/types/auth';
import { UserRole } from '@/types';
import { getOrCreateDeviceId } from '@/lib/device';

// Storage keys
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_ENABLED_COOKIE = 'lacylights_auth_enabled';
const AUTH_TOKEN_COOKIE = 'lacylights_token';
const DEVICE_AUTH_COOKIE = 'lacylights_device_auth';

/**
 * Authentication context for managing user sessions.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Sets a cookie that the middleware can read to know if auth is enabled.
 * This allows the server-side middleware to redirect unauthenticated users.
 */
function setAuthEnabledCookie(enabled: boolean): void {
  try {
    if (typeof document !== 'undefined') {
      const value = enabled ? 'true' : 'false';
      // Set cookie with path=/ so it's available to all routes
      // Use SameSite=Lax for security while allowing top-level navigation
      document.cookie = `${AUTH_ENABLED_COOKIE}=${value}; path=/; SameSite=Lax`;
    }
  } catch {
    // Cookie operations may fail in some environments
  }
}

/**
 * Clears the auth enabled cookie.
 */
function clearAuthEnabledCookie(): void {
  try {
    if (typeof document !== 'undefined') {
      // Clear by setting expiration in the past
      document.cookie = `${AUTH_ENABLED_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch {
    // Cookie operations may fail in some environments
  }
}

/**
 * Sets a session indicator cookie so middleware can detect authenticated state.
 * This is NOT the actual JWT - just a flag that a session exists.
 * The actual token is stored in localStorage for API requests.
 */
function setSessionCookie(): void {
  try {
    if (typeof document !== 'undefined') {
      // Set a session cookie (expires when browser closes or after 7 days)
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      document.cookie = `${AUTH_TOKEN_COOKIE}=1; path=/; SameSite=Lax; expires=${expires.toUTCString()}`;
    }
  } catch {
    // Cookie operations may fail in some environments
  }
}

/**
 * Clears the session indicator cookie.
 */
function clearSessionCookie(): void {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch {
    // Cookie operations may fail in some environments
  }
}

/**
 * Stores tokens in localStorage and sets a session cookie for middleware.
 * In future, these could be migrated to HTTP-only cookies set by the server.
 */
function storeTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Set session cookie so middleware knows we're authenticated
    setSessionCookie();
  } catch {
    // localStorage may not be available (SSR, privacy mode, etc.)
  }
}

/**
 * Clears tokens from localStorage and the session cookie.
 */
function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Clear session cookie
    clearSessionCookie();
  } catch {
    // localStorage may not be available
  }
}

/**
 * Gets the refresh token from localStorage.
 */
function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets a cookie to indicate device-level authentication for middleware.
 */
function setDeviceAuthCookie(): void {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${DEVICE_AUTH_COOKIE}=1; path=/; SameSite=Lax`;
    }
  } catch {
    // Cookie operations may fail in some environments
  }
}

/**
 * Clears the device auth cookie.
 */
function clearDeviceAuthCookie(): void {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${DEVICE_AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch {
    // Cookie operations may fail in some environments
  }
}

/**
 * Builds an AuthUser from device authorization data.
 * Maps the device's defaultUser and groups into the AuthUser shape.
 */
function buildDeviceAuthUser(deviceAuth: DeviceAuthStatus): AuthUser | null {
  const { device, defaultUser } = deviceAuth;
  if (!defaultUser) return null;

  const now = new Date().toISOString();

  // Map device groups to UserGroup format
  const groups: UserGroup[] = (device?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    isPersonal: g.isPersonal,
    description: undefined,
    permissions: [],
    memberCount: 0,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    id: defaultUser.id,
    email: defaultUser.email,
    name: defaultUser.name,
    role: defaultUser.role,
    emailVerified: false,
    phoneVerified: false,
    isActive: true,
    createdAt: defaultUser.createdAt,
    updatedAt: now,
    groups,
    permissions: [],
  };
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for authentication state.
 *
 * Manages user authentication state, including:
 * - Checking if auth is enabled globally
 * - Loading current user on mount
 * - Login/logout functionality
 * - Token refresh
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const apolloClient = useApolloClient();

  // Core state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthEnabled, setIsAuthEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDeviceAuth, setIsDeviceAuth] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  // GraphQL queries and mutations
  const [checkAuthEnabled] = useLazyQuery(GET_AUTH_ENABLED, {
    fetchPolicy: 'network-only',
  });

  const [fetchMe] = useLazyQuery(GET_ME, {
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN);
  const [logoutMutation] = useMutation(LOGOUT);
  const [logoutAllMutation] = useMutation(LOGOUT_ALL);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN);
  const [registerMutation] = useMutation(REGISTER);

  /**
   * Attempt device-based authentication fallback.
   * Queries the backend to check if this device is authorized and has a default user.
   * Returns true if device auth succeeded.
   */
  const tryDeviceAuth = useCallback(async (): Promise<boolean> => {
    try {
      const fingerprint = getOrCreateDeviceId();
      if (!fingerprint) return false;

      const { data } = await apolloClient.query({
        query: CHECK_DEVICE_AUTHORIZATION,
        variables: { fingerprint },
        fetchPolicy: 'network-only',
      });

      const deviceAuth = data?.checkDeviceAuthorization as DeviceAuthStatus | undefined;
      if (deviceAuth?.isAuthorized && deviceAuth.defaultUser) {
        const deviceUser = buildDeviceAuthUser(deviceAuth);
        if (deviceUser) {
          setUser(deviceUser);
          setIsDeviceAuth(true);
          setDeviceName(deviceAuth.device?.name ?? null);
          setDeviceAuthCookie();
          return true;
        }
      }
    } catch {
      // Device auth check failed - silently continue
    }
    return false;
  }, [apolloClient]);

  /**
   * Initialize auth state on mount.
   * Checks if auth is enabled and loads current user if token exists.
   * Falls back to device auth if JWT auth fails.
   */
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);

      try {
        // First, check if auth is enabled
        const { data: authEnabledData } = await checkAuthEnabled();
        const authEnabled = authEnabledData?.authEnabled ?? false;
        setIsAuthEnabled(authEnabled);
        setAuthEnabledCookie(authEnabled);

        // If auth is not enabled, we're done
        if (!authEnabled) {
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        // If auth is enabled and we have a token, try to get current user
        let jwtAuthSucceeded = false;
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          try {
            const { data: meData } = await fetchMe();
            if (meData?.me) {
              setUser(meData.me);
              // Ensure session cookie is set (may have expired between sessions)
              setSessionCookie();
              jwtAuthSucceeded = true;
            } else {
              // Token is invalid or expired, try to refresh
              const refreshToken = getRefreshToken();
              if (refreshToken) {
                try {
                  const { data: refreshData } = await refreshTokenMutation({
                    variables: { refreshToken },
                  });
                  if (refreshData?.refreshToken) {
                    storeTokens(
                      refreshData.refreshToken.accessToken,
                      refreshData.refreshToken.refreshToken
                    );
                    // Fetch full user profile after refresh
                    const { data: refreshedMeData } = await fetchMe();
                    if (refreshedMeData?.me) {
                      setUser(refreshedMeData.me);
                      jwtAuthSucceeded = true;
                    }
                  } else {
                    // Refresh failed, clear tokens
                    clearTokens();
                  }
                } catch {
                  // Refresh failed, clear tokens
                  clearTokens();
                }
              }
            }
          } catch {
            // Token validation failed, try to refresh
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              try {
                const { data: refreshData } = await refreshTokenMutation({
                  variables: { refreshToken },
                });
                if (refreshData?.refreshToken) {
                  storeTokens(
                    refreshData.refreshToken.accessToken,
                    refreshData.refreshToken.refreshToken
                  );
                  // Fetch full user profile after refresh
                  const { data: refreshedMeData } = await fetchMe();
                  if (refreshedMeData?.me) {
                    setUser(refreshedMeData.me);
                    jwtAuthSucceeded = true;
                  }
                } else {
                  clearTokens();
                }
              } catch {
                clearTokens();
              }
            }
          }
        }

        // If JWT auth didn't succeed, try device auth as fallback
        if (!jwtAuthSucceeded) {
          await tryDeviceAuth();
        }
      } catch (error) {
        // If we can't check auth status, assume it's disabled
        console.error('Failed to initialize auth:', error);
        setIsAuthEnabled(false);
        clearAuthEnabledCookie();
      }

      setIsLoading(false);
      setIsInitialized(true);
    }

    initialize();
  }, [checkAuthEnabled, fetchMe, refreshTokenMutation, tryDeviceAuth]);

  /**
   * Login with email and password.
   */
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { email, password },
    });

    if (data?.login) {
      storeTokens(data.login.accessToken, data.login.refreshToken);
      // Clear device auth state — we're upgrading to JWT
      setIsDeviceAuth(false);
      setDeviceName(null);
      clearDeviceAuthCookie();
      // Fetch full user profile after storing tokens
      const { data: meData } = await fetchMe();
      if (meData?.me) {
        setUser(meData.me);
      }
      // Clear Apollo cache to refetch any queries that depend on auth
      await apolloClient.resetStore();
    } else {
      throw new Error('Login failed');
    }
  }, [loginMutation, fetchMe, apolloClient]);

  /**
   * Logout current session.
   */
  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } catch {
      // Ignore errors - we're logging out anyway
    }

    clearTokens();
    setUser(null);
    setIsDeviceAuth(false);
    setDeviceName(null);
    clearDeviceAuthCookie();
    // Clear Apollo cache
    await apolloClient.resetStore();

    // Try device auth fallback — approved devices stay authenticated
    await tryDeviceAuth();
  }, [logoutMutation, apolloClient, tryDeviceAuth]);

  /**
   * Logout all sessions for current user.
   */
  const logoutAll = useCallback(async () => {
    try {
      await logoutAllMutation();
    } catch {
      // Ignore errors - we're logging out anyway
    }

    clearTokens();
    setUser(null);
    setIsDeviceAuth(false);
    setDeviceName(null);
    clearDeviceAuthCookie();
    // Clear Apollo cache
    await apolloClient.resetStore();

    // Try device auth fallback — approved devices stay authenticated
    await tryDeviceAuth();
  }, [logoutAllMutation, apolloClient, tryDeviceAuth]);

  /**
   * Refresh the current session.
   */
  const refresh = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const { data } = await refreshTokenMutation({
      variables: { refreshToken },
    });

    if (data?.refreshToken) {
      storeTokens(data.refreshToken.accessToken, data.refreshToken.refreshToken);
      // Fetch full user profile after storing new tokens
      const { data: meData } = await fetchMe();
      if (meData?.me) {
        setUser(meData.me);
      }
    } else {
      throw new Error('Token refresh failed');
    }
  }, [refreshTokenMutation, fetchMe]);

  /**
   * Register a new account.
   */
  const register = useCallback(async (input: RegisterInput) => {
    const { data } = await registerMutation({
      variables: { input },
    });

    if (data?.register) {
      storeTokens(data.register.accessToken, data.register.refreshToken);
      // Fetch full user profile after storing tokens
      const { data: meData } = await fetchMe();
      if (meData?.me) {
        setUser(meData.me);
      }
      // Clear Apollo cache to refetch any queries that depend on auth
      await apolloClient.resetStore();
    } else {
      throw new Error('Registration failed');
    }
  }, [registerMutation, fetchMe, apolloClient]);

  /**
   * Check if user has a specific permission.
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    // Admins have all permissions
    if (user.role === UserRole.ADMIN) return true;
    // Check explicit permissions (safely handle undefined permissions)
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  /**
   * Whether the current user is an admin.
   */
  const isAdmin = useMemo(() => {
    return user?.role === UserRole.ADMIN;
  }, [user]);

  /**
   * Whether the user is authenticated.
   */
  const isAuthenticated = useMemo(() => {
    return user !== null;
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    isAuthEnabled,
    isLoading,
    isDeviceAuth,
    deviceName,
    login,
    logout,
    logoutAll,
    refresh,
    register,
    hasPermission,
    isAdmin,
  }), [
    user,
    isAuthenticated,
    isAuthEnabled,
    isLoading,
    isDeviceAuth,
    deviceName,
    login,
    logout,
    logoutAll,
    refresh,
    register,
    hasPermission,
    isAdmin,
  ]);

  // Don't render children until we've initialized
  // This prevents flash of unauthenticated content
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and actions.
 *
 * @returns Authentication context with user, actions, and helpers
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *
 *   return (
 *     <div>
 *       Welcome, {user?.name}!
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if the user can access a resource.
 * Returns true if auth is disabled or user has permission.
 *
 * @param permission - Permission string to check
 * @returns Whether the user can access the resource
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const canAccess = useCanAccess('admin.users.manage');
 *
 *   if (!canAccess) {
 *     return <AccessDenied />;
 *   }
 *
 *   return <AdminContent />;
 * }
 * ```
 */
export function useCanAccess(permission: string): boolean {
  const { isAuthEnabled, hasPermission } = useAuth();

  // If auth is disabled, allow access
  if (!isAuthEnabled) {
    return true;
  }

  return hasPermission(permission);
}

/**
 * Hook to require authentication.
 * Returns loading state and redirect info.
 *
 * @returns Object with loading state and whether to redirect
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isLoading, shouldRedirect } = useRequireAuth();
 *
 *   if (isLoading) return <Loading />;
 *   if (shouldRedirect) {
 *     redirect('/login');
 *   }
 *
 *   return <ProtectedContent />;
 * }
 * ```
 */
export function useRequireAuth(): { isLoading: boolean; shouldRedirect: boolean } {
  const { isLoading, isAuthEnabled, isAuthenticated } = useAuth();

  return {
    isLoading,
    // Only redirect if auth is enabled and user is not authenticated
    shouldRedirect: !isLoading && isAuthEnabled && !isAuthenticated,
  };
}
