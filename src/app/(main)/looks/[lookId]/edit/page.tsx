import { use, Suspense } from 'react';
import LookEditorPageClient from './LookEditorPageClient';

interface PageProps {
  params: Promise<{ lookId: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and client-side code extracts the real ID from the URL
// via extractLookId() in routeUtils.ts
export async function generateStaticParams() {
  return [{ lookId: '__dynamic__' }];
}

export default function LookEditorPage({ params }: PageProps) {
  const { lookId } = use(params);

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading look editor...</div>
      </div>
    }>
      <LookEditorPageClient lookId={lookId} />
    </Suspense>
  );
}
