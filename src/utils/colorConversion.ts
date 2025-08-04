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

// Lighting constants based on theatrical lighting practices
/**
 * White channel contribution factor - slightly reduced to account for:
 * - Cooler color temperature of white LEDs vs mixed RGB
 * - Prevention of oversaturation when combining with colored channels
 * - Preservation of color fidelity when white is used for brightness boost
 */
export const WHITE_CHANNEL_INTENSITY_FACTOR = 0.95;

/**
 * Amber reduction factor when blue is present
 * Prevents muddy colors when mixing complementary colors
 */
export const AMBER_BLUE_REDUCTION_FACTOR = 0.3;

/**
 * Amber color mixing ratios for realistic amber LED color reproduction
 * Based on typical amber LED wavelength (~590-595nm) and color temperature
 */
export const AMBER_COLOR_RATIOS = {
  GREEN_FACTOR: 0.75, // Amber adds 75% green contribution (creates orange-yellow)
} as const;

/**
 * UV color mixing factors for theatrical UV LED effects
 * Based on typical UV LED spectrum and visual appearance under stage lighting
 */
export const UV_COLOR_FACTORS = {
  RED_COMPONENT: 0.29,   // UV adds slight red for purple tint (75/255 ≈ 0.29)
  BLUE_COMPONENT: 0.51,  // UV adds strong blue component (130/255 ≈ 0.51)
} as const;

/**
 * UV channel thresholds for activation
 * These values determine when UV should be engaged based on color content
 */
export const UV_ACTIVATION_THRESHOLDS = {
  MIN_BLUE: 0.8,        // Minimum blue level required for UV activation
  MAX_RED: 0.3,         // Maximum red allowed when UV is active
  MAX_GREEN: 0.3,       // Maximum green allowed when UV is active
  INTENSITY_FACTOR: 0.5,// UV intensity reduction for safety and balance
  BLUE_BASELINE: 0.5,   // Baseline blue level for UV calculations
  ADVANCED_INTENSITY: 0.6 // UV intensity factor for advanced color mixing
} as const;

/**
 * Extended InstanceChannel with current value
 * Note: value is expected to be in DMX range (0-255) unless otherwise specified
 */
export interface InstanceChannelWithValue extends InstanceChannel {
  value: number; // DMX value (0-255)
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
  // Note: intensityChannel.value is in DMX range (0-255), normalize to 0-1
  let currentIntensity = 1;
  if (preserveIntensity) {
    const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
    if (intensityChannel) {
      currentIntensity = intensityChannel.value / 255; // Convert DMX (0-255) to normalized (0-1)
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
        // Amber channel calculation for theatrical LED fixtures
        // 
        // Theory: Amber LEDs produce a warm orange light (~590-595nm wavelength)
        // In RGB terms, amber is created by mixing red and green (yellow) with minimal blue
        // 
        // Step 1: Calculate yellow component as the minimum of red and green
        // This ensures we only produce amber when both red and green are present
        const yellowComponent = Math.min(normalizedR, normalizedG);
        
        // Step 2: Check if blue is less than the yellow component
        // This threshold (normalizedB < yellowComponent) ensures:
        // - Pure yellow (R=G, B=0) produces maximum amber
        // - As blue increases, amber decreases to prevent muddy browns
        // - White light (R=G=B) produces no amber, letting the white channel handle it
        // - This mimics how theatrical designers avoid mixing warm and cool colors
        if (yellowComponent > 0 && normalizedB < yellowComponent) {
          // Reduce amber when blue is present to avoid muddy colors
          // The 0.3 factor preserves warmth while preventing brown/gray output
          // This mimics how lighting designers avoid mixing CTB (blue) and CTO (amber) gels
          value = yellowComponent - normalizedB * AMBER_BLUE_REDUCTION_FACTOR;
          value = Math.max(0, Math.min(1, value));
        }
        break;
        
      case ChannelType.UV:
        // UV is primarily for special effects, map to blue/purple content
        // Use UV when blue is high and red/green are relatively low
        if (normalizedB > UV_ACTIVATION_THRESHOLDS.BLUE_BASELINE && normalizedB > normalizedR && normalizedB > normalizedG) {
          // UV intensity is reduced by INTENSITY_FACTOR to account for:
          // - UV LEDs are typically more intense than visible spectrum LEDs
          // - Full UV can overwhelm other colors and create unwanted fluorescence
          // - Safety considerations for prolonged UV exposure in theatrical settings
          value = (normalizedB - Math.max(normalizedR, normalizedG)) * UV_ACTIVATION_THRESHOLDS.INTENSITY_FACTOR;
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
  // Note: intensityChannel.value is in DMX range (0-255), normalize to 0-1
  const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
  if (intensityChannel) {
    hasIntensity = true;
    intensity = intensityChannel.value / 255; // Convert DMX (0-255) to normalized (0-1)
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
        // White adds to all channels at 95% intensity (0.95 factor)
        // This slight reduction accounts for:
        // - White LEDs typically having a cooler color temperature than mixed RGB white
        // - Preventing oversaturation when combining with colored channels
        // - Preserving color fidelity when white is used for brightness boost
        r = Math.min(1, r + normalizedValue * WHITE_CHANNEL_INTENSITY_FACTOR);
        g = Math.min(1, g + normalizedValue * WHITE_CHANNEL_INTENSITY_FACTOR);
        b = Math.min(1, b + normalizedValue * WHITE_CHANNEL_INTENSITY_FACTOR);
        break;
      case ChannelType.AMBER:
        // Amber is roughly orange (255, 191, 0)
        r = Math.min(1, r + normalizedValue);
        g = Math.min(1, g + normalizedValue * AMBER_COLOR_RATIOS.GREEN_FACTOR);
        break;
      case ChannelType.UV:
        // UV is deep blue/purple (75, 0, 130)
        r = Math.min(1, r + normalizedValue * UV_COLOR_FACTORS.RED_COMPONENT);
        b = Math.min(1, b + normalizedValue * UV_COLOR_FACTORS.BLUE_COMPONENT);
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
        // Check against original blue before white/amber extraction for proper UV activation
        if (b > UV_ACTIVATION_THRESHOLDS.BLUE_BASELINE && finalR < UV_ACTIVATION_THRESHOLDS.MAX_RED && finalG < UV_ACTIVATION_THRESHOLDS.MAX_GREEN) {
          // Use finalB for intensity calculation to avoid double-counting extracted components
          value = Math.max(0, finalB * UV_ACTIVATION_THRESHOLDS.ADVANCED_INTENSITY);
        }
        break;
    }

    channelValues[channel.id] = Math.round(Math.max(0, Math.min(1, value)) * 255);
  });

  return channelValues;
}