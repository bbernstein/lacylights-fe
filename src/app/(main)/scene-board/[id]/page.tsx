'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Grid configuration
const GRID_SIZE = 0.05; // 5% grid snapping

// Enable static export for this dynamic route
// Scene boards are created dynamically at runtime, so we generate an empty list
// and allow dynamic params to be handled client-side
export async function generateStaticParams() {
  return [];
}

export default function SceneBoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const { currentProject } = useProject();

  const [mode, setMode] = useState<'play' | 'layout'>('play');
  const [isAddSceneModalOpen, setIsAddSceneModalOpen] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedFadeTime, setEditedFadeTime] = useState(3.0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag state
  const [draggingButton, setDraggingButton] = useState<SceneBoardButton | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

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
      setSelectedSceneId('');
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
          setSelectedSceneId('');
        } else if (isEditingSettings) {
          setIsEditingSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddSceneModalOpen, isEditingSettings]);

  // Snap to grid helper
  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent, button: SceneBoardButton) => {
    if (mode !== 'layout') return;
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const buttonCenterX = button.layoutX * rect.width;
    const buttonCenterY = button.layoutY * rect.height;

    setDraggingButton(button);
    setDragOffset({
      x: e.clientX - rect.left - buttonCenterX,
      y: e.clientY - rect.top - buttonCenterY,
    });
  }, [mode]);

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingButton || mode !== 'layout') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x) / rect.width;
    const y = (e.clientY - rect.top - dragOffset.y) / rect.height;

    // Clamp to canvas bounds (with some margin)
    const clampedX = Math.max(0.05, Math.min(0.95, x));
    const clampedY = Math.max(0.05, Math.min(0.95, y));

    // Snap to grid
    const snappedX = snapToGrid(clampedX);
    const snappedY = snapToGrid(clampedY);

    // Update the dragging button state to trigger re-render
    setDraggingButton({
      ...draggingButton,
      layoutX: snappedX,
      layoutY: snappedY,
    });
  }, [draggingButton, mode, dragOffset, snapToGrid]);

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

  const handleAddScene = useCallback(() => {
    if (!selectedSceneId) {
      setErrorMessage('Please select a scene');
      return;
    }

    // Find a free spot for the new button
    const existingPositions = board?.buttons?.map((b: SceneBoardButton) => ({
      x: b.layoutX,
      y: b.layoutY,
    })) || [];

    let layoutX = 0.1;
    let layoutY = 0.1;
    const step = 0.15;
    let foundSpot = false;

    // Simple grid placement - use boolean flag to properly exit nested loops
    for (let y = 0.1; y < 0.9 && !foundSpot; y += step) {
      for (let x = 0.1; x < 0.9 && !foundSpot; x += step) {
        const occupied = existingPositions.some(
          (pos: { x: number; y: number }) => Math.abs(pos.x - x) < 0.1 && Math.abs(pos.y - y) < 0.1
        );
        if (!occupied) {
          layoutX = x;
          layoutY = y;
          foundSpot = true;
        }
      }
    }

    addSceneToBoard({
      variables: {
        input: {
          sceneBoardId: boardId,
          sceneId: selectedSceneId,
          layoutX,
          layoutY,
        },
      },
    });
  }, [selectedSceneId, board, boardId, addSceneToBoard]);

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

      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/scene-board')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">{board.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {board.buttons.length} scenes • Fade: {board.defaultFadeTime}s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="absolute inset-0"
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* Grid overlay in layout mode */}
          {mode === 'layout' && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
              }}
            />
          )}

          {board.buttons.map((button: SceneBoardButton) => {
            // Use dragging button position if this button is being dragged
            const displayButton = draggingButton?.id === button.id ? draggingButton : button;
            const left = `${displayButton.layoutX * 100}%`;
            const top = `${displayButton.layoutY * 100}%`;
            const width = `${(displayButton.width || 0.1) * 100}%`;
            const height = `${(displayButton.height || 0.1) * 100}%`;

            return (
              <div
                key={button.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
                  mode === 'play' ? 'cursor-pointer' : 'cursor-move'
                } ${draggingButton?.id === button.id ? 'opacity-75 z-50' : ''}`}
                style={{
                  left,
                  top,
                  width,
                  height,
                  minWidth: '120px',
                  minHeight: '80px',
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

      {/* Mode indicator */}
      <div className="bg-gray-800 text-white px-6 py-2 text-sm">
        {mode === 'play' ? (
          <span>🎮 Play Mode - Click scenes to activate</span>
        ) : (
          <span>✏️ Layout Mode - Drag scenes to reposition (snaps to 5% grid)</span>
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
            <h2 id="add-scene-modal-title" className="text-2xl font-bold mb-4 dark:text-white">Add Scene to Board</h2>
            {scenesToAdd.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4">All scenes are already on this board!</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Select Scene</label>
                  <select
                    value={selectedSceneId}
                    onChange={(e) => setSelectedSceneId(e.target.value)}
                    className="w-full border rounded px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">-- Select a scene --</option>
                    {scenesToAdd.map((scene: { id: string; name: string }) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsAddSceneModalOpen(false);
                      setSelectedSceneId('');
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddScene}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Scene
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
