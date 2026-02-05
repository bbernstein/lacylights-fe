'use client';

import { ApolloProvider } from '@apollo/client';
import apolloClient from '@/lib/apollo-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { FocusModeProvider } from '@/contexts/FocusModeContext';
import { UserModeProvider } from '@/contexts/UserModeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { UndoRedoProvider } from '@/contexts/UndoRedoContext';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Suppress React development warnings about scrollIntoView with sticky/fixed positioning
  // RATIONALE: These warnings are logged by React's internal focus management when
  // auto-scroll behavior is skipped due to sticky/fixed positioning. They don't
  // affect functionality (scroll still works) and are extremely noisy in development.
  // We use a global filter because:
  // 1. Warnings come from React internals, not our direct scrollIntoView calls
  // 2. They're logged asynchronously, so local try-catch/filtering doesn't work
  // 3. The filter is very specific and only runs in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        // Only filter this exact React warning about scrollIntoView
        if (
          typeof args[0] === 'string' &&
          args[0].includes('Skipping auto-scroll behavior') &&
          args[0].includes('position: sticky') &&
          args[0].includes('position: fixed')
        ) {
          return;
        }
        // Pass through all other warnings unchanged
        originalWarn.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <WebSocketProvider>
          <UserModeProvider>
            <FocusModeProvider>
              <ProjectProvider>
                <UndoRedoProvider>
                  {children}
                </UndoRedoProvider>
              </ProjectProvider>
            </FocusModeProvider>
          </UserModeProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}