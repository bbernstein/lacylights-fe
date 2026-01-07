'use client';

import { XMarkIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * Props for MobileFixtureToolbar component
 */
interface MobileFixtureToolbarProps {
  /** Number of selected fixtures */
  selectedCount: number;
  /** Current RGB color (null if no color channels) */
  color: { r: number; g: number; b: number } | null;
  /** Called when color swatch is clicked */
  onColorClick: () => void;
  /** Called when expand button is clicked */
  onExpand: () => void;
  /** Called when deselect all is clicked */
  onDeselectAll: () => void;
  /** Test ID for the component */
  testId?: string;
}

/**
 * Compact, non-modal toolbar for fixture controls on mobile.
 * Positioned above SceneEditorBottomActions to allow continued canvas interaction.
 *
 * Features:
 * - Shows selection count
 * - Color swatch (tappable to open color picker)
 * - Expand button (to show full channel controls)
 * - Deselect all button
 * - Non-modal: doesn't block canvas interaction
 *
 * @example
 * ```tsx
 * <MobileFixtureToolbar
 *   selectedCount={3}
 *   color={{ r: 255, g: 0, b: 0 }}
 *   onColorClick={() => openColorPicker()}
 *   onExpand={() => showFullControls()}
 *   onDeselectAll={() => clearSelection()}
 * />
 * ```
 */
export default function MobileFixtureToolbar({
  selectedCount,
  color,
  onColorClick,
  onExpand,
  onDeselectAll,
  testId = 'mobile-fixture-toolbar',
}: MobileFixtureToolbarProps) {
  return (
    <div
      className="fixed left-0 right-0 bottom-32 z-40 px-2 md:hidden"
      data-testid={testId}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 flex items-center gap-2">
        {/* Deselect button */}
        <button
          onClick={onDeselectAll}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors touch-manipulation"
          aria-label="Deselect all fixtures"
          data-testid={`${testId}-deselect`}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Selection count */}
        <div className="flex-1 text-white text-sm font-medium">
          {selectedCount} fixture{selectedCount !== 1 ? 's' : ''} selected
        </div>

        {/* Color swatch (if color channels exist) */}
        {color && (
          <button
            onClick={onColorClick}
            className="w-10 h-10 rounded-md border-2 border-gray-600 hover:border-blue-500 transition-colors cursor-pointer touch-manipulation flex-shrink-0"
            style={{
              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
            }}
            title="Open color picker"
            aria-label="Open color picker"
            data-testid={`${testId}-color`}
          />
        )}

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors touch-manipulation flex items-center gap-1"
          aria-label="Expand controls"
          data-testid={`${testId}-expand`}
        >
          <ChevronUpIcon className="h-5 w-5" />
          <span className="text-sm">More</span>
        </button>
      </div>
    </div>
  );
}
