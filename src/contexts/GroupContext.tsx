'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_GROUPS } from '@/graphql/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { UserGroup } from '@/types/auth';

export const UNASSIGNED_GROUP: UserGroup = {
  id: 'unassigned',
  name: 'Unassigned',
  isPersonal: false,
  permissions: [],
  memberCount: 0,
  createdAt: '',
  updatedAt: '',
};

const ACTIVE_GROUP_KEY = 'activeGroupId';

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail (e.g., quota exceeded, private browsing)
  }
}

interface GroupContextType {
  activeGroup: UserGroup | null;
  groups: UserGroup[];
  selectableGroups: UserGroup[];
  loading: boolean;
  selectGroup: (group: UserGroup) => void;
  selectGroupById: (groupId: string) => void;
  refetchGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { isAuthEnabled, isAuthenticated, isAdmin } = useAuth();
  const [activeGroup, setActiveGroup] = useState<UserGroup | null>(null);

  const shouldFetchGroups = isAuthEnabled && isAuthenticated;

  const { data, loading, refetch } = useQuery(GET_MY_GROUPS, {
    skip: !shouldFetchGroups,
  });

  const groups: UserGroup[] = useMemo(() => {
    if (!shouldFetchGroups) return [];
    return data?.myGroups || [];
  }, [data?.myGroups, shouldFetchGroups]);

  const selectableGroups: UserGroup[] = useMemo(() => {
    if (isAdmin) {
      return [...groups, UNASSIGNED_GROUP];
    }
    return groups;
  }, [groups, isAdmin]);

  const selectGroup = useCallback((group: UserGroup) => {
    setActiveGroup(group);
    safeSetItem(ACTIVE_GROUP_KEY, group.id);
  }, []);

  const selectGroupById = useCallback((groupId: string) => {
    const group = selectableGroups.find((g) => g.id === groupId);
    if (group) {
      selectGroup(group);
    }
  }, [selectableGroups, selectGroup]);

  const refetchGroups = useCallback(async () => {
    if (shouldFetchGroups) {
      await refetch();
    }
  }, [refetch, shouldFetchGroups]);

  // Track the active group ID in a ref to avoid re-running the effect when activeGroup changes
  const activeGroupIdRef = useRef<string | null>(null);

  // Keep the ref in sync with state
  useEffect(() => {
    activeGroupIdRef.current = activeGroup?.id ?? null;
  }, [activeGroup]);

  // Auto-select group when groups load
  useEffect(() => {
    if (!shouldFetchGroups || loading || groups.length === 0) {
      if (!shouldFetchGroups) {
        setActiveGroup(null);
        activeGroupIdRef.current = null;
      }
      return;
    }

    // If we already have an active group that's still in the list, keep it
    if (activeGroupIdRef.current && selectableGroups.find((g) => g.id === activeGroupIdRef.current)) {
      return;
    }

    // Try to restore from localStorage (search selectableGroups so "unassigned" can be restored)
    const storedGroupId = safeGetItem(ACTIVE_GROUP_KEY);
    if (storedGroupId) {
      const storedGroup = selectableGroups.find((g) => g.id === storedGroupId);
      if (storedGroup) {
        setActiveGroup(storedGroup);
        activeGroupIdRef.current = storedGroup.id;
        return;
      }
    }

    // Default: pick the first group
    setActiveGroup(groups[0]);
    activeGroupIdRef.current = groups[0].id;
  }, [groups, selectableGroups, loading, shouldFetchGroups]);

  const value = useMemo(
    () => ({
      activeGroup,
      groups,
      selectableGroups,
      loading: shouldFetchGroups ? loading : false,
      selectGroup,
      selectGroupById,
      refetchGroups,
    }),
    [activeGroup, groups, selectableGroups, loading, shouldFetchGroups, selectGroup, selectGroupById, refetchGroups],
  );

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
