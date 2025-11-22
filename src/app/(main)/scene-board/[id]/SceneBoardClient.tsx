'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SCENE_BOARD,
  UPDATE_SCENE_BOARD,
  ACTIVATE_SCENE_FROM_BOARD,
  UPDATE_SCENE_BOARD_BUTTON_POSITIONS,
  ADD_SCENE_TO_BOARD,
  REMOVE_SCENE_FROM_BOARD,
} from '@/graphql/sceneBoards';
import { GET_PROJECT_SCENES } from '@/graphql/scenes';
import { useProject } from '@/contexts/ProjectContext';
import { SceneBoardButton } from '@/types';
import { screenToCanvas, clamp, snapToGrid, findAvailablePosition, Rect } from '@/lib/canvasUtils';

// Grid configuration
const GRID_SIZE = 10; // Fine grid for flexible button placement
const AUTO_PLACEMENT_GRID_SIZE = 250; // Grid step for auto-placement (matches findAvailablePosition gridStep)
const AUTO_PLACEMENT_PADDING = 20; // Grid offset for auto-placement (matches findAvailablePosition padding)
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const DEFAULT_BUTTON_WIDTH = 200;
const DEFAULT_BUTTON_HEIGHT = 120;

interface SceneBoardClientProps {
  id: string;
}

export default function SceneBoardClient({ id }: SceneBoardClientProps) {
  const router = useRouter();
  const boardId = id === '__dynamic__' ? (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '') : id;
  const { currentProject } = useProject();

  const [mode, setMode] = useState<'play' | 'layout'>('play');
  const [isAddSceneModalOpen, setIsAddSceneModalOpen] = useState(false);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedFadeTime, setEditedFadeTime] = useState(3.0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Drag state
  const [draggingButton, setDraggingButton] = useState<SceneBoardButton | null>(null);
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
    initialMidpoint: { x: number; y: number } | null;
    initialOffset: { x: number; y: number };
  }>({
    initialDistance: null,
    initialScale: 1.0,
    initialMidpoint: null,
    initialOffset: { x: 0, y: 0 },
  });

  const { data: boardData, loading, error, refetch } = useQuery(GET_SCENE_BOARD, {
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
    [scenesData?.project?.scenes]
  );

  // Memoize button IDs to avoid recalculating on every render
  const buttonsOnBoard = useMemo(
    () => new Set(board?.buttons?.map((b: SceneBoardButton) => b.scene.id) || []),
    [board?.buttons]
  );

  const scenesToAdd = useMemo(
    () => availableScenes.filter((s: { id: string }) => !buttonsOnBoard.has(s.id)),
    [availableScenes, buttonsOnBoard]
  );

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddSceneModalOpen) {
          setIsAddSceneModalOpen(false);
          setSelectedSceneIds(new Set());
        } else if (isEditingSettings) {
          setIsEditingSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddSceneModalOpen, isEditingSettings]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent, button: SceneBoardButton) => {
    if (mode !== 'layout') return;
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport, canvas);

    setDraggingButton(button);
    setDragOffset({
      x: canvasPos.x - button.layoutX,
      y: canvasPos.y - button.layoutY,
    });
  }, [mode, viewport]);

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingButton || mode !== 'layout' || !canvasRef.current || !board) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY, viewport, canvasRef.current);

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
  }, [draggingButton, mode, dragOffset, viewport, board]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!draggingButton || mode !== 'layout') return;

    const newLayoutX = draggingButton.layoutX;
    const newLayoutY = draggingButton.layoutY;
    const buttonId = draggingButton.id;

    // Clear dragging state first so the position "sticks"
    setDraggingButton(null);

    // Save the new position to the server with optimistic update
    updatePositions({
      variables: {
        positions: [{
          buttonId,
          layoutX: newLayoutX,
          layoutY: newLayoutY,
        }],
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
                buttons: existingData.sceneBoard.buttons.map((btn: SceneBoardButton) =>
                  btn.id === buttonId
                    ? { ...btn, layoutX: newLayoutX, layoutY: newLayoutY }
                    : btn
                ),
              },
            },
          });
        }
      },
    });
  }, [draggingButton, mode, updatePositions, boardId]);

  // Touch gesture handlers for pinch-to-zoom and two-finger pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Prevent default browser behavior for two-finger gestures
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate initial distance for zoom
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Calculate midpoint for panning
      const midpoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      setTouchState({
        initialDistance: distance,
        initialScale: viewport.scale,
        initialMidpoint: midpoint,
        initialOffset: { x: viewport.offsetX, y: viewport.offsetY },
      });
    }
  }, [viewport.scale, viewport.offsetX, viewport.offsetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState.initialDistance && touchState.initialMidpoint) {
      // Prevent default browser behavior during two-finger gestures
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate current distance for zoom
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Calculate current midpoint for panning
      const currentMidpoint = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      // Calculate new scale from pinch gesture
      const scaleChange = currentDistance / touchState.initialDistance;
      const newScale = clamp(
        touchState.initialScale * scaleChange,
        MIN_ZOOM,
        MAX_ZOOM
      );

      // Calculate pan offset from midpoint movement
      // The offset needs to be divided by scale to account for the zoom level
      const deltaX = (currentMidpoint.x - touchState.initialMidpoint.x) / newScale;
      const deltaY = (currentMidpoint.y - touchState.initialMidpoint.y) / newScale;
      const newOffsetX = touchState.initialOffset.x + deltaX;
      const newOffsetY = touchState.initialOffset.y + deltaY;

      setViewport({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    }
  }, [touchState]);

  const handleTouchEnd = useCallback(() => {
    setTouchState({
      initialDistance: null,
      initialScale: viewport.scale,
      initialMidpoint: null,
      initialOffset: { x: viewport.offsetX, y: viewport.offsetY },
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

    board.buttons.forEach((button) => {
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
    const offsetY = (viewportHeight - scaledContentHeight) / 2 - minY * newScale;

    setViewport({
      scale: newScale,
      offsetX,
      offsetY,
    });
  }, [board]);

  // Set initial zoom to fit on mount or when board ID changes
  useEffect(() => {
    if (board && board.buttons.length > 0 && board.id !== autoZoomedBoardId.current) {
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
      if (e.touches.length === 2) {
        e.preventDefault(); // This only works with { passive: false }
        handleTouchStart(e as unknown as React.TouchEvent);
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // This only works with { passive: false }
        handleTouchMove(e as unknown as React.TouchEvent);
      }
    };

    const handleNativeTouchEnd = (_e: TouchEvent) => {
      handleTouchEnd();
    };

    // Add listeners with passive: false to allow preventDefault
    canvas.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleNativeTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleNativeTouchStart);
      canvas.removeEventListener('touchmove', handleNativeTouchMove);
      canvas.removeEventListener('touchend', handleNativeTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Add wheel event listeners for Mac touchpad pinch-to-zoom and pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent browser zoom/scroll

      // Check if this is a pinch-to-zoom gesture (ctrlKey is set on Mac for pinch)
      if (e.ctrlKey) {
        // Pinch-to-zoom on Mac touchpad
        const delta = -e.deltaY; // Positive = zoom in, negative = zoom out
        const zoomFactor = delta > 0 ? 1.05 : 0.95;
        const newScale = clamp(viewport.scale * zoomFactor, MIN_ZOOM, MAX_ZOOM);

        // Zoom towards the cursor position
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new offset to zoom towards cursor
        const scaleDiff = newScale - viewport.scale;
        const newOffsetX = viewport.offsetX - (mouseX / viewport.scale) * (scaleDiff / newScale);
        const newOffsetY = viewport.offsetY - (mouseY / viewport.scale) * (scaleDiff / newScale);

        setViewport({
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      } else {
        // Two-finger scroll/pan on Mac touchpad
        const deltaX = e.deltaX;
        const deltaY = e.deltaY;

        setViewport((prev) => ({
          ...prev,
          offsetX: prev.offsetX - deltaX / prev.scale,
          offsetY: prev.offsetY - deltaY / prev.scale,
        }));
      }
    };

    // Add wheel listener with passive: false to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [viewport]);

  const handleSceneClick = useCallback(
    (button: SceneBoardButton) => {
      if (mode === 'play') {
        // Activate the scene
        activateScene({
          variables: {
            sceneBoardId: boardId,
            sceneId: button.scene.id,
          },
        });
      }
    },
    [mode, boardId, activateScene]
  );

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
    [removeSceneFromBoard]
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

  const handleAddScenes = useCallback(async () => {
    if (selectedSceneIds.size === 0) {
      setErrorMessage('Please select at least one scene');
      return;
    }

    if (!board) return;

    // Convert existing buttons to Rect format for collision detection
    const existingButtons: Rect[] = board.buttons.map((b: SceneBoardButton) => ({
      layoutX: b.layoutX,
      layoutY: b.layoutY,
      width: b.width || DEFAULT_BUTTON_WIDTH,
      height: b.height || DEFAULT_BUTTON_HEIGHT,
    }));

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
        AUTO_PLACEMENT_PADDING
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
        const fallbackX = 100 + (positions.length * 50) % (board.canvasWidth - DEFAULT_BUTTON_WIDTH);
        const fallbackY = 100 + Math.floor((positions.length * 50) / (board.canvasWidth - DEFAULT_BUTTON_WIDTH)) * 150;
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
      console.error('Error adding scenes:', error);
    }
  }, [selectedSceneIds, board, boardId, addSceneToBoard]);

  const handleSaveSettings = useCallback(() => {
    // Validate inputs
    if (!editedName.trim()) {
      setErrorMessage('Please enter a board name');
      return;
    }

    if (editedFadeTime < 0) {
      setErrorMessage('Fade time must be 0 or greater');
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
    setEditedName(board?.name || '');
    setEditedFadeTime(board?.defaultFadeTime || 3.0);
    setIsEditingSettings(true);
  }, [board]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading scene board...</div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded dark:bg-red-900/20 dark:text-red-400 dark:border dark:border-red-800">
        Error loading scene board: {error?.message || 'Board not found'}
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

      {/* Header - Compact on mobile */}
      <div className="bg-white border-b px-3 py-2 md:px-6 md:py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
        {/* Left side - always visible */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <button
            onClick={() => router.push('/scene-board')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shrink-0"
            aria-label="Back to scene boards"
          >
            ←
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold dark:text-white truncate">{board.name}</h1>
            {/* Info visible only on desktop */}
            <p className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
              {board.buttons.length} scenes • Fade: {board.defaultFadeTime}s
            </p>
          </div>
        </div>

        {/* Right side - desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={zoomToFit}
            className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            title="Zoom to fit all scenes"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
            disabled={mode === 'play'}
            aria-disabled={mode === 'play'}
            aria-describedby={mode === 'play' ? "add-scene-disabled-msg" : undefined}
          >
            + Add Scene
          </button>
          {mode === 'play' && (
            <span
              id="add-scene-disabled-msg"
              className="ml-2 text-sm text-gray-500 dark:text-gray-400"
            >
              Switch to Layout Mode to add scenes
            </span>
          )}
          <div className="border-l dark:border-gray-600 pl-2 ml-2">
            <button
              onClick={() => setMode('play')}
              className={`px-4 py-2 rounded-l ${
                mode === 'play'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Play Mode
            </button>
            <button
              onClick={() => setMode('layout')}
              className={`px-4 py-2 rounded-r ${
                mode === 'layout'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile slide-in menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)}>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode</label>
                <div className="flex rounded overflow-hidden">
                  <button
                    onClick={() => {
                      setMode('play');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      mode === 'play'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Play Mode
                  </button>
                  <button
                    onClick={() => {
                      setMode('layout');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      mode === 'layout'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
                    zoomToFit();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 border rounded hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 text-left flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Zoom to Fit
                </button>

                <button
                  onClick={() => {
                    setIsAddSceneModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-left"
                  disabled={mode === 'play'}
                >
                  + Add Scene
                </button>
                {mode === 'play' && (
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
          style={{ touchAction: 'none' }}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Transformed canvas container */}
          <div
            style={{
              transform: `scale(${viewport.scale}) translate(${viewport.offsetX}px, ${viewport.offsetY}px)`,
              transformOrigin: '0 0',
              width: `${board.canvasWidth}px`,
              height: `${board.canvasHeight}px`,
              position: 'relative',
            }}
          >
            {/* Grid overlay in layout mode */}
            {mode === 'layout' && (
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
              const displayButton = draggingButton?.id === button.id ? draggingButton : button;
              const left = `${displayButton.layoutX}px`;
              const top = `${displayButton.layoutY}px`;
              const width = `${displayButton.width || DEFAULT_BUTTON_WIDTH}px`;
              const height = `${displayButton.height || DEFAULT_BUTTON_HEIGHT}px`;

              return (
                <div
                  key={button.id}
                  className={`absolute select-none ${
                    mode === 'play' ? 'cursor-pointer' : 'cursor-move'
                  } ${draggingButton?.id === button.id ? 'opacity-75 z-50' : ''}`}
                  style={{
                    left,
                    top,
                    width,
                    height,
                  }}
                onMouseDown={(e) => handleDragStart(e, button)}
                {...(mode === 'play' && {
                  onClick: () => handleSceneClick(button),
                  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSceneClick(button);
                    }
                  },
                })}
                role="button"
                tabIndex={0}
                aria-label={`${mode === 'play' ? 'Activate' : 'Drag'} scene ${button.scene.name}`}
              >
                <div
                  className={`h-full rounded-lg border-2 flex items-center justify-center p-4 transition-all ${
                    mode === 'play'
                      ? 'bg-blue-600 border-blue-400 hover:bg-blue-500 hover:scale-105'
                      : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                  }`}
                  style={button.color ? { backgroundColor: button.color } : {}}
                >
                  <div className="text-center">
                    <div className="font-semibold text-white text-lg">
                      {button.label || button.scene.name}
                    </div>
                    {mode === 'layout' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveScene(button);
                        }}
                        className="mt-2 text-xs text-red-300 hover:text-red-100"
                        aria-label={`Remove ${button.scene.name} from board`}
                      >
                        Remove
                      </button>
                    )}
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
            onClick={() => setViewport(prev => ({ ...prev, scale: clamp(prev.scale + 0.1, MIN_ZOOM, MAX_ZOOM) }))}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="text-center text-sm text-white px-2">
            {Math.round(viewport.scale * 100)}%
          </div>
          <button
            onClick={() => setViewport(prev => ({ ...prev, scale: clamp(prev.scale - 0.1, MIN_ZOOM, MAX_ZOOM) }))}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => setViewport({ scale: 1.0, offsetX: 0, offsetY: 0 })}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mode indicator */}
      <div className="bg-gray-800 text-white px-6 py-2 text-sm">
        {mode === 'play' ? (
          <span>🎮 Play Mode - Click scenes to activate • Pinch to zoom</span>
        ) : (
          <span>✏️ Layout Mode - Drag scenes to reposition (snaps to {GRID_SIZE}px grid) • Pinch to zoom</span>
        )}
      </div>

      {/* Add Scene Modal */}
      {isAddSceneModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsAddSceneModalOpen(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-scene-modal-title"
          >
            <h2 id="add-scene-modal-title" className="text-2xl font-bold mb-4 dark:text-white">Add Scenes to Board</h2>
            {scenesToAdd.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4">All scenes are already on this board!</p>
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
                        <span className="text-sm dark:text-white">{scene.name}</span>
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
                    Add {selectedSceneIds.size > 0 ? `${selectedSceneIds.size} ` : ''}Scene{selectedSceneIds.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Settings Modal */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsEditingSettings(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="board-settings-modal-title"
          >
            <h2 id="board-settings-modal-title" className="text-2xl font-bold mb-4 dark:text-white">Board Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Board Name</label>
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
                  onChange={(e) => setEditedFadeTime(parseFloat(e.target.value) || 0)}
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
    </div>
  );
}
