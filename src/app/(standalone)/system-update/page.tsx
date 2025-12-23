'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import Link from 'next/link';
import {
  GET_SYSTEM_VERSIONS,
  GET_AVAILABLE_VERSIONS,
  UPDATE_REPOSITORY,
  UPDATE_ALL_REPOSITORIES,
  GET_BUILD_INFO,
} from '@/graphql/versionManagement';
import { UpdateProgress, UpdateState } from '@/components/system-update/UpdateProgress';
import { ReconnectCountdown } from '@/components/system-update/ReconnectCountdown';
import { useReconnectPoller } from '@/hooks/useReconnectPoller';
import { isPrerelease, compareVersions } from './utils';

/** Backend repository names that trigger server restart on update */
const BACKEND_REPOS = ['lacylights-go', 'lacylights-mcp'] as const;
const GO_BACKEND_REPO = 'lacylights-go';

interface RepositoryVersion {
  repository: string;
  installed: string;
  latest: string;
  updateAvailable: boolean;
}

interface UpdateResult {
  success: boolean;
  repository: string;
  previousVersion: string;
  newVersion: string;
  message?: string;
  error?: string;
}

/**
 * System Update page - dedicated route for version management.
 * Handles server disconnection gracefully during updates.
 */
export default function SystemUpdatePage() {
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [expectedVersion, setExpectedVersion] = useState<string>('');

  // Version selection state
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [availableVersions, setAvailableVersions] = useState<Record<string, string[]>>({});

  // GraphQL queries
  const {
    data: versionsData,
    loading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions,
  } = useQuery(GET_SYSTEM_VERSIONS, {
    pollInterval: updateState === 'idle' ? 30000 : 0, // Only poll when idle
    fetchPolicy: 'network-only',
  });

  const { data: buildInfoData, refetch: refetchBuildInfo } = useQuery(
    GET_BUILD_INFO,
    {
      fetchPolicy: 'network-only',
    }
  );

  // Mutations
  const [updateRepository] = useMutation(UPDATE_REPOSITORY);
  const [updateAllRepositories] = useMutation(UPDATE_ALL_REPOSITORIES);

  // Lazy query for fetching available versions
  const [fetchAvailableVersions, { loading: versionsListLoading }] = useLazyQuery(
    GET_AVAILABLE_VERSIONS,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        if (expandedRepo && data?.availableVersions) {
          const versions = [...data.availableVersions].sort(compareVersions);
          setAvailableVersions((prev) => ({
            ...prev,
            [expandedRepo]: versions,
          }));
        }
      },
      onError: () => {
        setErrorMessage(
          'Failed to fetch available versions. Please check your connection and try again.'
        );
      },
    }
  );

  // Reconnection poller
  const { countdown, isPolling, startPolling, stopPolling } =
    useReconnectPoller({
      maxDuration: 90000, // 90 seconds for updates that include builds
      pollInterval: 2000,
      onReconnect: async (healthInfo) => {
        setUpdateState('verifying');

        // Verify version matches expected
        try {
          const { data } = await refetchBuildInfo();
          const currentVersion = data?.buildInfo?.version;

          if (expectedVersion && currentVersion === expectedVersion) {
            setUpdateState('complete');
            // Force page refresh after short delay to load new frontend
            setTimeout(() => {
              window.location.href = `${window.location.origin}/system-update?updated=true`;
            }, 2000);
          } else if (expectedVersion) {
            setUpdateState('complete');
            setUpdateResults((prev) => [
              ...prev,
              {
                success: true,
                repository: GO_BACKEND_REPO,
                previousVersion: 'unknown',
                newVersion: healthInfo.version || 'unknown',
                message: `Server is running v${healthInfo.version || 'unknown'}`,
              },
            ]);
          } else {
            setUpdateState('complete');
          }
        } catch (error) {
          // If we can't verify, still mark complete since server is up
          // Log the error for debugging but don't block the update flow
          console.error('Failed to verify version after reconnect:', error);
          setUpdateState('complete');
        }

        // Refetch version data
        refetchVersions();
      },
      onTimeout: () => {
        setUpdateState('error');
        setErrorMessage(
          'Timeout waiting for server to restart. Please check the server manually.'
        );
      },
    });

  // Toggle version selector for a repository
  const handleToggleVersionSelector = useCallback(
    (repository: string) => {
      if (expandedRepo === repository) {
        setExpandedRepo(null);
      } else {
        setExpandedRepo(repository);
        // Fetch versions if not already cached
        if (!availableVersions[repository]) {
          fetchAvailableVersions({ variables: { repository } });
        }
      }
    },
    [expandedRepo, availableVersions, fetchAvailableVersions]
  );

  // Handle version selection
  const handleVersionSelect = useCallback((repository: string, version: string) => {
    setSelectedVersions((prev) => ({
      ...prev,
      [repository]: version,
    }));
  }, []);

  // Handle update all
  const handleUpdateAll = useCallback(async () => {
    setUpdateState('updating');
    setErrorMessage('');
    setUpdateResults([]);

    try {
      const { data } = await updateAllRepositories();
      const results = data?.updateAllRepositories || [];
      setUpdateResults(results);

      // Check if any backend updates were performed
      const goUpdate = results.find(
        (r: UpdateResult) => r.repository === GO_BACKEND_REPO && r.success
      );

      if (goUpdate) {
        // Backend was updated, need to wait for restart
        setExpectedVersion(goUpdate.newVersion);
        setUpdateState('restarting');

        // Give server time to start shutting down
        setTimeout(() => {
          setUpdateState('reconnecting');
          startPolling();
        }, 3000);
      } else {
        // No backend update, check for errors
        const hasErrors = results.some((r: UpdateResult) => !r.success);
        if (hasErrors) {
          const errors = results
            .filter((r: UpdateResult) => !r.success)
            .map((r: UpdateResult) => `${r.repository}: ${r.error}`)
            .join('; ');
          setUpdateState('error');
          setErrorMessage(errors);
        } else {
          setUpdateState('complete');
          // Refresh page after frontend update
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    } catch (err) {
      setUpdateState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Update failed');
    }
  }, [updateAllRepositories, startPolling]);

  // Handle single repository update
  const handleUpdateRepository = useCallback(
    async (repository: string, targetVersion?: string) => {
      setUpdateState('updating');
      setErrorMessage('');
      setUpdateResults([]);
      setExpandedRepo(null);
      // Clear selected version for this repository to ensure clean state
      setSelectedVersions((prev) => {
        const updated = { ...prev };
        delete updated[repository];
        return updated;
      });

      try {
        const { data } = await updateRepository({
          variables: { repository, version: targetVersion },
        });

        const result = data?.updateRepository;
        if (!result) {
          throw new Error('No response from update');
        }

        setUpdateResults([result]);

        if (!result.success) {
          setUpdateState('error');
          setErrorMessage(result.error || 'Update failed');
          return;
        }

        // Check if this is a backend update
        if (BACKEND_REPOS.includes(repository as typeof BACKEND_REPOS[number])) {
          setExpectedVersion(result.newVersion);
          setUpdateState('restarting');

          setTimeout(() => {
            setUpdateState('reconnecting');
            startPolling();
          }, 3000);
        } else {
          setUpdateState('complete');
          // Refresh page after frontend update
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (err) {
        setUpdateState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Update failed');
      }
    },
    [updateRepository, startPolling]
  );

  // Check for updated query param (after refresh)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('updated') === 'true') {
      // Clear the query param
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const repositories = versionsData?.systemVersions?.repositories || [];
  const versionManagementSupported =
    versionsData?.systemVersions?.versionManagementSupported ?? false;
  const hasUpdates = repositories.some(
    (r: RepositoryVersion) => r.updateAvailable
  );
  const buildInfo = buildInfoData?.buildInfo;

  // Render based on state
  if (versionsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-gray-800 p-6">
          <h1 className="mb-4 text-xl font-bold text-white">Connection Error</h1>
          <p className="mb-4 text-gray-300">
            Unable to connect to the server. The server may be updating or offline.
          </p>
          <button
            onClick={() => refetchVersions()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!versionManagementSupported && !versionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md rounded-lg border border-yellow-500/30 bg-gray-800 p-6">
          <h1 className="mb-4 text-xl font-bold text-white">Not Available</h1>
          <p className="mb-4 text-gray-300">
            Version management is only available on Raspberry Pi installations.
          </p>
          <Link
            href="/settings"
            className="text-blue-400 hover:text-blue-300"
          >
            &larr; Back to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-xl font-bold text-white">System Update</h1>
          {updateState === 'idle' && (
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-white"
            >
              &larr; Back to Settings
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Build Info (for verification) */}
          {buildInfo && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <h2 className="mb-2 text-sm font-medium text-gray-400">
                Current Server
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="ml-2 text-white">{buildInfo.version}</span>
                </div>
                <div>
                  <span className="text-gray-500">Commit:</span>
                  <span className="ml-2 font-mono text-white">
                    {buildInfo.gitCommit?.substring(0, 7)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Built:</span>
                  <span className="ml-2 text-white">
                    {buildInfo.buildTime
                      ? new Date(buildInfo.buildTime).toLocaleDateString()
                      : 'unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Update Progress */}
          {updateState !== 'idle' && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <UpdateProgress
                currentState={updateState}
                errorMessage={errorMessage}
              />

              {/* Reconnect Countdown */}
              {updateState === 'reconnecting' && (
                <div className="mt-6">
                  <ReconnectCountdown
                    countdown={countdown}
                    maxSeconds={90}
                    isPolling={isPolling}
                  />
                </div>
              )}

              {/* Complete message */}
              {updateState === 'complete' && (
                <div className="mt-6 text-center">
                  <p className="text-green-400">
                    Update completed successfully! Refreshing page...
                  </p>
                </div>
              )}

              {/* Error retry */}
              {updateState === 'error' && (
                <div className="mt-6 flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setUpdateState('idle');
                      setErrorMessage('');
                      stopPolling();
                    }}
                    className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAll}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Version List (only when idle) */}
          {updateState === 'idle' && (
            <>
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Available Updates
                </h2>

                {versionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repositories.map((repo: RepositoryVersion) => (
                      <div
                        key={repo.repository}
                        className="rounded border border-gray-600 bg-gray-700/50"
                      >
                        {/* Repository header row */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {repo.repository}
                            </div>
                            <div className="text-sm text-gray-400">
                              Installed: {repo.installed}
                              {repo.updateAvailable && (
                                <span className="ml-2">
                                  &rarr; Latest: {repo.latest}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Quick update to latest */}
                            {repo.updateAvailable && (
                              <button
                                onClick={() => handleUpdateRepository(repo.repository)}
                                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                              >
                                Update
                              </button>
                            )}
                            {!repo.updateAvailable && (
                              <span className="text-sm text-green-400">
                                Up to date
                              </span>
                            )}
                            {/* Version selector toggle */}
                            <button
                              onClick={() => handleToggleVersionSelector(repo.repository)}
                              className="rounded bg-gray-600 px-2 py-1 text-sm text-gray-300 hover:bg-gray-500"
                              title="Select specific version"
                              aria-label={
                                expandedRepo === repo.repository
                                  ? 'Collapse version selector'
                                  : 'Expand version selector'
                              }
                            >
                              {expandedRepo === repo.repository ? '▲' : '▼'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded version selector */}
                        {expandedRepo === repo.repository && (
                          <div className="border-t border-gray-600 bg-gray-800/50 p-3">
                            <div className="mb-2 text-sm text-gray-400">
                              Select a specific version to install:
                            </div>
                            {versionsListLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                              </div>
                            ) : availableVersions[repo.repository]?.length ? (
                              <>
                                <select
                                  value={selectedVersions[repo.repository] || ''}
                                  onChange={(e) =>
                                    handleVersionSelect(repo.repository, e.target.value)
                                  }
                                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="">Choose version...</option>
                                  {availableVersions[repo.repository].map((version) => {
                                    const isPre = isPrerelease(version);
                                    // Normalize both versions by stripping v prefix for comparison
                                    const normalizedVersion = version.startsWith('v') ? version.slice(1) : version;
                                    const normalizedInstalled = repo.installed.startsWith('v') ? repo.installed.slice(1) : repo.installed;
                                    const isCurrent = normalizedVersion === normalizedInstalled;
                                    return (
                                      <option
                                        key={version}
                                        value={version}
                                        disabled={isCurrent}
                                      >
                                        {version}
                                        {isPre ? ' (prerelease)' : ''}
                                        {isCurrent ? ' (current)' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                                {selectedVersions[repo.repository] && (
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm text-gray-400">
                                      {isPrerelease(selectedVersions[repo.repository]) && (
                                        <span className="mr-2 rounded bg-yellow-600 px-2 py-0.5 text-xs text-white">
                                          Prerelease
                                        </span>
                                      )}
                                      Install {selectedVersions[repo.repository]}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateRepository(
                                          repo.repository,
                                          selectedVersions[repo.repository]
                                        )
                                      }
                                      className="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
                                    >
                                      Install Selected
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="py-2 text-sm text-gray-500">
                                No versions available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Update All button */}
                {hasUpdates && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleUpdateAll}
                      className="rounded bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
                    >
                      Update All
                    </button>
                  </div>
                )}

                {!hasUpdates && !versionsLoading && (
                  <p className="mt-4 text-center text-gray-400">
                    All components are up to date.
                  </p>
                )}
              </div>

              {/* Update Results from previous updates */}
              {updateResults.length > 0 && (
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                  <h2 className="mb-4 text-lg font-semibold text-white">
                    Last Update Results
                  </h2>
                  <div className="space-y-2">
                    {updateResults.map((result, index) => (
                      <div
                        key={index}
                        className={`rounded p-3 ${
                          result.success
                            ? 'bg-green-500/10 border border-green-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            {result.repository}
                          </span>
                          <span
                            className={
                              result.success ? 'text-green-400' : 'text-red-400'
                            }
                          >
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {result.previousVersion} &rarr; {result.newVersion}
                        </div>
                        {result.error && (
                          <div className="mt-1 text-sm text-red-400">
                            {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
