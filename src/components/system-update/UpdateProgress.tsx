'use client';

import React from 'react';

/**
 * Update state machine states
 */
export type UpdateState =
  | 'idle'
  | 'checking'
  | 'ready'
  | 'updating'
  | 'restarting'
  | 'reconnecting'
  | 'verifying'
  | 'complete'
  | 'error';

interface UpdateStep {
  state: UpdateState;
  label: string;
  icon: string;
}

const STEPS: UpdateStep[] = [
  { state: 'checking', label: 'Checking for updates', icon: '1' },
  { state: 'ready', label: 'Updates available', icon: '2' },
  { state: 'updating', label: 'Downloading & installing', icon: '3' },
  { state: 'restarting', label: 'Restarting services', icon: '4' },
  { state: 'reconnecting', label: 'Reconnecting to server', icon: '5' },
  { state: 'verifying', label: 'Verifying version', icon: '6' },
  { state: 'complete', label: 'Update complete', icon: '\u2713' },
];

interface UpdateProgressProps {
  currentState: UpdateState;
  errorMessage?: string;
}

/**
 * Visual progress indicator for the update process.
 * Shows the current step and marks completed steps.
 */
export function UpdateProgress({
  currentState,
  errorMessage,
}: UpdateProgressProps) {
  const currentIndex = STEPS.findIndex((step) => step.state === currentState);

  if (currentState === 'idle') {
    return null;
  }

  if (currentState === 'error') {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
            !
          </div>
          <div>
            <div className="font-semibold text-red-400">Update Failed</div>
            <div className="text-sm text-red-300">{errorMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = step.state === currentState;
        const isPending = index > currentIndex;

        return (
          <div
            key={step.state}
            className={`flex items-center gap-3 transition-opacity duration-300 ${
              isPending ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                isComplete
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-600 text-gray-300'
              }`}
            >
              {isComplete ? '\u2713' : step.icon}
            </div>
            <span
              className={`text-sm ${
                isComplete
                  ? 'text-green-400'
                  : isCurrent
                    ? 'text-blue-400 font-medium'
                    : 'text-gray-400'
              }`}
            >
              {step.label}
              {isCurrent && '...'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default UpdateProgress;
