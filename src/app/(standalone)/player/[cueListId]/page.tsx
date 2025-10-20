import { use } from 'react';
import CueListPlayer from '@/components/CueListPlayer';

interface PageProps {
  params: Promise<{ cueListId: string }>;
}

// Only disable dynamic params for production static export
// In dev mode, allow all dynamic routes
export const dynamicParams = process.env.NODE_ENV === 'production' ? false : true;

// Generate static params for static export (production only)
// We must return at least one param for static export to work
// The actual cue list ID will be handled client-side from the URL
export async function generateStaticParams() {
  // Return a placeholder - the actual ID will be read from window.location on client
  return [{ cueListId: '__dynamic__' }];
}

// This is a server component that extracts params and passes to client component
export default function PlayerPage({ params }: PageProps) {
  const { cueListId } = use(params);

  return <CueListPlayer cueListId={cueListId} />;
}