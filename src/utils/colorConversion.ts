import { ChannelType, InstanceChannel } from '../types';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Color channel types that can be used for color mixing
 */
export const COLOR_CHANNEL_TYPES = [
  ChannelType.RED,
  ChannelType.GREEN,
  ChannelType.BLUE,
  ChannelType.WHITE,
  ChannelType.AMBER,
  ChannelType.UV,
] as const;

/**
 * Extended InstanceChannel with current value
 */
export interface InstanceChannelWithValue extends InstanceChannel {
  value: number;
}

/**
 * Convert an RGB color to channel values for a fixture
 * This function intelligently maps RGB values to available color channels
 */
export function rgbToChannelValues(
  targetColor: RGBColor,
  channels: InstanceChannelWithValue[],
  preserveIntensity: boolean = true
): Record<string, number> {
  const channelValues: Record<string, number> = {};
  
  // Normalize RGB values to 0-1 range
  const normalizedR = targetColor.r / 255;
  const normalizedG = targetColor.g / 255;
  const normalizedB = targetColor.b / 255;

  // Find available color channels
  const colorChannels = channels.filter(channel =>
    (COLOR_CHANNEL_TYPES as readonly ChannelType[]).includes(channel.type)
  );

  // Get current intensity if we want to preserve it
  let currentIntensity = 1;
  if (preserveIntensity) {
    const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
    if (intensityChannel) {
      currentIntensity = intensityChannel.value / 255;
    }
  }

  // Map RGB to available channels
  colorChannels.forEach(channel => {
    let value = 0;

    switch (channel.type) {
      case ChannelType.RED:
        value = normalizedR;
        break;
        
      case ChannelType.GREEN:
        value = normalizedG;
        break;
        
      case ChannelType.BLUE:
        value = normalizedB;
        break;
        
      case ChannelType.WHITE:
        // White channel: use the minimum of RGB to add white light
        // This approach maintains color saturation while adding brightness
        value = Math.min(normalizedR, normalizedG, normalizedB);
        break;
        
      case ChannelType.AMBER:
        // Amber contributes to red and green channels
        // Calculate amber based on yellow content (min of red and green)
        const yellowComponent = Math.min(normalizedR, normalizedG);
        // Only use amber if there's yellow content and blue is relatively low
        if (yellowComponent > 0 && normalizedB < yellowComponent) {
          value = yellowComponent - normalizedB * 0.3; // Reduce amber when blue is present
          value = Math.max(0, Math.min(1, value));
        }
        break;
        
      case ChannelType.UV:
        // UV is primarily for special effects, map to blue/purple content
        // Use UV when blue is high and red/green are relatively low
        if (normalizedB > 0.5 && normalizedB > normalizedR && normalizedB > normalizedG) {
          value = (normalizedB - Math.max(normalizedR, normalizedG)) * 0.5;
          value = Math.max(0, Math.min(1, value));
        }
        break;
    }

    // Apply intensity scaling if preserving intensity
    if (preserveIntensity && currentIntensity < 1) {
      value *= currentIntensity;
    }

    // Convert to DMX value (0-255) and store
    channelValues[channel.id] = Math.round(value * 255);
  });

  return channelValues;
}

/**
 * Calculate the resulting RGB color from current channel values
 * This is the inverse of rgbToChannelValues and matches the logic in ColorSwatch
 */
export function channelValuesToRgb(channels: InstanceChannelWithValue[]): RGBColor {
  const colorChannels = channels.filter(channel =>
    (COLOR_CHANNEL_TYPES as readonly ChannelType[]).includes(channel.type)
  );

  if (colorChannels.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  let r = 0, g = 0, b = 0;
  let hasIntensity = false;
  let intensity = 1;

  // Check for intensity channel
  const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
  if (intensityChannel) {
    hasIntensity = true;
    intensity = intensityChannel.value / 255;
  }

  colorChannels.forEach(channel => {
    const normalizedValue = channel.value / 255;

    switch (channel.type) {
      case ChannelType.RED:
        r = Math.max(r, normalizedValue);
        break;
      case ChannelType.GREEN:
        g = Math.max(g, normalizedValue);
        break;
      case ChannelType.BLUE:
        b = Math.max(b, normalizedValue);
        break;
      case ChannelType.WHITE:
        // White adds to all channels
        r = Math.min(1, r + normalizedValue * 0.95);
        g = Math.min(1, g + normalizedValue * 0.95);
        b = Math.min(1, b + normalizedValue * 0.95);
        break;
      case ChannelType.AMBER:
        // Amber is roughly orange (255, 191, 0)
        r = Math.min(1, r + normalizedValue);
        g = Math.min(1, g + normalizedValue * 0.75);
        break;
      case ChannelType.UV:
        // UV is deep blue/purple (75, 0, 130)
        r = Math.min(1, r + normalizedValue * 0.29);
        b = Math.min(1, b + normalizedValue * 0.51);
        break;
    }
  });

  // Apply intensity if present
  if (hasIntensity) {
    r *= intensity;
    g *= intensity;
    b *= intensity;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Get the predominant color type for a fixture based on available channels
 */
export function getFixtureColorType(channels: InstanceChannelWithValue[]): 'RGB' | 'RGBW' | 'RGBA' | 'RGBWA' | 'RGBWAU' | 'SINGLE' {
  const colorChannelTypes = channels
    .filter(channel => (COLOR_CHANNEL_TYPES as readonly ChannelType[]).includes(channel.type))
    .map(channel => channel.type);

  const hasRed = colorChannelTypes.includes(ChannelType.RED);
  const hasGreen = colorChannelTypes.includes(ChannelType.GREEN);
  const hasBlue = colorChannelTypes.includes(ChannelType.BLUE);
  const hasWhite = colorChannelTypes.includes(ChannelType.WHITE);
  const hasAmber = colorChannelTypes.includes(ChannelType.AMBER);
  const hasUV = colorChannelTypes.includes(ChannelType.UV);

  if (hasRed && hasGreen && hasBlue) {
    if (hasWhite && hasAmber && hasUV) return 'RGBWAU';
    if (hasWhite && hasAmber) return 'RGBWA';
    if (hasAmber) return 'RGBA';
    if (hasWhite) return 'RGBW';
    return 'RGB';
  }

  return 'SINGLE';
}

/**
 * Create optimized channel mappings based on fixture capabilities
 */
export function createOptimizedColorMapping(
  targetColor: RGBColor,
  channels: InstanceChannelWithValue[]
): Record<string, number> {
  const fixtureType = getFixtureColorType(channels);
  
  // For advanced fixtures, use more sophisticated color mixing
  if (fixtureType === 'RGBWAU' || fixtureType === 'RGBWA') {
    return rgbToChannelValuesAdvanced(targetColor, channels);
  }
  
  // For standard fixtures, use basic mapping
  return rgbToChannelValues(targetColor, channels, true);
}

/**
 * Advanced color mapping for fixtures with White, Amber, and UV channels
 */
function rgbToChannelValuesAdvanced(
  targetColor: RGBColor,
  channels: InstanceChannelWithValue[]
): Record<string, number> {
  const channelValues: Record<string, number> = {};
  
  // Normalize RGB values
  const r = targetColor.r / 255;
  const g = targetColor.g / 255;
  const b = targetColor.b / 255;

  // Calculate white component (minimum of RGB for maintaining saturation)
  const whiteComponent = Math.min(r, g, b);
  
  // Subtract white from RGB to get pure color components
  const pureR = r - whiteComponent;
  const pureG = g - whiteComponent;
  const pureB = b - whiteComponent;

  // Calculate amber component (from yellow content)
  const yellowComponent = Math.min(pureR, pureG);
  
  // Final RGB after white and amber extraction
  const finalR = pureR - yellowComponent;
  const finalG = pureG - yellowComponent;
  const finalB = pureB;

  // Set channel values
  channels.forEach(channel => {
    let value = 0;

    switch (channel.type) {
      case ChannelType.RED:
        value = finalR;
        break;
      case ChannelType.GREEN:
        value = finalG;
        break;
      case ChannelType.BLUE:
        value = finalB;
        break;
      case ChannelType.WHITE:
        value = whiteComponent;
        break;
      case ChannelType.AMBER:
        value = yellowComponent;
        break;
      case ChannelType.UV:
        // Use UV for deep blue/purple effects
        if (finalB > 0.8 && finalR < 0.3 && finalG < 0.3) {
          value = (finalB - 0.5) * 0.6;
        }
        break;
    }

    channelValues[channel.id] = Math.round(Math.max(0, Math.min(1, value)) * 255);
  });

  return channelValues;
}