'use client';

import { useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import {
  IMPORT_PROJECT,
  IMPORT_PROJECT_FROM_QLC,
  EXPORT_PROJECT,
  EXPORT_PROJECT_TO_QLC,
  GET_QLC_FIXTURE_MAPPING_SUGGESTIONS
} from '@/graphql/projects';
import { getFixtureKey, getManufacturer, getModel } from '@/constants/fixtures';
import { ImportMode, FixtureConflictStrategy } from '@/constants/import';

interface ImportExportButtonsProps {
  projectId?: string;
  onImportComplete?: (projectId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  /** If true, only show export button (for per-project controls) */
  exportOnly?: boolean;
  /** If true, render as dropdown menu items instead of buttons */
  inDropdown?: boolean;
}

type ExportFormat = 'lacylights' | 'qlcplus';
type ImportFormat = 'auto' | 'lacylights' | 'qlcplus';

// Type definition for the native Mac app bridge
interface LacyLightsBridge {
  download: (content: string, filename: string) => void;
  send: (message: Record<string, unknown>) => void;
  log: (message: string) => void;
  error: (message: string) => void;
  getAppVersion: () => void;
}

// Extend Window interface to include the lacylights bridge
declare global {
  interface Window {
    lacylights?: LacyLightsBridge;
  }
}

/**
 * Format error message from caught exception
 */
function formatErrorMessage(error: unknown, prefix: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `${prefix} ${errorMessage}`;
}

/**
 * Download file using native Mac app bridge if available, otherwise use browser download
 */
function downloadFile(content: string, filename: string): void {
  // Check if running in Mac app with native bridge
  if (typeof window !== 'undefined' && window.lacylights?.download) {
    // Use native Mac app download
    window.lacylights.download(content, filename);
  } else {
    // Fallback to browser download
    const blob = new Blob([content], {
      type: filename.endsWith('.json') ? 'application/json' : 'application/xml'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Sanitize filename to prevent directory traversal and remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  const MAX_FILENAME_LENGTH = 255;
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid characters with dash
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
  // If the filename is empty after sanitization, use a default name
  if (!sanitized) {
    sanitized = 'untitled';
  }
  // Truncate to maximum allowed length
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
  }
  return sanitized;
}

/**
 * Create fixture mappings from LacyLights fixtures or default mappings
 */
function createFixtureMappings(
  defaultMappings: Array<{ lacyLightsKey: string; qlcManufacturer: string; qlcModel: string; qlcMode: string }>,
  lacyLightsFixtures: Array<{ manufacturer: string | null; model: string | null }>
) {
  const rawMappings = defaultMappings.length > 0
    ? defaultMappings
    : lacyLightsFixtures.map((fixture) => ({
        lacyLightsKey: getFixtureKey(fixture.manufacturer, fixture.model),
        qlcManufacturer: getManufacturer(fixture.manufacturer),
        qlcModel: getModel(fixture.model),
        qlcMode: 'Default'
      }));

  return rawMappings.map((mapping) => ({
    lacyLightsKey: mapping.lacyLightsKey,
    qlcManufacturer: mapping.qlcManufacturer,
    qlcModel: mapping.qlcModel,
    qlcMode: mapping.qlcMode
  }));
}

export default function ImportExportButtons({
  projectId,
  onImportComplete,
  onError,
  disabled = false,
  exportOnly = false,
  inDropdown = false
}: ImportExportButtonsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showExportFormatMenu, setShowExportFormatMenu] = useState(false);

  // GraphQL mutations
  const [importProject] = useMutation(IMPORT_PROJECT, {
    onError: (error) => {
      onError?.(`Failed to import project: ${error.message}`);
    },
    onCompleted: (data) => {
      if (data?.importProject?.projectId) {
        onImportComplete?.(data.importProject.projectId);
      }
    },
  });

  const [importProjectFromQLC] = useMutation(IMPORT_PROJECT_FROM_QLC, {
    onError: (error) => {
      onError?.(`Failed to import project: ${error.message}`);
    },
    onCompleted: (data) => {
      if (data?.importProjectFromQLC?.project?.id) {
        onImportComplete?.(data.importProjectFromQLC.project.id);
      }
    },
  });

  const [exportProject] = useMutation(EXPORT_PROJECT, {
    onError: (error) => {
      onError?.(`Failed to export project: ${error.message}`);
    },
  });

  const [exportProjectToQLC] = useMutation(EXPORT_PROJECT_TO_QLC, {
    onError: (error) => {
      onError?.(`Failed to export project: ${error.message}`);
    },
  });

  const [getFixtureMappingSuggestions] = useLazyQuery(GET_QLC_FIXTURE_MAPPING_SUGGESTIONS, {
    onError: (error) => {
      onError?.(`Failed to get fixture mappings: ${error.message}`);
    },
  });

  const handleImport = (format: ImportFormat) => {
    setShowFormatMenu(false);
    const input = document.createElement('input');
    input.type = 'file';

    if (format === 'qlcplus') {
      input.accept = '.qxw';
    } else if (format === 'lacylights') {
      input.accept = '.json';
    } else {
      // auto-detect
      input.accept = '.qxw,.json';
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);

      try {
        // Determine format based on file extension or explicit format
        let detectedFormat: 'lacylights' | 'qlcplus';
        if (format === 'qlcplus' || file.name.endsWith('.qxw')) {
          detectedFormat = 'qlcplus';
        } else if (format === 'lacylights' || file.name.endsWith('.json')) {
          detectedFormat = 'lacylights';
        } else {
          onError?.('Unable to determine file format. Supported formats: .qxw (QLC+), .json/.lacylights (LacyLights).');
          setIsImporting(false);
          return;
        }

        const content = await file.text();

        if (detectedFormat === 'qlcplus') {
          await importProjectFromQLC({
            variables: {
              xmlContent: content,
              originalFileName: file.name
            }
          });
        } else {
          // LacyLights native format
          await importProject({
            variables: {
              jsonContent: content,
              options: {
                mode: ImportMode.CREATE,
                fixtureConflictStrategy: FixtureConflictStrategy.SKIP,
                importBuiltInFixtures: true
              }
            }
          });
        }
      } catch (err) {
        onError?.(formatErrorMessage(err, 'Failed to import project. Please check the file and try again. Error:'));
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  const handleExport = async (format: ExportFormat) => {
    if (!projectId) {
      onError?.('No project selected for export');
      return;
    }

    setShowExportFormatMenu(false);
    setIsExporting(true);

    try {
      if (format === 'qlcplus') {
        // QLC+ export flow
        const mappingResult = await getFixtureMappingSuggestions({
          variables: { projectId }
        });

        if (mappingResult.data?.getQLCFixtureMappingSuggestions) {
          const mappingData = mappingResult.data.getQLCFixtureMappingSuggestions;

          const fixtureMappings = createFixtureMappings(
            mappingData.defaultMappings,
            mappingData.lacyLightsFixtures
          );

          const result = await exportProjectToQLC({
            variables: {
              projectId,
              fixtureMappings
            }
          });

          if (result.data?.exportProjectToQLC) {
            const exportResult = result.data.exportProjectToQLC;
            const filename = `${sanitizeFilename(exportResult.projectName)}.qxw`;
            downloadFile(exportResult.xmlContent, filename);
          }
        }
      } else {
        // LacyLights native export
        const result = await exportProject({
          variables: {
            projectId,
            options: {
              includeFixtures: true,
              includeLooks: true,
              includeCueLists: true
            }
          }
        });

        if (result.data?.exportProject) {
          const exportResult = result.data.exportProject;
          const filename = `${sanitizeFilename(exportResult.projectName)}.json`;
          downloadFile(exportResult.jsonContent, filename);
        }
      }
    } catch (error) {
      onError?.(formatErrorMessage(error, 'Failed to export project.'));
    } finally {
      setIsExporting(false);
    }
  };

  // Dropdown menu items for use inside a parent dropdown
  if (inDropdown) {
    return (
      <div className="space-y-1" role="menu" aria-label="Import and Export options">
        {/* Import options - Only show if not export-only mode */}
        {!exportOnly && (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1" role="presentation">
              Import Project
            </div>
            <button
              onClick={() => handleImport('auto')}
              disabled={disabled || isImporting}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              role="menuitem"
            >
              {isImporting ? 'Importing...' : 'Auto-detect format'}
            </button>
            <button
              onClick={() => handleImport('lacylights')}
              disabled={disabled || isImporting}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              role="menuitem"
            >
              LacyLights (.json)
            </button>
            <button
              onClick={() => handleImport('qlcplus')}
              disabled={disabled || isImporting}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              role="menuitem"
            >
              QLC+ (.qxw)
            </button>
          </>
        )}

        {/* Export options */}
        {projectId && (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mt-2" role="presentation">
              Export Current Project
            </div>
            <button
              onClick={() => handleExport('lacylights')}
              disabled={disabled || isExporting}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              role="menuitem"
            >
              {isExporting ? 'Exporting...' : 'LacyLights (.json)'}
            </button>
            <button
              onClick={() => handleExport('qlcplus')}
              disabled={disabled || isExporting}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              role="menuitem"
            >
              QLC+ (.qxw)
            </button>
          </>
        )}
      </div>
    );
  }

  // Standard button rendering
  return (
    <div className="flex gap-2">
      {/* Import Button with Dropdown - Only show if not export-only mode */}
      {!exportOnly && (
        <div className="relative">
          <button
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            disabled={disabled || isImporting}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isImporting ? 'Importing...' : 'Import'}
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showFormatMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded shadow-lg py-1 z-10 min-w-[180px]">
              <button
                onClick={() => handleImport('auto')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
              >
                Auto-detect format
              </button>
              <button
                onClick={() => handleImport('lacylights')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
              >
                LacyLights (.json)
              </button>
              <button
                onClick={() => handleImport('qlcplus')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
              >
                QLC+ (.qxw)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export Button with Dropdown */}
      {projectId && (
        <div className="relative">
          <button
            onClick={() => setShowExportFormatMenu(!showExportFormatMenu)}
            disabled={disabled || isExporting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {isExporting ? 'Exporting...' : 'Export'}
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {showExportFormatMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded shadow-lg py-1 z-10 min-w-[180px]">
              <button
                onClick={() => handleExport('lacylights')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
              >
                LacyLights (.json)
              </button>
              <button
                onClick={() => handleExport('qlcplus')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
              >
                QLC+ (.qxw)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}