'use client';

import { useState, useCallback } from 'react';
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
      alert(`Error updating board: ${error.message}`);
    },
  });

  const [activateScene] = useMutation(ACTIVATE_SCENE_FROM_BOARD, {
    onError: (error) => {
      alert(`Error activating scene: ${error.message}`);
    },
  });

  const [updatePositions] = useMutation(UPDATE_SCENE_BOARD_BUTTON_POSITIONS, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error updating positions: ${error.message}`);
    },
  });

  const [addSceneToBoard] = useMutation(ADD_SCENE_TO_BOARD, {
    onCompleted: () => {
      refetch();
      setIsAddSceneModalOpen(false);
      setSelectedSceneId('');
    },
    onError: (error) => {
      alert(`Error adding scene: ${error.message}`);
    },
  });

  const [removeSceneFromBoard] = useMutation(REMOVE_SCENE_FROM_BOARD, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error removing scene: ${error.message}`);
    },
  });

  const board = boardData?.sceneBoard;
  const availableScenes = scenesData?.project?.scenes || [];
  const buttonsOnBoard = new Set(board?.buttons?.map((b: SceneBoardButton) => b.scene.id) || []);
  const scenesToAdd = availableScenes.filter((s: any) => !buttonsOnBoard.has(s.id));

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
      alert('Please select a scene');
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

    // Simple grid placement
    for (let y = 0.1; y < 0.9; y += step) {
      for (let x = 0.1; x < 0.9; x += step) {
        const occupied = existingPositions.some(
          (pos) => Math.abs(pos.x - x) < 0.1 && Math.abs(pos.y - y) < 0.1
        );
        if (!occupied) {
          layoutX = x;
          layoutY = y;
          break;
        }
      }
      if (layoutX !== 0.1 || layoutY !== 0.1) break;
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
        <div className="text-gray-500">Loading scene board...</div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error loading scene board: {error?.message || 'Board not found'}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/scene-board')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <p className="text-sm text-gray-600">
              {board.buttons.length} scenes • Fade: {board.defaultFadeTime}s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openEditSettings}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Settings
          </button>
          <button
            onClick={() => setIsAddSceneModalOpen(true)}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={mode === 'play'}
          >
            + Add Scene
          </button>
          <div className="border-l pl-2 ml-2">
            <button
              onClick={() => setMode('play')}
              className={`px-4 py-2 rounded-l ${
                mode === 'play'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Play Mode
            </button>
            <button
              onClick={() => setMode('layout')}
              className={`px-4 py-2 rounded-r ${
                mode === 'layout'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Layout Mode
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          {board.buttons.map((button: SceneBoardButton) => {
            const left = `${button.layoutX * 100}%`;
            const top = `${button.layoutY * 100}%`;
            const width = `${(button.width || 0.1) * 100}%`;
            const height = `${(button.height || 0.1) * 100}%`;

            return (
              <div
                key={button.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                  mode === 'play' ? 'cursor-pointer' : 'cursor-move'
                }`}
                style={{
                  left,
                  top,
                  width,
                  height,
                  minWidth: '120px',
                  minHeight: '80px',
                }}
                onClick={() => handleSceneClick(button)}
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
          <span>✏️ Layout Mode - Drag scenes to reposition (drag not yet implemented)</span>
        )}
      </div>

      {/* Add Scene Modal */}
      {isAddSceneModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Scene to Board</h2>
            {scenesToAdd.length === 0 ? (
              <p className="text-gray-600 mb-4">All scenes are already on this board!</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Scene</label>
                  <select
                    value={selectedSceneId}
                    onChange={(e) => setSelectedSceneId(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Select a scene --</option>
                    {scenesToAdd.map((scene: any) => (
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
                    className="px-4 py-2 border rounded hover:bg-gray-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Board Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Board Name</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Default Fade Time (seconds)
                </label>
                <input
                  type="number"
                  value={editedFadeTime}
                  onChange={(e) => setEditedFadeTime(parseFloat(e.target.value) || 0)}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsEditingSettings(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
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
