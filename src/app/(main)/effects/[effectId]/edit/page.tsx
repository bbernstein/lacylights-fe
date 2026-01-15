import { use, Suspense } from 'react';
import EffectEditorPageClient from './EffectEditorPageClient';

interface PageProps {
  params: Promise<{ effectId: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and client-side code extracts the real ID from the URL
export async function generateStaticParams() {
  return [{ effectId: '__dynamic__' }];
}

export default function EffectEditorPage({ params }: PageProps) {
  const { effectId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading effect editor...</div>
        </div>
      }
    >
      <EffectEditorPageClient effectId={effectId} />
    </Suspense>
  );
}
