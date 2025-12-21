import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ColorWheelPicker from './ColorWheelPicker';
import RoscoluxSwatchPicker from './RoscoluxSwatchPicker';
import { getBestMatchingRoscolux } from '@/utils/colorMatching';
import { ROSCOLUX_FILTERS } from '@/data/roscoluxFilters';
import type { InstanceChannelWithValue } from '@/utils/colorConversion';

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
  const [activeTab, setActiveTab] = useState<TabType>('wheel');
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [bestMatch, setBestMatch] = useState<(typeof ROSCOLUX_FILTERS[0] & { similarity: number }) | null>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Only initialize selectedColor when modal first opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened - initialize selectedColor from currentColor
      setSelectedColor(currentColor);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentColor]);

  // Update Roscolux match when color changes
  useEffect(() => {
    const match = getBestMatchingRoscolux(selectedColor, ROSCOLUX_FILTERS, 95);
    setBestMatch(match);
  }, [selectedColor]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleColorUpdate = (color: { r: number; g: number; b: number }) => {
    setSelectedColor(color);
    onColorChange(color);
  };

  const handleRoscoluxSelect = (color: { r: number; g: number; b: number }) => {
    setSelectedColor(color);
    // Also trigger real-time preview
    onColorChange(color);
  };

  if (!isOpen) return null;

  return (
    // Color picker modal - z-50 (foreground layer, above scene editor modal z-40)
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        // Only close if clicking the backdrop, not the content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {/* Header with Roscolux Match Display */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Color Picker
            </h2>
            {bestMatch && (
              <div className="flex items-center mt-1 text-xs">
                <span className="text-gray-600 dark:text-gray-400">Matches:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {bestMatch.filter}
                </span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  {bestMatch.similarity.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'wheel'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Color Wheel
          </button>
          <button
            onClick={() => setActiveTab('roscolux')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'roscolux'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Roscolux Filters
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
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

        {/* Color Preview Bar */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Selected Color:</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-10 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-inner"
                  style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
                />
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onColorSelect(selectedColor);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Apply Color
          </button>
        </div>
      </div>
    </div>
  );
}