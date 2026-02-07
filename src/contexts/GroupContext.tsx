'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_GROUPS } from '@/graphql/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { UserGroup } from '@/types/auth';

const ACTIVE_GROUP_KEY = 'activeGroupId';

interface GroupContextType {
  activeGroup: UserGroup | null;
  groups: UserGroup[];
  loading: boolean;
  selectGroup: (group: UserGroup) => void;
  selectGroupById: (groupId: string) => void;
  refetchGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { isAuthEnabled, isAuthenticated } = useAuth();
  const [activeGroup, setActiveGroup] = useState<UserGroup | null>(null);

  const shouldFetchGroups = isAuthEnabled && isAuthenticated;

  const { data, loading, refetch } = useQuery(GET_MY_GROUPS, {
    skip: !shouldFetchGroups,
  });

  const groups: UserGroup[] = useMemo(() => {
    if (!shouldFetchGroups) return [];
    return data?.myGroups || [];
  }, [data?.myGroups, shouldFetchGroups]);

  const selectGroup = useCallback((group: UserGroup) => {
    setActiveGroup(group);
    localStorage.setItem(ACTIVE_GROUP_KEY, group.id);
  }, []);

  const selectGroupById = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      selectGroup(group);
    }
  }, [groups, selectGroup]);

  const refetchGroups = useCallback(async () => {
    if (shouldFetchGroups) {
      await refetch();
    }
  }, [refetch, shouldFetchGroups]);

  // Auto-select group when groups load
  useEffect(() => {
    if (!shouldFetchGroups || loading || groups.length === 0) {
      if (!shouldFetchGroups) {
        setActiveGroup(null);
      }
      return;
    }

    // If we already have an active group that's still in the list, keep it
    if (activeGroup && groups.find((g) => g.id === activeGroup.id)) {
      return;
    }

    // Try to restore from localStorage
    const storedGroupId = localStorage.getItem(ACTIVE_GROUP_KEY);
    if (storedGroupId) {
      const storedGroup = groups.find((g) => g.id === storedGroupId);
      if (storedGroup) {
        setActiveGroup(storedGroup);
        return;
      }
    }

    // Default: pick the first group
    setActiveGroup(groups[0]);
  }, [groups, loading, shouldFetchGroups, activeGroup]);

  const value = useMemo(
    () => ({
      activeGroup,
      groups,
      loading: shouldFetchGroups ? loading : false,
      selectGroup,
      selectGroupById,
      refetchGroups,
    }),
    [activeGroup, groups, loading, shouldFetchGroups, selectGroup, selectGroupById, refetchGroups],
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
