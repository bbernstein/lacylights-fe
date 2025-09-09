'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_FIXTURES, DELETE_FIXTURE_INSTANCE, CREATE_FIXTURE_INSTANCE } from '@/graphql/fixtures';
import AddFixtureModal from '@/components/AddFixtureModal';
import EditFixtureModal from '@/components/EditFixtureModal';
import { useProject } from '@/contexts/ProjectContext';
import { FixtureInstance } from '@/types';

export default function FixturesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<FixtureInstance | null>(null);
  const { currentProject, loading: projectLoading } = useProject();
  
  const { data, loading, error, refetch } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [deleteFixture, { loading: deleting }] = useMutation(DELETE_FIXTURE_INSTANCE, {
    onCompleted: (data) => {
      // Even if the mutation returns null/undefined, refresh the list
      refetch();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      // Check if this is just a null return value issue
      if (error.message.includes('Cannot return null for non-nullable field')) {
        // The deletion might have succeeded, just refresh the list
        refetch();
      } else {
        alert(`Error deleting fixture: ${error.message}`);
      }
    },
  });

  const [duplicateFixture, { loading: duplicating }] = useMutation(CREATE_FIXTURE_INSTANCE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Duplicate error:', error);
      alert(`Error duplicating fixture: ${error.message}`);
    },
  });

  const fixtures = data?.project?.fixtures || [];

  const handleFixtureAdded = () => {
    refetch();
  };

  const handleEditFixture = (fixture: FixtureInstance) => {
    setSelectedFixture(fixture);
    setIsEditModalOpen(true);
  };

  const handleFixtureUpdated = () => {
    refetch();
    setSelectedFixture(null);
  };

  const handleDeleteFixture = (fixture: FixtureInstance) => {
    if (window.confirm(`Are you sure you want to delete "${fixture.name}"? This action cannot be undone.`)) {
      deleteFixture({
        variables: {
          id: fixture.id,
        },
      });
    }
  };

  // Find next available channel in the same universe
  const findNextAvailableChannel = (universe: number, channelCount: number) => {
    const fixturesInUniverse: FixtureInstance[] = fixtures
      .filter((f: FixtureInstance) => f.universe === universe)
      .sort((a: FixtureInstance, b: FixtureInstance) => a.startChannel - b.startChannel);

    // Check if we can start at channel 1
    if (fixturesInUniverse.length === 0 || fixturesInUniverse[0].startChannel > channelCount) {
      return 1;
    }

    // Check gaps between fixtures
    for (let i = 0; i < fixturesInUniverse.length; i++) {
      const currentFixture = fixturesInUniverse[i];
      const currentEnd = currentFixture.startChannel + (currentFixture.mode?.channelCount || 1) - 1;
      
      // Check if there's space after this fixture
      const nextStart = currentEnd + 1;
      
      if (i === fixturesInUniverse.length - 1) {
        // Last fixture, check if there's room after it
        if (nextStart + channelCount - 1 <= 512) {
          return nextStart;
        }
      } else {
        // Check gap to next fixture
        const nextFixture = fixturesInUniverse[i + 1];
        if (nextStart + channelCount - 1 < nextFixture.startChannel) {
          return nextStart;
        }
      }
    }

    // No space found in this universe
    return -1;
  };

  const handleDuplicateFixture = (fixture: FixtureInstance) => {
    const channelCount = fixture.channelCount || 1;
    const nextChannel = findNextAvailableChannel(fixture.universe, channelCount);
    
    if (nextChannel === -1) {
      alert(`No space available in universe ${fixture.universe} for a fixture with ${channelCount} channels`);
      return;
    }

    // Generate default name format: "Manufacturer Model - U#:startChannel"
    const newName = `${fixture.manufacturer} ${fixture.model} - U${fixture.universe}:${nextChannel}`;

    duplicateFixture({
      variables: {
        input: {
          name: newName,
          definitionId: fixture.definitionId,
          // Note: modeId not needed with flattened structure
          projectId: currentProject?.id,
          universe: fixture.universe,
          startChannel: nextChannel,
        },
      },
    });
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
        <p className="text-yellow-800 dark:text-yellow-200">No project selected. Creating default project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading fixtures: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Fixtures</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your lighting fixtures and DMX patching
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Fixture
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400">Loading fixtures...</p>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400">No fixtures yet. Add your first fixture to get started.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Universe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start Channel
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {fixtures.map((fixture: FixtureInstance) => (
                <tr key={fixture.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {fixture.name}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                    <div className="break-words whitespace-normal">
                      {fixture.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {fixture.modeName} ({fixture.channelCount} ch)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {fixture.universe}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {fixture.startChannel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleEditFixture(fixture)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit fixture"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDuplicateFixture(fixture)}
                        disabled={duplicating}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Duplicate fixture"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteFixture(fixture)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete fixture"
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
        <>
          <AddFixtureModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            projectId={currentProject.id}
            onFixtureAdded={handleFixtureAdded}
          />
          <EditFixtureModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedFixture(null);
            }}
            fixture={selectedFixture}
            onFixtureUpdated={handleFixtureUpdated}
          />
        </>
      )}
    </div>
  );
}