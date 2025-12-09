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

/**
 * Type for fixture channel values used in scene updates
 */
type FixtureChannelValues = {
  fixtureId: string;
  channelValues: number[];
};

export default function SceneEditorLayout({ sceneId, mode, onClose, onToggleMode }: SceneEditorLayoutProps) {
  // Selection state for layout mode
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set());

  // Local optimistic state for fixture channel values (prevents slider jumping)
  const [localFixtureValues, setLocalFixtureValues] = useState<Map<string, number[]>>(new Map());

  // Preview mode state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [hasUnsavedPreviewChanges, setHasUnsavedPreviewChanges] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Copy/paste state
  const [copiedChannelValues, setCopiedChannelValues] = useState<number[] | null>(null);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const copyFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
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

    // Mark as having unsaved changes
    setHasUnsavedPreviewChanges(true);

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
      setHasUnsavedPreviewChanges(true);
      return;
    }

    // Show saving indicator
    setSaveStatus('saving');
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
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
    // Use a Map to deduplicate fixtures (in case scene data has duplicates)
    const fixtureValuesMap = new Map<string, FixtureChannelValues>();

    scene.fixtureValues.forEach((fv: FixtureValue) => {
      const fixtureChanges = changesByFixture.get(fv.fixture.id);

      if (fixtureChanges) {
        // Apply all changes to this fixture
        const newChannelValues = [...(fv.channelValues || [])];
        fixtureChanges.forEach((value, channelIndex) => {
          newChannelValues[channelIndex] = value;
        });
        fixtureValuesMap.set(fv.fixture.id, {
          fixtureId: fv.fixture.id,
          channelValues: newChannelValues,
        });
      } else {
        // Keep existing values from scene (only if not already in map)
        if (!fixtureValuesMap.has(fv.fixture.id)) {
          fixtureValuesMap.set(fv.fixture.id, {
            fixtureId: fv.fixture.id,
            channelValues: fv.channelValues || [],
          });
        }
      }
    });

    // Convert Map to array
    const updatedFixtureValues = Array.from(fixtureValuesMap.values());

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

      // Show saved indicator
      setSaveStatus('saved');
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000); // Hide after 2 seconds
    } catch (error) {
      console.error('Failed to update scene:', error);
      setSaveStatus('error');
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000); // Hide error after 3 seconds
    }
  }, [scene, sceneId, updateScene, previewMode, previewSessionId, batchedPreviewUpdate]);

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFixtureIds(newSelection);
  }, []);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedFixtureIds(new Set());
  }, []);

  // Handle copy fixture values (Cmd/Ctrl+C)
  const handleCopyFixtureValues = useCallback(() => {
    if (mode !== 'layout' || selectedFixtureIds.size === 0) return;

    // Get the first selected fixture's channel values
    const firstSelectedId = Array.from(selectedFixtureIds)[0];
    const channelValues = fixtureValues.get(firstSelectedId);

    if (channelValues) {
      setCopiedChannelValues([...channelValues]);

      // Show visual feedback
      setShowCopiedFeedback(true);
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
      copyFeedbackTimeoutRef.current = setTimeout(() => {
        setShowCopiedFeedback(false);
      }, 1500); // Hide after 1.5 seconds
    }
  }, [mode, selectedFixtureIds, fixtureValues]);

  // Handle paste fixture values (Cmd/Ctrl+V)
  const handlePasteFixtureValues = useCallback(() => {
    if (mode !== 'layout' || selectedFixtureIds.size === 0 || !copiedChannelValues) return;

    // Build changes array for all selected fixtures
    const changes: Array<{ fixtureId: string; channelIndex: number; value: number }> = [];

    selectedFixtureIds.forEach((fixtureId) => {
      // Get the fixture to determine how many channels it has
      const currentValues = fixtureValues.get(fixtureId);
      if (!currentValues) return;

      // Paste values for each channel (up to the length of the copied values or current fixture channels)
      const channelCount = Math.min(copiedChannelValues.length, currentValues.length);
      for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        changes.push({
          fixtureId,
          channelIndex,
          value: copiedChannelValues[channelIndex],
        });
      }
    });

    // Apply all changes using the existing batched handler
    if (changes.length > 0) {
      handleBatchedChannelChanges(changes);
    }
  }, [mode, selectedFixtureIds, copiedChannelValues, fixtureValues, handleBatchedChannelChanges]);

  // Keyboard event handler for copy/paste in layout mode
  useEffect(() => {
    if (mode !== 'layout') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (isCmdOrCtrl && e.key === 'c') {
        e.preventDefault();
        handleCopyFixtureValues();
      } else if (isCmdOrCtrl && e.key === 'v') {
        e.preventDefault();
        handlePasteFixtureValues();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, handleCopyFixtureValues, handlePasteFixtureValues]);

  // Apply preview changes to scene
  const handleApplyToScene = useCallback(async () => {
    if (!scene || !previewMode) return;

    setSaveStatus('saving');
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }

    try {
      // Build updated fixture values from current local state
      // Use a Map to deduplicate fixtures (in case scene data has duplicates)
      const fixtureValuesMap = new Map<string, FixtureChannelValues>();

      scene.fixtureValues.forEach((fv: FixtureValue) => {
        const localValues = localFixtureValues.get(fv.fixture.id);

        fixtureValuesMap.set(fv.fixture.id, {
          fixtureId: fv.fixture.id,
          channelValues: localValues || fv.channelValues || [],
        });
      });

      const updatedFixtureValues = Array.from(fixtureValuesMap.values());

      await updateScene({
        variables: {
          id: sceneId,
          input: {
            fixtureValues: updatedFixtureValues,
          },
        },
      });

      setHasUnsavedPreviewChanges(false);
      setSaveStatus('saved');
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to apply preview to scene:', error);
      setSaveStatus('error');
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [scene, previewMode, localFixtureValues, sceneId, updateScene]);

  // Handle close with warning for unsaved preview changes
  const handleClose = useCallback(() => {
    if (hasUnsavedPreviewChanges) {
      const confirmed = window.confirm(
        'You have unsaved preview changes. These changes will be lost if you close without applying them to the scene. Do you want to close anyway?'
      );
      if (!confirmed) return;
    }
    onClose();
  }, [hasUnsavedPreviewChanges, onClose]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Top bar with mode switcher and controls */}
      <div className="flex-none bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={handleClose}
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

            {/* Preview mode toggle and controls - only show in layout mode */}
            {mode === 'layout' && (
              <>
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

                {/* Apply to Scene button - show when in preview mode with unsaved changes */}
                {previewMode && hasUnsavedPreviewChanges && (
                  <button
                    onClick={handleApplyToScene}
                    disabled={saveStatus === 'saving'}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save current preview values to the scene"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply to Scene
                  </button>
                )}

                {/* Save status indicator */}
                {saveStatus !== 'idle' && (
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600">
                    {saveStatus === 'saving' && (
                      <>
                        <svg className="animate-spin h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-300">Saving...</span>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <>
                        <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-400">Saved</span>
                      </>
                    )}
                    {saveStatus === 'error' && (
                      <>
                        <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-sm text-red-400">Error</span>
                      </>
                    )}
                  </div>
                )}
              </>
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
              onCopy={handleCopyFixtureValues}
              onPaste={handlePasteFixtureValues}
              canPaste={copiedChannelValues !== null}
              showCopiedFeedback={showCopiedFeedback}
            />
            {selectedFixtures.length > 0 && (
              <MultiSelectControls
                selectedFixtures={selectedFixtures}
                fixtureValues={fixtureValues}
                onBatchedChannelChanges={handleBatchedChannelChanges}
                onDebouncedPreviewUpdate={debouncedPreviewUpdate}
                onDeselectAll={handleDeselectAll}
              />
            )}

            {/* Copy feedback toast */}
            {showCopiedFeedback && (
              <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg shadow-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200 animate-in fade-in slide-in-from-right-5">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-medium">Copied!</span>
                <span className="text-gray-400 text-sm">({selectedFixtures.length} fixture{selectedFixtures.length > 1 ? 's' : ''})</span>
              </div>
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
