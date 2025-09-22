'use client';

import { use } from 'react';
import CueListPlayer from '@/components/CueListPlayer';
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apollo-client';

interface PageProps {
  params: Promise<{ cueListId: string }>;
}

export default function PlayerPage({ params }: PageProps) {
  const { cueListId } = use(params);

  return (
    <ApolloProvider client={client}>
      <CueListPlayer cueListId={cueListId} />
    </ApolloProvider>
  );
}