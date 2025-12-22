"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FixtureInstance, ChannelType } from "@/types";
import {
  mergeFixtureChannels,
  rgbToHex,
  sortMergedChannels,
  MergedChannel,
} from "@/utils/channelMerging";
import { channelValuesToRgb, createOptimizedColorMapping, type InstanceChannelWithValue } from "@/utils/colorConversion";
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
  /** Optional: Track which channels are active per fixture (for scene editing). Key: fixtureId, Value: Set of active channel indices */
  activeChannels?: Map<string, Set<number>>;
  /** Optional: Callback when channel active state changes */
  onToggleChannelActive?: (fixtureId: string, channelIndex: number, isActive: boolean) => void;
}

export default function MultiSelectControls({
  selectedFixtures,
  fixtureValues,
  onBatchedChannelChanges,
  onDebouncedPreviewUpdate,
  onDeselectAll,
  activeChannels,
  onToggleChannelActive,
}: MultiSelectControlsProps) {
  const [mergedChannels, setMergedChannels] = useState<MergedChannel[]>([]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorPickerIntensity, setColorPickerIntensity] = useState<number>(1);

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

    // Extract current intensity from INTENSITY channel (if available)
    const intensityChannel = channels.find(ch => ch.type === ChannelType.INTENSITY);
    if (intensityChannel) {
      setColorPickerIntensity(intensityChannel.averageValue / 255);
    } else {
      setColorPickerIntensity(1);
    }

    // Sync local state with server values
    const newLocalValues = new Map<string, number>();
    channels.forEach((channel) => {
      const key = getChannelKey(channel);
      newLocalValues.set(key, channel.averageValue);
    });
    setLocalSliderValues(newLocalValues);
  }, [selectedFixtures, fixtureValues]);

  // Calculate display RGB color from local slider values using intelligent color mapping
  const displayRgbColor = useMemo(() => {
    if (selectedFixtures.length === 0 || mergedChannels.length === 0) return null;

    // Build InstanceChannelWithValue array from the first selected fixture
    // (for multi-select, we use the first fixture's channel structure as representative)
    const firstFixture = selectedFixtures[0];
    const firstFixtureValues = fixtureValues.get(firstFixture.id);
    if (!firstFixtureValues || !firstFixture.channels) return null;

    const channelsWithValues: InstanceChannelWithValue[] = firstFixture.channels.map((channel, index) => {
      // Try to find the corresponding merged channel to get local slider value
      const mergedChannel = mergedChannels.find(
        (mc) => mc.type === channel.type && mc.fixtureIds.includes(firstFixture.id)
      );

      let value = firstFixtureValues[index] || 0;
      if (mergedChannel) {
        const localValue = localSliderValues.get(getChannelKey(mergedChannel));
        if (localValue !== undefined) {
          value = localValue;
        }
      }

      return {
        ...channel,
        value,
      };
    });

    // Use intelligent color conversion to get RGB from all available channels
    const rgb = channelValuesToRgb(channelsWithValues);
    return rgb;
  }, [selectedFixtures, fixtureValues, mergedChannels, localSliderValues]);

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

  // Handle intensity change from color picker
  const handleIntensityChange = useCallback(
    (newIntensity: number) => {
      setColorPickerIntensity(newIntensity);

      // Re-apply current color with new intensity for all selected fixtures
      // This ensures color channels are recalculated with the new intensity scaling
      if (!displayRgbColor) return;

      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      selectedFixtures.forEach((fixture) => {
        if (!fixture.channels) return;

        // Build current channel values for this fixture
        const currentValues = fixtureValues.get(fixture.id) || [];
        const channelsWithValues: InstanceChannelWithValue[] = fixture.channels.map((channel, index) => ({
          ...channel,
          value: currentValues[index] || 0,
        }));

        // Use intelligent mapping to get DMX values for the current color with new intensity
        const newChannelValues = createOptimizedColorMapping(displayRgbColor, channelsWithValues, newIntensity);

        // Apply the new values
        Object.entries(newChannelValues).forEach(([channelId, value]) => {
          const channelIndex = fixture.channels!.findIndex(ch => ch.id === channelId);
          if (channelIndex !== -1) {
            changes.push({ fixtureId: fixture.id, channelIndex, value });

            // Update local state for responsive UI
            const mergedChannel = mergedChannels.find(
              (mc) => mc.type === fixture.channels![channelIndex].type && mc.fixtureIds.includes(fixture.id)
            );
            if (mergedChannel) {
              setLocalSliderValues((prev) => {
                const newMap = new Map(prev);
                newMap.set(getChannelKey(mergedChannel), value);
                return newMap;
              });
            }
          }
        });
      });

      onDebouncedPreviewUpdate(changes);
    },
    [displayRgbColor, selectedFixtures, fixtureValues, mergedChannels, onDebouncedPreviewUpdate],
  );

  // Handle color picker change (real-time preview while dragging - local state + debounced preview)
  const handleColorPickerChange = useCallback(
    (color: { r: number; g: number; b: number }) => {
      // Use intelligent color mapping for all selected fixtures
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      selectedFixtures.forEach((fixture) => {
        if (!fixture.channels) return;

        // Build current channel values for this fixture
        const currentValues = fixtureValues.get(fixture.id) || [];
        const channelsWithValues: InstanceChannelWithValue[] = fixture.channels.map((channel, index) => ({
          ...channel,
          value: currentValues[index] || 0,
        }));

        // Use intelligent mapping to get DMX values for the new color
        const newChannelValues = createOptimizedColorMapping(color, channelsWithValues, colorPickerIntensity);

        // Apply the new values
        Object.entries(newChannelValues).forEach(([channelId, value]) => {
          const channelIndex = fixture.channels!.findIndex(ch => ch.id === channelId);
          if (channelIndex !== -1) {
            changes.push({ fixtureId: fixture.id, channelIndex, value });

            // Update local state for responsive UI
            const mergedChannel = mergedChannels.find(
              (mc) => mc.type === fixture.channels![channelIndex].type && mc.fixtureIds.includes(fixture.id)
            );
            if (mergedChannel) {
              setLocalSliderValues((prev) => {
                const newMap = new Map(prev);
                newMap.set(getChannelKey(mergedChannel), value);
                return newMap;
              });
            }
          }
        });
      });

      onDebouncedPreviewUpdate(changes);
    },
    [selectedFixtures, fixtureValues, mergedChannels, colorPickerIntensity, onDebouncedPreviewUpdate],
  );

  // Handle color picker selection (when Apply button is clicked - send to server)
  const handleColorPickerSelect = useCallback(
    (color: { r: number; g: number; b: number }) => {
      // Use intelligent color mapping for all selected fixtures
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      selectedFixtures.forEach((fixture) => {
        if (!fixture.channels) return;

        // Build current channel values for this fixture
        const currentValues = fixtureValues.get(fixture.id) || [];
        const channelsWithValues: InstanceChannelWithValue[] = fixture.channels.map((channel, index) => ({
          ...channel,
          value: currentValues[index] || 0,
        }));

        // Use intelligent mapping to get DMX values for the new color
        const newChannelValues = createOptimizedColorMapping(color, channelsWithValues, colorPickerIntensity);

        // Apply the new values
        Object.entries(newChannelValues).forEach(([channelId, value]) => {
          const channelIndex = fixture.channels!.findIndex(ch => ch.id === channelId);
          if (channelIndex !== -1) {
            changes.push({ fixtureId: fixture.id, channelIndex, value });

            // Update local state for responsive UI
            const mergedChannel = mergedChannels.find(
              (mc) => mc.type === fixture.channels![channelIndex].type && mc.fixtureIds.includes(fixture.id)
            );
            if (mergedChannel) {
              setLocalSliderValues((prev) => {
                const newMap = new Map(prev);
                newMap.set(getChannelKey(mergedChannel), value);
                return newMap;
              });
            }
          }
        });
      });

      // Send all changes in a single batched call
      onBatchedChannelChanges(changes);

      setIsColorPickerOpen(false);
    },
    [selectedFixtures, fixtureValues, mergedChannels, colorPickerIntensity, onBatchedChannelChanges],
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

  // Check if a merged channel is fully active (all underlying fixture/channel pairs are active)
  const isMergedChannelActive = useCallback(
    (channel: MergedChannel): boolean => {
      if (!activeChannels) return true; // If no tracking, all are active
      // A merged channel is active if ALL its underlying channels are active
      return channel.fixtureIds.every((fixtureId, index) => {
        const fixtureActiveChannels = activeChannels.get(fixtureId);
        if (!fixtureActiveChannels) return true; // No tracking for this fixture means all active
        return fixtureActiveChannels.has(channel.channelIndices[index]);
      });
    },
    [activeChannels],
  );

  // Handle toggling active state for a merged channel (toggles all underlying channels)
  const handleToggleMergedChannelActive = useCallback(
    (channel: MergedChannel, isActive: boolean) => {
      if (!onToggleChannelActive) return;
      // Toggle all underlying fixture/channel pairs
      channel.fixtureIds.forEach((fixtureId, index) => {
        onToggleChannelActive(fixtureId, channel.channelIndices[index], isActive);
      });
    },
    [onToggleChannelActive],
  );

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
            intensity={colorPickerIntensity}
            onIntensityChange={handleIntensityChange}
            showIntensity={true}
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
              isActive={onToggleChannelActive ? isMergedChannelActive(channel) : undefined}
              onToggleActive={onToggleChannelActive ? (active) => handleToggleMergedChannelActive(channel, active) : undefined}
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
