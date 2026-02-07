'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  GET_USER_GROUP,
  GET_GROUP_INVITATIONS,
  INVITE_TO_GROUP,
  CANCEL_INVITATION,
  UPDATE_GROUP_MEMBER_ROLE,
  REMOVE_USER_FROM_GROUP,
  UPDATE_USER_GROUP,
  GET_MY_GROUPS,
} from '@/graphql/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { GroupMember, GroupInvitation, GroupMemberRole } from '@/types/auth';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { isAdmin, user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<GroupMemberRole>('MEMBER' as GroupMemberRole);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: groupData, loading } = useQuery(GET_USER_GROUP, {
    variables: { id: groupId },
  });

  const { data: invitationsData } = useQuery(GET_GROUP_INVITATIONS, {
    variables: { groupId },
  });

  const [updateGroup] = useMutation(UPDATE_USER_GROUP, {
    refetchQueries: [{ query: GET_USER_GROUP, variables: { id: groupId } }, { query: GET_MY_GROUPS }],
    onError: (err) => setError(err.message),
  });

  const [inviteToGroup] = useMutation(INVITE_TO_GROUP, {
    refetchQueries: [{ query: GET_GROUP_INVITATIONS, variables: { groupId } }],
    onError: (err) => setError(err.message),
  });

  const [cancelInvitation] = useMutation(CANCEL_INVITATION, {
    refetchQueries: [{ query: GET_GROUP_INVITATIONS, variables: { groupId } }],
    onError: (err) => setError(err.message),
  });

  const [updateMemberRole] = useMutation(UPDATE_GROUP_MEMBER_ROLE, {
    refetchQueries: [{ query: GET_USER_GROUP, variables: { id: groupId } }],
    onError: (err) => setError(err.message),
  });

  const [removeMember] = useMutation(REMOVE_USER_FROM_GROUP, {
    refetchQueries: [{ query: GET_USER_GROUP, variables: { id: groupId } }],
    onError: (err) => setError(err.message),
  });

  if (loading) {
    return <div className="text-gray-400 text-center py-8">Loading group...</div>;
  }

  const group = groupData?.userGroup;
  if (!group) {
    return <div className="text-gray-400 text-center py-8">Group not found.</div>;
  }

  const members: GroupMember[] = group.members || [];
  const invitations: GroupInvitation[] = invitationsData?.groupInvitations || [];
  const pendingInvitations = invitations.filter((i: GroupInvitation) => i.status === 'PENDING');

  // Check if current user is group admin or system admin
  const currentMember = members.find((m: GroupMember) => m.user.id === user?.id);
  const isGroupAdmin = isAdmin || currentMember?.role === 'GROUP_ADMIN';

  const handleUpdateGroup = async () => {
    setError(null);
    await updateGroup({
      variables: {
        id: groupId,
        input: { name: editName.trim(), description: editDescription.trim() || undefined },
      },
    });
    setIsEditing(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setError(null);
    await inviteToGroup({
      variables: { groupId, email: inviteEmail.trim(), role: inviteRole },
    });
    setInviteEmail('');
    setShowInviteForm(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setError(null);
    await cancelInvitation({ variables: { invitationId } });
  };

  const handleRoleChange = async (userId: string, role: GroupMemberRole) => {
    setError(null);
    await updateMemberRole({ variables: { userId, groupId, role } });
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the group?')) return;
    setError(null);
    await removeMember({ variables: { userId, groupId } });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Groups
        </Link>

        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex-1 max-w-md space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
                rows={2}
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateGroup}
                  disabled={!editName.trim()}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
                {group.isPersonal && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300">
                    Personal
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-gray-400 mt-1">{group.description}</p>
              )}
            </div>
          )}
          {isGroupAdmin && !isEditing && !group.isPersonal && (
            <button
              onClick={() => {
                setEditName(group.name);
                setEditDescription(group.description || '');
                setIsEditing(true);
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Members Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Members ({members.length})
          </h3>
          {isGroupAdmin && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Invite
            </button>
          )}
        </div>

        {showInviteForm && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="text-white font-medium mb-3">Invite User</h4>
            <div className="flex gap-2 flex-wrap">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                autoFocus
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as GroupMemberRole)}
                className="px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="MEMBER">Member</option>
                <option value="GROUP_ADMIN">Admin</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Send
              </button>
              <button
                onClick={() => { setShowInviteForm(false); setInviteEmail(''); }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {members.map((member: GroupMember) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
            >
              <div>
                <span className="text-white font-medium">
                  {member.user.name || member.user.email}
                </span>
                {member.user.name && (
                  <span className="text-gray-400 text-sm ml-2">{member.user.email}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isGroupAdmin && member.user.id !== user?.id ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user.id, e.target.value as GroupMemberRole)}
                      className="px-2 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="GROUP_ADMIN">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove member"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                    {member.role === 'GROUP_ADMIN' ? 'Admin' : 'Member'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {isGroupAdmin && pendingInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-2">
            {pendingInvitations.map((invitation: GroupInvitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <span className="text-white">{invitation.email}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    as {invitation.role === 'GROUP_ADMIN' ? 'Admin' : 'Member'}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleCancelInvitation(invitation.id)}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
