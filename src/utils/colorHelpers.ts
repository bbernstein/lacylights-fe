/**
 * Color conversion helper functions
 */

/**
 * Convert RGB values to hexadecimal color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hexadecimal color string to RGB values
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) hex colors
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Try 6-digit hex first
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  // Try 3-digit hex (shorthand)
  result = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1] + result[1], 16),
      g: parseInt(result[2] + result[2], 16),
      b: parseInt(result[3] + result[3], 16),
    };
  }

  // Invalid color defaults to black
  return { r: 0, g: 0, b: 0 };
}

/**
 * Calculate relative luminance of an RGB color using WCAG formula
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance (0-1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  // Normalize to 0-1
  const [rs, gs, bs] = [r / 255, g / 255, b / 255];

  // Apply gamma correction
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const [rL, gL, bL] = [linearize(rs), linearize(gs), linearize(bs)];

  // Calculate relative luminance using WCAG formula
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

/**
 * Get a contrasting text color (light or dark) for a given background color
 * @param backgroundColor - Hex color string (e.g., "#ff5733" or "#f73")
 * @returns Contrasting text color as hex string
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const { r, g, b } = hexToRgb(backgroundColor);
  const luminance = getRelativeLuminance(r, g, b);

  // Use threshold of 0.4 for better contrast ratios
  // This provides better adherence to WCAG accessibility standards
  // For dark backgrounds (low luminance), use light grey
  // For light backgrounds (high luminance), use dark grey
  return luminance > 0.4 ? '#1a1a1a' : '#f5f5f5';
}