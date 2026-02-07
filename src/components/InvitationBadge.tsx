'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import {
  GET_MY_INVITATIONS,
  ACCEPT_INVITATION,
  DECLINE_INVITATION,
} from '@/graphql/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useGroup } from '@/contexts/GroupContext';
import type { GroupInvitation } from '@/types/auth';

export default function InvitationBadge() {
  const { isAuthEnabled, isAuthenticated } = useAuth();
  const { refetchGroups } = useGroup();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shouldFetch = isAuthEnabled && isAuthenticated;

  const { data, refetch } = useQuery(GET_MY_INVITATIONS, {
    skip: !shouldFetch,
    pollInterval: 60000, // Poll every minute for new invitations
  });

  const [acceptInvitation] = useMutation(ACCEPT_INVITATION);
  const [declineInvitation] = useMutation(DECLINE_INVITATION, {
    refetchQueries: [{ query: GET_MY_INVITATIONS }],
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const invitations: GroupInvitation[] = data?.myInvitations || [];

  if (!shouldFetch || invitations.length === 0) {
    return null;
  }

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptInvitation({ variables: { invitationId } });
      // Single refetch strategy: refetch groups (which includes the newly joined group)
      // and invitations (to remove the accepted one) in parallel
      await Promise.all([refetchGroups(), refetch()]);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await declineInvitation({ variables: { invitationId } });
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        title="Group invitations"
        aria-label="Group invitations"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'invitation-dropdown' : undefined}
      >
        <EnvelopeIcon className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white font-medium">
          {invitations.length}
        </span>
      </button>

      {isOpen && (
        <div id="invitation-dropdown" role="menu" className="absolute right-0 z-10 mt-2 w-80 rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Group Invitations
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-2 bg-gray-50 dark:bg-gray-600 rounded"
                >
                  <div className="text-sm text-gray-900 dark:text-white font-medium">
                    {invitation.group.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                    {' as '}
                    {invitation.role === 'GROUP_ADMIN' ? 'Admin' : 'Member'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAccept(invitation.id)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(invitation.id)}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
