'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_EFFECT, GET_EFFECTS } from '@/graphql/effects';
import {
  EffectType,
  PriorityBand,
  WaveformType,
  CompositionMode,
  TransitionBehavior,
} from '@/generated/graphql';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface CreateEffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onEffectCreated: () => void;
}

export default function CreateEffectModal({
  isOpen,
  onClose,
  projectId,
  onEffectCreated,
}: CreateEffectModalProps) {
  const isMobile = useIsMobile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effectType, setEffectType] = useState<EffectType>(EffectType.Waveform);
  const [priorityBand, setPriorityBand] = useState<PriorityBand>(PriorityBand.User);
  const [waveform, setWaveform] = useState<WaveformType>(WaveformType.Sine);
  const [frequency, setFrequency] = useState(1.0);
  const [amplitude, setAmplitude] = useState(1.0);
  const [offset, setOffset] = useState(0.0);
  const [compositionMode, setCompositionMode] = useState<CompositionMode>(CompositionMode.Override);
  const [onCueChange, setOnCueChange] = useState<TransitionBehavior>(TransitionBehavior.FadeOut);
  const [fadeDuration, setFadeDuration] = useState(1.0);
  const [masterValue, setMasterValue] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  const [createEffect, { loading: creating }] = useMutation(CREATE_EFFECT, {
    onCompleted: () => {
      onEffectCreated();
      handleClose();
    },
    onError: (error) => {
      setError(error.message);
    },
    refetchQueries: [{ query: GET_EFFECTS, variables: { projectId } }],
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const input: Record<string, unknown> = {
      name,
      projectId,
      effectType,
      priorityBand,
      compositionMode,
      onCueChange,
      fadeDuration,
    };

    // Add description if provided
    if (description.trim()) {
      input.description = description;
    }

    // Add type-specific fields
    if (effectType === EffectType.Waveform) {
      input.waveform = waveform;
      input.frequency = frequency;
      input.amplitude = amplitude;
      input.offset = offset;
    } else if (effectType === EffectType.Master) {
      input.masterValue = masterValue;
    }

    createEffect({
      variables: { input },
    });
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setDescription('');
    setEffectType(EffectType.Waveform);
    setPriorityBand(PriorityBand.User);
    setWaveform(WaveformType.Sine);
    setFrequency(1.0);
    setAmplitude(1.0);
    setOffset(0.0);
    setCompositionMode(CompositionMode.Override);
    setOnCueChange(TransitionBehavior.FadeOut);
    setFadeDuration(1.0);
    setMasterValue(1.0);
    setError(null);
    onClose();
  };

  // Helper labels for enums
  const effectTypeLabels: Record<EffectType, string> = {
    [EffectType.Waveform]: 'Waveform (LFO)',
    [EffectType.Crossfade]: 'Crossfade',
    [EffectType.Static]: 'Static',
    [EffectType.Master]: 'Master (Intensity)',
  };

  const priorityBandLabels: Record<PriorityBand, string> = {
    [PriorityBand.Base]: 'Base (0)',
    [PriorityBand.User]: 'User (1)',
    [PriorityBand.Cue]: 'Cue (2)',
    [PriorityBand.System]: 'System (3)',
  };

  const waveformLabels: Record<WaveformType, string> = {
    [WaveformType.Sine]: 'Sine',
    [WaveformType.Cosine]: 'Cosine',
    [WaveformType.Square]: 'Square',
    [WaveformType.Sawtooth]: 'Sawtooth',
    [WaveformType.Triangle]: 'Triangle',
    [WaveformType.Random]: 'Random',
  };

  const compositionModeLabels: Record<CompositionMode, string> = {
    [CompositionMode.Override]: 'Override',
    [CompositionMode.Additive]: 'Additive',
    [CompositionMode.Multiply]: 'Multiply',
  };

  const transitionBehaviorLabels: Record<TransitionBehavior, string> = {
    [TransitionBehavior.FadeOut]: 'Fade Out',
    [TransitionBehavior.Persist]: 'Persist',
    [TransitionBehavior.SnapOff]: 'Snap Off',
    [TransitionBehavior.CrossfadeParams]: 'Crossfade Params',
  };

  const formContent = (
    <form id="create-effect-form" onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Create a new lighting effect. After creating, you can assign fixtures to the effect.
      </p>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error creating effect
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p className="whitespace-pre-wrap select-all">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div>
        <label
          htmlFor="effect-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Effect Name *
        </label>
        <input
          id="effect-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Slow Pulse, Color Chase, Strobe"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="effect-description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="effect-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description of this effect..."
          rows={2}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Effect Type */}
      <div>
        <label
          htmlFor="effect-type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Effect Type *
        </label>
        <select
          id="effect-type"
          value={effectType}
          onChange={(e) => setEffectType(e.target.value as EffectType)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {Object.entries(effectTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Band */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="priority-band"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Priority Band
          </label>
          <select
            id="priority-band"
            value={priorityBand}
            onChange={(e) => setPriorityBand(e.target.value as PriorityBand)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {Object.entries(priorityBandLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="composition-mode"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Composition Mode
          </label>
          <select
            id="composition-mode"
            value={compositionMode}
            onChange={(e) => setCompositionMode(e.target.value as CompositionMode)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {Object.entries(compositionModeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Waveform-specific fields */}
      {effectType === EffectType.Waveform && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Waveform Parameters
          </h4>

          <div>
            <label
              htmlFor="waveform-type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Waveform Type
            </label>
            <select
              id="waveform-type"
              value={waveform}
              onChange={(e) => setWaveform(e.target.value as WaveformType)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {Object.entries(waveformLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="frequency"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Frequency (Hz)
              </label>
              <input
                id="frequency"
                type="number"
                step="0.1"
                min="0.01"
                max="100"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value) || 1)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="amplitude"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Amplitude
              </label>
              <input
                id="amplitude"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={amplitude}
                onChange={(e) => setAmplitude(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="offset"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Offset
              </label>
              <input
                id="offset"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={offset}
                onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Master-specific fields */}
      {effectType === EffectType.Master && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Master Parameters
          </h4>
          <div>
            <label
              htmlFor="master-value"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Master Value (0-1)
            </label>
            <input
              id="master-value"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={masterValue}
              onChange={(e) => setMasterValue(parseFloat(e.target.value) || 0)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Transition Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="on-cue-change"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            On Cue Change
          </label>
          <select
            id="on-cue-change"
            value={onCueChange}
            onChange={(e) => setOnCueChange(e.target.value as TransitionBehavior)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {Object.entries(transitionBehaviorLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="fade-duration"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Fade Duration (s)
          </label>
          <input
            id="fade-duration"
            type="number"
            step="0.1"
            min="0"
            max="60"
            value={fadeDuration}
            onChange={(e) => setFadeDuration(parseFloat(e.target.value) || 0)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
    </form>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-3 justify-end'}`}>
      {isMobile ? (
        <>
          <button
            type="submit"
            form="create-effect-form"
            disabled={creating || !name.trim()}
            className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            {creating ? 'Creating...' : 'Create Effect'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-effect-form"
            disabled={creating || !name.trim()}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Effect'}
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Effect"
      footer={footerContent}
      maxWidth="max-w-lg"
      testId="create-effect-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
