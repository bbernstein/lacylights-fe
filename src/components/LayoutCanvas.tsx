'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { FixtureInstance, InstanceChannel, ChannelType } from '@/types';

interface LayoutCanvasProps {
  fixtures: FixtureInstance[];
  fixtureValues: Map<string, number[]>; // fixtureId -> channel values
  onFixtureClick?: (fixtureId: string) => void;
  selectedFixtureIds?: Set<string>;
}

interface FixturePosition {
  fixtureId: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  rotation?: number; // Degrees, for beam direction
}

interface ViewportTransform {
  x: number; // Pan offset X
  y: number; // Pan offset Y
  scale: number; // Zoom scale
}

const FIXTURE_SIZE = 60; // Base size in canvas pixels
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;

export default function LayoutCanvas({
  fixtures,
  fixtureValues,
  onFixtureClick,
  selectedFixtureIds = new Set(),
}: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport state (pan and zoom)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Fixture positions (normalized 0-1 coordinates)
  const [fixturePositions, setFixturePositions] = useState<Map<string, FixturePosition>>(new Map());

  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredFixtureId, setHoveredFixtureId] = useState<string | null>(null);

  // Initialize fixture positions (auto-layout in a grid)
  useEffect(() => {
    if (fixtures.length === 0) return;

    const positions = new Map<string, FixturePosition>();
    const gridCols = Math.ceil(Math.sqrt(fixtures.length));

    fixtures.forEach((fixture, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);

      positions.set(fixture.id, {
        fixtureId: fixture.id,
        x: (col + 0.5) / gridCols, // Center in cell
        y: (row + 0.5) / Math.ceil(fixtures.length / gridCols),
        rotation: 0,
      });
    });

    setFixturePositions(positions);
  }, [fixtures]);

  // Convert normalized position to canvas coordinates
  const normalizedToCanvas = useCallback((nx: number, ny: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;

    return {
      x: (nx * canvas.width * viewport.scale) + viewport.x,
      y: (ny * canvas.height * viewport.scale) + viewport.y,
    };
  }, [viewport]);

  // Convert canvas coordinates to normalized position (reserved for future drag-and-drop)
  const _canvasToNormalized = useCallback((cx: number, cy: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;

    return {
      x: (cx - viewport.x) / (canvas.width * viewport.scale),
      y: (cy - viewport.y) / (canvas.height * viewport.scale),
    };
  }, [viewport]);

  // Get fixture color from channel values
  const getFixtureColor = useCallback((fixture: FixtureInstance): string => {
    const channelVals = fixtureValues.get(fixture.id) || [];
    const channels = fixture.channels || [];

    let r = 0, g = 0, b = 0;
    let hasIntensity = false;
    let intensity = 1;

    // Check for intensity channel
    const intensityChannel = channels.find(ch => ch.type === ChannelType.INTENSITY);
    if (intensityChannel) {
      hasIntensity = true;
      const intensityIndex = channels.indexOf(intensityChannel);
      intensity = (channelVals[intensityIndex] ?? 0) / 255;
    }

    channels.forEach((channel: InstanceChannel, index: number) => {
      const value = (channelVals[index] ?? 0) / 255;

      switch (channel.type) {
        case ChannelType.RED:
          r = Math.max(r, value);
          break;
        case ChannelType.GREEN:
          g = Math.max(g, value);
          break;
        case ChannelType.BLUE:
          b = Math.max(b, value);
          break;
        case ChannelType.WHITE:
          r = Math.min(1, r + value * 0.95);
          g = Math.min(1, g + value * 0.95);
          b = Math.min(1, b + value * 0.95);
          break;
        case ChannelType.AMBER:
          r = Math.min(1, r + value);
          g = Math.min(1, g + value * 0.75);
          break;
        case ChannelType.UV:
          r = Math.min(1, r + value * 0.29);
          b = Math.min(1, b + value * 0.51);
          break;
      }
    });

    // Apply intensity if present
    if (hasIntensity) {
      r *= intensity;
      g *= intensity;
      b *= intensity;
    }

    // If no color, show dark gray
    if (r === 0 && g === 0 && b === 0) {
      return '#2d3748';
    }

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }, [fixtureValues]);

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to container size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    const gridSize = 50 * viewport.scale;

    for (let x = viewport.x % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = viewport.y % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw fixtures
    fixtures.forEach(fixture => {
      const position = fixturePositions.get(fixture.id);
      if (!position) return;

      const canvasPos = normalizedToCanvas(position.x, position.y);
      const size = FIXTURE_SIZE * viewport.scale;

      // Get fixture color
      const color = getFixtureColor(fixture);

      // Draw fixture rectangle
      const isSelected = selectedFixtureIds.has(fixture.id);
      const isHovered = hoveredFixtureId === fixture.id;

      ctx.save();
      ctx.translate(canvasPos.x, canvasPos.y);

      // Draw shadow if selected or hovered
      if (isSelected || isHovered) {
        ctx.shadowColor = isSelected ? '#3b82f6' : '#60a5fa';
        ctx.shadowBlur = 10;
      }

      // Draw fixture body
      ctx.fillStyle = color;
      ctx.fillRect(-size / 2, -size / 2, size, size);

      // Draw border
      ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#4a5568';
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      ctx.restore();

      // Draw label
      if (viewport.scale > 0.5) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(10, 12 * viewport.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fixture.name, canvasPos.x, canvasPos.y);
      }
    });
  }, [fixtures, fixturePositions, viewport, selectedFixtureIds, hoveredFixtureId, normalizedToCanvas, getFixtureColor]);

  // Handle mouse down (start panning)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a fixture
    let clickedFixture: string | null = null;

    fixtures.forEach(fixture => {
      const position = fixturePositions.get(fixture.id);
      if (!position) return;

      const canvasPos = normalizedToCanvas(position.x, position.y);
      const size = FIXTURE_SIZE * viewport.scale;

      if (
        x >= canvasPos.x - size / 2 &&
        x <= canvasPos.x + size / 2 &&
        y >= canvasPos.y - size / 2 &&
        y <= canvasPos.y + size / 2
      ) {
        clickedFixture = fixture.id;
      }
    });

    if (clickedFixture && onFixtureClick) {
      onFixtureClick(clickedFixture);
    } else {
      // Start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  // Handle mouse move (pan viewport or update hover)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else {
      // Update hovered fixture
      let hoveredId: string | null = null;

      fixtures.forEach(fixture => {
        const position = fixturePositions.get(fixture.id);
        if (!position) return;

        const canvasPos = normalizedToCanvas(position.x, position.y);
        const size = FIXTURE_SIZE * viewport.scale;

        if (
          x >= canvasPos.x - size / 2 &&
          x <= canvasPos.x + size / 2 &&
          y >= canvasPos.y - size / 2 &&
          y <= canvasPos.y + size / 2
        ) {
          hoveredId = fixture.id;
        }
      });

      setHoveredFixtureId(hoveredId);
    }
  };

  // Handle mouse up (stop panning)
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle mouse wheel (zoom)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY * ZOOM_SPEED * 0.01;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.scale * (1 + delta)));

    // Zoom towards mouse position
    const scaleRatio = newScale / viewport.scale;
    const newX = mouseX - (mouseX - viewport.x) * scaleRatio;
    const newY = mouseY - (mouseY - viewport.y) * scaleRatio;

    setViewport({
      x: newX,
      y: newY,
      scale: newScale,
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    setViewport(prev => ({
      ...prev,
      scale: Math.min(MAX_ZOOM, prev.scale * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(MIN_ZOOM, prev.scale / 1.2),
    }));
  };

  const handleFitToView = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Calculate bounds of all fixtures
    let minX = 1, minY = 1, maxX = 0, maxY = 0;

    fixturePositions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    // Calculate scale to fit
    const scaleX = canvas.width / (width * canvas.width + FIXTURE_SIZE * 2);
    const scaleY = canvas.height / (height * canvas.height + FIXTURE_SIZE * 2);
    const scale = Math.min(scaleX, scaleY, MAX_ZOOM);

    setViewport({
      x: canvas.width / 2 - centerX * canvas.width * scale,
      y: canvas.height / 2 - centerY * canvas.height * scale,
      scale,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="cursor-move"
      />

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-gray-800 rounded-lg p-2 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleFitToView}
          className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
          title="Fit to View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Hovered fixture info */}
      {hoveredFixtureId && (
        <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          {fixtures.find(f => f.id === hoveredFixtureId)?.name}
        </div>
      )}
    </div>
  );
}
