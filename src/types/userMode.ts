/**
 * User mode system for LacyLights.
 *
 * Defines the available user modes and their associated permissions.
 * See docs/USER_MODE_SYSTEM_PLAN.md for the full implementation plan.
 */

/**
 * Available user modes in the system.
 *
 * - admin: Full system access including user management (future)
 * - editor: Can create and modify all lighting content (current default)
 * - player: Can run shows but not modify content
 * - watcher: Read-only view of all content
 */
export type UserMode = 'admin' | 'editor' | 'player' | 'watcher';

/**
 * Human-readable labels for each user mode.
 */
export const USER_MODE_LABELS: Record<UserMode, string> = {
  admin: 'Admin',
  editor: 'Editor',
  player: 'Player',
  watcher: 'Watcher',
};

/**
 * Descriptions for each user mode, explaining what the mode allows.
 */
export const USER_MODE_DESCRIPTIONS: Record<UserMode, string> = {
  admin: 'Full system access including user management',
  editor: 'Create and modify all lighting content',
  player: 'Run shows without modifying content',
  watcher: 'View-only mode with no modifications allowed',
};

/**
 * Permissions that can be derived from a user mode.
 */
export interface UserPermissions {
  /** Can create, edit, delete users and assign roles (Admin only) */
  canManageUsers: boolean;
  /** Can create/edit/delete fixtures, scenes, scene boards, cue lists, cues (Admin, Editor) */
  canEditContent: boolean;
  /** Can advance cues, activate scenes, start/stop cue lists (Admin, Editor, Player) */
  canPlayback: boolean;
  /** Can view all fixtures, scenes, scene boards, cue lists (All modes) */
  canView: boolean;
}

/**
 * Permission matrix mapping each mode to its permissions.
 */
export const MODE_PERMISSIONS: Record<UserMode, UserPermissions> = {
  admin: {
    canManageUsers: true,
    canEditContent: true,
    canPlayback: true,
    canView: true,
  },
  editor: {
    canManageUsers: false,
    canEditContent: true,
    canPlayback: true,
    canView: true,
  },
  player: {
    canManageUsers: false,
    canEditContent: false,
    canPlayback: true,
    canView: true,
  },
  watcher: {
    canManageUsers: false,
    canEditContent: false,
    canPlayback: false,
    canView: true,
  },
};

/**
 * Get permissions for a given user mode.
 *
 * @param mode - The user mode to get permissions for
 * @returns The permissions associated with the mode
 */
export function getPermissionsForMode(mode: UserMode): UserPermissions {
  return MODE_PERMISSIONS[mode];
}

/**
 * Check if a mode has a specific permission.
 *
 * @param mode - The user mode to check
 * @param permission - The permission to check for
 * @returns True if the mode has the permission
 */
export function hasPermission(
  mode: UserMode,
  permission: keyof UserPermissions
): boolean {
  return MODE_PERMISSIONS[mode][permission];
}

/**
 * The default user mode when none is set.
 */
export const DEFAULT_USER_MODE: UserMode = 'editor';

/**
 * Modes that are currently available for selection in the UI.
 * Admin and Player are defined but not yet fully implemented.
 */
export const AVAILABLE_MODES: UserMode[] = ['editor', 'watcher'];

/**
 * All defined modes (for future use when all modes are implemented).
 */
export const ALL_MODES: UserMode[] = ['admin', 'editor', 'player', 'watcher'];
