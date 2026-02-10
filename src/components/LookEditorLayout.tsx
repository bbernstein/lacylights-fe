"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
  GET_LOOK,
  UPDATE_LOOK,
  START_PREVIEW_SESSION,
  CANCEL_PREVIEW_SESSION,
  UPDATE_PREVIEW_CHANNEL,
  INITIALIZE_PREVIEW_WITH_LOOK,
  ACTIVATE_LOOK,
} from "@/graphql/looks";
import { FixtureValue, FixtureInstance, ChannelValue } from "@/types";
import ChannelListEditor from "./ChannelListEditor";
import LayoutCanvas from "./LayoutCanvas";
import MultiSelectControls from "./MultiSelectControls";
import UnsavedChangesModal from "./UnsavedChangesModal";
import CopyFixturesToLooksModal from "./CopyFixturesToLooksModal";
import LookEditorMobileToolbar from "./LookEditorMobileToolbar";
import LookEditorBottomActions from "./LookEditorBottomActions";
import { sparseToDense, denseToSparse } from "@/utils/channelConversion";
import { useUndoStack, UndoDelta, UndoAction } from "@/hooks/useUndoStack";
import { useStreamDock } from "@/contexts/StreamDockContext";
import { useFixtureDataUpdates } from "@/hooks/useFixtureDataUpdates";
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from "@/lib/layoutCanvasUtils";

interface LookEditorLayoutProps {
  lookId: string;
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
  /** Set of fixture IDs that have been removed but not yet saved */
  removedFixtureIds: Set<string>;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Undo stack controls */
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Push action to undo stack (for fixture operations from child) */
  onPushAction: (action: Omit<UndoAction, "timestamp">) => void;
  /** Peek at top of parent's undo stack (for timestamp comparison) */
  peekUndoAction: () => UndoAction | null;
  /** Peek at top of parent's redo stack (for timestamp comparison) */
  peekRedoAction: () => UndoAction | null;
  /** Pop from undo stack without applying (for unified undo handling) */
  rawUndo: () => UndoAction | null;
  /** Pop from redo stack without applying (for unified redo handling) */
  rawRedo: () => UndoAction | null;
  /** Channel value change handler (single channel) */
  onChannelValueChange: (
    fixtureId: string,
    channelIndex: number,
    value: number,
  ) => void;
  /** Channel value change without pushing to undo (for undo/redo operations) */
  onChannelValueChangeNoUndo: (
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
  /** Mark a fixture as removed */
  onRemoveFixture: (fixtureId: string) => void;
  /** Unmark a fixture as removed (for undo) */
  onUnremoveFixture: (fixtureId: string) => void;
  /** Delete fixture channel values (for undo of fixture add) */
  onDeleteFixtureValues: (fixtureId: string) => void;
  /** Save changes */
  onSave: () => Promise<void>;
  /** Save status */
  saveStatus: "idle" | "saving" | "saved" | "error";
}

/**
 * Type for fixture channel values used in look updates
 */
type FixtureChannelValues = {
  fixtureId: string;
  channels: ChannelValue[];
};

/**
 * Helper function to build fixture channel values with active channel filtering.
 * Converts dense arrays to sparse format and filters by active channels.
 * Exported for testing.
 *
 * @param fixtureId - The fixture ID
 * @param channelSource - Either dense (number[]) or sparse (ChannelValue[]) channel values
 * @param fixtureActiveChannels - Set of active channel offsets, or undefined for all channels
 * @returns FixtureChannelValues object ready for mutation
 */
export function buildFixtureChannelValues(
  fixtureId: string,
  channelSource: number[] | ChannelValue[],
  fixtureActiveChannels: Set<number> | undefined,
): FixtureChannelValues {
  // Convert to sparse format if needed (dense arrays are number[], sparse are ChannelValue[])
  // Dense arrays contain raw numbers, sparse arrays contain {offset, value} objects
  let allChannels: ChannelValue[];

  if (Array.isArray(channelSource)) {
    if (channelSource.length === 0) {
      // Empty array - treat as dense and convert (results in empty sparse array)
      allChannels = denseToSparse(channelSource as number[]);
    } else if (typeof channelSource[0] === "number") {
      // First element is a number, so this is a dense array
      allChannels = denseToSparse(channelSource as number[]);
    } else {
      // First element is not a number, so this is already a sparse array
      allChannels = channelSource as ChannelValue[];
    }
  } else {
    allChannels = channelSource as ChannelValue[];
  }

  // Filter to only include active channels (or all if no active tracking)
  const sparseChannels = fixtureActiveChannels
    ? allChannels.filter((ch) => fixtureActiveChannels.has(ch.offset))
    : allChannels;

  return { fixtureId, channels: sparseChannels };
}

export default function LookEditorLayout({
  lookId,
  mode,
  onClose,
  onToggleMode,
  fromPlayer,
  cueListId,
  returnCueNumber,
}: LookEditorLayoutProps) {
  const router = useRouter();
  const streamDock = useStreamDock();

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

  // Fixtures that have been removed but not yet saved
  const [removedFixtureIds, setRemovedFixtureIds] = useState<Set<string>>(
    new Set(),
  );

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

  // Track initial active channels state to detect changes for dirty state
  const [initialActiveChannels, setInitialActiveChannels] = useState<
    Map<string, Set<number>>
  >(new Map());
  // Track whether initial state has been set (handles edge case of look with zero active channels)
  const initialActiveChannelsSet = useRef(false);

  // Undo/redo stack
  const { pushAction, undo, redo, peekUndo, peekRedo, canUndo, canRedo, clearHistory } =
    useUndoStack({
      maxStackSize: 50,
      coalesceWindowMs: 500,
    });

  // Unsaved changes modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"close" | "switch" | null>(
    null,
  );

  // Copy to other looks modal state
  const [showCopyToLooksModal, setShowCopyToLooksModal] = useState(false);

  // Fetch look data for both modes (shared state)
  const {
    data: lookData,
    loading: lookLoading,
    refetch: refetchLook,
  } = useQuery(GET_LOOK, {
    variables: { id: lookId },
  });

  // Mutation for updating look (no refetch - we use optimistic local state)
  const [updateLook] = useMutation(UPDATE_LOOK);

  // Mutation for activating look (used when coming from Player Mode)
  const [activateLook] = useMutation(ACTIVATE_LOOK);

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
  const [initializePreviewWithLook] = useMutation(
    INITIALIZE_PREVIEW_WITH_LOOK,
  );

  const look = lookData?.look;

  // Subscribe to fixture data changes for real-time updates (e.g., from undo/redo)
  // This triggers a refetch of the look data when fixture positions change.
  // The hook's skip option handles empty projectId during initial load.
  useFixtureDataUpdates({
    projectId: look?.project?.id || '',
    lookId: look?.id,
  });

  // Cache converted sparse-to-dense values to avoid repeated conversions
  const serverDenseValues = useMemo(() => {
    const values = new Map<string, number[]>();
    if (look) {
      look.fixtureValues.forEach((fv: FixtureValue) => {
        const channelCount = fv.fixture.channels?.length || 0;
        values.set(
          fv.fixture.id,
          sparseToDense(fv.channels || [], channelCount),
        );
      });
    }
    return values;
  }, [look]);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize local state from look data when look loads
  useEffect(() => {
    if (look) {
      // Initialize active channels
      const active = new Map<string, Set<number>>();
      look.fixtureValues.forEach((fv: FixtureValue) => {
        // Build set of active channel indices from sparse array
        const activeSet = new Set<number>();
        (fv.channels || []).forEach((ch: ChannelValue) => {
          activeSet.add(ch.offset);
        });
        active.set(fv.fixture.id, activeSet);
      });
      setActiveChannels(active);

      // Also set initial active channels for dirty tracking (only on first load)
      // Use ref flag to handle edge case of look with zero active channels
      if (!initialActiveChannelsSet.current) {
        const initial = new Map<string, Set<number>>();
        look.fixtureValues.forEach((fv: FixtureValue) => {
          const activeSet = new Set<number>();
          (fv.channels || []).forEach((ch: ChannelValue) => {
            activeSet.add(ch.offset);
          });
          initial.set(fv.fixture.id, activeSet);
        });
        setInitialActiveChannels(initial);
        initialActiveChannelsSet.current = true;
      }

      // Initialize channel values from look (only if not already set)
      // This ensures we don't overwrite values when switching between modes
      if (localFixtureValues.size === 0) {
        const values = new Map<string, number[]>();
        look.fixtureValues.forEach((fv: FixtureValue) => {
          const channelCount = fv.fixture.channels?.length || 0;
          values.set(
            fv.fixture.id,
            sparseToDense(fv.channels || [], channelCount),
          );
        });
        setLocalFixtureValues(values);
      }
    }
  // Note: We use a ref (initialActiveChannelsSet) instead of initialActiveChannels.size
  // to track initialization, since a look could legitimately have zero active channels.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, localFixtureValues.size]);

  // Build channel values map for layout canvas (merge server + local state)
  const fixtureValues = useMemo(() => {
    const values = new Map<string, number[]>();
    if (look) {
      look.fixtureValues.forEach((fv: FixtureValue) => {
        const fixtureId = fv.fixture.id;
        // Use local value if available, otherwise use cached server value
        const channelValues = localFixtureValues.has(fixtureId)
          ? localFixtureValues.get(fixtureId)!
          : serverDenseValues.get(fixtureId) || [];
        values.set(fixtureId, channelValues);
      });
    }
    return values;
  }, [look, localFixtureValues, serverDenseValues]);

  // Get selected fixtures
  const selectedFixtures: FixtureInstance[] = [];
  if (look) {
    look.fixtureValues.forEach((fv: FixtureValue) => {
      if (selectedFixtureIds.has(fv.fixture.id)) {
        selectedFixtures.push(fv.fixture);
      }
    });
  }

  // Compute dirty state by comparing local values with server values
  const isDirty = useMemo(() => {
    // If fixtures have been removed, we're dirty
    if (removedFixtureIds.size > 0) return true;

    // Check for channel value changes
    if (localFixtureValues.size > 0) {
      // Compare with server values
      for (const [fixtureId, localValues] of localFixtureValues) {
        const serverValues = serverDenseValues.get(fixtureId);
        if (!serverValues) return true; // New fixture added locally
        if (localValues.length !== serverValues.length) return true;
        for (let i = 0; i < localValues.length; i++) {
          if (localValues[i] !== serverValues[i]) return true;
        }
      }
    }

    // Check for active channel changes
    if (initialActiveChannels.size > 0) {
      // Check if any fixture's active channels have changed
      for (const [fixtureId, currentActiveSet] of activeChannels) {
        const initialActiveSet = initialActiveChannels.get(fixtureId);
        if (!initialActiveSet) {
          // New fixture not in initial state - check if it has any active channels
          if (currentActiveSet.size > 0) return true;
          continue;
        }

        // Compare sets - check if sizes differ
        if (currentActiveSet.size !== initialActiveSet.size) return true;

        // Check if all elements match
        for (const channelIndex of currentActiveSet) {
          if (!initialActiveSet.has(channelIndex)) return true;
        }
      }

      // Also check if any initial fixtures are missing from current
      for (const fixtureId of initialActiveChannels.keys()) {
        if (!activeChannels.has(fixtureId)) return true;
      }
    }

    return false;
  }, [localFixtureValues, serverDenseValues, removedFixtureIds, activeChannels, initialActiveChannels]);

  // Clear removedFixtureIds when those fixtures no longer exist in server data (after save)
  // This handles the case where ChannelListEditor saves directly without calling parent's onSave
  useEffect(() => {
    if (removedFixtureIds.size === 0 || !look?.fixtureValues) return;

    // Track if effect is still current to avoid state updates after unmount
    let isCurrent = true;

    const serverFixtureIds = new Set(
      look.fixtureValues.map((fv: FixtureValue) => fv.fixture.id),
    );

    // Check if any fixtures we marked as removed are now gone from server data
    const fixturesNowRemoved = Array.from(removedFixtureIds).filter(
      (id) => !serverFixtureIds.has(id),
    );

    // If any removed fixtures are now gone from server, clear them from removedFixtureIds
    if (fixturesNowRemoved.length > 0 && isCurrent) {
      setRemovedFixtureIds((prev) => {
        const newSet = new Set(prev);
        fixturesNowRemoved.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }

    return () => {
      isCurrent = false;
    };
  }, [look?.fixtureValues, removedFixtureIds]);

  // Auto-activate look on mount when coming from Player Mode (prevents blackout)
  useEffect(() => {
    if (fromPlayer && lookId) {
      activateLook({
        variables: { lookId },
      }).catch((error) => {
        console.error("Failed to activate look from Player Mode:", error);
      });
    }
  }, [fromPlayer, lookId, activateLook]);

  // Auto-start preview mode when coming from Player Mode
  useEffect(() => {
    if (fromPlayer && !previewMode && look?.project?.id) {
      handleTogglePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPlayer, look?.project?.id]);

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
      if (!look || changes.length === 0) return;

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
    [look, serverDenseValues],
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

  // Initialize preview with all current look values
  const initializePreviewWithLookValues = useCallback(
    async (sessionId: string) => {
      if (!look) return;

      try {
        await initializePreviewWithLook({
          variables: { sessionId, lookId },
        });
      } catch (error) {
        console.error("Failed to initialize preview with look:", error);
        setPreviewError((error as Error).message);
      }
    },
    [look, lookId, initializePreviewWithLook],
  );

  // Toggle preview mode
  const handleTogglePreview = useCallback(async () => {
    if (previewMode && previewSessionId) {
      // Cancel preview
      await cancelPreviewSession({
        variables: { sessionId: previewSessionId },
      });
    } else if (look?.project?.id) {
      // Start preview
      try {
        const result = await startPreviewSession({
          variables: { projectId: look.project.id },
        });

        if (result.data?.startPreviewSession?.id) {
          await initializePreviewWithLookValues(
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
    look,
    cancelPreviewSession,
    startPreviewSession,
    initializePreviewWithLookValues,
  ]);

  // Handle single channel value change (used by ChannelListEditor)
  const handleSingleChannelChange = useCallback(
    (fixtureId: string, channelIndex: number, value: number) => {
      if (!look) return;

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
      look,
      localFixtureValues,
      serverDenseValues,
      pushAction,
      previewMode,
      previewSessionId,
      debouncedPreviewUpdate,
    ],
  );

  // Handle single channel value change WITHOUT pushing to undo stack
  // Used by ChannelListEditor when applying undo/redo actions
  const handleChannelValueChangeNoUndo = useCallback(
    (fixtureId: string, channelIndex: number, value: number) => {
      if (!look) return;

      // Update local state only, no undo push
      setLocalFixtureValues((prev) => {
        const newMap = new Map(prev);
        const values =
          newMap.get(fixtureId) || serverDenseValues.get(fixtureId) || [];
        const newValues = [...values];
        newValues[channelIndex] = value;
        newMap.set(fixtureId, newValues);
        return newMap;
      });
    },
    [look, serverDenseValues],
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
      if (!look || changes.length === 0) return;

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
      look,
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

  // Handle removing a fixture from the look
  const handleRemoveFixture = useCallback((fixtureId: string) => {
    setRemovedFixtureIds((prev) => new Set([...prev, fixtureId]));
    // Also remove from local fixture values if present
    setLocalFixtureValues((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fixtureId);
      return newMap;
    });
    // Clean up active channels state to prevent memory leaks
    setActiveChannels((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fixtureId);
      return newMap;
    });
  }, []);

  const handleUnremoveFixture = useCallback(
    (fixtureId: string) => {
      // Mark fixture as no longer removed
      setRemovedFixtureIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fixtureId);
        return newSet;
      });

      // Ensure active channel tracking exists for the restored fixture.
      // If we have local fixture values with channel data, initialize all
      // channels as active by default.
      setActiveChannels((prev) => {
        // If active channel state already exists for this fixture, keep it.
        if (prev.has(fixtureId)) {
          return prev;
        }

        const newMap = new Map(prev);
        // localFixtureValues stores dense arrays (number[]), not FixtureValue objects
        const denseChannels = localFixtureValues.get(fixtureId);

        if (denseChannels && denseChannels.length > 0) {
          const activeSet = new Set<number>();
          for (let i = 0; i < denseChannels.length; i++) {
            activeSet.add(i);
          }
          newMap.set(fixtureId, activeSet);
        }

        return newMap;
      });
    },
    [localFixtureValues],
  );

  // Delete fixture channel values (for undo of fixture add)
  const handleDeleteFixtureValues = useCallback((fixtureId: string) => {
    setLocalFixtureValues((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fixtureId);
      return newMap;
    });
  }, []);

  // Save current changes to the look
  const handleSaveLook = useCallback(async () => {
    if (!look) return;

    setSaveStatus("saving");
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }

    try {
      // Build updated fixture values from current local state
      const fixtureValuesMap = new Map<string, FixtureChannelValues>();

      // Build set of existing fixture IDs for quick lookup
      const existingFixtureIds = new Set(
        look.fixtureValues.map((fv: FixtureValue) => fv.fixture.id),
      );

      // First, process existing fixtures from the look (excluding removed ones)
      look.fixtureValues.forEach((fv: FixtureValue) => {
        // Skip fixtures that have been removed
        if (removedFixtureIds.has(fv.fixture.id)) return;

        const localValues = localFixtureValues.get(fv.fixture.id);
        const channelSource = localValues || fv.channels || [];
        const fixtureActiveChannels = activeChannels.get(fv.fixture.id);

        fixtureValuesMap.set(
          fv.fixture.id,
          buildFixtureChannelValues(fv.fixture.id, channelSource, fixtureActiveChannels),
        );
      });

      // Then, add any new fixtures from localFixtureValues that aren't in look.fixtureValues
      // These are fixtures that were added but not yet saved
      for (const [fixtureId, localValues] of localFixtureValues) {
        if (!existingFixtureIds.has(fixtureId)) {
          const fixtureActiveChannels = activeChannels.get(fixtureId);
          fixtureValuesMap.set(
            fixtureId,
            buildFixtureChannelValues(fixtureId, localValues, fixtureActiveChannels),
          );
        }
      }

      const updatedFixtureValues = Array.from(fixtureValuesMap.values());

      await updateLook({
        variables: {
          id: lookId,
          input: {
            fixtureValues: updatedFixtureValues,
          },
        },
      });

      // Refetch look data to update serverDenseValues with saved values
      await refetchLook();

      // Clear undo history after save
      clearHistory();

      // Reset local state - initialization effect will repopulate from fresh server data
      setLocalFixtureValues(new Map());
      setRemovedFixtureIds(new Set());
      // Reset initial active channels so next change tracking starts fresh
      setInitialActiveChannels(new Map());
      initialActiveChannelsSet.current = false;

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
      console.error("Failed to save look:", error);
      setSaveStatus("error");
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  }, [
    look,
    lookId,
    updateLook,
    localFixtureValues,
    activeChannels,
    removedFixtureIds,
    clearHistory,
    refetchLook,
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
          handleSaveLook();
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
    handleSaveLook,
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
    await handleSaveLook();
    setShowUnsavedModal(false);
    if (pendingAction === "close") {
      onClose();
    } else if (pendingAction === "switch") {
      onToggleMode();
    }
    setPendingAction(null);
  }, [handleSaveLook, pendingAction, onClose, onToggleMode]);

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

  // Handle copy to other looks button click
  const handleCopyToOtherLooks = useCallback(() => {
    if (selectedFixtureIds.size === 0) {
      return;
    }
    setShowCopyToLooksModal(true);
  }, [selectedFixtureIds.size]);

  // Handle copy to other looks success
  const handleCopyToLooksSuccess = useCallback(
    (result: { lookCount: number; cueCount: number }) => {
      setShowCopyToLooksModal(false);
      // Toast notification could be added here
      console.log(`Copied fixtures to ${result.lookCount} looks (${result.cueCount} cues affected)`);
    },
    []
  );

  // Stream Dock integration: register command handlers
  useEffect(() => {
    if (!look) return;

    const fixtures = look.fixtureValues
      .filter((fv: FixtureValue) => !removedFixtureIds.has(fv.fixture.id))
      .map((fv: FixtureValue) => fv.fixture);

    streamDock.registerLookEditorHandlers({
      handleSave: handleSaveLook,
      handleUndo,
      handleRedo,
      handleTogglePreview,
      handleSelectFixture: (fixtureIndex: number) => {
        if (fixtureIndex >= 0 && fixtureIndex < fixtures.length) {
          setSelectedFixtureIds(new Set([fixtures[fixtureIndex].id]));
        }
      },
      handleSelectChannel: () => {
        // Channel selection is managed within ChannelListEditor
        // The Stream Dock state update will reflect the current selection
      },
      handleSetChannelValue: (channelIndex: number, value: number) => {
        // Apply value change to the first selected fixture
        if (selectedFixtureIds.size > 0) {
          const fixtureId = Array.from(selectedFixtureIds)[0];
          handleSingleChannelChange(fixtureId, channelIndex, value);
        }
      },
      handleNextChannel: () => {
        // Channel navigation is managed within ChannelListEditor
      },
      handlePrevChannel: () => {
        // Channel navigation is managed within ChannelListEditor
      },
      handleToggleChannelActive: (channelIndex: number) => {
        if (selectedFixtureIds.size > 0) {
          const fixtureId = Array.from(selectedFixtureIds)[0];
          const currentActive = activeChannels.get(fixtureId);
          const isCurrentlyActive = currentActive?.has(channelIndex) ?? false;
          handleToggleChannelActive(fixtureId, channelIndex, !isCurrentlyActive);
        }
      },
    });
    return () => streamDock.registerLookEditorHandlers(null);
  }, [
    streamDock, look, removedFixtureIds, selectedFixtureIds, activeChannels,
    handleSaveLook, handleUndo, handleRedo, handleTogglePreview,
    handleSingleChannelChange, handleToggleChannelActive,
  ]);

  // Stream Dock: publish look editor state whenever it changes
  useEffect(() => {
    if (!look) {
      streamDock.publishLookEditorState(null);
      return;
    }

    const fixtures = look.fixtureValues
      .filter((fv: FixtureValue) => !removedFixtureIds.has(fv.fixture.id))
      .map((fv: FixtureValue) => ({
        id: fv.fixture.id,
        name: fv.fixture.name,
        channelCount: fv.fixture.channels?.length || 0,
      }));

    const selectedIndex = fixtures.findIndex((f: { id: string }) => selectedFixtureIds.has(f.id));
    const selectedFixtureId = selectedIndex >= 0 ? fixtures[selectedIndex].id : null;

    // Build channel info for the selected fixture
    let channels: Array<{ index: number; name: string; type: string; value: number; min: number; max: number; active: boolean }> = [];
    if (selectedFixtureId) {
      const selectedFv = look.fixtureValues.find((fv: FixtureValue) => fv.fixture.id === selectedFixtureId);
      if (selectedFv) {
        const values = localFixtureValues.get(selectedFixtureId) || serverDenseValues.get(selectedFixtureId) || [];
        const fixtureActiveChannels = activeChannels.get(selectedFixtureId);
        channels = (selectedFv.fixture.channels || []).map((ch: { name: string; channelType?: string }, i: number) => ({
          index: i,
          name: ch.name || `Ch ${i + 1}`,
          type: ch.channelType || 'generic',
          value: values[i] ?? 0,
          min: 0,
          max: 255,
          active: fixtureActiveChannels ? fixtureActiveChannels.has(i) : true,
        }));
      }
    }

    streamDock.publishLookEditorState({
      lookId,
      lookName: look.name || '',
      fixtures,
      selectedFixtureIndex: Math.max(0, selectedIndex),
      channels,
      currentChannelIndex: 0,
      canUndo,
      canRedo,
      isDirty,
      previewActive: previewMode,
    });
  }, [
    streamDock, look, lookId, removedFixtureIds, selectedFixtureIds, activeChannels,
    localFixtureValues, serverDenseValues, canUndo, canRedo, isDirty, previewMode,
  ]);

  // Build fixture names map for copy modal
  const fixtureNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    if (look) {
      look.fixtureValues.forEach((fv: FixtureValue) => {
        map.set(fv.fixture.id, fv.fixture.name);
      });
    }
    return map;
  }, [look]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Mobile toolbar */}
      <LookEditorMobileToolbar
        lookName={look?.name || "Loading..."}
        mode={mode}
        fromPlayer={fromPlayer}
        onClose={handleClose}
        onToggleMode={handleModeSwitch}
      />

      {/* Desktop top bar with mode switcher and controls */}
      <div className="flex-none bg-gray-800 border-b border-gray-700 px-4 py-3 hidden md:block">
        <div className="flex items-center justify-between">
          {/* Left section: Back button and look name */}
          <div className="flex items-center space-x-3 min-w-0">
            {/* Back button - context-aware, compact for narrow screens */}
            <button
              onClick={handleClose}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
              title={fromPlayer ? "Back to Player" : "Back to Looks"}
            >
              {fromPlayer ? (
                <>
                  <svg
                    className="w-4 h-4 lg:mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Return to player"
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
                  <span className="hidden lg:inline">Player</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 lg:mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Return to looks"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span className="hidden lg:inline">Looks</span>
                </>
              )}
            </button>

            {/* Look name */}
            <span className="text-sm text-gray-400 truncate max-w-[150px] lg:max-w-[250px]" title={look?.name}>
              {look?.name || "Loading..."}
            </span>
          </div>

          {/* Mode switcher tabs */}
          <div className="flex items-center space-x-2 lg:space-x-4">
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
                      role="img"
                      aria-label="Undo"
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
                      role="img"
                      aria-label="Redo"
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

                {/* Copy to Other Looks button - only show when fixtures selected */}
                {selectedFixtureIds.size > 0 && (
                  <button
                    onClick={handleCopyToOtherLooks}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    title="Copy selected fixtures to other looks"
                  >
                    <svg
                      className="w-4 h-4 lg:mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Copy to other looks"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="hidden lg:inline">Copy to Looks</span>
                  </button>
                )}

                {/* Save button with dirty/status indicator */}
                <button
                  onClick={handleSaveLook}
                  disabled={saveStatus === "saving" || (!isDirty && !hasUnsavedPreviewChanges && saveStatus !== "saved" && saveStatus !== "error")}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    saveStatus === "error"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : saveStatus === "saved"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : isDirty || hasUnsavedPreviewChanges
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-600 text-gray-400"
                  }`}
                  title="Save changes (Cmd+S)"
                  aria-live="polite"
                  aria-label={
                    saveStatus === "saving" ? "Saving changes" :
                    saveStatus === "saved" ? "Changes saved" :
                    saveStatus === "error" ? "Save failed" :
                    isDirty || hasUnsavedPreviewChanges ? "Save unsaved changes" : "No changes to save"
                  }
                >
                  {saveStatus === "saving" ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Saving"
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
                  ) : saveStatus === "saved" ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Saved"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : saveStatus === "error" ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Error"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <>
                      {(isDirty || hasUnsavedPreviewChanges) && (
                        <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2" title="Unsaved changes" />
                      )}
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="Save"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                    </>
                  )}
                  <span className="hidden lg:inline ml-2">
                    {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Error" : "Save"}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Spacer for layout balance */}
          <div className="w-32" />
        </div>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-hidden relative pb-36 md:pb-0">
        {lookLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading look...
          </div>
        ) : mode === "channels" ? (
          <ChannelListEditor
            lookId={lookId}
            onClose={onClose}
            sharedState={{
              channelValues:
                localFixtureValues.size > 0
                  ? localFixtureValues
                  : serverDenseValues,
              activeChannels,
              removedFixtureIds,
              isDirty,
              canUndo,
              canRedo,
              onUndo: handleUndo,
              onRedo: handleRedo,
              onPushAction: pushAction,
              peekUndoAction: peekUndo,
              peekRedoAction: peekRedo,
              rawUndo: undo,
              rawRedo: redo,
              onChannelValueChange: handleSingleChannelChange,
              onChannelValueChangeNoUndo: handleChannelValueChangeNoUndo,
              onBatchChannelValueChange: handleBatchedChannelChanges,
              onToggleChannelActive: handleToggleChannelActive,
              onRemoveFixture: handleRemoveFixture,
              onUnremoveFixture: handleUnremoveFixture,
              onDeleteFixtureValues: handleDeleteFixtureValues,
              onSave: handleSaveLook,
              saveStatus,
            }}
            onDirtyChange={(_dirty) => {
              // ChannelListEditor can report additional dirty state (name/description changes)
              // This will be handled by the shared isDirty computation
            }}
          />
        ) : look ? (
          <>
            <LayoutCanvas
              fixtures={look.fixtureValues.map(
                (fv: FixtureValue) => fv.fixture,
              )}
              fixtureValues={fixtureValues}
              selectedFixtureIds={selectedFixtureIds}
              onSelectionChange={handleSelectionChange}
              onCopy={handleCopyFixtureValues}
              onPaste={handlePasteFixtureValues}
              canPaste={copiedChannelValues !== null}
              showCopiedFeedback={showCopiedFeedback}
              canvasWidth={look.project?.layoutCanvasWidth ?? DEFAULT_CANVAS_WIDTH}
              canvasHeight={look.project?.layoutCanvasHeight ?? DEFAULT_CANVAS_HEIGHT}
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
            Loading look...
          </div>
        )}
      </div>

      {/* Mobile bottom actions */}
      <LookEditorBottomActions
        isDirty={isDirty}
        canUndo={canUndo}
        canRedo={canRedo}
        previewMode={previewMode}
        saveStatus={saveStatus}
        onSave={handleSaveLook}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTogglePreview={handleTogglePreview}
      />

      {/* Unsaved changes modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
        saveInProgress={saveStatus === "saving"}
      />

      {/* Copy to other looks modal */}
      {look && (
        <CopyFixturesToLooksModal
          isOpen={showCopyToLooksModal}
          onClose={() => setShowCopyToLooksModal(false)}
          projectId={look.project?.id || ""}
          sourceLookId={lookId}
          fixtureIds={Array.from(selectedFixtureIds)}
          fixtureNames={fixtureNamesMap}
          fixtureValues={fixtureValues}
          activeChannels={activeChannels}
          cueListId={cueListId}
          returnCueNumber={returnCueNumber}
          onSuccess={handleCopyToLooksSuccess}
        />
      )}
    </div>
  );
}
