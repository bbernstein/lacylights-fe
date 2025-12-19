import { renderHook, act } from '@testing-library/react';
import { usePageVisibility } from '../usePageVisibility';

describe('usePageVisibility', () => {
  let originalHidden: PropertyDescriptor | undefined;

  beforeEach(() => {
    // Save original document.hidden descriptor
    originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: jest.fn(() => false),
    });
  });

  afterEach(() => {
    // Restore original document.hidden
    if (originalHidden) {
      Object.defineProperty(Document.prototype, 'hidden', originalHidden);
    }
  });

  it('should return true when page is visible', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it('should return false when page is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);
  });

  it('should update when visibility changes from visible to hidden', () => {
    let hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    // Simulate page becoming hidden
    act(() => {
      hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(false);
  });

  it('should update when visibility changes from hidden to visible', () => {
    let hidden = true;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);

    // Simulate page becoming visible
    act(() => {
      hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(true);
  });

  it('should handle multiple visibility changes', () => {
    let hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);

    // Hide
    act(() => {
      hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);

    // Show
    act(() => {
      hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(true);

    // Hide again
    act(() => {
      hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => usePageVisibility());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('should add event listener on mount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    renderHook(() => usePageVisibility());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });
});
