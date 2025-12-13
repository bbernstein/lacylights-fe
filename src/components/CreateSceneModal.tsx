'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_SCENE } from '@/graphql/scenes';
import { GET_PROJECT_FIXTURES } from '@/graphql/fixtures';
import { InstanceChannel, FixtureInstance } from '@/types';
import { denseToSparse } from '@/utils/channelConversion';

interface CreateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSceneCreated: () => void;
}

export default function CreateSceneModal({ isOpen, onClose, projectId, onSceneCreated }: CreateSceneModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: fixturesData } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId },
    skip: !projectId,
  });

  const [createScene, { loading: creating }] = useMutation(CREATE_SCENE, {
    onCompleted: () => {
      onSceneCreated();
      handleClose();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const fixtures = fixturesData?.project?.fixtures || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Create scene with all fixtures at their default values
    // Convert dense default values to sparse format for storage
    const fixtureValues = fixtures.map((fixture: FixtureInstance) => {
      // Direct access to channels - no more complex logic!
      const channels = fixture.channels || [];
      const denseValues = channels.map((channel: InstanceChannel) => channel.defaultValue || 0);

      return {
        fixtureId: fixture.id,
        channels: denseToSparse(denseValues),
      };
    });

    createScene({
      variables: {
        input: {
          name,
          description: description || undefined,
          projectId,
          fixtureValues,
        },
      },
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Scene</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create a new lighting scene. All fixtures will be added with default values that you can edit later.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error creating scene
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p className="whitespace-pre-wrap select-all">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="scene-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scene Name *
                </label>
                <input
                  id="scene-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Warm Wash, Blue Special, Blackout"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="scene-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="scene-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this scene..."
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {fixtures.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Fixtures to include ({fixtures.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    {fixtures.map((fixture: FixtureInstance) => (
                      <div key={fixture.id} className="text-xs text-gray-600 dark:text-gray-400 py-1">
                        {fixture.name} - {fixture.manufacturer} {fixture.model}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    All fixtures will be added with default values. You can edit individual fixture values after creating the scene.
                  </p>
                </div>
              )}

              {fixtures.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    No fixtures found in this project. Add some fixtures first before creating scenes.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !name.trim() || fixtures.length === 0}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Scene'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}