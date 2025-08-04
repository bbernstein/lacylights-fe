import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ROSCOLUX_FILTERS, type RoscoluxFilter } from '@/data/roscoluxFilters';

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
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
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
      className={`fixed bg-gray-900 text-white text-sm rounded-lg p-3 w-64 shadow-lg pointer-events-none transition-opacity duration-200 z-50 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
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

  // Use the imported Roscolux filter data
  const roscoluxFilters = ROSCOLUX_FILTERS;

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
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-4">
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
                className="w-full aspect-square min-h-[44px] min-w-[44px] rounded-md border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 relative overflow-hidden"
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