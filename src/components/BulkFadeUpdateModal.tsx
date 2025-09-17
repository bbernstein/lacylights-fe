'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { BULK_UPDATE_CUES } from '@/graphql/cueLists';
import { Cue, BulkCueUpdateInput } from '@/types';

interface BulkFadeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCues: Cue[];
  onUpdate: () => void;
}

export default function BulkFadeUpdateModal({
  isOpen,
  onClose,
  selectedCues,
  onUpdate,
}: BulkFadeUpdateModalProps) {
  const [fadeInTime, setFadeInTime] = useState('');
  const [fadeOutTime, setFadeOutTime] = useState('');
  const [followTime, setFollowTime] = useState('');
  const [applyFadeIn, setApplyFadeIn] = useState(false);
  const [applyFadeOut, setApplyFadeOut] = useState(false);
  const [applyFollow, setApplyFollow] = useState(false);
  const [error, setError] = useState('');

  const [bulkUpdateCues, { loading }] = useMutation(BULK_UPDATE_CUES, {
    onCompleted: () => {
      onUpdate();
      onClose();
      resetForm();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const resetForm = () => {
    setFadeInTime('');
    setFadeOutTime('');
    setFollowTime('');
    setApplyFadeIn(false);
    setApplyFadeOut(false);
    setApplyFollow(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!applyFadeIn && !applyFadeOut && !applyFollow) {
      setError('Please select at least one timing to update');
      return;
    }

    const input: BulkCueUpdateInput = {
      cueIds: selectedCues.map(cue => cue.id),
    };

    if (applyFadeIn) {
      const fadeIn = parseFloat(fadeInTime);
      if (isNaN(fadeIn) || fadeIn < 0) {
        setError('Fade in time must be a valid positive number');
        return;
      }
      input.fadeInTime = fadeIn;
    }

    if (applyFadeOut) {
      const fadeOut = parseFloat(fadeOutTime);
      if (isNaN(fadeOut) || fadeOut < 0) {
        setError('Fade out time must be a valid positive number');
        return;
      }
      input.fadeOutTime = fadeOut;
    }

    if (applyFollow) {
      if (followTime.trim() === '') {
        input.followTime = undefined; // Clear follow time
      } else {
        const follow = parseFloat(followTime);
        if (isNaN(follow) || follow < 0) {
          setError('Follow time must be a valid positive number or empty to clear');
          return;
        }
        input.followTime = follow;
      }
    }

    bulkUpdateCues({
      variables: { input },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Bulk Update Fade Times
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Update timing for {selectedCues.length} selected cues
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fade In Time */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="applyFadeIn"
              checked={applyFadeIn}
              onChange={(e) => setApplyFadeIn(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="applyFadeIn" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
              Fade In Time (seconds)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={fadeInTime}
              onChange={(e) => setFadeInTime(e.target.value)}
              disabled={!applyFadeIn}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="3.0"
            />
          </div>

          {/* Fade Out Time */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="applyFadeOut"
              checked={applyFadeOut}
              onChange={(e) => setApplyFadeOut(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="applyFadeOut" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
              Fade Out Time (seconds)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={fadeOutTime}
              onChange={(e) => setFadeOutTime(e.target.value)}
              disabled={!applyFadeOut}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="3.0"
            />
          </div>

          {/* Follow Time */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="applyFollow"
              checked={applyFollow}
              onChange={(e) => setApplyFollow(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="applyFollow" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
              Follow Time (seconds)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={followTime}
              onChange={(e) => setFollowTime(e.target.value)}
              disabled={!applyFollow}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="0.0"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Leave follow time empty to clear auto-follow on selected cues
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!applyFadeIn && !applyFadeOut && !applyFollow)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Cues'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}