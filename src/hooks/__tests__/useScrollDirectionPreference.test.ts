import { renderHook, act } from '@testing-library/react';
import { useScrollDirectionPreference } from '../useScrollDirectionPreference';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useScrollDirectionPreference', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('should return default value of natural', () => {
    const { result } = renderHook(() => useScrollDirectionPreference());

    const [direction, , invertWheelDirection] = result.current;
    expect(direction).toBe('natural');
    expect(invertWheelDirection).toBe(false);
  });

  it('should load preference from localStorage on mount', () => {
    mockLocalStorage.getItem.mockReturnValueOnce('traditional');

    const { result } = renderHook(() => useScrollDirectionPreference());

    // Verify getItem was called on mount
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('lacylights-scroll-direction');
    // Verify the preference was actually loaded
    expect(result.current[0]).toBe('traditional');
  });

  it('should update preference and save to localStorage', () => {
    const { result } = renderHook(() => useScrollDirectionPreference());

    act(() => {
      const [, setDirection] = result.current;
      setDirection('traditional');
    });

    const [direction, , invertWheelDirection] = result.current;
    expect(direction).toBe('traditional');
    expect(invertWheelDirection).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'lacylights-scroll-direction',
      'traditional'
    );
  });

  it('should return invertWheelDirection as false for natural', () => {
    const { result } = renderHook(() => useScrollDirectionPreference());

    const [, , invertWheelDirection] = result.current;
    expect(invertWheelDirection).toBe(false);
  });

  it('should return invertWheelDirection as true for traditional', () => {
    const { result } = renderHook(() => useScrollDirectionPreference());

    act(() => {
      const [, setDirection] = result.current;
      setDirection('traditional');
    });

    const [, , invertWheelDirection] = result.current;
    expect(invertWheelDirection).toBe(true);
  });

  it('should switch back to natural and update invertWheelDirection', () => {
    const { result } = renderHook(() => useScrollDirectionPreference());

    // Set to traditional
    act(() => {
      const [, setDirection] = result.current;
      setDirection('traditional');
    });

    expect(result.current[2]).toBe(true);

    // Set back to natural
    act(() => {
      const [, setDirection] = result.current;
      setDirection('natural');
    });

    expect(result.current[0]).toBe('natural');
    expect(result.current[2]).toBe(false);
  });

  it('should ignore invalid localStorage values', () => {
    mockLocalStorage.getItem.mockReturnValueOnce('invalid-value');

    const { result } = renderHook(() => useScrollDirectionPreference());

    const [direction] = result.current;
    expect(direction).toBe('natural');
  });

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage not available');
    });

    // Should not throw
    const { result } = renderHook(() => useScrollDirectionPreference());

    const [direction] = result.current;
    expect(direction).toBe('natural');
  });

  it('should handle localStorage setItem errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage full');
    });

    const { result } = renderHook(() => useScrollDirectionPreference());

    // Should not throw
    act(() => {
      const [, setDirection] = result.current;
      setDirection('traditional');
    });

    // State should still update even if localStorage fails
    const [direction] = result.current;
    expect(direction).toBe('traditional');
  });
});
