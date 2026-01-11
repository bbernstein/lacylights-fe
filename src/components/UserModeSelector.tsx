'use client';

import { useUserMode } from '@/contexts/UserModeContext';
import {
  UserMode,
  USER_MODE_LABELS,
  USER_MODE_DESCRIPTIONS,
  AVAILABLE_MODES,
} from '@/types/userMode';

interface UserModeSelectorProps {
  /** Compact mode for status bar (default), or expanded for settings page */
  variant?: 'compact' | 'expanded';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mode styling configuration for visual feedback.
 */
const MODE_STYLES: Record<
  UserMode,
  { bg: string; text: string; border: string; icon: string }
> = {
  admin: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
    icon: '👑',
  },
  editor: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-300 dark:border-blue-700',
    icon: '✏️',
  },
  player: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-300 dark:border-green-700',
    icon: '▶️',
  },
  watcher: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
    icon: '👁️',
  },
};

/**
 * Compact mode selector for the status bar.
 * Displays as a dropdown-style selector with minimal footprint.
 */
function CompactSelector({ className = '' }: { className?: string }) {
  const { mode, setMode } = useUserMode();
  const style = MODE_STYLES[mode];

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as UserMode)}
        className={`
          appearance-none cursor-pointer
          text-xs font-medium
          pl-6 pr-6 py-1 rounded-md
          border ${style.border} ${style.bg} ${style.text}
          hover:opacity-80 transition-opacity
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
        title={`Current mode: ${USER_MODE_LABELS[mode]} - ${USER_MODE_DESCRIPTIONS[mode]}`}
        aria-label="Select user mode"
      >
        {AVAILABLE_MODES.map((m) => (
          <option key={m} value={m}>
            {USER_MODE_LABELS[m]}
          </option>
        ))}
      </select>
      {/* Icon positioned absolutely on the left */}
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
        aria-hidden="true"
      >
        {style.icon}
      </span>
      {/* Dropdown arrow on the right */}
      <svg
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${style.text}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

/**
 * Expanded mode selector for settings page.
 * Shows all modes with descriptions and radio-style selection.
 */
function ExpandedSelector({ className = '' }: { className?: string }) {
  const { mode, setMode } = useUserMode();

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        User Mode
      </label>
      <div className="space-y-2">
        {AVAILABLE_MODES.map((m) => {
          const style = MODE_STYLES[m];
          const isSelected = mode === m;

          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`
                w-full text-left p-3 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? `${style.border} ${style.bg}`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  {style.icon}
                </span>
                <div className="flex-1">
                  <div
                    className={`font-medium ${isSelected ? style.text : 'text-gray-900 dark:text-gray-100'}`}
                  >
                    {USER_MODE_LABELS[m]}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {USER_MODE_DESCRIPTIONS[m]}
                  </div>
                </div>
                {isSelected && (
                  <svg
                    className={`w-5 h-5 ${style.text}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Mode is stored locally and persists across sessions.
      </p>
    </div>
  );
}

/**
 * User mode selector component.
 *
 * Allows users to switch between available modes (Editor, Watcher).
 * Provides visual feedback for the current mode.
 *
 * @example
 * ```tsx
 * // In status bar (compact)
 * <UserModeSelector variant="compact" />
 *
 * // In settings page (expanded)
 * <UserModeSelector variant="expanded" />
 * ```
 */
export default function UserModeSelector({
  variant = 'compact',
  className = '',
}: UserModeSelectorProps) {
  if (variant === 'expanded') {
    return <ExpandedSelector className={className} />;
  }
  return <CompactSelector className={className} />;
}
