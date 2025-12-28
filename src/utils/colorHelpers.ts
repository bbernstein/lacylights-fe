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
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
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
 * @param backgroundColor - Hex color string (e.g., "#ff5733")
 * @returns Contrasting text color as hex string
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const { r, g, b } = hexToRgb(backgroundColor);
  const luminance = getRelativeLuminance(r, g, b);

  // Use threshold of 0.5 for switching between light and dark text
  // For dark backgrounds (low luminance), use light grey
  // For light backgrounds (high luminance), use dark grey
  return luminance > 0.5 ? '#1a1a1a' : '#f5f5f5';
}