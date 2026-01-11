import {
  UserMode,
  USER_MODE_LABELS,
  USER_MODE_DESCRIPTIONS,
  MODE_PERMISSIONS,
  getPermissionsForMode,
  hasPermission,
  DEFAULT_USER_MODE,
  AVAILABLE_MODES,
  ALL_MODES,
} from '../userMode';

describe('userMode types', () => {
  describe('USER_MODE_LABELS', () => {
    it('has labels for all modes', () => {
      expect(USER_MODE_LABELS.admin).toBe('Admin');
      expect(USER_MODE_LABELS.editor).toBe('Editor');
      expect(USER_MODE_LABELS.player).toBe('Player');
      expect(USER_MODE_LABELS.watcher).toBe('Watcher');
    });
  });

  describe('USER_MODE_DESCRIPTIONS', () => {
    it('has descriptions for all modes', () => {
      expect(USER_MODE_DESCRIPTIONS.admin).toBeDefined();
      expect(USER_MODE_DESCRIPTIONS.editor).toBeDefined();
      expect(USER_MODE_DESCRIPTIONS.player).toBeDefined();
      expect(USER_MODE_DESCRIPTIONS.watcher).toBeDefined();
    });
  });

  describe('MODE_PERMISSIONS', () => {
    it('admin has all permissions', () => {
      expect(MODE_PERMISSIONS.admin.canManageUsers).toBe(true);
      expect(MODE_PERMISSIONS.admin.canEditContent).toBe(true);
      expect(MODE_PERMISSIONS.admin.canPlayback).toBe(true);
      expect(MODE_PERMISSIONS.admin.canView).toBe(true);
    });

    it('editor cannot manage users', () => {
      expect(MODE_PERMISSIONS.editor.canManageUsers).toBe(false);
      expect(MODE_PERMISSIONS.editor.canEditContent).toBe(true);
      expect(MODE_PERMISSIONS.editor.canPlayback).toBe(true);
      expect(MODE_PERMISSIONS.editor.canView).toBe(true);
    });

    it('player can only playback and view', () => {
      expect(MODE_PERMISSIONS.player.canManageUsers).toBe(false);
      expect(MODE_PERMISSIONS.player.canEditContent).toBe(false);
      expect(MODE_PERMISSIONS.player.canPlayback).toBe(true);
      expect(MODE_PERMISSIONS.player.canView).toBe(true);
    });

    it('watcher can only view', () => {
      expect(MODE_PERMISSIONS.watcher.canManageUsers).toBe(false);
      expect(MODE_PERMISSIONS.watcher.canEditContent).toBe(false);
      expect(MODE_PERMISSIONS.watcher.canPlayback).toBe(false);
      expect(MODE_PERMISSIONS.watcher.canView).toBe(true);
    });
  });

  describe('getPermissionsForMode', () => {
    it('returns correct permissions for each mode', () => {
      const adminPerms = getPermissionsForMode('admin');
      expect(adminPerms.canManageUsers).toBe(true);
      expect(adminPerms.canEditContent).toBe(true);

      const watcherPerms = getPermissionsForMode('watcher');
      expect(watcherPerms.canManageUsers).toBe(false);
      expect(watcherPerms.canPlayback).toBe(false);
      expect(watcherPerms.canView).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('returns true when mode has permission', () => {
      expect(hasPermission('admin', 'canManageUsers')).toBe(true);
      expect(hasPermission('editor', 'canEditContent')).toBe(true);
      expect(hasPermission('player', 'canPlayback')).toBe(true);
      expect(hasPermission('watcher', 'canView')).toBe(true);
    });

    it('returns false when mode lacks permission', () => {
      expect(hasPermission('editor', 'canManageUsers')).toBe(false);
      expect(hasPermission('player', 'canEditContent')).toBe(false);
      expect(hasPermission('watcher', 'canPlayback')).toBe(false);
    });
  });

  describe('DEFAULT_USER_MODE', () => {
    it('defaults to editor', () => {
      expect(DEFAULT_USER_MODE).toBe('editor');
    });
  });

  describe('AVAILABLE_MODES', () => {
    it('includes editor and watcher', () => {
      expect(AVAILABLE_MODES).toContain('editor');
      expect(AVAILABLE_MODES).toContain('watcher');
    });

    it('does not include admin or player (not yet implemented)', () => {
      expect(AVAILABLE_MODES).not.toContain('admin');
      expect(AVAILABLE_MODES).not.toContain('player');
    });
  });

  describe('ALL_MODES', () => {
    it('includes all four modes', () => {
      expect(ALL_MODES).toContain('admin');
      expect(ALL_MODES).toContain('editor');
      expect(ALL_MODES).toContain('player');
      expect(ALL_MODES).toContain('watcher');
      expect(ALL_MODES).toHaveLength(4);
    });
  });

  describe('Permission hierarchy', () => {
    it('follows proper permission hierarchy', () => {
      // Admin > Editor > Player > Watcher
      const modes: UserMode[] = ['admin', 'editor', 'player', 'watcher'];

      // canView should be true for all
      for (const mode of modes) {
        expect(hasPermission(mode, 'canView')).toBe(true);
      }

      // canPlayback should be true for admin, editor, player
      expect(hasPermission('admin', 'canPlayback')).toBe(true);
      expect(hasPermission('editor', 'canPlayback')).toBe(true);
      expect(hasPermission('player', 'canPlayback')).toBe(true);
      expect(hasPermission('watcher', 'canPlayback')).toBe(false);

      // canEditContent should be true for admin, editor
      expect(hasPermission('admin', 'canEditContent')).toBe(true);
      expect(hasPermission('editor', 'canEditContent')).toBe(true);
      expect(hasPermission('player', 'canEditContent')).toBe(false);
      expect(hasPermission('watcher', 'canEditContent')).toBe(false);

      // canManageUsers should be true only for admin
      expect(hasPermission('admin', 'canManageUsers')).toBe(true);
      expect(hasPermission('editor', 'canManageUsers')).toBe(false);
      expect(hasPermission('player', 'canManageUsers')).toBe(false);
      expect(hasPermission('watcher', 'canManageUsers')).toBe(false);
    });
  });
});
