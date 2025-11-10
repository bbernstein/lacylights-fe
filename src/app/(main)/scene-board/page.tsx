'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_PROJECT_SCENE_BOARDS,
  CREATE_SCENE_BOARD,
  DELETE_SCENE_BOARD,
} from '@/graphql/sceneBoards';
import { useProject } from '@/contexts/ProjectContext';
import { SceneBoard } from '@/types';

export default function SceneBoardPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardFadeTime, setNewBoardFadeTime] = useState(3.0);
  const { currentProject, loading: projectLoading } = useProject();

  const { data, loading, error, refetch } = useQuery(GET_PROJECT_SCENE_BOARDS, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [createSceneBoard] = useMutation(CREATE_SCENE_BOARD, {
    onCompleted: () => {
      refetch();
      setIsCreateModalOpen(false);
      setNewBoardName('');
      setNewBoardDescription('');
      setNewBoardFadeTime(3.0);
    },
    onError: (error) => {
      alert(`Error creating scene board: ${error.message}`);
    },
  });

  const [deleteSceneBoard] = useMutation(DELETE_SCENE_BOARD, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting scene board: ${error.message}`);
    },
  });

  const sceneBoards = useMemo(
    () => data?.sceneBoards || [],
    [data?.sceneBoards]
  );

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) {
      alert('Please enter a board name');
      return;
    }

    createSceneBoard({
      variables: {
        input: {
          name: newBoardName,
          description: newBoardDescription || undefined,
          projectId: currentProject?.id,
          defaultFadeTime: newBoardFadeTime,
        },
      },
    });
  };

  const handleDeleteBoard = (board: SceneBoard) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${board.name}"? This will remove all scene buttons from the board.`
      )
    ) {
      deleteSceneBoard({
        variables: {
          id: board.id,
        },
      });
    }
  };

  const handleOpenBoard = (board: SceneBoard) => {
    router.push(`/scene-board/${board.id}`);
  };

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error loading scene boards: {error.message}
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded">
        Please select a project first
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Scene Boards</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Control your lighting with customizable scene boards
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Scene Board
          </button>
        </div>
      </div>

      {sceneBoards.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-500 dark:text-gray-400">No scene boards yet. Create your first scene board to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sceneBoards.map((board: SceneBoard) => (
            <div
              key={board.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleOpenBoard(board)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{board.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBoard(board);
                  }}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete board"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {board.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{board.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{board.buttons.length} scenes</span>
                <span>Fade: {board.defaultFadeTime}s</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Scene Board Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Scene Board</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Board Name *
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Main Stage, Act 1, House Lights"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Fade Time (seconds)
                </label>
                <input
                  type="number"
                  value={newBoardFadeTime}
                  onChange={(e) =>
                    setNewBoardFadeTime(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewBoardName('');
                  setNewBoardDescription('');
                  setNewBoardFadeTime(3.0);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
