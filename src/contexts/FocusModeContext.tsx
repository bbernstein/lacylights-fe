'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface FocusModeContextType {
  isFocusMode: boolean;
  enterFocusMode: () => void;
  exitFocusMode: () => void;
  toggleFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const enterFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  // Handle ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, exitFocusMode]);

  return (
    <FocusModeContext.Provider
      value={{
        isFocusMode,
        enterFocusMode,
        exitFocusMode,
        toggleFocusMode,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

/**
 * Hook to access focus mode state and controls
 * @throws {Error} if used outside FocusModeProvider
 */
export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
}
