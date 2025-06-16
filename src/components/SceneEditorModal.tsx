'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SCENE, UPDATE_SCENE } from '@/graphql/scenes';
import { ChannelType, InstanceChannel } from '@/types';

interface SceneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneId: string | null;
  onSceneUpdated: () => void;
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
}

// Color channels that contribute to the fixture's output color
const COLOR_CHANNEL_TYPES = [
  ChannelType.RED,
  ChannelType.GREEN,
  ChannelType.BLUE,
  ChannelType.WHITE,
  ChannelType.AMBER,
  ChannelType.UV,
];

function ColorSwatch({ channels, getChannelValue }: ColorSwatchProps) {
  const colorChannels = useMemo(() => 
    channels.filter(channel => 
      COLOR_CHANNEL_TYPES.includes(channel.type as ChannelType)
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

    colorChannels.forEach(channel => {
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
      <div 
        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm"
        style={{ 
          backgroundColor: color,
          boxShadow: brightness ? `0 0 8px ${color}` : undefined
        }}
        title={`Combined color: ${color}`}
      />
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
      case ChannelType.UV: return '#4b0082';
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

export default function SceneEditorModal({ isOpen, onClose, sceneId, onSceneUpdated }: SceneEditorModalProps) {
  // Use a composite key: fixtureId-channelIndex to ensure uniqueness
  const [channelValues, setChannelValues] = useState<Map<string, number[]>>(new Map());
  const [sceneName, setSceneName] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: sceneData, loading } = useQuery(GET_SCENE, {
    variables: { id: sceneId },
    skip: !sceneId,
    onCompleted: (data) => {
      if (data.scene) {
        // Initialize scene name and description
        setSceneName(data.scene.name);
        setSceneDescription(data.scene.description || '');
        
        // Initialize channel values map with fixture arrays
        const values = new Map<string, number[]>();
        data.scene.fixtureValues.forEach((fixtureValue: any) => {
          values.set(fixtureValue.fixture.id, fixtureValue.channelValues || []);
        });
        setChannelValues(values);
      }
    },
  });

  const [updateScene, { loading: updating }] = useMutation(UPDATE_SCENE, {
    onCompleted: () => {
      onSceneUpdated();
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

  const scene = sceneData?.scene;

  const handleChannelValueChange = (fixtureId: string, channelIndex: number, value: number) => {
    setChannelValues(prev => {
      const newValues = new Map(prev);
      const fixtureValues = [...(newValues.get(fixtureId) || [])];
      fixtureValues[channelIndex] = value;
      newValues.set(fixtureId, fixtureValues);
      return newValues;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scene) return;

    // Convert channel values map back to the expected format
    const fixtureValues = scene.fixtureValues.map((fixtureValue: any) => ({
      fixtureId: fixtureValue.fixture.id,
      channelValues: channelValues.get(fixtureValue.fixture.id) || fixtureValue.channelValues || [],
    }));

    console.log('Updating scene with data:', {
      id: scene.id,
      input: {
        fixtureValues,
      },
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

  const handleClose = () => {
    setChannelValues(new Map());
    setSceneName('');
    setSceneDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen || !sceneId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
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

              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Total fixtures in scene: {scene.fixtureValues.length}
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {scene.fixtureValues.map((fixtureValue: any, index: number) => {
                    // Direct access to channels from the fixture!
                    const channels = fixtureValue.fixture.channels || [];

                    const currentChannelValues = channelValues.get(fixtureValue.fixture.id) || fixtureValue.channelValues || [];
                    
                    // Helper function to get current channel value by index
                    const getChannelValue = (channelIndex: number) => {
                      return currentChannelValues[channelIndex] ?? 0;
                    };

                    return (
                      <div key={`${fixtureValue.id}-${index}`} className="p-3">
                        <div className="flex items-start justify-between mb-2 px-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {fixtureValue.fixture.name}
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                {fixtureValue.fixture.manufacturer} {fixtureValue.fixture.model} • U{fixtureValue.fixture.universe}:{fixtureValue.fixture.startChannel} • {fixtureValue.fixture.modeName}
                              </span>
                            </h4>
                          </div>
                          <ColorSwatch 
                            channels={channels}
                            getChannelValue={getChannelValue}
                          />
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
                  })}
                </div>
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
    </div>
  );
}