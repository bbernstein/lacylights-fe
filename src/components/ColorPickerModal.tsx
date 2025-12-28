import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ColorWheelPicker from './ColorWheelPicker';
import RoscoluxSwatchPicker from './RoscoluxSwatchPicker';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getBestMatchingRoscolux } from '@/utils/colorMatching';
import { ROSCOLUX_FILTERS } from '@/data/roscoluxFilters';
import type { InstanceChannelWithValue } from '@/utils/colorConversion';
import { rgbToHex, hexToRgb } from '@/utils/colorHelpers';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: { r: number; g: number; b: number };
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  onColorSelect: (color: { r: number; g: number; b: number }) => void;
  intensity?: number; // Current intensity (0-1)
  onIntensityChange?: (intensity: number) => void; // Intensity change callback
  showIntensity?: boolean; // Show intensity slider (default: false)
  channels?: InstanceChannelWithValue[]; // For fixture awareness (future use)
}

type TabType = 'wheel' | 'roscolux';

/**
 * Color picker modal component that provides color wheel and Roscolux filter selection.
 * Uses BottomSheet for responsive display (slides up on mobile, centered modal on desktop).
 *
 * @example
 * ```tsx
 * <ColorPickerModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   currentColor={{ r: 255, g: 0, b: 0 }}
 *   onColorChange={(color) => console.log('Preview:', color)}
 *   onColorSelect={(color) => console.log('Selected:', color)}
 * />
 * ```
 */
export default function ColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  onColorChange,
  onColorSelect,
  intensity,
  onIntensityChange,
  showIntensity = false,
  channels: _channels
}: ColorPickerModalProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>('wheel');
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [hexInputValue, setHexInputValue] = useState(rgbToHex(currentColor.r, currentColor.g, currentColor.b));
  const [bestMatch, setBestMatch] = useState<(typeof ROSCOLUX_FILTERS[0] & { similarity: number }) | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(!isMobile); // Collapsed by default on mobile
  const prevIsOpenRef = useRef(isOpen);

  // Only initialize selectedColor when modal first opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened - initialize selectedColor from currentColor
      setSelectedColor(currentColor);
      setHexInputValue(rgbToHex(currentColor.r, currentColor.g, currentColor.b));
      // Reset advanced section state based on screen size
      setShowAdvanced(!isMobile);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentColor, isMobile]);

  // Update hex input when selected color changes
  useEffect(() => {
    setHexInputValue(rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b));
  }, [selectedColor]);

  // Update Roscolux match when color changes
  useEffect(() => {
    const match = getBestMatchingRoscolux(selectedColor, ROSCOLUX_FILTERS, 95);
    setBestMatch(match);
  }, [selectedColor]);

  const handleColorUpdate = (color: { r: number; g: number; b: number }) => {
    setSelectedColor(color);
    onColorChange(color);
  };

  const handleRoscoluxSelect = (color: { r: number; g: number; b: number }) => {
    setSelectedColor(color);
    // Also trigger real-time preview
    onColorChange(color);
  };

  const isValidHex = (hex: string): boolean => {
    return /^#?[0-9A-Fa-f]{6}$/.test(hex);
  };

  const handleHexInputChange = (hex: string) => {
    setHexInputValue(hex);

    // Only update color if valid hex
    if (isValidHex(hex)) {
      const rgb = hexToRgb(hex);
      setSelectedColor(rgb);
      onColorChange(rgb);
    }
  };

  const handleHexInputBlur = () => {
    // Reset to valid hex color on blur if invalid
    if (!isValidHex(hexInputValue)) {
      setHexInputValue(rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b));
    }
  };

  const handleApply = () => {
    onColorSelect(selectedColor);
    onClose();
  };

  // Header with Roscolux match display - always reserve space to prevent layout shift
  const headerContent = (
    <div className="h-5 flex items-center">
      {bestMatch ? (
        <div className="flex items-center text-xs">
          <span className="text-gray-600 dark:text-gray-400">Matches:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {bestMatch.filter}
          </span>
          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
            {bestMatch.similarity.toFixed(1)}%
          </span>
        </div>
      ) : (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {/* Placeholder text to maintain height */}
          No Roscolux match
        </div>
      )}
    </div>
  );

  // Footer with buttons - responsive layout
  const footerContent = (
    <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
      <button
        onClick={onClose}
        className={`px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors touch-manipulation ${isMobile ? 'w-full min-h-[44px]' : ''}`}
      >
        Cancel
      </button>
      <button
        onClick={handleApply}
        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors touch-manipulation ${isMobile ? 'w-full min-h-[44px]' : ''}`}
      >
        Apply Color
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Color Picker"
      maxWidth="max-w-2xl"
      footer={footerContent}
      fullHeightMobile={true}
      testId="color-picker-modal"
    >
      {/* Roscolux match display below title - always rendered to prevent layout shift */}
      <div className="mb-3 -mt-2">
        {headerContent}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 mb-4">
        <button
          onClick={() => setActiveTab('wheel')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
            activeTab === 'wheel'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Color Wheel
        </button>
        <button
          onClick={() => setActiveTab('roscolux')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
            activeTab === 'roscolux'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Roscolux Filters
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 -mx-4 px-4">
        {activeTab === 'wheel' && (
          <ColorWheelPicker
            currentColor={selectedColor}
            onColorChange={handleColorUpdate}
            onColorSelect={onColorSelect}
            intensity={intensity}
            onIntensityChange={onIntensityChange}
            showIntensity={showIntensity}
          />
        )}
        {activeTab === 'roscolux' && (
          <RoscoluxSwatchPicker
            currentColor={selectedColor}
            onColorSelect={handleRoscoluxSelect}
            highlightMatches={true}
          />
        )}
      </div>

      {/* Color Preview Bar - collapsible on mobile */}
      <div className="border-t border-gray-200 dark:border-gray-700 -mx-4 px-4 pt-3 mt-4">
        {/* Mobile: Collapsible header */}
        {isMobile ? (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 touch-manipulation"
          >
            <div className="flex items-center space-x-3">
              <span>Selected Color:</span>
              <div
                className="w-8 h-8 rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-inner"
                style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
              />
            </div>
            {showAdvanced ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selected Color:</span>
            <div
              className="w-10 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-inner"
              style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
            />
          </div>
        )}

        {/* Advanced color info - always visible on desktop, collapsible on mobile */}
        {(showAdvanced || !isMobile) && (
          <div className={`${isMobile ? 'py-3 space-y-3' : 'flex items-center space-x-4'}`}>
            <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-2'}`}>
              <span className="text-sm text-gray-600 dark:text-gray-400">Hex:</span>
              <input
                type="text"
                value={hexInputValue.toUpperCase()}
                onChange={(e) => handleHexInputChange(e.target.value)}
                onBlur={handleHexInputBlur}
                className={`${isMobile ? 'flex-1' : 'w-24'} px-2 py-1 text-sm font-mono rounded border ${
                  isValidHex(hexInputValue)
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation`}
                placeholder="#FFFFFF"
              />
            </div>
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
            </span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
