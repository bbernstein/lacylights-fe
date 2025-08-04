import React, { useState, useEffect } from 'react';
import { HexColorPicker, RgbColorPicker } from 'react-colorful';

interface ColorWheelPickerProps {
  currentColor: { r: number; g: number; b: number };
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  onColorSelect: (color: { r: number; g: number; b: number }) => void;
}

export default function ColorWheelPicker({
  currentColor,
  onColorChange,
  onColorSelect
}: ColorWheelPickerProps) {
  const [pickerMode, setPickerMode] = useState<'hex' | 'rgb'>('hex');
  const [localColor, setLocalColor] = useState(currentColor);

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const hexColor = rgbToHex(localColor.r, localColor.g, localColor.b);

  const handleHexChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    setLocalColor(rgb);
    onColorChange(rgb);
  };

  const handleRgbChange = (rgb: { r: number; g: number; b: number }) => {
    setLocalColor(rgb);
    onColorChange(rgb);
  };

  // Update local color when currentColor prop changes
  useEffect(() => {
    setLocalColor(currentColor);
  }, [currentColor]);

  // Predefined common lighting colors
  const presetColors = [
    { name: 'White', color: '#ffffff' },
    { name: 'Warm White', color: '#ffd1ac' },
    { name: 'Cool White', color: '#e6f3ff' },
    { name: 'Red', color: '#ff0000' },
    { name: 'Green', color: '#00ff00' },
    { name: 'Blue', color: '#0080ff' },
    { name: 'Amber', color: '#ffbf00' },
    { name: 'UV', color: '#4b0082' },
    { name: 'Magenta', color: '#ff00ff' },
    { name: 'Cyan', color: '#00ffff' },
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Orange', color: '#ff8000' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Picker Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setPickerMode('hex')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              pickerMode === 'hex'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Hex
          </button>
          <button
            onClick={() => setPickerMode('rgb')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              pickerMode === 'rgb'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            RGB
          </button>
        </div>
      </div>

      {/* Color Picker */}
      <div className="flex justify-center">
        {pickerMode === 'hex' ? (
          <HexColorPicker 
            color={hexColor} 
            onChange={handleHexChange}
            style={{ width: '200px', height: '200px' }}
          />
        ) : (
          <RgbColorPicker 
            color={localColor} 
            onChange={handleRgbChange}
            style={{ width: '200px', height: '200px' }}
          />
        )}
      </div>

      {/* Current Color Preview and Values */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Color
          </span>
          <div 
            className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
            style={{ backgroundColor: hexColor }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Hex:</span>
            <input
              type="text"
              value={hexColor.toUpperCase()}
              onChange={(e) => handleHexChange(e.target.value)}
              className="ml-2 bg-transparent border-none text-gray-900 dark:text-white font-mono text-xs focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-gray-600 dark:text-gray-400">R:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                {localColor.r}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">G:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                {localColor.g}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">B:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                {localColor.b}
              </span>
            </div>
          </div>
        </div>
      </div>

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