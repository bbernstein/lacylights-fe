import { UserRole } from './index';

// =============================================================================
// ENUMS
// =============================================================================

/** OAuth provider type for authentication */
export enum OAuthProvider {
  APPLE = 'APPLE',
}

/** Type of verification token */
export enum VerificationTokenType {
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  PHONE_VERIFY = 'PHONE_VERIFY',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/** Default role for device-authenticated users */
export enum DeviceRole {
  PLAYER = 'PLAYER',
  OPERATOR = 'OPERATOR',
  DESIGNER = 'DESIGNER',
}

// =============================================================================
// AUTH TYPES
// =============================================================================

/** Authentication result returned after login or registration */
export interface AuthPayload {
  /** The authenticated user */
  user: AuthUser;
  /** JWT access token for API requests */
  accessToken: string;
  /** JWT refresh token for obtaining new access tokens */
  refreshToken: string;
  /** When the access token expires */
  expiresAt: string;
}

/** Extended user information for authenticated context */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  /** User's permission groups */
  groups: UserGroup[];
  /** Effective permissions from role and groups */
  permissions: string[];
}

/** Role within a group */
export enum GroupMemberRole {
  MEMBER = 'MEMBER',
  GROUP_ADMIN = 'GROUP_ADMIN',
}

/** Status of a group invitation */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

/** User group for permission management */
export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  /** Array of permission strings */
  permissions: string[];
  /** Number of members in this group */
  memberCount: number;
  /** Whether this is a personal group auto-created for a user */
  isPersonal: boolean;
  /** Members of this group */
  members?: GroupMember[];
  /** Projects owned by this group */
  projects?: { id: string; name: string }[];
  /** Devices assigned to this group */
  devices?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

/** A member within a group */
export interface GroupMember {
  id: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
  };
  role: GroupMemberRole;
  joinedAt: string;
}

/** An invitation to join a group */
export interface GroupInvitation {
  id: string;
  group: {
    id: string;
    name: string;
    isPersonal: boolean;
  };
  email: string;
  invitedBy: {
    id: string;
    email: string;
    name?: string;
  };
  role: GroupMemberRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

/** User session information */
export interface Session {
  id: string;
  userId: string;
  /** Device associated with this session (if device auth) */
  deviceId?: string;
  device?: Device;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
}

/** Pre-authorized device for device-based authentication */
export interface Device {
  id: string;
  name: string;
  /** Unique device fingerprint */
  fingerprint: string;
  /** Whether this device is authorized */
  isAuthorized: boolean;
  /** Default user to authenticate as when device connects */
  defaultUser?: {
    id: string;
    email: string;
    name?: string;
  };
  /** Default role when no user is specified */
  defaultRole: DeviceRole;
  lastSeenAt?: string;
  lastIPAddress?: string;
  createdAt: string;
  updatedAt: string;
}

/** Result of checking device authorization status */
export interface DeviceAuthStatus {
  /** Whether the device is known and authorized */
  isAuthorized: boolean;
  /** Whether the device is known but not yet authorized */
  isPending: boolean;
  /** The device record if it exists */
  device?: Device;
  /** Default user for auto-login (if authorized) */
  defaultUser?: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    createdAt: string;
  };
}

/** Global authentication settings */
export interface AuthSettings {
  /** Whether authentication is enabled */
  authEnabled: boolean;
  /** Allowed authentication methods */
  allowedMethods: string[];
  /** Whether device authentication is enabled */
  deviceAuthEnabled: boolean;
  /** Session duration in hours */
  sessionDurationHours: number;
  /** Minimum password length */
  passwordMinLength: number;
  /** Whether email verification is required */
  requireEmailVerification: boolean;
}

/** Device authorization code for pre-authorizing devices */
export interface DeviceAuthCode {
  /** The authorization code (6 digits) */
  code: string;
  /** When the code expires */
  expiresAt: string;
  /** Device ID this code is for */
  deviceId: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

/** Input for user registration */
export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

/** Input for creating a new user (admin only) */
export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

/** Input for updating a user (admin only) */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

/** Input for creating a user group */
export interface CreateUserGroupInput {
  name: string;
  description?: string;
  permissions?: string[];
}

/** Input for updating a user group */
export interface UpdateUserGroupInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

/** Input for updating a device */
export interface UpdateDeviceInput {
  name?: string;
  defaultUserId?: string;
  defaultRole?: DeviceRole;
  isAuthorized?: boolean;
}

/** Input for updating authentication settings */
export interface UpdateAuthSettingsInput {
  authEnabled?: boolean;
  allowedMethods?: string[];
  deviceAuthEnabled?: boolean;
  sessionDurationHours?: number;
  passwordMinLength?: number;
  requireEmailVerification?: boolean;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/** Auth context value provided to components */
export interface AuthContextType {
  /** Current authenticated user (null if not authenticated) */
  user: AuthUser | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is enabled globally */
  isAuthEnabled: boolean;
  /** Whether initial auth check is in progress */
  isLoading: boolean;
  /** Login with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Logout current session */
  logout: () => Promise<void>;
  /** Logout all sessions */
  logoutAll: () => Promise<void>;
  /** Refresh the current session */
  refresh: () => Promise<void>;
  /** Register a new account */
  register: (input: RegisterInput) => Promise<void>;
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean;
  /** Check if user is admin */
  isAdmin: boolean;
}
