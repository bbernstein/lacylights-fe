'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_SCENES, DELETE_SCENE, ACTIVATE_SCENE, DUPLICATE_SCENE } from '@/graphql/scenes';
import { useProject } from '@/contexts/ProjectContext';
import CreateSceneModal from '@/components/CreateSceneModal';
import SceneEditorModal from '@/components/SceneEditorModal';
import { Scene } from '@/types';

export default function ScenesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const { currentProject, loading: projectLoading } = useProject();
  
  const { data, loading, error, refetch } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [deleteScene] = useMutation(DELETE_SCENE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting scene: ${error.message}`);
    },
  });

  const [activateScene] = useMutation(ACTIVATE_SCENE, {
    onError: (error) => {
      alert(`Error activating scene: ${error.message}`);
    },
  });

  const [duplicateScene] = useMutation(DUPLICATE_SCENE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error duplicating scene: ${error.message}`);
    },
  });

  // Memoize scenes to prevent dependency issues
  const scenes = useMemo(() => data?.project?.scenes || [], [data?.project?.scenes]);

  // Sort scenes based on the toggle state
  const sortedScenes = useMemo(() => {
    if (!sortAlphabetically) {
      return scenes;
    }
    return [...scenes].sort((a: Scene, b: Scene) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [scenes, sortAlphabetically]);

  const handleSceneCreated = () => {
    refetch();
  };

  const handleEditScene = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setIsEditModalOpen(true);
  };

  const handleSceneUpdated = () => {
    refetch();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSceneId(null);
  };

  const handleDeleteScene = (scene: Scene) => {
    if (window.confirm(`Are you sure you want to delete "${scene.name}"? This action cannot be undone.`)) {
      deleteScene({
        variables: {
          id: scene.id,
        },
      });
    }
  };

  const handleActivateScene = (scene: Scene) => {
    activateScene({
      variables: {
        sceneId: scene.id,
      },
    });
  };

  const handleDuplicateScene = (scene: Scene) => {
    if (window.confirm(`Duplicate scene "${scene.name}"? This will create a copy with the same fixture values.`)) {
      duplicateScene({
        variables: {
          id: scene.id,
        },
      });
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">No project selected.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading scenes: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Scenes</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Create and manage lighting scenes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setSortAlphabetically(!sortAlphabetically)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title={sortAlphabetically ? "Show in original order" : "Sort alphabetically"}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortAlphabetically ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              )}
            </svg>
            {sortAlphabetically ? 'Original Order' : 'Sort A-Z'}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Scene
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400">Loading scenes...</p>
          </div>
        ) : sortedScenes.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400">No scenes yet. Create your first scene to get started.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-64">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fixtures
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedScenes.map((scene: Scene) => (
                <tr key={scene.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {scene.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 w-64 max-w-64 break-words">
                    {scene.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {scene.fixtureValues.length} fixtures
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleActivateScene(scene)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Activate scene"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleEditScene(scene)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit scene"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDuplicateScene(scene)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        title="Duplicate scene"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteScene(scene)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete scene"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {currentProject && (
        <CreateSceneModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={currentProject.id}
          onSceneCreated={handleSceneCreated}
        />
      )}

      <SceneEditorModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        sceneId={editingSceneId}
        onSceneUpdated={handleSceneUpdated}
      />
    </div>
  );
}