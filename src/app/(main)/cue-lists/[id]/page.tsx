import { use, Suspense } from 'react';
import CueListPageClient from './CueListPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and client-side code extracts the real ID from the URL
// via extractCueListId() in routeUtils.ts
export async function generateStaticParams() {
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
