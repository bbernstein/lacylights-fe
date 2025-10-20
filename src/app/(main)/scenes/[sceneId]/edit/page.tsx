import { use, Suspense } from 'react';
import SceneEditorPageClient from './SceneEditorPageClient';

interface PageProps {
  params: Promise<{ sceneId: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and client-side code extracts the real ID from the URL
// via extractSceneId() in routeUtils.ts
export async function generateStaticParams() {
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
