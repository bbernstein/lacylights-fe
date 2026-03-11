import { renderHook, act } from '@testing-library/react';
import { useDisplayMode } from '../useDisplayMode';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useDisplayMode', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('defaults to dmx mode', () => {
    const { result } = renderHook(() => useDisplayMode());
    expect(result.current.displayMode).toBe('dmx');
    expect(result.current.isDmxMode).toBe(true);
    expect(result.current.isPercentMode).toBe(false);
  });

  it('reads stored preference on mount', () => {
    localStorageMock.getItem.mockReturnValueOnce('percent');
    const { result } = renderHook(() => useDisplayMode());
    expect(result.current.displayMode).toBe('percent');
    expect(result.current.isPercentMode).toBe(true);
  });

  it('persists preference to localStorage on change', () => {
    const { result } = renderHook(() => useDisplayMode());
    act(() => {
      result.current.setDisplayMode('percent');
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'lacylights-display-mode',
      'percent'
    );
    expect(result.current.isPercentMode).toBe(true);
  });

  it('ignores invalid stored values', () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid');
    const { result } = renderHook(() => useDisplayMode());
    expect(result.current.displayMode).toBe('dmx');
  });
});
