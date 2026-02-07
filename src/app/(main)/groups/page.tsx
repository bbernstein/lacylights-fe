'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { GET_MY_GROUPS, CREATE_USER_GROUP } from '@/graphql/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { UserGroup } from '@/types/auth';

export default function GroupsPage() {
  const { isAuthEnabled, isAuthenticated, isAdmin } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_MY_GROUPS, {
    skip: !isAuthEnabled || !isAuthenticated,
  });

  const [createGroup] = useMutation(CREATE_USER_GROUP, {
    refetchQueries: [{ query: GET_MY_GROUPS }],
    onError: (err) => setError(err.message),
  });

  if (!isAuthEnabled) {
    return (
      <div className="text-center py-16 text-gray-400">
        Groups are only available when authentication is enabled.
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 text-gray-400">
        Please sign in to view your groups.
      </div>
    );
  }

  const groups: UserGroup[] = data?.myGroups || [];

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setError(null);
    await createGroup({
      variables: {
        input: {
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
        },
      },
    });
    setIsCreating(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h2>
        {isAdmin && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create Group
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {isCreating && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-medium mb-3">Create New Group</h3>
          <input
            type="text"
            placeholder="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newGroupName.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => { setIsCreating(false); setNewGroupName(''); setNewGroupDescription(''); }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-8">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No groups found.</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{group.name}</span>
                    {group.isPersonal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300">
                        Personal
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <div className="text-gray-400 text-sm truncate mt-0.5">{group.description}</div>
                  )}
                </div>
                <div className="text-gray-500 text-sm shrink-0">
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
