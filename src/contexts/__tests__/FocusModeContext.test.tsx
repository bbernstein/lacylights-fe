import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FocusModeProvider, useFocusMode } from '../FocusModeContext';

// Test component that uses the hook
function TestComponent() {
  const { isFocusMode, enterFocusMode, exitFocusMode, toggleFocusMode } = useFocusMode();

  return (
    <div>
      <span data-testid="focus-mode-status">{isFocusMode ? 'focused' : 'normal'}</span>
      <button onClick={enterFocusMode}>Enter Focus</button>
      <button onClick={exitFocusMode}>Exit Focus</button>
      <button onClick={toggleFocusMode}>Toggle Focus</button>
    </div>
  );
}

describe('FocusModeContext', () => {
  describe('FocusModeProvider', () => {
    it('provides initial focus mode state as false', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('normal');
    });

    it('enters focus mode when enterFocusMode is called', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      fireEvent.click(screen.getByText('Enter Focus'));

      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('focused');
    });

    it('exits focus mode when exitFocusMode is called', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      // Enter focus mode first
      fireEvent.click(screen.getByText('Enter Focus'));
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('focused');

      // Exit focus mode
      fireEvent.click(screen.getByText('Exit Focus'));
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('normal');
    });

    it('toggles focus mode when toggleFocusMode is called', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      // Toggle on
      fireEvent.click(screen.getByText('Toggle Focus'));
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('focused');

      // Toggle off
      fireEvent.click(screen.getByText('Toggle Focus'));
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('normal');
    });

    it('exits focus mode when ESC key is pressed while in focus mode', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      // Enter focus mode first
      fireEvent.click(screen.getByText('Enter Focus'));
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('focused');

      // Press ESC
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('normal');
    });

    it('does not exit focus mode when ESC is pressed if not in focus mode', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      // Should be in normal mode
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('normal');

      // Press ESC - should not change anything
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('normal');
    });

    it('does not exit focus mode when other keys are pressed', () => {
      render(
        <FocusModeProvider>
          <TestComponent />
        </FocusModeProvider>
      );

      // Enter focus mode first
      fireEvent.click(screen.getByText('Enter Focus'));
      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('focused');

      // Press other keys
      act(() => {
        fireEvent.keyDown(window, { key: 'Enter' });
        fireEvent.keyDown(window, { key: 'a' });
        fireEvent.keyDown(window, { key: 'Tab' });
      });

      expect(screen.getByTestId('focus-mode-status')).toHaveTextContent('focused');
    });

  });

  describe('useFocusMode', () => {
    it('throws error when used outside FocusModeProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFocusMode must be used within a FocusModeProvider');

      console.error = originalError;
    });
  });
});
