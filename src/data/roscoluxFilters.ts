/**
 * Roscolux theatrical gel filter database
 * 
 * This data represents actual Roscolux color filters used in professional
 * theatrical and architectural lighting. Each entry contains:
 * - filter: Official Roscolux filter name and number
 * - applications: Common uses and lighting applications
 * - keywords: Searchable terms for easy filtering
 * - rgbHex: Approximated RGB color value in hexadecimal
 * - rgbDecimal: RGB values in decimal format (0-255)
 * 
 * Source: Based on Roscolux color filter specifications
 * Note: RGB values are approximations for display purposes and may not
 * exactly match the spectral characteristics of physical filters
 */

export interface RoscoluxFilter {
  filter: string;
  applications: string;
  keywords: string;
  rgbHex: string;
  rgbDecimal: string;
}

export const ROSCOLUX_FILTERS: RoscoluxFilter[] = [
  {
    filter: "R00 Clear",
    applications: "No color correction, maximum light transmission",
    keywords: "clear, colorless, neutral, transmission",
    rgbHex: "#FFFFFF",
    rgbDecimal: "255,255,255"
  },
  {
    filter: "R01 Light Bastard Amber",
    applications: "Warm sunlight, candlelight, subtle warmth",
    keywords: "warm, amber, sunlight, candle, subtle",
    rgbHex: "#FFF8E7",
    rgbDecimal: "255,248,231"
  },
  {
    filter: "R02 Bastard Amber",
    applications: "Indoor lighting, warm atmosphere",
    keywords: "amber, warm, indoor, atmosphere",
    rgbHex: "#FFF2D6",
    rgbDecimal: "255,242,214"
  },
  {
    filter: "R03 Dark Bastard Amber",
    applications: "Evening light, warm interiors",
    keywords: "dark, amber, evening, interior, warm",
    rgbHex: "#FFEBC5",
    rgbDecimal: "255,235,197"
  },
  {
    filter: "R04 Medium Bastard Amber",
    applications: "General warm wash, incandescent simulation",
    keywords: "medium, amber, wash, incandescent",
    rgbHex: "#FFEDB4",
    rgbDecimal: "255,237,180"
  },
  {
    filter: "R05 Rose Tint",
    applications: "Flattering skin tones, romantic atmosphere",
    keywords: "rose, pink, skin, romantic, flattering",
    rgbHex: "#FFE6E6",
    rgbDecimal: "255,230,230"
  },
  {
    filter: "R06 No Color Straw",
    applications: "Slight warm correction without color shift",
    keywords: "straw, neutral, correction, warm",
    rgbHex: "#FFF7E1",
    rgbDecimal: "255,247,225"
  },
  {
    filter: "R07 Pale Yellow",
    applications: "Sunlight, morning light, cheerful atmosphere",
    keywords: "pale, yellow, sunlight, morning, cheerful",
    rgbHex: "#FFFACD",
    rgbDecimal: "255,250,205"
  },
  {
    filter: "R08 Pale Gold",
    applications: "Warm daylight, golden hour",
    keywords: "pale, gold, daylight, golden, hour",
    rgbHex: "#FFF8DC",
    rgbDecimal: "255,248,220"
  },
  {
    filter: "R09 Light Amber",
    applications: "Warm wash, interior lighting",
    keywords: "light, amber, wash, interior",
    rgbHex: "#FFEBCD",
    rgbDecimal: "255,235,205"
  },
  {
    filter: "R10 Medium Yellow",
    applications: "Bright sunlight, energetic atmosphere",
    keywords: "medium, yellow, bright, sunlight, energetic",
    rgbHex: "#FFFF99",
    rgbDecimal: "255,255,153"
  },
  {
    filter: "R11 Light Straw",
    applications: "Natural daylight correction",
    keywords: "light, straw, natural, daylight, correction",
    rgbHex: "#FFFADC",
    rgbDecimal: "255,250,220"
  },
  {
    filter: "R12 Straw",
    applications: "Warm sunlight, hay barn atmosphere",
    keywords: "straw, warm, sunlight, barn, hay",
    rgbHex: "#FFF8B4",
    rgbDecimal: "255,248,180"
  },
  {
    filter: "R13 Straw Tint",
    applications: "Subtle warm correction",
    keywords: "straw, tint, subtle, warm, correction",
    rgbHex: "#FFFAE6",
    rgbDecimal: "255,250,230"
  },
  {
    filter: "R14 Medium Straw",
    applications: "Warm general wash",
    keywords: "medium, straw, warm, general, wash",
    rgbHex: "#FFF5B4",
    rgbDecimal: "255,245,180"
  },
  {
    filter: "R15 Deep Straw",
    applications: "Strong warm wash, sunset effects",
    keywords: "deep, straw, strong, warm, sunset",
    rgbHex: "#FFF080",
    rgbDecimal: "255,240,128"
  },
  {
    filter: "R16 Light Amber",
    applications: "Warm atmosphere, cozy interiors",
    keywords: "light, amber, warm, atmosphere, cozy",
    rgbHex: "#FFE8B4",
    rgbDecimal: "255,232,180"
  },
  {
    filter: "R17 Light Flame",
    applications: "Firelight, warm romantic atmosphere",
    keywords: "light, flame, fire, romantic, warm",
    rgbHex: "#FFD700",
    rgbDecimal: "255,215,0"
  },
  {
    filter: "R18 Flame",
    applications: "Campfire, hearth, dramatic warm light",
    keywords: "flame, campfire, hearth, dramatic, warm",
    rgbHex: "#FFC500",
    rgbDecimal: "255,197,0"
  },
  {
    filter: "R19 Fire",
    applications: "Intense fire effects, dramatic lighting",
    keywords: "fire, intense, dramatic, effects",
    rgbHex: "#FFB000",
    rgbDecimal: "255,176,0"
  },
  {
    filter: "R20 Medium Amber",
    applications: "General warm wash, sunset simulation",
    keywords: "medium, amber, warm, wash, sunset",
    rgbHex: "#FFCC66",
    rgbDecimal: "255,204,102"
  },
  {
    filter: "R21 Golden Amber",
    applications: "Rich warm light, autumn scenes",
    keywords: "golden, amber, rich, warm, autumn",
    rgbHex: "#FFB84D",
    rgbDecimal: "255,184,77"
  },
  {
    filter: "R22 Deep Amber",
    applications: "Strong warm wash, dramatic sunsets",
    keywords: "deep, amber, strong, warm, dramatic",
    rgbHex: "#FFA500",
    rgbDecimal: "255,165,0"
  },
  {
    filter: "R23 Orange",
    applications: "Sunset, fire effects, autumn colors",
    keywords: "orange, sunset, fire, autumn, colors",
    rgbHex: "#FF8C00",
    rgbDecimal: "255,140,0"
  },
  {
    filter: "R24 Scarlet",
    applications: "Dramatic red light, danger, passion",
    keywords: "scarlet, red, dramatic, danger, passion",
    rgbHex: "#FF2400",
    rgbDecimal: "255,36,0"
  },
  {
    filter: "R25 Red",
    applications: "Pure red light, stop signals, dramatic effects",
    keywords: "red, pure, stop, signals, dramatic",
    rgbHex: "#FF0000",
    rgbDecimal: "255,0,0"
  },
  {
    filter: "R26 Bright Red",
    applications: "Vibrant red wash, alert lighting",
    keywords: "bright, red, vibrant, wash, alert",
    rgbHex: "#FF1493",
    rgbDecimal: "255,20,147"
  },
  {
    filter: "R27 Medium Red",
    applications: "General red wash, romantic lighting",
    keywords: "medium, red, general, wash, romantic",
    rgbHex: "#DC143C",
    rgbDecimal: "220,20,60"
  },
  {
    filter: "R28 Deep Red",
    applications: "Dark red atmosphere, wine cellars",
    keywords: "deep, red, dark, atmosphere, wine",
    rgbHex: "#8B0000",
    rgbDecimal: "139,0,0"
  },
  {
    filter: "R29 Plasa Red",
    applications: "Standard red for color mixing",
    keywords: "plasa, red, standard, color, mixing",
    rgbHex: "#FF0040",
    rgbDecimal: "255,0,64"
  },
  {
    filter: "R30 Light Pink",
    applications: "Soft romantic lighting, skin flattering",
    keywords: "light, pink, soft, romantic, skin",
    rgbHex: "#FFB6C1",
    rgbDecimal: "255,182,193"
  },
  {
    filter: "R31 Pink",
    applications: "General pink wash, feminine atmosphere",
    keywords: "pink, general, wash, feminine, atmosphere",
    rgbHex: "#FFC0CB",
    rgbDecimal: "255,192,203"
  },
  {
    filter: "R32 Medium Pink",
    applications: "Stronger pink effects, stage lighting",
    keywords: "medium, pink, strong, effects, stage",
    rgbHex: "#FF69B4",
    rgbDecimal: "255,105,180"
  },
  {
    filter: "R33 No Color Pink",
    applications: "Subtle pink tint, flattering light",
    keywords: "no, color, pink, subtle, tint, flattering",
    rgbHex: "#FFDDDD",
    rgbDecimal: "255,221,221"
  },
  {
    filter: "R34 Flesh Pink",
    applications: "Natural skin tones, portrait lighting",
    keywords: "flesh, pink, natural, skin, portrait",
    rgbHex: "#FFCCCB",
    rgbDecimal: "255,204,203"
  },
  {
    filter: "R35 Light Pink",
    applications: "Delicate pink wash, subtle effects",
    keywords: "light, pink, delicate, wash, subtle",
    rgbHex: "#FFE4E1",
    rgbDecimal: "255,228,225"
  },
  {
    filter: "R36 Medium Pink",
    applications: "Standard pink for theatrical use",
    keywords: "medium, pink, standard, theatrical, use",
    rgbHex: "#FFB6C1",
    rgbDecimal: "255,182,193"
  },
  {
    filter: "R37 Pale Rose",
    applications: "Gentle rose tint, romantic scenes",
    keywords: "pale, rose, gentle, tint, romantic",
    rgbHex: "#FFEEE6",
    rgbDecimal: "255,238,230"
  },
  {
    filter: "R38 Light Rose",
    applications: "Soft rose lighting, elegant atmosphere",
    keywords: "light, rose, soft, elegant, atmosphere",
    rgbHex: "#FFE4E6",
    rgbDecimal: "255,228,230"
  },
  {
    filter: "R39 Skelton Exotic Sangria",
    applications: "Deep rose, wine bar atmosphere",
    keywords: "skelton, exotic, sangria, deep, rose, wine",
    rgbHex: "#B22222",
    rgbDecimal: "178,34,34"
  },
  {
    filter: "R40 Light Salmon",
    applications: "Warm skin tones, sunset effects",
    keywords: "light, salmon, warm, skin, sunset",
    rgbHex: "#FFA07A",
    rgbDecimal: "255,160,122"
  },
  {
    filter: "R41 Salmon",
    applications: "General salmon wash, warm atmosphere",
    keywords: "salmon, general, wash, warm, atmosphere",
    rgbHex: "#FA8072",
    rgbDecimal: "250,128,114"
  },
  {
    filter: "R42 Deep Salmon",
    applications: "Rich salmon effects, restaurant lighting",
    keywords: "deep, salmon, rich, effects, restaurant",
    rgbHex: "#E9967A",
    rgbDecimal: "233,150,122"
  },
  {
    filter: "R43 Deep Pink",
    applications: "Vibrant pink wash, club lighting",
    keywords: "deep, pink, vibrant, wash, club",
    rgbHex: "#FF1493",
    rgbDecimal: "255,20,147"
  },
  {
    filter: "R44 Middle Rose",
    applications: "Balanced rose lighting, general use",
    keywords: "middle, rose, balanced, general, use",
    rgbHex: "#F0A0A0",
    rgbDecimal: "240,160,160"
  },
  {
    filter: "R45 Rose",
    applications: "Classic rose wash, romantic settings",
    keywords: "rose, classic, wash, romantic, settings",
    rgbHex: "#FFE4E1",
    rgbDecimal: "255,228,225"
  },
  {
    filter: "R46 Magenta",
    applications: "Pure magenta, color mixing, dramatic effects",
    keywords: "magenta, pure, color, mixing, dramatic",
    rgbHex: "#FF00FF",
    rgbDecimal: "255,0,255"
  },
  {
    filter: "R47 Light Rose",
    applications: "Delicate rose tint, subtle effects",
    keywords: "light, rose, delicate, tint, subtle",
    rgbHex: "#FFCCCB",
    rgbDecimal: "255,204,203"
  },
  {
    filter: "R48 Rose Purple",
    applications: "Purple-tinted rose, mystical atmosphere",
    keywords: "rose, purple, mystical, atmosphere, tinted",
    rgbHex: "#DA70D6",
    rgbDecimal: "218,112,214"
  },
  {
    filter: "R49 Medium Purple",
    applications: "General purple wash, theatrical effects",
    keywords: "medium, purple, general, wash, theatrical",
    rgbHex: "#9370DB",
    rgbDecimal: "147,112,219"
  },
  {
    filter: "R50 Mauve",
    applications: "Soft purple, elegant lighting",
    keywords: "mauve, soft, purple, elegant, lighting",
    rgbHex: "#E0B4D6",
    rgbDecimal: "224,180,214"
  },
  {
    filter: "R51 Surprise Pink",
    applications: "Bright pink effects, party lighting",
    keywords: "surprise, pink, bright, effects, party",
    rgbHex: "#FF69B4",
    rgbDecimal: "255,105,180"
  },
  {
    filter: "R52 Light Lavender",
    applications: "Gentle lavender wash, calming atmosphere",
    keywords: "light, lavender, gentle, wash, calming",
    rgbHex: "#E6E6FF",
    rgbDecimal: "230,230,255"
  },
  {
    filter: "R53 Pale Lavender",
    applications: "Subtle lavender tint, spa lighting",
    keywords: "pale, lavender, subtle, tint, spa",
    rgbHex: "#F0F0FF",
    rgbDecimal: "240,240,255"
  },
  {
    filter: "R54 Special Lavender",
    applications: "Enhanced lavender effects, dreamlike scenes",
    keywords: "special, lavender, enhanced, effects, dreamlike",
    rgbHex: "#DDA0DD",
    rgbDecimal: "221,160,221"
  },
  {
    filter: "R55 Lilac",
    applications: "Lilac wash, spring atmosphere",
    keywords: "lilac, wash, spring, atmosphere",
    rgbHex: "#C8A2C8",
    rgbDecimal: "200,162,200"
  },
  {
    filter: "R56 Gypsy Lavender",
    applications: "Deep lavender, mystical effects",
    keywords: "gypsy, lavender, deep, mystical, effects",
    rgbHex: "#B19CD9",
    rgbDecimal: "177,156,217"
  },
  {
    filter: "R57 Lavender",
    applications: "Standard lavender wash, relaxing atmosphere",
    keywords: "lavender, standard, wash, relaxing, atmosphere",
    rgbHex: "#DDA0DD",
    rgbDecimal: "221,160,221"
  },
  {
    filter: "R58 Deep Lavender",
    applications: "Rich lavender effects, evening scenes",
    keywords: "deep, lavender, rich, effects, evening",
    rgbHex: "#9370DB",
    rgbDecimal: "147,112,219"
  },
  {
    filter: "R59 Indigo",
    applications: "Deep blue-purple, night sky effects",
    keywords: "indigo, deep, blue, purple, night, sky",
    rgbHex: "#4B0082",
    rgbDecimal: "75,0,130"
  },
  {
    filter: "R60 No Color Blue",
    applications: "Subtle blue correction, daylight simulation",
    keywords: "no, color, blue, subtle, correction, daylight",
    rgbHex: "#F0F8FF",
    rgbDecimal: "240,248,255"
  },
  {
    filter: "R61 Mist Blue",
    applications: "Soft blue wash, misty atmosphere",
    keywords: "mist, blue, soft, wash, misty, atmosphere",
    rgbHex: "#E6F3FF",
    rgbDecimal: "230,243,255"
  },
  {
    filter: "R62 Booster Blue",
    applications: "Enhancing blue effects, moonlight",
    keywords: "booster, blue, enhancing, effects, moonlight",
    rgbHex: "#B0E0E6",
    rgbDecimal: "176,224,230"
  },
  {
    filter: "R63 Pale Blue",
    applications: "Gentle blue wash, sky effects",
    keywords: "pale, blue, gentle, wash, sky, effects",
    rgbHex: "#AFEEEE",
    rgbDecimal: "175,238,238"
  },
  {
    filter: "R64 Light Steel Blue",
    applications: "Cool blue wash, industrial atmosphere",
    keywords: "light, steel, blue, cool, wash, industrial",
    rgbHex: "#B0C4DE",
    rgbDecimal: "176,196,222"
  },
  {
    filter: "R65 Daylight Blue",
    applications: "Cool daylight correction, office lighting",
    keywords: "daylight, blue, cool, correction, office",
    rgbHex: "#87CEEB",
    rgbDecimal: "135,206,235"
  },
  {
    filter: "R66 Cool Blue",
    applications: "Cool atmosphere, winter scenes",
    keywords: "cool, blue, atmosphere, winter, scenes",
    rgbHex: "#6495ED",
    rgbDecimal: "100,149,237"
  },
  {
    filter: "R67 Light Sky Blue",
    applications: "Clear sky effects, bright blue wash",
    keywords: "light, sky, blue, clear, effects, bright",
    rgbHex: "#87CEFA",
    rgbDecimal: "135,206,250"
  },
  {
    filter: "R68 Sky Blue",
    applications: "Standard sky effects, outdoor scenes",
    keywords: "sky, blue, standard, effects, outdoor",
    rgbHex: "#87CEEB",
    rgbDecimal: "135,206,235"
  },
  {
    filter: "R69 Brilliant Blue",
    applications: "Vibrant blue wash, energetic atmosphere",
    keywords: "brilliant, blue, vibrant, wash, energetic",
    rgbHex: "#0080FF",
    rgbDecimal: "0,128,255"
  },
  {
    filter: "R70 Plasa Blue",
    applications: "Standard blue for color mixing",
    keywords: "plasa, blue, standard, color, mixing",
    rgbHex: "#0040FF",
    rgbDecimal: "0,64,255"
  },
  {
    filter: "R71 Sea Blue",
    applications: "Ocean effects, underwater scenes",
    keywords: "sea, blue, ocean, effects, underwater",
    rgbHex: "#006994",
    rgbDecimal: "0,105,148"
  },
  {
    filter: "R72 Azure Blue",
    applications: "Bright azure wash, tropical atmosphere",
    keywords: "azure, blue, bright, wash, tropical",
    rgbHex: "#007FFF",
    rgbDecimal: "0,127,255"
  },
  {
    filter: "R73 Deep Blue",
    applications: "Rich deep blue, night scenes",
    keywords: "deep, blue, rich, night, scenes",
    rgbHex: "#000080",
    rgbDecimal: "0,0,128"
  },
  {
    filter: "R74 Night Blue",
    applications: "Dark night atmosphere, mysterious effects",
    keywords: "night, blue, dark, atmosphere, mysterious",
    rgbHex: "#191970",
    rgbDecimal: "25,25,112"
  },
  {
    filter: "R75 Turquoise Blue",
    applications: "Tropical water, caribbean atmosphere",
    keywords: "turquoise, blue, tropical, water, caribbean",
    rgbHex: "#40E0D0",
    rgbDecimal: "64,224,208"
  },
  {
    filter: "R76 Light Green Blue",
    applications: "Cool green-blue wash, aquatic effects",
    keywords: "light, green, blue, cool, wash, aquatic",
    rgbHex: "#20B2AA",
    rgbDecimal: "32,178,170"
  },
  {
    filter: "R77 Green Blue",
    applications: "Teal effects, underwater lighting",
    keywords: "green, blue, teal, effects, underwater",
    rgbHex: "#008B8B",
    rgbDecimal: "0,139,139"
  },
  {
    filter: "R78 Trudy Blue",
    applications: "Special blue wash, custom effects",
    keywords: "trudy, blue, special, wash, custom",
    rgbHex: "#0066CC",
    rgbDecimal: "0,102,204"
  },
  {
    filter: "R79 Just Blue",
    applications: "Pure blue wash, general use",
    keywords: "just, blue, pure, wash, general",
    rgbHex: "#0000FF",
    rgbDecimal: "0,0,255"
  },
  {
    filter: "R80 Primary Blue",
    applications: "Color mixing, pure blue effects",
    keywords: "primary, blue, color, mixing, pure",
    rgbHex: "#0000FF",
    rgbDecimal: "0,0,255"
  },
  {
    filter: "R81 Urban Blue",
    applications: "Cool urban atmosphere, modern lighting",
    keywords: "urban, blue, cool, atmosphere, modern",
    rgbHex: "#4682B4",
    rgbDecimal: "70,130,180"
  },
  {
    filter: "R82 Surprise Blue",
    applications: "Bright surprise effects, party lighting",
    keywords: "surprise, blue, bright, effects, party",
    rgbHex: "#1E90FF",
    rgbDecimal: "30,144,255"
  },
  {
    filter: "R83 Medium Blue",
    applications: "General blue wash, standard effects",
    keywords: "medium, blue, general, wash, standard",
    rgbHex: "#0066CC",
    rgbDecimal: "0,102,204"
  },
  {
    filter: "R84 Zephyr Blue",
    applications: "Gentle blue breeze effects",
    keywords: "zephyr, blue, gentle, breeze, effects",
    rgbHex: "#87CEEB",
    rgbDecimal: "135,206,235"
  },
  {
    filter: "R85 Deeper Blue",
    applications: "Enhanced blue depth, dramatic scenes",
    keywords: "deeper, blue, enhanced, depth, dramatic",
    rgbHex: "#003366",
    rgbDecimal: "0,51,102"
  },
  {
    filter: "R86 Pea Green",
    applications: "Natural green wash, garden effects",
    keywords: "pea, green, natural, wash, garden",
    rgbHex: "#9ACD32",
    rgbDecimal: "154,205,50"
  },
  {
    filter: "R87 Pale Yellow Green",
    applications: "Spring green, fresh atmosphere",
    keywords: "pale, yellow, green, spring, fresh",
    rgbHex: "#ADFF2F",
    rgbDecimal: "173,255,47"
  },
  {
    filter: "R88 Lime Green",
    applications: "Vibrant lime effects, energetic lighting",
    keywords: "lime, green, vibrant, effects, energetic",
    rgbHex: "#32CD32",
    rgbDecimal: "50,205,50"
  },
  {
    filter: "R89 Moss Green",
    applications: "Forest effects, natural atmosphere",
    keywords: "moss, green, forest, effects, natural",
    rgbHex: "#228B22",
    rgbDecimal: "34,139,34"
  },
  {
    filter: "R90 Dark Yellow Green",
    applications: "Deep forest, mysterious green",
    keywords: "dark, yellow, green, deep, forest, mysterious",
    rgbHex: "#556B2F",
    rgbDecimal: "85,107,47"
  },
  {
    filter: "R91 Primary Green",
    applications: "Pure green for color mixing",
    keywords: "primary, green, pure, color, mixing",
    rgbHex: "#00FF00",
    rgbDecimal: "0,255,0"
  },
  {
    filter: "R92 Turquoise",
    applications: "Tropical effects, caribbean lighting",
    keywords: "turquoise, tropical, effects, caribbean",
    rgbHex: "#40E0D0",
    rgbDecimal: "64,224,208"
  },
  {
    filter: "R93 Blue Green",
    applications: "Aquatic effects, cool wash",
    keywords: "blue, green, aquatic, effects, cool",
    rgbHex: "#008080",
    rgbDecimal: "0,128,128"
  },
  {
    filter: "R94 Kelly Green",
    applications: "Irish green, St. Patrick's Day",
    keywords: "kelly, green, irish, patrick, day",
    rgbHex: "#4CBB17",
    rgbDecimal: "76,187,23"
  },
  {
    filter: "R95 Medium Blue Green",
    applications: "Balanced blue-green wash",
    keywords: "medium, blue, green, balanced, wash",
    rgbHex: "#20B2AA",
    rgbDecimal: "32,178,170"
  },
  {
    filter: "R96 Lime",
    applications: "Bright lime wash, citrus effects",
    keywords: "lime, bright, wash, citrus, effects",
    rgbHex: "#00FF00",
    rgbDecimal: "0,255,0"
  },
  {
    filter: "R97 Light Blue Green",
    applications: "Soft aqua wash, spa lighting",
    keywords: "light, blue, green, soft, aqua, spa",
    rgbHex: "#AFEEEE",
    rgbDecimal: "175,238,238"
  },
  {
    filter: "R98 Medium Blue Green",
    applications: "Standard blue-green for general use",
    keywords: "medium, blue, green, standard, general",
    rgbHex: "#48D1CC",
    rgbDecimal: "72,209,204"
  },
  {
    filter: "R99 Chocolate",
    applications: "Warm brown effects, autumn scenes",
    keywords: "chocolate, brown, warm, effects, autumn",
    rgbHex: "#D2691E",
    rgbDecimal: "210,105,30"
  }
];