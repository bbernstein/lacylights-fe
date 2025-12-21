import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { UV_COLOR_HEX } from '@/utils/colorConversion';
import { rgbToHex, hexToRgb } from '@/utils/colorHelpers';

interface ColorWheelPickerProps {
  currentColor: { r: number; g: number; b: number };
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  onColorSelect: (color: { r: number; g: number; b: number }) => void;
  intensity?: number; // Current intensity (0-1)
  onIntensityChange?: (intensity: number) => void; // Intensity change callback
  showIntensity?: boolean; // Show intensity slider (default: false)
}

export default function ColorWheelPicker({
  currentColor,
  onColorChange,
  onColorSelect: _onColorSelect,
  intensity,
  onIntensityChange,
  showIntensity = false
}: ColorWheelPickerProps) {
  const hexColor = rgbToHex(currentColor.r, currentColor.g, currentColor.b);

  const handleHexChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    onColorChange(rgb);
  };

  // Predefined common lighting colors
  const presetColors = [
    { name: 'White', color: '#ffffff' },
    { name: 'Warm White', color: '#ffd1ac' },
    { name: 'Cool White', color: '#e6f3ff' },
    { name: 'Red', color: '#ff0000' },
    { name: 'Green', color: '#00ff00' },
    { name: 'Blue', color: '#0080ff' },
    { name: 'Amber', color: '#ffbf00' },
    { name: 'UV', color: UV_COLOR_HEX },
    { name: 'Magenta', color: '#ff00ff' },
    { name: 'Cyan', color: '#00ffff' },
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Orange', color: '#ff8000' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Color Picker */}
      <div className="flex justify-center">
        <HexColorPicker
          color={hexColor}
          onChange={handleHexChange}
          style={{ width: '200px', height: '200px' }}
        />
      </div>

      {/* Intensity Slider */}
      {showIntensity && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Intensity
            </label>
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {Math.round((intensity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round((intensity ?? 1) * 100)}
            onChange={(e) => onIntensityChange?.(parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Preset Colors */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Quick Colors
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleHexChange(preset.color)}
              className="group relative"
              title={preset.name}
            >
              <div 
                className="w-8 h-8 rounded-md border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
                style={{ backgroundColor: preset.color }}
              />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}