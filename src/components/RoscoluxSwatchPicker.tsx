import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface RoscoluxFilter {
  filter: string;
  applications: string;
  keywords: string;
  rgbHex: string;
  rgbDecimal: string;
}

interface RoscoluxSwatchPickerProps {
  currentColor: { r: number; g: number; b: number };
  onColorSelect: (color: { r: number; g: number; b: number }) => void;
}

interface TooltipProps {
  filter: RoscoluxFilter;
  targetElement: HTMLElement | null;
  isVisible: boolean;
}

function Tooltip({ filter, targetElement, isVisible }: TooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0, placement: 'top' as 'top' | 'bottom' | 'left' | 'right' });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !targetElement || !tooltipRef.current) return;

    const calculatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const spacing = 8;
      let x = 0;
      let y = 0;
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

      // Try top first
      if (targetRect.top - tooltipRect.height - spacing > 0) {
        placement = 'top';
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + scrollLeft;
        y = targetRect.top - tooltipRect.height - spacing + scrollTop;
      }
      // Try bottom
      else if (targetRect.bottom + tooltipRect.height + spacing < viewportHeight) {
        placement = 'bottom';
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + scrollLeft;
        y = targetRect.bottom + spacing + scrollTop;
      }
      // Try right
      else if (targetRect.right + tooltipRect.width + spacing < viewportWidth) {
        placement = 'right';
        x = targetRect.right + spacing + scrollLeft;
        y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2) + scrollTop;
      }
      // Try left
      else if (targetRect.left - tooltipRect.width - spacing > 0) {
        placement = 'left';
        x = targetRect.left - tooltipRect.width - spacing + scrollLeft;
        y = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2) + scrollTop;
      }
      // Default to bottom if no space anywhere
      else {
        placement = 'bottom';
        x = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + scrollLeft;
        y = targetRect.bottom + spacing + scrollTop;
      }

      // Keep tooltip within viewport horizontally
      if (x < spacing) x = spacing;
      if (x + tooltipRect.width > viewportWidth - spacing) {
        x = viewportWidth - tooltipRect.width - spacing;
      }

      setPosition({ x, y, placement });
    };

    calculatePosition();
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, targetElement]);

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className={`fixed z-[100] bg-gray-900 text-white text-sm rounded-lg p-3 w-64 shadow-lg pointer-events-none transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="font-semibold mb-1">{filter.filter}</div>
      <div className="text-xs mb-1 text-gray-300">{filter.applications}</div>
      <div className="text-xs font-mono text-gray-400">RGB: {filter.rgbHex.toUpperCase()}</div>
      {filter.keywords && (
        <div className="text-xs mt-1 text-gray-400">Keywords: {filter.keywords}</div>
      )}
    </div>,
    document.body
  );
}

export default function RoscoluxSwatchPicker({
  currentColor,
  onColorSelect
}: RoscoluxSwatchPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredFilter, setHoveredFilter] = useState<RoscoluxFilter | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Parse the Roscolux CSV data
  const roscoluxFilters: RoscoluxFilter[] = useMemo(() => {
    const csvData = `Roscolux Filter,Applications,Keywords,RGB Hex,RGB Decimal
R01 Light Bastard Amber,Enhances fair skin tones. Suggests strong sunlight.,"fair skin, sunlight, warm wash",#fbb39a,"251,179,154"
R02 Bastard Amber,Good where a tint of color is needed. Excellent for natural skin tones.,"natural skin, subtle tint, warm wash",#ffd1ac,"255,209,172"
R302 Pale Bastard Amber,Very pale warm white. Perfect for enhancing the HPL lamp in a Source Four™.,"warm white, HPL enhancement, subtle warmth",#ffeede,"255,238,222"
R03 Dark Bastard Amber,Most saturated Bastard Amber.,"saturated amber, warm toning",#fe9e6f,"254,158,111"
R303 Warm Peach,Strong amber with undertones of pink. Useful for warm sunrise and sunsets.,"sunrise, sunset, warm lighting",#feb694,"254,182,148"
R04 Medium Bastard Amber,Excellent for natural sunlight.,"natural sunlight, daytime, warm crosslight",#ffb884,"255,184,132"
R304 Pale Apricot,A peach amber. More yellow than 305.,"peach amber, warm glow",#ffd1a8,"255,209,168"
R05 Rose Tint,"A clean pale pink; useful as a ""blush"" for skin tones.","blush, skin enhancement, soft pink",#ffd4d0,"255,212,208"
R305 Rose Gold,A pale blush amber for skin tones and backlight.,"blush amber, skin enhancement, backlight",#ffdacc,"255,218,204"
R3410 RoscoSun 1/8 CTO,Converts 5500°K to 4900°K.,"color temperature correction, subtle warming",#fff0dc,"255,240,220"
R3409 RoscoSun 1/4 CTO,Converts 5500°K to 4500°K.,"color temperature correction, moderate warming",#ffe6ce,"255,230,206"
R3408 RoscoSun 1/2 CTO,Converts 5500°K to 3800°K.,"color temperature correction, significant warming",#ffd1a0,"255,209,160"
R3411 RoscoSun 3/4 CTO,Converts 5500ºK to 3200ºK. Nice strong amber. Less pink than R04.,"color temperature correction, strong warming",#ffbf85,"255,191,133"
R3407 Full CTO,Converts 5500° K to 2900º K. Dominant amber.,"color temperature correction, tungsten simulation",#ffab62,"255,171,98"
R06 No Color Straw,Slightly off white. Good for interiors.,"interior lighting, subtle warmth",#fcfadb,"252,250,219"
R07 Pale Yellow,Double saturation of 06.,"pale yellow, interior accent",#fdfad1,"253,250,209"
R08 Pale Gold,Warmer straw. Flattering to skin tones.,"warm straw, skin enhancement",#fff6c3,"255,246,195"
R09 Pale Amber Gold,Deep straw. Good for late afternoon sunsets or firelight.,"late afternoon, sunset, firelight",#ffea9a,"255,234,154"
R10 Medium Yellow,Good daylight color.,"daylight, yellow wash",#ffe066,"255,224,102"
R11 Light Straw,Subtle yellow tint.,"subtle yellow, soft wash",#fff899,"255,248,153"
R12 Straw,Standard straw color.,"standard straw, warm light",#fff566,"255,245,102"
R13 Straw Tint,Very pale straw.,"pale straw, gentle warmth",#fffacc,"255,250,204"
R14 Medium Straw,Warmer than 12.,"medium straw, warm accent",#fff333,"255,243,51"
R15 Deep Straw,Strong straw color.,"deep straw, bold yellow",#ffed00,"255,237,0"
R16 Light Amber,Light amber tint.,"light amber, warm glow",#ffcc66,"255,204,102"
R17 Light Rose,Delicate pink tint.,"delicate pink, romantic lighting",#ffccdd,"255,204,221"
R18 Flame,Red-orange flame color.,"flame effect, warm red",#ff6633,"255,102,51"
R19 Fire,Intense red-orange.,"fire effect, dramatic red",#ff4400,"255,68,0"
R20 Medium Amber,Standard medium amber.,"medium amber, warm tone",#ffaa33,"255,170,51"
R21 Golden Amber,Rich golden amber.,"golden amber, luxury lighting",#ff9900,"255,153,0"
R22 Deep Amber,Deep saturated amber.,"deep amber, dramatic warmth",#ff7700,"255,119,0"
R23 Orange,Pure orange color.,"orange wash, vibrant accent",#ff6600,"255,102,0"
R24 Scarlet,Bright red-orange.,"scarlet, bold accent",#ff3300,"255,51,0"
R25 Red,Primary red.,"primary red, dramatic effect",#ff0000,"255,0,0"
R26 Bright Red,Vivid red.,"bright red, high impact",#ff1a1a,"255,26,26"
R27 Medium Red,Standard red.,"medium red, classic color",#cc0000,"204,0,0"
R28 Dark Red,Deep red tone.,"dark red, moody lighting",#990000,"153,0,0"
R32 Medium Pink,Standard pink.,"medium pink, soft accent",#ff99cc,"255,153,204"
R33 No Color Pink,Very pale pink.,"pale pink, subtle tint",#ffe6f0,"255,230,240"
R34 Flesh Pink,Natural flesh tone.,"flesh tone, skin enhancement",#ffccbb,"255,204,187"
R35 Light Pink,Delicate pink.,"light pink, gentle color",#ffb3d9,"255,179,217"
R36 Medium Pink,Stronger pink.,"medium pink, noticeable accent",#ff80bf,"255,128,191"
R37 Pale Rose Pink,Soft rose pink.,"pale rose, romantic mood",#ffc6d9,"255,198,217"
R38 Light Rose,Light rose color.,"light rose, elegant tone",#ff99b3,"255,153,179"
R39 Skelton Exotic Sangria,Deep rose-red.,"exotic sangria, dramatic rose",#cc3366,"204,51,102"
R40 Light Salmon,Salmon pink.,"salmon pink, warm flesh tone",#ff9980,"255,153,128"
R41 Salmon Pink,Standard salmon.,"salmon, natural skin tone",#ff8066,"255,128,102"
R42 Deep Salmon,Rich salmon color.,"deep salmon, warm accent",#ff6640,"255,102,64"
R43 Deep Pink,Saturated pink.,"deep pink, vibrant accent",#ff4080,"255,64,128"
R44 Middle Rose,Medium rose color.,"middle rose, balanced pink",#ff6699,"255,102,153"
R45 Rose,Classic rose color.,"rose, romantic lighting",#ff3377,"255,51,119"
R46 Magenta,Pure magenta.,"magenta, bold color",#ff00aa,"255,0,170"
R47 Light Rose Purple,Purple-tinted rose.,"light rose purple, mystical tone",#cc6699,"204,102,153"
R48 Rose Purple,Standard rose purple.,"rose purple, dramatic accent",#aa4477,"170,68,119"
R49 Medium Purple,Mid-tone purple.,"medium purple, royal color",#8844aa,"136,68,170"
R50 Mauve,Light purple-pink.,"mauve, sophisticated tone",#cc99bb,"204,153,187"
R51 Surprise Pink,Vibrant pink.,"surprise pink, energetic color",#ff6699,"255,102,153"
R52 Light Lavender,Pale lavender.,"light lavender, calming tone",#ccaadd,"204,170,221"
R53 Pale Lavender,Very light lavender.,"pale lavender, subtle purple",#ddccee,"221,204,238"
R54 Special Lavender,Enhanced lavender.,"special lavender, elegant purple",#bb99dd,"187,153,221"
R55 Lilac,Light purple.,"lilac, soft purple",#cc99ff,"204,153,255"
R56 Gypsy Lavender,Deep lavender.,"gypsy lavender, mystical purple",#9966cc,"153,102,204"
R57 Lavender,Standard lavender.,"lavender, classic purple",#aa77cc,"170,119,204"
R58 Deep Lavender,Rich lavender.,"deep lavender, saturated purple",#8855bb,"136,85,187"
R59 Indigo,Deep blue-purple.,"indigo, night sky color",#4433aa,"68,51,170"
R60 No Color Blue,Very pale blue.,"pale blue, subtle tint",#e6f3ff,"230,243,255"
R61 Mist Blue,Light misty blue.,"mist blue, atmospheric tone",#ccddff,"204,221,255"
R62 Booster Blue,Enhanced blue.,"booster blue, vibrant accent",#66aaff,"102,170,255"
R63 Pale Blue,Light blue tone.,"pale blue, sky color",#99ccff,"153,204,255"
R64 Light Steel Blue,Metallic blue.,"steel blue, industrial tone",#7799bb,"119,153,187"
R65 Daylight Blue,Natural daylight blue.,"daylight blue, sky simulation",#4488cc,"68,136,204"
R66 Cool Blue,Standard cool blue.,"cool blue, refreshing tone",#3377bb,"51,119,187"
R67 Light Sky Blue,Bright sky blue.,"light sky blue, cheerful tone",#55aaff,"85,170,255"
R68 Sky Blue,Standard sky blue.,"sky blue, natural daylight",#2299ff,"34,153,255"
R69 Brilliant Blue,Vivid blue.,"brilliant blue, high impact",#0077ff,"0,119,255"
R70 Sea Blue,Ocean blue tone.,"sea blue, aquatic mood",#0088cc,"0,136,204"
R71 Sea Blue,Another sea blue.,"sea blue variant, water effect",#006699,"0,102,153"
R72 Azure Blue,Clear azure.,"azure blue, pristine tone",#0099cc,"0,153,204"
R73 Peacock Blue,Rich blue-green.,"peacock blue, exotic tone",#0066aa,"0,102,170"
R74 Night Blue,Dark blue.,"night blue, evening mood",#003366,"0,51,102"
R75 Cerulean Blue,Bright cerulean.,"cerulean blue, vivid sky",#0099ff,"0,153,255"
R76 Light Green Blue,Blue-green mix.,"light green blue, aqua tone",#66cccc,"102,204,204"
R77 Green Blue,Standard green-blue.,"green blue, oceanic color",#00aaaa,"0,170,170"
R78 Trudy Blue,Specific blue tone.,"trudy blue, unique shade",#3399cc,"51,153,204"
R79 Bright Blue,Intense blue.,"bright blue, electric tone",#0066ff,"0,102,255"
R80 Primary Blue,Pure blue.,"primary blue, fundamental color",#0033ff,"0,51,255"
R81 Urban Blue,Modern blue tone.,"urban blue, contemporary feel",#336699,"51,102,153"
R82 Surprise Blue,Vibrant blue.,"surprise blue, energetic color",#0088ff,"0,136,255"
R83 Medium Blue,Standard medium blue.,"medium blue, balanced tone",#0055cc,"0,85,204"
R84 Zephyr Blue,Light airy blue.,"zephyr blue, breezy tone",#99ccee,"153,204,238"
R85 Deep Blue,Saturated blue.,"deep blue, rich tone",#003399,"0,51,153"
R86 Pea Green,Yellow-green.,"pea green, natural tone",#99cc33,"153,204,51"
R87 Pale Yellow Green,Light yellow-green.,"pale yellow green, spring color",#ccdd66,"204,221,102"
R88 Lime Green,Bright lime.,"lime green, citrus color",#66cc00,"102,204,0"
R89 Moss Green,Natural moss color.,"moss green, earthy tone",#669933,"102,153,51"
R90 Dark Yellow Green,Deep yellow-green.,"dark yellow green, forest tone",#558833,"85,136,51"
R91 Primary Green,Pure green.,"primary green, fundamental color",#00aa00,"0,170,0"
R92 Turquoise,Blue-green mix.,"turquoise, tropical color",#00ccaa,"0,204,170"
R93 Blue Green,Standard blue-green.,"blue green, aquatic tone",#009999,"0,153,153"
R94 Kelly Green,Irish green.,"kelly green, vibrant natural",#339933,"51,153,51"
R95 Medium Blue Green,Mid blue-green.,"medium blue green, balanced aqua",#006666,"0,102,102"
R96 Lime,Pure lime color.,"lime, electric green",#99ff00,"153,255,0"
R97 Light Green,Bright light green.,"light green, fresh tone",#66ff66,"102,255,102"
R98 Medium Green,Standard green.,"medium green, natural color",#00cc00,"0,204,0"
R99 Chocolate,Brown tone.,"chocolate, earth color",#663300,"102,51,0"
R382 Congo Blue,Deep tropical blue.,"congo blue, exotic tone",#004466,"0,68,102"`;

    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      // Parse CSV line handling quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      return {
        filter: values[0] || '',
        applications: values[1] || '',
        keywords: values[2] || '',
        rgbHex: values[3] || '#000000',
        rgbDecimal: values[4] || '0,0,0'
      };
    }).filter(filter => filter.filter && filter.rgbHex);
  }, []);

  // Filter roscolux data based on search term
  const filteredFilters = useMemo(() => {
    if (!searchTerm) return roscoluxFilters;
    
    const term = searchTerm.toLowerCase();
    return roscoluxFilters.filter(filter =>
      filter.filter.toLowerCase().includes(term) ||
      filter.applications.toLowerCase().includes(term) ||
      filter.keywords.toLowerCase().includes(term)
    );
  }, [roscoluxFilters, searchTerm]);

  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const handleSwatchClick = (filter: RoscoluxFilter) => {
    const rgb = hexToRgb(filter.rgbHex);
    onColorSelect(rgb);
  };

  return (
    <div className="p-6 h-full flex flex-col max-h-[calc(90vh-200px)]">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search filters by name, application, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredFilters.length} of {roscoluxFilters.length} Roscolux filters
        </p>
      </div>

      {/* Filter Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-700 relative">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-4">
          {filteredFilters.map((filter, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => handleSwatchClick(filter)}
                onMouseEnter={(e) => {
                  setHoveredFilter(filter);
                  setHoveredElement(e.currentTarget);
                }}
                onMouseLeave={() => {
                  setHoveredFilter(null);
                  setHoveredElement(null);
                }}
                className="w-full aspect-square rounded-md border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 relative overflow-hidden"
                style={{ backgroundColor: filter.rgbHex }}
                aria-label={filter.filter}
              >
                {/* Filter number overlay */}
                <span className="absolute bottom-0 right-0 text-[10px] font-bold bg-black/50 text-white px-1 rounded-tl-md">
                  {filter.filter.split(' ')[0]}
                </span>
              </button>
            </div>
          ))}
        </div>

        {filteredFilters.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No filters match your search</p>
            <p className="text-sm">Try searching for color names, applications, or keywords</p>
          </div>
        )}
      </div>
      
      {/* Dynamic Tooltip */}
      <Tooltip 
        filter={hoveredFilter!}
        targetElement={hoveredElement}
        isVisible={hoveredFilter !== null}
      />
    </div>
  );
}