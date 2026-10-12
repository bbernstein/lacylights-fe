'use client';

import { useEffect, useId, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import EosWarningsList from '@/components/EosWarningsList';
import {
  PROJECT_FORMAT_LIST,
  exportAndDownloadProject,
  formatDisplayName,
  formatErrorMessage,
  type ProjectExportFormat,
  type ProjectExportResult,
} from '@/lib/importExport';

export interface ExportableProject {
  id: string;
  name: string;
}

export interface ProjectExportPanelProps {
  /** Projects the user can export. */
  projects: ReadonlyArray<ExportableProject>;
  /** Project selected initially (e.g. the current project or a `?project=` param). */
  defaultProjectId?: string | null;
}

/**
 * Export a project as LacyLights JSON, QLC+ or ETC Eos ASCII.
 * Each format is a card with a description and its own Export button so
 * more formats can be added later without changing the layout.
 */
export default function ProjectExportPanel({ projects, defaultProjectId }: ProjectExportPanelProps) {
  const client = useApolloClient();
  const projectSelectId = useId();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId ?? projects[0]?.id ?? '',
  );
  const [exportingFormat, setExportingFormat] = useState<ProjectExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<ProjectExportResult | null>(null);

  // Follow changes to the default (e.g. query param or current project
  // loading after first render).
  useEffect(() => {
    if (defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  // If nothing is selected yet (or the selection disappeared), fall back
  // to the first available project.
  useEffect(() => {
    if (projects.length === 0) return;
    if (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId)) {
      if (defaultProjectId && projects.some((p) => p.id === defaultProjectId)) {
        setSelectedProjectId(defaultProjectId);
      } else {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [projects, selectedProjectId, defaultProjectId]);

  // Stale results/warnings from another project should not linger.
  useEffect(() => {
    setLastExport(null);
    setError(null);
  }, [selectedProjectId]);

  const handleExport = async (format: ProjectExportFormat) => {
    if (!selectedProjectId) {
      setError('No project selected for export');
      return;
    }
    setExportingFormat(format);
    setError(null);
    setLastExport(null);
    try {
      const result = await exportAndDownloadProject(client, selectedProjectId, format);
      setLastExport(result);
    } catch (err) {
      setError(formatErrorMessage(err, 'Failed to export project.'));
    } finally {
      setExportingFormat(null);
    }
  };

  if (projects.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        There are no projects to export.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={projectSelectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Project
        </label>
        <select
          id={projectSelectId}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          disabled={exportingFormat !== null}
          className="w-full sm:max-w-md px-3 py-2 min-h-[44px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_FORMAT_LIST.map((f) => (
          <li
            key={f.id}
            className="flex flex-col justify-between gap-3 p-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{formatDisplayName(f.id)}</div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{f.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleExport(f.id)}
              disabled={exportingFormat !== null || !selectedProjectId}
              aria-label={`Export as ${formatDisplayName(f.id)}`}
              className="w-full px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              {exportingFormat === f.id ? 'Exporting...' : 'Export'}
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <div
          role="alert"
          className="p-3 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {lastExport && (
        <div className="space-y-3" data-testid="export-result">
          <p className="text-sm text-green-700 dark:text-green-400">
            Saved {lastExport.filename}
          </p>
          {lastExport.eosWarnings.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              <EosWarningsList warnings={lastExport.eosWarnings} />
              <button
                type="button"
                onClick={() => setLastExport(null)}
                className="mt-2 text-xs text-gray-500 underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
