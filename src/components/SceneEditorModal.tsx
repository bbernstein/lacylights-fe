'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
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
import { rgbToChannelValues, channelValuesToRgb, COLOR_CHANNEL_TYPES, UV_COLOR_HEX } from '@/utils/colorConversion';

interface SceneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneId: string | null;
  onSceneUpdated: () => void;
}

// Extended FixtureValue interface with sceneOrder for sorting
interface SceneFixtureValue extends FixtureValue {
  sceneOrder?: number;
}

interface ChannelSliderProps {
  channel: InstanceChannel;
  value: number;
  fixtureId: string;
  channelIndex: number;
  onValueChange: (fixtureId: string, channelIndex: number, value: number) => void;
}

interface ColorSwatchProps {
  channels: InstanceChannel[];
  getChannelValue: (channelIndex: number) => number;
  onColorClick: () => void;
}


function ColorSwatch({ channels, getChannelValue, onColorClick }: ColorSwatchProps) {
  const colorChannels = useMemo(() => 
    channels.filter(channel => 
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

function ChannelSlider({ channel, value, fixtureId, channelIndex, onValueChange }: ChannelSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onValueChange(fixtureId, channelIndex, newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(channel.minValue || 0, Math.min(channel.maxValue || 255, newValue));
    setLocalValue(clampedValue);
    onValueChange(fixtureId, channelIndex, clampedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let newValue = localValue;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newValue = Math.min((channel.maxValue || 255), localValue + (e.shiftKey ? 10 : 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max((channel.minValue || 0), localValue - (e.shiftKey ? 10 : 1));
    }
    
    if (newValue !== localValue) {
      setLocalValue(newValue);
      onValueChange(fixtureId, channelIndex, newValue);
    }
  };
  
  // Get color for color channels
  const getChannelColor = () => {
    switch (channel.type) {
      case ChannelType.RED: return '#ff0000';
      case ChannelType.GREEN: return '#00ff00';
      case ChannelType.BLUE: return '#0080ff';
      case ChannelType.AMBER: return '#ffbf00';
      case ChannelType.WHITE: return '#ffffff';
      case ChannelType.UV: return UV_COLOR_HEX;
      default: return null;
    }
  };

  const channelColor = getChannelColor();

  return (
    <div className="flex items-center space-x-3 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
      <label className="text-sm text-gray-700 dark:text-gray-300 w-20 flex-shrink-0 flex items-center space-x-1" title={`Type: ${channel.type}`}>
        {channelColor && (
          <div 
            className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: channelColor }}
          />
        )}
        <span>{channel.name}</span>
      </label>
      <input
        type="range"
        min={channel.minValue || 0}
        max={channel.maxValue || 255}
        value={localValue}
        onChange={handleChange}
        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                   [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-all
                   [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-600 
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:hover:bg-blue-700 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:transition-all"
      />
      <input
        type="number"
        min={channel.minValue || 0}
        max={channel.maxValue || 255}
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-14 text-sm text-center font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        title="Use arrow keys to adjust. Hold Shift for ±10"
      />
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
  handleRemoveFixture: (fixtureId: string) => void;
}

function SortableFixtureRow({ 
  fixtureValue, 
  index: _index, 
  channelValues, 
  formatFixtureInfo, 
  handleChannelValueChange, 
  handleColorSwatchClick, 
  handleRemoveFixture 
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
  const currentChannelValues = channelValues.get(fixtureValue.fixture.id) || fixtureValue.channelValues || [];
  
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
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {fixtureValue.fixture.name}
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatFixtureInfo(fixtureValue.fixture)}
              </span>
            </h4>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ColorSwatch 
            channels={channels}
            getChannelValue={getChannelValue}
            onColorClick={() => handleColorSwatchClick(fixtureValue.fixture.id)}
          />
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
      <div className="space-y-0.5">
        {channels.map((channel: InstanceChannel, channelIndex: number) => (
          <ChannelSlider
            key={`${fixtureValue.id}-${channel.id}-${channelIndex}`}
            channel={channel}
            value={getChannelValue(channelIndex)}
            fixtureId={fixtureValue.fixture.id}
            channelIndex={channelIndex}
            onValueChange={handleChannelValueChange}
          />
        ))}
      </div>
    </div>
  );
}

export default function SceneEditorModal({ isOpen, onClose, sceneId, onSceneUpdated }: SceneEditorModalProps) {
  // Use a composite key: fixtureId-channelIndex to ensure uniqueness
  const [channelValues, setChannelValues] = useState<Map<string, number[]>>(new Map());
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
  const [tempIdCounter, setTempIdCounter] = useState(0);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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
    skip: !sceneId,
    onCompleted: (data) => {
      if (data.scene) {
        // Initialize scene name and description
        setSceneName(data.scene.name);
        setSceneDescription(data.scene.description || '');
        
        // Initialize channel values map with fixture arrays
        const values = new Map<string, number[]>();
        data.scene.fixtureValues.forEach((fixtureValue: SceneFixtureValue) => {
          values.set(fixtureValue.fixture.id, fixtureValue.channelValues || []);
        });
        setChannelValues(values);
        
        // Reset fixture management state
        setRemovedFixtures(new Set());
        setSelectedFixturesToAdd(new Set());
      }
    },
  });

  const scene = sceneData?.scene;

  // Get all project fixtures to show available fixtures for adding
  const { data: projectFixturesData } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId: scene?.project?.id },
    skip: !scene?.project?.id,
  });

  const [updateScene, { loading: updating }] = useMutation(UPDATE_SCENE, {
    onCompleted: () => {
      onSceneUpdated();
      // Close the modal after successful save
      handleClose();
    },
    onError: (error) => {
      console.error('Update scene error:', error);
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
      console.error('Start preview session error:', error);
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
      console.error('Cancel preview session error:', error);
      setPreviewError(error.message);
    },
  });

  const [updatePreviewChannel] = useMutation(UPDATE_PREVIEW_CHANNEL, {
    onError: (error) => {
      console.error('Update preview channel error:', error);
      // Don't show error for individual channel updates as they happen frequently
    },
  });

  const [initializePreviewWithScene] = useMutation(INITIALIZE_PREVIEW_WITH_SCENE, {
    onError: (error) => {
      console.error('Initialize preview with scene error:', error);
      setPreviewError(error.message);
    },
  });

  const [reorderSceneFixtures] = useMutation(REORDER_SCENE_FIXTURES, {
    onError: (error) => {
      console.error('Reorder scene fixtures error:', error);
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

  // Debounced preview update function
  const debouncedPreviewUpdate = useCallback((fixtureId: string, channelIndex: number, value: number) => {
    if (!previewMode || !previewSessionId) return;
    
    const timeoutId = setTimeout(() => {
      updatePreviewChannel({
        variables: {
          sessionId: previewSessionId,
          fixtureId,
          channelIndex,
          value,
        },
      });
    }, 50); // 50ms debounce for smooth real-time updates
    
    return () => clearTimeout(timeoutId);
  }, [previewMode, previewSessionId, updatePreviewChannel]);

  const handleChannelValueChange = (fixtureId: string, channelIndex: number, value: number) => {
    setChannelValues(prev => {
      const newValues = new Map(prev);
      const fixtureValues = [...(newValues.get(fixtureId) || [])];
      fixtureValues[channelIndex] = value;
      newValues.set(fixtureId, fixtureValues);
      return newValues;
    });

    // Send real-time update if preview mode is active
    if (previewMode && previewSessionId) {
      debouncedPreviewUpdate(fixtureId, channelIndex, value);
    }
  };

  // Color picker handlers
  const handleColorSwatchClick = (fixtureId: string) => {
    const fixtureValue = scene?.fixtureValues.find((fv: SceneFixtureValue) => fv.fixture.id === fixtureId);
    if (!fixtureValue) return;

    const channels = fixtureValue.fixture.channels.map((channelDef: InstanceChannel, index: number) => ({
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

  const applyColorToFixture = (fixtureId: string, color: { r: number; g: number; b: number }, _final: boolean) => {
    const fixtureValue = scene?.fixtureValues.find((fv: SceneFixtureValue) => fv.fixture.id === fixtureId);
    if (!fixtureValue) return;

    const channels = fixtureValue.fixture.channels.map((channelDef: InstanceChannel, index: number) => ({
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
    setChannelValues(prev => {
      const newValues = new Map(prev);
      const fixtureValues = [...(newValues.get(fixtureId) || [])];
      channelUpdates.forEach(({ channelIndex, value }) => {
        fixtureValues[channelIndex] = value;
      });
      newValues.set(fixtureId, fixtureValues);
      return newValues;
    });

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
      let counter = tempIdCounter;
      let nextSceneOrder = fixtures.length + 1; // Start from the next available position
      selectedFixturesToAdd.forEach(fixtureId => {
        const fixture = projectFixturesData.project.fixtures.find((f: FixtureInstance) => f.id === fixtureId);
        if (fixture) {
          // Create a new fixture value with default channel values
          const defaultValues = fixture.channels.map((ch: InstanceChannel) => ch.defaultValue || 0);
          fixtures.push({
            id: `temp-${counter++}-${fixtureId}`, // Temporary ID for new fixtures using counter
            fixture: fixture,
            channelValues: defaultValues,
            sceneOrder: nextSceneOrder++, // Use unique incrementing order values
          });
        }
      });
    }
    
    return fixtures;
  }, [scene, removedFixtures, selectedFixturesToAdd, projectFixturesData, tempIdCounter]);

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
              const defaultValues = fixture.channels.map((ch: InstanceChannel) => ch.defaultValue || 0);
              newMap.set(fixtureId, defaultValues);
            }
          }
        });
        return newMap;
      });
      // Increment counter to ensure unique IDs for next batch
      setTempIdCounter(prev => prev + selectedFixturesToAdd.size);
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
      console.error('Failed to sort scene fixtures:', error);
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
          
          // Don't call onSceneUpdated here as it might trigger unwanted side effects
          // The scene data has been refetched which is all we need
        } catch (error) {
          console.error('Failed to reorder scene fixtures:', error);
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
    const fixtureValues = activeFixtureValues.map((fixtureValue: SceneFixtureValue) => ({
      fixtureId: fixtureValue.fixture.id,
      channelValues: channelValues.get(fixtureValue.fixture.id) || fixtureValue.channelValues || [],
    }));

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
    } catch (error) {
      console.error('Error initializing preview with scene:', error);
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

  const handleClose = async () => {
    // Cancel preview session if active
    if (previewMode && previewSessionId) {
      await cancelPreviewSession({
        variables: { sessionId: previewSessionId },
      });
    }
    
    setChannelValues(new Map());
    setSceneName('');
    setSceneDescription('');
    setError(null);
    setPreviewError(null);
    setShowAddFixtures(false);
    setSelectedFixturesToAdd(new Set());
    setRemovedFixtures(new Set());
    setTempIdCounter(0);
    setShowSortDropdown(false);
    onClose();
  };

  if (!isOpen || !sceneId) return null;

  return (
    // Scene editor modal - z-40 (background layer, behind color picker modal which uses z-50)
    <div className="fixed inset-0 overflow-y-auto z-40">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading scene...</p>
            </div>
          ) : !scene ? (
            <div className="text-center py-8">
              <p className="text-red-500">Scene not found</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Edit Scene
                </h3>
                
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Preview Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${previewMode ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Live Preview Mode
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {previewMode 
                            ? 'Changes are sent to DMX output in real-time' 
                            : 'Enable to see changes live while editing'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePreview}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        previewMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
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
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Error updating scene
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p className="whitespace-pre-wrap select-all">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewError && (
                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Preview mode error
                      </h3>
                      <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                        <p>{previewError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total fixtures in scene: {activeFixtureValues.length}
                </div>
                <div className="flex items-center gap-2">
                  {/* Sort dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                      <div className="absolute right-0 z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-600">
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
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
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
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Available Fixtures</h4>
                  {availableFixtures.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">All project fixtures are already in this scene</p>
                  ) : (
                    <>
                      <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
                        {availableFixtures.map((fixture: FixtureInstance) => (
                          <label
                            key={fixture.id}
                            className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFixturesToAdd.has(fixture.id)}
                              onChange={(e) => {
                                setSelectedFixturesToAdd(prev => {
                                  const newSet = new Set(prev);
                                  if (e.target.checked) {
                                    newSet.add(fixture.id);
                                  } else {
                                    newSet.delete(fixture.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {fixture.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
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
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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
              
              <div className="max-h-[60vh] overflow-y-auto mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={activeFixtureValues.map((fv: SceneFixtureValue) => fv.fixture.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {activeFixtureValues.map((fixtureValue: SceneFixtureValue, index: number) => (
                        <SortableFixtureRow
                          key={`${fixtureValue.id}-${index}`}
                          fixtureValue={fixtureValue}
                          index={index}
                          channelValues={channelValues}
                          formatFixtureInfo={formatFixtureInfo}
                          handleChannelValueChange={handleChannelValueChange}
                          handleColorSwatchClick={handleColorSwatchClick}
                          handleRemoveFixture={handleRemoveFixture}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !sceneName.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        currentColor={tempColor}
        onColorChange={handleColorChange}
        onColorSelect={handleColorSelect}
      />
    </div>
  );
}