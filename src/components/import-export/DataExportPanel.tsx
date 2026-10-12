'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { GET_DATA_EXPORT_TABLES } from '@/graphql/dataExport';
import { GET_PROJECT_LOOKS } from '@/graphql/looks';
import { GET_PROJECT_CUE_LISTS } from '@/graphql/cueLists';
import { GET_PROJECT_LOOK_BOARDS } from '@/graphql/lookBoards';
import type { GetDataExportTablesQuery } from '@/generated/graphql';
import { useDataExportUnsupported } from '@/hooks/useDataExportUnsupported';
import {
  DATA_EXPORT_UNSUPPORTED_MESSAGE,
  DATA_EXPORT_FORMATS,
  DATA_EXPORT_SCOPE_LABELS,
  DataExportFormat,
  DataExportTable,
  exportAndDownloadDataTable,
  exportAndDownloadDataWorkbook,
  formatErrorMessage,
  isDataExportUnsupportedError,
  isItemScope,
  isProjectOptional,
  isScopeRequired,
  noteDataExportError,
  parseDataExportTable,
  type DataExportFile,
  type DataExportItemScope,
} from '@/lib/importExport';

export interface DataExportProject {
  id: string;
  name: string;
}

export interface DataExportPanelProps {
  /** Projects the user can export from. */
  projects: ReadonlyArray<DataExportProject>;
  /** Project selected initially (e.g. the current project or `?project=`). */
  defaultProjectId?: string | null;
  /** Table to preselect (e.g. from `?table=`); unknown values are ignored. */
  defaultTable?: string | null;
  /** Look / cue list / look board to preselect (e.g. from `?scopeId=`). */
  defaultScopeId?: string | null;
}

interface ScopeItem {
  id: string;
  name: string;
}

type ExportAction = 'table' | 'workbook';

const selectClass =
  'w-full sm:max-w-md px-3 py-2 min-h-[44px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

function pluralRows(n: number): string {
  return `${n} ${n === 1 ? 'row' : 'rows'}`;
}

/**
 * Export a data list (fixtures, looks, cue lists, …) as CSV or Excel, or
 * a whole project as a multi-sheet Excel workbook. The table list comes
 * from the server (`dataExportTables`); the files are generated there too.
 *
 * Older backends have no data export; when they reject `dataExportTables`
 * (or an export) with "Cannot query field", the panel explains that the
 * server needs an update instead of showing an error.
 */
export default function DataExportPanel({
  projects,
  defaultProjectId,
  defaultTable,
  defaultScopeId,
}: DataExportPanelProps) {
  const client = useApolloClient();
  const projectSelectId = useId();
  const tableSelectId = useId();
  const scopeSelectId = useId();
  const formatGroupName = useId();

  const knownUnsupported = useDataExportUnsupported();
  const { data: tablesData, loading: tablesLoading, error: tablesError } =
    useQuery<GetDataExportTablesQuery>(GET_DATA_EXPORT_TABLES, { skip: knownUnsupported });
  const unsupported = knownUnsupported || isDataExportUnsupportedError(tablesError);

  // Remember an old backend for the session so Export ▾ menus adapt too.
  useEffect(() => {
    if (tablesError) noteDataExportError(client, tablesError);
  }, [tablesError, client]);
  const tables = useMemo(() => tablesData?.dataExportTables ?? [], [tablesData]);

  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? projects[0]?.id ?? '');
  const [table, setTable] = useState<DataExportTable | null>(parseDataExportTable(defaultTable));
  const [scopeId, setScopeId] = useState<string>(defaultScopeId ?? '');
  const [format, setFormat] = useState<DataExportFormat>(DataExportFormat.Csv);
  const [running, setRunning] = useState<ExportAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<DataExportFile | null>(null);

  // Follow changes to the defaults (query params / current project loading).
  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  useEffect(() => {
    const parsed = parseDataExportTable(defaultTable);
    if (parsed) setTable(parsed);
  }, [defaultTable]);

  useEffect(() => {
    if (defaultScopeId) setScopeId(defaultScopeId);
  }, [defaultScopeId]);

  // Fall back to the first project when nothing valid is selected.
  useEffect(() => {
    if (projects.length === 0) return;
    if (!projectId || !projects.some((p) => p.id === projectId)) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  // Once the table list loads, make sure the selection is one of them.
  useEffect(() => {
    if (tables.length === 0) return;
    if (!table || !tables.some((t) => t.table === table)) {
      setTable(tables[0].table);
    }
  }, [tables, table]);

  const tableInfo = tables.find((t) => t.table === table) ?? null;
  const scope = tableInfo?.scope ?? null;
  const itemScope: DataExportItemScope | null = isItemScope(scope) ? scope : null;
  const needsProject = table ? !isProjectOptional(table) : true;
  const scopeRequired = table ? isScopeRequired(table, scope) : false;

  const looksQuery = useQuery(GET_PROJECT_LOOKS, {
    variables: { projectId },
    skip: itemScope !== 'look' || !projectId,
  });
  const cueListsQuery = useQuery(GET_PROJECT_CUE_LISTS, {
    variables: { projectId },
    skip: itemScope !== 'cueList' || !projectId,
  });
  const lookBoardsQuery = useQuery(GET_PROJECT_LOOK_BOARDS, {
    variables: { projectId },
    skip: itemScope !== 'lookBoard' || !projectId,
  });

  const scopeItems: ScopeItem[] = useMemo(() => {
    const pick = (items: ReadonlyArray<{ id: string; name: string }> | undefined | null) =>
      (items ?? []).map((i) => ({ id: i.id, name: i.name }));
    switch (itemScope) {
      case 'look':
        return pick(looksQuery.data?.project?.looks);
      case 'cueList':
        return pick(cueListsQuery.data?.project?.cueLists);
      case 'lookBoard':
        return pick(lookBoardsQuery.data?.lookBoards);
      default:
        return [];
    }
  }, [itemScope, looksQuery.data, cueListsQuery.data, lookBoardsQuery.data]);

  const scopeLoading =
    (itemScope === 'look' && looksQuery.loading) ||
    (itemScope === 'cueList' && cueListsQuery.loading) ||
    (itemScope === 'lookBoard' && lookBoardsQuery.loading);

  // Pick a valid scope item once the list loads; keep "all boards" ('')
  // when the scope is optional.
  useEffect(() => {
    if (!itemScope || scopeLoading) return;
    if (scopeId && scopeItems.some((i) => i.id === scopeId)) return;
    if (scopeRequired) {
      setScopeId(scopeItems[0]?.id ?? '');
    } else if (scopeId) {
      setScopeId('');
    }
  }, [itemScope, scopeItems, scopeId, scopeRequired, scopeLoading]);

  // Results from another selection should not linger.
  useEffect(() => {
    setLastExport(null);
    setError(null);
  }, [projectId, table, scopeId, format]);

  const canExportTable =
    !!table &&
    running === null &&
    (!needsProject || !!projectId) &&
    (!scopeRequired || !!scopeId);
  const canExportWorkbook = running === null && !!projectId;

  const run = async (action: ExportAction) => {
    setRunning(action);
    setError(null);
    setLastExport(null);
    try {
      const file =
        action === 'workbook'
          ? await exportAndDownloadDataWorkbook(client, { projectId })
          : await exportAndDownloadDataTable(client, {
              table: table as DataExportTable,
              format,
              projectId: projectId || null,
              scopeId: itemScope ? scopeId || null : null,
            });
      setLastExport(file);
    } catch (err) {
      // An older backend: the panel switches to the "update LacyLights" note.
      if (!noteDataExportError(client, err)) {
        setError(formatErrorMessage(err, 'Export failed.'));
      }
    } finally {
      setRunning(null);
    }
  };

  if (unsupported) {
    return (
      <div
        role="status"
        className="p-3 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200"
      >
        {DATA_EXPORT_UNSUPPORTED_MESSAGE}
      </div>
    );
  }

  if (tablesError) {
    return (
      <div
        role="alert"
        className="p-3 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
      >
        {formatErrorMessage(tablesError, 'Could not load the list of exportable data.')}
      </div>
    );
  }

  if (tablesLoading && tables.length === 0) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Loading export options...</p>;
  }

  return (
    <div className="space-y-4" data-testid="data-export-panel">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={tableSelectId} className={labelClass}>
            Data
          </label>
          <select
            id={tableSelectId}
            value={table ?? ''}
            onChange={(e) => {
              setTable(parseDataExportTable(e.target.value));
              setScopeId('');
            }}
            disabled={running !== null}
            className={selectClass}
          >
            {tables.map((t) => (
              <option key={t.table} value={t.table}>
                {t.label}
              </option>
            ))}
          </select>
          {tableInfo && tableInfo.columns.length > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" data-testid="data-export-columns">
              Columns: {tableInfo.columns.join(', ')}
            </p>
          )}
        </div>

        {needsProject &&
          (projects.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">There are no projects to export.</p>
          ) : (
            <div>
              <label htmlFor={projectSelectId} className={labelClass}>
                Project
              </label>
              <select
                id={projectSelectId}
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setScopeId('');
                }}
                disabled={running !== null}
                className={selectClass}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ))}

        {itemScope && projectId && (
          <div>
            <label htmlFor={scopeSelectId} className={labelClass}>
              {DATA_EXPORT_SCOPE_LABELS[itemScope]}
            </label>
            {scopeLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
            ) : scopeRequired && scopeItems.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This project has no {DATA_EXPORT_SCOPE_LABELS[itemScope].toLowerCase()}s.
              </p>
            ) : (
              <select
                id={scopeSelectId}
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                disabled={running !== null}
                className={selectClass}
              >
                {!scopeRequired && (
                  <option value="">All {DATA_EXPORT_SCOPE_LABELS[itemScope].toLowerCase()}s</option>
                )}
                {scopeItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <fieldset>
          <legend className={labelClass}>Format</legend>
          <div className="inline-flex rounded-md shadow-sm" role="radiogroup" aria-label="Format">
            {DATA_EXPORT_FORMATS.map((f, idx) => {
              const checked = format === f.id;
              return (
                <label
                  key={f.id}
                  className={`px-4 py-2 min-h-[44px] inline-flex items-center text-sm font-medium cursor-pointer border touch-manipulation ${
                    idx === 0 ? 'rounded-l-md' : '-ml-px rounded-r-md'
                  } ${
                    checked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={formatGroupName}
                    value={f.id}
                    checked={checked}
                    onChange={() => setFormat(f.id)}
                    disabled={running !== null}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => run('table')}
          disabled={!canExportTable}
          className="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
          {running === 'table' ? 'Exporting...' : 'Export'}
        </button>
        <button
          type="button"
          onClick={() => run('workbook')}
          disabled={!canExportWorkbook}
          title="All project lists in one Excel file, one sheet per list"
          className="px-4 py-2 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation"
        >
          <TableCellsIcon className="h-4 w-4" aria-hidden="true" />
          {running === 'workbook' ? 'Exporting...' : 'Export all (workbook)'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {lastExport && (
        <p className="text-sm text-green-700 dark:text-green-400" data-testid="data-export-result">
          Saved {lastExport.filename} ({pluralRows(lastExport.rowCount)})
        </p>
      )}
    </div>
  );
}
