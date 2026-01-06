"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { FixtureInstance } from "@/types";
import { UPDATE_FIXTURE_POSITIONS } from "@/graphql/fixtures";
import { channelValuesToRgb, applyIntensityToRgb, type InstanceChannelWithValue } from "@/utils/colorConversion";
import {
  FIXTURE_SIZE,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  ViewportTransform,
  screenToPixel,
  pixelToScreen,
  isNormalizedCoordinate,
  clampToCanvas,
  calculateAutoLayoutPositions,
} from "@/lib/layoutCanvasUtils";

interface LayoutCanvasProps {
  fixtures: FixtureInstance[];
  fixtureValues: Map<string, number[]>; // fixtureId -> channel values
  onFixtureClick?: (fixtureId: string) => void;
  selectedFixtureIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  // Copy/paste support
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean; // Whether there's data available to paste
  showCopiedFeedback?: boolean; // Show visual feedback after copy
  // Virtual canvas dimensions (default 2000x2000)
  canvasWidth?: number;
  canvasHeight?: number;
}

interface FixturePosition {
  fixtureId: string;
  x: number; // Pixel coordinates in virtual canvas; valid fixture centers are clamped to FIXTURE_SIZE/2 .. canvasWidth - FIXTURE_SIZE/2
  y: number; // Pixel coordinates in virtual canvas; valid fixture centers are clamped to FIXTURE_SIZE/2 .. canvasHeight - FIXTURE_SIZE/2
  rotation?: number; // Degrees, for beam direction
}

// FIXTURE_SIZE is imported from layoutCanvasUtils (80px fixed)
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;

// Touch gesture thresholds
const LONG_PRESS_DURATION = 500; // ms - time to trigger long-press
const DRAG_THRESHOLD = 10; // pixels - movement threshold to start drag
const TAP_THRESHOLD = 300; // ms - max time for a tap

// Helper to convert hex color to normalized RGB values
function hexToNormalizedRGB(hex: string) {
  // Remove leading '#' if present
  hex = hex.replace(/^#/, "");
  // Support short hex (e.g. #abc)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  return { r, g, b };
}

// Default fixture color when no channels are active (Tailwind gray-700: #2d3748)
const DEFAULT_FIXTURE_COLOR = (() => {
  const hex = "#2d3748";
  const { r, g, b } = hexToNormalizedRGB(hex);
  return { hex, r, g, b } as const;
})();

export default function LayoutCanvas({
  fixtures,
  fixtureValues,
  onFixtureClick,
  selectedFixtureIds: externalSelectedIds,
  onSelectionChange,
  onCopy,
  onPaste,
  canPaste = false,
  showCopiedFeedback = false,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
}: LayoutCanvasProps) {
  // Internal selection state (used if not controlled by parent)
  const [internalSelection, setInternalSelection] = useState<Set<string>>(
    new Set(),
  );

  // Use external selection if provided, otherwise use internal
  const selectedFixtureIds = externalSelectedIds || internalSelection;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport state (pan and zoom)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Fixture positions (pixel coordinates in virtual canvas)
  const [fixturePositions, setFixturePositions] = useState<
    Map<string, FixturePosition>
  >(new Map());

  // Track initialized fixture IDs to preserve positions across re-renders
  const initializedFixtureIds = useRef<Set<string>>(new Set());

  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedFixtures, setDraggedFixtures] = useState<Set<string>>(
    new Set(),
  );
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [marqueeStart, setMarqueeStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredFixtureId, setHoveredFixtureId] = useState<string | null>(null);

  // Touch state for pinch-to-zoom
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    distance: number;
  } | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  // Single-finger touch state for panning and dragging
  const [singleTouchStart, setSingleTouchStart] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    fixtureId: string | null;
    time: number;
  } | null>(null);
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [isTouchDragging, setIsTouchDragging] = useState(false);

  // Long-press state for toggle selection on touch
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Long-press marquee selection state (long-press on empty space then drag)
  const [isTouchMarquee, setIsTouchMarquee] = useState(false);
  const [touchMarqueeStart, setTouchMarqueeStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [touchMarqueeCurrent, setTouchMarqueeCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Save state tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas settings
  const [showLabels, setShowLabels] = useState(true);

  // GraphQL mutation for saving positions
  const [updateFixturePositions] = useMutation(UPDATE_FIXTURE_POSITIONS);

  // Initialize fixture positions (load from database or use auto-layout)
  // Only initializes NEW fixtures; preserves existing positions in component state (including unsaved changes), not just database positions
  // Coordinates are in pixel space (0 to canvasWidth/Height)
  useEffect(() => {
    if (fixtures.length === 0) {
      setFixturePositions(new Map());
      initializedFixtureIds.current = new Set();
      return;
    }

    setFixturePositions((prevPositions) => {
      const positions = new Map(prevPositions); // Start with existing positions
      const currentFixtureIds = new Set(fixtures.map((f) => f.id));

      // Remove positions for fixtures that no longer exist
      for (const [fixtureId] of positions) {
        if (!currentFixtureIds.has(fixtureId)) {
          positions.delete(fixtureId);
          initializedFixtureIds.current.delete(fixtureId);
        }
      }

      // Pre-calculate auto-layout positions for fixtures without saved positions
      const fixturesNeedingAutoLayout = fixtures.filter(
        (f) =>
          !initializedFixtureIds.current.has(f.id) &&
          (f.layoutX === null || f.layoutX === undefined || f.layoutY === null || f.layoutY === undefined)
      );
      const autoLayoutPositions = calculateAutoLayoutPositions(
        fixturesNeedingAutoLayout.length,
        canvasWidth,
        canvasHeight
      );
      let autoLayoutIndex = 0;

      fixtures.forEach((fixture) => {
        // Skip if already initialized (preserve existing position in state)
        if (initializedFixtureIds.current.has(fixture.id)) {
          return;
        }

        // Check if fixture has saved position in database
        if (
          fixture.layoutX !== null &&
          fixture.layoutX !== undefined &&
          fixture.layoutY !== null &&
          fixture.layoutY !== undefined
        ) {
          let x = fixture.layoutX;
          let y = fixture.layoutY;

          // Backward compatibility: detect and convert normalized coordinates
          // The backend should already convert these, but this is a safety net.
          // Check each axis independently to handle edge cases like (0.5, 0.0) or (1.0, 0.5).
          // Values in the normalized range [0, 1] are treated as normalized coordinates.
          //
          // KNOWN LIMITATION: Pixel positions 0 or 1 would be incorrectly treated as normalized.
          // In practice this is very unlikely since:
          // 1. Fixtures are clamped to FIXTURE_SIZE/2 (40px) minimum
          // 2. After migration, all coordinates should be in pixel range
          // 3. The backend migration script handles the authoritative conversion
          const xIsNormalized =
            isNormalizedCoordinate(x) || x === 0 || x === 1;
          const yIsNormalized =
            isNormalizedCoordinate(y) || y === 0 || y === 1;

          if (xIsNormalized || yIsNormalized) {
            // Log when conversion is applied to help identify migration issues
            if (process.env.NODE_ENV === "development") {
              console.debug(
                `[LayoutCanvas] Converting legacy coordinates for fixture ${fixture.id}: (${fixture.layoutX}, ${fixture.layoutY}) → pixel space`
              );
            }
            if (xIsNormalized) {
              x = x * canvasWidth;
            }
            if (yIsNormalized) {
              y = y * canvasHeight;
            }
            // Clamp converted coordinates to valid canvas bounds
            const clamped = clampToCanvas(x, y, canvasWidth, canvasHeight);
            x = clamped.x;
            y = clamped.y;
          }

          positions.set(fixture.id, {
            fixtureId: fixture.id,
            x,
            y,
            rotation: fixture.layoutRotation ?? 0,
          });
        } else {
          // Use auto-layout for new fixtures without saved positions (pixel coordinates)
          const autoPos = autoLayoutPositions[autoLayoutIndex] || { x: canvasWidth / 2, y: canvasHeight / 2 };
          positions.set(fixture.id, {
            fixtureId: fixture.id,
            x: autoPos.x,
            y: autoPos.y,
            rotation: 0,
          });

          autoLayoutIndex++;
        }

        // Mark this fixture as initialized
        initializedFixtureIds.current.add(fixture.id);
      });

      return positions;
    });
  }, [fixtures, canvasWidth, canvasHeight]); // Re-run when fixtures or canvas size changes

  // Helper to update selection (internal or external)
  const updateSelection = useCallback(
    (newSelection: Set<string>) => {
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      } else {
        setInternalSelection(newSelection);
      }
    },
    [onSelectionChange],
  );

  // Convert pixel position (virtual canvas) to screen coordinates
  // Positions are in virtual canvas pixels (0 to canvasWidth/Height)
  const positionToScreen = useCallback(
    (px: number, py: number): { x: number; y: number } => {
      return pixelToScreen(px, py, viewport);
    },
    [viewport],
  );

  // Convert screen coordinates to pixel position (virtual canvas)
  const screenToPosition = useCallback(
    (sx: number, sy: number): { x: number; y: number } => {
      return screenToPixel(sx, sy, viewport);
    },
    [viewport],
  );

  // Find fixture under mouse cursor
  // Fixtures scale with zoom (80px at 1x zoom)
  const getFixtureAtPosition = useCallback(
    (x: number, y: number): string | null => {
      for (const fixture of fixtures) {
        const position = fixturePositions.get(fixture.id);
        if (!position) continue;

        const screenPos = positionToScreen(position.x, position.y);
        // Fixture size scales with zoom (80px at 1x zoom)
        const halfSize = (FIXTURE_SIZE * viewport.scale) / 2;

        if (
          x >= screenPos.x - halfSize &&
          x <= screenPos.x + halfSize &&
          y >= screenPos.y - halfSize &&
          y <= screenPos.y + halfSize
        ) {
          return fixture.id;
        }
      }
      return null;
    },
    [fixtures, fixturePositions, positionToScreen, viewport.scale],
  );

  // Get fixture color from channel values using intelligent color mapping
  const getFixtureColor = useCallback(
    (
      fixture: FixtureInstance,
    ): { color: string; r: number; g: number; b: number } => {
      const channelVals = fixtureValues.get(fixture.id) || [];
      const channels = fixture.channels || [];

      // Build InstanceChannelWithValue array
      const channelsWithValues: InstanceChannelWithValue[] = channels.map((channel, index) => ({
        ...channel,
        value: channelVals[index] || 0,
      }));

      // Use intelligent color conversion to get RGB from all available channels
      // Get unscaled RGB + intensity, then apply intensity for display
      const rgbWithIntensity = channelValuesToRgb(channelsWithValues);
      const displayRgb = applyIntensityToRgb(rgbWithIntensity);

      // If no color, use default fixture color (dark gray)
      if (displayRgb.r === 0 && displayRgb.g === 0 && displayRgb.b === 0) {
        return {
          color: DEFAULT_FIXTURE_COLOR.hex,
          r: DEFAULT_FIXTURE_COLOR.r / 255,
          g: DEFAULT_FIXTURE_COLOR.g / 255,
          b: DEFAULT_FIXTURE_COLOR.b / 255,
        };
      }

      return {
        color: `rgb(${displayRgb.r}, ${displayRgb.g}, ${displayRgb.b})`,
        r: displayRgb.r / 255,
        g: displayRgb.g / 255,
        b: displayRgb.b / 255,
      };
    },
    [fixtureValues],
  );

  // Calculate text color based on background luminance
  // Uses relative luminance formula: L = 0.2126*R + 0.7152*G + 0.0722*B
  const getTextColor = useCallback(
    (r: number, g: number, b: number): string => {
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // Use white text for dark backgrounds, black text for light backgrounds
      return luminance > 0.5 ? "#000" : "#fff";
    },
    [],
  );

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to container size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = "#1a202c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (fixed pixel size)
    ctx.strokeStyle = "#2d3748";
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
    fixtures.forEach((fixture) => {
      const position = fixturePositions.get(fixture.id);
      if (!position) return;

      const canvasPos = positionToScreen(position.x, position.y);
      // Fixtures scale with zoom (80px at 1x zoom)
      const size = FIXTURE_SIZE * viewport.scale;

      // Get fixture color and RGB components
      const { color, r, g, b } = getFixtureColor(fixture);

      // Draw fixture rectangle
      const isSelected = selectedFixtureIds.has(fixture.id);
      const isHovered = hoveredFixtureId === fixture.id;
      const isBeingDragged = draggedFixtures.has(fixture.id);

      ctx.save();
      ctx.translate(canvasPos.x, canvasPos.y);

      // Draw shadow if selected, hovered, or being dragged
      if (isBeingDragged) {
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
      } else if (isSelected || isHovered) {
        ctx.shadowColor = isSelected ? "#3b82f6" : "#60a5fa";
        ctx.shadowBlur = 10;
      }

      // Draw fixture body
      ctx.fillStyle = color;
      ctx.fillRect(-size / 2, -size / 2, size, size);

      // Draw border
      if (isBeingDragged) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = isSelected
          ? "#3b82f6"
          : isHovered
            ? "#60a5fa"
            : "#4a5568";
        ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      }
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      ctx.restore();

      // Draw label with contrast-aware text color
      if (showLabels && viewport.scale > 0.5) {
        const textColor = getTextColor(r, g, b);
        ctx.fillStyle = textColor;
        ctx.font = `${Math.max(10, 12 * viewport.scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(fixture.name, canvasPos.x, canvasPos.y);
      }
    });

    // Draw marquee selection box (mouse-based shift+drag)
    if (isMarqueeSelecting && marqueeStart && marqueeCurrent) {
      const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
      const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);

      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);
    }

    // Draw touch marquee selection box (long-press then drag on empty space)
    if (isTouchMarquee && touchMarqueeStart && touchMarqueeCurrent) {
      const minX = Math.min(touchMarqueeStart.x, touchMarqueeCurrent.x);
      const maxX = Math.max(touchMarqueeStart.x, touchMarqueeCurrent.x);
      const minY = Math.min(touchMarqueeStart.y, touchMarqueeCurrent.y);
      const maxY = Math.max(touchMarqueeStart.y, touchMarqueeCurrent.y);

      ctx.strokeStyle = "#10b981"; // Green for touch marquee (to differentiate from mouse)
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);
    }
  }, [
    fixtures,
    fixturePositions,
    viewport,
    selectedFixtureIds,
    hoveredFixtureId,
    draggedFixtures,
    isMarqueeSelecting,
    marqueeStart,
    marqueeCurrent,
    isTouchMarquee,
    touchMarqueeStart,
    touchMarqueeCurrent,
    positionToScreen,
    getFixtureColor,
    getTextColor,
    showLabels,
  ]);

  // Handle mouse down (start panning, dragging, or marquee selection)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a fixture
    const clickedFixture = getFixtureAtPosition(x, y);

    if (clickedFixture) {
      // Clicked on a fixture
      let newSelection: Set<string>;
      let fixturesToDrag: Set<string>;

      if (e.shiftKey) {
        // Shift+click: toggle selection
        newSelection = new Set(selectedFixtureIds);
        if (newSelection.has(clickedFixture)) {
          newSelection.delete(clickedFixture);
        } else {
          newSelection.add(clickedFixture);
        }
        updateSelection(newSelection);
        fixturesToDrag = newSelection;
      } else if (selectedFixtureIds.has(clickedFixture)) {
        // Clicking on already selected fixture: drag all selected
        fixturesToDrag = new Set(selectedFixtureIds);
        newSelection = new Set(selectedFixtureIds);
      } else {
        // Clicking on unselected fixture: select only this one
        newSelection = new Set([clickedFixture]);
        updateSelection(newSelection);
        fixturesToDrag = newSelection;
      }

      // Notify parent if callback provided
      if (onFixtureClick) {
        onFixtureClick(clickedFixture);
      }

      // Start dragging
      setIsDragging(true);
      setDraggedFixtures(fixturesToDrag);
      setDragStart({ x, y });

      // Store initial offsets for each dragged fixture
      const offsets = new Map<string, { x: number; y: number }>();
      fixturesToDrag.forEach((fixtureId) => {
        const position = fixturePositions.get(fixtureId);
        if (position) {
          const canvasPos = positionToScreen(position.x, position.y);
          offsets.set(fixtureId, {
            x: canvasPos.x - x,
            y: canvasPos.y - y,
          });
        }
      });
      setDragOffset(offsets);
    } else {
      // Clicked on empty space
      if (e.shiftKey) {
        // Shift+click on empty: start marquee selection
        setIsMarqueeSelecting(true);
        setMarqueeStart({ x, y });
        setMarqueeCurrent({ x, y });
      } else {
        // Regular click on empty: clear selection and start panning
        if (selectedFixtureIds.size > 0) {
          updateSelection(new Set());
        }
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      }
    }
  };

  // Handle mouse move (pan viewport, drag fixtures, marquee selection, or update hover)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning) {
      // Pan the viewport
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (isDragging && dragStart) {
      // Drag fixtures
      const newPositions = new Map(fixturePositions);

      draggedFixtures.forEach((fixtureId) => {
        const offset = dragOffset.get(fixtureId);
        if (!offset) return;

        // Calculate new canvas position
        const newCanvasX = x + offset.x;
        const newCanvasY = y + offset.y;

        // Convert to pixel coordinates (virtual canvas)
        const pixelPos = screenToPosition(newCanvasX, newCanvasY);

        // Clamp to canvas bounds (pixel coordinates)
        const clamped = clampToCanvas(pixelPos.x, pixelPos.y, canvasWidth, canvasHeight);

        const existingPos = newPositions.get(fixtureId);
        if (existingPos) {
          newPositions.set(fixtureId, {
            ...existingPos,
            x: clamped.x,
            y: clamped.y,
          });
        }
      });

      setFixturePositions(newPositions);
      setHasUnsavedChanges(true);
    } else if (isMarqueeSelecting && marqueeStart) {
      // Update marquee selection box
      setMarqueeCurrent({ x, y });
    } else {
      // Update hovered fixture
      const hoveredId = getFixtureAtPosition(x, y);
      setHoveredFixtureId(hoveredId);
    }
  };

  // Handle mouse up (stop panning, dragging, or marquee selection)
  const handleMouseUp = () => {
    // Track if we were dragging to auto-save positions
    const wasDragging = isDragging && draggedFixtures.size > 0;

    // Handle marquee selection completion
    if (isMarqueeSelecting && marqueeStart && marqueeCurrent) {
      // Calculate marquee bounds
      const minX = Math.min(marqueeStart.x, marqueeCurrent.x);
      const maxX = Math.max(marqueeStart.x, marqueeCurrent.x);
      const minY = Math.min(marqueeStart.y, marqueeCurrent.y);
      const maxY = Math.max(marqueeStart.y, marqueeCurrent.y);

      // Find all fixtures within marquee bounds
      const selectedInMarquee = new Set<string>();
      fixtures.forEach((fixture) => {
        const position = fixturePositions.get(fixture.id);
        if (!position) return;

        const canvasPos = positionToScreen(position.x, position.y);

        // Check if fixture center is within marquee
        if (
          canvasPos.x >= minX &&
          canvasPos.x <= maxX &&
          canvasPos.y >= minY &&
          canvasPos.y <= maxY
        ) {
          selectedInMarquee.add(fixture.id);
        }
      });

      // Update selection (additive with shift)
      updateSelection(selectedInMarquee);

      setIsMarqueeSelecting(false);
      setMarqueeStart(null);
      setMarqueeCurrent(null);
    }

    setIsPanning(false);
    setIsDragging(false);
    setDraggedFixtures(new Set());
    setDragStart(null);
    setDragOffset(new Map());

    // Auto-save positions after dragging
    if (wasDragging && hasUnsavedChanges) {
      handleSaveLayout();
    }
  };

  // Handle mouse wheel (zoom and trackpad pinch)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Detect trackpad pinch gesture (ctrl+wheel on Mac, also pinch on touchpad)
    // This is the standard way browsers handle trackpad pinch gestures
    const isPinchGesture = e.ctrlKey;
    const delta = isPinchGesture
      ? -e.deltaY * ZOOM_SPEED * 0.02 // More sensitive for pinch
      : -e.deltaY * ZOOM_SPEED * 0.01; // Normal mouse wheel

    const newScale = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, viewport.scale * (1 + delta)),
    );

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

  /**
   * Calculate the distance between two touch points
   */
  const getTouchDistance = (
    touch1: React.Touch,
    touch2: React.Touch,
  ): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Get the center point between two touches
   */
  const getTouchCenter = (
    touch1: React.Touch,
    touch2: React.Touch,
    rect: DOMRect,
  ): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
      y: (touch1.clientY + touch2.clientY) / 2 - rect.top,
    };
  };

  // Cancel long-press timer
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  /**
   * Handle touch start for pinch-to-zoom, single-finger interactions, and long-press
   */
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Cancel any pending long-press
    cancelLongPress();

    // Two-finger touch: always pinch-to-zoom
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default browser zoom

      // Cancel any single-finger operation in progress
      setSingleTouchStart(null);
      setIsTouchPanning(false);
      setIsTouchDragging(false);
      setIsTouchMarquee(false);
      setTouchMarqueeStart(null);
      setTouchMarqueeCurrent(null);

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getTouchDistance(touch1, touch2);
      const center = getTouchCenter(touch1, touch2, rect);

      setIsPinching(true);
      setTouchStart({ x: center.x, y: center.y, distance });
    } else if (e.touches.length === 1) {
      // Single-finger touch for panning, fixture dragging, or long-press
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Check if touching a fixture
      const touchedFixture = getFixtureAtPosition(x, y);

      setSingleTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        canvasX: x,
        canvasY: y,
        fixtureId: touchedFixture,
        time: Date.now(),
      });

      if (touchedFixture) {
        // Prevent default browser behavior (text selection, context menu)
        e.preventDefault();

        // Start long-press timer for toggle selection on fixture
        longPressTimerRef.current = setTimeout(() => {
          setIsLongPressing(true);
          // Toggle selection on long-press
          const newSelection = new Set(selectedFixtureIds);
          if (newSelection.has(touchedFixture)) {
            newSelection.delete(touchedFixture);
          } else {
            newSelection.add(touchedFixture);
          }
          updateSelection(newSelection);
          // Provide haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, LONG_PRESS_DURATION);

        // Don't immediately start dragging - wait for movement or long-press
        // Just record the touch position
      } else {
        // Touching empty space - start long-press timer for marquee selection
        longPressTimerRef.current = setTimeout(() => {
          setIsLongPressing(true);
          // Start marquee selection mode
          setIsTouchMarquee(true);
          setTouchMarqueeStart({ x, y });
          setTouchMarqueeCurrent({ x, y });
          setIsTouchPanning(false);
          // Provide haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, LONG_PRESS_DURATION);

        // Prepare for panning (will be cancelled if long-press triggers marquee)
        setIsTouchPanning(true);
        setPanStart({ x: touch.clientX - viewport.x, y: touch.clientY - viewport.y });
      }
    }
  };

  /**
   * Handle touch move for pinch-to-zoom, panning, fixture dragging, and marquee selection
   */
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Handle two-finger pinch-to-zoom
    if (e.touches.length === 2 && isPinching && touchStart) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getTouchDistance(touch1, touch2);
      const center = getTouchCenter(touch1, touch2, rect);

      // Calculate scale change based on distance change
      const scaleChange = distance / touchStart.distance;
      const newScale = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, viewport.scale * scaleChange),
      );

      // Zoom towards the pinch center
      const scaleRatio = newScale / viewport.scale;
      const newX = center.x - (center.x - viewport.x) * scaleRatio;
      const newY = center.y - (center.y - viewport.y) * scaleRatio;

      setViewport({
        x: newX,
        y: newY,
        scale: newScale,
      });

      // Update touchStart for next move event
      setTouchStart({ x: center.x, y: center.y, distance });
    } else if (e.touches.length === 1 && singleTouchStart) {
      e.preventDefault(); // Prevent scrolling

      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Check if we've moved enough to cancel long-press and start dragging
      const deltaX = Math.abs(touch.clientX - singleTouchStart.x);
      const deltaY = Math.abs(touch.clientY - singleTouchStart.y);

      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        // Movement detected - cancel long-press
        cancelLongPress();

        // If touching a fixture and not already dragging, start drag
        if (singleTouchStart.fixtureId && !isTouchDragging && !isLongPressing) {
          const touchedFixture = singleTouchStart.fixtureId;

          // Determine the selection to use for dragging
          // Use the current selection if the touched fixture is already selected,
          // otherwise create a new selection with just this fixture
          let fixturesToDrag: Set<string>;
          if (selectedFixtureIds.has(touchedFixture)) {
            fixturesToDrag = new Set(selectedFixtureIds);
          } else {
            fixturesToDrag = new Set([touchedFixture]);
            updateSelection(fixturesToDrag);
          }

          // Set up drag state
          setIsTouchDragging(true);
          setDraggedFixtures(fixturesToDrag);
          setDragStart({ x: singleTouchStart.canvasX, y: singleTouchStart.canvasY });

          // Store initial offsets for each dragged fixture
          const offsets = new Map<string, { x: number; y: number }>();
          fixturesToDrag.forEach((fixtureId) => {
            const position = fixturePositions.get(fixtureId);
            if (position) {
              const canvasPos = positionToScreen(position.x, position.y);
              offsets.set(fixtureId, {
                x: canvasPos.x - singleTouchStart.canvasX,
                y: canvasPos.y - singleTouchStart.canvasY,
              });
            }
          });
          setDragOffset(offsets);
        }
      }

      if (isTouchMarquee && touchMarqueeStart) {
        // Update marquee selection box
        setTouchMarqueeCurrent({ x, y });
      } else if (isTouchPanning) {
        // Pan the viewport
        setViewport((prev) => ({
          ...prev,
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        }));
      } else if (isTouchDragging && draggedFixtures.size > 0) {
        // Drag fixtures
        const newPositions = new Map(fixturePositions);

        draggedFixtures.forEach((fixtureId) => {
          const offset = dragOffset.get(fixtureId);
          if (!offset) return;

          // Calculate new canvas position
          const newCanvasX = x + offset.x;
          const newCanvasY = y + offset.y;

          // Convert to pixel coordinates (virtual canvas)
          const pixelPos = screenToPosition(newCanvasX, newCanvasY);

          // Clamp to canvas bounds (pixel coordinates)
          const clamped = clampToCanvas(pixelPos.x, pixelPos.y, canvasWidth, canvasHeight);

          const existingPos = newPositions.get(fixtureId);
          if (existingPos) {
            newPositions.set(fixtureId, {
              ...existingPos,
              x: clamped.x,
              y: clamped.y,
            });
          }
        });

        setFixturePositions(newPositions);
        setHasUnsavedChanges(true);
      }
    }
  };

  /**
   * Handle touch end for pinch-to-zoom, panning, fixture dragging, and marquee selection
   */
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Cancel any pending long-press
    cancelLongPress();

    // Handle touch marquee completion (long-press then drag on empty space)
    if (e.touches.length === 0 && isTouchMarquee && touchMarqueeStart && touchMarqueeCurrent) {
      // Calculate marquee bounds
      const minX = Math.min(touchMarqueeStart.x, touchMarqueeCurrent.x);
      const maxX = Math.max(touchMarqueeStart.x, touchMarqueeCurrent.x);
      const minY = Math.min(touchMarqueeStart.y, touchMarqueeCurrent.y);
      const maxY = Math.max(touchMarqueeStart.y, touchMarqueeCurrent.y);

      // Find all fixtures within marquee bounds
      const selectedInMarquee = new Set<string>();
      fixtures.forEach((fixture) => {
        const position = fixturePositions.get(fixture.id);
        if (!position) return;

        const canvasPos = positionToScreen(position.x, position.y);

        // Check if fixture center is within marquee
        if (
          canvasPos.x >= minX &&
          canvasPos.x <= maxX &&
          canvasPos.y >= minY &&
          canvasPos.y <= maxY
        ) {
          selectedInMarquee.add(fixture.id);
        }
      });

      // Update selection (additive - add to existing selection)
      if (selectedInMarquee.size > 0) {
        const newSelection = new Set(selectedFixtureIds);
        selectedInMarquee.forEach((id) => newSelection.add(id));
        updateSelection(newSelection);
      }

      // Reset marquee state
      setIsTouchMarquee(false);
      setTouchMarqueeStart(null);
      setTouchMarqueeCurrent(null);
    }

    // If less than 2 touches remain, end pinch gesture
    if (e.touches.length < 2) {
      setIsPinching(false);
      setTouchStart(null);
    }

    // End single-finger operations when all touches are released
    if (e.touches.length === 0) {
      // Track if we were dragging fixtures to trigger auto-save
      const wasDraggingFixtures = isTouchDragging && draggedFixtures.size > 0;

      // Check if this was a tap (quick touch without much movement) and not a long-press
      if (singleTouchStart && singleTouchStart.fixtureId && !isLongPressing) {
        const touchDuration = Date.now() - singleTouchStart.time;

        if (touchDuration < TAP_THRESHOLD && !wasDraggingFixtures) {
          // This was a tap on a fixture - select it (replacing current selection)
          updateSelection(new Set([singleTouchStart.fixtureId]));
          // Notify parent
          if (onFixtureClick) {
            onFixtureClick(singleTouchStart.fixtureId);
          }
        }
      }

      // Reset single-finger touch state
      setSingleTouchStart(null);
      setIsTouchPanning(false);
      setIsTouchDragging(false);
      setDraggedFixtures(new Set());
      setDragStart(null);
      setDragOffset(new Map());

      // Reset touch marquee state (in case it wasn't handled above)
      setIsTouchMarquee(false);
      setTouchMarqueeStart(null);
      setTouchMarqueeCurrent(null);
      setIsLongPressing(false);

      // Auto-save positions after dragging fixtures
      if (wasDraggingFixtures && hasUnsavedChanges) {
        handleSaveLayout();
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      scale: Math.min(MAX_ZOOM, prev.scale * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      scale: Math.max(MIN_ZOOM, prev.scale / 1.2),
    }));
  };

  const handleFitToView = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Guard against division by zero during initial render
    if (canvas.width <= 0 || canvas.height <= 0) return;

    // Calculate bounds of all fixtures
    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;

    fixturePositions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    // Guard against division by zero if fixture bounds width or height are zero
    if (width <= 0 || height <= 0) return;

    // Calculate scale to fit
    // Convert fixture size padding from pixels to normalized coordinates, then calculate scale
    const scaleX = 1 / (width + (FIXTURE_SIZE * 2) / canvas.width);
    const scaleY = 1 / (height + (FIXTURE_SIZE * 2) / canvas.height);
    const scale = Math.min(scaleX, scaleY, MAX_ZOOM);

    setViewport({
      x: canvas.width / 2 - centerX * canvas.width * scale,
      y: canvas.height / 2 - centerY * canvas.height * scale,
      scale,
    });
  };

  // Save layout positions to database
  const handleSaveLayout = async () => {
    setIsSaving(true);

    try {
      // Convert fixturePositions Map to array format expected by mutation
      const positions = Array.from(fixturePositions.values()).map((pos) => ({
        fixtureId: pos.fixtureId,
        layoutX: pos.x,
        layoutY: pos.y,
        layoutRotation: pos.rotation ?? 0,
      }));

      await updateFixturePositions({
        variables: { positions },
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save layout:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to save layout: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A or Ctrl+A: Select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        const allIds = new Set(fixtures.map((f) => f.id));
        updateSelection(allIds);
      }

      // Escape: Deselect all
      if (e.key === "Escape") {
        e.preventDefault();
        updateSelection(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fixtures, updateSelection]);

  // Prevent browser zoom on trackpad pinch (ctrl+wheel)
  // This must be added as a non-passive event listener to prevent default browser zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelCapture = (e: WheelEvent) => {
      // Only prevent default for pinch gestures (ctrl+wheel on trackpad)
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Add with { passive: false } to allow preventDefault
    container.addEventListener("wheel", handleWheelCapture, { passive: false });
    return () => container.removeEventListener("wheel", handleWheelCapture);
  }, []);

  // Add native touch event listeners with passive: false to prevent default scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeTouchMove = (e: TouchEvent) => {
      // Prevent scrolling during touch interactions on the canvas
      e.preventDefault();
    };

    // Add with { passive: false } to allow preventDefault
    canvas.addEventListener("touchmove", handleNativeTouchMove, { passive: false });
    return () => canvas.removeEventListener("touchmove", handleNativeTouchMove);
  }, []);

  // Determine cursor style based on interaction state
  const getCursorStyle = () => {
    if (isDragging) return "grabbing";
    if (isPanning) return "grabbing";
    if (hoveredFixtureId) return "grab";
    return "default";
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: getCursorStyle(),
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
        className="w-full h-full"
      />

      {/* Control panel */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Save Layout Button */}
        <div className="bg-gray-800 rounded-lg p-2 shadow-lg">
          <button
            onClick={handleSaveLayout}
            disabled={!hasUnsavedChanges || isSaving}
            className={`w-full px-4 py-2 rounded transition-colors ${
              hasUnsavedChanges && !isSaving
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            title={
              hasUnsavedChanges
                ? "Save current layout to database"
                : "No changes to save"
            }
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save Layout
              </span>
            )}
          </button>
        </div>

        {/* Copy/Paste Buttons - shown when fixtures are selected */}
        {selectedFixtureIds.size > 0 && (onCopy || onPaste) && (
          <div className="bg-gray-800 rounded-lg p-2 shadow-lg flex flex-col gap-1">
            {onCopy && (
              <button
                onClick={onCopy}
                className="w-full px-3 py-2 rounded transition-colors text-sm bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center gap-2"
                title="Copy channel values from selected fixture"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
                {showCopiedFeedback && (
                  <span className="text-green-400 text-xs">✓</span>
                )}
              </button>
            )}
            {onPaste && (
              <button
                onClick={onPaste}
                disabled={!canPaste}
                className={`w-full px-3 py-2 rounded transition-colors text-sm flex items-center justify-center gap-2 ${
                  canPaste
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
                title={canPaste ? "Paste channel values to selected fixtures" : "Nothing to paste - copy first"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Paste
              </button>
            )}
            <div className="text-xs text-gray-400 text-center mt-1">
              {selectedFixtureIds.size} selected
            </div>
          </div>
        )}

        {/* View Settings */}
        <div className="bg-gray-800 rounded-lg p-2 shadow-lg">
          {/* Show Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`w-full px-3 py-2 rounded transition-colors text-sm ${
              showLabels
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
            title={showLabels ? "Labels visible" : "Labels hidden"}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {showLabels ? "Labels: ON" : "Labels: OFF"}
            </span>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="bg-gray-800 rounded-lg p-2 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <button
            onClick={handleFitToView}
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
            title="Fit to View"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Hovered fixture info */}
      {hoveredFixtureId && (
        <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          {fixtures.find((f) => f.id === hoveredFixtureId)?.name}
        </div>
      )}
    </div>
  );
}
