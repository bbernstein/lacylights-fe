'use client';

import { ApolloProvider } from '@apollo/client';
import apolloClient from '@/lib/apollo-client';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Suppress React development warnings about scrollIntoView with sticky/fixed positioning
  // These warnings don't affect functionality and are just noisy in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        // Filter out the specific React scrollIntoView warning
        if (typeof args[0] === 'string' && args[0].includes('Skipping auto-scroll behavior')) {
          return;
        }
        originalWarn.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </ApolloProvider>
  );
}