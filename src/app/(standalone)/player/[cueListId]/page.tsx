'use client';

import { use } from 'react';
import CueListPlayer from '@/components/CueListPlayer';

interface PageProps {
  params: Promise<{ cueListId: string }>;
}

export default function PlayerPage({ params }: PageProps) {
  const { cueListId } = use(params);

  return <CueListPlayer cueListId={cueListId} />;
}