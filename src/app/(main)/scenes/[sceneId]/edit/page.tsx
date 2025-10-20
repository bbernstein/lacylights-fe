import { use, Suspense } from 'react';
import SceneEditorPageClient from './SceneEditorPageClient';

interface PageProps {
  params: Promise<{ sceneId: string }>;
}

// Only disable dynamic params for production static export
// In dev mode, allow all dynamic routes
export const dynamicParams = process.env.NODE_ENV === 'production' ? false : true;

export async function generateStaticParams() {
  // Only used for static export in production
  return [{ sceneId: '__dynamic__' }];
}

export default function SceneEditorPage({ params }: PageProps) {
  const { sceneId } = use(params);

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading scene editor...</div>
      </div>
    }>
      <SceneEditorPageClient sceneId={sceneId} />
    </Suspense>
  );
}
