'use client';

import { useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronDownIcon, PlayIcon } from '@heroicons/react/24/outline';

/**
 * Props for the SceneEditorMobileToolbar component
 */
interface SceneEditorMobileToolbarProps {
  /** Scene name to display */
  sceneName: string;
  /** Current editing mode */
  mode: 'channels' | 'layout';
  /** Whether editing from Player Mode */
  fromPlayer?: boolean;
  /** Called when back button is pressed */
  onClose: () => void;
  /** Called when mode is switched */
  onToggleMode: () => void;
  /** Test ID for the component */
  testId?: string;
}

/**
 * Minimal mobile toolbar for the Scene Editor
 *
 * Displays a compact top bar on mobile devices with:
 * - Back button (context-aware: "Player" or "Scenes")
 * - Scene name (truncated)
 * - Compact mode switcher dropdown
 * - Player Mode indicator (icon only on mobile)
 *
 * Only visible on mobile screens (md:hidden).
 *
 * @example
 * ```tsx
 * <SceneEditorMobileToolbar
 *   sceneName="Blue Wash"
 *   mode="channels"
 *   fromPlayer={false}
 *   onClose={() => router.push('/scenes')}
 *   onToggleMode={() => setMode(mode === 'channels' ? 'layout' : 'channels')}
 * />
 * ```
 */
export default function SceneEditorMobileToolbar({
  sceneName,
  mode,
  fromPlayer = false,
  onClose,
  onToggleMode,
  testId = 'scene-editor-mobile-toolbar',
}: SceneEditorMobileToolbarProps) {
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const handleModeSelect = useCallback(
    (newMode: 'channels' | 'layout') => {
      if (newMode !== mode) {
        onToggleMode();
      }
      setShowModeDropdown(false);
    },
    [mode, onToggleMode]
  );

  return (
    <div
      className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-3 py-2 md:hidden"
      data-testid={testId}
    >
      {/* Back button */}
      <button
        onClick={onClose}
        className="flex items-center text-gray-300 hover:text-white p-2 -ml-2 rounded-md transition-colors touch-manipulation"
        aria-label={fromPlayer ? 'Back to Player' : 'Back to Scenes'}
        data-testid={`${testId}-back-button`}
      >
        <ChevronLeftIcon className="h-5 w-5" />
        <span className="sr-only">{fromPlayer ? 'Back to Player' : 'Back to Scenes'}</span>
      </button>

      {/* Scene name + Player Mode indicator */}
      <div className="flex items-center space-x-2 flex-1 min-w-0 px-2">
        {fromPlayer && (
          <div
            className="flex-shrink-0 p-1 bg-blue-600 rounded"
            title="Editing from Player Mode"
            data-testid={`${testId}-player-mode-badge`}
          >
            <PlayIcon className="h-4 w-4 text-white" />
          </div>
        )}
        <h1
          className="text-white font-medium truncate"
          title={sceneName}
          data-testid={`${testId}-scene-name`}
        >
          {sceneName}
        </h1>
      </div>

      {/* Mode switcher dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowModeDropdown(!showModeDropdown)}
          className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors touch-manipulation"
          aria-expanded={showModeDropdown}
          aria-haspopup="listbox"
          data-testid={`${testId}-mode-button`}
        >
          <span>{mode === 'channels' ? 'Channels' : 'Layout'}</span>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {showModeDropdown && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowModeDropdown(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 top-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20 min-w-[140px]"
              role="listbox"
              data-testid={`${testId}-mode-dropdown`}
            >
              <button
                onClick={() => handleModeSelect('channels')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                  mode === 'channels'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-200 hover:bg-gray-600'
                }`}
                role="option"
                aria-selected={mode === 'channels'}
                data-testid={`${testId}-mode-option-channels`}
              >
                Channel List
              </button>
              <button
                onClick={() => handleModeSelect('layout')}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                  mode === 'layout'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-200 hover:bg-gray-600'
                }`}
                role="option"
                aria-selected={mode === 'layout'}
                data-testid={`${testId}-mode-option-layout`}
              >
                2D Layout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
