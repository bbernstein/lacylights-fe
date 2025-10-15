'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import SceneEditorLayout from '@/components/SceneEditorLayout';
import { extractSceneId } from '@/utils/routeUtils';

interface SceneEditorPageClientProps {
  sceneId: string;
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
