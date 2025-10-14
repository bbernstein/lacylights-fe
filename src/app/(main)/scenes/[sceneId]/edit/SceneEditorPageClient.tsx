'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import SceneEditorLayout from '@/components/SceneEditorLayout';

interface SceneEditorPageClientProps {
  sceneId: string;
}

/**
 * Helper to extract sceneId from URL if needed (for static export)
 */
function extractSceneId(sceneIdProp: string): string {
  if (sceneIdProp === '__dynamic__' && typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/scenes\/([^\/\?]+)/);
    return match?.[1] || sceneIdProp;
  }
  return sceneIdProp;
}

export default function SceneEditorPageClient({ sceneId: sceneIdProp }: SceneEditorPageClientProps) {
  const sceneId = extractSceneId(sceneIdProp);
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode') || 'channels';
  const isLayoutMode = mode === 'layout';

  const handleClose = () => {
    router.push('/scenes');
  };

  const handleToggleMode = () => {
    if (isLayoutMode) {
      router.push(`/scenes/${sceneId}/edit`);
    } else {
      router.push(`/scenes/${sceneId}/edit?mode=layout`);
    }
  };

  return (
    <SceneEditorLayout
      sceneId={sceneId}
      mode={mode as 'channels' | 'layout'}
      onClose={handleClose}
      onToggleMode={handleToggleMode}
    />
  );
}
