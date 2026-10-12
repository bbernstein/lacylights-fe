'use client';

import { useId, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import EosWarningsList from '@/components/EosWarningsList';
import {
  PROJECT_FORMAT_LIST,
  UNKNOWN_FORMAT_MESSAGE,
  acceptForImportFormat,
  detectFormatFromFilename,
  formatDisplayName,
  formatErrorMessage,
  importProjectContent,
  readFileAsText,
  resolveImportFormat,
  type ImportFormat,
  type ProjectImportResult,
} from '@/lib/importExport';

export interface ProjectImportPanelProps {
  /** Called after a successful import (e.g. to refresh the project list). */
  onImported?: (result: ProjectImportResult) => void | Promise<void>;
  /** Called when the user clicks "Switch to imported project". */
  onSwitchToProject?: (projectId: string) => void | Promise<void>;
  /** The currently selected project; hides the switch button when already selected. */
  currentProjectId?: string | null;
}

/**
 * Import a project file (LacyLights JSON, QLC+ .qxw or ETC Eos .asc).
 * The format is auto-detected from the file extension, with an explicit
 * override for when detection is wrong.
 */
export default function ProjectImportPanel({
  onImported,
  onSwitchToProject,
  currentProjectId,
}: ProjectImportPanelProps) {
  const client = useApolloClient();
  const inputId = useId();
  const formatSelectId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<ImportFormat>('auto');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectImportResult | null>(null);

  const resolvedFormat = file ? resolveImportFormat(file.name, format) : null;
  const detectedFormat = file ? detectFormatFromFilename(file.name) : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    const target = resolveImportFormat(file.name, format);
    if (!target) {
      setError(UNKNOWN_FORMAT_MESSAGE);
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);
    try {
      const content = await readFileAsText(file);
      const importResult = await importProjectContent(client, content, file.name, target);
      setResult(importResult);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await onImported?.(importResult);
    } catch (err) {
      setError(
        formatErrorMessage(
          err,
          'Failed to import project. Please check the file and try again. Error:',
        ),
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSwitch = async () => {
    if (!result || !onSwitchToProject) return;
    setIsSwitching(true);
    try {
      await onSwitchToProject(result.projectId);
    } finally {
      setIsSwitching(false);
    }
  };

  const alreadyCurrent = result != null && result.projectId === currentProjectId;

  return (
    <div className="space-y-4">
      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {PROJECT_FORMAT_LIST.map((f) => (
          <li key={f.id}>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDisplayName(f.id)}
            </span>
            {' – '}
            {f.description}
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 min-w-0">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Project file
          </label>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={acceptForImportFormat(format)}
            onChange={handleFileChange}
            disabled={isImporting}
            className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-800 dark:file:text-gray-200 file:min-h-[44px]"
          />
        </div>
        <div className="sm:w-56">
          <label
            htmlFor={formatSelectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Format
          </label>
          <select
            id={formatSelectId}
            value={format}
            onChange={(e) => setFormat(e.target.value as ImportFormat)}
            disabled={isImporting}
            className="w-full px-3 py-2 min-h-[44px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
          >
            <option value="auto">Auto-detect</option>
            {PROJECT_FORMAT_LIST.map((f) => (
              <option key={f.id} value={f.id}>
                {formatDisplayName(f.id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {file && (
        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="import-detected-format">
          {resolvedFormat
            ? `Will import ${file.name} as ${formatDisplayName(resolvedFormat)}${
                format === 'auto' ? ' (auto-detected)' : ''
              }.`
            : `Could not detect the format of ${file.name}. Choose a format above.`}
          {format !== 'auto' && detectedFormat && detectedFormat !== format && (
            <span className="block text-amber-600 dark:text-amber-400">
              The file extension suggests {formatDisplayName(detectedFormat)}.
            </span>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={handleImport}
        disabled={!file || isImporting}
        className="w-full sm:w-auto px-4 py-2 min-h-[44px] bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation"
      >
        <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
        {isImporting ? 'Importing...' : 'Import'}
      </button>

      {error && (
        <div
          role="alert"
          className="p-3 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {result && (
        <div
          className="p-4 rounded border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 space-y-3"
          data-testid="import-result"
        >
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <div className="font-medium">
                Imported {result.projectName ? `"${result.projectName}"` : 'project'} from{' '}
                {formatDisplayName(result.format)}
              </div>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400">
                {result.stats.map((s) => (
                  <li key={s.label}>
                    {s.label}: {s.count}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="text-sm">
              <div className="font-medium text-amber-700 dark:text-amber-400">
                Warnings ({result.warnings.length})
              </div>
              <ul className="mt-1 list-disc pl-5 max-h-48 overflow-y-auto text-gray-700 dark:text-gray-300">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.eosWarnings.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              <EosWarningsList warnings={result.eosWarnings} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {onSwitchToProject && !alreadyCurrent && (
              <button
                type="button"
                onClick={handleSwitch}
                disabled={isSwitching}
                className="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {isSwitching ? 'Switching...' : 'Switch to imported project'}
              </button>
            )}
            {alreadyCurrent && (
              <span className="text-sm text-green-700 dark:text-green-400">
                This is now the current project.
              </span>
            )}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="px-4 py-2 min-h-[44px] text-sm text-gray-600 dark:text-gray-400 underline touch-manipulation"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
