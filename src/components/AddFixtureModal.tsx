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
import BottomSheet from "./BottomSheet";
import { useIsMobile } from "@/hooks/useMediaQuery";

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
  const isMobile = useIsMobile();
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [universe, setUniverse] = useState("1");
  const [startChannel, setStartChannel] = useState("1");
  const [selectedDefinitionId, setSelectedDefinitionId] = useState("");
  const [selectedModeId, setSelectedModeId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [numFixtures, setNumFixtures] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isManualName, setIsManualName] = useState(false);
  const [channelAssignments, setChannelAssignments] = useState<
    Array<{
      startChannel: number;
      endChannel: number;
      channelCount: number;
    }>
  >([]);

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
      fetchPolicy: 'network-only', // Always fetch fresh data, don't use cache
      onCompleted: (data) => {
        if (data?.suggestChannelAssignment?.assignments?.length > 0) {
          const assignments = data.suggestChannelAssignment.assignments;

          // Store all assignments for creating fixtures in non-contiguous gaps
          setChannelAssignments(assignments.map((a: {
            startChannel: number;
            endChannel: number;
            channelCount: number;
          }) => ({
            startChannel: a.startChannel,
            endChannel: a.endChannel,
            channelCount: a.channelCount,
          })));

          // Set the first assignment's start channel for display
          setStartChannel(assignments[0].startChannel);
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
        setUniverse(initialUniverse.toString());
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
    univStr: string,
    channelStr: string,
    countStr: string,
    manualOverride: boolean,
  ) => {
    // Don't update name if user has manually entered one
    if (manualOverride) {
      return;
    }

    const univ = parseInt(univStr) || 1;
    const channel = parseInt(channelStr) || 1;
    const count = parseInt(countStr) || 1;

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


  // Automatically suggest channel assignment when relevant fields change
  useEffect(() => {
    // Only auto-assign if we have enough info and auto-select is enabled OR it's the first time
    const numFixturesNum = parseInt(numFixtures) || 0;
    const universeNum = parseInt(universe) || 1;

    if (selectedModeId && manufacturer && model && numFixturesNum > 0) {
      const channelCount = getSelectedModeChannelCount();
      const mode = selectedModelData?.modes.find((m) => m.id === selectedModeId);

      // Create fixture specs for the backend API
      const fixtureSpecs = Array.from({ length: numFixturesNum }, (_, i) => ({
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
            universe: universeNum,
            startingChannel: 1,
            fixtureSpecs,
          },
        },
      });
    }
    // Note: getSelectedModeChannelCount is included even though it depends on
    // selectedModelData and selectedModeId (both already in deps) to satisfy ESLint.
    // This is redundant but harmless since the callback is memoized.
  }, [universe, selectedModeId, numFixtures, manufacturer, model, selectedModelData, getSelectedModeChannelCount, projectId, suggestChannelAssignment]);

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

  // Helper to check if channel assignments are contiguous
  const areAssignmentsContiguous = useMemo(() => {
    if (channelAssignments.length <= 1) return true;

    for (let i = 1; i < channelAssignments.length; i++) {
      const prevEnd = channelAssignments[i - 1].endChannel;
      const currentStart = channelAssignments[i].startChannel;
      if (currentStart !== prevEnd + 1) {
        return false;
      }
    }
    return true;
  }, [channelAssignments]);

  // Format channel assignments for display
  const formatChannelAssignments = useMemo(() => {
    if (channelAssignments.length === 0) return null;
    if (channelAssignments.length === 1) return null;
    if (areAssignmentsContiguous) return null;

    const channels = channelAssignments.map(a => a.startChannel);
    if (channels.length <= 4) {
      return channels.join(', ');
    }
    return `${channels.slice(0, 3).join(', ')}, ... (${channels.length} total)`;
  }, [channelAssignments, areAssignmentsContiguous]);

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

    // Parse and validate numeric fields
    const numFixturesNum = numFixtures === "" ? NaN : parseInt(numFixtures);
    if (isNaN(numFixturesNum) || numFixturesNum < 1 || numFixturesNum > 512) {
      setError("Number of fixtures must be between 1 and 512");
      return;
    }

    const universeNum = universe === "" ? NaN : parseInt(universe);
    if (isNaN(universeNum) || universeNum < 1 || universeNum > 32768) {
      setError("Universe must be between 1 and 32768");
      return;
    }

    const startChannelNum = startChannel === "" ? NaN : parseInt(startChannel);
    if (isNaN(startChannelNum) || startChannelNum < 1 || startChannelNum > 512) {
      setError("Start channel must be between 1 and 512");
      return;
    }

    const channelCount = getSelectedModeChannelCount();

    // Use channel assignments from the API if available for multiple fixtures
    const useAssignments = numFixturesNum > 1 && channelAssignments.length === numFixturesNum;

    if (!useAssignments) {
      // Single fixture or manual channel selection - check for overlaps
      const overlap = checkChannelOverlap(universeNum, startChannelNum, numFixturesNum);
      if (overlap) {
        const endChannel = startChannelNum + channelCount * numFixturesNum - 1;
        const overlapEnd = overlap.startChannel + (overlap.channelCount || 1) - 1;
        setError(`Channel overlap detected with fixture "${overlap.name}" (U${overlap.universe}:${overlap.startChannel}-${overlapEnd}). Your fixtures would use channels ${startChannelNum}-${endChannel}.`);
        return;
      }

      // Check if channels exceed DMX limit
      if (startChannelNum + channelCount * numFixturesNum - 1 > 512) {
        setError(`Channels exceed DMX limit of 512. Your fixtures would use channels ${startChannelNum}-${startChannelNum + channelCount * numFixturesNum - 1}.`);
        return;
      }
    }

    try {
      // Find starting number for fixtures with this base name
      let startingNumber = 1;
      if (numFixturesNum > 1 && name && name.trim().length > 0) {
        // For multiple fixtures with a manual name, find the highest existing number
        const highestExisting = findHighestFixtureNumber(name);
        startingNumber = highestExisting + 1;
      }

      // Create fixtures
      for (let i = 0; i < numFixturesNum; i++) {
        // Use assignment from API if available, otherwise calculate sequentially
        const currentChannel = useAssignments
          ? channelAssignments[i].startChannel
          : startChannelNum + i * channelCount;

        let fixtureName: string;

        if (numFixturesNum === 1) {
          // Single fixture: use provided name or auto-generate
          fixtureName = name || `${manufacturer} ${model} - U${universeNum}:${currentChannel}`;
        } else {
          // Multiple fixtures: use name as prefix if provided, otherwise use manufacturer/model
          if (name) {
            fixtureName = `${name} ${startingNumber + i} - U${universeNum}:${currentChannel}`;
          } else {
            fixtureName = `${manufacturer} ${model} ${i + 1} - U${universeNum}:${currentChannel}`;
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
              universe: universeNum,
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
    setUniverse("1");
    setStartChannel("1");
    setSelectedDefinitionId("");
    setSelectedModeId("");
    setSelectedModelData(null);
    setName("");
    setDescription("");
    setNumFixtures("1");
    setError(null);
    setIsManualName(false);
    setChannelAssignments([]);
    onClose();
  };

  const formContent = (
    <form id="add-fixture-form" onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          onChange={(e) => setNumFixtures(e.target.value)}
          onFocus={(e) => e.target.select()}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        {parseInt(numFixtures) > 1 && selectedModeId && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Will use channels {parseInt(startChannel) || 1} -{" "}
            {(parseInt(startChannel) || 1) +
              getSelectedModeChannelCount() * (parseInt(numFixtures) || 1) -
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
          onChange={(e) => setUniverse(e.target.value)}
          onFocus={(e) => e.target.select()}
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            onChange={(e) => setStartChannel(e.target.value)}
            onFocus={(e) => e.target.select()}
            required
            className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="button"
            onClick={() => {
              // Manually trigger channel assignment refresh
              const numFixturesNum = parseInt(numFixtures) || 1;
              const universeNum = parseInt(universe) || 1;
              if (selectedModeId && manufacturer && model) {
                const channelCount = getSelectedModeChannelCount();
                const mode = selectedModelData?.modes.find((m) => m.id === selectedModeId);
                const fixtureSpecs = Array.from({ length: numFixturesNum }, (_, i) => ({
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
                      universe: universeNum,
                      startingChannel: 1,
                      fixtureSpecs,
                    },
                  },
                });
              }
            }}
            disabled={!selectedModeId || suggestingChannels}
            className="px-3 py-2 text-base font-medium rounded-md border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            title={selectedModeId ? "Refresh channel assignment" : "Select a mode first"}
          >
            {suggestingChannels ? "..." : "Auto"}
          </button>
        </div>
        {parseInt(startChannel) > 0 && (
          <div className="mt-1">
            {formatChannelAssignments ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Non-contiguous assignments: {formatChannelAssignments}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Suggested channel based on available space
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-3 justify-end'}`}>
      {isMobile ? (
        <>
          <button
            type="submit"
            form="add-fixture-form"
            disabled={creating || !selectedDefinitionId || !selectedModeId}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            {creating
              ? "Adding..."
              : numFixtures === "1"
                ? "Add Fixture"
                : `Add ${numFixtures} Fixtures`}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-fixture-form"
            disabled={creating || !selectedDefinitionId || !selectedModeId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating
              ? "Adding..."
              : numFixtures === "1"
                ? "Add Fixture"
                : `Add ${numFixtures} Fixtures`}
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Fixture"
      footer={footerContent}
      maxWidth="max-w-lg"
      testId="add-fixture-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
