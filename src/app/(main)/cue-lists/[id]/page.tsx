import { use, Suspense } from 'react';
import CueListPageClient from './CueListPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Only disable dynamic params for production static export
// In dev mode, allow all dynamic routes
export const dynamicParams = process.env.NODE_ENV === 'production' ? false : true;

// Generate static params for static export (production only)
// We must return at least one param for static export to work
// The actual cue list ID will be handled client-side from the URL
export async function generateStaticParams() {
  // Return a placeholder - the actual ID will be read from window.location on client
  return [{ id: '__dynamic__' }];
}

export default function CueListPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <CueListPageClient cueListId={id} />
    </Suspense>
  );
}
