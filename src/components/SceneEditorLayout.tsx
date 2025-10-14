'use client';

import ChannelListEditor from './ChannelListEditor';

interface SceneEditorLayoutProps {
  sceneId: string;
  mode: 'channels' | 'layout';
  onClose: () => void;
  onToggleMode: () => void;
}

export default function SceneEditorLayout({ sceneId, mode, onClose, onToggleMode }: SceneEditorLayoutProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Top bar with mode switcher and controls */}
      <div className="flex-none bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Scenes
          </button>

          {/* Mode switcher tabs */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                if (mode !== 'channels') onToggleMode();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'channels'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              Channel List
            </button>
            <button
              onClick={() => {
                if (mode !== 'layout') onToggleMode();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'layout'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              2D Layout
            </button>
          </div>

          {/* Spacer for layout balance */}
          <div className="w-32" />
        </div>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'channels' ? (
          <ChannelListEditor sceneId={sceneId} onClose={onClose} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            2D Layout Editor (coming in Phase 2)
          </div>
        )}
      </div>
    </div>
  );
}
