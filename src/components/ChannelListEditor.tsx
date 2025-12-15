'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useCurrentActiveScene } from '@/hooks/useCurrentActiveScene';
import { GET_SCENE, UPDATE_SCENE, START_PREVIEW_SESSION, CANCEL_PREVIEW_SESSION, UPDATE_PREVIEW_CHANNEL, INITIALIZE_PREVIEW_WITH_SCENE } from '@/graphql/scenes';
import { GET_PROJECT_FIXTURES, REORDER_SCENE_FIXTURES } from '@/graphql/fixtures';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChannelType, InstanceChannel, FixtureInstance, FixtureValue } from '@/types';
import ColorPickerModal from './ColorPickerModal';
import UnsavedChangesModal from './UnsavedChangesModal';
import { rgbToChannelValues, channelValuesToRgb, COLOR_CHANNEL_TYPES } from '@/utils/colorConversion';
import ChannelSlider from './ChannelSlider';
import { generateUUID } from '@/utils/uuid';
import { sparseToDense, denseToSparse } from '@/utils/channelConversion';
import { useUndoStack, UndoDelta } from '@/hooks/useUndoStack';
import { SharedEditorState } from './SceneEditorLayout';

interface ChannelListEditorProps {
  sceneId: string;
  onClose?: () => void;
  /** Shared state from parent SceneEditorLayout for coordinated editing */
  sharedState?: SharedEditorState;
  /** Callback when local dirty state changes (for name/description) */
  onDirtyChange?: (isDirty: boolean) => void;
}

// Extended FixtureValue interface with sceneOrder for sorting
interface SceneFixtureValue extends FixtureValue {
  sceneOrder?: number;
}

interface ColorSwatchProps {
  channels: InstanceChannel[];
  getChannelValue: (channelIndex: number) => number;
  onColorClick: () => void;
}


function ColorSwatch({ channels, getChannelValue, onColorClick }: ColorSwatchProps) {
  const colorChannels = useMemo(() =>
    channels.filter(channel =>
      // Type assertion needed because COLOR_CHANNEL_TYPES is a readonly array of specific ChannelType values
      COLOR_CHANNEL_TYPES.includes(channel.type as typeof COLOR_CHANNEL_TYPES[number])
    ),
    [channels]
  );

  const color = useMemo(() => {
    if (colorChannels.length === 0) return null;
    let r = 0, g = 0, b = 0;
    let hasIntensity = false;
    let intensity = 1;

    // Check for intensity channel
    const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
    if (intensityChannel) {
      hasIntensity = true;
      const intensityIndex = channels.indexOf(intensityChannel);
      intensity = getChannelValue(intensityIndex) / 255;
    }

    colorChannels.forEach((channel: InstanceChannel) => {
      const channelIndex = channels.indexOf(channel);
      const value = getChannelValue(channelIndex);
      const normalizedValue = value / 255;

      switch (channel.type) {
        case ChannelType.RED:
          r = Math.max(r, normalizedValue);
          break;
        case ChannelType.GREEN:
          g = Math.max(g, normalizedValue);
          break;
        case ChannelType.BLUE:
          b = Math.max(b, normalizedValue);
          break;
        case ChannelType.WHITE:
          // White adds to all channels
          r = Math.min(1, r + normalizedValue * 0.95);
          g = Math.min(1, g + normalizedValue * 0.95);
          b = Math.min(1, b + normalizedValue * 0.95);
          break;
        case ChannelType.AMBER:
          // Amber is roughly orange (255, 191, 0)
          r = Math.min(1, r + normalizedValue);
          g = Math.min(1, g + normalizedValue * 0.75);
          break;
        case ChannelType.UV:
          // UV is deep blue/purple (75, 0, 130)
          r = Math.min(1, r + normalizedValue * 0.29);
          b = Math.min(1, b + normalizedValue * 0.51);
          break;
      }
    });

    // Apply intensity if present
    if (hasIntensity) {
      r *= intensity;
      g *= intensity;
      b *= intensity;
    }

    // Convert to RGB values
    const rgb = {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };

    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }, [colorChannels, channels, getChannelValue]);

  if (!color) return null;

  const brightness = colorChannels.some(channel => {
    const channelIndex = channels.indexOf(channel);
    return getChannelValue(channelIndex) > 0;
  });

  return (
    <div className="flex items-center space-x-2 px-2 py-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">Color:</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onColorClick();
        }}
        className="group relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full"
        title="Click to open color picker"
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors cursor-pointer"
          style={{
            backgroundColor: color,
            boxShadow: brightness ? `0 0 8px ${color}` : undefined
          }}
        />
      </button>
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{color}</span>
    </div>
  );
}

interface SortableFixtureRowProps {
  fixtureValue: SceneFixtureValue;
  index: number;
  channelValues: Map<string, number[]>;
  formatFixtureInfo: (fixture: FixtureInstance) => string;
  handleChannelValueChange: (fixtureId: string, channelIndex: number, value: number) => void;
  handleColorSwatchClick: (fixtureId: string) => void;
  handleCopyFixture: (fixtureId: string) => void;
  handlePasteFixture: (fixtureId: string) => void;
  handleRemoveFixture: (fixtureId: string) => void;
  hasCopiedValues: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isChannelActive: (fixtureId: string, channelIndex: number) => boolean;
  handleToggleChannelActive: (fixtureId: string, channelIndex: number, isActive: boolean) => void;
}

function SortableFixtureRow({
  fixtureValue,
  index: _index,
  channelValues,
  formatFixtureInfo,
  handleChannelValueChange,
  handleColorSwatchClick,
  handleCopyFixture,
  handlePasteFixture,
  handleRemoveFixture,
  hasCopiedValues,
  isChannelActive,
  handleToggleChannelActive,
  isExpanded,
  onToggleExpand
}: SortableFixtureRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: fixtureValue.fixture.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Direct access to channels from the fixture
  const channels = fixtureValue.fixture.channels || [];
  const currentChannelValues = channelValues.get(fixtureValue.fixture.id) || sparseToDense(fixtureValue.channels || [], channels.length);

  // Helper function to get current channel value by index
  const getChannelValue = (channelIndex: number) => {
    return currentChannelValues[channelIndex] ?? 0;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      {...attributes}
    >
      <div className="flex items-start justify-between mb-2 px-2">
        <div className="flex items-center flex-1">
          <button
            type="button"
            className="mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            {...listeners}
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {fixtureValue.fixture.name}
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatFixtureInfo(fixtureValue.fixture)}
              </span>
            </h4>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={isExpanded ? "Collapse channel sliders" : "Expand channel sliders"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
          <ColorSwatch
            channels={channels}
            getChannelValue={getChannelValue}
            onColorClick={() => handleColorSwatchClick(fixtureValue.fixture.id)}
          />
          <button
            type="button"
            onClick={() => handleCopyFixture(fixtureValue.fixture.id)}
            className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Copy channel values"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {hasCopiedValues && (
            <button
              type="button"
              onClick={() => handlePasteFixture(fixtureValue.fixture.id)}
              className="p-1 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
              title="Paste channel values"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleRemoveFixture(fixtureValue.fixture.id)}
            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Remove from scene"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compact view: show channel values as a list of numbers */}
      {!isExpanded && (
        <div className="px-2 py-2 bg-gray-50 dark:bg-gray-700/30 rounded">
          <div className="text-xs font-mono space-x-2">
            <span className="text-gray-500 dark:text-gray-400">Values:</span>
            {channels.map((_channel: InstanceChannel, channelIndex: number) => (
              <span key={channelIndex} className="inline-block text-gray-900 dark:text-gray-100">
                {getChannelValue(channelIndex)}
                {channelIndex < channels.length - 1 && ','}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded view: show full channel sliders */}
      {isExpanded && (
        <div className="space-y-0">
          {channels.map((channel: InstanceChannel, channelIndex: number) => (
            <ChannelSlider
              key={`${fixtureValue.id}-${channel.id}-${channelIndex}`}
              channel={channel}
              value={getChannelValue(channelIndex)}
              onChange={(value) => handleChannelValueChange(fixtureValue.fixture.id, channelIndex, value)}
              isActive={isChannelActive(fixtureValue.fixture.id, channelIndex)}
              onToggleActive={(active) => handleToggleChannelActive(fixtureValue.fixture.id, channelIndex, active)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChannelListEditor({ sceneId, onClose, sharedState, onDirtyChange: _onDirtyChange }: ChannelListEditorProps) {
  // Determine if we're using shared state from parent
  const useSharedState = !!sharedState;

  // Local state for channel values (only used when not using shared state)
  const [localChannelValues, setLocalChannelValues] = useState<Map<string, number[]>>(new Map());

  // Use shared state's channel values if provided, otherwise use local state
  const channelValues = useSharedState ? sharedState.channelValues : localChannelValues;
  const setChannelValues = useSharedState
    ? (_fn: (prev: Map<string, number[]>) => Map<string, number[]>) => {
        // When using shared state, changes should go through onChannelValueChange callback
        // This setter should never be called; throw an error to catch unintended usage
        throw new Error('setChannelValues should not be called when using shared state. Use onChannelValueChange instead.');
      }
    : setLocalChannelValues;

  const [sceneName, setSceneName] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Preview mode state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Color picker state
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState({ r: 255, g: 255, b: 255 });

  // Fixture management state
  const [showAddFixtures, setShowAddFixtures] = useState(false);
  const [selectedFixturesToAdd, setSelectedFixturesToAdd] = useState<Set<string>>(new Set());
  const [removedFixtures, setRemovedFixtures] = useState<Set<string>>(new Set());
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [lastClickedFixtureIndex, setLastClickedFixtureIndex] = useState<number | null>(null);

  // Expand/collapse state for fixtures - track which fixtures are expanded
  const [expandedFixtures, setExpandedFixtures] = useState<Set<string>>(new Set());

  // Copy/paste state
  const [copiedChannelValues, setCopiedChannelValues] = useState<number[] | null>(null);
  const [copiedActiveChannels, setCopiedActiveChannels] = useState<Set<number> | null>(null);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const copyFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track which channels are active (will be saved) per fixture (local state when not using shared)
  const [localActiveChannels, setLocalActiveChannels] = useState<Map<string, Set<number>>>(new Map());

  // Use shared state's active channels if provided, otherwise use local state
  const activeChannels = useSharedState ? sharedState.activeChannels : localActiveChannels;
  // Note: setActiveChannels is not used directly anymore - we use handleToggleChannelActive instead
  // This is kept for type compatibility but the actual toggling goes through the handler

  // Initial state for dirty tracking (set from server data)
  const [initialChannelValues, setInitialChannelValues] = useState<Map<string, number[]>>(new Map());
  const [initialSceneName, setInitialSceneName] = useState('');
  const [initialSceneDescription, setInitialSceneDescription] = useState('');

  // Local undo/redo stack (only used when not using shared state)
  const localUndoStack = useUndoStack({
    maxStackSize: 50,
    coalesceWindowMs: 500,
  });

  // Use shared undo/redo if provided
  const canUndo = useSharedState ? sharedState.canUndo : localUndoStack.canUndo;
  const canRedo = useSharedState ? sharedState.canRedo : localUndoStack.canRedo;
  // Memoize clearHistory to avoid changing identity on every render
  const clearHistory = useMemo(
    () => (useSharedState ? () => {} : localUndoStack.clearHistory),
    [useSharedState, localUndoStack.clearHistory]
  );

  // Unsaved changes modal state
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Helper function to format fixture information display
  const formatFixtureInfo = (fixture: FixtureInstance): string => {
    const parts = [
      `${fixture.manufacturer} ${fixture.model}`,
      `U${fixture.universe}:${fixture.startChannel}`
    ];

    if (fixture.modeName) {
      parts.push(fixture.modeName);
    }

    return parts.join(' • ');
  };

  const { data: sceneData, loading, refetch: refetchScene } = useQuery(GET_SCENE, {
    variables: { id: sceneId },
    skip: !sceneId, // Always fetch scene data for fixture list and name/description
    onCompleted: (data) => {
      if (data.scene) {
        // Initialize scene name and description
        setSceneName(data.scene.name);
        setSceneDescription(data.scene.description || '');

        // Store initial values for dirty tracking
        setInitialSceneName(data.scene.name);
        setInitialSceneDescription(data.scene.description || '');

        // Only initialize channel values when NOT using shared state
        // When using shared state, the parent (SceneEditorLayout) manages these
        if (!useSharedState) {
          // Initialize channel values map with fixture arrays
          // Convert sparse format to dense for internal state
          const values = new Map<string, number[]>();
          // Track which channels are active (present in the sparse array)
          const active = new Map<string, Set<number>>();
          data.scene.fixtureValues.forEach((fixtureValue: SceneFixtureValue) => {
            const channelCount = fixtureValue.fixture.channels?.length || 0;
            const denseValues = sparseToDense(fixtureValue.channels || [], channelCount);
            values.set(fixtureValue.fixture.id, denseValues);

            // Build set of active channel indices from sparse array
            const activeSet = new Set<number>();
            (fixtureValue.channels || []).forEach((ch: { offset: number }) => {
              activeSet.add(ch.offset);
            });
            active.set(fixtureValue.fixture.id, activeSet);
          });
          setLocalChannelValues(values);
          setLocalActiveChannels(active);

          // Store initial values for dirty tracking
          setInitialChannelValues(new Map(values.entries()));

          // Clear undo history on fresh load
          localUndoStack.clearHistory();
        }

        // Reset fixture management state
        setRemovedFixtures(new Set());
        setSelectedFixturesToAdd(new Set());
      }
    },
  });

  const scene = sceneData?.scene;

  // Compute local dirty state (name/description changes, fixture add/remove)
  const localDirtyState = useMemo(() => {
    // Check if name or description changed
    if (sceneName !== initialSceneName) return true;
    if (sceneDescription !== initialSceneDescription) return true;

    // Check if any fixtures were added or removed
    if (selectedFixturesToAdd.size > 0 || removedFixtures.size > 0) return true;

    return false;
  }, [sceneName, sceneDescription, initialSceneName, initialSceneDescription, selectedFixturesToAdd, removedFixtures]);

  // Combined dirty state - when using shared state, combine local dirty with parent's isDirty
  const isDirty = useMemo(() => {
    if (useSharedState && sharedState) {
      // Dirty if either parent has unsaved channel changes or local has name/description changes
      return sharedState.isDirty || localDirtyState;
    }

    // Local-only mode: check everything
    if (localDirtyState) return true;

    // Check if channel values changed
    for (const [fixtureId, currentValues] of channelValues) {
      const initialValues = initialChannelValues.get(fixtureId);
      if (!initialValues) return true; // New fixture
      if (currentValues.length !== initialValues.length) return true;
      for (let i = 0; i < currentValues.length; i++) {
        if (currentValues[i] !== initialValues[i]) return true;
      }
    }

    return false;
  }, [useSharedState, sharedState, localDirtyState, channelValues, initialChannelValues]);

  // Get all project fixtures to show available fixtures for adding
  const { data: projectFixturesData } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId: scene?.project?.id },
    skip: !scene?.project?.id,
  });

  // Subscribe to current active scene updates to check if this scene is currently being played
  const { currentActiveScene } = useCurrentActiveScene();

  // Check if the scene being edited is currently active
  const isSceneCurrentlyActive = currentActiveScene?.id === sceneId;

  const [updateScene, { loading: updating }] = useMutation(UPDATE_SCENE, {
    onCompleted: () => {
      // Refetch to get latest data
      refetchScene();
      // When using shared state, don't close after saving - just save and stay in editor
      // This prevents the confusing behavior of showing the unsaved changes modal
      // User can manually switch views or close when ready
      if (!useSharedState && onClose) {
        handleClose();
      }
    },
    onError: (error) => {

      if (error.graphQLErrors?.length > 0) {
        setError(error.graphQLErrors[0].message);
      } else if (error.networkError) {
        setError(`Network error: ${error.networkError.message}`);
      } else {
        setError(error.message);
      }
    },
  });

  const [startPreviewSession] = useMutation(START_PREVIEW_SESSION, {
    onCompleted: (data) => {
      setPreviewSessionId(data.startPreviewSession.id);
      setPreviewMode(true);
      setPreviewError(null);
    },
    onError: (error) => {

      setPreviewError(error.message);
      setPreviewMode(false);
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
    },
  });

  const [updatePreviewChannel] = useMutation(UPDATE_PREVIEW_CHANNEL, {
    onError: (_error) => {

      // Don't show error for individual channel updates as they happen frequently
    },
  });

  const [initializePreviewWithScene] = useMutation(INITIALIZE_PREVIEW_WITH_SCENE, {
    onError: (error) => {

      setPreviewError(error.message);
    },
  });

  const [reorderSceneFixtures] = useMutation(REORDER_SCENE_FIXTURES, {
    onError: (error) => {

      setError(`Failed to reorder fixtures: ${error.message}`);
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ref to store timeout ID for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced preview update function
  const debouncedPreviewUpdate = useCallback((fixtureId: string, channelIndex: number, value: number) => {
    if (!previewMode || !previewSessionId) return;

    // Clear the previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      updatePreviewChannel({
        variables: {
          sessionId: previewSessionId,
          fixtureId,
          channelIndex,
          value,
        },
      });
    }, 50); // 50ms debounce for smooth real-time updates
  }, [previewMode, previewSessionId, updatePreviewChannel]);

  const handleChannelValueChange = useCallback((fixtureId: string, channelIndex: number, value: number) => {
    // If using shared state, delegate to parent's handler
    if (useSharedState && sharedState) {
      sharedState.onChannelValueChange(fixtureId, channelIndex, value);
      return;
    }

    // Local state management (when not using shared state)
    // Capture previous value for undo
    const previousValue = channelValues.get(fixtureId)?.[channelIndex] ?? 0;

    setLocalChannelValues(prev => {
      const newValues = new Map(prev);
      const fixtureValues = [...(newValues.get(fixtureId) || [])];
      fixtureValues[channelIndex] = value;
      newValues.set(fixtureId, fixtureValues);
      return newValues;
    });

    // Push to undo stack
    const undoDelta: UndoDelta = {
      fixtureId,
      channelIndex,
      previousValue,
      newValue: value,
    };
    localUndoStack.pushAction({
      type: 'CHANNEL_CHANGE',
      channelDeltas: [undoDelta],
      description: `Changed channel ${channelIndex}`,
    });

    // Send real-time update if preview mode is active
    if (previewMode && previewSessionId) {
      debouncedPreviewUpdate(fixtureId, channelIndex, value);
    }
  }, [useSharedState, sharedState, channelValues, previewMode, previewSessionId, debouncedPreviewUpdate, localUndoStack]);

  // Color picker handlers
  const handleColorSwatchClick = (fixtureId: string) => {
    const fixtureValue = scene?.fixtureValues.find((fv: SceneFixtureValue) => fv.fixture.id === fixtureId);
    if (!fixtureValue) return;

    const channels = (fixtureValue.fixture.channels || []).map((channelDef: InstanceChannel, index: number) => ({
      ...channelDef,
      value: channelValues.get(fixtureId)?.[index] ?? 0,
    }));

    // Get current color from channels
    const currentColor = channelValuesToRgb(channels);

    setSelectedFixtureId(fixtureId);
    setTempColor(currentColor);
    setColorPickerOpen(true);
  };

  const handleColorChange = (color: { r: number; g: number; b: number }) => {
    setTempColor(color);

    // Apply color in real-time for preview
    if (selectedFixtureId) {
      applyColorToFixture(selectedFixtureId, color, false);
    }
  };

  const handleColorSelect = (color: { r: number; g: number; b: number }) => {
    if (selectedFixtureId) {
      applyColorToFixture(selectedFixtureId, color, true);
    }
  };

  // Check if a specific channel is active (will be saved to the scene)
  const isChannelActive = useCallback((fixtureId: string, channelIndex: number): boolean => {
    const fixtureActiveChannels = activeChannels.get(fixtureId);
    // If no active channels tracked for this fixture, default to all active
    if (!fixtureActiveChannels) return true;
    return fixtureActiveChannels.has(channelIndex);
  }, [activeChannels]);

  // Toggle a channel's active state
  const handleToggleChannelActive = useCallback((fixtureId: string, channelIndex: number, isActive: boolean) => {
    // If using shared state, delegate to parent's handler
    if (useSharedState && sharedState) {
      sharedState.onToggleChannelActive(fixtureId, channelIndex, isActive);
      return;
    }

    // Local state management
    setLocalActiveChannels(prev => {
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
  }, [useSharedState, sharedState]);

  // Handle undo
  const handleUndo = useCallback(() => {
    // If using shared state, delegate to parent
    if (useSharedState && sharedState) {
      sharedState.onUndo();
      return;
    }

    // Local undo
    const action = localUndoStack.undo();
    if (!action) return;

    // Apply reverse of the action
    if (action.channelDeltas) {
      setLocalChannelValues(prev => {
        const newValues = new Map(prev);
        action.channelDeltas!.forEach(delta => {
          const fixtureValues = [...(newValues.get(delta.fixtureId) || [])];
          fixtureValues[delta.channelIndex] = delta.previousValue;
          newValues.set(delta.fixtureId, fixtureValues);

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
        return newValues;
      });
    }
  }, [useSharedState, sharedState, localUndoStack, previewMode, previewSessionId, updatePreviewChannel]);

  // Handle redo
  const handleRedo = useCallback(() => {
    // If using shared state, delegate to parent
    if (useSharedState && sharedState) {
      sharedState.onRedo();
      return;
    }

    // Local redo
    const action = localUndoStack.redo();
    if (!action) return;

    // Re-apply the action
    if (action.channelDeltas) {
      setLocalChannelValues(prev => {
        const newValues = new Map(prev);
        action.channelDeltas!.forEach(delta => {
          const fixtureValues = [...(newValues.get(delta.fixtureId) || [])];
          fixtureValues[delta.channelIndex] = delta.newValue;
          newValues.set(delta.fixtureId, fixtureValues);

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
        return newValues;
      });
    }
  }, [useSharedState, sharedState, localUndoStack, previewMode, previewSessionId, updatePreviewChannel]);

  const applyColorToFixture = (fixtureId: string, color: { r: number; g: number; b: number }, _final: boolean) => {
    const fixtureValue = scene?.fixtureValues.find((fv: SceneFixtureValue) => fv.fixture.id === fixtureId);
    if (!fixtureValue) return;

    const channels = (fixtureValue.fixture.channels || []).map((channelDef: InstanceChannel, index: number) => ({
      ...channelDef,
      value: channelValues.get(fixtureId)?.[index] ?? 0,
    }));

    // Convert RGB to channel values
    const newChannelValues = rgbToChannelValues(color, channels, true);

    // Collect all channel updates
    const channelUpdates: { channelIndex: number; value: number }[] = [];

    Object.entries(newChannelValues).forEach(([channelId, value]) => {
      const channelIndex = channels.findIndex((ch: InstanceChannel) => ch.id === channelId);
      if (channelIndex !== -1) {
        channelUpdates.push({ channelIndex, value });
      }
    });

    // Apply all channel changes to state
    if (useSharedState && sharedState) {
      // When using shared state, call the parent's handler for each channel
      channelUpdates.forEach(({ channelIndex, value }) => {
        sharedState.onChannelValueChange(fixtureId, channelIndex, value);
      });
    } else {
      // Using local state
      setChannelValues(prev => {
        const newValues = new Map(prev);
        const fixtureValues = [...(newValues.get(fixtureId) || [])];
        channelUpdates.forEach(({ channelIndex, value }) => {
          fixtureValues[channelIndex] = value;
        });
        newValues.set(fixtureId, fixtureValues);
        return newValues;
      });
    }

    // Send preview updates for all changed channels if in preview mode
    if (previewMode && previewSessionId) {
      // Send each channel update immediately without debouncing for color changes
      channelUpdates.forEach(({ channelIndex, value }) => {
        updatePreviewChannel({
          variables: {
            sessionId: previewSessionId,
            fixtureId,
            channelIndex,
            value,
          },
        });
      });
    }
  };

  // Copy/paste handlers
  const handleCopyFixture = useCallback((fixtureId: string) => {
    const values = channelValues.get(fixtureId);
    if (values) {
      setCopiedChannelValues([...values]);
      // Also copy active channels state
      const fixtureActiveChannels = activeChannels.get(fixtureId);
      setCopiedActiveChannels(fixtureActiveChannels ? new Set(fixtureActiveChannels) : null);

      // Show visual feedback
      setShowCopiedFeedback(true);
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
      copyFeedbackTimeoutRef.current = setTimeout(() => {
        setShowCopiedFeedback(false);
      }, 1500); // Hide after 1.5 seconds
    }
  }, [channelValues, activeChannels]);

  const handlePasteFixture = useCallback((fixtureId: string) => {
    if (!copiedChannelValues) return;

    const currentValues = channelValues.get(fixtureId);
    if (!currentValues) return;

    // Paste values for each channel (up to the minimum of copied values or current fixture channels)
    const channelCount = Math.min(copiedChannelValues.length, currentValues.length);

    // If using shared state, delegate channel changes to parent
    if (useSharedState && sharedState) {
      for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        sharedState.onChannelValueChange(fixtureId, channelIndex, copiedChannelValues[channelIndex]);
      }
      // Also paste active channels state if available
      if (copiedActiveChannels !== null) {
        for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
          sharedState.onToggleChannelActive(fixtureId, channelIndex, copiedActiveChannels.has(channelIndex));
        }
      }
      return;
    }

    // Local state management
    const newValues = [...currentValues];
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      newValues[channelIndex] = copiedChannelValues[channelIndex];
    }

    // Update local state for channel values
    setLocalChannelValues(prev => {
      const newMap = new Map(prev);
      newMap.set(fixtureId, newValues);
      return newMap;
    });

    // Also paste active channels state if available
    if (copiedActiveChannels !== null) {
      setLocalActiveChannels(prev => {
        const newMap = new Map(prev);
        // Create a new set with only the channels that exist in the target fixture
        const newActiveSet = new Set<number>();
        for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
          if (copiedActiveChannels.has(channelIndex)) {
            newActiveSet.add(channelIndex);
          }
        }
        newMap.set(fixtureId, newActiveSet);
        return newMap;
      });
    }

    // Send preview updates if in preview mode
    if (previewMode && previewSessionId) {
      for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        updatePreviewChannel({
          variables: {
            sessionId: previewSessionId,
            fixtureId,
            channelIndex,
            value: copiedChannelValues[channelIndex],
          },
        });
      }
    }
  }, [copiedChannelValues, copiedActiveChannels, channelValues, useSharedState, sharedState, previewMode, previewSessionId, updatePreviewChannel]);

  // Helper to get available fixtures that aren't already in the scene
  const availableFixtures = useMemo(() => {
    if (!projectFixturesData?.project?.fixtures || !scene) return [];

    const sceneFixtureIds = new Set(
      scene.fixtureValues
        .filter((fv: SceneFixtureValue) => !removedFixtures.has(fv.fixture.id))
        .map((fv: SceneFixtureValue) => fv.fixture.id)
    );

    return projectFixturesData.project.fixtures.filter(
      (fixture: FixtureInstance) => !sceneFixtureIds.has(fixture.id)
    );
  }, [projectFixturesData, scene, removedFixtures]);

  // Helper to get the active fixtures in the scene (including newly added ones)
  const activeFixtureValues = useMemo(() => {
    if (!scene) return [];

    // Start with existing fixtures that haven't been removed
    const fixtures = scene.fixtureValues.filter(
      (fv: SceneFixtureValue) => !removedFixtures.has(fv.fixture.id)
    );

    // Add newly selected fixtures
    if (selectedFixturesToAdd.size > 0 && projectFixturesData?.project?.fixtures) {
      let nextSceneOrder = fixtures.length + 1; // Start from the next available position
      selectedFixturesToAdd.forEach(fixtureId => {
        const fixture = projectFixturesData.project.fixtures.find((f: FixtureInstance) => f.id === fixtureId);
        if (fixture) {
          // Create a new fixture value with default channel values
          const defaultValues = (fixture.channels || []).map((ch: InstanceChannel) => ch.defaultValue || 0);
          fixtures.push({
            id: `temp-${generateUUID()}-${fixtureId}`, // Temporary ID for new fixtures using browser-compatible UUID generator
            fixture: fixture,
            channels: denseToSparse(defaultValues), // Store in sparse format
            sceneOrder: nextSceneOrder++, // Use unique incrementing order values
          });
        }
      });
    }

    return fixtures;
  }, [scene, removedFixtures, selectedFixturesToAdd, projectFixturesData]);

  const handleRemoveFixture = (fixtureId: string) => {
    setRemovedFixtures(prev => new Set([...prev, fixtureId]));
    // Also remove from newly added if it was there
    setSelectedFixturesToAdd(prev => {
      const newSet = new Set(prev);
      newSet.delete(fixtureId);
      return newSet;
    });
  };

  const handleAddFixtures = () => {
    // Initialize channel values for newly added fixtures
    if (selectedFixturesToAdd.size > 0 && projectFixturesData?.project?.fixtures) {
      setChannelValues(prev => {
        const newMap = new Map(prev);
        selectedFixturesToAdd.forEach(fixtureId => {
          if (!newMap.has(fixtureId)) {
            const fixture = projectFixturesData.project.fixtures.find((f: FixtureInstance) => f.id === fixtureId);
            if (fixture) {
              const defaultValues = (fixture.channels || []).map((ch: InstanceChannel) => ch.defaultValue || 0);
              newMap.set(fixtureId, defaultValues);
            }
          }
        });
        return newMap;
      });
    }
    // The fixtures are already being shown via activeFixtureValues
    // Just close the add fixtures panel
    setShowAddFixtures(false);
  };

  const handleSortFixtures = async (sortField: 'name' | 'manufacturer' | 'channel', sortOrder: 'asc' | 'desc') => {
    if (!scene) return;

    // Sort the active fixture values by the specified field
    const sortedFixtures = [...activeFixtureValues].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortField) {
        case 'name':
          valueA = a.fixture.name.toLowerCase();
          valueB = b.fixture.name.toLowerCase();
          break;
        case 'manufacturer':
          // Sort by manufacturer + model combined
          valueA = `${a.fixture.manufacturer} ${a.fixture.model}`.toLowerCase();
          valueB = `${b.fixture.manufacturer} ${b.fixture.model}`.toLowerCase();
          break;
        case 'channel':
          // Sort by universe first, then start channel
          valueA = a.fixture.universe * 1000 + a.fixture.startChannel;
          valueB = b.fixture.universe * 1000 + b.fixture.startChannel;
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        return sortOrder === 'asc' ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
      }
    });

    // Create fixture orders for the sorted list
    const fixtureOrders = sortedFixtures.map((fv: SceneFixtureValue, index: number) => ({
      fixtureId: fv.fixture.id,
      order: index + 1,
    }));

    try {
      await reorderSceneFixtures({
        variables: {
          sceneId: scene.id,
          fixtureOrders,
        },
      });

      // Refresh scene data to get updated order
      await refetchScene();
    } catch (error) {

      setError(`Failed to sort fixtures: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && scene) {
      const oldIndex = activeFixtureValues.findIndex((fv: SceneFixtureValue) => fv.fixture.id === active.id);
      const newIndex = activeFixtureValues.findIndex((fv: SceneFixtureValue) => fv.fixture.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create new order for all fixtures in the scene
        const newFixtureValues = arrayMove(activeFixtureValues, oldIndex, newIndex);

        // Update sceneOrder for all fixtures
        // Type assertion needed because arrayMove returns unknown[] despite input being SceneFixtureValue[]
        const fixtureOrders = (newFixtureValues as SceneFixtureValue[]).map((fv: SceneFixtureValue, index: number) => ({
          fixtureId: fv.fixture.id,
          order: index + 1,
        }));

        try {
          await reorderSceneFixtures({
            variables: {
              sceneId: scene.id,
              fixtureOrders,
            },
          });

          // Refresh scene data to get updated order
          await refetchScene();

        } catch {

          // Error is already handled by the mutation's onError handler
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scene) return;

    // Build fixture values from active fixtures
    // Convert dense format to sparse for mutation, but only include active channels
    const fixtureValues = activeFixtureValues.map((fixtureValue: SceneFixtureValue) => {
      const fixtureId = fixtureValue.fixture.id;
      const localDense = channelValues.get(fixtureId);
      const fixtureActiveChannels = activeChannels.get(fixtureId);

      if (localDense) {
        // Convert dense to sparse, but filter to only include active channels
        const allChannels = denseToSparse(localDense);
        const filteredChannels = fixtureActiveChannels
          ? allChannels.filter(ch => fixtureActiveChannels.has(ch.offset))
          : allChannels; // If no active tracking, include all
        return {
          fixtureId,
          channels: filteredChannels,
        };
      } else {
        // Fall back to existing channels, filtered by active state
        const existingChannels = fixtureValue.channels || [];
        const filteredChannels = fixtureActiveChannels
          ? existingChannels.filter((ch: { offset: number }) => fixtureActiveChannels.has(ch.offset))
          : existingChannels;
        return {
          fixtureId,
          channels: filteredChannels,
        };
      }
    });

    updateScene({
      variables: {
        id: scene.id,
        input: {
          name: sceneName,
          description: sceneDescription || undefined,
          fixtureValues,
        },
      },
    });
  };

  // Helper function to apply all current scene values to preview
  const applyAllChannelValuesToPreview = async (sessionId: string) => {
    if (!scene) return;

    try {
      await initializePreviewWithScene({
        variables: {
          sessionId,
          sceneId: scene.id,
        },
      });
    } catch {

      setPreviewError('Failed to initialize preview with scene values');
    }
  };

  const handleTogglePreview = async () => {
    if (previewMode && previewSessionId) {
      // Cancel preview session
      await cancelPreviewSession({
        variables: { sessionId: previewSessionId },
      });
    } else if (scene?.project?.id) {
      // Start preview session
      const result = await startPreviewSession({
        variables: { projectId: scene.project.id },
      });

      // Apply all current scene values to the preview session
      if (result.data?.startPreviewSession?.id) {
        await applyAllChannelValuesToPreview(result.data.startPreviewSession.id);
      }
    }
  };

  // Actually perform the close action
  const performClose = useCallback(async () => {
    // Cancel preview session if active
    if (previewMode && previewSessionId) {
      await cancelPreviewSession({
        variables: { sessionId: previewSessionId },
      });
    }

    // Clean up copy feedback timeout
    if (copyFeedbackTimeoutRef.current) {
      clearTimeout(copyFeedbackTimeoutRef.current);
    }

    // Reset local state (only affects local state, not shared state managed by parent)
    setLocalChannelValues(new Map());
    setLocalActiveChannels(new Map());
    setSceneName('');
    setSceneDescription('');
    setError(null);
    setPreviewError(null);
    setShowAddFixtures(false);
    setSelectedFixturesToAdd(new Set());
    setRemovedFixtures(new Set());
    setShowSortDropdown(false);
    clearHistory();

    if (onClose) {
      onClose();
    }
  }, [previewMode, previewSessionId, cancelPreviewSession, clearHistory, onClose]);

  // Close handler - checks for unsaved changes
  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    performClose();
  }, [isDirty, performClose]);

  // Modal handlers for unsaved changes dialog
  const handleModalSave = useCallback(async () => {
    // Trigger the form submit
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
    setShowUnsavedModal(false);
    // Note: handleSubmit will call handleClose after successful save
  }, []);

  const handleModalDiscard = useCallback(async () => {
    setShowUnsavedModal(false);
    await performClose();
  }, [performClose]);

  const handleModalCancel = useCallback(() => {
    setShowUnsavedModal(false);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        // Undo: Cmd+Z or Ctrl+Z
        e.preventDefault();
        handleUndo();
      } else if (isCmdOrCtrl && e.key === 'z' && e.shiftKey) {
        // Redo: Cmd+Shift+Z or Ctrl+Shift+Z
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading scene...</p>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-red-600 dark:text-red-400">Scene not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Edit Scene
              </h3>
              {isSceneCurrentlyActive && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-800 dark:text-green-200">
                    LIVE EDITING - Changes apply immediately
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="scene-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scene Name *
                </label>
                <input
                  id="scene-name"
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  placeholder="Enter scene name..."
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="scene-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="scene-description"
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Actions bar with undo/redo, dirty indicator, and save button */}
              <div className="flex items-center justify-between pt-2">
                {/* Undo/Redo buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo (Cmd+Z)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo (Cmd+Shift+Z)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                  </button>
                </div>

                {/* Dirty indicator and Save button */}
                <div className="flex items-center space-x-3">
                  {isDirty && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">Unsaved changes</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={updating || !sceneName.trim()}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Preview Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${previewMode ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Preview Mode
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {isSceneCurrentlyActive
                        ? (previewMode
                            ? 'Preview mode active (scene is also LIVE - saved changes apply immediately)'
                            : 'Scene is LIVE - saved changes apply immediately. Preview mode for testing changes.')
                        : (previewMode
                            ? 'Changes are sent to DMX output in real-time for testing'
                            : 'Enable to see changes live while editing (for testing only)')
                      }
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    previewMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      previewMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">
                    Error updating scene
                  </h3>
                  <div className="mt-2 text-sm text-red-300">
                    <p className="whitespace-pre-wrap select-all">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewError && (
            <div className="mb-4 p-4 bg-orange-900/20 border border-orange-800 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-200">
                    Preview mode error
                  </h3>
                  <div className="mt-2 text-sm text-orange-300">
                    <p>{previewError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-400">
              Total fixtures in scene: {activeFixtureValues.length}
            </div>
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Sort fixtures"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h14a2 2 0 012 2v0" />
                  </svg>
                  Sort
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-gray-300 dark:ring-gray-600">
                    <div className="py-1" role="menu">
                      {/* Sort by Name */}
                      <button
                        type="button"
                        onClick={() => { handleSortFixtures('name', 'asc'); setShowSortDropdown(false); }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m0 0l4-4m0 4l4 4M3 16h6m-6 4h6" />
                        </svg>
                        Name (A-Z)
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleSortFixtures('name', 'desc'); setShowSortDropdown(false); }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h6m0 0V2m0 2v2m0-2h9M3 8h9m-9 4h9m0 0l4-4m0 4l4 4M3 16h13M3 20h9" />
                        </svg>
                        Name (Z-A)
                      </button>

                      {/* Sort by Manufacturer/Model */}
                      <button
                        type="button"
                        onClick={() => { handleSortFixtures('manufacturer', 'asc'); setShowSortDropdown(false); }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Manufacturer (A-Z)
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleSortFixtures('manufacturer', 'desc'); setShowSortDropdown(false); }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Manufacturer (Z-A)
                      </button>

                      {/* Sort by Channel */}
                      <button
                        type="button"
                        onClick={() => { handleSortFixtures('channel', 'asc'); setShowSortDropdown(false); }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Channel (Low-High)
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleSortFixtures('channel', 'desc'); setShowSortDropdown(false); }}
                        className="flex items-center w-full px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8V20m0 0l4-4m-4 4l-4-4m-6-8v12m0 0L3 16m4 4l4-4" />
                        </svg>
                        Channel (High-Low)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddFixtures(!showAddFixtures)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-400 bg-blue-900/20 hover:bg-blue-900/30 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Fixtures
              </button>
            </div>
          </div>

          {/* Add Fixtures Panel */}
          {showAddFixtures && (
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Available Fixtures
                  {selectedFixturesToAdd.size > 0 && (
                    <span className="ml-2 text-xs font-normal text-blue-400">
                      ({selectedFixturesToAdd.size} selected)
                    </span>
                  )}
                </h4>
                {availableFixtures.length > 0 && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFixturesToAdd.size === availableFixtures.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all
                          setSelectedFixturesToAdd(new Set(availableFixtures.map((f: FixtureInstance) => f.id)));
                        } else {
                          // Deselect all
                          setSelectedFixturesToAdd(new Set());
                        }
                        setLastClickedFixtureIndex(null);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">Select All</span>
                  </label>
                )}
              </div>
              {availableFixtures.length === 0 ? (
                <p className="text-sm text-gray-400">All project fixtures are already in this scene</p>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
                    {availableFixtures.map((fixture: FixtureInstance, index: number) => (
                      <label
                        key={fixture.id}
                        className="flex items-center p-2 hover:bg-gray-600/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFixturesToAdd.has(fixture.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const isShiftClick = (e.nativeEvent as MouseEvent).shiftKey;

                            setSelectedFixturesToAdd(prev => {
                              const newSet = new Set(prev);

                              // Handle shift-click for range selection
                              if (isShiftClick && lastClickedFixtureIndex !== null && lastClickedFixtureIndex !== index) {
                                const start = Math.min(lastClickedFixtureIndex, index);
                                const end = Math.max(lastClickedFixtureIndex, index);

                                // Select/deselect all fixtures in range
                                for (let i = start; i <= end; i++) {
                                  if (isChecked) {
                                    newSet.add(availableFixtures[i].id);
                                  } else {
                                    newSet.delete(availableFixtures[i].id);
                                  }
                                }
                              } else {
                                // Normal click - toggle single fixture
                                if (isChecked) {
                                  newSet.add(fixture.id);
                                } else {
                                  newSet.delete(fixture.id);
                                }
                              }

                              return newSet;
                            });

                            // Update last clicked index
                            setLastClickedFixtureIndex(index);
                          }}
                          className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {fixture.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatFixtureInfo(fixture)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddFixtures(false);
                        setSelectedFixturesToAdd(new Set());
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFixtures}
                      disabled={selectedFixturesToAdd.size === 0}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add {selectedFixturesToAdd.size > 0 && `(${selectedFixturesToAdd.size})`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeFixtureValues.map((fv: SceneFixtureValue) => fv.fixture.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-gray-700">
                  {activeFixtureValues.map((fixtureValue: SceneFixtureValue, index: number) => (
                    <SortableFixtureRow
                      key={`${fixtureValue.id}-${index}`}
                      fixtureValue={fixtureValue}
                      index={index}
                      channelValues={channelValues}
                      formatFixtureInfo={formatFixtureInfo}
                      handleChannelValueChange={handleChannelValueChange}
                      handleColorSwatchClick={handleColorSwatchClick}
                      handleCopyFixture={handleCopyFixture}
                      handlePasteFixture={handlePasteFixture}
                      handleRemoveFixture={handleRemoveFixture}
                      hasCopiedValues={copiedChannelValues !== null}
                      isExpanded={expandedFixtures.has(fixtureValue.fixture.id)}
                      onToggleExpand={() => {
                        setExpandedFixtures(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(fixtureValue.fixture.id)) {
                            newSet.delete(fixtureValue.fixture.id);
                          } else {
                            newSet.add(fixtureValue.fixture.id);
                          }
                          return newSet;
                        });
                      }}
                      isChannelActive={isChannelActive}
                      handleToggleChannelActive={handleToggleChannelActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </form>
      </div>

      {/* Copy feedback toast */}
      {showCopiedFeedback && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl px-4 py-2 flex items-center space-x-2 transition-all duration-200 animate-in fade-in slide-in-from-right-5">
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-white font-medium">Copied!</span>
          <span className="text-gray-400 text-sm">
            ({copiedChannelValues?.length || 0} channel{copiedChannelValues && copiedChannelValues.length > 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        currentColor={tempColor}
        onColorChange={handleColorChange}
        onColorSelect={handleColorSelect}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
        saveInProgress={updating}
      />
    </div>
  );
}
