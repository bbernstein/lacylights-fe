'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { GET_USERS, CREATE_USER, UPDATE_USER, DELETE_USER } from '@/graphql/auth';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating new user
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);

  // Form state for editing user
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.USER);

  const { data, loading, refetch } = useQuery(GET_USERS, {
    skip: !isOpen,
  });

  const [createUser, { loading: creating }] = useMutation(CREATE_USER, {
    onError: (err) => setError(`Failed to create user: ${err.message}`),
    onCompleted: () => {
      refetch();
      resetCreateForm();
    },
  });

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER, {
    onError: (err) => setError(`Failed to update user: ${err.message}`),
    onCompleted: () => {
      refetch();
      setEditingUser(null);
    },
  });

  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER, {
    onError: (err) => setError(`Failed to delete user: ${err.message}`),
    onCompleted: () => refetch(),
  });

  const users: User[] = data?.users || [];

  const resetCreateForm = () => {
    setIsCreating(false);
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setNewRole(UserRole.USER);
    setError(null);
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email);
    setEditRole(user.role);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setError(null);
  };

  const handleCreateUser = async () => {
    if (!newEmail.trim()) {
      setError('Email is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError(null);
    await createUser({
      variables: {
        input: {
          email: newEmail.trim(),
          password: newPassword,
          name: newName.trim() || undefined,
          role: newRole,
        },
      },
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editEmail.trim()) {
      setError('Email is required');
      return;
    }

    setError(null);
    await updateUser({
      variables: {
        id: editingUser.id,
        input: {
          email: editEmail.trim(),
          name: editName.trim() || undefined,
          role: editRole,
        },
      },
    });
  };

  const handleDeleteUser = async (user: User) => {
    // Prevent deleting yourself
    if (user.id === currentUser?.id) {
      setError('You cannot delete your own account');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.name || user.email}"?`)) {
      return;
    }

    setError(null);
    await deleteUser({ variables: { id: user.id } });
  };

  const getRoleBadgeClasses = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  };

  const formContent = (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500 rounded text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className={`flex gap-2 flex-wrap ${isMobile ? 'flex-col' : ''}`}>
        <button
          onClick={() => setIsCreating(true)}
          className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation`}
        >
          <PlusIcon className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Create User Form */}
      {isCreating && (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <h3 className="text-gray-900 dark:text-white font-medium mb-3">Create New User</h3>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email (required)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value={UserRole.USER}>User</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
            <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
              <button
                onClick={handleCreateUser}
                disabled={creating || !newEmail.trim() || !newPassword}
                className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation`}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={resetCreateForm}
                className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">No users found</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {editingUser?.id === user.id ? (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email"
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name (optional)"
                    />
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={user.id === currentUser?.id}
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                    {user.id === currentUser?.id && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">You cannot change your own role</p>
                    )}
                    <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                      <button
                        onClick={handleUpdateUser}
                        disabled={updating || !editEmail.trim()}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation`}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white font-medium truncate">
                        {user.name || user.email}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeClasses(user.role)}`}>
                        {user.role}
                      </span>
                      {user.id === currentUser?.id && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          You
                        </span>
                      )}
                    </div>
                    {user.name && (
                      <div className="text-gray-500 dark:text-gray-400 text-sm truncate">{user.email}</div>
                    )}
                    <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              {editingUser?.id !== user.id && (
                <div className="flex gap-2 items-center shrink-0">
                  <button
                    onClick={() => handleStartEdit(user)}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    title="Edit user"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    disabled={deleting || user.id === currentUser?.id}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'}`}>
      <button
        onClick={onClose}
        className={`${isMobile ? 'w-full' : ''} px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation`}
      >
        Close
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Users"
      footer={footerContent}
      maxWidth="max-w-2xl"
      testId="user-management-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
