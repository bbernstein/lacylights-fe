'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Local state for responsive slider updates during drag (no server calls until mouse up)
  const [localSliderValues, setLocalSliderValues] = useState<Map<string, number>>(new Map());

  // Merge channels whenever selection or values change
  useEffect(() => {
    const channelMap = mergeFixtureChannels(selectedFixtures, fixtureValues);
    const channels = sortMergedChannels(Array.from(channelMap.values()));
    setMergedChannels(channels);

    // Update RGB color if available
    const rgb = getMergedRGBColor(channelMap);
    setRgbColor(rgb);
  }, [selectedFixtures, fixtureValues]);

  // Handle channel slider change
  const handleChannelChange = useCallback((channel: MergedChannel, newValue: number) => {
    // Update all fixtures that have this channel
    channel.fixtureIds.forEach((fixtureId, index) => {
      const channelIndex = channel.channelIndices[index];
      onChannelChange(fixtureId, channelIndex, newValue);
    });
  }, [onChannelChange]);

  // Handle color picker change (real-time preview while dragging)
  const handleColorPickerChange = useCallback((color: { r: number; g: number; b: number }) => {
    // Find RGB channels
    const redChannel = mergedChannels.find(ch => ch.type === ChannelType.RED);
    const greenChannel = mergedChannels.find(ch => ch.type === ChannelType.GREEN);
    const blueChannel = mergedChannels.find(ch => ch.type === ChannelType.BLUE);
    const intensityChannel = mergedChannels.find(ch => ch.type === ChannelType.INTENSITY);

    // Update each channel in real-time
    if (redChannel) handleChannelChange(redChannel, color.r);
    if (greenChannel) handleChannelChange(greenChannel, color.g);
    if (blueChannel) handleChannelChange(blueChannel, color.b);

    // Also set intensity to full (255) so colors appear correctly
    // This ensures all fixtures show the same visible color
    if (intensityChannel) handleChannelChange(intensityChannel, 255);
  }, [mergedChannels, handleChannelChange]);

  // Handle color picker selection (when Apply button is clicked)
  const handleColorPickerSelect = useCallback((color: { r: number; g: number; b: number }) => {
    handleColorPickerChange(color);
    setIsColorPickerOpen(false);
  }, [handleColorPickerChange]);

  // Generate unique key for each channel
  const getChannelKey = (channel: MergedChannel) => channel.type;

  // Get the current slider value (local state if dragging, otherwise server value)
  const getSliderValue = useCallback((channel: MergedChannel): number => {
    const key = getChannelKey(channel);
    return localSliderValues.get(key) ?? channel.averageValue;
  }, [localSliderValues]);

  // Handle slider input during drag (ONLY local state update, NO server call)
  const handleSliderInput = useCallback((channel: MergedChannel, newValue: number) => {
    const key = getChannelKey(channel);
    // Update local state immediately for responsive UI
    setLocalSliderValues(prev => new Map(prev).set(key, newValue));
  }, []);

  // Handle slider mouse up (update server with final value)
  const handleSliderChange = useCallback((channel: MergedChannel, newValue: number) => {
    const key = getChannelKey(channel);

    // Update local state
    setLocalSliderValues(prev => new Map(prev).set(key, newValue));

    // Update server with final value
    handleChannelChange(channel, newValue);

    // Clear local state after a brief delay to prevent flicker
    setTimeout(() => {
      setLocalSliderValues(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    }, 100);
  }, [handleChannelChange]);

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
      {rgbColor && (
        <>
          <div className="mb-4 pb-4 border-b border-gray-700">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsColorPickerOpen(true)}
                className="w-16 h-10 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                style={{ backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` }}
                title="Click to open color picker"
              />
              <span className="text-gray-400 text-sm font-mono">
                {rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Color Picker Modal */}
          <ColorPickerModal
            isOpen={isColorPickerOpen}
            onClose={() => setIsColorPickerOpen(false)}
            currentColor={rgbColor}
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
                <span className="text-gray-400 text-sm font-mono min-w-[3ch] text-right">
                  {Math.round(getSliderValue(channel))}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={channel.minValue}
              max={channel.maxValue}
              value={getSliderValue(channel)}
              onInput={(e) => handleSliderInput(channel, Number((e.target as HTMLInputElement).value))}
              onChange={(e) => handleSliderChange(channel, Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              title={`${channel.name}: ${Math.round(getSliderValue(channel))} - drag to adjust`}
            />
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
