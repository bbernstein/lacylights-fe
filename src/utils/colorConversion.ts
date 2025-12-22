import { ChannelType, InstanceChannel } from '../types';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * RGB color with separate intensity value
 * Used when we need to distinguish between the base color and intensity scaling
 */
export interface RGBColorWithIntensity {
  r: number;      // Unscaled RGB value (0-255)
  g: number;
  b: number;
  intensity: number;  // Normalized intensity (0-1), 1.0 if no INTENSITY channel
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
  ChannelType.CYAN,
  ChannelType.MAGENTA,
  ChannelType.YELLOW,
  ChannelType.LIME,
  ChannelType.INDIGO,
  ChannelType.COLD_WHITE,
  ChannelType.WARM_WHITE,
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
 * Standard UV color representation for theatrical lighting
 * RGB(75, 0, 130) represents typical UV LED visual appearance
 */
export const UV_COLOR_HEX = '#4b0082';

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
 * Secondary color detection thresholds for intelligent color mapping
 * These thresholds determine when to use extended color channels (Cyan, Magenta, Yellow, Lime, Indigo)
 * Values chosen empirically for typical RGB fixtures to maximize brightness and color accuracy
 */
export const SECONDARY_COLOR_THRESHOLDS = {
  // Minimum threshold for detecting low components (used for Cyan, Magenta, Yellow, Lime, Indigo detection)
  LOW_COMPONENT_MAX: 0.1,

  // Lime detection thresholds (Yellow-green color)
  LIME_GREEN_MIN: 0.5,      // Lime requires dominant green component
  LIME_RED_MIN: 0.2,        // With moderate red component for yellow-green hue
  LIME_RED_MAX: 0.6,        // But not too much red (would be pure yellow)

  // Indigo detection thresholds (Deep blue-purple color)
  INDIGO_BLUE_MIN: 0.3,     // Indigo requires strong blue component
  INDIGO_RED_MIN: 0.1,      // With some red for purple hue
  INDIGO_RED_MAX: 0.4,      // But moderate red (too much would be magenta)
} as const;

/**
 * Extended color channel mixing ratios for advanced LED fixtures
 * Based on typical LED wavelengths and color theory for maximum brightness output
 */
export const EXTENDED_COLOR_RATIOS = {
  // Cyan (Blue + Green mix) - ~490-520nm wavelength
  CYAN: {
    RED_COMPONENT: 0,
    GREEN_COMPONENT: 1,
    BLUE_COMPONENT: 1,
  },
  // Magenta (Red + Blue mix) - produces magenta/pink hues
  MAGENTA: {
    RED_COMPONENT: 1,
    GREEN_COMPONENT: 0,
    BLUE_COMPONENT: 1,
  },
  // Yellow (Red + Green mix) - ~570-590nm wavelength
  YELLOW: {
    RED_COMPONENT: 1,
    GREEN_COMPONENT: 1,
    BLUE_COMPONENT: 0,
  },
  // Lime (Yellow-Green, brighter greens) - ~560-575nm wavelength
  LIME: {
    RED_COMPONENT: 0.5,
    GREEN_COMPONENT: 1,
    BLUE_COMPONENT: 0,
  },
  // Indigo (Deep Blue-Purple) - ~420-450nm wavelength
  INDIGO: {
    RED_COMPONENT: 0.29,
    GREEN_COMPONENT: 0,
    BLUE_COMPONENT: 0.51,
  },
  // Cold White (bluish white, ~6500K color temperature)
  COLD_WHITE: {
    RED_COMPONENT: 0.85,
    GREEN_COMPONENT: 0.90,
    BLUE_COMPONENT: 1.0,
    INTENSITY_FACTOR: 0.95,
  },
  // Warm White (yellowish white, ~3000K color temperature)
  WARM_WHITE: {
    RED_COMPONENT: 1.0,
    GREEN_COMPONENT: 0.85,
    BLUE_COMPONENT: 0.70,
    INTENSITY_FACTOR: 0.95,
  },
} as const;

/**
 * Extended InstanceChannel with current value
 * Note: value is expected to be in DMX range (0-255) unless otherwise specified
 */
export interface InstanceChannelWithValue extends InstanceChannel {
  value: number; // DMX value (0-255)
}

/**
 * Calculates the amber channel value for theatrical LED fixtures based on normalized RGB values.
 * @param normalizedR - Normalized red component (0 to 1)
 * @param normalizedG - Normalized green component (0 to 1)
 * @param normalizedB - Normalized blue component (0 to 1)
 * @returns The calculated amber channel value (0 to 1)
 */
function calculateAmberValue(normalizedR: number, normalizedG: number, normalizedB: number): number {
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
    // The AMBER_BLUE_REDUCTION_FACTOR preserves warmth while preventing brown/gray output
    // This mimics how lighting designers avoid mixing CTB (blue) and CTO (amber) gels
    const value = yellowComponent - normalizedB * AMBER_BLUE_REDUCTION_FACTOR;
    return Math.max(0, Math.min(1, value));
  }
  
  return 0;
}

/**
 * Determines whether the UV channel should be activated based on the RGB color components.
 *
 * UV activation is triggered when the blue component exceeds a specified threshold,
 * and both the red and green components are below their respective maximums.
 * This logic helps ensure UV is only engaged for colors with strong blue content and minimal red/green,
 * mimicking real-world lighting behavior.
 *
 * @param {number} r - The normalized red component (0 to 1).
 * @param {number} g - The normalized green component (0 to 1).
 * @param {number} b - The normalized blue component (0 to 1).
 * @param {number} [blueThreshold=UV_ACTIVATION_THRESHOLDS.BLUE_BASELINE] - The minimum blue value required to activate UV.
 * @returns {boolean} True if UV should be activated, false otherwise.
 */
function shouldActivateUV(r: number, g: number, b: number, blueThreshold: number = UV_ACTIVATION_THRESHOLDS.BLUE_BASELINE): boolean {
  return b > blueThreshold && r < UV_ACTIVATION_THRESHOLDS.MAX_RED && g < UV_ACTIVATION_THRESHOLDS.MAX_GREEN;
}

/**
 * Intelligent RGB-to-channel mapping with brightness maximization.
 *
 * This function uses an advanced algorithm to map RGB colors to all available
 * color channels, prioritizing maximum brightness output by aggressively using
 * extended color channels (Cyan, Magenta, Yellow, Lime, Indigo, Warm/Cold White).
 *
 * Algorithm:
 * 1. Extract white component (minimum of RGB)
 * 2. Calculate pure color components after white extraction
 * 3. Detect and extract secondary colors (cyan, magenta, yellow, lime, indigo)
 * 4. Use extended channels for brightness boost
 * 5. Prioritize Warm/Cold White over generic White based on color temperature
 * 6. Calculate Amber from yellow content
 * 7. Activate UV for deep blues/purples
 * 8. Set RGB channels with remaining values
 * 9. Apply intensity scaling if provided
 *
 * @param targetColor RGB color (0-255)
 * @param channels Available fixture channels with current values
 * @param intensity Optional intensity value (0-1), controls overall brightness
 * @returns Channel ID to DMX value mapping (0-255)
 *
 * @example
 * // Light pink with RGBW fixture
 * const channels = fixture.channels; // Has R, G, B, W channels
 * const pink = { r: 255, g: 200, b: 210 };
 * const result = rgbToChannelValuesIntelligent(pink, channels);
 * // Result: { R: 45, G: 0, B: 10, W: 200 } - Uses white for brightness!
 *
 * @example
 * // Orange with Amber channel
 * const orange = { r: 255, g: 165, b: 0 };
 * const result = rgbToChannelValuesIntelligent(orange, channels, 0.8);
 * // Uses Amber channel aggressively, applies 80% intensity scaling
 */
export function rgbToChannelValuesIntelligent(
  targetColor: RGBColor,
  channels: InstanceChannelWithValue[],
  intensity?: number
): Record<string, number> {
  const channelValues: Record<string, number> = {};

  // Normalize RGB to 0-1
  const r = targetColor.r / 255;
  const g = targetColor.g / 255;
  const b = targetColor.b / 255;

  // Build set of available color channel types for fast lookup
  const availableChannels = new Set(
    channels
      .filter(ch => (COLOR_CHANNEL_TYPES as readonly ChannelType[]).includes(ch.type))
      .map(ch => ch.type)
  );

  // Calculate white component (minimum of RGB values)
  const minRGB = Math.min(r, g, b);
  const whiteComponent = minRGB;

  // Pure color components after white extraction
  let pureR = r - whiteComponent;
  let pureG = g - whiteComponent;
  let pureB = b - whiteComponent;

  // Detect secondary colors for optimization using named thresholds
  const isCyan = pureG > 0 && pureB > 0 && pureR < SECONDARY_COLOR_THRESHOLDS.LOW_COMPONENT_MAX;
  const isMagenta = pureR > 0 && pureB > 0 && pureG < SECONDARY_COLOR_THRESHOLDS.LOW_COMPONENT_MAX;
  const isYellow = pureR > 0 && pureG > 0 && pureB < SECONDARY_COLOR_THRESHOLDS.LOW_COMPONENT_MAX;
  const isLime = pureG > SECONDARY_COLOR_THRESHOLDS.LIME_GREEN_MIN &&
                 pureR > SECONDARY_COLOR_THRESHOLDS.LIME_RED_MIN &&
                 pureR < SECONDARY_COLOR_THRESHOLDS.LIME_RED_MAX &&
                 pureB < SECONDARY_COLOR_THRESHOLDS.LOW_COMPONENT_MAX;
  const isIndigo = pureB > SECONDARY_COLOR_THRESHOLDS.INDIGO_BLUE_MIN &&
                   pureR > SECONDARY_COLOR_THRESHOLDS.INDIGO_RED_MIN &&
                   pureR < SECONDARY_COLOR_THRESHOLDS.INDIGO_RED_MAX &&
                   pureG < SECONDARY_COLOR_THRESHOLDS.LOW_COMPONENT_MAX;

  // Use extended channels for brightness boost (maximize output!)
  if (availableChannels.has(ChannelType.CYAN) && isCyan) {
    const cyanAmount = Math.min(pureG, pureB);
    const cyanChannel = channels.find(ch => ch.type === ChannelType.CYAN);
    if (cyanChannel) {
      channelValues[cyanChannel.id] = Math.round(cyanAmount * 255);
      pureG -= cyanAmount;
      pureB -= cyanAmount;
    }
  }

  if (availableChannels.has(ChannelType.MAGENTA) && isMagenta) {
    const magentaAmount = Math.min(pureR, pureB);
    const magentaChannel = channels.find(ch => ch.type === ChannelType.MAGENTA);
    if (magentaChannel) {
      channelValues[magentaChannel.id] = Math.round(magentaAmount * 255);
      pureR -= magentaAmount;
      pureB -= magentaAmount;
    }
  }

  if (availableChannels.has(ChannelType.YELLOW) && isYellow) {
    const yellowAmount = Math.min(pureR, pureG);
    const yellowChannel = channels.find(ch => ch.type === ChannelType.YELLOW);
    if (yellowChannel) {
      channelValues[yellowChannel.id] = Math.round(yellowAmount * 255);
      pureR -= yellowAmount;
      pureG -= yellowAmount;
    }
  }

  if (availableChannels.has(ChannelType.LIME) && isLime) {
    const limeChannel = channels.find(ch => ch.type === ChannelType.LIME);
    if (limeChannel) {
      // Lime boosts greens - use 50% of green component for lime
      channelValues[limeChannel.id] = Math.round(pureG * 0.5 * 255);
    }
  }

  if (availableChannels.has(ChannelType.INDIGO) && isIndigo) {
    const indigoChannel = channels.find(ch => ch.type === ChannelType.INDIGO);
    if (indigoChannel) {
      // Indigo enhances deep blues - use 50% of blue component for indigo
      channelValues[indigoChannel.id] = Math.round(pureB * 0.5 * 255);
    }
  }

  // Handle white channels (prioritize Warm/Cold over generic White)
  if (whiteComponent > 0) {
    const isWarm = r > g && r > b; // Reddish tint
    const isCool = b > r && b > g; // Bluish tint

    if (availableChannels.has(ChannelType.WARM_WHITE) && isWarm) {
      const warmWhiteChannel = channels.find(ch => ch.type === ChannelType.WARM_WHITE);
      if (warmWhiteChannel) {
        channelValues[warmWhiteChannel.id] =
          Math.round(whiteComponent * 255 * EXTENDED_COLOR_RATIOS.WARM_WHITE.INTENSITY_FACTOR);
      }
    } else if (availableChannels.has(ChannelType.COLD_WHITE) && isCool) {
      const coldWhiteChannel = channels.find(ch => ch.type === ChannelType.COLD_WHITE);
      if (coldWhiteChannel) {
        channelValues[coldWhiteChannel.id] =
          Math.round(whiteComponent * 255 * EXTENDED_COLOR_RATIOS.COLD_WHITE.INTENSITY_FACTOR);
      }
    } else if (availableChannels.has(ChannelType.WHITE)) {
      const whiteChannel = channels.find(ch => ch.type === ChannelType.WHITE);
      if (whiteChannel) {
        channelValues[whiteChannel.id] =
          Math.round(whiteComponent * 255 * WHITE_CHANNEL_INTENSITY_FACTOR);
      }
    }
  }

  // Calculate Amber from remaining yellow content
  if (availableChannels.has(ChannelType.AMBER)) {
    const amberValue = calculateAmberValue(pureR, pureG, pureB);
    if (amberValue > 0) {
      const amberChannel = channels.find(ch => ch.type === ChannelType.AMBER);
      if (amberChannel) {
        channelValues[amberChannel.id] = Math.round(amberValue * 255);
      }
    }
  }

  // UV for deep blues/purples
  if (availableChannels.has(ChannelType.UV)) {
    if (shouldActivateUV(pureR, pureG, pureB)) {
      const uvValue = (pureB - Math.max(pureR, pureG)) * UV_ACTIVATION_THRESHOLDS.INTENSITY_FACTOR;
      const uvChannel = channels.find(ch => ch.type === ChannelType.UV);
      if (uvChannel) {
        channelValues[uvChannel.id] =
          Math.round(Math.max(0, Math.min(1, uvValue)) * 255);
      }
    }
  }

  // Handle cases where we need to use extended channels as fallbacks
  // If no BLUE channel but we have INDIGO, use INDIGO to create blue
  if (!availableChannels.has(ChannelType.BLUE) && availableChannels.has(ChannelType.INDIGO) && pureB > 0) {
    const indigoChannel = channels.find(ch => ch.type === ChannelType.INDIGO);
    if (indigoChannel) {
      // INDIGO contributes: RED_COMPONENT=0.29, BLUE_COMPONENT=0.51
      // To get the blue we need: indigoValue = pureB / 0.51
      const indigoValue = Math.min(1, pureB / EXTENDED_COLOR_RATIOS.INDIGO.BLUE_COMPONENT);
      channelValues[indigoChannel.id] = Math.round(indigoValue * 255);
      // Subtract the red contribution from INDIGO
      pureR -= indigoValue * EXTENDED_COLOR_RATIOS.INDIGO.RED_COMPONENT;
      pureR = Math.max(0, pureR); // Ensure non-negative
    }
  }

  // If no BLUE channel but we have CYAN, use CYAN to create blue
  if (!availableChannels.has(ChannelType.BLUE) && availableChannels.has(ChannelType.CYAN) && pureB > 0) {
    const cyanChannel = channels.find(ch => ch.type === ChannelType.CYAN);
    if (cyanChannel) {
      // CYAN contributes: GREEN_COMPONENT=1.0, BLUE_COMPONENT=1.0
      const cyanValue = Math.min(pureG, pureB);
      if (cyanValue > 0 && !channelValues[cyanChannel.id]) {
        channelValues[cyanChannel.id] = Math.round(cyanValue * 255);
        pureG -= cyanValue;
        pureB -= cyanValue;
      }
    }
  }

  // Set RGB channels with remaining values
  if (availableChannels.has(ChannelType.RED)) {
    const redChannel = channels.find(ch => ch.type === ChannelType.RED);
    if (redChannel) {
      channelValues[redChannel.id] = Math.round(pureR * 255);
    }
  }
  if (availableChannels.has(ChannelType.GREEN)) {
    const greenChannel = channels.find(ch => ch.type === ChannelType.GREEN);
    if (greenChannel) {
      channelValues[greenChannel.id] = Math.round(pureG * 255);
    }
  }
  if (availableChannels.has(ChannelType.BLUE)) {
    const blueChannel = channels.find(ch => ch.type === ChannelType.BLUE);
    if (blueChannel) {
      channelValues[blueChannel.id] = Math.round(pureB * 255);
    }
  }

  // Apply intensity scaling if provided
  if (intensity !== undefined && intensity < 1) {
    Object.keys(channelValues).forEach(channelId => {
      channelValues[channelId] = Math.round(channelValues[channelId] * intensity);
    });
  }

  return channelValues;
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
        value = calculateAmberValue(normalizedR, normalizedG, normalizedB);
        break;
        
      case ChannelType.UV:
        // UV is primarily for special effects, map to blue/purple content
        if (shouldActivateUV(normalizedR, normalizedG, normalizedB) && normalizedB > normalizedR && normalizedB > normalizedG) {
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
 * Calculate the resulting RGB color from current channel values with separate intensity.
 *
 * Returns UNSCALED RGB values (raw channel values, not multiplied by intensity).
 *
 * For fixtures WITH an INTENSITY channel:
 *   - RGB values are the raw channel values (e.g., RED=255)
 *   - intensity is the INTENSITY channel value normalized to 0-1 (e.g., 128/255 = 0.5)
 *
 * For fixtures WITHOUT an INTENSITY channel:
 *   - RGB values are the channel values (e.g., RED=128)
 *   - intensity is always 1.0
 *
 * To get display color (what user sees), multiply RGB by intensity:
 *   displayR = r * intensity
 *
 * This is the inverse of rgbToChannelValues and matches the logic in ColorSwatch
 *
 * @param channels - Array of channels with current values
 * @returns Unscaled RGB color + intensity value
 */
export function channelValuesToRgb(channels: InstanceChannelWithValue[]): RGBColorWithIntensity {
  const colorChannels = channels.filter(channel =>
    (COLOR_CHANNEL_TYPES as readonly ChannelType[]).includes(channel.type)
  );

  if (colorChannels.length === 0) {
    return { r: 0, g: 0, b: 0, intensity: 1.0 };
  }

  let r = 0, g = 0, b = 0;
  let intensity = 1;

  // Check for intensity channel
  // Note: intensityChannel.value is in DMX range (0-255), normalize to 0-1
  const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
  if (intensityChannel) {
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
        // Amber channel adds warm orange light
        // Full amber (normalizedValue=1) adds: R=+1.0, G=+0.75
        // This creates a warm orange tone when mixed with existing colors
        r = Math.min(1, r + normalizedValue);
        g = Math.min(1, g + normalizedValue * AMBER_COLOR_RATIOS.GREEN_FACTOR);
        break;
      case ChannelType.UV:
        // UV is deep blue/purple (75, 0, 130)
        r = Math.min(1, r + normalizedValue * UV_COLOR_FACTORS.RED_COMPONENT);
        b = Math.min(1, b + normalizedValue * UV_COLOR_FACTORS.BLUE_COMPONENT);
        break;

      case ChannelType.CYAN:
        // Cyan adds green and blue
        g = Math.min(1, g + normalizedValue * EXTENDED_COLOR_RATIOS.CYAN.GREEN_COMPONENT);
        b = Math.min(1, b + normalizedValue * EXTENDED_COLOR_RATIOS.CYAN.BLUE_COMPONENT);
        break;

      case ChannelType.MAGENTA:
        // Magenta adds red and blue
        r = Math.min(1, r + normalizedValue * EXTENDED_COLOR_RATIOS.MAGENTA.RED_COMPONENT);
        b = Math.min(1, b + normalizedValue * EXTENDED_COLOR_RATIOS.MAGENTA.BLUE_COMPONENT);
        break;

      case ChannelType.YELLOW:
        // Yellow adds red and green
        r = Math.min(1, r + normalizedValue * EXTENDED_COLOR_RATIOS.YELLOW.RED_COMPONENT);
        g = Math.min(1, g + normalizedValue * EXTENDED_COLOR_RATIOS.YELLOW.GREEN_COMPONENT);
        break;

      case ChannelType.LIME:
        // Lime adds red (at 50%) and green (at 100%)
        r = Math.min(1, r + normalizedValue * EXTENDED_COLOR_RATIOS.LIME.RED_COMPONENT);
        g = Math.min(1, g + normalizedValue * EXTENDED_COLOR_RATIOS.LIME.GREEN_COMPONENT);
        break;

      case ChannelType.INDIGO:
        // Indigo adds red (at 29%) and blue (at 51%)
        r = Math.min(1, r + normalizedValue * EXTENDED_COLOR_RATIOS.INDIGO.RED_COMPONENT);
        b = Math.min(1, b + normalizedValue * EXTENDED_COLOR_RATIOS.INDIGO.BLUE_COMPONENT);
        break;

      case ChannelType.COLD_WHITE:
        // Cold White adds all RGB at ~6500K color temperature
        r = Math.min(1, r + normalizedValue * EXTENDED_COLOR_RATIOS.COLD_WHITE.RED_COMPONENT);
        g = Math.min(1, g + normalizedValue * EXTENDED_COLOR_RATIOS.COLD_WHITE.GREEN_COMPONENT);
        b = Math.min(1, b + normalizedValue * EXTENDED_COLOR_RATIOS.COLD_WHITE.BLUE_COMPONENT);
        break;

      case ChannelType.WARM_WHITE:
        // Warm White adds all RGB at ~3000K color temperature
        r = Math.min(1, r + normalizedValue * EXTENDED_COLOR_RATIOS.WARM_WHITE.RED_COMPONENT);
        g = Math.min(1, g + normalizedValue * EXTENDED_COLOR_RATIOS.WARM_WHITE.GREEN_COMPONENT);
        b = Math.min(1, b + normalizedValue * EXTENDED_COLOR_RATIOS.WARM_WHITE.BLUE_COMPONENT);
        break;
    }
  });

  // Return UNSCALED RGB + separate intensity
  // Callers should multiply by intensity if they need display color
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    intensity,
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
 * Create optimized channel mappings based on fixture capabilities.
 *
 * This function determines which color mapping algorithm to use based on
 * the fixture's available channels:
 * - Intelligent mapping: For fixtures with extended channels (Cyan, Magenta, Yellow, Lime, Indigo, Warm/Cold White)
 * - Advanced mapping: For traditional RGBWAU fixtures
 * - Basic mapping: For simple RGB fixtures
 *
 * @param targetColor RGB color to map
 * @param channels Available fixture channels
 * @param intensity Optional intensity value (0-1) for intelligent mapping
 * @returns Channel ID to DMX value mapping
 */
export function createOptimizedColorMapping(
  targetColor: RGBColor,
  channels: InstanceChannelWithValue[],
  intensity?: number
): Record<string, number> {
  // Check if fixture has any extended color channels
  const colorChannelTypes = channels
    .filter(channel => (COLOR_CHANNEL_TYPES as readonly ChannelType[]).includes(channel.type))
    .map(channel => channel.type);

  const hasExtendedChannels = colorChannelTypes.some(type =>
    type === ChannelType.CYAN ||
    type === ChannelType.MAGENTA ||
    type === ChannelType.YELLOW ||
    type === ChannelType.LIME ||
    type === ChannelType.INDIGO ||
    type === ChannelType.COLD_WHITE ||
    type === ChannelType.WARM_WHITE
  );

  let channelMapping: Record<string, number>;

  // Use intelligent mapping for fixtures with extended channels
  if (hasExtendedChannels) {
    channelMapping = rgbToChannelValuesIntelligent(targetColor, channels, intensity);
  } else {
    // Fallback to existing algorithm for traditional fixtures
    const fixtureType = getFixtureColorType(channels);

    // For advanced fixtures, use more sophisticated color mixing
    if (fixtureType === 'RGBWAU' || fixtureType === 'RGBWA') {
      channelMapping = rgbToChannelValuesAdvanced(targetColor, channels);
    } else {
      // For standard fixtures, use basic mapping
      // Pass false for preserveIntensity since we handle intensity separately now
      channelMapping = rgbToChannelValues(targetColor, channels, false);
    }

    // Check if fixture has a dedicated INTENSITY channel
    const hasIntensityChannel = channels.some(ch => ch.type === ChannelType.INTENSITY);

    // Only scale color channels by intensity if there's NO dedicated INTENSITY channel
    // (For fixtures WITH INTENSITY channel, the channel itself controls brightness)
    if (intensity !== undefined && intensity !== 1.0 && !hasIntensityChannel) {
      const scaledMapping: Record<string, number> = {};
      for (const [channelId, value] of Object.entries(channelMapping)) {
        scaledMapping[channelId] = Math.round(value * intensity);
      }
      channelMapping = scaledMapping;
    }
  }

  // If fixture has an INTENSITY channel and intensity value is provided, set it directly
  const intensityChannel = channels.find(ch => ch.type === ChannelType.INTENSITY);
  if (intensityChannel && intensity !== undefined) {
    channelMapping[intensityChannel.id] = Math.round(intensity * 255);
  }

  return channelMapping;
}

/**
 * Maps an RGB color to fixture channel values for advanced fixtures supporting White, Amber, and UV channels.
 *
 * This function implements an advanced color mapping strategy:
 * - Normalizes the input RGB color to [0,1] range.
 * - Extracts the white component as the minimum of R, G, and B, preserving color saturation.
 * - Subtracts the white component from RGB to obtain pure color values.
 * - Extracts the amber component from the minimum of the pure red and green channels (yellow content).
 * - Calculates the final RGB values after removing white and amber.
 * - Maps each channel type (RED, GREEN, BLUE, WHITE, AMBER, UV) to its corresponding value.
 * - For UV, activates the channel based on the blue content and specific thresholds.
 *
 * This mapping is intended for fixtures with advanced color mixing capabilities (e.g., RGBWA or RGBWAU),
 * where additional channels allow for more accurate color reproduction and special effects.
 *
 * @param targetColor The target color as an RGBColor object (r, g, b in [0,255]).
 * @param channels Array of fixture channels (with type and id) to map the color to.
 * @returns An object mapping channel IDs to their computed DMX values (0–255).
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
        // UV activation requires:
        // 1. Original blue content (b) must exceed threshold - ensures color has blue component
        // 2. Final red/green (after extraction) must be low - ensures color is truly blue/purple
        // This two-stage check prevents UV from being incorrectly disabled when blue
        // contributes to white channel extraction.
        const blueContentSufficient = b > UV_ACTIVATION_THRESHOLDS.BLUE_BASELINE;
        const colorIsBlueDominant = finalR < UV_ACTIVATION_THRESHOLDS.MAX_RED && 
                                   finalG < UV_ACTIVATION_THRESHOLDS.MAX_GREEN;
        
        if (blueContentSufficient && colorIsBlueDominant) {
          // Use finalB for intensity calculation to avoid double-counting extracted components
          value = Math.max(0, finalB * UV_ACTIVATION_THRESHOLDS.ADVANCED_INTENSITY);
        }
        break;
    }

    channelValues[channel.id] = Math.round(Math.max(0, Math.min(1, value)) * 255);
  });

  return channelValues;
}