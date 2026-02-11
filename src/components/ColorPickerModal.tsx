import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ColorWheelPicker from './ColorWheelPicker';
import RoscoluxSwatchPicker from './RoscoluxSwatchPicker';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getBestMatchingRoscolux } from '@/utils/colorMatching';
import { ROSCOLUX_FILTERS } from '@/data/roscoluxFilters';
import type { InstanceChannelWithValue } from '@/utils/colorConversion';
import { rgbToHex, hexToRgb, rgbToHsb, hsbToRgb } from '@/utils/colorHelpers';
import { useStreamDock } from '@/contexts/StreamDockContext';

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
  const streamDock = useStreamDock();
  const [activeTab, setActiveTab] = useState<TabType>('wheel');
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [hexInputValue, setHexInputValue] = useState(rgbToHex(currentColor.r, currentColor.g, currentColor.b));
  const [bestMatch, setBestMatch] = useState<(typeof ROSCOLUX_FILTERS[0] & { similarity: number }) | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(!isMobile); // Collapsed by default on mobile
  const prevIsOpenRef = useRef(isOpen);
  // Ref to track latest selectedColor for use in handlers without re-registration
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;

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
    // INTENTIONAL: Omitting currentColor and isMobile from dependency array.
    // WHY IT'S SAFE:
    // 1. This effect only initializes state when modal OPENS (isOpen: false → true)
    // 2. While modal is open, color changes are handled by ColorWheelPicker/RoscoluxSwatchPicker
    // 3. Including currentColor would cause unwanted resets during user interaction
    // 4. isMobile only affects initial UI state (showAdvanced), not ongoing behavior
    // 5. Fresh values are captured from closure when the condition is met
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Track whether the last color change came from the hex input
  // Using a ref with the hex value that caused the color change
  const lastHexInputColorRef = useRef<string | null>(null);

  // Update hex input when selected color changes from external sources (color wheel, roscolux)
  // Skip if the color was set from hex input to avoid overwriting user's typing
  useEffect(() => {
    const colorHex = rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b).toLowerCase();

    // Check if this color was set from hex input by comparing RGB values
    if (lastHexInputColorRef.current) {
      const lastInputRgb = hexToRgb(lastHexInputColorRef.current);
      if (
        lastInputRgb.r === selectedColor.r &&
        lastInputRgb.g === selectedColor.g &&
        lastInputRgb.b === selectedColor.b
      ) {
        // Color matches the hex input that set it - don't overwrite
        lastHexInputColorRef.current = null;
        return;
      }
    }

    // Color came from external source (color wheel, roscolux) - update hex input
    setHexInputValue(colorHex);
    lastHexInputColorRef.current = null;
  }, [selectedColor]);

  // Update Roscolux match when color changes
  useEffect(() => {
    const match = getBestMatchingRoscolux(selectedColor, ROSCOLUX_FILTERS, 95);
    setBestMatch(match);
  }, [selectedColor]);

  // Stream Dock: register color picker command handlers
  // Note: handleOpen is a no-op because ColorPickerModal does not own its open state;
  // the parent component controls isOpen. To support COLOR_OPEN from Stream Dock,
  // the parent would need to provide an onOpen callback.
  useEffect(() => {
    if (!isOpen) {
      // Register minimal handlers when closed so handleOpen could be wired in the future
      streamDock.registerColorPickerHandlers({
        handleSetHSB: () => { /* modal closed */ },
        handleSetRGB: () => { /* modal closed */ },
        handleApply: () => { /* modal closed */ },
        handleCancel: () => { /* modal closed */ },
        handleOpen: () => {
          // Cannot open from here - isOpen is controlled by parent component
        },
      });
      return () => streamDock.registerColorPickerHandlers(null);
    }

    streamDock.registerColorPickerHandlers({
      handleSetHSB: (hue: number, saturation: number, brightness: number) => {
        const rgb = hsbToRgb(hue, saturation, brightness);
        setSelectedColor(rgb);
        onColorChange(rgb);
      },
      handleSetRGB: (r: number, g: number, b: number) => {
        const color = { r, g, b };
        setSelectedColor(color);
        onColorChange(color);
      },
      handleApply: () => {
        // Use ref to avoid re-registration on every color change
        onColorSelect(selectedColorRef.current);
        onClose();
      },
      handleCancel: () => {
        onClose();
      },
      handleOpen: () => {
        // Already open - no-op
      },
    });

    return () => streamDock.registerColorPickerHandlers(null);
  }, [isOpen, streamDock, onColorChange, onColorSelect, onClose]);

  // Stream Dock: publish color picker state
  useEffect(() => {
    const hsb = rgbToHsb(selectedColor.r, selectedColor.g, selectedColor.b);
    streamDock.publishColorPickerState({
      isOpen,
      hue: hsb.hue,
      saturation: hsb.saturation,
      brightness: hsb.brightness,
      rgb: selectedColor,
    });
  }, [streamDock, isOpen, selectedColor]);

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
    // Support both 3-character (#FFF) and 6-character (#FFFFFF) hex codes
    return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
  };

  const handleHexInputChange = (hex: string) => {
    setHexInputValue(hex);

    // Only update color if valid hex
    if (isValidHex(hex)) {
      const rgb = hexToRgb(hex);
      // Store the hex value to prevent effect from overwriting user's input
      lastHexInputColorRef.current = hex;
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
