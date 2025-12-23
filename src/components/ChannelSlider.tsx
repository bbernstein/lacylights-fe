import { useState, useEffect } from 'react';
import { ChannelType, FadeBehavior } from '@/types';
import { UV_COLOR_HEX } from '@/utils/colorConversion';
import { abbreviateChannelName } from '@/utils/channelAbbreviation';
import FadeBehaviorBadge from './FadeBehaviorBadge';

// Default min/max values for DMX channels (standard range: 0-255)
const DEFAULT_MIN_VALUE = 0;
const DEFAULT_MAX_VALUE = 255;

/**
 * Base interface for any channel that can be displayed in a slider
 */
export interface SliderChannel {
  name: string;
  type: ChannelType;
  minValue: number;
  maxValue: number;
  fadeBehavior?: FadeBehavior;
  isDiscrete?: boolean;
}

interface ChannelSliderProps {
  channel: SliderChannel;
  value: number;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  tooltip?: string;
  showFadeBehavior?: boolean;
  onFadeBehaviorClick?: () => void;
  /** Whether this channel is active (will be saved to the scene). If undefined, no toggle is shown. */
  isActive?: boolean;
  /** Callback when user toggles the active state. If provided, shows a checkbox. */
  onToggleActive?: (isActive: boolean) => void;
}

/**
 * Shared channel slider component used by both ChannelListEditor and MultiSelectControls.
 * Displays a single row with: color indicator, abbreviated name, slider, number input, and optional fade behavior badge.
 */
export default function ChannelSlider({
  channel,
  value,
  onChange,
  onChangeComplete,
  tooltip,
  showFadeBehavior = false,
  onFadeBehaviorClick,
  isActive,
  onToggleActive,
}: ChannelSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value only if it actually changed
  // This prevents infinite loops when parent updates rapidly (e.g., color picker dragging)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleSliderMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const newValue = parseInt((e.target as HTMLInputElement).value);
    if (onChangeComplete) {
      onChangeComplete(newValue);
    }
  };

  const handleSliderTouchEnd = (e: React.TouchEvent<HTMLInputElement>) => {
    const newValue = parseInt((e.target as HTMLInputElement).value);
    if (onChangeComplete) {
      onChangeComplete(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || DEFAULT_MIN_VALUE;
    const clampedValue = Math.max(channel.minValue || DEFAULT_MIN_VALUE, Math.min(channel.maxValue || DEFAULT_MAX_VALUE, newValue));
    setLocalValue(clampedValue);
    onChange(clampedValue);
    if (onChangeComplete) {
      onChangeComplete(clampedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let newValue = localValue;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newValue = Math.min((channel.maxValue || DEFAULT_MAX_VALUE), localValue + (e.shiftKey ? 10 : 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max((channel.minValue || DEFAULT_MIN_VALUE), localValue - (e.shiftKey ? 10 : 1));
    }

    if (newValue !== localValue) {
      setLocalValue(newValue);
      onChange(newValue);
      if (onChangeComplete) {
        onChangeComplete(newValue);
      }
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
  const displayTooltip = tooltip || `${channel.name} (${channel.type})`;

  // Show toggle checkbox only when onToggleActive is provided
  const showToggle = onToggleActive !== undefined;
  // If isActive is undefined and toggle is shown, default to true
  const effectiveIsActive = isActive ?? true;
  // Apply dimmed styling when inactive
  const isInactive = showToggle && !effectiveIsActive;

  return (
    <div className={`flex items-center space-x-2 py-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded ${isInactive ? 'opacity-50' : ''}`}>
      {/* Channel active toggle checkbox */}
      {showToggle && (
        <input
          type="checkbox"
          checked={effectiveIsActive}
          onChange={(e) => onToggleActive(e.target.checked)}
          className="w-3 h-3 flex-shrink-0 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
          title={effectiveIsActive ? 'Channel active (will be saved)' : 'Channel inactive (will not be saved)'}
          aria-label={`Toggle active for ${channel.name}`}
        />
      )}
      <label
        className="text-xs text-gray-700 dark:text-gray-100 w-12 flex-shrink-0 flex items-center space-x-1"
        title={displayTooltip}
      >
        {channelColor && (
          <div
            className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: channelColor }}
          />
        )}
        <span>{abbreviateChannelName(channel)}</span>
      </label>
      <input
        type="range"
        min={channel.minValue || DEFAULT_MIN_VALUE}
        max={channel.maxValue || DEFAULT_MAX_VALUE}
        value={localValue}
        onChange={handleSliderChange}
        onMouseUp={handleSliderMouseUp}
        onTouchEnd={handleSliderTouchEnd}
        disabled={isInactive}
        className={`flex-1 h-1 bg-gray-200 rounded-lg appearance-none dark:bg-gray-600
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                   [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-all
                   [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:bg-blue-600
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:hover:bg-blue-700 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:transition-all
                   ${isInactive ? 'cursor-not-allowed' : 'cursor-pointer [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer'}`}
      />
      <input
        type="number"
        min={channel.minValue || DEFAULT_MIN_VALUE}
        max={channel.maxValue || DEFAULT_MAX_VALUE}
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isInactive}
        className={`w-12 text-xs text-center font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isInactive ? 'cursor-not-allowed' : ''}`}
        title="Use arrow keys to adjust. Hold Shift for ±10"
      />
      {showFadeBehavior && channel.fadeBehavior && (
        <FadeBehaviorBadge
          fadeBehavior={channel.fadeBehavior}
          isDiscrete={channel.isDiscrete}
          size="sm"
          onClick={onFadeBehaviorClick}
        />
      )}
    </div>
  );
}
