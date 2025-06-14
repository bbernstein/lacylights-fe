'use client';

import { ApolloProvider } from '@apollo/client';
import apolloClient from '@/lib/apollo-client';
import { ProjectProvider } from '@/contexts/ProjectContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </ApolloProvider>
  );
}