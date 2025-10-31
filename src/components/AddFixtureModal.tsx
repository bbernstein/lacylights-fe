"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  GET_MANUFACTURERS,
  GET_MODELS,
  CREATE_FIXTURE_INSTANCE,
  GET_PROJECT_FIXTURES,
  SUGGEST_CHANNEL_ASSIGNMENT,
} from "@/graphql/fixtures";
import Autocomplete from "./Autocomplete";
import { FixtureDefinition } from "@/types";

interface AddFixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onFixtureAdded: () => void;
  // Optional pre-population for duplicate functionality
  initialName?: string;
  initialManufacturer?: string;
  initialModel?: string;
  initialMode?: string;
  initialUniverse?: number;
}

export default function AddFixtureModal({
  isOpen,
  onClose,
  projectId,
  onFixtureAdded,
  initialName,
  initialManufacturer,
  initialModel,
  initialMode,
  initialUniverse,
}: AddFixtureModalProps) {
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [universe, setUniverse] = useState(1);
  const [startChannel, setStartChannel] = useState(1);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState("");
  const [selectedModeId, setSelectedModeId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [numFixtures, setNumFixtures] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [autoSelectChannel, setAutoSelectChannel] = useState(false);
  const [isManualName, setIsManualName] = useState(false);

  // Ref for auto-focusing the number of fixtures field when duplicating
  const numFixturesInputRef = useRef<HTMLInputElement>(null);

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<
    Array<{
      id: string;
      model: string;
      modes: Array<{ id: string; name: string; channelCount: number }>;
    }>
  >([]);
  const [selectedModelData, setSelectedModelData] = useState<{
    id: string;
    model: string;
    modes: Array<{ id: string; name: string; channelCount: number }>;
  } | null>(null);

  // Get existing fixtures for overlap validation
  const { data: fixturesData } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId },
    skip: !projectId,
  });

  const existingFixtures = useMemo(() => fixturesData?.project?.fixtures || [], [fixturesData?.project?.fixtures]);

  const [getManufacturers, { loading: loadingManufacturers }] = useLazyQuery(
    GET_MANUFACTURERS,
    {
      onCompleted: (data) => {
        const uniqueManufacturers = Array.from(
          new Set(data.fixtureDefinitions.map((def: FixtureDefinition) => def.manufacturer)),
        );
        setManufacturers(uniqueManufacturers as string[]);
      },
    },
  );

  const [getModels, { loading: loadingModels }] = useLazyQuery(GET_MODELS, {
    onCompleted: (data) => {
      setModels(data.fixtureDefinitions);
    },
  });

  const [createFixture, { loading: creating }] = useMutation(
    CREATE_FIXTURE_INSTANCE,
    {
      onCompleted: () => {
        onFixtureAdded();
        handleClose();
      },
      onError: (error) => {
        setError(error.message);
      },
    },
  );

  const [suggestChannelAssignment, { loading: suggestingChannels }] = useLazyQuery(
    SUGGEST_CHANNEL_ASSIGNMENT,
    {
      onCompleted: (data) => {
        if (data?.suggestChannelAssignment?.assignments?.length > 0) {
          // Use the first assignment's start channel as the base.
          // The backend returns assignments for all fixtures in sequential order,
          // so the first assignment's channel is the starting point for the entire range.
          const firstAssignment = data.suggestChannelAssignment.assignments[0];
          setStartChannel(firstAssignment.startChannel);
        }
      },
      onError: (error) => {
        setError(error.message);
      },
    },
  );

  // Populate fields when modal opens with initial data (for duplicate)
  useEffect(() => {
    if (isOpen && initialManufacturer) {
      setManufacturer(initialManufacturer);
      setIsManualName(true); // Mark as manual since we're setting a specific name

      if (initialName) {
        setName(initialName);
      }
      if (initialUniverse) {
        setUniverse(initialUniverse);
      }

      // Fetch models for the manufacturer
      if (initialManufacturer) {
        getModels({ variables: { manufacturer: initialManufacturer } });
      }
    }
  }, [isOpen, initialManufacturer, initialName, initialUniverse, getModels]);

  // When models are loaded and we have an initial model, select it
  useEffect(() => {
    if (models.length > 0 && initialModel) {
      const matchingModel = models.find(m => m.model === initialModel);
      if (matchingModel) {
        setModel(initialModel);
        setSelectedDefinitionId(matchingModel.id);
        setSelectedModelData(matchingModel);

        // If we have an initial mode, select it
        if (initialMode) {
          const matchingMode = matchingModel.modes.find(mode => mode.name === initialMode);
          if (matchingMode) {
            setSelectedModeId(matchingMode.id);
          }
        }
      }
    }
  }, [models, initialModel, initialMode]);

  // Auto-focus and select the numFixtures field when duplicating
  useEffect(() => {
    if (isOpen && initialManufacturer && numFixturesInputRef.current) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        numFixturesInputRef.current?.focus();
        numFixturesInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialManufacturer]);

  useEffect(() => {
    if (manufacturer) {
      getModels({ variables: { manufacturer } });
    } else {
      setModels([]);
      setModel("");
      setSelectedDefinitionId("");
      setSelectedModeId("");
      setSelectedModelData(null);
    }
  }, [manufacturer, getModels]);

  const handleManufacturerSearch = (search: string) => {
    if (search) {
      getManufacturers({ variables: { search } });
    }
  };

  const handleModelSelect = (modelName: string) => {
    setModel(modelName);
    const selectedModel = models.find((m) => m.model === modelName);
    if (selectedModel) {
      setSelectedDefinitionId(selectedModel.id);
      setSelectedModelData(selectedModel);
      setSelectedModeId(""); // Reset mode selection
      // Auto-generate fixture name (unless user has manually entered one)
      updateFixtureName(
        manufacturer,
        modelName,
        universe,
        startChannel,
        numFixtures,
        isManualName,
      );
    }
  };

  const handleModeSelect = (modeId: string) => {
    setSelectedModeId(modeId);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Mark as manual name if user has entered any text
    if (value.trim().length > 0) {
      setIsManualName(true);
    } else {
      setIsManualName(false);
    }
  };

  const getSelectedModeChannelCount = useCallback(() => {
    if (!selectedModelData || !selectedModeId) return 1;
    const mode = selectedModelData.modes.find((m) => m.id === selectedModeId);
    return mode?.channelCount || 1;
  }, [selectedModelData, selectedModeId]);

  const updateFixtureName = useCallback((
    mfg: string,
    mdl: string,
    univ: number,
    channel: number,
    count: number,
    manualOverride: boolean,
  ) => {
    // Don't update name if user has manually entered one
    if (manualOverride) {
      return;
    }

    if (count === 1) {
      setName(`${mfg} ${mdl} - U${univ}:${channel}`);
    } else {
      setName(
        `${mfg} ${mdl} - U${univ}:${channel}-${channel + getSelectedModeChannelCount() * count - 1}`,
      );
    }
  }, [getSelectedModeChannelCount]);


  // Check if a channel range overlaps with existing fixtures
  const checkChannelOverlap = (univ: number, start: number, count: number) => {
    const channelCount = getSelectedModeChannelCount();
    const end = start + channelCount * count - 1;

    for (const fixture of existingFixtures) {
      if (fixture.universe === univ) {
        const fixtureChannelCount = fixture.channelCount || 1;
        const fixtureEnd = fixture.startChannel + fixtureChannelCount - 1;

        // Check if ranges overlap
        if (start <= fixtureEnd && end >= fixture.startChannel) {
          return fixture;
        }
      }
    }
    return null;
  };

  // Find the highest number suffix for fixtures with the given base name
  const findHighestFixtureNumber = (baseName: string): number => {
    let highestNumber = 0;

    // Pattern to match: baseName followed by space and number
    // e.g., "par 1", "par 2", "par 15"
    const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`);

    for (const fixture of existingFixtures) {
      const match = fixture.name.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNumber) {
          highestNumber = num;
        }
      }
    }

    return highestNumber;
  };


  // Auto-select next available channel when toggled
  useEffect(() => {
    if (autoSelectChannel && selectedModeId && manufacturer && model) {
      const channelCount = getSelectedModeChannelCount();
      const mode = selectedModelData?.modes.find((m) => m.id === selectedModeId);

      // Create fixture specs for the backend API
      const fixtureSpecs = Array.from({ length: numFixtures }, (_, i) => ({
        name: `${manufacturer} ${model} ${i + 1}`,
        manufacturer,
        model,
        mode: mode?.name,
        channelCount,
      }));

      suggestChannelAssignment({
        variables: {
          input: {
            projectId,
            universe,
            startingChannel: 1,
            fixtureSpecs,
          },
        },
      });
    }
    // Note: getSelectedModeChannelCount is included even though it depends on
    // selectedModelData and selectedModeId (both already in deps) to satisfy ESLint.
    // This is redundant but harmless since the callback is memoized.
  }, [autoSelectChannel, universe, selectedModeId, numFixtures, manufacturer, model, selectedModelData, getSelectedModeChannelCount, projectId, suggestChannelAssignment]);

  // Update fixture name when relevant fields change
  useEffect(() => {
    if (manufacturer && model && universe && startChannel) {
      updateFixtureName(
        manufacturer,
        model,
        universe,
        startChannel,
        numFixtures,
        isManualName,
      );
    }
  }, [
    manufacturer,
    model,
    universe,
    startChannel,
    numFixtures,
    selectedModeId,
    isManualName,
    updateFixtureName,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDefinitionId) {
      setError("Please select a valid fixture model");
      return;
    }

    if (!selectedModeId) {
      setError("Please select a fixture mode");
      return;
    }

    const channelCount = getSelectedModeChannelCount();

    // Check for channel overlap
    const overlap = checkChannelOverlap(universe, startChannel, numFixtures);
    if (overlap) {
      const endChannel = startChannel + channelCount * numFixtures - 1;
      const overlapEnd = overlap.startChannel + (overlap.channelCount || 1) - 1;
      setError(`Channel overlap detected with fixture "${overlap.name}" (U${overlap.universe}:${overlap.startChannel}-${overlapEnd}). Your fixtures would use channels ${startChannel}-${endChannel}.`);
      return;
    }

    // Check if channels exceed DMX limit
    if (startChannel + channelCount * numFixtures - 1 > 512) {
      setError(`Channels exceed DMX limit of 512. Your fixtures would use channels ${startChannel}-${startChannel + channelCount * numFixtures - 1}.`);
      return;
    }

    try {
      // Find starting number for fixtures with this base name
      let startingNumber = 1;
      if (numFixtures > 1 && name && name.trim().length > 0) {
        // For multiple fixtures with a manual name, find the highest existing number
        const highestExisting = findHighestFixtureNumber(name);
        startingNumber = highestExisting + 1;
      }

      // Create fixtures sequentially
      for (let i = 0; i < numFixtures; i++) {
        const currentChannel = startChannel + i * channelCount;
        let fixtureName: string;

        if (numFixtures === 1) {
          // Single fixture: use provided name or auto-generate
          fixtureName = name || `${manufacturer} ${model} - U${universe}:${currentChannel}`;
        } else {
          // Multiple fixtures: use name as prefix if provided, otherwise use manufacturer/model
          if (name && name.trim().length > 0) {
            fixtureName = `${name} ${startingNumber + i}`;
          } else {
            fixtureName = `${manufacturer} ${model} ${i + 1} - U${universe}:${currentChannel}`;
          }
        }

        await createFixture({
          variables: {
            input: {
              name: fixtureName,
              description: description || null,
              definitionId: selectedDefinitionId,
              modeId: selectedModeId || null,
              projectId,
              universe,
              startChannel: currentChannel,
            },
          },
        });
      }
      // Success handling is done in the mutation's onCompleted
    } catch {
      // Error handling is done in the mutation's onError
    }
  };

  const handleClose = () => {
    setManufacturer("");
    setModel("");
    setUniverse(1);
    setStartChannel(1);
    setSelectedDefinitionId("");
    setSelectedModeId("");
    setSelectedModelData(null);
    setName("");
    setDescription("");
    setNumFixtures(1);
    setError(null);
    setAutoSelectChannel(false);
    setIsManualName(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Fixture
              </h3>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error creating fixture
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
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Fixture Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description for this fixture..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                options={models.map((m) => m.model)}
                placeholder={
                  manufacturer ? "Select model..." : "Select manufacturer first"
                }
                loading={loadingModels}
                required
              />

              {selectedModelData && selectedModelData.modes.length > 0 && (
                <div>
                  <label
                    htmlFor="mode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Mode
                  </label>
                  <select
                    id="mode"
                    value={selectedModeId}
                    onChange={(e) => handleModeSelect(e.target.value)}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                <label
                  htmlFor="numFixtures"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Number of Fixtures
                </label>
                <input
                  ref={numFixturesInputRef}
                  id="numFixtures"
                  type="number"
                  min="1"
                  max="512"
                  value={numFixtures}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setNumFixtures(1);
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num)) {
                        setNumFixtures(num);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {numFixtures > 1 && selectedModeId && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Will use channels {startChannel} -{" "}
                    {startChannel +
                      getSelectedModeChannelCount() * numFixtures -
                      1}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="universe"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Universe
                </label>
                <input
                  id="universe"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="startChannel"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Start Channel
                </label>
                <div className="flex gap-2">
                  <input
                    id="startChannel"
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
                    className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSelectChannel(!autoSelectChannel);
                    }}
                    disabled={!selectedModeId || suggestingChannels}
                    className={`px-3 py-2 text-sm font-medium rounded-md border ${autoSelectChannel
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={selectedModeId ? "Auto-select next available channel" : "Select a mode first"}
                  >
                    {suggestingChannels ? "..." : "Auto"}
                  </button>
                </div>
                {autoSelectChannel && startChannel > 0 && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    Auto-selected channel {startChannel}
                  </p>
                )}
              </div>
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
                disabled={creating || !selectedDefinitionId || !selectedModeId}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating
                  ? "Adding..."
                  : numFixtures === 1
                    ? "Add Fixture"
                    : `Add ${numFixtures} Fixtures`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
