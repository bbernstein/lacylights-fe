'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EFFECTS, DELETE_EFFECT, ACTIVATE_EFFECT, STOP_EFFECT } from '@/graphql/effects';
import { useProject } from '@/contexts/ProjectContext';
import CreateEffectModal from '@/components/CreateEffectModal';
import { Effect, EffectType, WaveformType, PriorityBand } from '@/generated/graphql';

// Helper function to get waveform icon
function getWaveformIcon(waveform: WaveformType | null | undefined): string {
  switch (waveform) {
    case 'SINE':
      return '~';
    case 'SQUARE':
      return '[]';
    case 'SAWTOOTH':
      return '/|';
    case 'TRIANGLE':
      return '/\\';
    case 'COSINE':
      return '~';
    case 'RANDOM':
      return '?';
    default:
      return '-';
  }
}

// Helper function to get effect type badge color
function getEffectTypeBadgeClass(effectType: EffectType): string {
  switch (effectType) {
    case 'WAVEFORM':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'CROSSFADE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'STATIC':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'MASTER':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

// Helper function to get priority band badge color
function getPriorityBadgeClass(band: PriorityBand): string {
  switch (band) {
    case 'SYSTEM':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'CUE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'USER':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'BASE':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

export default function EffectsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [activeEffectId, setActiveEffectId] = useState<string | null>(null);
  const { currentProject, loading: projectLoading } = useProject();

  const { data, loading, error, refetch } = useQuery(GET_EFFECTS, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [deleteEffect] = useMutation(DELETE_EFFECT, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting effect: ${error.message}`);
    },
  });

  const [activateEffect] = useMutation(ACTIVATE_EFFECT, {
    onCompleted: () => {
      // Effect activated
    },
    onError: (error) => {
      alert(`Error activating effect: ${error.message}`);
      setActiveEffectId(null);
    },
  });

  const [stopEffect] = useMutation(STOP_EFFECT, {
    onCompleted: () => {
      setActiveEffectId(null);
    },
    onError: (error) => {
      alert(`Error stopping effect: ${error.message}`);
    },
  });

  // Memoize effects to prevent dependency issues
  const effects = useMemo(() => data?.effects || [], [data?.effects]);

  // Sort effects based on the toggle state
  const sortedEffects = useMemo(() => {
    if (!sortAlphabetically) {
      return effects;
    }
    return [...effects].sort((a: Effect, b: Effect) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [effects, sortAlphabetically]);

  const handleEffectCreated = () => {
    refetch();
  };

  const handleEditEffect = (effect: Effect) => {
    router.push(`/effects/${effect.id}/edit`);
  };

  const handleDeleteEffect = (effect: Effect) => {
    if (window.confirm(`Are you sure you want to delete "${effect.name}"? This action cannot be undone.`)) {
      deleteEffect({
        variables: {
          id: effect.id,
        },
      });
    }
  };

  const handleToggleEffect = (effect: Effect) => {
    if (activeEffectId === effect.id) {
      // Stop the effect
      stopEffect({
        variables: {
          effectId: effect.id,
          fadeTime: 1.0,
        },
      });
    } else {
      // Stop any currently active effect first
      if (activeEffectId) {
        stopEffect({
          variables: {
            effectId: activeEffectId,
            fadeTime: 0.5,
          },
        });
      }
      // Activate the new effect
      setActiveEffectId(effect.id);
      activateEffect({
        variables: {
          effectId: effect.id,
          fadeTime: 1.0,
        },
      });
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">No project selected.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading effects: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Effects</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Create and manage LFO-based lighting effects
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setSortAlphabetically(!sortAlphabetically)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title={sortAlphabetically ? "Show in original order" : "Sort alphabetically"}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortAlphabetically ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              )}
            </svg>
            {sortAlphabetically ? 'Original Order' : 'Sort A-Z'}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Create Effect
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-500 dark:text-gray-400">Loading effects...</p>
        </div>
      ) : sortedEffects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-500 dark:text-gray-400">No effects yet. Create your first effect to get started.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {sortedEffects.map((effect: Effect) => (
              <div key={effect.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-white text-lg">
                    {effect.name}
                  </div>
                  <div className="flex space-x-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getEffectTypeBadgeClass(effect.effectType)}`}>
                      {effect.effectType}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadgeClass(effect.priorityBand)}`}>
                      {effect.priorityBand}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {effect.description || '-'}
                </div>
                {effect.effectType === 'WAVEFORM' && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{getWaveformIcon(effect.waveform)} {effect.waveform}</span>
                    <span>{effect.frequency}Hz</span>
                    <span>{effect.amplitude}%</span>
                  </div>
                )}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleToggleEffect(effect)}
                    className={`p-2 rounded ${
                      activeEffectId === effect.id
                        ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20'
                        : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={activeEffectId === effect.id ? "Stop effect" : "Activate effect"}
                  >
                    {activeEffectId === effect.id ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleEditEffect(effect)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Edit effect"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteEffect(effect)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete effect"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Parameters
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedEffects.map((effect: Effect) => (
                  <tr key={effect.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${activeEffectId === effect.id ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {effect.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {effect.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getEffectTypeBadgeClass(effect.effectType)}`}>
                        {effect.effectType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadgeClass(effect.priorityBand)}`}>
                        {effect.priorityBand}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({effect.prioritySub})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {effect.effectType === 'WAVEFORM' && (
                        <div className="flex items-center space-x-3">
                          <span className="font-mono">{getWaveformIcon(effect.waveform)}</span>
                          <span>{effect.frequency}Hz</span>
                          <span>{effect.amplitude}%</span>
                        </div>
                      )}
                      {effect.effectType === 'MASTER' && (
                        <span>Master: {((effect.masterValue || 1) * 100).toFixed(0)}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleEffect(effect)}
                          className={`p-1 rounded ${
                            activeEffectId === effect.id
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={activeEffectId === effect.id ? "Stop effect" : "Activate effect"}
                        >
                          {activeEffectId === effect.id ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleEditEffect(effect)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit effect"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEffect(effect)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete effect"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {currentProject && (
        <CreateEffectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={currentProject.id}
          onEffectCreated={handleEffectCreated}
        />
      )}
    </div>
  );
}
