import React, { useState, useEffect } from 'react';
import { FadeBehavior, InstanceChannel } from '@/types';
import FadeBehaviorBadge from './FadeBehaviorBadge';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface FadeBehaviorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: InstanceChannel | null;
  onSave: (channelId: string, fadeBehavior: FadeBehavior) => void;
  isSaving?: boolean;
}

/**
 * Modal for editing the fade behavior of a channel.
 * Allows selecting between FADE, SNAP, and SNAP_END behaviors.
 */
export default function FadeBehaviorEditModal({
  isOpen,
  onClose,
  channel,
  onSave,
  isSaving = false
}: FadeBehaviorEditModalProps) {
  const isMobile = useIsMobile();
  const [selectedBehavior, setSelectedBehavior] = useState<FadeBehavior>(FadeBehavior.FADE);

  useEffect(() => {
    if (channel?.fadeBehavior) {
      setSelectedBehavior(channel.fadeBehavior);
    }
  }, [channel]);

  const handleSave = () => {
    if (channel) {
      onSave(channel.id, selectedBehavior);
    }
  };

  if (!channel) return null;

  const behaviors = [
    {
      value: FadeBehavior.FADE,
      label: 'Fade',
      description: 'Smoothly interpolate between values during transitions. Best for intensity, colors, pan/tilt, zoom.',
      icon: '~'
    },
    {
      value: FadeBehavior.SNAP,
      label: 'Snap',
      description: 'Jump instantly to target value at the START of the transition. Best for gobos, color wheels, effects.',
      icon: '\u26A1'
    },
    {
      value: FadeBehavior.SNAP_END,
      label: 'Snap at End',
      description: 'Jump instantly to target value at the END of the transition. Useful when you want current value to hold until fade completes.',
      icon: '\u23F9'
    }
  ];

  const footerContent = (
    <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
      {isMobile ? (
        <>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedBehavior === channel.fadeBehavior}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedBehavior === channel.fadeBehavior}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Fade Behavior"
      footer={footerContent}
      maxWidth="max-w-md"
      testId="fade-behavior-edit-modal"
    >
      {/* Channel info subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">
        {channel.name} ({channel.type})
      </p>

      <div className="space-y-3">
        {channel.isDiscrete && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Discrete Channel:</strong> This channel has multiple DMX ranges (e.g., gobo slots, color macros).
              SNAP is recommended for discrete channels to avoid visual artifacts during transitions.
            </p>
          </div>
        )}

        {behaviors.map((behavior) => (
          <label
            key={behavior.value}
            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors touch-manipulation ${
              selectedBehavior === behavior.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <input
              type="radio"
              name="fadeBehavior"
              value={behavior.value}
              checked={selectedBehavior === behavior.value}
              onChange={() => setSelectedBehavior(behavior.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {behavior.label}
                </span>
                <FadeBehaviorBadge fadeBehavior={behavior.value} size="sm" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {behavior.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </BottomSheet>
  );
}
