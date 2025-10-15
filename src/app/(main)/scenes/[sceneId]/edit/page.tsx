import { use, Suspense } from 'react';
import SceneEditorPageClient from './SceneEditorPageClient';

interface PageProps {
  params: Promise<{ sceneId: string }>;
}

export const dynamicParams = true;

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
