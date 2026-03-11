import { useState, useEffect, useRef, useCallback } from 'react';
import { ChannelType, FadeBehavior } from '@/types';
import { UV_COLOR_HEX } from '@/utils/colorConversion';
import { abbreviateChannelName } from '@/utils/channelAbbreviation';
import FadeBehaviorBadge from './FadeBehaviorBadge';
import { useValueScrub } from '@/hooks/useValueScrub';
import { useScrollDirectionPreference } from '@/hooks/useScrollDirectionPreference';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { dmxToPercent, percentToDmx, isPercentageChannel, percentStep, dmxStep } from '@/utils/dmxPercentage';

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
  /** Whether this channel is highlighted by hardware controller (Stream Deck dial navigation) */
  isHighlighted?: boolean;
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
  isHighlighted,
}: ChannelSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  // Show toggle checkbox only when onToggleActive is provided
  const showToggle = onToggleActive !== undefined;
  // If isActive is undefined and toggle is shown, default to true
  const effectiveIsActive = isActive ?? true;
  // Apply dimmed styling when inactive
  const isInactive = showToggle && !effectiveIsActive;

  // Get scroll direction preference from localStorage
  const [, , invertWheelDirection] = useScrollDirectionPreference();

  // Get display mode preference
  const { isPercentMode } = useDisplayMode();

  // Determine if this channel should show percentages
  const min = channel.minValue || DEFAULT_MIN_VALUE;
  const max = channel.maxValue || DEFAULT_MAX_VALUE;
  const usePercent = isPercentMode && isPercentageChannel(channel.type);

  // Compute display-space values
  const displayValue = usePercent ? dmxToPercent(localValue, min, max) : localValue;
  const displayMin = usePercent ? 0 : min;
  const displayMax = usePercent ? 100 : max;
  const displayStep = usePercent ? 0.1 : 1;

  // Set up value scrub gestures (wheel + touch)
  const { wheelProps, touchScrubProps, containerRef } = useValueScrub({
    value: displayValue,
    min: displayMin,
    max: displayMax,
    onChange: (newDisplayValue) => {
      const dmxValue = usePercent ? percentToDmx(newDisplayValue, min, max) : newDisplayValue;
      setLocalValue(dmxValue);
      onChange(dmxValue);
    },
    onChangeComplete: onChangeComplete ? (newDisplayValue) => {
      const dmxValue = usePercent ? percentToDmx(newDisplayValue, min, max) : newDisplayValue;
      onChangeComplete(dmxValue);
    } : undefined,
    disabled: isInactive,
    invertWheelDirection,
  });

  // Sync local value with prop value only if it actually changed
  // This prevents infinite loops when parent updates rapidly (e.g., color picker dragging)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    const dmxValue = usePercent ? percentToDmx(rawValue, min, max) : Math.round(rawValue);
    setLocalValue(dmxValue);
    onChange(dmxValue);
  };

  const handleSliderMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const rawValue = parseFloat((e.target as HTMLInputElement).value);
    const dmxValue = usePercent ? percentToDmx(rawValue, min, max) : Math.round(rawValue);
    if (onChangeComplete) {
      onChangeComplete(dmxValue);
    }
  };

  const handleSliderTouchEnd = (e: React.TouchEvent<HTMLInputElement>) => {
    const rawValue = parseFloat((e.target as HTMLInputElement).value);
    const dmxValue = usePercent ? percentToDmx(rawValue, min, max) : Math.round(rawValue);
    if (onChangeComplete) {
      onChangeComplete(dmxValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFloat(e.target.value);
    if (isNaN(rawValue)) return;
    const dmxValue = usePercent ? percentToDmx(rawValue, min, max) : Math.max(min, Math.min(max, Math.round(rawValue)));
    setLocalValue(dmxValue);
    onChange(dmxValue);
    if (onChangeComplete) {
      onChangeComplete(dmxValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();

    const direction = e.key === 'ArrowUp' ? 1 : -1;

    let newDmxValue: number;
    if (usePercent) {
      const step = percentStep(e.shiftKey);
      const currentPercent = dmxToPercent(localValue, min, max);
      const newPercent = Math.max(0, Math.min(100, currentPercent + direction * step));
      newDmxValue = percentToDmx(newPercent, min, max);
    } else {
      const step = dmxStep(e.shiftKey);
      newDmxValue = Math.max(min, Math.min(max, localValue + direction * step));
    }

    if (newDmxValue !== localValue) {
      setLocalValue(newDmxValue);
      onChange(newDmxValue);
      if (onChangeComplete) {
        onChangeComplete(newDmxValue);
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
      case ChannelType.INDIGO: return '#2000ff'; // Deep Blue LED (~440nm)
      default: return null;
    }
  };

  const channelColor = getChannelColor();
  const displayTooltip = tooltip || `${channel.name} (${channel.type})`;

  // Auto-scroll highlighted channel into view
  const highlightNodeRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    highlightNodeRef.current = node;
    // Set containerRef.current (from useValueScrub hook) via mutable ref property
    // This is safe because useRef returns a mutable object
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [containerRef]);

  useEffect(() => {
    if (isHighlighted && highlightNodeRef.current) {
      highlightNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isHighlighted]);

  return (
    <div
      ref={mergedRef}
      className={`flex items-center space-x-2 py-0.5 px-2 rounded transition-colors duration-150 ${
        isHighlighted
          ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400 dark:ring-blue-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      } ${isInactive ? 'opacity-50' : ''}`}
      {...wheelProps}
    >
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
      {/* Range slider - uses native horizontal drag; wheel scroll captured by container */}
      <input
        type="range"
        min={displayMin}
        max={displayMax}
        step={displayStep}
        value={displayValue}
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
      {/* Number input with touch scrub support - drag vertically to adjust value */}
      <input
        type="number"
        min={displayMin}
        max={displayMax}
        step={displayStep}
        value={usePercent ? parseFloat(displayValue.toFixed(1)) : displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isInactive}
        className={`${usePercent ? 'w-16' : 'w-12'} text-xs text-center font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500 select-none ${isInactive ? 'cursor-not-allowed' : 'cursor-ns-resize'}`}
        title={usePercent
          ? 'Scroll to adjust, arrow keys for ±1%, Shift+arrow for ±0.1%. Touch and drag vertically to scrub.'
          : 'Scroll to adjust, arrow keys for ±1, Shift+arrow for ±10. Touch and drag vertically to scrub.'}
        {...touchScrubProps}
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
