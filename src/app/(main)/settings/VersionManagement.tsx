"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { GET_SYSTEM_VERSIONS, GET_BUILD_INFO } from "@/graphql/versionManagement";
import { RepositoryVersion } from "@/generated/graphql";

/**
 * Read-only version display for the Settings page.
 * For update actions, users are directed to /system-update.
 */
export default function VersionManagement() {
  const { data, loading, error } = useQuery(GET_SYSTEM_VERSIONS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  const { data: buildInfoData } = useQuery(GET_BUILD_INFO);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-3"></div>
        <div className="text-gray-600 dark:text-gray-400">
          Checking versions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          Error loading version information: {error.message}
        </p>
      </div>
    );
  }

  const systemVersions = data?.systemVersions;
  const buildInfo = buildInfoData?.buildInfo;

  if (!systemVersions?.versionManagementSupported) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-label="Info icon"
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
              This system does not support automated version management. This
              feature is available on Raspberry Pi installations with the update
              scripts installed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const repositories = systemVersions?.repositories || [];
  const hasUpdates = repositories.some(
    (repo: RepositoryVersion) => repo.updateAvailable
  );

  return (
    <div className="space-y-4">
      {/* Build Info */}
      {buildInfo && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Server Build
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Version:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {buildInfo.version}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Commit:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-white">
                {buildInfo.gitCommit?.substring(0, 7)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Built:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {buildInfo.buildTime
                  ? new Date(buildInfo.buildTime).toLocaleDateString()
                  : "unknown"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Version Status Summary */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Versions
            </h3>
            <Link
              href="/system-update"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                hasUpdates
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {hasUpdates ? "Updates Available" : "Manage Updates"}
            </Link>
          </div>
          {systemVersions?.lastChecked && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last checked:{" "}
              {new Date(systemVersions.lastChecked).toLocaleString()}
            </p>
          )}
        </div>

        {/* Simple Version List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {repositories.map((repo: RepositoryVersion) => (
            <div
              key={repo.repository}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {repo.repository}
                </span>
                {repo.updateAvailable && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                    Update Available
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">
                  {repo.installed}
                </span>
                {repo.updateAvailable && (
                  <>
                    <span className="mx-2">→</span>
                    <span className="text-green-600 dark:text-green-400">
                      {repo.latest}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Notice */}
      {hasUpdates && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              role="img"
              aria-label="Warning icon"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Updates are available. Go to the{" "}
                <Link
                  href="/system-update"
                  className="font-medium underline hover:no-underline"
                >
                  System Update
                </Link>{" "}
                page to install updates. The server may restart during updates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
