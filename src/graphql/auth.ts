import { gql } from '@apollo/client';

// =============================================================================
// FRAGMENTS
// =============================================================================

export const AUTH_USER_FRAGMENT = gql`
  fragment AuthUserFields on AuthUser {
    id
    email
    name
    phone
    role
    emailVerified
    phoneVerified
    isActive
    lastLoginAt
    createdAt
    updatedAt
    groups {
      id
      name
      permissions
    }
    permissions
  }
`;

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    name
    role
    createdAt
  }
`;

export const SESSION_FRAGMENT = gql`
  fragment SessionFields on Session {
    id
    userId
    deviceId
    ipAddress
    userAgent
    expiresAt
    lastActivityAt
    createdAt
  }
`;

export const DEVICE_FRAGMENT = gql`
  fragment DeviceFields on Device {
    id
    name
    fingerprint
    isAuthorized
    defaultRole
    lastSeenAt
    lastIPAddress
    createdAt
    updatedAt
    defaultUser {
      id
      email
      name
    }
  }
`;

export const USER_GROUP_FRAGMENT = gql`
  fragment UserGroupFields on UserGroup {
    id
    name
    description
    permissions
    memberCount
    createdAt
    updatedAt
  }
`;

export const AUTH_SETTINGS_FRAGMENT = gql`
  fragment AuthSettingsFields on AuthSettings {
    authEnabled
    allowedMethods
    deviceAuthEnabled
    sessionDurationHours
    passwordMinLength
    requireEmailVerification
  }
`;

// =============================================================================
// QUERIES
// =============================================================================

/** Get the currently authenticated user */
export const GET_ME = gql`
  ${AUTH_USER_FRAGMENT}
  query GetMe {
    me {
      ...AuthUserFields
    }
  }
`;

/** Check if authentication is enabled */
export const GET_AUTH_ENABLED = gql`
  query GetAuthEnabled {
    authEnabled
  }
`;

/** Get global authentication settings (admin only) */
export const GET_AUTH_SETTINGS = gql`
  ${AUTH_SETTINGS_FRAGMENT}
  query GetAuthSettings {
    authSettings {
      ...AuthSettingsFields
    }
  }
`;

/** Get the current user's active sessions */
export const GET_MY_SESSIONS = gql`
  ${SESSION_FRAGMENT}
  query GetMySessions {
    mySessions {
      ...SessionFields
    }
  }
`;

/** Check if a device is authorized by fingerprint */
export const CHECK_DEVICE_AUTHORIZATION = gql`
  ${DEVICE_FRAGMENT}
  ${USER_FRAGMENT}
  query CheckDeviceAuthorization($fingerprint: String!) {
    checkDeviceAuthorization(fingerprint: $fingerprint) {
      isAuthorized
      isPending
      device {
        ...DeviceFields
      }
      defaultUser {
        ...UserFields
      }
    }
  }
`;

// =============================================================================
// ADMIN QUERIES
// =============================================================================

/** List all users (admin only) */
export const GET_USERS = gql`
  ${USER_FRAGMENT}
  query GetUsers($page: Int, $perPage: Int) {
    users(page: $page, perPage: $perPage) {
      ...UserFields
    }
  }
`;

/** Get a user by ID (admin only) */
export const GET_USER = gql`
  ${USER_FRAGMENT}
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserFields
    }
  }
`;

/** List all user groups (admin only) */
export const GET_USER_GROUPS = gql`
  ${USER_GROUP_FRAGMENT}
  query GetUserGroups {
    userGroups {
      ...UserGroupFields
    }
  }
`;

/** Get a user group by ID (admin only) */
export const GET_USER_GROUP = gql`
  ${USER_GROUP_FRAGMENT}
  query GetUserGroup($id: ID!) {
    userGroup(id: $id) {
      ...UserGroupFields
    }
  }
`;

/** List all devices (admin only) */
export const GET_DEVICES = gql`
  ${DEVICE_FRAGMENT}
  query GetDevices {
    devices {
      ...DeviceFields
    }
  }
`;

/** Get a device by ID (admin only) */
export const GET_DEVICE = gql`
  ${DEVICE_FRAGMENT}
  query GetDevice($id: ID!) {
    device(id: $id) {
      ...DeviceFields
    }
  }
`;

// =============================================================================
// AUTH MUTATIONS
// =============================================================================

/** Register a new user with email and password */
export const REGISTER = gql`
  ${USER_FRAGMENT}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        ...UserFields
      }
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/** Login with email and password */
export const LOGIN = gql`
  ${USER_FRAGMENT}
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        ...UserFields
      }
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/** Logout the current session */
export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

/** Logout all sessions for the current user */
export const LOGOUT_ALL = gql`
  mutation LogoutAll {
    logoutAll
  }
`;

/** Refresh the access token using a refresh token */
export const REFRESH_TOKEN = gql`
  ${USER_FRAGMENT}
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      user {
        ...UserFields
      }
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

/** Change the current user's password */
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

/** Request a password reset email */
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

/** Reset password using a reset token */
export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

/** Request email verification */
export const REQUEST_EMAIL_VERIFICATION = gql`
  mutation RequestEmailVerification {
    requestEmailVerification
  }
`;

/** Verify email with token */
export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

// =============================================================================
// OAUTH MUTATIONS
// =============================================================================

/** Sign in with Apple */
export const APPLE_SIGN_IN = gql`
  ${USER_FRAGMENT}
  mutation AppleSignIn($identityToken: String!, $authorizationCode: String!) {
    appleSignIn(identityToken: $identityToken, authorizationCode: $authorizationCode) {
      user {
        ...UserFields
      }
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

// =============================================================================
// DEVICE AUTH MUTATIONS
// =============================================================================

/** Register a device for device-based auth */
export const REGISTER_DEVICE = gql`
  ${DEVICE_FRAGMENT}
  mutation RegisterDevice($fingerprint: String!, $name: String!) {
    registerDevice(fingerprint: $fingerprint, name: $name) {
      ...DeviceFields
    }
  }
`;

/** Authorize a device using an authorization code */
export const AUTHORIZE_DEVICE = gql`
  ${USER_FRAGMENT}
  mutation AuthorizeDevice($fingerprint: String!, $authorizationCode: String!) {
    authorizeDevice(fingerprint: $fingerprint, authorizationCode: $authorizationCode) {
      user {
        ...UserFields
      }
      accessToken
      refreshToken
      expiresAt
    }
  }
`;

// =============================================================================
// ADMIN USER MUTATIONS
// =============================================================================

/** Create a new user (admin only) */
export const CREATE_USER = gql`
  ${USER_FRAGMENT}
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserFields
    }
  }
`;

/** Update a user (admin only) */
export const UPDATE_USER = gql`
  ${USER_FRAGMENT}
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      ...UserFields
    }
  }
`;

/** Delete a user (admin only) */
export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// =============================================================================
// ADMIN GROUP MUTATIONS
// =============================================================================

/** Create a user group (admin only) */
export const CREATE_USER_GROUP = gql`
  ${USER_GROUP_FRAGMENT}
  mutation CreateUserGroup($input: CreateUserGroupInput!) {
    createUserGroup(input: $input) {
      ...UserGroupFields
    }
  }
`;

/** Update a user group (admin only) */
export const UPDATE_USER_GROUP = gql`
  ${USER_GROUP_FRAGMENT}
  mutation UpdateUserGroup($id: ID!, $input: UpdateUserGroupInput!) {
    updateUserGroup(id: $id, input: $input) {
      ...UserGroupFields
    }
  }
`;

/** Delete a user group (admin only) */
export const DELETE_USER_GROUP = gql`
  mutation DeleteUserGroup($id: ID!) {
    deleteUserGroup(id: $id)
  }
`;

/** Add a user to a group (admin only) */
export const ADD_USER_TO_GROUP = gql`
  mutation AddUserToGroup($userId: ID!, $groupId: ID!) {
    addUserToGroup(userId: $userId, groupId: $groupId)
  }
`;

/** Remove a user from a group (admin only) */
export const REMOVE_USER_FROM_GROUP = gql`
  mutation RemoveUserFromGroup($userId: ID!, $groupId: ID!) {
    removeUserFromGroup(userId: $userId, groupId: $groupId)
  }
`;

// =============================================================================
// ADMIN DEVICE MUTATIONS
// =============================================================================

/** Create a device authorization code (admin only) */
export const CREATE_DEVICE_AUTH_CODE = gql`
  mutation CreateDeviceAuthCode($deviceId: ID!) {
    createDeviceAuthCode(deviceId: $deviceId) {
      code
      expiresAt
      deviceId
    }
  }
`;

/** Update a device (admin only) */
export const UPDATE_DEVICE = gql`
  ${DEVICE_FRAGMENT}
  mutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
    updateDevice(id: $id, input: $input) {
      ...DeviceFields
    }
  }
`;

/** Revoke a device's authorization (admin only) */
export const REVOKE_DEVICE = gql`
  mutation RevokeDevice($id: ID!) {
    revokeDevice(id: $id)
  }
`;

// =============================================================================
// ADMIN SESSION MUTATIONS
// =============================================================================

/** Revoke a specific session (admin only) */
export const REVOKE_SESSION = gql`
  mutation RevokeSession($sessionId: ID!) {
    revokeSession(sessionId: $sessionId)
  }
`;

/** Revoke all sessions for a user (admin only) */
export const REVOKE_ALL_USER_SESSIONS = gql`
  mutation RevokeAllUserSessions($userId: ID!) {
    revokeAllUserSessions(userId: $userId)
  }
`;

// =============================================================================
// ADMIN SETTINGS MUTATIONS
// =============================================================================

/** Update authentication settings (admin only) */
export const UPDATE_AUTH_SETTINGS = gql`
  ${AUTH_SETTINGS_FRAGMENT}
  mutation UpdateAuthSettings($input: UpdateAuthSettingsInput!) {
    updateAuthSettings(input: $input) {
      ...AuthSettingsFields
    }
  }
`;
