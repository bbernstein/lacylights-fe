'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CueListPlayer from '@/components/CueListPlayer';
import CueListUnifiedView from '@/components/CueListUnifiedView';

interface CueListPageClientProps {
  cueListId: string;
}

export default function CueListPageClient({ cueListId: cueListIdProp }: CueListPageClientProps) {
  // Helper to extract cueListId from URL if needed (for static export)
  function extractCueListId(cueListIdProp: string): string {
    if (cueListIdProp === '__dynamic__' && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/cue-lists\/([^\/\?]+)/);
      return match?.[1] || cueListIdProp;
    }
    return cueListIdProp;
  }

  const [actualCueListId, setActualCueListId] = useState<string>(() => extractCueListId(cueListIdProp));

  useEffect(() => {
    setActualCueListId(extractCueListId(cueListIdProp));
  }, [cueListIdProp]);

  const cueListId = actualCueListId;
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode') || 'player';
  const isEditMode = mode === 'edit';

  const handleClose = () => {
    router.push('/cue-lists');
  };

  const handleToggleMode = () => {
    if (isEditMode) {
      router.push(`/cue-lists/${cueListId}`);
    } else {
      router.push(`/cue-lists/${cueListId}?mode=edit`);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-gray-900">
      {/* Mode Toggle Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between z-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700"
            title="Back to cue lists"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-gray-400 text-sm">Back to Cue Lists</span>
        </div>

        <button
          onClick={handleToggleMode}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isEditMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {isEditMode ? 'Switch to Player Mode' : 'Switch to Edit Mode'}
        </button>
      </div>

      {/* Content */}
      <div className="absolute inset-0 top-14">
        {isEditMode ? (
          <CueListUnifiedView cueListId={cueListId} onClose={handleClose} />
        ) : (
          <CueListPlayer cueListId={cueListId} />
        )}
      </div>
    </div>
  );
}
