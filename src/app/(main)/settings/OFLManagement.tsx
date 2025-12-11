'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_OFL_IMPORT_STATUS,
  CHECK_OFL_UPDATES,
  TRIGGER_OFL_IMPORT,
  CANCEL_OFL_IMPORT,
  OFL_IMPORT_PROGRESS,
} from '@/graphql/ofl';
import {
  OFLImportStatus,
  OFLUpdateCheckResult,
  OFLImportResult,
  OFLImportPhase,
  OFLFixtureChangeType,
} from '@/types';

// Progress bar component
function OFLProgressBar({
  status,
  onCancel,
}: {
  status: OFLImportStatus;
  onCancel: () => void;
}) {
  const phaseLabels: Record<OFLImportPhase, string> = {
    [OFLImportPhase.IDLE]: 'Idle',
    [OFLImportPhase.INITIALIZING]: 'Initializing...',
    [OFLImportPhase.DOWNLOADING]: 'Downloading from GitHub...',
    [OFLImportPhase.EXTRACTING]: 'Extracting bundle...',
    [OFLImportPhase.ANALYZING]: 'Analyzing fixtures...',
    [OFLImportPhase.IMPORTING]: 'Importing fixtures...',
    [OFLImportPhase.FINALIZING]: 'Finalizing...',
    [OFLImportPhase.COMPLETED]: 'Completed',
    [OFLImportPhase.FAILED]: 'Failed',
    [OFLImportPhase.CANCELLED]: 'Cancelled',
  };

  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-medium text-blue-900 dark:text-blue-100">
          {phaseLabels[status.phase]}
        </span>
        <button
          onClick={onCancel}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(status.percentComplete, 100)}%` }}
        />
      </div>

      {/* Status details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-gray-600 dark:text-gray-400">
          Progress: {status.processedFixtures} / {status.totalFixtures}
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-right">
          {status.percentComplete.toFixed(1)}%
        </div>

        {status.currentManufacturer && (
          <div className="text-gray-600 dark:text-gray-400 col-span-2 truncate">
            Current: {status.currentManufacturer}
            {status.currentFixture && ` / ${status.currentFixture}`}
          </div>
        )}

        <div className="text-green-600 dark:text-green-400">
          Imported: {status.successfulImports}
        </div>
        <div className="text-gray-500 dark:text-gray-500 text-right">
          ETA: {formatTime(status.estimatedSecondsRemaining)}
        </div>

        {status.failedImports > 0 && (
          <div className="text-red-600 dark:text-red-400">
            Failed: {status.failedImports}
          </div>
        )}
        {status.skippedDuplicates > 0 && (
          <div className="text-yellow-600 dark:text-yellow-400">
            Skipped: {status.skippedDuplicates}
          </div>
        )}
      </div>

      {status.errorMessage && (
        <div className="text-red-600 dark:text-red-400 text-sm mt-2">
          Error: {status.errorMessage}
        </div>
      )}
    </div>
  );
}

// Update summary table
function OFLUpdateTable({ result }: { result: OFLUpdateCheckResult }) {
  const newFixtures = result.updates.filter(
    (u) => u.changeType === OFLFixtureChangeType.NEW
  );
  const updatedFixtures = result.updates.filter(
    (u) => u.changeType === OFLFixtureChangeType.UPDATED
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {result.totalNew}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">New Fixtures</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {result.totalUpdated}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Updated</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {result.totalInUse}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Use</div>
        </div>
      </div>

      {/* Detailed list (collapsible) */}
      {(newFixtures.length > 0 || updatedFixtures.length > 0) && (
        <details className="bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
            View details ({newFixtures.length + updatedFixtures.length} fixtures)
          </summary>
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="text-left py-2">Manufacturer</th>
                  <th className="text-left py-2">Model</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">In Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...newFixtures, ...updatedFixtures].slice(0, 50).map((fixture, idx) => (
                  <tr key={idx}>
                    <td className="py-1 text-gray-900 dark:text-gray-100">
                      {fixture.manufacturer}
                    </td>
                    <td className="py-1 text-gray-700 dark:text-gray-300">
                      {fixture.model}
                    </td>
                    <td className="py-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          fixture.changeType === OFLFixtureChangeType.NEW
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {fixture.changeType}
                      </span>
                    </td>
                    <td className="py-1 text-right">
                      {fixture.isInUse && (
                        <span className="text-red-600 dark:text-red-400">
                          {fixture.instanceCount} instance{fixture.instanceCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {newFixtures.length + updatedFixtures.length > 50 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2">
                ...and {newFixtures.length + updatedFixtures.length - 50} more
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default function OFLManagement() {
  const [showOptions, setShowOptions] = useState(false);
  const [forceReimport, setForceReimport] = useState(false);
  const [updateInUseFixtures, setUpdateInUseFixtures] = useState(false);
  const [preferBundled, setPreferBundled] = useState(false);
  const [lastResult, setLastResult] = useState<OFLImportResult | null>(null);

  // Query current status
  const {
    data: statusData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<{ oflImportStatus: OFLImportStatus }>(GET_OFL_IMPORT_STATUS, {
    pollInterval: 5000, // Poll every 5 seconds as fallback
  });

  // Query for updates check
  const {
    data: updatesData,
    loading: updatesLoading,
    refetch: refetchUpdates,
  } = useQuery<{ checkOFLUpdates: OFLUpdateCheckResult }>(CHECK_OFL_UPDATES, {
    fetchPolicy: 'cache-first',
  });

  // Subscribe to real-time progress
  const { data: subscriptionData } = useSubscription<{
    oflImportProgress: OFLImportStatus;
  }>(OFL_IMPORT_PROGRESS);

  // Use subscription data if available, otherwise fall back to polling
  const currentStatus = subscriptionData?.oflImportProgress || statusData?.oflImportStatus;
  const updateCheckResult = updatesData?.checkOFLUpdates;

  // Mutations
  const [triggerImport, { loading: triggering }] = useMutation<{
    triggerOFLImport: OFLImportResult;
  }>(TRIGGER_OFL_IMPORT, {
    onCompleted: (result) => {
      setLastResult(result.triggerOFLImport);
      refetchStatus();
      refetchUpdates();
    },
  });

  const [cancelImport] = useMutation(CANCEL_OFL_IMPORT, {
    onCompleted: () => {
      refetchStatus();
    },
  });

  // Refresh updates check when import completes
  useEffect(() => {
    if (
      currentStatus?.phase === OFLImportPhase.COMPLETED ||
      currentStatus?.phase === OFLImportPhase.FAILED ||
      currentStatus?.phase === OFLImportPhase.CANCELLED
    ) {
      refetchUpdates();
    }
  }, [currentStatus?.phase, refetchUpdates]);

  const handleTriggerImport = async () => {
    setLastResult(null);
    await triggerImport({
      variables: {
        options: {
          forceReimport,
          updateInUseFixtures,
          preferBundled,
        },
      },
    });
  };

  const handleCancel = async () => {
    await cancelImport();
  };

  const handleCheckUpdates = async () => {
    await refetchUpdates();
  };

  const isImporting =
    currentStatus?.isImporting ||
    currentStatus?.phase === OFLImportPhase.DOWNLOADING ||
    currentStatus?.phase === OFLImportPhase.EXTRACTING ||
    currentStatus?.phase === OFLImportPhase.ANALYZING ||
    currentStatus?.phase === OFLImportPhase.IMPORTING ||
    currentStatus?.phase === OFLImportPhase.INITIALIZING;

  if (statusLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Open Fixture Library
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Import and update fixture definitions from OFL
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCheckUpdates}
            disabled={isImporting || updatesLoading}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {updatesLoading ? 'Checking...' : 'Check Updates'}
          </button>
          <button
            onClick={handleTriggerImport}
            disabled={isImporting || triggering}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {triggering ? 'Starting...' : 'Import/Update'}
          </button>
        </div>
      </div>

      {/* Import progress */}
      {isImporting && currentStatus && (
        <OFLProgressBar status={currentStatus} onCancel={handleCancel} />
      )}

      {/* Last result */}
      {lastResult && !isImporting && (
        <div
          className={`rounded-lg p-4 ${
            lastResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {lastResult.success ? 'Import Completed' : 'Import Failed'}
              </div>
              {lastResult.success && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Imported {lastResult.stats.successfulImports} fixtures
                  {lastResult.stats.updatedFixtures > 0 &&
                    `, updated ${lastResult.stats.updatedFixtures}`}
                  {lastResult.stats.skippedDuplicates > 0 &&
                    `, skipped ${lastResult.stats.skippedDuplicates} duplicates`}
                  {lastResult.stats.failedImports > 0 &&
                    `, ${lastResult.stats.failedImports} failed`}
                  {' '}in {lastResult.stats.durationSeconds.toFixed(1)}s
                </div>
              )}
              {lastResult.errorMessage && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {lastResult.errorMessage}
                </div>
              )}
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Update check results */}
      {updateCheckResult && !isImporting && !lastResult && (
        <div>
          {updateCheckResult.hasUpdates ? (
            <OFLUpdateTable result={updateCheckResult} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              Your fixture library is up to date.
            </div>
          )}
        </div>
      )}

      {/* Import options (collapsible) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <svg
            className={`w-4 h-4 mr-1 transform transition-transform ${
              showOptions ? 'rotate-90' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Import Options
        </button>

        {showOptions && (
          <div className="mt-3 space-y-3 pl-5">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={forceReimport}
                onChange={(e) => setForceReimport(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Force reimport (reimport all fixtures even if unchanged)
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={updateInUseFixtures}
                onChange={(e) => setUpdateInUseFixtures(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Update fixtures in use (may affect existing projects)
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferBundled}
                onChange={(e) => setPreferBundled(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Prefer bundled data (use offline data instead of downloading)
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
