"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FixtureInstance, ChannelType } from "@/types";
import {
  mergeFixtureChannels,
  getMergedRGBColor,
  rgbToHex,
  sortMergedChannels,
  MergedChannel,
} from "@/utils/channelMerging";
import ChannelSlider from "./ChannelSlider";
import ColorPickerModal from "./ColorPickerModal";

interface MultiSelectControlsProps {
  selectedFixtures: FixtureInstance[];
  fixtureValues: Map<string, number[]>;
  onBatchedChannelChanges: (
    changes: Array<{ fixtureId: string; channelIndex: number; value: number }>,
  ) => void;
  onDebouncedPreviewUpdate: (
    changes: Array<{ fixtureId: string; channelIndex: number; value: number }>,
  ) => void;
  onDeselectAll: () => void;
}

export default function MultiSelectControls({
  selectedFixtures,
  fixtureValues,
  onBatchedChannelChanges,
  onDebouncedPreviewUpdate,
  onDeselectAll,
}: MultiSelectControlsProps) {
  const [mergedChannels, setMergedChannels] = useState<MergedChannel[]>([]);
  const [rgbColor, setRgbColor] = useState<{
    r: number;
    g: number;
    b: number;
  } | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Local state for responsive slider updates (synced with server values)
  const [localSliderValues, setLocalSliderValues] = useState<
    Map<string, number>
  >(new Map());

  // Track which channel is currently being dragged (for handling mouse leave)
  const draggingChannelRef = useRef<MergedChannel | null>(null);

  // Generate unique key for each channel (composite key including fixture IDs to guarantee uniqueness)
  const getChannelKey = (channel: MergedChannel) =>
    `${channel.type}-${channel.name}-${channel.fixtureIds.join(",")}`;

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
    // Find RGB channels
    const redChannel = mergedChannels.find((ch) => ch.type === ChannelType.RED);
    const greenChannel = mergedChannels.find((ch) => ch.type === ChannelType.GREEN);
    const blueChannel = mergedChannels.find((ch) => ch.type === ChannelType.BLUE);

    if (!redChannel || !greenChannel || !blueChannel) return null;

    // Use local values if available (during drag), otherwise use server values
    const r = localSliderValues.get(getChannelKey(redChannel)) ?? rgbColor?.r ?? 0;
    const g = localSliderValues.get(getChannelKey(greenChannel)) ?? rgbColor?.g ?? 0;
    const b = localSliderValues.get(getChannelKey(blueChannel)) ?? rgbColor?.b ?? 0;

    return { r, g, b };
  }, [localSliderValues, rgbColor, mergedChannels]);

  // Helper to preserve intensity value when updating channel values
  const preserveIntensityIfPresent = useCallback((
    newMap: Map<string, number>,
    intensityChannel: MergedChannel | undefined
  ) => {
    if (intensityChannel) {
      newMap.set(getChannelKey(intensityChannel), intensityChannel.averageValue);
    }
  }, []);

  // Helper to add intensity change to changes array
  const addIntensityChanges = useCallback((
    changes: Array<{ fixtureId: string; channelIndex: number; value: number }>,
    intensityChannel: MergedChannel | undefined
  ) => {
    if (intensityChannel) {
      intensityChannel.fixtureIds.forEach((fixtureId, index) => {
        const channelIndex = intensityChannel.channelIndices[index];
        changes.push({ fixtureId, channelIndex, value: intensityChannel.averageValue });
      });
    }
  }, []);

  // Handle channel slider change (batch all fixture changes into single server call)
  const handleChannelChange = useCallback(
    (channel: MergedChannel, newValue: number) => {
      // Batch all channel changes into a single server call to avoid race conditions
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      channel.fixtureIds.forEach((fixtureId, index) => {
        const channelIndex = channel.channelIndices[index];
        changes.push({ fixtureId, channelIndex, value: newValue });
      });

      // Send all changes in a single batched call
      onBatchedChannelChanges(changes);
    },
    [onBatchedChannelChanges],
  );

  // Handle color picker change (real-time preview while dragging - local state + debounced preview)
  const handleColorPickerChange = useCallback(
    (color: { r: number; g: number; b: number }) => {
      // Find RGB channels
      const redChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.RED,
      );
      const greenChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.GREEN,
      );
      const blueChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.BLUE,
      );
      const intensityChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.INTENSITY,
      );

      // Update local state immediately for responsive UI
      setLocalSliderValues((prev) => {
        const newMap = new Map(prev);
        if (redChannel) newMap.set(getChannelKey(redChannel), color.r);
        if (greenChannel) newMap.set(getChannelKey(greenChannel), color.g);
        if (blueChannel) newMap.set(getChannelKey(blueChannel), color.b);
        preserveIntensityIfPresent(newMap, intensityChannel);
        return newMap;
      });

      // Send debounced preview update (only in preview mode)
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      if (redChannel) {
        redChannel.fixtureIds.forEach((fixtureId, index) => {
          const channelIndex = redChannel.channelIndices[index];
          changes.push({ fixtureId, channelIndex, value: color.r });
        });
      }

      if (greenChannel) {
        greenChannel.fixtureIds.forEach((fixtureId, index) => {
          const channelIndex = greenChannel.channelIndices[index];
          changes.push({ fixtureId, channelIndex, value: color.g });
        });
      }

      if (blueChannel) {
        blueChannel.fixtureIds.forEach((fixtureId, index) => {
          const channelIndex = blueChannel.channelIndices[index];
          changes.push({ fixtureId, channelIndex, value: color.b });
        });
      }

      addIntensityChanges(changes, intensityChannel);

      onDebouncedPreviewUpdate(changes);
    },
    [mergedChannels, onDebouncedPreviewUpdate, addIntensityChanges, preserveIntensityIfPresent],
  );

  // Handle color picker selection (when Apply button is clicked - send to server)
  const handleColorPickerSelect = useCallback(
    (color: { r: number; g: number; b: number }) => {
      // Find RGB channels
      const redChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.RED,
      );
      const greenChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.GREEN,
      );
      const blueChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.BLUE,
      );
      const intensityChannel = mergedChannels.find(
        (ch) => ch.type === ChannelType.INTENSITY,
      );

      // Update local state
      setLocalSliderValues((prev) => {
        const newMap = new Map(prev);
        if (redChannel) newMap.set(getChannelKey(redChannel), color.r);
        if (greenChannel) newMap.set(getChannelKey(greenChannel), color.g);
        if (blueChannel) newMap.set(getChannelKey(blueChannel), color.b);
        preserveIntensityIfPresent(newMap, intensityChannel);
        return newMap;
      });

      // Batch all channel changes into a single server call
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      // Red channel
      if (redChannel) {
        redChannel.fixtureIds.forEach((fixtureId, index) => {
          const channelIndex = redChannel.channelIndices[index];
          changes.push({ fixtureId, channelIndex, value: color.r });
        });
      }

      // Green channel
      if (greenChannel) {
        greenChannel.fixtureIds.forEach((fixtureId, index) => {
          const channelIndex = greenChannel.channelIndices[index];
          changes.push({ fixtureId, channelIndex, value: color.g });
        });
      }

      // Blue channel
      if (blueChannel) {
        blueChannel.fixtureIds.forEach((fixtureId, index) => {
          const channelIndex = blueChannel.channelIndices[index];
          changes.push({ fixtureId, channelIndex, value: color.b });
        });
      }

      addIntensityChanges(changes, intensityChannel);

      // Send all changes in a single batched call
      onBatchedChannelChanges(changes);

      setIsColorPickerOpen(false);
    },
    [mergedChannels, onBatchedChannelChanges, addIntensityChanges, preserveIntensityIfPresent],
  );

  // Get the current slider value (local state)
  const getSliderValue = useCallback(
    (channel: MergedChannel): number => {
      const key = getChannelKey(channel);
      return localSliderValues.get(key) ?? channel.averageValue;
    },
    [localSliderValues],
  );

  // Handle slider input during drag (local state + debounced preview update)
  const handleSliderInput = useCallback(
    (channel: MergedChannel, newValue: number) => {
      const key = getChannelKey(channel);
      // Update local state immediately for responsive UI
      setLocalSliderValues((prev) => new Map(prev).set(key, newValue));

      // Track that this channel is being dragged (for mouse leave handling)
      draggingChannelRef.current = channel;

      // Send debounced preview update (only in preview mode)
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];
      channel.fixtureIds.forEach((fixtureId, index) => {
        const channelIndex = channel.channelIndices[index];
        changes.push({ fixtureId, channelIndex, value: newValue });
      });
      onDebouncedPreviewUpdate(changes);
    },
    [onDebouncedPreviewUpdate],
  );

  // Handle slider mouse up (send final value to server)
  const handleSliderMouseUp = useCallback(
    (channel: MergedChannel, newValue: number) => {
      const key = getChannelKey(channel);
      // Ensure local state is updated
      setLocalSliderValues((prev) => new Map(prev).set(key, newValue));
      // Send to server only on mouse up
      handleChannelChange(channel, newValue);
      // Clear dragging state
      draggingChannelRef.current = null;
    },
    [handleChannelChange],
  );

  // Handle mouse leaving component during drag (send final value to server)
  const handleMouseLeave = useCallback(() => {
    if (draggingChannelRef.current) {
      const channel = draggingChannelRef.current;
      const key = getChannelKey(channel);
      const currentValue = localSliderValues.get(key) ?? channel.averageValue;

      // Send the current value to server
      handleChannelChange(channel, currentValue);

      // Clear dragging state
      draggingChannelRef.current = null;
    }
  }, [localSliderValues, handleChannelChange]);

  // Get channel tooltip (full name with type and fixture count)
  const getChannelTooltip = (channel: MergedChannel): string => {
    const affectedCount = channel.fixtureIds.length;
    const totalCount = selectedFixtures.length;
    const countInfo = affectedCount < totalCount ? ` (affects ${affectedCount}/${totalCount} fixtures)` : "";
    return `${channel.name} (${channel.type})${countInfo}`;
  };

  if (selectedFixtures.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-4 left-4 bg-gray-800 rounded-lg shadow-xl p-2 min-w-[280px] max-w-[360px] max-h-[70vh] overflow-y-auto"
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-white font-semibold text-sm">
          Selected: {selectedFixtures.length} fixture
          {selectedFixtures.length > 1 ? "s" : ""}
        </h3>
        <button
          onClick={onDeselectAll}
          className="text-gray-400 hover:text-white transition-colors text-sm"
          title="Deselect all fixtures"
        >
          <svg
            className="w-4 h-4"
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
        </button>
      </div>

      {/* RGB Color Picker */}
      {displayRgbColor && (
        <>
          <div className="mb-1.5 pb-1.5 border-b border-gray-700">
            <label className="block text-gray-300 text-xs font-medium mb-0.5">
              Color
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsColorPickerOpen(true)}
                className="w-12 h-8 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                style={{
                  backgroundColor: `rgb(${displayRgbColor.r}, ${displayRgbColor.g}, ${displayRgbColor.b})`,
                }}
                title="Click to open color picker"
              />
              <span className="text-gray-400 text-xs font-mono">
                {rgbToHex(
                  displayRgbColor.r,
                  displayRgbColor.g,
                  displayRgbColor.b,
                ).toUpperCase()}
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
      <div className="space-y-0">
        {mergedChannels.map((channel, index) => (
          <div key={`${channel.type}-${index}`} className="relative">
            <ChannelSlider
              channel={channel}
              value={getSliderValue(channel)}
              onChange={(value) => handleSliderInput(channel, value)}
              onChangeComplete={(value) => handleSliderMouseUp(channel, value)}
              tooltip={getChannelTooltip(channel)}
            />
            {channel.hasVariation && (
              <div
                className="absolute right-14 top-1/2 -translate-y-1/2 text-yellow-500 text-xs pointer-events-none"
                title="Values differ across selected fixtures"
              >
                ≈
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info text */}
      {mergedChannels.length === 0 && (
        <div className="text-gray-400 text-xs text-center py-2">
          Selected fixtures have no controllable channels
        </div>
      )}
    </div>
  );
}
