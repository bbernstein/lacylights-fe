'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SCENE, UPDATE_SCENE } from '@/graphql/scenes';
import { FixtureValue, FixtureInstance } from '@/types';
import ChannelListEditor from './ChannelListEditor';
import LayoutCanvas from './LayoutCanvas';
import MultiSelectControls from './MultiSelectControls';

interface SceneEditorLayoutProps {
  sceneId: string;
  mode: 'channels' | 'layout';
  onClose: () => void;
  onToggleMode: () => void;
}

export default function SceneEditorLayout({ sceneId, mode, onClose, onToggleMode }: SceneEditorLayoutProps) {
  // Selection state for layout mode
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set());

  // Local optimistic state for fixture channel values (prevents slider jumping)
  const [localFixtureValues, setLocalFixtureValues] = useState<Map<string, number[]>>(new Map());

  // Fetch scene data for 2D layout mode
  const { data: sceneData } = useQuery(GET_SCENE, {
    variables: { id: sceneId },
    skip: mode !== 'layout',
  });

  // Mutation for updating scene (no refetch - we use optimistic local state)
  const [updateScene] = useMutation(UPDATE_SCENE);

  const scene = sceneData?.scene;

  // Build channel values map for layout canvas (merge server + local state)
  const fixtureValues = useMemo(() => {
    const values = new Map<string, number[]>();
    if (scene) {
      scene.fixtureValues.forEach((fv: { fixture: { id: string }; channelValues: number[] }) => {
        const fixtureId = fv.fixture.id;
        // Use local value if available, otherwise use server value
        const channelValues = localFixtureValues.has(fixtureId)
          ? localFixtureValues.get(fixtureId)!
          : (fv.channelValues || []);
        values.set(fixtureId, channelValues);
      });
    }
    return values;
  }, [scene, localFixtureValues]);

  // Get selected fixtures
  const selectedFixtures: FixtureInstance[] = [];
  if (scene) {
    scene.fixtureValues.forEach((fv: FixtureValue) => {
      if (selectedFixtureIds.has(fv.fixture.id)) {
        selectedFixtures.push(fv.fixture);
      }
    });
  }

  // Handle batched channel value changes from MultiSelectControls
  // changes is an array of {fixtureId, channelIndex, value}
  const handleBatchedChannelChanges = useCallback(async (changes: Array<{fixtureId: string, channelIndex: number, value: number}>) => {
    if (!scene || changes.length === 0) return;

    // Update local state immediately for responsive UI
    setLocalFixtureValues(prev => {
      const newMap = new Map(prev);
      changes.forEach(({fixtureId, channelIndex, value}) => {
        const currentValues = newMap.get(fixtureId) || fixtureValues.get(fixtureId) || [];
        const newValues = [...currentValues];
        newValues[channelIndex] = value;
        newMap.set(fixtureId, newValues);
      });
      return newMap;
    });

    // Build a map of fixture changes for efficient lookup
    const changesByFixture = new Map<string, Map<number, number>>();
    changes.forEach(({fixtureId, channelIndex, value}) => {
      if (!changesByFixture.has(fixtureId)) {
        changesByFixture.set(fixtureId, new Map());
      }
      changesByFixture.get(fixtureId)!.set(channelIndex, value);
    });

    // Build updated fixture values array for server
    const updatedFixtureValues = scene.fixtureValues.map((fv: FixtureValue) => {
      const fixtureChanges = changesByFixture.get(fv.fixture.id);

      if (fixtureChanges) {
        // Apply all changes to this fixture
        const currentValues = localFixtureValues.get(fv.fixture.id) || fv.channelValues || [];
        const newChannelValues = [...currentValues];
        fixtureChanges.forEach((value, channelIndex) => {
          newChannelValues[channelIndex] = value;
        });
        return {
          fixtureId: fv.fixture.id,
          channelValues: newChannelValues,
        };
      }

      // Keep existing values (use local if available, otherwise server)
      return {
        fixtureId: fv.fixture.id,
        channelValues: localFixtureValues.get(fv.fixture.id) || fv.channelValues || [],
      };
    });

    // Update scene via GraphQL mutation (async, no refetch)
    try {
      await updateScene({
        variables: {
          id: sceneId,
          input: {
            fixtureValues: updatedFixtureValues,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update scene:', error);
      // TODO: Show error toast and revert local state
    }
  }, [scene, sceneId, updateScene, localFixtureValues, fixtureValues]);

  // Handle single channel value change from MultiSelectControls
  const handleChannelChange = useCallback(async (fixtureId: string, channelIndex: number, value: number) => {
    // Delegate to batched handler with single change
    return handleBatchedChannelChanges([{fixtureId, channelIndex, value}]);
  }, [handleBatchedChannelChanges]);

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFixtureIds(newSelection);
  }, []);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedFixtureIds(new Set());
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Top bar with mode switcher and controls */}
      <div className="flex-none bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Scenes
          </button>

          {/* Mode switcher tabs */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {
                if (mode !== 'channels') onToggleMode();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'channels'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              Channel List
            </button>
            <button
              onClick={() => {
                if (mode !== 'layout') onToggleMode();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'layout'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              2D Layout
            </button>
          </div>

          {/* Spacer for layout balance */}
          <div className="w-32" />
        </div>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-hidden relative">
        {mode === 'channels' ? (
          <ChannelListEditor sceneId={sceneId} onClose={onClose} />
        ) : scene ? (
          <>
            <LayoutCanvas
              fixtures={scene.fixtureValues.map((fv: FixtureValue) => fv.fixture)}
              fixtureValues={fixtureValues}
              selectedFixtureIds={selectedFixtureIds}
              onSelectionChange={handleSelectionChange}
            />
            {selectedFixtures.length > 0 && (
              <MultiSelectControls
                selectedFixtures={selectedFixtures}
                fixtureValues={fixtureValues}
                onChannelChange={handleChannelChange}
                onBatchedChannelChanges={handleBatchedChannelChanges}
                onDeselectAll={handleDeselectAll}
              />
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading scene...
          </div>
        )}
      </div>
    </div>
  );
}
