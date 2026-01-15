'use client';

import { useRouter } from 'next/navigation';
import EffectEditorLayout from '@/components/EffectEditorLayout';
import { extractEffectId } from '@/utils/routeUtils';

interface EffectEditorPageClientProps {
  effectId: string;
}

export default function EffectEditorPageClient({ effectId: effectIdProp }: EffectEditorPageClientProps) {
  const effectId = extractEffectId(effectIdProp);
  const router = useRouter();

  const handleClose = () => {
    router.push('/effects');
  };

  return <EffectEditorLayout effectId={effectId} onClose={handleClose} />;
}
