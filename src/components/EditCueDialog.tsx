'use client';

import { useState, useEffect } from 'react';

interface Scene {
  id: string;
  name: string;
  description?: string;
}

interface Cue {
  id: string;
  cueNumber: number;
  name: string;
  scene: {
    id: string;
    name: string;
  };
  fadeInTime: number;
  fadeOutTime: number;
  followTime?: number;
}

interface EditCueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cue: Cue;
  scenes: Scene[];
  onUpdate: (params: {
    cueId: string;
    cueNumber?: number;
    name?: string;
    sceneId?: string;
    fadeInTime?: number;
    fadeOutTime?: number;
    followTime?: number;
    action: 'edit-scene' | 'stay';
  }) => void;
}

export default function EditCueDialog({
  isOpen,
  onClose,
  cue,
  scenes,
  onUpdate,
}: EditCueDialogProps) {
  // Form state
  const [cueNumber, setCueNumber] = useState('');
  const [cueName, setCueName] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState('');
  const [showAdvancedTiming, setShowAdvancedTiming] = useState(false);
  const [fadeInTime, setFadeInTime] = useState(0);
  const [fadeOutTime, setFadeOutTime] = useState(0);
  const [followTime, setFollowTime] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen && cue) {
      setCueNumber(cue.cueNumber.toString());
      setCueName(cue.name);
      setSelectedSceneId(cue.scene.id);
      setFadeInTime(cue.fadeInTime);
      setFadeOutTime(cue.fadeOutTime);
      setFollowTime(cue.followTime);
      setShowAdvancedTiming(false);
      setError(null);
    }
  }, [isOpen, cue]);

  const validateForm = (): string | null => {
    const cueNum = parseFloat(cueNumber);
    if (isNaN(cueNum) || cueNum < 0) {
      return 'Cue number must be a valid positive number';
    }
    if (!cueName.trim()) {
      return 'Cue name is required';
    }
    if (!selectedSceneId) {
      return 'Please select a scene';
    }
    if (fadeInTime < 0) {
      return 'Fade in time must be positive';
    }
    if (fadeOutTime < 0) {
      return 'Fade out time must be positive';
    }
    if (followTime !== undefined && followTime < 0) {
      return 'Follow time must be positive';
    }
    return null;
  };

  const handleSubmit = (action: 'edit-scene' | 'stay') => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const cueNum = parseFloat(cueNumber);

    onUpdate({
      cueId: cue.id,
      cueNumber: cueNum,
      name: cueName.trim(),
      sceneId: selectedSceneId,
      fadeInTime,
      fadeOutTime,
      followTime,
      action,
    });

    handleClose();
  };

  const handleClose = () => {
    setCueNumber('');
    setCueName('');
    setSelectedSceneId('');
    setFadeInTime(0);
    setFadeOutTime(0);
    setFollowTime(undefined);
    setShowAdvancedTiming(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Cue</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update cue properties and timing settings.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use decimals to reorder cues (e.g., 5.5 between 5 and 6)
                </p>
              </div>

              {/* Cue Name */}
              <div>
                <label
                  htmlFor="cue-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Cue Name *
                </label>
                <input
                  id="cue-name"
                  type="text"
                  value={cueName}
                  onChange={(e) => setCueName(e.target.value)}
                  placeholder="e.g., Opening, Act 1 Scene 2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select a scene...</option>
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.name}
                    </option>
                  ))}
                </select>
                {selectedSceneId !== cue.scene.id && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Warning: Changing scene will update this cue to reference a different scene
                  </p>
                )}
              </div>

              {/* Advanced Timing Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedTiming(!showAdvancedTiming)}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  <svg
                    className={`w-4 h-4 mr-1 transition-transform ${
                      showAdvancedTiming ? 'rotate-90' : ''
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
                      onChange={(e) => setFadeInTime(parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                      onChange={(e) => setFadeOutTime(parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                      value={followTime ?? ''}
                      onChange={(e) =>
                        setFollowTime(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      placeholder="0 (no auto-follow)"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Automatically advance to next cue after this time
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('stay')}
                className="inline-flex justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('edit-scene')}
                className="inline-flex justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save & Edit Scene
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
