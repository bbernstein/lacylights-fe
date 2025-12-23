"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
  GET_SCENE,
  UPDATE_SCENE,
  START_PREVIEW_SESSION,
  CANCEL_PREVIEW_SESSION,
  UPDATE_PREVIEW_CHANNEL,
  INITIALIZE_PREVIEW_WITH_SCENE,
  ACTIVATE_SCENE,
} from "@/graphql/scenes";
import { FixtureValue, FixtureInstance, ChannelValue } from "@/types";
import ChannelListEditor from "./ChannelListEditor";
import LayoutCanvas from "./LayoutCanvas";
import MultiSelectControls from "./MultiSelectControls";
import UnsavedChangesModal from "./UnsavedChangesModal";
import { sparseToDense, denseToSparse } from "@/utils/channelConversion";
import { useUndoStack, UndoDelta } from "@/hooks/useUndoStack";

interface SceneEditorLayoutProps {
  sceneId: string;
  mode: "channels" | "layout";
  onClose: () => void;
  onToggleMode: () => void;
  fromPlayer?: boolean;
  cueListId?: string;
  returnCueNumber?: string;
}

/**
 * Shared state passed to ChannelListEditor for coordinated editing
 */
export interface SharedEditorState {
  /** Channel values map (fixtureId -> array of channel values) */
  channelValues: Map<string, number[]>;
  /** Active channels map (fixtureId -> set of active channel indices) */
  activeChannels: Map<string, Set<number>>;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Undo stack controls */
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Channel value change handler (single channel) */
  onChannelValueChange: (
    fixtureId: string,
    channelIndex: number,
    value: number,
  ) => void;
  /** Batch channel value change handler (multiple channels at once) */
  onBatchChannelValueChange: (
    changes: Array<{ fixtureId: string; channelIndex: number; value: number }>,
  ) => void;
  /** Toggle channel active state */
  onToggleChannelActive: (
    fixtureId: string,
    channelIndex: number,
    isActive: boolean,
  ) => void;
  /** Save changes */
  onSave: () => Promise<void>;
  /** Save status */
  saveStatus: "idle" | "saving" | "saved" | "error";
}

/**
 * Type for fixture channel values used in scene updates
 */
type FixtureChannelValues = {
  fixtureId: string;
  channels: ChannelValue[];
};

export default function SceneEditorLayout({
  sceneId,
  mode,
  onClose,
  onToggleMode,
  fromPlayer,
  cueListId,
  returnCueNumber,
}: SceneEditorLayoutProps) {
  const router = useRouter();

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef<boolean>(true);

  // Selection state for layout mode
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(
    new Set(),
  );

  // Local optimistic state for fixture channel values (prevents slider jumping)
  const [localFixtureValues, setLocalFixtureValues] = useState<
    Map<string, number[]>
  >(new Map());

  // Preview mode state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [hasUnsavedPreviewChanges, setHasUnsavedPreviewChanges] =
    useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Copy/paste state
  const [copiedChannelValues, setCopiedChannelValues] = useState<
    number[] | null
  >(null);
  const [copiedActiveChannels, setCopiedActiveChannels] =
    useState<Set<number> | null>(null);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const copyFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track which channels are active (will be saved) per fixture
  // Key: fixtureId, Value: Set of channel indices that are active
  const [activeChannels, setActiveChannels] = useState<
    Map<string, Set<number>>
  >(new Map());

  // Undo/redo stack
  const { pushAction, undo, redo, canUndo, canRedo, clearHistory } =
    useUndoStack({
      maxStackSize: 50,
      coalesceWindowMs: 500,
    });

  // Unsaved changes modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"close" | "switch" | null>(
    null,
  );

  // Fetch scene data for both modes (shared state)
  const {
    data: sceneData,
    loading: sceneLoading,
    refetch: refetchScene,
  } = useQuery(GET_SCENE, {
    variables: { id: sceneId },
  });

  // Mutation for updating scene (no refetch - we use optimistic local state)
  const [updateScene] = useMutation(UPDATE_SCENE);

  // Mutation for activating scene (used when coming from Player Mode)
  const [activateScene] = useMutation(ACTIVATE_SCENE);

  // Preview mutations
  const [startPreviewSession] = useMutation(START_PREVIEW_SESSION, {
    onCompleted: (data) => {
      setPreviewSessionId(data.startPreviewSession.id);
      setPreviewMode(true);
      setPreviewError(null);
    },
    onError: (error) => {
      setPreviewError(error.message);
      console.error("Failed to start preview session:", error);
    },
  });

  const [cancelPreviewSession] = useMutation(CANCEL_PREVIEW_SESSION, {
    onCompleted: () => {
      if (isMounted.current) {
        setPreviewSessionId(null);
        setPreviewMode(false);
        setPreviewError(null);
      }
    },
    onError: (error) => {
      if (isMounted.current) {
        setPreviewError(error.message);
      }
      console.error("Failed to cancel preview session:", error);
    },
  });

  const [updatePreviewChannel] = useMutation(UPDATE_PREVIEW_CHANNEL);
  const [initializePreviewWithScene] = useMutation(
    INITIALIZE_PREVIEW_WITH_SCENE,
  );

  const scene = sceneData?.scene;

  // Cache converted sparse-to-dense values to avoid repeated conversions
  const serverDenseValues = useMemo(() => {
    const values = new Map<string, number[]>();
    if (scene) {
      scene.fixtureValues.forEach((fv: FixtureValue) => {
        const channelCount = fv.fixture.channels?.length || 0;
        values.set(
          fv.fixture.id,
          sparseToDense(fv.channels || [], channelCount),
        );
      });
    }
    return values;
  }, [scene]);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize local state from scene data when scene loads
  useEffect(() => {
    if (scene) {
      // Initialize active channels
      const active = new Map<string, Set<number>>();
      scene.fixtureValues.forEach((fv: FixtureValue) => {
        // Build set of active channel indices from sparse array
        const activeSet = new Set<number>();
        (fv.channels || []).forEach((ch: ChannelValue) => {
          activeSet.add(ch.offset);
        });
        active.set(fv.fixture.id, activeSet);
      });
      setActiveChannels(active);

      // Initialize channel values from scene (only if not already set)
      // This ensures we don't overwrite values when switching between modes
      if (localFixtureValues.size === 0) {
        const values = new Map<string, number[]>();
        scene.fixtureValues.forEach((fv: FixtureValue) => {
          const channelCount = fv.fixture.channels?.length || 0;
          values.set(
            fv.fixture.id,
            sparseToDense(fv.channels || [], channelCount),
          );
        });
        setLocalFixtureValues(values);
      }
    }
  }, [scene, localFixtureValues.size]);

  // Build channel values map for layout canvas (merge server + local state)
  const fixtureValues = useMemo(() => {
    const values = new Map<string, number[]>();
    if (scene) {
      scene.fixtureValues.forEach((fv: FixtureValue) => {
        const fixtureId = fv.fixture.id;
        // Use local value if available, otherwise use cached server value
        const channelValues = localFixtureValues.has(fixtureId)
          ? localFixtureValues.get(fixtureId)!
          : serverDenseValues.get(fixtureId) || [];
        values.set(fixtureId, channelValues);
      });
    }
    return values;
  }, [scene, localFixtureValues, serverDenseValues]);

  // Get selected fixtures
  const selectedFixtures: FixtureInstance[] = [];
  if (scene) {
    scene.fixtureValues.forEach((fv: FixtureValue) => {
      if (selectedFixtureIds.has(fv.fixture.id)) {
        selectedFixtures.push(fv.fixture);
      }
    });
  }

  // Compute dirty state by comparing local values with server values
  const isDirty = useMemo(() => {
    // If no local changes, not dirty
    if (localFixtureValues.size === 0) return false;

    // Compare with server values
    for (const [fixtureId, localValues] of localFixtureValues) {
      const serverValues = serverDenseValues.get(fixtureId);
      if (!serverValues) return true; // New fixture added locally
      if (localValues.length !== serverValues.length) return true;
      for (let i = 0; i < localValues.length; i++) {
        if (localValues[i] !== serverValues[i]) return true;
      }
    }

    return false;
  }, [localFixtureValues, serverDenseValues]);

  // Auto-activate scene on mount when coming from Player Mode (prevents blackout)
  useEffect(() => {
    if (fromPlayer && sceneId) {
      activateScene({
        variables: { sceneId },
      }).catch((error) => {
        console.error("Failed to activate scene from Player Mode:", error);
      });
    }
  }, [fromPlayer, sceneId, activateScene]);

  // Auto-start preview mode when coming from Player Mode
  useEffect(() => {
    if (fromPlayer && !previewMode && scene?.project?.id) {
      handleTogglePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPlayer, scene?.project?.id]);

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
  const handleLocalChannelChanges = useCallback(
    (
      changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }>,
    ) => {
      if (!scene || changes.length === 0) return;

      // Update local state immediately for responsive UI
      setLocalFixtureValues((prev) => {
        const newMap = new Map(prev);
        changes.forEach(({ fixtureId, channelIndex, value }) => {
          // Get current values from previous state, or fall back to cached server values
          const currentValues =
            newMap.get(fixtureId) || serverDenseValues.get(fixtureId) || [];
          const newValues = [...currentValues];
          newValues[channelIndex] = value;
          newMap.set(fixtureId, newValues);
        });
        return newMap;
      });
    },
    [scene, serverDenseValues],
  );

  // Debounced preview update for real-time drag updates (50ms debounce)
  const debouncedPreviewUpdate = useCallback(
    (
      changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }>,
    ) => {
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
              variables: {
                sessionId: previewSessionId,
                fixtureId,
                channelIndex,
                value,
              },
            }),
          ),
        ).catch((error) => {
          console.error("Failed to update preview channels:", error);
          setPreviewError(error.message);
        });
      }, 50);
    },
    [
      previewMode,
      previewSessionId,
      updatePreviewChannel,
      handleLocalChannelChanges,
    ],
  );

  // Batched preview update for mouse-up (no debounce)
  const batchedPreviewUpdate = useCallback(
    (
      changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }>,
    ) => {
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
            variables: {
              sessionId: previewSessionId,
              fixtureId,
              channelIndex,
              value,
            },
          }),
        ),
      ).catch((error) => {
        console.error("Failed to batch update preview channels:", error);
        setPreviewError(error.message);
      });
    },
    [previewMode, previewSessionId, updatePreviewChannel],
  );

  // Initialize preview with all current scene values
  const initializePreviewWithSceneValues = useCallback(
    async (sessionId: string) => {
      if (!scene) return;

      try {
        await initializePreviewWithScene({
          variables: { sessionId, sceneId },
        });
      } catch (error) {
        console.error("Failed to initialize preview with scene:", error);
        setPreviewError((error as Error).message);
      }
    },
    [scene, sceneId, initializePreviewWithScene],
  );

  // Toggle preview mode
  const handleTogglePreview = useCallback(async () => {
    if (previewMode && previewSessionId) {
      // Cancel preview
      await cancelPreviewSession({
        variables: { sessionId: previewSessionId },
      });
    } else if (scene?.project?.id) {
      // Start preview
      try {
        const result = await startPreviewSession({
          variables: { projectId: scene.project.id },
        });

        if (result.data?.startPreviewSession?.id) {
          await initializePreviewWithSceneValues(
            result.data.startPreviewSession.id,
          );
        }
      } catch (error) {
        console.error("Failed to start preview:", error);
        setPreviewError((error as Error).message);
      }
    }
  }, [
    previewMode,
    previewSessionId,
    scene,
    cancelPreviewSession,
    startPreviewSession,
    initializePreviewWithSceneValues,
  ]);

  // Handle single channel value change (used by ChannelListEditor)
  const handleSingleChannelChange = useCallback(
    (fixtureId: string, channelIndex: number, value: number) => {
      if (!scene) return;

      // Capture previous value for undo
      const currentValues =
        localFixtureValues.get(fixtureId) ||
        serverDenseValues.get(fixtureId) ||
        [];
      const previousValue = currentValues[channelIndex] ?? 0;

      // Update local state
      setLocalFixtureValues((prev) => {
        const newMap = new Map(prev);
        const values =
          newMap.get(fixtureId) || serverDenseValues.get(fixtureId) || [];
        const newValues = [...values];
        newValues[channelIndex] = value;
        newMap.set(fixtureId, newValues);
        return newMap;
      });

      // Push to undo stack
      pushAction({
        type: "CHANNEL_CHANGE",
        channelDeltas: [
          {
            fixtureId,
            channelIndex,
            previousValue,
            newValue: value,
          },
        ],
        description: `Changed channel ${channelIndex}`,
      });

      // Update preview if active
      if (previewMode && previewSessionId) {
        debouncedPreviewUpdate([{ fixtureId, channelIndex, value }]);
      }
    },
    [
      scene,
      localFixtureValues,
      serverDenseValues,
      pushAction,
      previewMode,
      previewSessionId,
      debouncedPreviewUpdate,
    ],
  );

  // Handle batched channel value changes from MultiSelectControls
  // Changes are saved locally only - user must click Save to persist
  // changes is an array of {fixtureId, channelIndex, value}
  const handleBatchedChannelChanges = useCallback(
    (
      changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }>,
    ) => {
      if (!scene || changes.length === 0) return;

      // Capture previous values for undo BEFORE updating state
      const undoDeltas: UndoDelta[] = changes.map(
        ({ fixtureId, channelIndex, value }) => {
          const currentValues =
            localFixtureValues.get(fixtureId) ||
            serverDenseValues.get(fixtureId) ||
            [];
          return {
            fixtureId,
            channelIndex,
            previousValue: currentValues[channelIndex] ?? 0,
            newValue: value,
          };
        },
      );

      // Update local state immediately for responsive UI
      setLocalFixtureValues((prev) => {
        const newMap = new Map(prev);
        changes.forEach(({ fixtureId, channelIndex, value }) => {
          // Get current values from previous state, or fall back to cached server values
          const currentValues =
            newMap.get(fixtureId) || serverDenseValues.get(fixtureId) || [];
          const newValues = [...currentValues];
          newValues[channelIndex] = value;
          newMap.set(fixtureId, newValues);
        });
        return newMap;
      });

      // Push to undo stack (will be coalesced if rapid changes)
      pushAction({
        type: "BATCH_CHANGE",
        channelDeltas: undoDeltas,
        description:
          changes.length === 1
            ? `Changed channel ${changes[0].channelIndex}`
            : `Changed ${changes.length} channels`,
      });

      // In preview mode, send to preview session for real-time feedback
      if (previewMode && previewSessionId) {
        batchedPreviewUpdate(changes);
      }

      // Note: Save is now deferred - user must click "Save Changes" button
      // The isDirty computed value will update to reflect unsaved changes
    },
    [
      scene,
      previewMode,
      previewSessionId,
      batchedPreviewUpdate,
      serverDenseValues,
      localFixtureValues,
      pushAction,
    ],
  );

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFixtureIds(newSelection);
  }, []);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedFixtureIds(new Set());
  }, []);

  // Toggle a channel's active state
  const handleToggleChannelActive = useCallback(
    (fixtureId: string, channelIndex: number, isActive: boolean) => {
      setActiveChannels((prev) => {
        const newMap = new Map(prev);
        const fixtureSet = new Set(newMap.get(fixtureId) || []);
        if (isActive) {
          fixtureSet.add(channelIndex);
        } else {
          fixtureSet.delete(channelIndex);
        }
        newMap.set(fixtureId, fixtureSet);
        return newMap;
      });
      // Note: isDirty is computed from local vs server values
      // Toggling active channels affects what gets saved, but isn't tracked in isDirty
    },
    [],
  );

  // Save current changes to the scene
  const handleSaveScene = useCallback(async () => {
    if (!scene) return;

    setSaveStatus("saving");
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }

    try {
      // Build updated fixture values from current local state
      const fixtureValuesMap = new Map<string, FixtureChannelValues>();

      // Build set of existing fixture IDs for quick lookup
      const existingFixtureIds = new Set(
        scene.fixtureValues.map((fv: FixtureValue) => fv.fixture.id),
      );

      // First, process existing fixtures from the scene
      scene.fixtureValues.forEach((fv: FixtureValue) => {
        const localValues = localFixtureValues.get(fv.fixture.id);
        const fixtureActiveChannels = activeChannels.get(fv.fixture.id);

        // Convert dense local values or sparse server values to sparse format
        const allChannels = localValues
          ? denseToSparse(localValues)
          : fv.channels || [];

        // Filter to only include active channels
        const sparseChannels = fixtureActiveChannels
          ? allChannels.filter((ch) => fixtureActiveChannels.has(ch.offset))
          : allChannels;

        fixtureValuesMap.set(fv.fixture.id, {
          fixtureId: fv.fixture.id,
          channels: sparseChannels,
        });
      });

      // Then, add any new fixtures from localFixtureValues that aren't in scene.fixtureValues
      // These are fixtures that were added but not yet saved
      for (const [fixtureId, localValues] of localFixtureValues) {
        if (!existingFixtureIds.has(fixtureId)) {
          const fixtureActiveChannels = activeChannels.get(fixtureId);
          const allChannels = denseToSparse(localValues);

          // Filter to only include active channels (or all if no active tracking)
          const sparseChannels = fixtureActiveChannels
            ? allChannels.filter((ch) => fixtureActiveChannels.has(ch.offset))
            : allChannels;

          fixtureValuesMap.set(fixtureId, {
            fixtureId,
            channels: sparseChannels,
          });
        }
      }

      const updatedFixtureValues = Array.from(fixtureValuesMap.values());

      await updateScene({
        variables: {
          id: sceneId,
          input: {
            fixtureValues: updatedFixtureValues,
          },
        },
      });

      // Refetch scene data to update serverDenseValues with saved values
      await refetchScene();

      // Clear undo history after save
      clearHistory();

      // Reset local state - initialization effect will repopulate from fresh server data
      setLocalFixtureValues(new Map());

      // Show saved indicator
      setSaveStatus("saved");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);

      // Auto-navigate back to Player Mode if that's where we came from
      if (fromPlayer && cueListId) {
        const highlightParam = returnCueNumber
          ? `?highlightCue=${returnCueNumber}`
          : "";
        router.push(`/cue-lists/${cueListId}${highlightParam}`);
      }
    } catch (error) {
      console.error("Failed to save scene:", error);
      setSaveStatus("error");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  }, [
    scene,
    sceneId,
    updateScene,
    localFixtureValues,
    activeChannels,
    clearHistory,
    refetchScene,
    fromPlayer,
    cueListId,
    returnCueNumber,
    router,
  ]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const action = undo();
    if (!action) return;

    // Apply reverse of the action
    if (action.channelDeltas) {
      setLocalFixtureValues((prev) => {
        const newMap = new Map(prev);
        action.channelDeltas!.forEach((delta) => {
          const currentValues =
            newMap.get(delta.fixtureId) ||
            serverDenseValues.get(delta.fixtureId) ||
            [];
          const newValues = [...currentValues];
          newValues[delta.channelIndex] = delta.previousValue;
          newMap.set(delta.fixtureId, newValues);

          // Also update preview if active
          if (previewMode && previewSessionId) {
            updatePreviewChannel({
              variables: {
                sessionId: previewSessionId,
                fixtureId: delta.fixtureId,
                channelIndex: delta.channelIndex,
                value: delta.previousValue,
              },
            });
          }
        });
        return newMap;
      });
    }
  }, [
    undo,
    previewMode,
    previewSessionId,
    updatePreviewChannel,
    serverDenseValues,
  ]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const action = redo();
    if (!action) return;

    // Re-apply the action
    if (action.channelDeltas) {
      setLocalFixtureValues((prev) => {
        const newMap = new Map(prev);
        action.channelDeltas!.forEach((delta) => {
          const currentValues =
            newMap.get(delta.fixtureId) ||
            serverDenseValues.get(delta.fixtureId) ||
            [];
          const newValues = [...currentValues];
          newValues[delta.channelIndex] = delta.newValue;
          newMap.set(delta.fixtureId, newValues);

          // Also update preview if active
          if (previewMode && previewSessionId) {
            updatePreviewChannel({
              variables: {
                sessionId: previewSessionId,
                fixtureId: delta.fixtureId,
                channelIndex: delta.channelIndex,
                value: delta.newValue,
              },
            });
          }
        });
        return newMap;
      });
    }
  }, [
    redo,
    previewMode,
    previewSessionId,
    updatePreviewChannel,
    serverDenseValues,
  ]);

  // Discard local changes and reset to server state
  const handleDiscardChanges = useCallback(() => {
    setLocalFixtureValues(new Map());
    clearHistory();
  }, [clearHistory]);

  // Handle copy fixture values (Cmd/Ctrl+C)
  const handleCopyFixtureValues = useCallback(() => {
    if (mode !== "layout" || selectedFixtureIds.size === 0) return;

    // Get the first selected fixture's channel values
    const firstSelectedId = Array.from(selectedFixtureIds)[0];
    const channelValues = fixtureValues.get(firstSelectedId);

    if (channelValues) {
      setCopiedChannelValues([...channelValues]);

      // Also copy active channels state
      const fixtureActiveChannels = activeChannels.get(firstSelectedId);
      setCopiedActiveChannels(
        fixtureActiveChannels ? new Set(fixtureActiveChannels) : null,
      );

      // Show visual feedback
      setShowCopiedFeedback(true);
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
      copyFeedbackTimeoutRef.current = setTimeout(() => {
        setShowCopiedFeedback(false);
      }, 1500); // Hide after 1.5 seconds
    }
  }, [mode, selectedFixtureIds, fixtureValues, activeChannels]);

  // Handle paste fixture values (Cmd/Ctrl+V)
  const handlePasteFixtureValues = useCallback(() => {
    if (
      mode !== "layout" ||
      selectedFixtureIds.size === 0 ||
      !copiedChannelValues
    )
      return;

    // Build changes array for all selected fixtures
    const changes: Array<{
      fixtureId: string;
      channelIndex: number;
      value: number;
    }> = [];

    // Build new active channels map synchronously (to pass to handleBatchedChannelChanges)
    const newActiveChannels = new Map(activeChannels);

    selectedFixtureIds.forEach((fixtureId) => {
      // Get the fixture to determine how many channels it has
      const currentValues = fixtureValues.get(fixtureId);
      if (!currentValues) return;

      // Paste values for each channel (up to the length of the copied values or current fixture channels)
      const channelCount = Math.min(
        copiedChannelValues.length,
        currentValues.length,
      );
      for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        changes.push({
          fixtureId,
          channelIndex,
          value: copiedChannelValues[channelIndex],
        });
      }

      // Also build new active channels state if available
      if (copiedActiveChannels !== null) {
        const newActiveSet = new Set<number>();
        // Copy active state for channels that exist in destination fixture
        for (
          let channelIndex = 0;
          channelIndex < channelCount;
          channelIndex++
        ) {
          if (copiedActiveChannels.has(channelIndex)) {
            newActiveSet.add(channelIndex);
          }
        }
        newActiveChannels.set(fixtureId, newActiveSet);
      }
    });

    // Update active channels state
    if (copiedActiveChannels !== null) {
      setActiveChannels(newActiveChannels);
    }

    // Apply all changes using the existing batched handler
    if (changes.length > 0) {
      handleBatchedChannelChanges(changes);
    }
  }, [
    mode,
    selectedFixtureIds,
    copiedChannelValues,
    copiedActiveChannels,
    fixtureValues,
    activeChannels,
    handleBatchedChannelChanges,
  ]);

  // Keyboard event handler for copy/paste and undo/redo in layout mode
  useEffect(() => {
    if (mode !== "layout") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (isCmdOrCtrl && e.key === "c") {
        e.preventDefault();
        handleCopyFixtureValues();
      } else if (isCmdOrCtrl && e.key === "v") {
        e.preventDefault();
        handlePasteFixtureValues();
      } else if (isCmdOrCtrl && e.key === "z" && !e.shiftKey) {
        // Undo: Cmd+Z or Ctrl+Z
        e.preventDefault();
        handleUndo();
      } else if (isCmdOrCtrl && e.key === "z" && e.shiftKey) {
        // Redo: Cmd+Shift+Z or Ctrl+Shift+Z
        e.preventDefault();
        handleRedo();
      } else if (isCmdOrCtrl && e.key === "s") {
        // Save: Cmd+S or Ctrl+S
        e.preventDefault();
        if (isDirty) {
          handleSaveScene();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    mode,
    handleCopyFixtureValues,
    handlePasteFixtureValues,
    handleUndo,
    handleRedo,
    isDirty,
    handleSaveScene,
  ]);

  // Apply preview changes to scene
  const handleApplyToScene = useCallback(async () => {
    if (!scene || !previewMode) return;

    setSaveStatus("saving");
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }

    try {
      // Build updated fixture values from current local state
      // Use a Map to deduplicate fixtures (in case scene data has duplicates)
      const fixtureValuesMap = new Map<string, FixtureChannelValues>();

      scene.fixtureValues.forEach((fv: FixtureValue) => {
        const localValues = localFixtureValues.get(fv.fixture.id);
        const fixtureActiveChannels = activeChannels.get(fv.fixture.id);

        // Convert dense local values or sparse server values to sparse format
        const allChannels = localValues
          ? denseToSparse(localValues)
          : fv.channels || [];

        // Filter to only include active channels
        const sparseChannels = fixtureActiveChannels
          ? allChannels.filter((ch) => fixtureActiveChannels.has(ch.offset))
          : allChannels; // If no active tracking, include all

        fixtureValuesMap.set(fv.fixture.id, {
          fixtureId: fv.fixture.id,
          channels: sparseChannels,
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
      setSaveStatus("saved");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to apply preview to scene:", error);
      setSaveStatus("error");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  }, [
    scene,
    previewMode,
    localFixtureValues,
    activeChannels,
    sceneId,
    updateScene,
  ]);

  // Handle close with unsaved changes modal
  const handleClose = useCallback(() => {
    if (isDirty || hasUnsavedPreviewChanges) {
      setPendingAction("close");
      setShowUnsavedModal(true);
      return;
    }
    onClose();
  }, [isDirty, hasUnsavedPreviewChanges, onClose]);

  // Handle mode switch with unsaved changes check
  const handleModeSwitch = useCallback(() => {
    if (isDirty) {
      setPendingAction("switch");
      setShowUnsavedModal(true);
      return;
    }
    onToggleMode();
  }, [isDirty, onToggleMode]);

  // Handle modal save action
  const handleModalSave = useCallback(async () => {
    await handleSaveScene();
    setShowUnsavedModal(false);
    if (pendingAction === "close") {
      onClose();
    } else if (pendingAction === "switch") {
      onToggleMode();
    }
    setPendingAction(null);
  }, [handleSaveScene, pendingAction, onClose, onToggleMode]);

  // Handle modal discard action
  const handleModalDiscard = useCallback(() => {
    handleDiscardChanges();
    setShowUnsavedModal(false);
    if (pendingAction === "close") {
      onClose();
    } else if (pendingAction === "switch") {
      onToggleMode();
    }
    setPendingAction(null);
  }, [handleDiscardChanges, pendingAction, onClose, onToggleMode]);

  // Handle modal cancel action
  const handleModalCancel = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingAction(null);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Top bar with mode switcher and controls */}
      <div className="flex-none bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back button - context-aware */}
          <button
            onClick={handleClose}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            {fromPlayer ? (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Back to Player
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Scenes
              </>
            )}
          </button>

          {/* Mode switcher tabs */}
          <div className="flex items-center space-x-4">
            {/* Player Mode badge */}
            {fromPlayer && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Editing from Player Mode
              </span>
            )}

            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => {
                  if (mode !== "channels") handleModeSwitch();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "channels"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                Channel List
              </button>
              <button
                onClick={() => {
                  if (mode !== "layout") handleModeSwitch();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === "layout"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                2D Layout
              </button>
            </div>

            {/* Preview mode toggle and controls - only show in layout mode */}
            {mode === "layout" && (
              <>
                <div className="flex items-center space-x-3 bg-gray-700/50 rounded-lg px-4 py-2 border border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${previewMode ? "bg-blue-400 animate-pulse" : "bg-gray-400"}`}
                    />
                    <div className="text-sm">
                      <span className="text-white font-medium">Preview</span>
                      {previewError && (
                        <span
                          className="text-red-400 text-xs ml-2"
                          title={previewError}
                        >
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePreview}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      previewMode ? "bg-blue-600" : "bg-gray-600"
                    }`}
                    title={
                      previewMode
                        ? "Preview mode: Changes sent to DMX for testing"
                        : "Enable preview mode"
                    }
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        previewMode ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Apply to Scene button - show when in preview mode with unsaved changes */}
                {previewMode && hasUnsavedPreviewChanges && (
                  <button
                    onClick={handleApplyToScene}
                    disabled={saveStatus === "saving"}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save current preview values to the scene"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Apply to Scene
                  </button>
                )}

                {/* Save status indicator */}
                {saveStatus !== "idle" && (
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600">
                    {saveStatus === "saving" && (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-sm text-gray-300">Saving...</span>
                      </>
                    )}
                    {saveStatus === "saved" && (
                      <>
                        <svg
                          className="h-4 w-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-green-400">Saved</span>
                      </>
                    )}
                    {saveStatus === "error" && (
                      <>
                        <svg
                          className="h-4 w-4 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-sm text-red-400">Error</span>
                      </>
                    )}
                  </div>
                )}

                {/* Undo/Redo buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo (Cmd+Z)"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo (Cmd+Shift+Z)"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                      />
                    </svg>
                  </button>
                </div>

                {/* Dirty indicator and Save button */}
                {isDirty && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-sm text-yellow-400">
                        Unsaved changes
                      </span>
                    </div>
                    <button
                      onClick={handleSaveScene}
                      disabled={saveStatus === "saving"}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save changes (Cmd+S)"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Save Changes
                    </button>
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
        {sceneLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading scene...
          </div>
        ) : mode === "channels" ? (
          <ChannelListEditor
            sceneId={sceneId}
            onClose={onClose}
            sharedState={{
              channelValues:
                localFixtureValues.size > 0
                  ? localFixtureValues
                  : serverDenseValues,
              activeChannels,
              isDirty,
              canUndo,
              canRedo,
              onUndo: handleUndo,
              onRedo: handleRedo,
              onChannelValueChange: handleSingleChannelChange,
              onBatchChannelValueChange: handleBatchedChannelChanges,
              onToggleChannelActive: handleToggleChannelActive,
              onSave: handleSaveScene,
              saveStatus,
            }}
            onDirtyChange={(_dirty) => {
              // ChannelListEditor can report additional dirty state (name/description changes)
              // This will be handled by the shared isDirty computation
            }}
          />
        ) : scene ? (
          <>
            <LayoutCanvas
              fixtures={scene.fixtureValues.map(
                (fv: FixtureValue) => fv.fixture,
              )}
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
                activeChannels={activeChannels}
                onToggleChannelActive={handleToggleChannelActive}
              />
            )}

            {/* Copy feedback toast */}
            {showCopiedFeedback && (
              <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg shadow-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200 animate-in fade-in slide-in-from-right-5">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white font-medium">Copied!</span>
                <span className="text-gray-400 text-sm">
                  ({selectedFixtures.length} fixture
                  {selectedFixtures.length > 1 ? "s" : ""})
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading scene...
          </div>
        )}
      </div>

      {/* Unsaved changes modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
        saveInProgress={saveStatus === "saving"}
      />
    </div>
  );
}
