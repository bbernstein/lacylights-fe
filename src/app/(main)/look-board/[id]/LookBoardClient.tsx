"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_LOOK_BOARD,
  UPDATE_LOOK_BOARD,
  ACTIVATE_LOOK_FROM_BOARD,
  UPDATE_LOOK_BOARD_BUTTON_POSITIONS,
  ADD_LOOK_TO_BOARD,
  REMOVE_LOOK_FROM_BOARD,
} from "@/graphql/lookBoards";
import { GET_PROJECT_LOOKS } from "@/graphql/looks";
import { useProject } from "@/contexts/ProjectContext";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { useUserMode } from "@/contexts/UserModeContext";
import { LookBoardButton } from "@/types";
import {
  screenToCanvas,
  clamp,
  snapToGrid,
  findAvailablePosition,
  recalibrateButtonPositions,
  Rect,
  ButtonPosition,
} from "@/lib/canvasUtils";
import { getContrastingTextColor } from "@/utils/colorHelpers";
import ContextMenu from "@/components/ContextMenu";
import EffectsPanel from "@/components/EffectsPanel";

// Grid configuration
const GRID_SIZE = 10; // Fine grid for flexible button placement
const AUTO_PLACEMENT_GRID_SIZE = 250; // Grid step for auto-placement (matches findAvailablePosition gridStep)
const AUTO_PLACEMENT_PADDING = 20; // Grid offset for auto-placement (matches findAvailablePosition padding)
const MIN_ZOOM = 0.1; // Allow zooming out to 10% to fit 4000x4000 canvas on screen
const MAX_ZOOM = 3.0;
const DEFAULT_BUTTON_WIDTH = 200;
const DEFAULT_BUTTON_HEIGHT = 120;
const DEFAULT_CANVAS_WIDTH = 4000;
const DEFAULT_CANVAS_HEIGHT = 4000;

// Touch gesture thresholds
const TAP_THRESHOLD_TIME = 300; // ms - max time for a tap
const TAP_MOVEMENT_THRESHOLD = 10; // pixels - max movement for a tap

interface LookBoardClientProps {
  id: string;
}

export default function LookBoardClient({ id }: LookBoardClientProps) {
  const router = useRouter();
  const boardId =
    id === "__dynamic__"
      ? typeof window !== "undefined"
        ? window.location.pathname.split("/").pop() || ""
        : ""
      : id;
  const { currentProject } = useProject();
  const { isFocusMode, enterFocusMode, exitFocusMode } = useFocusMode();
  const { canPlayback, canEditContent } = useUserMode();

  const [mode, setMode] = useState<"play" | "layout">("play");
  const [isAddLookModalOpen, setIsAddLookModalOpen] = useState(false);
  const [selectedLookIds, setSelectedLookIds] = useState<Set<string>>(
    new Set(),
  );
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedFadeTime, setEditedFadeTime] = useState("3");
  const [editedCanvasWidth, setEditedCanvasWidth] = useState(
    DEFAULT_CANVAS_WIDTH.toString(),
  );
  const [editedCanvasHeight, setEditedCanvasHeight] = useState(
    DEFAULT_CANVAS_HEIGHT.toString(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selection state for multi-select (button IDs, not look IDs)
  const [selectedButtonIds, setSelectedButtonIds] = useState<Set<string>>(
    new Set(),
  );

  // Marquee selection state
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isTouch?: boolean; // Track if marquee was started by touch
  } | null>(null);
  const marqueeStartCanvas = useRef<{ x: number; y: number } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "button" | "canvas";
    button?: LookBoardButton;
  } | null>(null);

  // Long-press state for touch devices
  const longPressTimer = useRef<number | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);

  // Drag state
  const [draggingButton, setDraggingButton] = useState<LookBoardButton | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragStartScale = useRef<number>(1); // Track scale at drag start for accurate viewport compensation
  const [actuallyDragging, setActuallyDragging] = useState(false);
  /**
   * Track if the last interaction was a drag/marquee to prevent click handlers from firing.
   * Uses a ref instead of state to avoid re-renders and allow synchronous read/write across event handlers.
   * The flag is set to true after drag/marquee completes and reset to false when the next click is handled.
   * This prevents canvas clicks from clearing selection immediately after a drag operation.
   */
  const lastInteractionWasDrag = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Multi-button drag state - store initial positions of all selected buttons
  const [draggingButtons, setDraggingButtons] = useState<
    Map<
      string,
      {
        originalX: number;
        originalY: number;
        currentX: number;
        currentY: number;
      }
    >
  >(new Map());

  // Drag threshold - must move this many pixels before we consider it a drag
  const DRAG_THRESHOLD = 5;

  // Viewport state for zoom/pan
  const [viewport, setViewport] = useState({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
  });

  // Track which board ID we've already auto-zoomed for
  const autoZoomedBoardId = useRef<string | null>(null);

  // Touch state for pinch-to-zoom and two-finger pan
  const [touchState, setTouchState] = useState<{
    initialDistance: number | null;
    initialScale: number;
    initialMidpoint: { x: number; y: number } | null; // Canvas-relative coords
    initialViewportMidpoint: { x: number; y: number } | null; // Viewport coords for tracking pan
    initialOffset: { x: number; y: number };
    canvasRect: DOMRect | null; // Stable canvas rect for the gesture
  }>({
    initialDistance: null,
    initialScale: 1.0,
    initialMidpoint: null,
    initialViewportMidpoint: null,
    initialOffset: { x: 0, y: 0 },
    canvasRect: null,
  });

  // Single-finger pan state (for panning canvas when not dragging a button)
  const [singleFingerPan, setSingleFingerPan] = useState<{
    isPanning: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Mouse pan state (for panning canvas with mouse drag)
  const [mousePan, setMousePan] = useState<{
    isPanning: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Canvas long-press state for marquee selection on touch
  const canvasLongPressTimer = useRef<number | null>(null);
  const canvasLongPressStart = useRef<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);
  const [canvasLongPressActive, setCanvasLongPressActive] = useState(false);

  const {
    data: boardData,
    loading,
    error,
    refetch,
  } = useQuery(GET_LOOK_BOARD, {
    variables: { id: boardId },
    skip: !boardId,
  });

  const { data: looksData } = useQuery(GET_PROJECT_LOOKS, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [updateBoard] = useMutation(UPDATE_LOOK_BOARD, {
    onCompleted: () => {
      refetch();
      setIsEditingSettings(false);
    },
    onError: (error) => {
      setErrorMessage(`Error updating board: ${error.message}`);
    },
  });

  const [activateLook] = useMutation(ACTIVATE_LOOK_FROM_BOARD, {
    onError: (error) => {
      setErrorMessage(`Error activating look: ${error.message}`);
    },
  });

  const [updatePositions] = useMutation(UPDATE_LOOK_BOARD_BUTTON_POSITIONS, {
    onError: (error) => {
      setErrorMessage(`Error updating positions: ${error.message}`);
      // Refetch on error to revert to server state
      refetch();
    },
  });

  const [addLookToBoard] = useMutation(ADD_LOOK_TO_BOARD, {
    onCompleted: () => {
      refetch();
      setIsAddLookModalOpen(false);
      setSelectedLookIds(new Set());
    },
    onError: (error) => {
      setErrorMessage(`Error adding look: ${error.message}`);
    },
  });

  const [removeLookFromBoard] = useMutation(REMOVE_LOOK_FROM_BOARD, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setErrorMessage(`Error removing look: ${error.message}`);
    },
  });

  const board = boardData?.lookBoard;

  // Memoize available looks to avoid recalculating on every render
  const availableLooks = useMemo(
    () => looksData?.project?.looks || [],
    [looksData?.project?.looks],
  );

  // Memoize button IDs to avoid recalculating on every render
  const buttonsOnBoard = useMemo(
    () =>
      new Set(board?.buttons?.map((b: LookBoardButton) => b.look.id) || []),
    [board?.buttons],
  );

  const looksToAdd = useMemo(
    () =>
      availableLooks.filter((s: { id: string }) => !buttonsOnBoard.has(s.id)),
    [availableLooks, buttonsOnBoard],
  );

  // Selection helper functions - defined before useEffects that use them
  const clearButtonSelection = useCallback(() => {
    setSelectedButtonIds(new Set());
  }, []);

  const selectAllButtons = useCallback(() => {
    if (!board) return;
    setSelectedButtonIds(
      new Set(board.buttons.map((b: LookBoardButton) => b.id)),
    );
  }, [board]);

  // Zoom to fit helper function
  const zoomToFit = useCallback(() => {
    if (!board || board.buttons.length === 0 || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const viewportWidth = canvasRect.width;
    const viewportHeight = canvasRect.height;

    // Calculate bounding box of all buttons
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    board.buttons.forEach((button: LookBoardButton) => {
      const x = button.layoutX;
      const y = button.layoutY;
      const width = button.width || DEFAULT_BUTTON_WIDTH;
      const height = button.height || DEFAULT_BUTTON_HEIGHT;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Add padding around buttons (10% of canvas size)
    const PADDING = 100;
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    // Calculate required scale to fit all buttons
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const newScale = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, MAX_ZOOM);

    // Calculate offset to center the content
    const scaledContentWidth = contentWidth * newScale;
    const scaledContentHeight = contentHeight * newScale;
    const offsetX = (viewportWidth - scaledContentWidth) / 2 - minX * newScale;
    const offsetY =
      (viewportHeight - scaledContentHeight) / 2 - minY * newScale;

    setViewport({
      scale: newScale,
      offsetX,
      offsetY,
    });
  }, [board]);

  // Button selection helper functions (must be before startLongPress)
  const toggleButtonSelection = useCallback((buttonId: string) => {
    setSelectedButtonIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(buttonId)) {
        newSet.delete(buttonId);
      } else {
        newSet.add(buttonId);
      }
      return newSet;
    });
  }, []);

  const selectSingleButton = useCallback((buttonId: string) => {
    setSelectedButtonIds(new Set([buttonId]));
  }, []);

  // Long-press helper functions
  const startLongPress = useCallback(
    (x: number, y: number, button: LookBoardButton | null) => {
      if (mode !== "layout") return;

      // Clear any existing timer
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }

      // Set timer for long-press detection (500ms)
      longPressTimer.current = window.setTimeout(() => {
        setLongPressActive(true);
        // Trigger haptic feedback if available
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }

        // If long-pressing a button, toggle it in the selection (multi-select behavior)
        if (button) {
          toggleButtonSelection(button.id);
        }

        setContextMenu({
          x,
          y,
          type: button ? "button" : "canvas",
          button: button || undefined,
        });
      }, 500);
    },
    [mode, toggleButtonSelection],
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Reset long-press active state after a short delay
    setTimeout(() => setLongPressActive(false), 100);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Escape key - Close modals or clear selection
      if (e.key === "Escape") {
        if (isAddLookModalOpen) {
          e.preventDefault();
          setIsAddLookModalOpen(false);
          setSelectedLookIds(new Set());
        } else if (isEditingSettings) {
          e.preventDefault();
          setIsEditingSettings(false);
        } else if (mode === "layout" && selectedButtonIds.size > 0) {
          e.preventDefault();
          clearButtonSelection();
        }
        return;
      }

      // Don't handle any shortcuts if in input field (let typing work normally)
      if (isInputField) return;

      // Zoom shortcuts work in both layout and play mode
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setViewport((prev) => ({
          ...prev,
          scale: clamp(prev.scale + 0.1, MIN_ZOOM, MAX_ZOOM),
        }));
        return;
      }
      if (e.key === "-") {
        e.preventDefault();
        setViewport((prev) => ({
          ...prev,
          scale: clamp(prev.scale - 0.1, MIN_ZOOM, MAX_ZOOM),
        }));
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        zoomToFit();
        return;
      }

      // Don't handle editing shortcuts if in play mode
      if (mode === "play") return;

      // Select All (Cmd/Ctrl + A) - Layout mode only
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAllButtons();
        return;
      }

      // Delete selected buttons (Delete or Backspace) - Layout mode only
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedButtonIds.size > 0
      ) {
        e.preventDefault();
        const buttonIds = Array.from(selectedButtonIds);
        const buttons = board?.buttons.filter((b: LookBoardButton) =>
          buttonIds.includes(b.id),
        );
        if (buttons && buttons.length > 0) {
          const message =
            buttons.length === 1
              ? `Remove "${buttons[0].look.name}" from this board?`
              : `Remove ${buttons.length} looks from this board?`;
          if (window.confirm(message)) {
            // Remove all selected buttons
            buttons.forEach((button: LookBoardButton) => {
              removeLookFromBoard({
                variables: { buttonId: button.id },
              });
            });
            clearButtonSelection();
          }
        }
        return;
      }

      // Nudge selected buttons with arrow keys - Layout mode only
      if (
        selectedButtonIds.size > 0 &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const nudgeAmount = e.shiftKey ? 1 : 10; // Fine nudge with Shift
        const buttonIds = Array.from(selectedButtonIds);
        const buttons = board?.buttons.filter((b: LookBoardButton) =>
          buttonIds.includes(b.id),
        );
        if (!buttons || buttons.length === 0) return;

        // Calculate new positions for all selected buttons
        const positions = buttons.map((button: LookBoardButton) => {
          let newX = button.layoutX;
          let newY = button.layoutY;

          switch (e.key) {
            case "ArrowLeft":
              newX = Math.max(0, button.layoutX - nudgeAmount);
              break;
            case "ArrowRight":
              newX = Math.min(
                (board?.canvasWidth || 2000) -
                  (button.width || DEFAULT_BUTTON_WIDTH),
                button.layoutX + nudgeAmount,
              );
              break;
            case "ArrowUp":
              newY = Math.max(0, button.layoutY - nudgeAmount);
              break;
            case "ArrowDown":
              newY = Math.min(
                (board?.canvasHeight || 2000) -
                  (button.height || DEFAULT_BUTTON_HEIGHT),
                button.layoutY + nudgeAmount,
              );
              break;
          }

          return {
            buttonId: button.id,
            layoutX: snapToGrid(newX, GRID_SIZE),
            layoutY: snapToGrid(newY, GRID_SIZE),
          };
        });

        // Update all positions at once
        updatePositions({
          variables: { positions },
          optimisticResponse: {
            updateLookBoardButtonPositions: true,
          },
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAddLookModalOpen,
    isEditingSettings,
    mode,
    selectedButtonIds,
    board,
    clearButtonSelection,
    selectAllButtons,
    zoomToFit,
    removeLookFromBoard,
    updatePositions,
  ]);

  // Enter focus mode on mount, exit on unmount
  useEffect(() => {
    enterFocusMode();

    return () => {
      exitFocusMode();
    };
  }, [enterFocusMode, exitFocusMode]);

  // Force play mode when in focus mode
  useEffect(() => {
    if (isFocusMode && mode !== "play") {
      setMode("play");
    }
  }, [isFocusMode, mode]);

  // Clear selection when entering play mode
  useEffect(() => {
    if (mode === "play" && selectedButtonIds.size > 0) {
      clearButtonSelection();
    }
  }, [mode, selectedButtonIds.size, clearButtonSelection]);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent, button: LookBoardButton) => {
      if (mode !== "layout" || !board) return;

      // If Shift key is pressed, stop propagation to prevent canvas marquee,
      // but don't start a drag - let the click handler toggle selection instead
      if (e.shiftKey) {
        e.stopPropagation();
        return;
      }

      e.stopPropagation();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport, canvas);

      // Record the start position for threshold detection
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      lastInteractionWasDrag.current = false;

      // Check if this button is selected - if so, we'll drag all selected buttons
      const isSelected = selectedButtonIds.has(button.id);
      const buttonsToDrag = isSelected
        ? board.buttons.filter((b: LookBoardButton) =>
            selectedButtonIds.has(b.id),
          )
        : [button];

      // Initialize multi-button drag state
      const dragMap = new Map();
      buttonsToDrag.forEach((btn: LookBoardButton) => {
        dragMap.set(btn.id, {
          originalX: btn.layoutX,
          originalY: btn.layoutY,
          currentX: btn.layoutX,
          currentY: btn.layoutY,
        });
      });
      setDraggingButtons(dragMap);

      // Store the button and offset, but don't set draggingButton yet
      // (wait for threshold to be crossed)
      setDraggingButton(button);
      setDragOffset({
        x: canvasPos.x - button.layoutX,
        y: canvasPos.y - button.layoutY,
      });
      dragStartScale.current = viewport.scale; // Store scale at drag start
      setActuallyDragging(false);
    },
    [mode, viewport, board, selectedButtonIds],
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      // Handle mouse pan (works in both layout and play modes)
      if (mousePan.isPanning) {
        const deltaX = e.clientX - mousePan.startX;
        const deltaY = e.clientY - mousePan.startY;

        setViewport((prev) => ({
          ...prev,
          offsetX: mousePan.startOffsetX + deltaX,
          offsetY: mousePan.startOffsetY + deltaY,
        }));
        return;
      }

      // Layout mode only: marquee selection and button dragging
      if (mode !== "layout") return;

      // Handle marquee selection
      if (marquee) {
        const canvasPos = screenToCanvas(
          e.clientX,
          e.clientY,
          viewport,
          canvasRef.current,
        );
        setMarquee({
          ...marquee,
          endX: canvasPos.x,
          endY: canvasPos.y,
        });
        return;
      }

      // Handle button dragging
      if (!draggingButton || !board) return;

      // Check if we've moved past the drag threshold
      if (!actuallyDragging && dragStartPos.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < DRAG_THRESHOLD) {
          // Haven't moved far enough yet
          return;
        }

        // Crossed the threshold, now we're actually dragging
        // Set the flag immediately to prevent onClick from clearing selection
        // even if the user releases the mouse before the state update completes
        lastInteractionWasDrag.current = true;
        setActuallyDragging(true);
      }

      // Only update position if we're actually dragging
      if (actuallyDragging && draggingButtons.size > 0) {
        const canvasPos = screenToCanvas(
          e.clientX,
          e.clientY,
          viewport,
          canvasRef.current,
        );

        const newX = canvasPos.x - dragOffset.x;
        const newY = canvasPos.y - dragOffset.y;

        // Snap to fine grid (allows flexible positioning)
        const snappedX = snapToGrid(newX, GRID_SIZE);
        const snappedY = snapToGrid(newY, GRID_SIZE);

        // Calculate the delta from the original position of the main dragging button
        const mainButtonData = draggingButtons.get(draggingButton.id);
        if (!mainButtonData) return;

        const deltaX = snappedX - mainButtonData.originalX;
        const deltaY = snappedY - mainButtonData.originalY;

        // Update all dragging buttons with the same delta
        const newDraggingButtons = new Map(draggingButtons);
        draggingButtons.forEach((buttonData, buttonId) => {
          const newPosX = buttonData.originalX + deltaX;
          const newPosY = buttonData.originalY + deltaY;

          // Allow buttons to go beyond canvas bounds temporarily
          // Recalibration will bring them back on drag end
          newDraggingButtons.set(buttonId, {
            ...buttonData,
            currentX: newPosX,
            currentY: newPosY,
          });
        });

        setDraggingButtons(newDraggingButtons);

        // Update the main dragging button for compatibility
        setDraggingButton({
          ...draggingButton,
          layoutX: snappedX,
          layoutY: snappedY,
        });
      }
    },
    [
      draggingButton,
      mode,
      dragOffset,
      viewport,
      board,
      actuallyDragging,
      marquee,
      draggingButtons,
      mousePan,
      DRAG_THRESHOLD,
    ],
  );

  /**
   * Helper: Handle marquee selection end
   * Finds all buttons within the marquee rectangle and adds them to selection.
   * Calculates button intersection with the marquee using bounding box collision detection.
   *
   * @returns {boolean} True if marquee selection was processed, false if no marquee exists
   */
  const handleMarqueeSelectionEnd = useCallback(() => {
    if (!board || !marquee) return false;

    // Calculate the marquee rectangle (normalized)
    const minX = Math.min(marquee.startX, marquee.endX);
    const maxX = Math.max(marquee.startX, marquee.endX);
    const minY = Math.min(marquee.startY, marquee.endY);
    const maxY = Math.max(marquee.startY, marquee.endY);

    // Find all buttons that intersect with the marquee
    const buttonsInMarquee = board.buttons.filter(
      (button: LookBoardButton) => {
        const buttonRight =
          button.layoutX + (button.width || DEFAULT_BUTTON_WIDTH);
        const buttonBottom =
          button.layoutY + (button.height || DEFAULT_BUTTON_HEIGHT);

        const intersects = !(
          button.layoutX > maxX ||
          buttonRight < minX ||
          button.layoutY > maxY ||
          buttonBottom < minY
        );

        return intersects;
      },
    );

    // Add these buttons to selection (don't replace)
    setSelectedButtonIds((prev) => {
      const newSet = new Set(prev);
      buttonsInMarquee.forEach((button: LookBoardButton) => {
        newSet.add(button.id);
      });
      return newSet;
    });

    // Mark that we just completed a marquee selection
    lastInteractionWasDrag.current = true;

    // Clear marquee
    setMarquee(null);
    marqueeStartCanvas.current = null; // Reset ref (not in deps - refs don't trigger re-renders)
    return true;
  }, [board, marquee, setSelectedButtonIds, setMarquee]);

  /**
   * Helper: Handle button drag end with recalibration
   * Saves button positions after drag, applying recalibration if needed.
   * Attempts to recalibrate coordinates to normalize positions (leftmost at X=0, topmost at Y=0)
   * when buttons are out of bounds or have drifted significantly. If recalibration fails
   * (buttons too spread out), clamps positions to canvas bounds instead.
   * Applies viewport compensation after recalibration to keep buttons visually stable.
   *
   * @returns {boolean} True if button drag was processed, false if no drag operation exists
   */
  const handleButtonDragEnd = useCallback(() => {
    if (!draggingButton || !actuallyDragging || draggingButtons.size === 0) {
      return false;
    }

    lastInteractionWasDrag.current = true;

    // Build complete button positions list for recalibration
    const allButtonPositions: ButtonPosition[] =
      board?.buttons.map((btn: LookBoardButton) => {
        const draggingData = draggingButtons.get(btn.id);
        return {
          buttonId: btn.id,
          layoutX: draggingData ? draggingData.currentX : btn.layoutX,
          layoutY: draggingData ? draggingData.currentY : btn.layoutY,
          width: btn.width ?? DEFAULT_BUTTON_WIDTH,
          height: btn.height ?? DEFAULT_BUTTON_HEIGHT,
        };
      }) || [];

    // Check if recalibration is needed
    const recalibrationResult = recalibrateButtonPositions(
      allButtonPositions,
      board?.canvasWidth || DEFAULT_CANVAS_WIDTH,
      board?.canvasHeight || DEFAULT_CANVAS_HEIGHT,
    );

    if (!recalibrationResult) {
      // Buttons don't fit even with recalibration - clamp and save
      const canvasWidth = board?.canvasWidth || DEFAULT_CANVAS_WIDTH;
      const canvasHeight = board?.canvasHeight || DEFAULT_CANVAS_HEIGHT;

      const clampedPositions = Array.from(draggingButtons.entries()).map(
        ([buttonId, buttonData]) => {
          const btn = board?.buttons.find(
            (b: LookBoardButton) => b.id === buttonId,
          );
          const width = btn?.width ?? DEFAULT_BUTTON_WIDTH;
          const height = btn?.height ?? DEFAULT_BUTTON_HEIGHT;

          return {
            buttonId,
            layoutX: Math.max(
              0,
              Math.min(buttonData.currentX, canvasWidth - width),
            ),
            layoutY: Math.max(
              0,
              Math.min(buttonData.currentY, canvasHeight - height),
            ),
          };
        },
      );

      updatePositions({
        variables: { positions: clampedPositions },
        optimisticResponse: { updateLookBoardButtonPositions: true },
      });
    } else {
      // Apply viewport compensation if recalibration occurred
      if (recalibrationResult.needsRecalibration) {
        setViewport((prev) => ({
          ...prev,
          offsetX: prev.offsetX - recalibrationResult.offsetX * dragStartScale.current,
          offsetY: prev.offsetY - recalibrationResult.offsetY * dragStartScale.current,
        }));
      }

      // Determine which positions to update
      const positions = recalibrationResult.needsRecalibration
        ? recalibrationResult.positions.map((pos) => ({
            buttonId: pos.buttonId,
            layoutX: pos.layoutX,
            layoutY: pos.layoutY,
          }))
        : Array.from(draggingButtons.entries()).map(
            ([buttonId, buttonData]) => ({
              buttonId,
              layoutX: buttonData.currentX,
              layoutY: buttonData.currentY,
            }),
          );

      // Save positions with cache update
      updatePositions({
        variables: { positions },
        optimisticResponse: { updateLookBoardButtonPositions: true },
        update: (cache) => {
          const existingData = cache.readQuery<{ lookBoard: typeof board }>({
            query: GET_LOOK_BOARD,
            variables: { id: boardId },
          });

          if (existingData?.lookBoard) {
            const positionsMap = new Map(
              positions.map((p) => [p.buttonId, { x: p.layoutX, y: p.layoutY }]),
            );

            cache.writeQuery({
              query: GET_LOOK_BOARD,
              variables: { id: boardId },
              data: {
                lookBoard: {
                  ...existingData.lookBoard,
                  buttons: existingData.lookBoard.buttons.map(
                    (btn: LookBoardButton) => {
                      const newPos = positionsMap.get(btn.id);
                      return newPos
                        ? { ...btn, layoutX: newPos.x, layoutY: newPos.y }
                        : btn;
                    },
                  ),
                },
              },
            });
          }
        },
      });
    }

    return true;
  }, [
    draggingButton,
    actuallyDragging,
    draggingButtons,
    board,
    updatePositions,
    boardId,
    setViewport,
  ]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    // Stop mouse pan (works in both layout and play modes)
    if (mousePan.isPanning) {
      setMousePan({
        isPanning: false,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0,
      });
      return;
    }

    // Layout mode only: handle marquee and button dragging end
    if (mode !== "layout") return;

    // Handle marquee selection end
    if (marquee) {
      if (!board) {
        setMarquee(null);
        return;
      }
      handleMarqueeSelectionEnd();
      return;
    }

    // Handle button dragging end
    if (!draggingButton) return;

    // Delegate to helper function for button drag handling
    handleButtonDragEnd();

    // Clear dragging state
    setDraggingButton(null);
    setDraggingButtons(new Map());
    setActuallyDragging(false);
    dragStartPos.current = null; // Reset ref (not in deps - refs don't trigger re-renders)
  }, [
    draggingButton,
    mode,
    marquee,
    board,
    mousePan,
    handleMarqueeSelectionEnd,
    handleButtonDragEnd,
    setMousePan,
    setMarquee,
    setDraggingButton,
    setDraggingButtons,
    setActuallyDragging,
  ]);

  // Handle look click (activate in play mode)
  const handleLookClick = useCallback(
    (button: LookBoardButton) => {
      if (mode === "play" && canPlayback) {
        // Activate the look
        activateLook({
          variables: {
            lookBoardId: boardId,
            lookId: button.look.id,
          },
        });
      }
    },
    [mode, boardId, activateLook, canPlayback],
  );

  // Track touch start time and position to differentiate taps from drags
  const touchStartRef = useRef<{
    time: number;
    x: number;
    y: number;
    button: LookBoardButton | null;
  }>({ time: 0, x: 0, y: 0, button: null });

  // Touch drag handlers (for mobile support)
  const handleTouchStartButton = useCallback(
    (e: React.TouchEvent, button: LookBoardButton) => {
      // Only handle single-finger touches on buttons
      if (e.touches.length !== 1) return;

      // Stop propagation to prevent canvas-level touch handlers from interfering
      e.stopPropagation();

      // Clear any canvas long-press state to prevent conflicts
      if (canvasLongPressTimer.current) {
        window.clearTimeout(canvasLongPressTimer.current);
        canvasLongPressTimer.current = null;
      }
      canvasLongPressStart.current = null;
      setCanvasLongPressActive(false);

      const touch = e.touches[0];

      // Record touch start for tap detection
      touchStartRef.current = {
        time: Date.now(),
        x: touch.clientX,
        y: touch.clientY,
        button,
      };

      // Start long-press timer for context menu
      if (mode === "layout") {
        startLongPress(touch.clientX, touch.clientY, button);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasPos = screenToCanvas(
          touch.clientX,
          touch.clientY,
          viewport,
          canvas,
        );

        // Record the start position for tap/drag detection
        dragStartPos.current = { x: touch.clientX, y: touch.clientY };
        lastInteractionWasDrag.current = false;

        // Check if this button is selected - if so, we'll drag all selected buttons
        const isSelected = selectedButtonIds.has(button.id);
        const buttonsToDrag = isSelected
          ? board.buttons.filter((b: LookBoardButton) =>
              selectedButtonIds.has(b.id),
            )
          : [button];

        // Initialize multi-button drag state
        const dragMap = new Map();
        buttonsToDrag.forEach((btn: LookBoardButton) => {
          dragMap.set(btn.id, {
            originalX: btn.layoutX,
            originalY: btn.layoutY,
            currentX: btn.layoutX,
            currentY: btn.layoutY,
          });
        });
        setDraggingButtons(dragMap);

        setDraggingButton(button);
        setDragOffset({
          x: canvasPos.x - button.layoutX,
          y: canvasPos.y - button.layoutY,
        });
        dragStartScale.current = viewport.scale; // Store scale at drag start
      }
    },
    [mode, viewport, startLongPress, selectedButtonIds, board],
  );

  const handleTouchMoveButton = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long-press if finger moves
      cancelLongPress();

      // If long-press was activated, don't allow dragging
      if (longPressActive) return;

      if (!draggingButton || mode !== "layout" || !canvasRef.current || !board)
        return;

      // If a second finger is added, end the drag operation
      if (e.touches.length !== 1) {
        handleDragEnd();
        return;
      }

      // Prevent scrolling while dragging and stop propagation to canvas
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];

      // Check if we've moved past the drag threshold
      if (!actuallyDragging && dragStartPos.current) {
        const dx = touch.clientX - dragStartPos.current.x;
        const dy = touch.clientY - dragStartPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < DRAG_THRESHOLD) {
          // Haven't moved far enough yet
          return;
        }

        // Crossed the threshold, now we're actually dragging
        // Set the flag immediately to prevent onClick from clearing selection
        // even if the user releases before the state update completes
        lastInteractionWasDrag.current = true;
        setActuallyDragging(true);
      }

      // Only update position if we're actually dragging
      if (!actuallyDragging) return;

      const canvasPos = screenToCanvas(
        touch.clientX,
        touch.clientY,
        viewport,
        canvasRef.current,
      );

      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;

      // Snap to fine grid (allows flexible positioning)
      const snappedX = snapToGrid(newX, GRID_SIZE);
      const snappedY = snapToGrid(newY, GRID_SIZE);

      // Update all dragging buttons if we're dragging multiple
      if (draggingButtons.size > 0) {
        // Calculate the delta from the original position of the main dragging button
        const mainButtonData = draggingButtons.get(draggingButton.id);
        if (!mainButtonData) return;

        const deltaX = snappedX - mainButtonData.originalX;
        const deltaY = snappedY - mainButtonData.originalY;

        // Update all dragging buttons with the same delta
        const newDraggingButtons = new Map(draggingButtons);
        draggingButtons.forEach((buttonData, buttonId) => {
          const newPosX = buttonData.originalX + deltaX;
          const newPosY = buttonData.originalY + deltaY;

          // Allow buttons to go beyond canvas bounds temporarily
          // Recalibration will bring them back on drag end
          newDraggingButtons.set(buttonId, {
            ...buttonData,
            currentX: newPosX,
            currentY: newPosY,
          });
        });

        setDraggingButtons(newDraggingButtons);
      }

      // Update the dragging button state to trigger re-render
      setDraggingButton({
        ...draggingButton,
        layoutX: snappedX,
        layoutY: snappedY,
      });
    },
    [
      draggingButton,
      mode,
      dragOffset,
      viewport,
      board,
      handleDragEnd,
      cancelLongPress,
      draggingButtons,
      longPressActive,
      actuallyDragging,
      DRAG_THRESHOLD,
    ],
  );

  const handleTouchEndButton = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long-press timer
      cancelLongPress();

      // Stop propagation to prevent canvas-level touch handlers from interfering
      e.stopPropagation();

      // If long-press was activated, don't process tap/drag
      if (longPressActive) {
        setDraggingButton(null);
        touchStartRef.current = { time: 0, x: 0, y: 0, button: null };
        return;
      }

      const touchStart = touchStartRef.current;
      const touchDuration = Date.now() - touchStart.time;

      // Get the end position from changedTouches (available in touchend)
      const touch = e.changedTouches[0];
      const movementX = touch ? Math.abs(touch.clientX - touchStart.x) : 0;
      const movementY = touch ? Math.abs(touch.clientY - touchStart.y) : 0;
      const totalMovement = Math.max(movementX, movementY);

      // Check if this was a tap (short duration AND minimal movement)
      const isTap =
        touchDuration < TAP_THRESHOLD_TIME &&
        totalMovement < TAP_MOVEMENT_THRESHOLD;

      // For play mode, we want to activate the look on tap
      if (mode === "play" && touchStart.button) {
        if (isTap) {
          handleLookClick(touchStart.button);
        }
      } else if (mode === "layout") {
        if (isTap && touchStart.button) {
          // In layout mode, tap selects the button (single selection, clears others)
          selectSingleButton(touchStart.button.id);
        } else {
          // Complete the drag if there was one
          handleDragEnd();
        }
      }

      // Reset touch start ref
      touchStartRef.current = { time: 0, x: 0, y: 0, button: null };
    },
    [
      handleDragEnd,
      handleLookClick,
      mode,
      cancelLongPress,
      longPressActive,
      selectSingleButton,
    ],
  );

  // Touch gesture handlers for pinch-to-zoom, two-finger pan, and single-finger pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Always reset canvas long-press state at start of new touch
      if (canvasLongPressTimer.current) {
        window.clearTimeout(canvasLongPressTimer.current);
        canvasLongPressTimer.current = null;
      }
      canvasLongPressStart.current = null;
      setCanvasLongPressActive(false);

      if (e.touches.length === 2) {
        // Two-finger gesture: pinch-to-zoom and pan

        // End any single-finger pan in progress
        setSingleFingerPan({
          isPanning: false,
          startX: 0,
          startY: 0,
          startOffsetX: 0,
          startOffsetY: 0,
        });

        // Prevent default browser behavior for two-finger gestures
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate initial distance for zoom
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        // Calculate midpoint in viewport coordinates
        const viewportMidpoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        // Get stable canvas rect for this gesture
        const canvasRect = canvas.getBoundingClientRect();

        // Convert to canvas-relative coordinates
        const midpoint = {
          x: viewportMidpoint.x - canvasRect.left,
          y: viewportMidpoint.y - canvasRect.top,
        };

        setTouchState({
          initialDistance: distance,
          initialScale: viewport.scale,
          initialMidpoint: midpoint,
          initialViewportMidpoint: viewportMidpoint, // Store viewport coords for pan tracking
          initialOffset: { x: viewport.offsetX, y: viewport.offsetY },
          canvasRect: canvasRect, // Store canvas rect for stable coordinate space
        });
      } else if (e.touches.length === 1) {
        // Single-finger touch on the canvas (not on a button)
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Prevent default to stop text selection
        e.preventDefault();

        // Get canvas coordinates for marquee selection
        const canvasPos = screenToCanvas(
          touch.clientX,
          touch.clientY,
          viewport,
          canvas,
        );

        // Start long-press timer for context menu or marquee selection (layout mode only)
        if (mode === "layout") {
          canvasLongPressStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            canvasX: canvasPos.x,
            canvasY: canvasPos.y,
          };

          canvasLongPressTimer.current = window.setTimeout(() => {
            setCanvasLongPressActive(true);
            // Trigger haptic feedback if available
            if ("vibrate" in navigator) {
              navigator.vibrate(50);
            }
          }, 500);
        }

        // Also start panning state (will be used if they move before long-press)
        setSingleFingerPan({
          isPanning: true,
          startX: touch.clientX,
          startY: touch.clientY,
          startOffsetX: viewport.offsetX,
          startOffsetY: viewport.offsetY,
        });
      }
    },
    [viewport, mode],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (
        e.touches.length === 2 &&
        touchState.initialDistance &&
        touchState.initialMidpoint &&
        touchState.canvasRect &&
        touchState.initialViewportMidpoint
      ) {
        // Two-finger gesture: pinch-to-zoom and pan
        // Prevent default browser behavior during two-finger gestures
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate current distance for zoom
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        // Calculate current midpoint in viewport coordinates
        const currentViewportMidpoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        // Calculate how much the midpoint has moved in viewport coordinates
        const viewportDeltaX =
          currentViewportMidpoint.x - touchState.initialViewportMidpoint.x;
        const viewportDeltaY =
          currentViewportMidpoint.y - touchState.initialViewportMidpoint.y;

        // Calculate new scale from pinch gesture
        const scaleChange = currentDistance / touchState.initialDistance;
        const newScale = clamp(
          touchState.initialScale * scaleChange,
          MIN_ZOOM,
          MAX_ZOOM,
        );

        // Find which canvas point is under the initial midpoint
        const canvasX =
          (touchState.initialMidpoint.x - touchState.initialOffset.x) /
          touchState.initialScale;
        const canvasY =
          (touchState.initialMidpoint.y - touchState.initialOffset.y) /
          touchState.initialScale;

        // Keep that canvas point centered on the initial midpoint during zoom
        let newOffsetX = touchState.initialMidpoint.x - canvasX * newScale;
        let newOffsetY = touchState.initialMidpoint.y - canvasY * newScale;

        // Apply pan if midpoint has moved significantly (mobile two-finger pan)
        // Use a threshold to ignore small trackpad drift
        const PAN_THRESHOLD = 5; // pixels
        const panDistance = Math.hypot(viewportDeltaX, viewportDeltaY);

        if (panDistance > PAN_THRESHOLD) {
          // Apply the viewport delta as-is (already in correct coordinate space)
          newOffsetX += viewportDeltaX;
          newOffsetY += viewportDeltaY;
        }

        setViewport({
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      } else if (e.touches.length === 1) {
        e.preventDefault();

        const touch = e.touches[0];
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Check if we should cancel long-press timer (user moved before it completed)
        if (canvasLongPressTimer.current && canvasLongPressStart.current) {
          const dx = touch.clientX - canvasLongPressStart.current.x;
          const dy = touch.clientY - canvasLongPressStart.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // If moved more than 10px, cancel long-press and do normal pan
          if (distance > 10) {
            window.clearTimeout(canvasLongPressTimer.current);
            canvasLongPressTimer.current = null;
          }
        }

        // If long-press is active, start or continue marquee selection
        if (
          canvasLongPressActive &&
          canvasLongPressStart.current &&
          mode === "layout"
        ) {
          const canvasPos = screenToCanvas(
            touch.clientX,
            touch.clientY,
            viewport,
            canvas,
          );

          // If marquee not started yet, check if moved enough to start it
          if (!marquee) {
            const dx = touch.clientX - canvasLongPressStart.current.x;
            const dy = touch.clientY - canvasLongPressStart.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Start marquee if moved at least 10px after long-press
            if (distance > 10) {
              setMarquee({
                startX: canvasLongPressStart.current.canvasX,
                startY: canvasLongPressStart.current.canvasY,
                endX: canvasPos.x,
                endY: canvasPos.y,
                isTouch: true, // Touch marquee
              });
              marqueeStartCanvas.current = {
                x: canvasLongPressStart.current.canvasX,
                y: canvasLongPressStart.current.canvasY,
              };
            }
          } else {
            // Update marquee end position
            setMarquee({
              ...marquee,
              endX: canvasPos.x,
              endY: canvasPos.y,
            });
          }
        } else if (
          singleFingerPan.isPanning &&
          !canvasLongPressActive &&
          !draggingButton
        ) {
          // Normal single-finger pan (no long-press active, not dragging a button)
          const deltaX = touch.clientX - singleFingerPan.startX;
          const deltaY = touch.clientY - singleFingerPan.startY;

          setViewport((prev) => ({
            ...prev,
            offsetX: singleFingerPan.startOffsetX + deltaX,
            offsetY: singleFingerPan.startOffsetY + deltaY,
          }));
        }
      }
    },
    [
      touchState,
      singleFingerPan,
      canvasLongPressActive,
      mode,
      marquee,
      viewport,
      draggingButton,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    // Check if this was a quick tap (not a long-press, not a marquee)
    const wasTap =
      !canvasLongPressActive && !marquee && canvasLongPressStart.current;

    // If long-press was active and no marquee started, show context menu
    if (
      canvasLongPressActive &&
      !marquee &&
      canvasLongPressStart.current &&
      mode === "layout"
    ) {
      setContextMenu({
        x: canvasLongPressStart.current.x,
        y: canvasLongPressStart.current.y,
        type: "canvas",
      });
    } else if (wasTap && mode === "layout" && selectedButtonIds.size > 0) {
      // Quick tap on empty canvas clears selection
      clearButtonSelection();
    }

    // If marquee was active, complete the selection (handleDragEnd will do this)
    if (marquee) {
      handleDragEnd();
    }

    // Clear canvas long-press timer and state
    if (canvasLongPressTimer.current) {
      window.clearTimeout(canvasLongPressTimer.current);
      canvasLongPressTimer.current = null;
    }
    canvasLongPressStart.current = null;
    setCanvasLongPressActive(false);

    // Reset two-finger gesture state
    setTouchState({
      initialDistance: null,
      initialScale: viewport.scale,
      initialMidpoint: null,
      initialViewportMidpoint: null,
      initialOffset: { x: viewport.offsetX, y: viewport.offsetY },
      canvasRect: null,
    });

    // Reset single-finger pan state
    setSingleFingerPan({
      isPanning: false,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
    });
  }, [
    viewport.scale,
    viewport.offsetX,
    viewport.offsetY,
    canvasLongPressActive,
    marquee,
    mode,
    handleDragEnd,
    selectedButtonIds,
    clearButtonSelection,
  ]);

  // Set initial zoom to fit on mount or when board ID changes
  useEffect(() => {
    if (
      board &&
      board.buttons.length > 0 &&
      board.id !== autoZoomedBoardId.current
    ) {
      // Use a small delay to ensure canvas dimensions are available
      const timer = setTimeout(() => {
        zoomToFit();
        autoZoomedBoardId.current = board.id;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [board, zoomToFit]); // Run when board or zoomToFit changes

  // Add document-level mouseup listener to handle marquee selection completion
  // This ensures selection completes even when releasing over a button
  // Listener must be always active (not conditional) to avoid timing issues
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [handleDragEnd]);

  // Add native touch event listeners with passive: false to prevent browser handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeTouchStart = (e: TouchEvent) => {
      // Handle both single-finger (pan) and two-finger (pinch-zoom) gestures
      if (e.touches.length >= 1) {
        // Only prevent default for canvas background touches, not button touches
        // The button touch handlers will stop propagation
        handleTouchStart(e as unknown as React.TouchEvent);
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      // Handle both single-finger pan and two-finger pinch-zoom
      if (e.touches.length >= 1) {
        e.preventDefault(); // Prevent scrolling during pan/zoom
        handleTouchMove(e as unknown as React.TouchEvent);
      }
    };

    const handleNativeTouchEnd = (_e: TouchEvent) => {
      handleTouchEnd();
    };

    // Add listeners with passive: false to allow preventDefault
    canvas.addEventListener("touchstart", handleNativeTouchStart, {
      passive: false,
    });
    canvas.addEventListener("touchmove", handleNativeTouchMove, {
      passive: false,
    });
    canvas.addEventListener("touchend", handleNativeTouchEnd, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("touchstart", handleNativeTouchStart);
      canvas.removeEventListener("touchmove", handleNativeTouchMove);
      canvas.removeEventListener("touchend", handleNativeTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Add wheel event listeners for Mac touchpad pinch-to-zoom and pan
  // Track zoom gesture state to keep zoom centered on cursor position
  const trackpadGestureRef = useRef<{
    isZooming: boolean;
    zoomCenter: {
      x: number;
      y: number;
      canvasX: number;
      canvasY: number;
    } | null;
    lastEventTime: number;
  }>({
    isZooming: false,
    zoomCenter: null,
    lastEventTime: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      const timeSinceLastEvent = now - trackpadGestureRef.current.lastEventTime;

      if (e.ctrlKey) {
        // Trackpad pinch-to-zoom gesture
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Reset gesture if it's been more than 200ms since last zoom event
        if (timeSinceLastEvent > 200 || !trackpadGestureRef.current.isZooming) {
          trackpadGestureRef.current.isZooming = true;
          const canvasX = (mouseX - viewport.offsetX) / viewport.scale;
          const canvasY = (mouseY - viewport.offsetY) / viewport.scale;
          trackpadGestureRef.current.zoomCenter = {
            x: mouseX,
            y: mouseY,
            canvasX,
            canvasY,
          };
        }

        trackpadGestureRef.current.lastEventTime = now;

        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.05 : 0.95;
        const newScale = clamp(viewport.scale * zoomFactor, MIN_ZOOM, MAX_ZOOM);

        const center = trackpadGestureRef.current.zoomCenter;
        if (!center) return;

        // Zoom toward the initial cursor position
        const newOffsetX = center.x - center.canvasX * newScale;
        const newOffsetY = center.y - center.canvasY * newScale;

        setViewport({
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      } else {
        // Two-finger scroll/pan (not zooming)
        trackpadGestureRef.current.isZooming = false;

        setViewport((prev) => ({
          ...prev,
          offsetX: prev.offsetX - e.deltaX / prev.scale,
          offsetY: prev.offsetY - e.deltaY / prev.scale,
        }));
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [viewport]);

  const handleRemoveLook = useCallback(
    (button: LookBoardButton) => {
      if (window.confirm(`Remove "${button.look.name}" from this board?`)) {
        removeLookFromBoard({
          variables: {
            buttonId: button.id,
          },
        });
      }
    },
    [removeLookFromBoard],
  );

  const toggleLookSelection = useCallback((lookId: string) => {
    setSelectedLookIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lookId)) {
        newSet.delete(lookId);
      } else {
        newSet.add(lookId);
      }
      return newSet;
    });
  }, []);

  const selectAllLooks = useCallback(() => {
    setSelectedLookIds(new Set(looksToAdd.map((s: { id: string }) => s.id)));
  }, [looksToAdd]);

  const deselectAllLooks = useCallback(() => {
    setSelectedLookIds(new Set());
  }, []);

  // Handle button click for selection (layout mode only)
  const handleButtonClick = useCallback(
    (e: React.MouseEvent, button: LookBoardButton) => {
      if (mode !== "layout") return;

      // Stop propagation FIRST so canvas click doesn't fire
      // (must be before early return to prevent event bubbling)
      e.stopPropagation();

      // Don't handle click if the last interaction was a drag
      if (lastInteractionWasDrag.current) {
        lastInteractionWasDrag.current = false;
        return;
      }

      // Check for multi-select modifiers
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        // Toggle selection
        toggleButtonSelection(button.id);
      } else {
        // Single select (clear others)
        selectSingleButton(button.id);
      }
    },
    [mode, toggleButtonSelection, selectSingleButton],
  );

  // Handle canvas click to clear selection
  const handleCanvasClick = useCallback(
    (_e: React.MouseEvent) => {
      if (mode !== "layout") return;

      // Don't clear if we just finished a drag or marquee selection
      if (lastInteractionWasDrag.current) {
        lastInteractionWasDrag.current = false;
        return;
      }

      // Don't clear if we're actively dragging a marquee
      if (marquee) return;

      // Only clear selection if clicking directly on the canvas, not on a button
      // Buttons will stopPropagation, so this only fires for empty canvas clicks
      if (selectedButtonIds.size > 0) {
        clearButtonSelection();
      }
    },
    [mode, selectedButtonIds, marquee, clearButtonSelection],
  );

  // Handle canvas mouse down for marquee selection or panning
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // In layout mode with Shift key: start marquee selection
      if (mode === "layout" && e.shiftKey) {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasPos = screenToCanvas(
          e.clientX,
          e.clientY,
          viewport,
          canvas,
        );
        marqueeStartCanvas.current = canvasPos;
        setMarquee({
          startX: canvasPos.x,
          startY: canvasPos.y,
          endX: canvasPos.x,
          endY: canvasPos.y,
          isTouch: false, // Mouse marquee
        });
        return;
      }

      // Otherwise: start canvas pan (works in both layout and play modes)
      // Left-click (button 0) or middle-click (button 1)
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        setMousePan({
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: viewport.offsetX,
          startOffsetY: viewport.offsetY,
        });
      }
    },
    [mode, viewport],
  );

  // Context menu handlers
  const handleButtonContextMenu = useCallback(
    (e: React.MouseEvent, button: LookBoardButton) => {
      if (mode !== "layout") return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: "button",
        button,
      });
    },
    [mode],
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "layout") return;
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: "canvas",
      });
    },
    [mode],
  );

  const dismissContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleAddLooks = useCallback(async () => {
    if (selectedLookIds.size === 0) {
      setErrorMessage("Please select at least one look");
      return;
    }

    if (!board) return;

    // Convert existing buttons to Rect format for collision detection
    const existingButtons: Rect[] = board.buttons.map(
      (b: LookBoardButton) => ({
        layoutX: b.layoutX,
        layoutY: b.layoutY,
        width: b.width || DEFAULT_BUTTON_WIDTH,
        height: b.height || DEFAULT_BUTTON_HEIGHT,
      }),
    );

    const lookIdsArray = Array.from(selectedLookIds);
    const positions: Array<{ lookId: string; x: number; y: number }> = [];
    const currentButtons = [...existingButtons];

    // Find positions for all selected looks using collision detection
    for (const lookId of lookIdsArray) {
      const availablePos = findAvailablePosition(
        currentButtons,
        board.canvasWidth,
        board.canvasHeight,
        DEFAULT_BUTTON_WIDTH,
        DEFAULT_BUTTON_HEIGHT,
        AUTO_PLACEMENT_GRID_SIZE,
        AUTO_PLACEMENT_PADDING,
      );

      if (availablePos) {
        positions.push({ lookId, x: availablePos.x, y: availablePos.y });
        // Mark this position as occupied for subsequent looks
        currentButtons.push({
          layoutX: availablePos.x,
          layoutY: availablePos.y,
          width: DEFAULT_BUTTON_WIDTH,
          height: DEFAULT_BUTTON_HEIGHT,
        });
      } else {
        // No available position found, use fallback (top-left with offset)
        // Fallback positioning uses a smaller grid to pack buttons tighter when canvas is full
        const FALLBACK_INITIAL_OFFSET = 100; // Starting position from top-left corner
        const FALLBACK_HORIZONTAL_STEP = 50; // Horizontal spacing between buttons
        const FALLBACK_VERTICAL_STEP = 150; // Vertical spacing between rows

        const fallbackX =
          FALLBACK_INITIAL_OFFSET +
          ((positions.length * FALLBACK_HORIZONTAL_STEP) %
            (board.canvasWidth - DEFAULT_BUTTON_WIDTH));
        const fallbackY =
          FALLBACK_INITIAL_OFFSET +
          Math.floor(
            (positions.length * FALLBACK_HORIZONTAL_STEP) /
              (board.canvasWidth - DEFAULT_BUTTON_WIDTH),
          ) *
            FALLBACK_VERTICAL_STEP;
        positions.push({ lookId, x: fallbackX, y: fallbackY });
      }
    }

    // Add all looks sequentially
    try {
      for (const { lookId, x, y } of positions) {
        await addLookToBoard({
          variables: {
            input: {
              lookBoardId: boardId,
              lookId,
              layoutX: x,
              layoutY: y,
            },
          },
        });
      }
      // Clear selection after all looks are added
      setSelectedLookIds(new Set());
    } catch (error) {
      console.error("Error adding looks:", error);
    }
  }, [selectedLookIds, board, boardId, addLookToBoard]);

  const handleSaveSettings = useCallback(() => {
    // Validate inputs
    if (!editedName.trim()) {
      setErrorMessage("Please enter a board name");
      return;
    }

    // Parse fade time - empty string defaults to 0
    const fadeTime =
      editedFadeTime === "" ? 0 : parseFloat(editedFadeTime);
    if (isNaN(fadeTime) || fadeTime < 0) {
      setErrorMessage("Fade time must be a valid number 0 or greater");
      return;
    }

    // Parse canvas width
    const canvasWidth =
      editedCanvasWidth === ""
        ? DEFAULT_CANVAS_WIDTH
        : parseInt(editedCanvasWidth, 10);
    if (isNaN(canvasWidth) || canvasWidth < 1000 || canvasWidth > 10000) {
      setErrorMessage("Canvas width must be between 1000 and 10000 pixels");
      return;
    }

    // Parse canvas height
    const canvasHeight =
      editedCanvasHeight === ""
        ? DEFAULT_CANVAS_HEIGHT
        : parseInt(editedCanvasHeight, 10);
    if (isNaN(canvasHeight) || canvasHeight < 1000 || canvasHeight > 10000) {
      setErrorMessage("Canvas height must be between 1000 and 10000 pixels");
      return;
    }

    updateBoard({
      variables: {
        id: boardId,
        input: {
          name: editedName,
          defaultFadeTime: fadeTime,
          canvasWidth: canvasWidth,
          canvasHeight: canvasHeight,
        },
      },
    });
  }, [
    boardId,
    editedName,
    editedFadeTime,
    editedCanvasWidth,
    editedCanvasHeight,
    updateBoard,
  ]);

  const openEditSettings = useCallback(() => {
    setEditedName(board?.name || "");
    setEditedFadeTime((board?.defaultFadeTime ?? 3).toString());
    setEditedCanvasWidth(
      (board?.canvasWidth || DEFAULT_CANVAS_WIDTH).toString(),
    );
    setEditedCanvasHeight(
      (board?.canvasHeight || DEFAULT_CANVAS_HEIGHT).toString(),
    );
    setIsEditingSettings(true);
  }, [board]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">
          Loading look board...
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded dark:bg-red-900/20 dark:text-red-400 dark:border dark:border-red-800">
        Error loading look board: {error?.message || "Board not found"}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-100 border-b border-red-200 px-6 py-3 flex items-center justify-between dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      {isFocusMode ? (
        /* Minimal Focus Mode Header */
        <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-3 py-2 flex items-center gap-3">
          <button
            onClick={() => router.push("/look-board")}
            className="text-gray-300 hover:text-white shrink-0 text-2xl"
            aria-label="Back to look boards"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-white truncate flex-1">
            {board.name}
          </h1>
          <button
            onClick={exitFocusMode}
            className="text-gray-300 hover:text-white shrink-0 p-1"
            aria-label="Exit focus mode"
            title="Exit focus mode (ESC)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        /* Normal Header - Compact on mobile, two-row on desktop */
        <div className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
          {/* Row 1: Title and Mode Toggle */}
          <div className="px-3 py-2 md:px-6 md:py-3 flex items-center justify-between">
            {/* Left side - Back button and title */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push("/look-board")}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shrink-0"
                aria-label="Back to look boards"
              >
                ←
              </button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold dark:text-white truncate">
                  {board.name}
                </h1>
                <p className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
                  {board.buttons.length} looks • Fade: {board.defaultFadeTime}s
                </p>
              </div>
            </div>

            {/* Right side - Mode toggle (desktop) */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => setMode("play")}
                className={`px-4 py-2 rounded-l ${
                  mode === "play"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Play Mode
              </button>
              <button
                onClick={() => setMode("layout")}
                disabled={!canEditContent}
                className={`px-4 py-2 rounded-r ${
                  mode === "layout"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                } ${!canEditContent ? "opacity-50 cursor-not-allowed" : ""}`}
                title={canEditContent ? "Switch to Layout Mode to edit" : "Editing disabled in Watcher mode"}
              >
                Layout Mode
              </button>
            </div>

            {/* Hamburger menu - mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shrink-0"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Row 2: Action buttons (desktop only) */}
          <div className="hidden md:flex items-center gap-2 px-6 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={enterFocusMode}
              className="px-3 py-1.5 border rounded hover:bg-white text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              title="Enter focus mode (full screen)"
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span className="text-sm">Focus</span>
            </button>
            <button
              onClick={zoomToFit}
              className="px-3 py-1.5 border rounded hover:bg-white text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              title="Zoom to fit all looks"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
              <span className="text-sm">Fit</span>
            </button>
            <button
              onClick={openEditSettings}
              className="px-3 py-1.5 border rounded hover:bg-white text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 text-sm"
            >
              Settings
            </button>
            <button
              onClick={() => setIsAddLookModalOpen(true)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 dark:disabled:opacity-50"
              disabled={mode === "play"}
              aria-disabled={mode === "play"}
              aria-label={mode === "play" ? "Add Look (disabled in Play Mode)" : "Add Look"}
              title={mode === "play" ? "Switch to Layout Mode to add looks" : "Add looks to the board"}
            >
              + Add Look
            </button>
          </div>
        </div>
      )}

      {/* Mobile slide-in menu */}
      {mobileMenuOpen && !isFocusMode && (
        <div
          className="md:hidden fixed inset-0 z-50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div
            className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white dark:bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold dark:text-white">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu content */}
            <div className="p-4 space-y-4">
              {/* Board info */}
              <div className="pb-4 border-b dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {board.buttons.length} looks • Fade: {board.defaultFadeTime}s
                </p>
              </div>

              {/* Mode toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode
                </label>
                <div className="flex rounded overflow-hidden">
                  <button
                    onClick={() => {
                      setMode("play");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      mode === "play"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Play Mode
                  </button>
                  <button
                    onClick={() => {
                      setMode("layout");
                      setMobileMenuOpen(false);
                    }}
                    disabled={!canEditContent}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      mode === "layout"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    } ${!canEditContent ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Layout Mode
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    enterFocusMode();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-left flex items-center gap-2"
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
                  Enter Focus Mode
                </button>

                <button
                  onClick={() => {
                    zoomToFit();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 text-left flex items-center gap-2"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                  Zoom to Fit
                </button>

                <button
                  onClick={() => {
                    setIsAddLookModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-left"
                  disabled={mode === "play"}
                >
                  + Add Look
                </button>
                {mode === "play" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    Switch to Layout Mode to add looks
                  </p>
                )}

                <button
                  onClick={() => {
                    openEditSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 text-left"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="absolute inset-0"
          style={{ touchAction: "none" }}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleDragMove}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={handleCanvasContextMenu}
        >
          {/* Transformed canvas container */}
          <div
            style={{
              transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
              width: `${board.canvasWidth}px`,
              height: `${board.canvasHeight}px`,
              position: "relative",
            }}
          >
            {/* Grid overlay in layout mode */}
            {mode === "layout" && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                }}
              />
            )}

            {board.buttons.map((button: LookBoardButton) => {
              // Check if this button is being dragged (either as main button or part of multi-drag)
              const draggingData = draggingButtons.get(button.id);
              const isDragging = draggingData !== undefined;

              // Use dragging position if available, otherwise use button's current position
              const layoutX = isDragging
                ? draggingData.currentX
                : button.layoutX;
              const layoutY = isDragging
                ? draggingData.currentY
                : button.layoutY;

              const left = `${layoutX}px`;
              const top = `${layoutY}px`;
              const width = `${button.width || DEFAULT_BUTTON_WIDTH}px`;
              const height = `${button.height || DEFAULT_BUTTON_HEIGHT}px`;
              const isSelected = selectedButtonIds.has(button.id);

              return (
                <div
                  key={button.id}
                  className={`absolute select-none ${
                    mode === "play" ? "cursor-pointer" : "cursor-move"
                  } ${isDragging ? "opacity-75 z-50" : ""}`}
                  style={{
                    left,
                    top,
                    width,
                    height,
                  }}
                  onMouseDown={(e) => handleDragStart(e, button)}
                  onContextMenu={(e) => handleButtonContextMenu(e, button)}
                  onTouchStart={(e) => handleTouchStartButton(e, button)}
                  onTouchMove={handleTouchMoveButton}
                  onTouchEnd={handleTouchEndButton}
                  {...(mode === "play"
                    ? {
                        onClick: () => handleLookClick(button),
                        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleLookClick(button);
                          }
                        },
                      }
                    : {
                        onClick: (e) => handleButtonClick(e, button),
                      })}
                  role="button"
                  tabIndex={0}
                  aria-label={`${mode === "play" ? "Activate" : "Drag"} look ${button.look.name}`}
                >
                  <div
                    className={`h-full rounded-lg flex items-center justify-center p-4 transition-all ${
                      mode === "play"
                        ? "bg-blue-600 border-2 border-blue-400 hover:bg-blue-500 hover:scale-105"
                        : isSelected
                          ? "bg-gray-700 border-4 border-blue-500 hover:bg-gray-600 shadow-lg shadow-blue-500/50"
                          : "bg-gray-700 border-2 border-gray-500 hover:bg-gray-600"
                    }`}
                    style={
                      button.color ? { backgroundColor: button.color } : {}
                    }
                  >
                    <div className="text-center">
                      <div
                        className="font-semibold text-lg"
                        style={
                          button.color
                            ? { color: getContrastingTextColor(button.color) }
                            : { color: '#f5f5f5' }
                        }
                      >
                        {button.label || button.look.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Marquee selection rectangle */}
            {marquee && mode === "layout" && (
              <div
                className={`absolute border-2 pointer-events-none ${
                  marquee.isTouch
                    ? "border-green-400 bg-green-400 bg-opacity-20"
                    : "border-blue-400 bg-blue-400 bg-opacity-20"
                }`}
                style={{
                  left: `${Math.min(marquee.startX, marquee.endX)}px`,
                  top: `${Math.min(marquee.startY, marquee.endY)}px`,
                  width: `${Math.abs(marquee.endX - marquee.startX)}px`,
                  height: `${Math.abs(marquee.endY - marquee.startY)}px`,
                }}
              />
            )}

            {board.buttons.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-xl mb-4">No looks on this board yet</p>
                  <button
                    onClick={() => setIsAddLookModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Your First Look
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode indicator */}
      {!isFocusMode && (
        <div className="bg-gray-800 text-white px-6 py-2 text-sm">
          {mode === "play" ? (
            <span>
              🎮 Play Mode - Tap looks to activate • Drag to pan • Pinch to
              zoom
            </span>
          ) : (
            <span>
              ✏️ Layout Mode - Drag looks to reposition (snaps to {GRID_SIZE}px
              grid) • Drag canvas to pan • Pinch to zoom
            </span>
          )}
        </div>
      )}

      {/* Add Look Modal */}
      {isAddLookModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsAddLookModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-look-modal-title"
          >
            <h2
              id="add-look-modal-title"
              className="text-2xl font-bold mb-4 dark:text-white"
            >
              Add Looks to Board
            </h2>
            {looksToAdd.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                All looks are already on this board!
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium dark:text-gray-300">
                      Select Looks ({selectedLookIds.size} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllLooks}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllLooks}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="border dark:border-gray-600 rounded max-h-96 overflow-y-auto bg-white dark:bg-gray-700">
                    {looksToAdd.map((look: { id: string; name: string }) => (
                      <label
                        key={look.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b last:border-b-0 dark:border-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLookIds.has(look.id)}
                          onChange={() => toggleLookSelection(look.id)}
                          className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm dark:text-white">
                          {look.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddLookModalOpen(false);
                      setSelectedLookIds(new Set());
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLooks}
                    disabled={selectedLookIds.size === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add{" "}
                    {selectedLookIds.size > 0
                      ? `${selectedLookIds.size} `
                      : ""}
                    Look{selectedLookIds.size !== 1 ? "s" : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Settings Modal */}
      {isEditingSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsEditingSettings(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="board-settings-modal-title"
          >
            <h2
              id="board-settings-modal-title"
              className="text-2xl font-bold mb-4 dark:text-white"
            >
              Board Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Board Name
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Default Fade Time (seconds)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editedFadeTime}
                  onChange={(e) => setEditedFadeTime(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Canvas Width (pixels)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editedCanvasWidth}
                  onChange={(e) => setEditedCanvasWidth(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder={DEFAULT_CANVAS_WIDTH.toString()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Canvas Height (pixels)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editedCanvasHeight}
                  onChange={(e) => setEditedCanvasHeight(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder={DEFAULT_CANVAS_HEIGHT.toString()}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsEditingSettings(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={
            contextMenu.type === "button" && contextMenu.button
              ? [
                  {
                    label: "Remove",
                    onClick: () => handleRemoveLook(contextMenu.button!),
                    className:
                      "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                    icon: (
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    ),
                  },
                ]
              : [
                  {
                    label: "Add Looks...",
                    onClick: () => setIsAddLookModalOpen(true),
                    icon: (
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Select All",
                    onClick: selectAllButtons,
                    icon: (
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Rename Board",
                    onClick: openEditSettings,
                    icon: (
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    ),
                  },
                ]
          }
          onDismiss={dismissContextMenu}
        />
      )}

      {/* Effects Panel - Available in Play mode */}
      {mode === "play" && currentProject?.id && (
        <EffectsPanel
          projectId={currentProject.id}
          position="right"
          defaultCollapsed={true}
        />
      )}
    </div>
  );
}
