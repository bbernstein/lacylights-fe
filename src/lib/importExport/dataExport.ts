/**
 * CSV / Excel (XLSX) data-list exports.
 *
 * The backend generates the file and returns it inline as base64. Data
 * table and workbook exports MUST run through {@link runExportQuery}, which
 * forces `fetchPolicy: 'no-cache'` so large payloads never land in the
 * Apollo cache (plan: "Caching caveat"). Project exports use
 * `queryWithLegacyMutationFallback` (backendCompat.ts) instead, which is
 * also no-cache and adds the fallback for older backends.
 */
import type { ApolloClient, DocumentNode, OperationVariables, TypedDocumentNode } from '@apollo/client';
import {
  EXPORT_DATA_TABLE,
  EXPORT_DATA_WORKBOOK,
  GET_DATA_EXPORT_TABLES,
  GET_DATA_EXPORT_TABLES_LEGACY,
} from '@/graphql/dataExport';
import {
  DataExportFormat,
  DataExportTable,
  type ExportDataTableQuery,
  type ExportDataWorkbookQuery,
  type GetDataExportTablesLegacyQuery,
  type GetDataExportTablesQuery,
} from '@/generated/graphql';
import {
  DATA_EXPORT_SCOPE_REQUIRED_FEATURE,
  isFeatureUnsupported,
  isUnknownFieldError,
  markFeatureUnsupported,
} from './backendCompat';
import { downloadBase64 } from './download';
import { sanitizeFilename } from './filenames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApolloClient = ApolloClient<any>;

export { DataExportFormat, DataExportTable };

/** Fetch policy used for every export query. */
export const EXPORT_FETCH_POLICY = 'no-cache' as const;

/**
 * Run a read-only export Query, always bypassing the Apollo cache.
 * Callers cannot override the fetch policy. Throws when the server returns
 * no data.
 */
export async function runExportQuery<TData, TVariables extends OperationVariables = OperationVariables>(
  client: AnyApolloClient,
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
): Promise<TData> {
  const { data } = await client.query<TData, TVariables>({
    query,
    variables,
    fetchPolicy: EXPORT_FETCH_POLICY,
  });
  if (!data) {
    throw new Error('No export data was returned by the server.');
  }
  return data;
}

/** Scope of a data table, as reported by `DataExportTableInfo.scope`. */
export type DataExportScope = 'none' | 'project' | 'look' | 'cueList' | 'lookBoard';

/** Scopes that select one item inside a project. */
export type DataExportItemScope = 'look' | 'cueList' | 'lookBoard';

/**
 * LEGACY FALLBACK ONLY. Tables whose item scope is optional, for backends
 * that predate `DataExportTableInfo.scopeRequired` (lacylights-go v0.4.1
 * and older): LOOK_BOARD_ENTRIES exports every board when scopeId is
 * omitted. Newer backends report this themselves; use
 * {@link fetchDataExportTables}, whose entries carry `scopeRequired`.
 */
export const SCOPE_OPTIONAL_TABLES: ReadonlySet<DataExportTable> = new Set([
  DataExportTable.LookBoardEntries,
]);

/** Human-readable name of an item scope, e.g. "Cue list". */
export const DATA_EXPORT_SCOPE_LABELS: Record<DataExportItemScope, string> = {
  look: 'Look',
  cueList: 'Cue list',
  lookBoard: 'Look board',
};

/** True for scopes that pick one item (look / cue list / look board). */
export function isItemScope(scope: string | null | undefined): scope is DataExportItemScope {
  return scope === 'look' || scope === 'cueList' || scope === 'lookBoard';
}

/**
 * LEGACY FALLBACK ONLY: whether the table cannot be exported without a
 * scopeId, for backends without `DataExportTableInfo.scopeRequired`. Prefer
 * the `scopeRequired` of a {@link DataExportTableEntry}.
 */
export function isScopeRequired(table: DataExportTable, scope: string | null | undefined): boolean {
  return isItemScope(scope) && !SCOPE_OPTIONAL_TABLES.has(table);
}

/**
 * LEGACY FALLBACK ONLY: whether the table can be exported without a project
 * (fixture library), for when the table list has not been loaded. Prefer
 * {@link tableNeedsProject} with the table's {@link DataExportTableEntry}.
 */
export function isProjectOptional(table: DataExportTable): boolean {
  return table === DataExportTable.FixtureLibrary;
}

/**
 * True when exporting `table` needs a project. With the table's entry from
 * the server this follows its scope (`none` means no project is needed);
 * without one it falls back to {@link isProjectOptional}.
 */
export function tableNeedsProject(
  table: DataExportTable,
  info?: Pick<DataExportTableEntry, 'scope'> | null,
): boolean {
  return info ? info.scope !== 'none' : !isProjectOptional(table);
}

/** One exportable table as reported by the server (`dataExportTables`). */
export interface DataExportTableEntry {
  table: DataExportTable;
  label: string;
  /** One of {@link DataExportScope}. */
  scope: string;
  /**
   * True when `exportDataTable` rejects the table without a scopeId. Comes
   * from the server; derived with {@link isScopeRequired} for backends that
   * predate the field.
   */
  scopeRequired: boolean;
  columns: ReadonlyArray<string>;
}

type DataExportTableInfoData =
  | GetDataExportTablesQuery['dataExportTables'][number]
  | GetDataExportTablesLegacyQuery['dataExportTables'][number];

/** Normalize a server table entry; fills in `scopeRequired` for older backends. */
export function toDataExportTableEntry(info: DataExportTableInfoData): DataExportTableEntry {
  const reported = 'scopeRequired' in info ? info.scopeRequired : undefined;
  return {
    table: info.table,
    label: info.label,
    scope: info.scope,
    scopeRequired: typeof reported === 'boolean' ? reported : isScopeRequired(info.table, info.scope),
    columns: info.columns,
  };
}

/**
 * True when `error` shows the backend has data export but no
 * `DataExportTableInfo.scopeRequired` (lacylights-go v0.4.1 and older).
 */
export function isScopeRequiredUnsupportedError(error: unknown): boolean {
  return isUnknownFieldError(error, 'scopeRequired', 'DataExportTableInfo');
}

function toEntries(
  list: ReadonlyArray<DataExportTableInfoData> | null | undefined,
): DataExportTableEntry[] {
  if (!list) {
    throw new Error('No data export tables were returned by the server.');
  }
  return list.map(toDataExportTableEntry);
}

/**
 * Load the exportable tables, each with `scopeRequired`. Asks for
 * `scopeRequired` first; when the backend does not know that field it
 * remembers so for the client and retries without it, deriving the value
 * from the legacy rules ({@link isScopeRequired}). Any other error (for
 * example a backend with no data export at all) is rethrown; callers pass
 * it to `noteDataExportError`.
 *
 * The list is cached (`cache-first`) and the fallback remembered for the
 * Apollo client, so a backend upgraded while the page stays open is only
 * picked up once the page is reloaded (which creates a new client).
 */
export async function fetchDataExportTables(client: AnyApolloClient): Promise<DataExportTableEntry[]> {
  if (!isFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE)) {
    try {
      const { data } = await client.query<GetDataExportTablesQuery>({ query: GET_DATA_EXPORT_TABLES });
      return toEntries(data?.dataExportTables);
    } catch (error) {
      if (!isScopeRequiredUnsupportedError(error)) {
        throw error;
      }
      markFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE);
    }
  }
  const { data } = await client.query<GetDataExportTablesLegacyQuery>({
    query: GET_DATA_EXPORT_TABLES_LEGACY,
  });
  return toEntries(data?.dataExportTables);
}

/**
 * The exportable tables already in the Apollo cache (from an earlier
 * {@link fetchDataExportTables} on this client), or null when they have not
 * been loaded. Lets a component start from the known rules instead of the
 * legacy fallback while its own load is in flight.
 */
export function readCachedDataExportTables(client: AnyApolloClient): DataExportTableEntry[] | null {
  try {
    const list = isFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE)
      ? client.readQuery<GetDataExportTablesLegacyQuery>({ query: GET_DATA_EXPORT_TABLES_LEGACY })?.dataExportTables
      : client.readQuery<GetDataExportTablesQuery>({ query: GET_DATA_EXPORT_TABLES })?.dataExportTables;
    return list ? list.map(toDataExportTableEntry) : null;
  } catch {
    // Incomplete cache data: treat as not loaded.
    return null;
  }
}

/** Parse a string (e.g. a query parameter) into a DataExportTable. */
export function parseDataExportTable(value: string | null | undefined): DataExportTable | null {
  if (!value) return null;
  return (Object.values(DataExportTable) as string[]).includes(value)
    ? (value as DataExportTable)
    : null;
}

export interface DataExportFormatInfo {
  id: DataExportFormat;
  /** Short label, e.g. "CSV" */
  label: string;
  /** Menu label, e.g. "Excel (.xlsx)" */
  menuLabel: string;
}

export const DATA_EXPORT_FORMATS: ReadonlyArray<DataExportFormatInfo> = [
  { id: DataExportFormat.Csv, label: 'CSV', menuLabel: 'CSV (.csv)' },
  { id: DataExportFormat.Xlsx, label: 'Excel', menuLabel: 'Excel (.xlsx)' },
];

/** Export result as returned by the server (generated type). */
type DataExportResultData = ExportDataTableQuery['exportDataTable'] | ExportDataWorkbookQuery['exportDataWorkbook'];

/** A generated export file (the server result without `__typename`). */
export type DataExportFile = Pick<DataExportResultData, 'filename' | 'mimeType' | 'contentBase64' | 'rowCount'>;

export interface DataTableExportRequest {
  table: DataExportTable;
  format: DataExportFormat;
  /** Required for every table except FIXTURE_LIBRARY. */
  projectId?: string | null;
  /** Look / cue list / look board id for scoped tables. */
  scopeId?: string | null;
}

export interface DataWorkbookExportRequest {
  projectId: string;
  /** Tables to include; omitted means the server's default set. */
  tables?: ReadonlyArray<DataExportTable> | null;
}

// Typed from the generated query result so schema drift fails to compile;
// copies only the file fields (drops __typename).
function toFile(r: DataExportResultData | null | undefined): DataExportFile {
  if (!r) {
    throw new Error('No export data was returned by the server.');
  }
  return {
    filename: r.filename,
    mimeType: r.mimeType,
    contentBase64: r.contentBase64,
    rowCount: r.rowCount,
  };
}

/** Generate one table as CSV or XLSX. Does not download. */
export async function fetchDataTableExport(
  client: AnyApolloClient,
  request: DataTableExportRequest,
): Promise<DataExportFile> {
  const data = await runExportQuery<ExportDataTableQuery>(client, EXPORT_DATA_TABLE, {
    projectId: request.projectId || null,
    table: request.table,
    format: request.format,
    scopeId: request.scopeId || null,
  });
  return toFile(data.exportDataTable);
}

/** Generate a multi-sheet XLSX workbook for a project. Does not download. */
export async function fetchDataWorkbookExport(
  client: AnyApolloClient,
  request: DataWorkbookExportRequest,
): Promise<DataExportFile> {
  const data = await runExportQuery<ExportDataWorkbookQuery>(client, EXPORT_DATA_WORKBOOK, {
    projectId: request.projectId,
    tables: request.tables && request.tables.length > 0 ? [...request.tables] : null,
  });
  return toFile(data.exportDataWorkbook);
}

/**
 * Save a generated export file (binary-safe; uses the Mac bridge when
 * present). The server-supplied filename is sanitized first so it cannot
 * carry path separators or characters invalid on common filesystems.
 */
export function downloadDataExport(file: DataExportFile): void {
  downloadBase64(file.contentBase64, sanitizeFilename(file.filename), file.mimeType);
}

/** Generate one table and immediately download it. */
export async function exportAndDownloadDataTable(
  client: AnyApolloClient,
  request: DataTableExportRequest,
): Promise<DataExportFile> {
  const file = await fetchDataTableExport(client, request);
  downloadDataExport(file);
  return file;
}

/** Generate a workbook and immediately download it. */
export async function exportAndDownloadDataWorkbook(
  client: AnyApolloClient,
  request: DataWorkbookExportRequest,
): Promise<DataExportFile> {
  const file = await fetchDataWorkbookExport(client, request);
  downloadDataExport(file);
  return file;
}

export interface DataExportPageLinkOptions {
  table?: DataExportTable | null;
  scopeId?: string | null;
  projectId?: string | null;
}

/**
 * Link to the data section of the Import / Export page with context
 * preselected, e.g. `/import-export?section=data&table=LOOKS&project=p1`.
 */
export function buildDataExportPageHref(options: DataExportPageLinkOptions = {}): string {
  const params = new URLSearchParams({ section: 'data' });
  if (options.table) params.set('table', options.table);
  if (options.scopeId) params.set('scopeId', options.scopeId);
  if (options.projectId) params.set('project', options.projectId);
  return `/import-export?${params.toString()}`;
}
