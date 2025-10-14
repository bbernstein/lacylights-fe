'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FixtureInstance, ChannelType } from '@/types';
import {
  mergeFixtureChannels,
  getMergedRGBColor,
  rgbToHex,
  sortMergedChannels,
  MergedChannel,
} from '@/utils/channelMerging';
import ColorPickerModal from './ColorPickerModal';

interface MultiSelectControlsProps {
  selectedFixtures: FixtureInstance[];
  fixtureValues: Map<string, number[]>;
  onChannelChange: (fixtureId: string, channelIndex: number, value: number) => void;
  onDeselectAll: () => void;
}

export default function MultiSelectControls({
  selectedFixtures,
  fixtureValues,
  onChannelChange,
  onDeselectAll,
}: MultiSelectControlsProps) {
  const [mergedChannels, setMergedChannels] = useState<MergedChannel[]>([]);
  const [rgbColor, setRgbColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Local state for responsive slider updates (synced with server values)
  const [localSliderValues, setLocalSliderValues] = useState<Map<string, number>>(new Map());

  // Merge channels whenever selection or values change
  useEffect(() => {
    const channelMap = mergeFixtureChannels(selectedFixtures, fixtureValues);
    const channels = sortMergedChannels(Array.from(channelMap.values()));
    setMergedChannels(channels);

    // Update RGB color if available
    const rgb = getMergedRGBColor(channelMap);
    setRgbColor(rgb);

    // Sync local state with server values
    const newLocalValues = new Map<string, number>();
    channels.forEach((channel) => {
      const key = getChannelKey(channel);
      newLocalValues.set(key, channel.averageValue);
    });
    setLocalSliderValues(newLocalValues);
  }, [selectedFixtures, fixtureValues]);

  // Calculate display RGB color from local slider values (updates during drag)
  const displayRgbColor = useMemo(() => {
    // Check if we have RGB channels
    const hasRgb = mergedChannels.some(ch => ch.type === ChannelType.RED) &&
                   mergedChannels.some(ch => ch.type === ChannelType.GREEN) &&
                   mergedChannels.some(ch => ch.type === ChannelType.BLUE);

    if (!hasRgb) return null;

    // Use local values if available (during drag), otherwise use server values
    const r = localSliderValues.get(ChannelType.RED) ?? rgbColor?.r ?? 0;
    const g = localSliderValues.get(ChannelType.GREEN) ?? rgbColor?.g ?? 0;
    const b = localSliderValues.get(ChannelType.BLUE) ?? rgbColor?.b ?? 0;

    return { r, g, b };
  }, [localSliderValues, rgbColor, mergedChannels]);

  // Handle channel slider change
  const handleChannelChange = useCallback((channel: MergedChannel, newValue: number) => {
    // Update all fixtures that have this channel
    channel.fixtureIds.forEach((fixtureId, index) => {
      const channelIndex = channel.channelIndices[index];
      onChannelChange(fixtureId, channelIndex, newValue);
    });
  }, [onChannelChange]);

  // Handle color picker change (real-time preview while dragging - local state only)
  const handleColorPickerChange = useCallback((color: { r: number; g: number; b: number }) => {
    // Find RGB channels
    const redChannel = mergedChannels.find(ch => ch.type === ChannelType.RED);
    const greenChannel = mergedChannels.find(ch => ch.type === ChannelType.GREEN);
    const blueChannel = mergedChannels.find(ch => ch.type === ChannelType.BLUE);
    const intensityChannel = mergedChannels.find(ch => ch.type === ChannelType.INTENSITY);

    // Update local state only (no server calls during drag)
    setLocalSliderValues(prev => {
      const newMap = new Map(prev);
      if (redChannel) newMap.set(getChannelKey(redChannel), color.r);
      if (greenChannel) newMap.set(getChannelKey(greenChannel), color.g);
      if (blueChannel) newMap.set(getChannelKey(blueChannel), color.b);
      if (intensityChannel) newMap.set(getChannelKey(intensityChannel), 255);
      return newMap;
    });
  }, [mergedChannels]);

  // Handle color picker selection (when Apply button is clicked - send to server)
  const handleColorPickerSelect = useCallback((color: { r: number; g: number; b: number }) => {
    // Find RGB channels
    const redChannel = mergedChannels.find(ch => ch.type === ChannelType.RED);
    const greenChannel = mergedChannels.find(ch => ch.type === ChannelType.GREEN);
    const blueChannel = mergedChannels.find(ch => ch.type === ChannelType.BLUE);
    const intensityChannel = mergedChannels.find(ch => ch.type === ChannelType.INTENSITY);

    // Update local state
    setLocalSliderValues(prev => {
      const newMap = new Map(prev);
      if (redChannel) newMap.set(getChannelKey(redChannel), color.r);
      if (greenChannel) newMap.set(getChannelKey(greenChannel), color.g);
      if (blueChannel) newMap.set(getChannelKey(blueChannel), color.b);
      if (intensityChannel) newMap.set(getChannelKey(intensityChannel), 255);
      return newMap;
    });

    // Send to server
    if (redChannel) handleChannelChange(redChannel, color.r);
    if (greenChannel) handleChannelChange(greenChannel, color.g);
    if (blueChannel) handleChannelChange(blueChannel, color.b);
    if (intensityChannel) handleChannelChange(intensityChannel, 255);

    setIsColorPickerOpen(false);
  }, [mergedChannels, handleChannelChange]);

  // Generate unique key for each channel
  const getChannelKey = (channel: MergedChannel) => channel.type;

  // Get the current slider value (local state)
  const getSliderValue = useCallback((channel: MergedChannel): number => {
    const key = getChannelKey(channel);
    return localSliderValues.get(key) ?? channel.averageValue;
  }, [localSliderValues]);

  // Handle slider input during drag (local state only, no server call)
  const handleSliderInput = useCallback((channel: MergedChannel, newValue: number) => {
    const key = getChannelKey(channel);
    // Update local state immediately for responsive UI
    setLocalSliderValues(prev => new Map(prev).set(key, newValue));
  }, []);

  // Handle slider mouse up (send final value to server)
  const handleSliderMouseUp = useCallback((channel: MergedChannel, newValue: number) => {
    const key = getChannelKey(channel);
    // Ensure local state is updated
    setLocalSliderValues(prev => new Map(prev).set(key, newValue));
    // Send to server only on mouse up
    handleChannelChange(channel, newValue);
  }, [handleChannelChange]);

  // Handle number input change
  const handleNumberInputChange = useCallback((channel: MergedChannel, newValue: number) => {
    const key = getChannelKey(channel);
    const clampedValue = Math.max(channel.minValue, Math.min(channel.maxValue, newValue || 0));

    // Update local state
    setLocalSliderValues(prev => new Map(prev).set(key, clampedValue));

    // Update server
    handleChannelChange(channel, clampedValue);
  }, [handleChannelChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((channel: MergedChannel, e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentValue = getSliderValue(channel);
    let newValue = currentValue;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newValue = Math.min(channel.maxValue, currentValue + (e.shiftKey ? 10 : 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max(channel.minValue, currentValue - (e.shiftKey ? 10 : 1));
    }

    if (newValue !== currentValue) {
      const key = getChannelKey(channel);
      setLocalSliderValues(prev => new Map(prev).set(key, newValue));
      handleChannelChange(channel, newValue);
    }
  }, [getSliderValue, handleChannelChange]);

  // Get channel display name
  const getChannelDisplayName = (channel: MergedChannel): string => {
    const affectedCount = channel.fixtureIds.length;
    const totalCount = selectedFixtures.length;
    const suffix = affectedCount < totalCount ? ` (${affectedCount}/${totalCount})` : '';
    return `${channel.name}${suffix}`;
  };

  if (selectedFixtures.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg shadow-xl p-4 min-w-[320px] max-w-[400px] max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">
          Selected: {selectedFixtures.length} fixture{selectedFixtures.length > 1 ? 's' : ''}
        </h3>
        <button
          onClick={onDeselectAll}
          className="text-gray-400 hover:text-white transition-colors text-sm"
          title="Deselect all fixtures"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* RGB Color Picker */}
      {displayRgbColor && (
        <>
          <div className="mb-4 pb-4 border-b border-gray-700">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsColorPickerOpen(true)}
                className="w-16 h-10 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                style={{ backgroundColor: `rgb(${displayRgbColor.r}, ${displayRgbColor.g}, ${displayRgbColor.b})` }}
                title="Click to open color picker"
              />
              <span className="text-gray-400 text-sm font-mono">
                {rgbToHex(displayRgbColor.r, displayRgbColor.g, displayRgbColor.b).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Color Picker Modal */}
          <ColorPickerModal
            isOpen={isColorPickerOpen}
            onClose={() => setIsColorPickerOpen(false)}
            currentColor={displayRgbColor}
            onColorChange={handleColorPickerChange}
            onColorSelect={handleColorPickerSelect}
          />
        </>
      )}

      {/* Channel Sliders */}
      <div className="space-y-4">
        {mergedChannels.map((channel, index) => (
          <div key={`${channel.type}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm font-medium">
                {getChannelDisplayName(channel)}
              </label>
              <div className="flex items-center gap-2">
                {channel.hasVariation && (
                  <span
                    className="text-yellow-500 text-xs"
                    title="Values differ across selected fixtures"
                  >
                    ≈
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={channel.minValue}
                max={channel.maxValue}
                value={getSliderValue(channel)}
                onChange={(e) => handleSliderInput(channel, Number(e.target.value))}
                onMouseUp={(e) => handleSliderMouseUp(channel, Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleSliderMouseUp(channel, Number((e.target as HTMLInputElement).value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
                title={`${channel.name}: ${Math.round(getSliderValue(channel))} - drag to adjust`}
              />
              <input
                type="number"
                min={channel.minValue}
                max={channel.maxValue}
                value={Math.round(getSliderValue(channel))}
                onChange={(e) => handleNumberInputChange(channel, Number(e.target.value))}
                onKeyDown={(e) => handleKeyDown(channel, e)}
                className="w-14 text-sm text-center font-mono bg-gray-700 text-gray-300 border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                title="Use arrow keys to adjust. Hold Shift for ±10"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Info text */}
      {mergedChannels.length === 0 && (
        <div className="text-gray-400 text-sm text-center py-4">
          Selected fixtures have no controllable channels
        </div>
      )}
    </div>
  );
}
