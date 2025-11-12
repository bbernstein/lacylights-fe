'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SYSTEM_VERSIONS,
  GET_AVAILABLE_VERSIONS,
  UPDATE_REPOSITORY,
  UPDATE_ALL_REPOSITORIES,
} from '@/graphql/versionManagement';
import { RepositoryVersion, UpdateResult } from '@/generated/graphql';

export default function VersionManagement() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('latest');
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);

  const { data, loading, error, refetch } = useQuery(GET_SYSTEM_VERSIONS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  const { data: versionsData, loading: versionsLoading } = useQuery(GET_AVAILABLE_VERSIONS, {
    variables: { repository: selectedRepo || '' },
    skip: !selectedRepo,
  });

  const [updateRepository, { loading: updating }] = useMutation(UPDATE_REPOSITORY, {
    onCompleted: (result) => {
      setUpdateResults([result.updateRepository]);
      refetch();
      setSelectedRepo(null);
      setSelectedVersion('latest');
    },
  });

  const [updateAllRepositories, { loading: updatingAll }] = useMutation(UPDATE_ALL_REPOSITORIES, {
    onCompleted: (result) => {
      setUpdateResults(result.updateAllRepositories);
      refetch();
    },
  });

  const systemVersions = data?.systemVersions;
  const availableVersions = versionsData?.availableVersions || [];

  const handleUpdateRepository = async () => {
    if (!selectedRepo) return;

    try {
      await updateRepository({
        variables: {
          repository: selectedRepo,
          version: selectedVersion === 'latest' ? undefined : selectedVersion,
        },
      });
    } catch (err) {
      console.error('Error updating repository:', err);
    }
  };

  const handleUpdateAll = async () => {
    try {
      await updateAllRepositories();
    } catch (err) {
      console.error('Error updating all repositories:', err);
    }
  };

  const handleClearResults = () => {
    setUpdateResults([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-3"></div>
        <div className="text-gray-600 dark:text-gray-400">Checking for updates...</div>
      </div>
    );
  }

  if (!systemVersions?.versionManagementSupported) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Version Management Not Available
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              This system does not support automated version management. This feature is available on
              Raspberry Pi installations with the update scripts installed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading version information: {error.message}</p>
      </div>
    );
  }

  const repositories = systemVersions?.repositories || [];
  const hasUpdates = repositories.some((repo: RepositoryVersion) => repo.updateAvailable);

  return (
    <div className="space-y-4">
      {/* Update Results */}
      {updateResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update Results</h3>
            <button
              onClick={handleClearResults}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          {updateResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start">
                <svg
                  className={`w-5 h-5 mt-0.5 mr-3 ${
                    result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {result.success ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      result.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}
                  >
                    {result.repository}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {result.success ? result.message : result.error}
                  </p>
                  {result.success && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {result.previousVersion} → {result.newVersion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repository Versions Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Versions</h3>
            {hasUpdates && (
              <button
                onClick={handleUpdateAll}
                disabled={updating || updatingAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {updatingAll ? 'Updating All...' : 'Update All'}
              </button>
            )}
          </div>
          {systemVersions?.lastChecked && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last checked: {new Date(systemVersions.lastChecked).toLocaleString()}
            </p>
          )}
        </div>

        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Repository
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Installed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Latest
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {repositories.map((repo: RepositoryVersion) => (
              <tr key={repo.repository} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{repo.repository}</span>
                    {repo.updateAvailable && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                        Update Available
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {repo.installed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {repo.latest}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {selectedRepo === repo.repository ? (
                    <div className="flex justify-end items-center space-x-2">
                      <select
                        value={selectedVersion}
                        onChange={(e) => setSelectedVersion(e.target.value)}
                        disabled={versionsLoading}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="latest">Latest</option>
                        {availableVersions.map((version: string) => (
                          <option key={version} value={version}>
                            {version}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleUpdateRepository}
                        disabled={updating}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRepo(null);
                          setSelectedVersion('latest');
                        }}
                        disabled={updating}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRepo(repo.repository)}
                      disabled={updating || updatingAll}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {repo.updateAvailable ? 'Update' : 'Change Version'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
