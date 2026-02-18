import { renderHook, act } from '@testing-library/react';
import { useRecentItems } from '../useRecentItems';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useRecentItems', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should return empty items initially', () => {
    const { result } = renderHook(() => useRecentItems());
    expect(result.current.items).toEqual([]);
  });

  it('should load items from localStorage on mount', () => {
    const stored = [
      { id: '1', name: 'Look A', type: 'look', route: '/looks/1/edit', timestamp: 1000 },
    ];
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useRecentItems());
    expect(result.current.items).toEqual(stored);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('lacylights-recent-items');
  });

  it('should add an item and persist to localStorage', () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addItem({
        id: '1',
        name: 'Look A',
        type: 'look',
        route: '/looks/1/edit',
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('1');
    expect(result.current.items[0].name).toBe('Look A');
    expect(result.current.items[0].type).toBe('look');
    expect(result.current.items[0].route).toBe('/looks/1/edit');
    expect(result.current.items[0].timestamp).toBeGreaterThan(0);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'lacylights-recent-items',
      expect.any(String),
    );
  });

  it('should move duplicate item to the front', () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addItem({ id: '1', name: 'Look A', type: 'look', route: '/looks/1/edit' });
    });
    act(() => {
      result.current.addItem({ id: '2', name: 'Effect B', type: 'effect', route: '/effects/2/edit' });
    });
    act(() => {
      // Re-add item 1 -- should move to front
      result.current.addItem({ id: '1', name: 'Look A', type: 'look', route: '/looks/1/edit' });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].id).toBe('1');
    expect(result.current.items[1].id).toBe('2');
  });

  it('should limit items to MAX_ITEMS (6)', () => {
    const { result } = renderHook(() => useRecentItems());

    for (let i = 0; i < 8; i++) {
      act(() => {
        result.current.addItem({
          id: `item-${i}`,
          name: `Item ${i}`,
          type: 'look',
          route: `/looks/${i}/edit`,
        });
      });
    }

    expect(result.current.items).toHaveLength(6);
    // Most recent should be first
    expect(result.current.items[0].id).toBe('item-7');
    // Oldest (item-0, item-1) should have been evicted
    expect(result.current.items.find(i => i.id === 'item-0')).toBeUndefined();
    expect(result.current.items.find(i => i.id === 'item-1')).toBeUndefined();
  });

  it('should handle localStorage errors on load gracefully', () => {
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage not available');
    });

    const { result } = renderHook(() => useRecentItems());
    expect(result.current.items).toEqual([]);
  });

  it('should handle localStorage errors on save gracefully', () => {
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage full');
    });

    const { result } = renderHook(() => useRecentItems());

    // Should not throw
    act(() => {
      result.current.addItem({ id: '1', name: 'Look A', type: 'look', route: '/looks/1/edit' });
    });

    // State should still update even if localStorage fails
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('1');
  });

  it('should handle corrupted localStorage data gracefully', () => {
    mockLocalStorage.getItem.mockReturnValueOnce('not-valid-json');

    const { result } = renderHook(() => useRecentItems());
    expect(result.current.items).toEqual([]);
  });

  it('should support all item types', () => {
    const { result } = renderHook(() => useRecentItems());
    const types = ['look', 'effect', 'board', 'cueList', 'fixture'] as const;

    types.forEach((type, i) => {
      act(() => {
        result.current.addItem({
          id: `${type}-${i}`,
          name: `${type} item`,
          type,
          route: `/${type}/${i}`,
        });
      });
    });

    expect(result.current.items).toHaveLength(5);
    // Most recent first
    expect(result.current.items[0].type).toBe('fixture');
    expect(result.current.items[4].type).toBe('look');
  });
});
