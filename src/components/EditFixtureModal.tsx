'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { GET_MANUFACTURERS, GET_MODELS, UPDATE_FIXTURE_INSTANCE, DELETE_FIXTURE_INSTANCE, GET_PROJECT_FIXTURES } from '@/graphql/fixtures';
import { FixtureInstance } from '@/types';
import Autocomplete from './Autocomplete';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface EditFixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixture: FixtureInstance | null;
  onFixtureUpdated: () => void;
}

export default function EditFixtureModal({ isOpen, onClose, fixture, onFixtureUpdated }: EditFixtureModalProps) {
  const isMobile = useIsMobile();
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [universe, setUniverse] = useState(1);
  const [startChannel, setStartChannel] = useState(1);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState('');
  const [selectedModeId, setSelectedModeId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoSelectChannel, setAutoSelectChannel] = useState(false);

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<Array<{ id: string; model: string; modes: Array<{ id: string; name: string; channelCount: number }> }>>([]);
  const [selectedModelData, setSelectedModelData] = useState<{ id: string; model: string; modes: Array<{ id: string; name: string; channelCount: number }> } | null>(null);

  // Get existing fixtures for overlap validation
  const { data: fixturesData } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId: fixture?.project?.id },
    skip: !fixture?.project?.id,
  });

  const existingFixtures = (fixturesData?.project?.fixtures || []).filter((f: { id: string }) => f.id !== fixture?.id);

  const [getManufacturers, { loading: loadingManufacturers }] = useLazyQuery(GET_MANUFACTURERS, {
    onCompleted: (data) => {
      const uniqueManufacturers = Array.from(
        new Set(data.fixtureDefinitions.map((def: { manufacturer: string }) => def.manufacturer))
      );
      setManufacturers(uniqueManufacturers as string[]);
    },
  });

  const [getModels, { loading: loadingModels }] = useLazyQuery(GET_MODELS, {
    onCompleted: (data) => {
      setModels(data.fixtureDefinitions);
      
      // If we're editing a fixture and this is for the current manufacturer, set the model data
      if (fixture && manufacturer === fixture.manufacturer) {
        const currentModel = data.fixtureDefinitions.find((def: { id: string; model: string; modes: Array<{ id: string; name: string; channelCount: number }> }) => def.id === fixture.definitionId);
        if (currentModel) {
          setSelectedModelData(currentModel);
        }
      }
    },
  });

  const [updateFixture, { loading: updating }] = useMutation(UPDATE_FIXTURE_INSTANCE, {
    onCompleted: () => {
      onFixtureUpdated();
      handleClose();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [deleteFixture, { loading: deleting }] = useMutation(DELETE_FIXTURE_INSTANCE, {
    onCompleted: () => {
      onFixtureUpdated();
      handleClose();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Populate form when fixture changes
  useEffect(() => {
    if (fixture) {
      setName(fixture.name);
      setDescription(fixture.description || '');
      setManufacturer(fixture.manufacturer);
      setModel(fixture.model);
      setUniverse(fixture.universe);
      setStartChannel(fixture.startChannel);
      setSelectedDefinitionId(fixture.definitionId);
      // Note: modeId not needed with flattened structure
      
      // Load models for the manufacturer
      getModels({ variables: { manufacturer: fixture.manufacturer } });
      
      // Load manufacturers for autocomplete
      getManufacturers({ variables: { search: fixture.manufacturer } });
    }
  }, [fixture, getModels, getManufacturers]);

  useEffect(() => {
    if (manufacturer && manufacturer !== fixture?.manufacturer) {
      getModels({ variables: { manufacturer } });
      // Reset model selection when changing to a different manufacturer
      setModel('');
      setSelectedDefinitionId('');
      setSelectedModeId('');
      setSelectedModelData(null);
    }
  }, [manufacturer, getModels, fixture]);

  // Set selectedModelData when models are loaded and we have a fixture
  useEffect(() => {
    if (fixture && models.length > 0) {
      const currentModel = models.find(m => m.id === fixture.definitionId);
      if (currentModel) {
        setSelectedModelData(currentModel);
      }
    }
  }, [models, fixture]);

  const handleManufacturerSearch = (search: string) => {
    if (search) {
      getManufacturers({ variables: { search } });
    }
  };

  const handleModelSelect = (modelName: string) => {
    setModel(modelName);
    const selectedModel = models.find(m => m.model === modelName);
    if (selectedModel) {
      setSelectedDefinitionId(selectedModel.id);
      setSelectedModelData(selectedModel);
      setSelectedModeId('');
    }
  };

  const handleModeSelect = (modeId: string) => {
    setSelectedModeId(modeId);
  };

  // Get channel count for the selected mode
  const getSelectedModeChannelCount = useCallback(() => {
    if (!selectedModelData || !selectedModeId) return 1;
    const mode = selectedModelData.modes.find((m) => m.id === selectedModeId);
    return mode?.channelCount || 1;
  }, [selectedModelData, selectedModeId]);

  // Check if a channel range overlaps with existing fixtures
  const checkChannelOverlap = (univ: number, start: number) => {
    const channelCount = getSelectedModeChannelCount();
    const end = start + channelCount - 1;

    for (const existingFixture of existingFixtures) {
      if (existingFixture.universe === univ) {
        const fixtureChannelCount = existingFixture.mode?.channelCount || 1;
        const fixtureEnd = existingFixture.startChannel + fixtureChannelCount - 1;
        
        // Check if ranges overlap
        if (start <= fixtureEnd && end >= existingFixture.startChannel) {
          return existingFixture;
        }
      }
    }
    return null;
  };

  // Find next available channel that can fit the fixture
  const findNextAvailableChannel = useCallback((univ: number, channelCount: number) => {
    const fixturesInUniverse = existingFixtures
      .filter((f: { universe: number }) => f.universe === univ)
      .sort((a: { startChannel: number }, b: { startChannel: number }) => a.startChannel - b.startChannel);

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
  }, [existingFixtures]);

  // Auto-select next available channel when toggled
  useEffect(() => {
    if (autoSelectChannel && selectedModeId) {
      const channelCount = getSelectedModeChannelCount();
      const nextChannel = findNextAvailableChannel(universe, channelCount);
      
      if (nextChannel > 0) {
        setStartChannel(nextChannel);
      } else {
        setError(`No space available in universe ${universe} for fixture with ${channelCount} channels`);
      }
    }
  }, [autoSelectChannel, universe, selectedModeId, getSelectedModeChannelCount, findNextAvailableChannel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!fixture) return;
    
    if (!selectedDefinitionId) {
      setError('Please select a valid fixture model');
      return;
    }

    // Check for channel overlap (excluding current fixture)
    const overlap = checkChannelOverlap(universe, startChannel);
    if (overlap) {
      const channelCount = getSelectedModeChannelCount();
      const endChannel = startChannel + channelCount - 1;
      setError(`Channel overlap detected with fixture "${overlap.name}" (U${overlap.universe}:${overlap.startChannel}-${overlap.startChannel + (overlap.mode?.channelCount || 1) - 1}). Your fixture would use channels ${startChannel}-${endChannel}.`);
      return;
    }

    // Check if channels exceed DMX limit
    const channelCount = getSelectedModeChannelCount();
    if (startChannel + channelCount - 1 > 512) {
      setError(`Channels exceed DMX limit of 512. Your fixture would use channels ${startChannel}-${startChannel + channelCount - 1}.`);
      return;
    }

    updateFixture({
      variables: {
        id: fixture.id,
        input: {
          name,
          description: description || null,
          definitionId: selectedDefinitionId,
          modeId: selectedModeId || null,
          universe,
          startChannel,
        },
      },
    });
  };

  const handleDelete = () => {
    if (!fixture) return;
    
    deleteFixture({
      variables: {
        id: fixture.id,
      },
    });
  };

  const handleClose = () => {
    setManufacturer('');
    setModel('');
    setUniverse(1);
    setStartChannel(1);
    setSelectedDefinitionId('');
    setSelectedModeId('');
    setSelectedModelData(null);
    setName('');
    setDescription('');
    setError(null);
    setShowDeleteConfirm(false);
    setAutoSelectChannel(false);
    onClose();
  };

  if (!fixture) return null;

  const formContent = (
    <form id="edit-fixture-form" onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error updating fixture
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p className="whitespace-pre-wrap select-all">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fixture Name
        </label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="edit-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for this fixture..."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <Autocomplete
        label="Manufacturer"
        value={manufacturer}
        onChange={setManufacturer}
        onInputChange={handleManufacturerSearch}
        options={manufacturers}
        placeholder="Search manufacturers..."
        loading={loadingManufacturers}
        required
      />

      <Autocomplete
        label="Model"
        value={model}
        onChange={handleModelSelect}
        onInputChange={() => {}}
        options={models.map(m => m.model)}
        placeholder={manufacturer ? "Select model..." : "Select manufacturer first"}
        loading={loadingModels}
        required
      />

      {selectedModelData && selectedModelData.modes.length > 0 && (
        <div>
          <label htmlFor="edit-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mode
          </label>
          <select
            id="edit-mode"
            value={selectedModeId}
            onChange={(e) => handleModeSelect(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select mode...</option>
            {selectedModelData.modes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name} ({mode.channelCount} channels)
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="edit-universe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Universe
        </label>
        <input
          id="edit-universe"
          type="number"
          min="1"
          max="32768"
          value={universe}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setUniverse(1);
            } else {
              const num = parseInt(value);
              if (!isNaN(num)) {
                setUniverse(num);
              }
            }
          }}
          onFocus={(e) => e.target.select()}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="edit-startChannel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Start Channel
        </label>
        <div className="flex gap-2">
          <input
            id="edit-startChannel"
            type="number"
            min="1"
            max="512"
            value={startChannel}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setStartChannel(1);
              } else {
                const num = parseInt(value);
                if (!isNaN(num)) {
                  setStartChannel(num);
                  setAutoSelectChannel(false);
                }
              }
            }}
            onFocus={(e) => e.target.select()}
            required
            disabled={autoSelectChannel}
            className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => {
              setAutoSelectChannel(!autoSelectChannel);
            }}
            disabled={!selectedModeId}
            className={`px-3 py-2 text-base font-medium rounded-md border min-h-[44px] ${autoSelectChannel
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={selectedModeId ? "Auto-select next available channel" : "Select a mode first"}
          >
            Auto
          </button>
        </div>
        {autoSelectChannel && startChannel > 0 && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Auto-selected channel {startChannel}
          </p>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Are you sure you want to delete this fixture? This action cannot be undone.
          </p>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`${isMobile ? 'w-full' : ''} inline-flex justify-center rounded-md bg-red-600 px-3 py-2 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50 min-h-[44px]`}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className={`${isMobile ? 'w-full' : ''} inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 min-h-[44px]`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
      {isMobile ? (
        <>
          <button
            type="submit"
            form="edit-fixture-form"
            disabled={updating || !selectedDefinitionId}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            {updating ? 'Updating...' : 'Update Fixture'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-3 text-base font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 min-h-[44px] touch-manipulation"
          >
            Delete Fixture
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600 bg-white dark:bg-gray-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-fixture-form"
              disabled={updating || !selectedDefinitionId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Fixture'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Fixture"
      footer={footerContent}
      maxWidth="max-w-lg"
      testId="edit-fixture-modal"
    >
      {formContent}
    </BottomSheet>
  );
}