'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'lacylights-recent-items';
const MAX_ITEMS = 6;

export interface RecentItem {
  id: string;
  name: string;
  type: 'look' | 'effect' | 'board' | 'cueList' | 'fixture';
  route: string;
  timestamp: number;
}

export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addItem = useCallback((item: Omit<RecentItem, 'timestamp'>) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  return { items, addItem };
}
