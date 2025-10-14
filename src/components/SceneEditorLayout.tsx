'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SCENE,
  UPDATE_SCENE,
  START_PREVIEW_SESSION,
  CANCEL_PREVIEW_SESSION,
  UPDATE_PREVIEW_CHANNEL,
  INITIALIZE_PREVIEW_WITH_SCENE,
} from '@/graphql/scenes';
import { FixtureValue, FixtureInstance } from '@/types';
import ChannelListEditor from './ChannelListEditor';
import LayoutCanvas from './LayoutCanvas';
import MultiSelectControls from './MultiSelectControls';

interface SceneEditorLayoutProps {
  sceneId: string;
  mode: 'channels' | 'layout';
  onClose: () => void;
  onToggleMode: () => void;
}

export default function SceneEditorLayout({ sceneId, mode, onClose, onToggleMode }: SceneEditorLayoutProps) {
  // Selection state for layout mode
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set());

  // Local optimistic state for fixture channel values (prevents slider jumping)
  const [localFixtureValues, setLocalFixtureValues] = useState<Map<string, number[]>>(new Map());

  // Preview mode state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch scene data for 2D layout mode
  const { data: sceneData } = useQuery(GET_SCENE, {
    variables: { id: sceneId },
    skip: mode !== 'layout',
  });

  // Mutation for updating scene (no refetch - we use optimistic local state)
  const [updateScene] = useMutation(UPDATE_SCENE);

  // Preview mutations
  const [startPreviewSession] = useMutation(START_PREVIEW_SESSION, {
    onCompleted: (data) => {
      setPreviewSessionId(data.startPreviewSession.id);
      setPreviewMode(true);
      setPreviewError(null);
    },
    onError: (error) => {
      setPreviewError(error.message);
      console.error('Failed to start preview session:', error);
    },
  });

  const [cancelPreviewSession] = useMutation(CANCEL_PREVIEW_SESSION, {
    onCompleted: () => {
      setPreviewSessionId(null);
      setPreviewMode(false);
      setPreviewError(null);
    },
    onError: (error) => {
      setPreviewError(error.message);
      console.error('Failed to cancel preview session:', error);
    },
  });

  const [updatePreviewChannel] = useMutation(UPDATE_PREVIEW_CHANNEL);
  const [initializePreviewWithScene] = useMutation(INITIALIZE_PREVIEW_WITH_SCENE);

  const scene = sceneData?.scene;

  // Build channel values map for layout canvas (merge server + local state)
  const fixtureValues = useMemo(() => {
    const values = new Map<string, number[]>();
    if (scene) {
      scene.fixtureValues.forEach((fv: { fixture: { id: string }; channelValues: number[] }) => {
        const fixtureId = fv.fixture.id;
        // Use local value if available, otherwise use server value
        const channelValues = localFixtureValues.has(fixtureId)
          ? localFixtureValues.get(fixtureId)!
          : (fv.channelValues || []);
        values.set(fixtureId, channelValues);
      });
    }
    return values;
  }, [scene, localFixtureValues]);

  // Get selected fixtures
  const selectedFixtures: FixtureInstance[] = [];
  if (scene) {
    scene.fixtureValues.forEach((fv: FixtureValue) => {
      if (selectedFixtureIds.has(fv.fixture.id)) {
        selectedFixtures.push(fv.fixture);
      }
    });
  }

  // Cleanup preview on unmount or mode switch
  useEffect(() => {
    return () => {
      if (previewMode && previewSessionId) {
        cancelPreviewSession({ variables: { sessionId: previewSessionId } });
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [previewMode, previewSessionId, cancelPreviewSession]);

  // Update local state during drag (immediate, no server call)
  const handleLocalChannelChanges = useCallback((changes: Array<{fixtureId: string, channelIndex: number, value: number}>) => {
    if (!scene || changes.length === 0) return;

    // Update local state immediately for responsive UI
    setLocalFixtureValues(prev => {
      const newMap = new Map(prev);
      changes.forEach(({fixtureId, channelIndex, value}) => {
        // Get current values from previous state, or fall back to scene data
        const currentValues = newMap.get(fixtureId) ||
          scene.fixtureValues.find((fv: FixtureValue) => fv.fixture.id === fixtureId)?.channelValues ||
          [];
        const newValues = [...currentValues];
        newValues[channelIndex] = value;
        newMap.set(fixtureId, newValues);
      });
      return newMap;
    });
  }, [scene]);

  // Debounced preview update for real-time drag updates (50ms debounce)
  const debouncedPreviewUpdate = useCallback((changes: Array<{fixtureId: string, channelIndex: number, value: number}>) => {
    if (!previewMode || !previewSessionId || changes.length === 0) return;

    // Update local state immediately
    handleLocalChannelChanges(changes);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced update
    debounceTimeoutRef.current = setTimeout(() => {
      Promise.all(
        changes.map(({ fixtureId, channelIndex, value }) =>
          updatePreviewChannel({
            variables: { sessionId: previewSessionId, fixtureId, channelIndex, value },
          })
        )
      ).catch(error => {
        console.error('Failed to update preview channels:', error);
        setPreviewError(error.message);
      });
    }, 50);
  }, [previewMode, previewSessionId, updatePreviewChannel, handleLocalChannelChanges]);

  // Batched preview update for mouse-up (no debounce)
  const batchedPreviewUpdate = useCallback((changes: Array<{fixtureId: string, channelIndex: number, value: number}>) => {
    if (!previewMode || !previewSessionId || changes.length === 0) return;

    // Clear any pending debounced update
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Send all changes in parallel immediately
    Promise.all(
      changes.map(({ fixtureId, channelIndex, value }) =>
        updatePreviewChannel({
          variables: { sessionId: previewSessionId, fixtureId, channelIndex, value },
        })
      )
    ).catch(error => {
      console.error('Failed to batch update preview channels:', error);
      setPreviewError(error.message);
    });
  }, [previewMode, previewSessionId, updatePreviewChannel]);

  // Initialize preview with all current scene values
  const initializePreviewWithSceneValues = useCallback(async (sessionId: string) => {
    if (!scene) return;

    try {
      await initializePreviewWithScene({
        variables: { sessionId, sceneId },
      });
    } catch (error) {
      console.error('Failed to initialize preview with scene:', error);
      setPreviewError((error as Error).message);
    }
  }, [scene, sceneId, initializePreviewWithScene]);

  // Toggle preview mode
  const handleTogglePreview = useCallback(async () => {
    if (previewMode && previewSessionId) {
      // Cancel preview
      await cancelPreviewSession({ variables: { sessionId: previewSessionId } });
    } else if (scene?.project?.id) {
      // Start preview
      try {
        const result = await startPreviewSession({
          variables: { projectId: scene.project.id },
        });

        if (result.data?.startPreviewSession?.id) {
          await initializePreviewWithSceneValues(result.data.startPreviewSession.id);
        }
      } catch (error) {
        console.error('Failed to start preview:', error);
        setPreviewError((error as Error).message);
      }
    }
  }, [previewMode, previewSessionId, scene, cancelPreviewSession, startPreviewSession, initializePreviewWithSceneValues]);

  // Handle batched channel value changes from MultiSelectControls
  // changes is an array of {fixtureId, channelIndex, value}
  const handleBatchedChannelChanges = useCallback(async (changes: Array<{fixtureId: string, channelIndex: number, value: number}>) => {
    if (!scene || changes.length === 0) return;

    // Update local state immediately for responsive UI
    // Use state updater to avoid dependency on fixtureValues
    setLocalFixtureValues(prev => {
      const newMap = new Map(prev);
      changes.forEach(({fixtureId, channelIndex, value}) => {
        // Get current values from previous state, or fall back to scene data
        const currentValues = newMap.get(fixtureId) ||
          scene.fixtureValues.find((fv: FixtureValue) => fv.fixture.id === fixtureId)?.channelValues ||
          [];
        const newValues = [...currentValues];
        newValues[channelIndex] = value;
        newMap.set(fixtureId, newValues);
      });
      return newMap;
    });

    // In preview mode, send to preview session instead of updating scene
    if (previewMode && previewSessionId) {
      batchedPreviewUpdate(changes);
      return;
    }

    // Build a map of fixture changes for efficient lookup
    const changesByFixture = new Map<string, Map<number, number>>();
    changes.forEach(({fixtureId, channelIndex, value}) => {
      if (!changesByFixture.has(fixtureId)) {
        changesByFixture.set(fixtureId, new Map());
      }
      changesByFixture.get(fixtureId)!.set(channelIndex, value);
    });

    // Build updated fixture values array for server
    // Use the changes map and scene data directly, not localFixtureValues
    const updatedFixtureValues = scene.fixtureValues.map((fv: FixtureValue) => {
      const fixtureChanges = changesByFixture.get(fv.fixture.id);

      if (fixtureChanges) {
        // Apply all changes to this fixture
        const newChannelValues = [...(fv.channelValues || [])];
        fixtureChanges.forEach((value, channelIndex) => {
          newChannelValues[channelIndex] = value;
        });
        return {
          fixtureId: fv.fixture.id,
          channelValues: newChannelValues,
        };
      }

      // Keep existing values from scene
      return {
        fixtureId: fv.fixture.id,
        channelValues: fv.channelValues || [],
      };
    });

    // Update scene via GraphQL mutation (async, no refetch)
    try {
      await updateScene({
        variables: {
          id: sceneId,
          input: {
            fixtureValues: updatedFixtureValues,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update scene:', error);
      // TODO: Show error toast and revert local state
    }
  }, [scene, sceneId, updateScene, previewMode, previewSessionId, batchedPreviewUpdate]);

  // Handle single channel value change from MultiSelectControls
  const handleChannelChange = useCallback(async (fixtureId: string, channelIndex: number, value: number) => {
    // Delegate to batched handler with single change
    return handleBatchedChannelChanges([{fixtureId, channelIndex, value}]);
  }, [handleBatchedChannelChanges]);

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFixtureIds(newSelection);
  }, []);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedFixtureIds(new Set());
  }, []);

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
          <div className="flex items-center space-x-4">
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

            {/* Preview mode toggle - only show in layout mode */}
            {mode === 'layout' && (
              <div className="flex items-center space-x-3 bg-gray-700/50 rounded-lg px-4 py-2 border border-gray-600">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${previewMode ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} />
                  <div className="text-sm">
                    <span className="text-white font-medium">Preview</span>
                    {previewError && (
                      <span className="text-red-400 text-xs ml-2" title={previewError}>Error</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    previewMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  title={previewMode ? 'Preview mode: Changes sent to DMX for testing' : 'Enable preview mode'}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    previewMode ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            )}
          </div>

          {/* Spacer for layout balance */}
          <div className="w-32" />
        </div>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-hidden relative">
        {mode === 'channels' ? (
          <ChannelListEditor sceneId={sceneId} onClose={onClose} />
        ) : scene ? (
          <>
            <LayoutCanvas
              fixtures={scene.fixtureValues.map((fv: FixtureValue) => fv.fixture)}
              fixtureValues={fixtureValues}
              selectedFixtureIds={selectedFixtureIds}
              onSelectionChange={handleSelectionChange}
            />
            {selectedFixtures.length > 0 && (
              <MultiSelectControls
                selectedFixtures={selectedFixtures}
                fixtureValues={fixtureValues}
                onChannelChange={handleChannelChange}
                onBatchedChannelChanges={handleBatchedChannelChanges}
                onDebouncedPreviewUpdate={debouncedPreviewUpdate}
                onDeselectAll={handleDeselectAll}
              />
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading scene...
          </div>
        )}
      </div>
    </div>
  );
}
