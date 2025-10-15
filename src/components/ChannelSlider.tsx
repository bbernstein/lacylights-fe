import { useState, useEffect } from 'react';
import { ChannelType } from '@/types';
import { UV_COLOR_HEX } from '@/utils/colorConversion';
import { abbreviateChannelName } from '@/utils/channelAbbreviation';

/**
 * Base interface for any channel that can be displayed in a slider
 */
export interface SliderChannel {
  name: string;
  type: ChannelType;
  minValue: number;
  maxValue: number;
}

interface ChannelSliderProps {
  channel: SliderChannel;
  value: number;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  tooltip?: string;
}

/**
 * Shared channel slider component used by both ChannelListEditor and MultiSelectControls.
 * Displays a single row with: color indicator, abbreviated name, slider, and number input.
 */
export default function ChannelSlider({
  channel,
  value,
  onChange,
  onChangeComplete,
  tooltip
}: ChannelSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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
    const newValue = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(channel.minValue || 0, Math.min(channel.maxValue || 255, newValue));
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
      newValue = Math.min((channel.maxValue || 255), localValue + (e.shiftKey ? 10 : 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max((channel.minValue || 0), localValue - (e.shiftKey ? 10 : 1));
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

  return (
    <div className="flex items-center space-x-2 py-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
      <label
        className="text-xs text-gray-700 dark:text-gray-300 w-12 flex-shrink-0 flex items-center space-x-1"
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
        min={channel.minValue || 0}
        max={channel.maxValue || 255}
        value={localValue}
        onChange={handleSliderChange}
        onMouseUp={handleSliderMouseUp}
        onTouchEnd={handleSliderTouchEnd}
        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                   [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-all
                   [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:bg-blue-600
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
        className="w-12 text-xs text-center font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
        title="Use arrow keys to adjust. Hold Shift for ±10"
      />
    </div>
  );
}
