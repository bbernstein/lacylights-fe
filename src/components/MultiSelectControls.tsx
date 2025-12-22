"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FixtureInstance, ChannelType } from "@/types";
import {
  mergeFixtureChannels,
  rgbToHex,
  sortMergedChannels,
  MergedChannel,
} from "@/utils/channelMerging";
import { channelValuesToRgb, applyIntensityToRgb, createOptimizedColorMapping, type InstanceChannelWithValue } from "@/utils/colorConversion";
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
  // Base color for intensity slider - maintains original color so intensity can go 0-100% and back
  const [baseColorForIntensity, setBaseColorForIntensity] = useState<{r: number; g: number; b: number} | null>(null);

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
    // Get unscaled RGB + intensity, then apply intensity for display
    const rgbWithIntensity = channelValuesToRgb(channelsWithValues);
    return applyIntensityToRgb(rgbWithIntensity);
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

  /**
   * Shared helper to apply color changes to all selected fixtures.
   * Handles intelligent color mapping, batches state updates for performance,
   * and includes error handling for color mapping operations.
   *
   * @param color - RGB color to apply
   * @param intensity - Intensity value (0-1)
   * @returns Object with changes array and localUpdates map
   */
  const applyColorToSelectedFixtures = useCallback(
    (color: { r: number; g: number; b: number }, intensity: number) => {
      const changes: Array<{
        fixtureId: string;
        channelIndex: number;
        value: number;
      }> = [];

      // Batch all local slider value updates to avoid multiple re-renders
      const localUpdates = new Map<string, number>();

      selectedFixtures.forEach((fixture) => {
        if (!fixture.channels) return;

        // Build current channel values for this fixture
        const currentValues = fixtureValues.get(fixture.id) || [];
        const channelsWithValues: InstanceChannelWithValue[] = fixture.channels.map((channel, index) => ({
          ...channel,
          value: currentValues[index] || 0,
        }));

        try {
          // Use intelligent mapping to get DMX values for the color with intensity
          const newChannelValues = createOptimizedColorMapping(color, channelsWithValues, intensity);

          // Apply the new values
          Object.entries(newChannelValues).forEach(([channelId, value]) => {
            const channelIndex = fixture.channels!.findIndex(ch => ch.id === channelId);
            if (channelIndex !== -1) {
              changes.push({ fixtureId: fixture.id, channelIndex, value });

              // Collect local state updates (batch them)
              const mergedChannel = mergedChannels.find(
                (mc) => mc.type === fixture.channels![channelIndex].type && mc.fixtureIds.includes(fixture.id)
              );
              if (mergedChannel) {
                localUpdates.set(getChannelKey(mergedChannel), value);
              }
            }
          });
        } catch (error) {
          console.error(`Failed to map color for fixture ${fixture.id}:`, error);
          // Continue with other fixtures even if one fails
        }
      });

      return { changes, localUpdates };
    },
    [selectedFixtures, fixtureValues, mergedChannels],
  );

  /**
   * Opens the color picker and stores the current display color as the base
   * for intensity adjustments. This allows the intensity slider to scale the
   * color up/down without losing the original color information.
   *
   * Example: User sets red (255,0,0), then moves intensity to 50% -> (128,0,0),
   * then back to 100% -> restores to (255,0,0) instead of staying at (128,0,0).
   */
  /**
   * Opens the color picker with the current UNSCALED color as the base for intensity scaling.
   * Extracts the raw RGB values (not scaled by intensity) from the first fixture so that
   * the intensity slider can properly control brightness from 0-100%.
   *
   * For fixtures WITH INTENSITY channel:
   * - Base color is the raw RGB values (e.g., RED=255)
   * - Intensity slider controls the INTENSITY channel
   *
   * For fixtures WITHOUT INTENSITY channel:
   * - Base color is the current RGB values
   * - Intensity slider scales the RGB values
   */
  const handleOpenColorPicker = useCallback(() => {
    if (selectedFixtures.length === 0) return;

    // Get unscaled base color from the first selected fixture
    const firstFixture = selectedFixtures[0];
    const firstFixtureValues = fixtureValues.get(firstFixture.id);
    if (!firstFixtureValues || !firstFixture.channels) return;

    const channelsWithValues: InstanceChannelWithValue[] = firstFixture.channels.map((channel, index) => ({
      ...channel,
      value: firstFixtureValues[index] || 0,
    }));

    // Get UNSCALED RGB and separate intensity
    const { r, g, b, intensity } = channelValuesToRgb(channelsWithValues);

    // Store unscaled color as base (allows intensity to go 0->100% and restore full brightness)
    setBaseColorForIntensity({ r, g, b });
    setColorPickerIntensity(intensity);
    setIsColorPickerOpen(true);
  }, [selectedFixtures, fixtureValues]);

  /**
   * Closes the color picker and resets the base color state for cleanliness.
   * The base color will be re-initialized when the picker is opened again.
   */
  const handleCloseColorPicker = useCallback(() => {
    setIsColorPickerOpen(false);
    setBaseColorForIntensity(null);
  }, []);

  /**
   * Handles intensity changes from the color picker slider.
   * Re-applies the base color with the new intensity to all selected fixtures
   * using intelligent color mapping. This ensures color channels are scaled
   * properly even for fixtures without a dedicated INTENSITY channel.
   *
   * Performance: Batches all local state updates to prevent multiple re-renders.
   * With N fixtures and M channels, this reduces from N×M state updates to just 1.
   *
   * @param newIntensity - New intensity value (0-1 range)
   */
  const handleIntensityChange = useCallback(
    (newIntensity: number) => {
      setColorPickerIntensity(newIntensity);

      // Re-apply base color with new intensity for all selected fixtures
      // Use base color (not displayRgbColor) so intensity can go 0->100% and restore original color
      let colorToUse = baseColorForIntensity;
      if (!colorToUse) {
        console.warn('Intensity change: no base color set, using fallback');
        // Fallback to displayRgbColor or white if neither is available
        const fallbackColor = displayRgbColor || { r: 255, g: 255, b: 255 };
        setBaseColorForIntensity(fallbackColor);
        colorToUse = fallbackColor;
      }

      const { changes, localUpdates } = applyColorToSelectedFixtures(colorToUse, newIntensity);

      // Apply all local slider updates in a single state update
      if (localUpdates.size > 0) {
        setLocalSliderValues((prev) => {
          const newMap = new Map(prev);
          localUpdates.forEach((value, key) => newMap.set(key, value));
          return newMap;
        });
      }

      if (changes.length > 0) {
        onDebouncedPreviewUpdate(changes);
      }
    },
    [baseColorForIntensity, displayRgbColor, applyColorToSelectedFixtures, onDebouncedPreviewUpdate],
  );

  // Handle color picker change (real-time preview while dragging - local state + debounced preview)
  const handleColorPickerChange = useCallback(
    (color: { r: number; g: number; b: number }) => {
      // Update base color so intensity slider can work with this new color
      setBaseColorForIntensity(color);

      // Use shared helper with error handling
      const { changes, localUpdates } = applyColorToSelectedFixtures(color, colorPickerIntensity);

      // Apply all local slider updates in a single state update
      if (localUpdates.size > 0) {
        setLocalSliderValues((prev) => {
          const newMap = new Map(prev);
          localUpdates.forEach((value, key) => newMap.set(key, value));
          return newMap;
        });
      }

      if (changes.length > 0) {
        onDebouncedPreviewUpdate(changes);
      }
    },
    [colorPickerIntensity, applyColorToSelectedFixtures, onDebouncedPreviewUpdate],
  );

  // Handle color picker selection (when Apply button is clicked - send to server)
  const handleColorPickerSelect = useCallback(
    (color: { r: number; g: number; b: number }) => {
      // Use shared helper with error handling
      const { changes, localUpdates } = applyColorToSelectedFixtures(color, colorPickerIntensity);

      // Apply all local slider updates in a single state update
      if (localUpdates.size > 0) {
        setLocalSliderValues((prev) => {
          const newMap = new Map(prev);
          localUpdates.forEach((value, key) => newMap.set(key, value));
          return newMap;
        });
      }

      // Send all changes in a single batched call
      onBatchedChannelChanges(changes);

      handleCloseColorPicker();
    },
    [colorPickerIntensity, applyColorToSelectedFixtures, onBatchedChannelChanges, handleCloseColorPicker],
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
                onClick={handleOpenColorPicker}
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
            onClose={handleCloseColorPicker}
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
