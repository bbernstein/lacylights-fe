"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SCENE_BOARD,
  UPDATE_SCENE_BOARD,
  ACTIVATE_SCENE_FROM_BOARD,
  UPDATE_SCENE_BOARD_BUTTON_POSITIONS,
  ADD_SCENE_TO_BOARD,
  REMOVE_SCENE_FROM_BOARD,
} from "@/graphql/sceneBoards";
import { GET_PROJECT_SCENES } from "@/graphql/scenes";
import { useProject } from "@/contexts/ProjectContext";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { SceneBoardButton } from "@/types";
import {
  screenToCanvas,
  clamp,
  snapToGrid,
  findAvailablePosition,
  Rect,
} from "@/lib/canvasUtils";
import ContextMenu from "@/components/ContextMenu";

// Grid configuration
const GRID_SIZE = 10; // Fine grid for flexible button placement
const AUTO_PLACEMENT_GRID_SIZE = 250; // Grid step for auto-placement (matches findAvailablePosition gridStep)
const AUTO_PLACEMENT_PADDING = 20; // Grid offset for auto-placement (matches findAvailablePosition padding)
const MIN_ZOOM = 0.2; // Allow zooming out to 20% for fitting many buttons on mobile
const MAX_ZOOM = 3.0;
const DEFAULT_BUTTON_WIDTH = 200;
const DEFAULT_BUTTON_HEIGHT = 120;

// Touch gesture thresholds
const TAP_THRESHOLD_TIME = 300; // ms - max time for a tap
const TAP_MOVEMENT_THRESHOLD = 10; // pixels - max movement for a tap

interface SceneBoardClientProps {
  id: string;
}

export default function SceneBoardClient({ id }: SceneBoardClientProps) {
  const router = useRouter();
  const boardId =
    id === "__dynamic__"
      ? typeof window !== "undefined"
        ? window.location.pathname.split("/").pop() || ""
        : ""
      : id;
  const { currentProject } = useProject();
  const { isFocusMode, enterFocusMode, exitFocusMode } = useFocusMode();

  const [mode, setMode] = useState<"play" | "layout">("play");
  const [isAddSceneModalOpen, setIsAddSceneModalOpen] = useState(false);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(
    new Set(),
  );
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedFadeTime, setEditedFadeTime] = useState(3.0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selection state for multi-select (button IDs, not scene IDs)
  const [selectedButtonIds, setSelectedButtonIds] = useState<Set<string>>(
    new Set(),
  );

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "button" | "canvas";
    button?: SceneBoardButton;
  } | null>(null);

  // Long-press state for touch devices
  const longPressTimer = useRef<number | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);

  // Drag state
  const [draggingButton, setDraggingButton] = useState<SceneBoardButton | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

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

  const {
    data: boardData,
    loading,
    error,
    refetch,
  } = useQuery(GET_SCENE_BOARD, {
    variables: { id: boardId },
    skip: !boardId,
  });

  const { data: scenesData } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [updateBoard] = useMutation(UPDATE_SCENE_BOARD, {
    onCompleted: () => {
      refetch();
      setIsEditingSettings(false);
    },
    onError: (error) => {
      setErrorMessage(`Error updating board: ${error.message}`);
    },
  });

  const [activateScene] = useMutation(ACTIVATE_SCENE_FROM_BOARD, {
    onError: (error) => {
      setErrorMessage(`Error activating scene: ${error.message}`);
    },
  });

  const [updatePositions] = useMutation(UPDATE_SCENE_BOARD_BUTTON_POSITIONS, {
    onError: (error) => {
      setErrorMessage(`Error updating positions: ${error.message}`);
      // Refetch on error to revert to server state
      refetch();
    },
  });

  const [addSceneToBoard] = useMutation(ADD_SCENE_TO_BOARD, {
    onCompleted: () => {
      refetch();
      setIsAddSceneModalOpen(false);
      setSelectedSceneIds(new Set());
    },
    onError: (error) => {
      setErrorMessage(`Error adding scene: ${error.message}`);
    },
  });

  const [removeSceneFromBoard] = useMutation(REMOVE_SCENE_FROM_BOARD, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setErrorMessage(`Error removing scene: ${error.message}`);
    },
  });

  const board = boardData?.sceneBoard;

  // Memoize available scenes to avoid recalculating on every render
  const availableScenes = useMemo(
    () => scenesData?.project?.scenes || [],
    [scenesData?.project?.scenes],
  );

  // Memoize button IDs to avoid recalculating on every render
  const buttonsOnBoard = useMemo(
    () =>
      new Set(board?.buttons?.map((b: SceneBoardButton) => b.scene.id) || []),
    [board?.buttons],
  );

  const scenesToAdd = useMemo(
    () =>
      availableScenes.filter((s: { id: string }) => !buttonsOnBoard.has(s.id)),
    [availableScenes, buttonsOnBoard],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Escape key - Close modals or clear selection
      if (e.key === "Escape") {
        if (isAddSceneModalOpen) {
          e.preventDefault();
          setIsAddSceneModalOpen(false);
          setSelectedSceneIds(new Set());
        } else if (isEditingSettings) {
          e.preventDefault();
          setIsEditingSettings(false);
        } else if (mode === "layout" && selectedButtonIds.size > 0) {
          e.preventDefault();
          clearButtonSelection();
        }
        return;
      }

      // Don't handle other shortcuts if in input field or in play mode
      if (isInputField || mode === "play") return;

      // Select All (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAllButtons();
        return;
      }

      // Delete selected buttons (Delete or Backspace)
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedButtonIds.size > 0
      ) {
        e.preventDefault();
        const buttonIds = Array.from(selectedButtonIds);
        const buttons = board?.buttons.filter((b: SceneBoardButton) =>
          buttonIds.includes(b.id),
        );
        if (buttons && buttons.length > 0) {
          const message =
            buttons.length === 1
              ? `Remove "${buttons[0].scene.name}" from this board?`
              : `Remove ${buttons.length} scenes from this board?`;
          if (window.confirm(message)) {
            // Remove all selected buttons
            buttons.forEach((button: SceneBoardButton) => {
              removeSceneFromBoard({
                variables: { buttonId: button.id },
              });
            });
            clearButtonSelection();
          }
        }
        return;
      }

      // Zoom shortcuts
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

      // Nudge selected buttons with arrow keys
      if (
        selectedButtonIds.size > 0 &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const nudgeAmount = e.shiftKey ? 1 : 10; // Fine nudge with Shift
        const buttonIds = Array.from(selectedButtonIds);
        const buttons = board?.buttons.filter((b: SceneBoardButton) =>
          buttonIds.includes(b.id),
        );
        if (!buttons || buttons.length === 0) return;

        // Calculate new positions for all selected buttons
        const positions = buttons.map((button: SceneBoardButton) => {
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
            updateSceneBoardButtonPositions: true,
          },
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAddSceneModalOpen,
    isEditingSettings,
    mode,
    selectedButtonIds,
    board,
    clearButtonSelection,
    selectAllButtons,
    zoomToFit,
    removeSceneFromBoard,
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

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent, button: SceneBoardButton) => {
      if (mode !== "layout") return;
      e.stopPropagation();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport, canvas);

      setDraggingButton(button);
      setDragOffset({
        x: canvasPos.x - button.layoutX,
        y: canvasPos.y - button.layoutY,
      });
    },
    [mode, viewport],
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingButton || mode !== "layout" || !canvasRef.current || !board)
        return;

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

      // Update the dragging button state to trigger re-render
      setDraggingButton({
        ...draggingButton,
        layoutX: snappedX,
        layoutY: snappedY,
      });
    },
    [draggingButton, mode, dragOffset, viewport, board],
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!draggingButton || mode !== "layout") return;

    const newLayoutX = draggingButton.layoutX;
    const newLayoutY = draggingButton.layoutY;
    const buttonId = draggingButton.id;

    // Clear dragging state first so the position "sticks"
    setDraggingButton(null);

    // Save the new position to the server with optimistic update
    updatePositions({
      variables: {
        positions: [
          {
            buttonId,
            layoutX: newLayoutX,
            layoutY: newLayoutY,
          },
        ],
      },
      optimisticResponse: {
        updateSceneBoardButtonPositions: true,
      },
      update: (cache) => {
        // Update the cache immediately with the new position
        const existingData = cache.readQuery<{ sceneBoard: typeof board }>({
          query: GET_SCENE_BOARD,
          variables: { id: boardId },
        });

        if (existingData?.sceneBoard) {
          cache.writeQuery({
            query: GET_SCENE_BOARD,
            variables: { id: boardId },
            data: {
              sceneBoard: {
                ...existingData.sceneBoard,
                buttons: existingData.sceneBoard.buttons.map(
                  (btn: SceneBoardButton) =>
                    btn.id === buttonId
                      ? { ...btn, layoutX: newLayoutX, layoutY: newLayoutY }
                      : btn,
                ),
              },
            },
          });
        }
      },
    });
  }, [draggingButton, mode, updatePositions, boardId]);

  // Handle scene click (activate in play mode)
  const handleSceneClick = useCallback(
    (button: SceneBoardButton) => {
      if (mode === "play") {
        // Activate the scene
        activateScene({
          variables: {
            sceneBoardId: boardId,
            sceneId: button.scene.id,
          },
        });
      }
    },
    [mode, boardId, activateScene],
  );

  // Track touch start time and position to differentiate taps from drags
  const touchStartRef = useRef<{
    time: number;
    x: number;
    y: number;
    button: SceneBoardButton | null;
  }>({ time: 0, x: 0, y: 0, button: null });

  // Touch drag handlers (for mobile support)
  const handleTouchStartButton = useCallback(
    (e: React.TouchEvent, button: SceneBoardButton) => {
      // Only handle single-finger touches on buttons
      if (e.touches.length !== 1) return;

      // Stop propagation to prevent canvas-level touch handlers from interfering
      e.stopPropagation();

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

        setDraggingButton(button);
        setDragOffset({
          x: canvasPos.x - button.layoutX,
          y: canvasPos.y - button.layoutY,
        });
      }
    },
    [mode, viewport, startLongPress],
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

      // Prevent scrolling while dragging
      e.preventDefault();

      const touch = e.touches[0];
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
      longPressActive,
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

      // For play mode, we want to activate the scene on tap
      if (mode === "play" && touchStart.button) {
        if (isTap) {
          handleSceneClick(touchStart.button);
        }
      } else if (mode === "layout") {
        // In layout mode, complete the drag
        handleDragEnd();
      }

      // Reset touch start ref
      touchStartRef.current = { time: 0, x: 0, y: 0, button: null };
    },
    [handleDragEnd, handleSceneClick, mode, cancelLongPress, longPressActive],
  );

  // Touch gesture handlers for pinch-to-zoom, two-finger pan, and single-finger pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
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
        // Single-finger touch on the canvas (not on a button) - start panning
        // This is only triggered when touch starts directly on canvas, not on buttons
        const touch = e.touches[0];
        setSingleFingerPan({
          isPanning: true,
          startX: touch.clientX,
          startY: touch.clientY,
          startOffsetX: viewport.offsetX,
          startOffsetY: viewport.offsetY,
        });
      }
    },
    [viewport.scale, viewport.offsetX, viewport.offsetY],
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
      } else if (e.touches.length === 1 && singleFingerPan.isPanning) {
        // Single-finger pan on canvas
        e.preventDefault();

        const touch = e.touches[0];
        const deltaX = touch.clientX - singleFingerPan.startX;
        const deltaY = touch.clientY - singleFingerPan.startY;

        setViewport((prev) => ({
          ...prev,
          offsetX: singleFingerPan.startOffsetX + deltaX,
          offsetY: singleFingerPan.startOffsetY + deltaY,
        }));
      }
    },
    [touchState, singleFingerPan],
  );

  const handleTouchEnd = useCallback(() => {
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
  }, [viewport.scale, viewport.offsetX, viewport.offsetY]);

  // Calculate zoom to fit all buttons within the viewport
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

    board.buttons.forEach((button: SceneBoardButton) => {
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

  const handleRemoveScene = useCallback(
    (button: SceneBoardButton) => {
      if (window.confirm(`Remove "${button.scene.name}" from this board?`)) {
        removeSceneFromBoard({
          variables: {
            buttonId: button.id,
          },
        });
      }
    },
    [removeSceneFromBoard],
  );

  const toggleSceneSelection = useCallback((sceneId: string) => {
    setSelectedSceneIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  }, []);

  const selectAllScenes = useCallback(() => {
    setSelectedSceneIds(new Set(scenesToAdd.map((s: { id: string }) => s.id)));
  }, [scenesToAdd]);

  const deselectAllScenes = useCallback(() => {
    setSelectedSceneIds(new Set());
  }, []);

  // Selection helper functions
  const clearButtonSelection = useCallback(() => {
    setSelectedButtonIds(new Set());
  }, []);

  const selectAllButtons = useCallback(() => {
    if (!board) return;
    setSelectedButtonIds(
      new Set(board.buttons.map((b: SceneBoardButton) => b.id)),
    );
  }, [board]);

  // Context menu handlers
  const handleButtonContextMenu = useCallback(
    (e: React.MouseEvent, button: SceneBoardButton) => {
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

  // Long-press handlers for touch devices
  const startLongPress = useCallback(
    (x: number, y: number, button: SceneBoardButton | null) => {
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
        setContextMenu({
          x,
          y,
          type: button ? "button" : "canvas",
          button: button || undefined,
        });
      }, 500);
    },
    [mode],
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Reset long-press active state after a short delay
    setTimeout(() => setLongPressActive(false), 100);
  }, []);

  const handleAddScenes = useCallback(async () => {
    if (selectedSceneIds.size === 0) {
      setErrorMessage("Please select at least one scene");
      return;
    }

    if (!board) return;

    // Convert existing buttons to Rect format for collision detection
    const existingButtons: Rect[] = board.buttons.map(
      (b: SceneBoardButton) => ({
        layoutX: b.layoutX,
        layoutY: b.layoutY,
        width: b.width || DEFAULT_BUTTON_WIDTH,
        height: b.height || DEFAULT_BUTTON_HEIGHT,
      }),
    );

    const sceneIdsArray = Array.from(selectedSceneIds);
    const positions: Array<{ sceneId: string; x: number; y: number }> = [];
    const currentButtons = [...existingButtons];

    // Find positions for all selected scenes using collision detection
    for (const sceneId of sceneIdsArray) {
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
        positions.push({ sceneId, x: availablePos.x, y: availablePos.y });
        // Mark this position as occupied for subsequent scenes
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
        positions.push({ sceneId, x: fallbackX, y: fallbackY });
      }
    }

    // Add all scenes sequentially
    try {
      for (const { sceneId, x, y } of positions) {
        await addSceneToBoard({
          variables: {
            input: {
              sceneBoardId: boardId,
              sceneId,
              layoutX: x,
              layoutY: y,
            },
          },
        });
      }
      // Clear selection after all scenes are added
      setSelectedSceneIds(new Set());
    } catch (error) {
      console.error("Error adding scenes:", error);
    }
  }, [selectedSceneIds, board, boardId, addSceneToBoard]);

  const handleSaveSettings = useCallback(() => {
    // Validate inputs
    if (!editedName.trim()) {
      setErrorMessage("Please enter a board name");
      return;
    }

    if (editedFadeTime < 0) {
      setErrorMessage("Fade time must be 0 or greater");
      return;
    }

    updateBoard({
      variables: {
        id: boardId,
        input: {
          name: editedName,
          defaultFadeTime: editedFadeTime,
        },
      },
    });
  }, [boardId, editedName, editedFadeTime, updateBoard]);

  const openEditSettings = useCallback(() => {
    setEditedName(board?.name || "");
    setEditedFadeTime(board?.defaultFadeTime || 3.0);
    setIsEditingSettings(true);
  }, [board]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">
          Loading scene board...
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded dark:bg-red-900/20 dark:text-red-400 dark:border dark:border-red-800">
        Error loading scene board: {error?.message || "Board not found"}
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
            onClick={() => router.push("/scene-board")}
            className="text-gray-300 hover:text-white shrink-0 text-2xl"
            aria-label="Back to scene boards"
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
        /* Normal Header - Compact on mobile */
        <div className="bg-white border-b px-3 py-2 md:px-6 md:py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
          {/* Left side - always visible */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => router.push("/scene-board")}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shrink-0"
              aria-label="Back to scene boards"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold dark:text-white truncate">
                {board.name}
              </h1>
              {/* Info visible only on desktop */}
              <p className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
                {board.buttons.length} scenes • Fade: {board.defaultFadeTime}s
              </p>
            </div>
          </div>

          {/* Right side - desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={enterFocusMode}
              className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              title="Enter focus mode (full screen)"
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
            <button
              onClick={zoomToFit}
              className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              title="Zoom to fit all scenes"
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
            </button>
            <button
              onClick={openEditSettings}
              className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              Settings
            </button>
            <button
              onClick={() => setIsAddSceneModalOpen(true)}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 dark:disabled:opacity-50"
              disabled={mode === "play"}
              aria-disabled={mode === "play"}
              aria-describedby={
                mode === "play" ? "add-scene-disabled-msg" : undefined
              }
            >
              + Add Scene
            </button>
            {mode === "play" && (
              <span
                id="add-scene-disabled-msg"
                className="ml-2 text-sm text-gray-500 dark:text-gray-400"
              >
                Switch to Layout Mode to add scenes
              </span>
            )}
            <div className="border-l dark:border-gray-600 pl-2 ml-2">
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
                className={`px-4 py-2 rounded-r ${
                  mode === "layout"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Layout Mode
              </button>
            </div>
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
                  {board.buttons.length} scenes • Fade: {board.defaultFadeTime}s
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
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      mode === "layout"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
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
                    setIsAddSceneModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-left"
                  disabled={mode === "play"}
                >
                  + Add Scene
                </button>
                {mode === "play" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    Switch to Layout Mode to add scenes
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
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
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

            {board.buttons.map((button: SceneBoardButton) => {
              // Use dragging button position if this button is being dragged
              const displayButton =
                draggingButton?.id === button.id ? draggingButton : button;
              const left = `${displayButton.layoutX}px`;
              const top = `${displayButton.layoutY}px`;
              const width = `${displayButton.width || DEFAULT_BUTTON_WIDTH}px`;
              const height = `${displayButton.height || DEFAULT_BUTTON_HEIGHT}px`;
              const isSelected = selectedButtonIds.has(button.id);

              return (
                <div
                  key={button.id}
                  className={`absolute select-none ${
                    mode === "play" ? "cursor-pointer" : "cursor-move"
                  } ${draggingButton?.id === button.id ? "opacity-75 z-50" : ""}`}
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
                  {...(mode === "play" && {
                    onClick: () => handleSceneClick(button),
                    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSceneClick(button);
                      }
                    },
                  })}
                  role="button"
                  tabIndex={0}
                  aria-label={`${mode === "play" ? "Activate" : "Drag"} scene ${button.scene.name}`}
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
                      <div className="font-semibold text-white text-lg">
                        {button.label || button.scene.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {board.buttons.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-xl mb-4">No scenes on this board yet</p>
                  <button
                    onClick={() => setIsAddSceneModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Your First Scene
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 bg-gray-800 rounded-lg p-2 shadow-lg">
          <button
            onClick={() =>
              setViewport((prev) => ({
                ...prev,
                scale: clamp(prev.scale + 0.1, MIN_ZOOM, MAX_ZOOM),
              }))
            }
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="text-center text-sm text-white px-2">
            {Math.round(viewport.scale * 100)}%
          </div>
          <button
            onClick={() =>
              setViewport((prev) => ({
                ...prev,
                scale: clamp(prev.scale - 0.1, MIN_ZOOM, MAX_ZOOM),
              }))
            }
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            onClick={zoomToFit}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs"
            aria-label="Zoom to fit all scenes"
            title="Fit all scenes in view"
          >
            Fit All
          </button>
        </div>
      </div>

      {/* Mode indicator */}
      {!isFocusMode && (
        <div className="bg-gray-800 text-white px-6 py-2 text-sm">
          {mode === "play" ? (
            <span>
              🎮 Play Mode - Tap scenes to activate • Drag to pan • Pinch to
              zoom
            </span>
          ) : (
            <span>
              ✏️ Layout Mode - Drag scenes to reposition (snaps to {GRID_SIZE}px
              grid) • Drag canvas to pan • Pinch to zoom
            </span>
          )}
        </div>
      )}

      {/* Add Scene Modal */}
      {isAddSceneModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsAddSceneModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-scene-modal-title"
          >
            <h2
              id="add-scene-modal-title"
              className="text-2xl font-bold mb-4 dark:text-white"
            >
              Add Scenes to Board
            </h2>
            {scenesToAdd.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                All scenes are already on this board!
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium dark:text-gray-300">
                      Select Scenes ({selectedSceneIds.size} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllScenes}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllScenes}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="border dark:border-gray-600 rounded max-h-96 overflow-y-auto bg-white dark:bg-gray-700">
                    {scenesToAdd.map((scene: { id: string; name: string }) => (
                      <label
                        key={scene.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b last:border-b-0 dark:border-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSceneIds.has(scene.id)}
                          onChange={() => toggleSceneSelection(scene.id)}
                          className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm dark:text-white">
                          {scene.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddSceneModalOpen(false);
                      setSelectedSceneIds(new Set());
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddScenes}
                    disabled={selectedSceneIds.size === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add{" "}
                    {selectedSceneIds.size > 0
                      ? `${selectedSceneIds.size} `
                      : ""}
                    Scene{selectedSceneIds.size !== 1 ? "s" : ""}
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
                  type="number"
                  value={editedFadeTime}
                  onChange={(e) =>
                    setEditedFadeTime(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.1"
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
                    onClick: () => handleRemoveScene(contextMenu.button!),
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
                    label: "Add Scenes...",
                    onClick: () => setIsAddSceneModalOpen(true),
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
    </div>
  );
}
