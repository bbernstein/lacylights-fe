'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EFFECTS, ACTIVATE_EFFECT, STOP_EFFECT } from '@/graphql/effects';
import { EffectType, WaveformType } from '@/generated/graphql';
import { WaveformIcon } from './WaveformPreview';

interface Effect {
  id: string;
  name: string;
  effectType: EffectType;
  waveform?: WaveformType | null;
  frequency?: number | null;
}

interface EffectsPanelProps {
  projectId: string;
  /** Position of the panel */
  position?: 'left' | 'right';
  /** Whether the panel starts collapsed */
  defaultCollapsed?: boolean;
  /** Callback when panel collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * EffectsPanel provides a floating panel for quick access to effects.
 * Useful for activating/deactivating effects while using the Look Board or other views.
 */
export default function EffectsPanel({
  projectId,
  position = 'right',
  defaultCollapsed = true,
  onCollapseChange,
}: EffectsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeEffectIds, setActiveEffectIds] = useState<Set<string>>(new Set());

  const { data, loading } = useQuery(GET_EFFECTS, {
    variables: { projectId },
    skip: !projectId,
  });

  const [activateEffect] = useMutation(ACTIVATE_EFFECT);
  const [stopEffect] = useMutation(STOP_EFFECT);

  const effects = (data?.effects as Effect[]) || [];

  const handleToggleCollapse = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange?.(newState);
  }, [isCollapsed, onCollapseChange]);

  const handleToggleEffect = useCallback(
    async (effectId: string) => {
      try {
        if (activeEffectIds.has(effectId)) {
          await stopEffect({ variables: { effectId, fadeTime: 1.0 } });
          setActiveEffectIds((prev) => {
            const next = new Set(prev);
            next.delete(effectId);
            return next;
          });
        } else {
          await activateEffect({ variables: { effectId, fadeTime: 1.0 } });
          setActiveEffectIds((prev) => new Set(prev).add(effectId));
        }
      } catch (error) {
        console.error('Error toggling effect:', error);
      }
    },
    [activeEffectIds, activateEffect, stopEffect],
  );

  const handleStopAllEffects = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(activeEffectIds).map((effectId) =>
          stopEffect({ variables: { effectId, fadeTime: 0.5 } }),
        ),
      );
      setActiveEffectIds(new Set());
    } catch (error) {
      console.error('Error stopping all effects:', error);
    }
  }, [activeEffectIds, stopEffect]);

  const getEffectTypeIcon = (effectType: EffectType) => {
    switch (effectType) {
      case EffectType.Waveform:
        return '~';
      case EffectType.Master:
        return 'M';
      case EffectType.Crossfade:
        return '⟷';
      case EffectType.Static:
        return '■';
      default:
        return '?';
    }
  };

  const positionClass = position === 'left' ? 'left-4' : 'right-4';

  if (isCollapsed) {
    return (
      <button
        onClick={handleToggleCollapse}
        className={`fixed ${positionClass} bottom-20 z-40 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all`}
        title="Show Effects Panel"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        {activeEffectIds.size > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {activeEffectIds.size}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed ${positionClass} bottom-4 z-40 w-72 max-h-[60vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="font-semibold text-gray-900 dark:text-white">Effects</span>
          {activeEffectIds.size > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
              {activeEffectIds.size} active
            </span>
          )}
        </div>
        <button
          onClick={handleToggleCollapse}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Collapse panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Effects List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            Loading effects...
          </div>
        ) : effects.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No effects available
          </div>
        ) : (
          <div className="space-y-1">
            {effects.map((effect) => {
              const isActive = activeEffectIds.has(effect.id);
              return (
                <button
                  key={effect.id}
                  onClick={() => handleToggleEffect(effect.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded ${
                        effect.effectType === EffectType.Waveform
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : effect.effectType === EffectType.Master
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {effect.effectType === EffectType.Waveform && effect.waveform ? (
                        <WaveformIcon waveform={effect.waveform} size={16} />
                      ) : (
                        getEffectTypeIcon(effect.effectType)
                      )}
                    </span>
                    <span className="text-sm font-medium truncate">{effect.name}</span>
                  </div>
                  {isActive && (
                    <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Stop All */}
      {activeEffectIds.size > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          <button
            onClick={handleStopAllEffects}
            className="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            Stop All Effects
          </button>
        </div>
      )}
    </div>
  );
}
