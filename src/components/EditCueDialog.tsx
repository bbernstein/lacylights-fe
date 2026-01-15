"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomSheet from "./BottomSheet";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface Look {
  id: string;
  name: string;
  description?: string;
}

interface Effect {
  id: string;
  name: string;
  effectType: string;
  waveform?: string;
}

interface CueEffect {
  id: string;
  effectId: string;
  effect?: Effect | null;
  intensity?: number | null;
  speed?: number | null;
}

interface Cue {
  id: string;
  cueNumber: number;
  name: string;
  look: {
    id: string;
    name: string;
  };
  fadeInTime: number;
  fadeOutTime: number;
  followTime?: number;
  effects?: CueEffect[];
}

interface EditCueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cue: Cue;
  looks: Look[];
  availableEffects?: Effect[];
  externalError?: string | null;
  onUpdate: (params: {
    cueId: string;
    cueNumber?: number;
    name?: string;
    lookId?: string;
    fadeInTime?: number;
    fadeOutTime?: number;
    followTime?: number | null;
    action: "edit-look" | "stay";
  }) => void;
  onAddEffect?: (effectId: string, intensity?: number, speed?: number) => void;
  onRemoveEffect?: (effectId: string) => void;
}

/**
 * EditCueDialog provides a modal dialog for editing existing cues in a cue list.
 *
 * Features:
 * - Pre-populated form fields with current cue values
 * - Allows editing cue number, name, look reference, and timing parameters
 * - Look change warning when user selects a different look
 * - Two workflow options: "Save" or "Save & Edit Look" (opens look editor after save)
 * - Advanced timing controls for fade in/out and auto-follow timing
 *
 * The dialog validates all inputs and displays errors from both form validation
 * and server-side mutation failures. On mutation failure, the dialog remains open
 * to allow retry.
 *
 * @param props - Component props
 * @param props.isOpen - Controls dialog visibility
 * @param props.onClose - Callback when dialog is closed
 * @param props.cue - The cue to edit, with current values
 * @param props.looks - Available looks for selection
 * @param props.externalError - External error message from parent (e.g., mutation failure)
 * @param props.onUpdate - Callback when cue is updated, receives updated parameters and action
 *
 * @example
 * ```tsx
 * <EditCueDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   cue={currentCue}
 *   scenes={availableScenes}
 *   externalError={error}
 *   onUpdate={handleUpdateCue}
 * />
 * ```
 */
export default function EditCueDialog({
  isOpen,
  onClose,
  cue,
  looks,
  availableEffects = [],
  externalError,
  onUpdate,
  onAddEffect,
  onRemoveEffect,
}: EditCueDialogProps) {
  const isMobile = useIsMobile();
  // Form state
  const [cueNumber, setCueNumber] = useState("");
  const [cueName, setCueName] = useState("");
  const [selectedLookId, setSelectedLookId] = useState("");
  const [showAdvancedTiming, setShowAdvancedTiming] = useState(false);
  const [fadeInTime, setFadeInTime] = useState("");
  const [fadeOutTime, setFadeOutTime] = useState("");
  const [followTime, setFollowTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Effects state
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [selectedEffectToAdd, setSelectedEffectToAdd] = useState("");
  const [effectIntensity, setEffectIntensity] = useState(100);
  const [effectSpeed, setEffectSpeed] = useState(1.0);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen && cue) {
      setCueNumber(cue.cueNumber.toString());
      setCueName(cue.name);
      setSelectedLookId(cue.look.id);
      setFadeInTime(cue.fadeInTime.toString());
      setFadeOutTime(cue.fadeOutTime.toString());
      setFollowTime(cue.followTime ?? null);
      setShowAdvancedTiming(false);
      setShowEffectsPanel(!!(cue.effects && cue.effects.length > 0));
      setSelectedEffectToAdd("");
      setEffectIntensity(100);
      setEffectSpeed(1.0);
      setError(null);
    }
  }, [isOpen, cue]);

  const validateForm = (): string | null => {
    const cueNum = parseFloat(cueNumber);
    if (isNaN(cueNum) || cueNum < 0) {
      return "Cue number must be a valid positive number";
    }
    if (!cueName.trim()) {
      return "Cue name is required";
    }
    if (!selectedLookId) {
      return "Please select a look";
    }
    const fadeIn = fadeInTime === "" ? 0 : parseFloat(fadeInTime);
    if (isNaN(fadeIn) || fadeIn < 0) {
      return "Fade in time must be a valid positive number";
    }
    const fadeOut = fadeOutTime === "" ? 0 : parseFloat(fadeOutTime);
    if (isNaN(fadeOut) || fadeOut < 0) {
      return "Fade out time must be a valid positive number";
    }
    if (followTime !== null && followTime < 0) {
      return "Follow time must be positive";
    }
    return null;
  };

  const handleSubmit = (action: "edit-look" | "stay") => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const cueNum = parseFloat(cueNumber);
    const fadeIn = fadeInTime === "" ? 0 : parseFloat(fadeInTime);
    const fadeOut = fadeOutTime === "" ? 0 : parseFloat(fadeOutTime);

    onUpdate({
      cueId: cue.id,
      cueNumber: cueNum,
      name: cueName.trim(),
      lookId: selectedLookId,
      fadeInTime: fadeIn,
      fadeOutTime: fadeOut,
      followTime,
      action,
    });

    handleClose();
  };

  const handleClose = () => {
    setCueNumber("");
    setCueName("");
    setSelectedLookId("");
    setFadeInTime("");
    setFadeOutTime("");
    setFollowTime(null);
    setShowAdvancedTiming(false);
    setShowEffectsPanel(false);
    setSelectedEffectToAdd("");
    setEffectIntensity(100);
    setEffectSpeed(1.0);
    setError(null);
    onClose();
  };

  const formContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Update cue properties and timing settings.
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          required
        />
      </div>

      {/* Look Selection */}
      <div>
        <label
          htmlFor="look-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Look *
        </label>
        <select
          id="look-select"
          value={selectedLookId}
          onChange={(e) => setSelectedLookId(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        >
          <option value="">Select a look...</option>
          {looks.map((look) => (
            <option key={look.id} value={look.id}>
              {look.name}
            </option>
          ))}
        </select>
        {selectedLookId !== cue.look.id && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Warning: Changing look will update this cue to reference a different look
          </p>
        )}
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
              type="text"
              inputMode="decimal"
              value={fadeInTime}
              onChange={(e) => setFadeInTime(e.target.value)}
              placeholder="0"
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
              type="text"
              inputMode="decimal"
              value={fadeOutTime}
              onChange={(e) => setFadeOutTime(e.target.value)}
              placeholder="0"
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
              type="text"
              inputMode="decimal"
              value={followTime ?? ""}
              onChange={(e) =>
                setFollowTime(
                  e.target.value
                    ? parseFloat(e.target.value)
                    : null,
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

      {/* Effects Section */}
      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowEffectsPanel(!showEffectsPanel)}
            className="flex items-center space-x-2 min-h-[44px] touch-manipulation"
          >
            <svg
              className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform ${
                showEffectsPanel ? "rotate-90" : ""
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
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Effects {cue.effects && cue.effects.length > 0 && `(${cue.effects.length})`}
            </span>
          </button>
          <Link
            href="/effects"
            className="text-xs text-purple-600 hover:text-purple-500 dark:text-purple-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Manage Effects →
          </Link>
        </div>

        {/* Current effects on this cue */}
        {showEffectsPanel && (
          <div className="mt-3 space-y-3">
            {/* List of current effects */}
            {cue.effects && cue.effects.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Current Effects:
                </p>
                {cue.effects.map((cueEffect) => (
                  <div
                    key={cueEffect.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700"
                  >
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {cueEffect.effect?.name || "Unknown Effect"}
                      </span>
                      {cueEffect.intensity !== null && cueEffect.intensity !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({cueEffect.intensity}%)
                        </span>
                      )}
                    </div>
                    {onRemoveEffect && (
                      <button
                        type="button"
                        onClick={() => onRemoveEffect(cueEffect.effectId)}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        title="Remove effect"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-purple-700 dark:text-purple-300">
                No effects attached to this cue.
              </p>
            )}

            {/* Add effect form */}
            {onAddEffect && availableEffects.length > 0 && (
              <div className="pt-3 border-t border-purple-200 dark:border-purple-700 space-y-3">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Add Effect:
                </p>
                <div className="flex flex-col space-y-2">
                  <select
                    value={selectedEffectToAdd}
                    onChange={(e) => setSelectedEffectToAdd(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select an effect...</option>
                    {availableEffects
                      .filter(
                        (effect) =>
                          !cue.effects?.some((ce) => ce.effectId === effect.id)
                      )
                      .map((effect) => (
                        <option key={effect.id} value={effect.id}>
                          {effect.name} ({effect.effectType})
                        </option>
                      ))}
                  </select>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-purple-600 dark:text-purple-400 mb-1">
                        Intensity (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={effectIntensity}
                        onChange={(e) => setEffectIntensity(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-purple-600 dark:text-purple-400 mb-1">
                        Speed
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={effectSpeed}
                        onChange={(e) => setEffectSpeed(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEffectToAdd) {
                        onAddEffect(selectedEffectToAdd, effectIntensity, effectSpeed);
                        setSelectedEffectToAdd("");
                        setEffectIntensity(100);
                        setEffectSpeed(1.0);
                      }
                    }}
                    disabled={!selectedEffectToAdd}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    Add Effect
                  </button>
                </div>
              </div>
            )}

            {availableEffects.length === 0 && (
              <p className="text-xs text-purple-600 dark:text-purple-400 italic">
                No effects defined. Create effects in the Effects page first.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row justify-end space-x-3'}`}>
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => handleSubmit("edit-look")}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
          >
            Save & Edit Look
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("stay")}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation"
          >
            Save
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
            Save
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("edit-look")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save & Edit Look
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Cue"
      footer={footerContent}
      maxWidth="max-w-lg"
      testId="edit-cue-dialog"
    >
      {formContent}
    </BottomSheet>
  );
}
