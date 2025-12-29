"use client";

import { useState, useEffect } from "react";
import BottomSheet from "./BottomSheet";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface Scene {
  id: string;
  name: string;
  description?: string;
}

interface AddCueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cueListId: string;
  currentCueNumber: number;
  currentSceneId: string | null;
  scenes: Scene[];
  defaultFadeInTime?: number;
  defaultFadeOutTime?: number;
  externalError?: string | null;
  onAdd: (params: {
    cueNumber: number;
    name: string;
    sceneId: string;
    createCopy: boolean;
    fadeInTime: number;
    fadeOutTime: number;
    followTime?: number;
    action: "edit" | "stay";
  }) => void;
}

/**
 * AddCueDialog provides a modal dialog for creating new cues in a cue list.
 *
 * Features:
 * - Auto-calculates insert position (currentCueNumber + 0.5) for seamless cue insertion
 * - Smart defaults: pre-populates scene and timing values based on current context
 * - Scene copy option: create independent scene copy to prevent affecting other cues
 * - Two workflow options: "Add Only" or "Add & Edit" (opens scene editor immediately)
 * - Advanced timing controls: fade in/out times and auto-follow timing
 *
 * The dialog validates all inputs and displays errors from both form validation
 * and server-side mutation failures.
 *
 * @param props - Component props
 * @param props.isOpen - Controls dialog visibility
 * @param props.onClose - Callback when dialog is closed
 * @param props.cueListId - ID of the cue list to add the cue to
 * @param props.currentCueNumber - Current cue number, used to calculate insert position
 * @param props.currentSceneId - Current scene ID for pre-selecting in dropdown
 * @param props.scenes - Available scenes for selection
 * @param props.defaultFadeInTime - Default fade in time in seconds (default: 3)
 * @param props.defaultFadeOutTime - Default fade out time in seconds (default: 3)
 * @param props.externalError - External error message from parent (e.g., mutation failure)
 * @param props.onAdd - Callback when cue is added, receives cue parameters and action
 *
 * @example
 * ```tsx
 * <AddCueDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   cueListId="list-123"
 *   currentCueNumber={5}
 *   currentSceneId="scene-456"
 *   scenes={availableScenes}
 *   externalError={error}
 *   onAdd={handleAddCue}
 * />
 * ```
 */
export default function AddCueDialog({
  isOpen,
  onClose,
  currentCueNumber,
  currentSceneId,
  scenes,
  defaultFadeInTime = 3,
  defaultFadeOutTime = 3,
  externalError,
  onAdd,
}: AddCueDialogProps) {
  const isMobile = useIsMobile();
  // Form state
  const [cueNumber, setCueNumber] = useState("");
  const [cueName, setCueName] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [createCopy, setCreateCopy] = useState(true);
  const [showAdvancedTiming, setShowAdvancedTiming] = useState(false);
  const [fadeInTime, setFadeInTime] = useState(defaultFadeInTime);
  const [fadeOutTime, setFadeOutTime] = useState(defaultFadeOutTime);
  const [followTime, setFollowTime] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Auto-calculate insert position (between current and next cue)
      const insertPosition = currentCueNumber >= 0 ? currentCueNumber + 0.5 : 1;
      setCueNumber(insertPosition.toString());

      // Default to current scene if available
      if (currentSceneId) {
        setSelectedSceneId(currentSceneId);
      } else if (scenes.length > 0) {
        setSelectedSceneId(scenes[0].id);
      }

      // Generate default cue name
      const newCueIndex = Math.floor(insertPosition);
      setCueName(`Cue ${newCueIndex}`);

      // Reset other fields
      setCreateCopy(true);
      setFadeInTime(defaultFadeInTime);
      setFadeOutTime(defaultFadeOutTime);
      setFollowTime(undefined);
      setShowAdvancedTiming(false);
      setError(null);
    }
  }, [
    isOpen,
    currentCueNumber,
    currentSceneId,
    scenes,
    defaultFadeInTime,
    defaultFadeOutTime,
  ]);

  const validateForm = (): string | null => {
    const cueNum = parseFloat(cueNumber);
    if (isNaN(cueNum) || cueNum < 0) {
      return "Cue number must be a valid positive number";
    }
    if (!selectedSceneId) {
      return "Please select a scene";
    }
    if (fadeInTime < 0) {
      return "Fade in time must be positive";
    }
    if (fadeOutTime < 0) {
      return "Fade out time must be positive";
    }
    if (followTime !== undefined && followTime < 0) {
      return "Follow time must be positive";
    }
    return null;
  };

  const handleSubmit = (action: "edit" | "stay") => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const cueNum = parseFloat(cueNumber);

    onAdd({
      cueNumber: cueNum,
      name: cueName.trim() || `Cue ${Math.floor(cueNum)}`,
      sceneId: selectedSceneId,
      createCopy,
      fadeInTime,
      fadeOutTime,
      followTime,
      action,
    });

    handleClose();
  };

  const handleClose = () => {
    setCueNumber("");
    setCueName("");
    setSelectedSceneId("");
    setCreateCopy(true);
    setFadeInTime(defaultFadeInTime);
    setFadeOutTime(defaultFadeOutTime);
    setFollowTime(undefined);
    setShowAdvancedTiming(false);
    setError(null);
    onClose();
  };

  const formContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Insert a new cue after the current position in the cue list.
      </p>

      {/* Error message */}
      {(error || externalError) && (
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
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error || externalError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cue Number */}
      <div>
        <label
          htmlFor="cue-number"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Cue Number *
        </label>
        <input
          id="cue-number"
          type="number"
          step="0.1"
          value={cueNumber}
          onChange={(e) => setCueNumber(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Use decimals to insert between cues (e.g., 5.5 between 5 and 6)
        </p>
      </div>

      {/* Cue Name */}
      <div>
        <label
          htmlFor="cue-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Cue Name
        </label>
        <input
          id="cue-name"
          type="text"
          value={cueName}
          onChange={(e) => setCueName(e.target.value)}
          placeholder="e.g., Opening, Act 1 Scene 2"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Scene Selection */}
      <div>
        <label
          htmlFor="scene-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Scene *
        </label>
        <select
          id="scene-select"
          value={selectedSceneId}
          onChange={(e) => setSelectedSceneId(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="">Select a scene...</option>
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Copy Checkbox */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="create-copy"
            type="checkbox"
            checked={createCopy}
            onChange={(e) => setCreateCopy(e.target.checked)}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
          />
        </div>
        <div className="ml-3 text-sm">
          <label
            htmlFor="create-copy"
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            Create a copy of the scene
          </label>
          <p className="text-gray-500 dark:text-gray-400">
            {createCopy
              ? "Recommended: Changes will not affect other cues using this scene"
              : "Warning: Changes will affect all cues using this scene"}
          </p>
        </div>
      </div>

      {/* Advanced Timing Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvancedTiming(!showAdvancedTiming)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 min-h-[44px] touch-manipulation"
        >
          <svg
            className={`w-4 h-4 mr-1 transition-transform ${
              showAdvancedTiming ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Advanced Timing
        </button>
      </div>

      {/* Advanced Timing Fields */}
      {showAdvancedTiming && (
        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
          <div>
            <label
              htmlFor="fade-in-time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Fade In Time (seconds)
            </label>
            <input
              id="fade-in-time"
              type="number"
              step="0.1"
              min="0"
              value={fadeInTime}
              onChange={(e) =>
                setFadeInTime(parseFloat(e.target.value) || 0)
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="fade-out-time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Fade Out Time (seconds)
            </label>
            <input
              id="fade-out-time"
              type="number"
              step="0.1"
              min="0"
              value={fadeOutTime}
              onChange={(e) =>
                setFadeOutTime(parseFloat(e.target.value) || 0)
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="follow-time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Follow Time (seconds, optional)
            </label>
            <input
              id="follow-time"
              type="number"
              step="0.1"
              min="0"
              value={followTime ?? ""}
              onChange={(e) =>
                setFollowTime(
                  e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                )
              }
              placeholder="0 (no auto-follow)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Automatically advance to next cue after this time
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row justify-end space-x-3'}`}>
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => handleSubmit("edit")}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
          >
            Add & Edit
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("stay")}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation"
          >
            Add Only
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("stay")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Add Only
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("edit")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add & Edit
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Cue"
      footer={footerContent}
      maxWidth="max-w-lg"
      testId="add-cue-dialog"
    >
      {formContent}
    </BottomSheet>
  );
}
