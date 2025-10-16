import { ChannelType, InstanceChannel } from "@/types";

/**
 * Minimum interface required for channel abbreviation
 */
export interface AbbreviableChannel {
  name: string;
  type: ChannelType;
}

/**
 * Abbreviates a channel name to 1-3 characters based on its type and name.
 *
 * Examples:
 * - "Red" → "R"
 * - "Red 1" → "R1"
 * - "Fine Red" → "Rf"
 * - "Warm White" → "WW"
 * - "Master Dimmer" → "MD"
 * - "Pan/Tilt Speed" → "PT"
 * - "Color Macro" → "CM"
 */
export function abbreviateChannelName(channel: InstanceChannel | AbbreviableChannel): string {
  const name = channel.name;
  const type = channel.type;

  // Get base abbreviation from channel type
  let abbr = getChannelTypeAbbreviation(type);

  // Handle special qualifiers
  const isFine = /\bfine\b/i.test(name);
  const is16bit = /16\s*bit/i.test(name);
  const numberMatch = name.match(/\b(\d+)\b/);
  const isWarm = /\bwarm\b/i.test(name);
  const isCold = /\bcold\b/i.test(name);
  const isMaster = /\bmaster\b/i.test(name);

  // For OTHER type, need smarter abbreviation
  if (type === ChannelType.OTHER || abbr === '') {
    abbr = getSmartAbbreviation(name);
  }

  // Special cases for white variants
  if (type === ChannelType.WHITE) {
    if (isWarm) return 'WW';
    if (isCold) return 'WC';
  }

  // Master prefix for intensity channels
  if (isMaster && type === ChannelType.INTENSITY) {
    return 'MD';
  }

  // Add qualifiers
  if (isFine) abbr += 'f';
  else if (is16bit) abbr += '16';
  else if (numberMatch) abbr += numberMatch[1];

  return abbr;
}

/**
 * Gets the base abbreviation for a channel type.
 */
function getChannelTypeAbbreviation(type: ChannelType): string {
  const map: Record<ChannelType, string> = {
    [ChannelType.RED]: 'R',
    [ChannelType.GREEN]: 'G',
    [ChannelType.BLUE]: 'B',
    [ChannelType.WHITE]: 'W',
    [ChannelType.AMBER]: 'A',
    [ChannelType.UV]: 'UV',
    [ChannelType.INTENSITY]: 'Di',
    [ChannelType.PAN]: 'P',
    [ChannelType.TILT]: 'T',
    [ChannelType.ZOOM]: 'Z',
    [ChannelType.FOCUS]: 'F',
    [ChannelType.IRIS]: 'Ir',
    [ChannelType.GOBO]: 'Go',
    [ChannelType.COLOR_WHEEL]: 'CW',
    [ChannelType.EFFECT]: 'Fx',
    [ChannelType.STROBE]: 'St',
    [ChannelType.MACRO]: 'M',
    [ChannelType.OTHER]: '' // Handle separately
  };
  return map[type] || '';
}

/**
 * Generates a smart abbreviation for channel names that don't have a specific type.
 * Handles special colors, compound names, and falls back to first letters.
 */
function getSmartAbbreviation(name: string): string {
  // Special color names not in ChannelType enum
  const specialColors: Record<string, string> = {
    'lime': 'Lm',
    'indigo': 'In',
    'cyan': 'Cy',
    'magenta': 'Mg',
    'yellow': 'Ye',
    'mint': 'Mt',
    'violet': 'Vi',
    'orange': 'Or'
  };

  const lowerName = name.toLowerCase();
  for (const [color, abbr] of Object.entries(specialColors)) {
    if (lowerName.includes(color)) return abbr;
  }

  // Common compound names
  if (/color\s+temp/i.test(name)) return 'CT';
  if (/color\s+macro/i.test(name)) return 'CM';
  if (/auto\s+program/i.test(name)) return 'AP';
  if (/program\s+speed/i.test(name)) return 'PS';
  if (/gobo\s+rotation/i.test(name)) return 'GR';
  if (/pan.*tilt\s+speed/i.test(name)) return 'PT';

  // Extract first letters of significant words (skip common short words)
  const words = name.split(/[\s/\-_]+/)
    .filter(w => w.length > 2) // Skip short words
    .filter(w => !['the', 'and', 'of', 'for'].includes(w.toLowerCase()));

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Fallback: first 2-3 characters
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
  if (cleanName.length === 0) {
    return 'CH'; // Default abbreviation if nothing is left after cleaning
  }
  return cleanName.substring(0, Math.min(2, cleanName.length)).toUpperCase();
}
