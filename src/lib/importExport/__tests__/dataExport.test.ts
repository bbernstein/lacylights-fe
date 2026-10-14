import { ApolloError, type ApolloClient } from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  EXPORT_DATA_TABLE,
  EXPORT_DATA_WORKBOOK,
  GET_DATA_EXPORT_TABLES,
  GET_DATA_EXPORT_TABLES_LEGACY,
} from '@/graphql/dataExport';
import { DATA_EXPORT_SCOPE_REQUIRED_FEATURE, isFeatureUnsupported, markFeatureUnsupported } from '../backendCompat';
import {
  DATA_EXPORT_FORMATS,
  DataExportFormat,
  DataExportTable,
  EXPORT_FETCH_POLICY,
  SCOPE_OPTIONAL_TABLES,
  buildDataExportPageHref,
  downloadDataExport,
  exportAndDownloadDataTable,
  exportAndDownloadDataWorkbook,
  fetchDataExportTables,
  fetchDataTableExport,
  fetchDataWorkbookExport,
  isScopeRequiredUnsupportedError,
  isItemScope,
  isProjectOptional,
  isScopeRequired,
  parseDataExportTable,
  runExportQuery,
  tableNeedsProject,
  toDataExportTableEntry,
} from '../dataExport';

function makeClient() {
  const query = jest.fn();
  const mutate = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = { query, mutate } as unknown as ApolloClient<any>;
  return { client, query, mutate };
}

const file = {
  filename: 'Show-fixtures-2026-10-12.csv',
  mimeType: 'text/csv',
  // "a,b\n1,2\n"
  contentBase64: 'YSxiCjEsMgo=',
  rowCount: 1,
  __typename: 'DataExportResult',
};

function installBinaryBridge() {
  const downloadBinary = jest.fn();
  window.lacylights = {
    download: jest.fn(),
    downloadBinary,
    send: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    getAppVersion: jest.fn(),
  };
  return downloadBinary;
}

afterEach(() => {
  delete window.lacylights;
});

describe('importExport/dataExport', () => {
  describe('runExportQuery', () => {
    it('always uses the no-cache fetch policy', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { ok: true } });
      await expect(runExportQuery(client, EXPORT_DATA_TABLE, { a: 1 })).resolves.toEqual({ ok: true });
      expect(EXPORT_FETCH_POLICY).toBe('no-cache');
      expect(query).toHaveBeenCalledWith({
        query: EXPORT_DATA_TABLE,
        variables: { a: 1 },
        fetchPolicy: 'no-cache',
      });
    });

    it('throws when no data is returned', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: undefined });
      await expect(runExportQuery(client, EXPORT_DATA_TABLE, {})).rejects.toThrow(/No export data/);
    });

    it('propagates server errors', async () => {
      const { client, query } = makeClient();
      query.mockRejectedValue(new Error('denied'));
      await expect(runExportQuery(client, EXPORT_DATA_TABLE, {})).rejects.toThrow('denied');
    });
  });

  describe('data export tables', () => {
    const scopeRequiredUnknown = () =>
      new ApolloError({
        graphQLErrors: [new GraphQLError('Cannot query field "scopeRequired" on type "DataExportTableInfo".')],
      });

    const legacyTables = [
      { table: 'LOOKS', label: 'Looks', scope: 'project', columns: ['Name'] },
      { table: 'FIXTURE_LIBRARY', label: 'Fixture library', scope: 'none', columns: [] },
      { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', columns: ['Fixture'] },
      { table: 'CUE_LIST_DETAILS', label: 'Cue list details', scope: 'cueList', columns: [] },
      { table: 'LOOK_BOARD_ENTRIES', label: 'Look board entries', scope: 'lookBoard', columns: [] },
    ];

    it('uses scopeRequired from the server', async () => {
      const { client, query } = makeClient();
      // Deliberately different from the legacy rules, to show the server wins.
      query.mockResolvedValue({
        data: {
          dataExportTables: [
            { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', scopeRequired: false, columns: ['F'] },
            { table: 'LOOK_BOARD_ENTRIES', label: 'Boards', scope: 'lookBoard', scopeRequired: true, columns: [] },
          ],
        },
      });
      await expect(fetchDataExportTables(client)).resolves.toEqual([
        { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', scopeRequired: false, columns: ['F'] },
        { table: 'LOOK_BOARD_ENTRIES', label: 'Boards', scope: 'lookBoard', scopeRequired: true, columns: [] },
      ]);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledWith({ query: GET_DATA_EXPORT_TABLES });
      expect(isFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE)).toBe(false);
    });

    it('retries without scopeRequired on an older backend and applies the legacy rules', async () => {
      const { client, query } = makeClient();
      query.mockRejectedValueOnce(scopeRequiredUnknown());
      query.mockResolvedValueOnce({ data: { dataExportTables: legacyTables } });
      const tables = await fetchDataExportTables(client);
      expect(query).toHaveBeenNthCalledWith(1, { query: GET_DATA_EXPORT_TABLES });
      expect(query).toHaveBeenNthCalledWith(2, { query: GET_DATA_EXPORT_TABLES_LEGACY });
      expect(tables.map((t) => [t.table, t.scopeRequired])).toEqual([
        ['LOOKS', false],
        ['FIXTURE_LIBRARY', false],
        ['LOOK_DETAILS', true],
        ['CUE_LIST_DETAILS', true],
        ['LOOK_BOARD_ENTRIES', false],
      ]);
      expect(isFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE)).toBe(true);
    });

    it('goes straight to the legacy query once the field is known to be missing', async () => {
      const { client, query } = makeClient();
      markFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE);
      query.mockResolvedValue({ data: { dataExportTables: legacyTables } });
      await fetchDataExportTables(client);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledWith({ query: GET_DATA_EXPORT_TABLES_LEGACY });
    });

    it('rethrows other errors without retrying', async () => {
      const { client, query } = makeClient();
      const noDataExport = new ApolloError({
        graphQLErrors: [new GraphQLError('Cannot query field "dataExportTables" on type "Query".')],
      });
      query.mockRejectedValue(noDataExport);
      await expect(fetchDataExportTables(client)).rejects.toBe(noDataExport);
      expect(query).toHaveBeenCalledTimes(1);
      expect(isFeatureUnsupported(client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE)).toBe(false);
    });

    it('throws when the server returns no table list', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: undefined });
      await expect(fetchDataExportTables(client)).rejects.toThrow(/No data export tables/);
    });

    it('recognizes the missing-field error', () => {
      expect(isScopeRequiredUnsupportedError(scopeRequiredUnknown())).toBe(true);
      expect(isScopeRequiredUnsupportedError(new Error('offline'))).toBe(false);
    });

    it('normalizes entries with and without scopeRequired', () => {
      expect(
        toDataExportTableEntry({
          __typename: 'DataExportTableInfo',
          table: DataExportTable.CueListDetails,
          label: 'Cue list details',
          scope: 'cueList',
          scopeRequired: false,
          columns: [],
        }),
      ).toEqual({ table: 'CUE_LIST_DETAILS', label: 'Cue list details', scope: 'cueList', scopeRequired: false, columns: [] });
      expect(
        toDataExportTableEntry({ table: DataExportTable.CueListDetails, label: 'Cue list details', scope: 'cueList', columns: [] })
          .scopeRequired,
      ).toBe(true);
    });
  });

  describe('scope helpers', () => {
    it('recognizes item scopes', () => {
      expect(isItemScope('look')).toBe(true);
      expect(isItemScope('cueList')).toBe(true);
      expect(isItemScope('lookBoard')).toBe(true);
      expect(isItemScope('project')).toBe(false);
      expect(isItemScope('none')).toBe(false);
      expect(isItemScope(null)).toBe(false);
    });

    it('requires a scope for look and cue list details only', () => {
      expect(isScopeRequired(DataExportTable.LookDetails, 'look')).toBe(true);
      expect(isScopeRequired(DataExportTable.CueListDetails, 'cueList')).toBe(true);
      expect(isScopeRequired(DataExportTable.LookBoardEntries, 'lookBoard')).toBe(false);
      expect(isScopeRequired(DataExportTable.Looks, 'project')).toBe(false);
      expect(SCOPE_OPTIONAL_TABLES.has(DataExportTable.LookBoardEntries)).toBe(true);
    });

    it('only the fixture library is project-optional', () => {
      expect(isProjectOptional(DataExportTable.FixtureLibrary)).toBe(true);
      expect(isProjectOptional(DataExportTable.FixtureTypes)).toBe(false);
    });

    it('needs a project unless the server scope is none', () => {
      expect(tableNeedsProject(DataExportTable.Looks, { scope: 'project' })).toBe(true);
      expect(tableNeedsProject(DataExportTable.LookDetails, { scope: 'look' })).toBe(true);
      expect(tableNeedsProject(DataExportTable.FixtureLibrary, { scope: 'none' })).toBe(false);
      // The server's scope wins over the table name.
      expect(tableNeedsProject(DataExportTable.Looks, { scope: 'none' })).toBe(false);
    });

    it('falls back to the legacy project rule without table info', () => {
      expect(tableNeedsProject(DataExportTable.FixtureLibrary)).toBe(false);
      expect(tableNeedsProject(DataExportTable.FixtureLibrary, null)).toBe(false);
      expect(tableNeedsProject(DataExportTable.Fixtures)).toBe(true);
    });

    it('parses table names', () => {
      expect(parseDataExportTable('LOOKS')).toBe(DataExportTable.Looks);
      expect(parseDataExportTable('looks')).toBeNull();
      expect(parseDataExportTable('')).toBeNull();
      expect(parseDataExportTable(null)).toBeNull();
    });

    it('lists CSV and Excel formats', () => {
      expect(DATA_EXPORT_FORMATS.map((f) => f.id)).toEqual([
        DataExportFormat.Csv,
        DataExportFormat.Xlsx,
      ]);
    });
  });

  describe('fetchDataTableExport', () => {
    it('sends the table, format, project and scope without caching', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataTable: file } });
      const result = await fetchDataTableExport(client, {
        table: DataExportTable.LookDetails,
        format: DataExportFormat.Xlsx,
        projectId: 'p1',
        scopeId: 'l1',
      });
      expect(query).toHaveBeenCalledWith({
        query: EXPORT_DATA_TABLE,
        variables: { projectId: 'p1', table: 'LOOK_DETAILS', format: 'XLSX', scopeId: 'l1' },
        fetchPolicy: 'no-cache',
      });
      // __typename is stripped
      expect(result).toEqual({
        filename: file.filename,
        mimeType: file.mimeType,
        contentBase64: file.contentBase64,
        rowCount: 1,
      });
    });

    it('sends null project and scope when omitted', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataTable: file } });
      await fetchDataTableExport(client, {
        table: DataExportTable.FixtureLibrary,
        format: DataExportFormat.Csv,
      });
      expect(query.mock.calls[0][0].variables).toEqual({
        projectId: null,
        table: 'FIXTURE_LIBRARY',
        format: 'CSV',
        scopeId: null,
      });
    });

    it('throws when the result field is missing', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataTable: null } });
      await expect(
        fetchDataTableExport(client, { table: DataExportTable.Looks, format: DataExportFormat.Csv, projectId: 'p1' }),
      ).rejects.toThrow(/No export data/);
    });
  });

  describe('fetchDataWorkbookExport', () => {
    it('omits tables to use the server default', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataWorkbook: file } });
      await fetchDataWorkbookExport(client, { projectId: 'p1' });
      expect(query).toHaveBeenCalledWith({
        query: EXPORT_DATA_WORKBOOK,
        variables: { projectId: 'p1', tables: null },
        fetchPolicy: 'no-cache',
      });
    });

    it('passes an explicit table list', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataWorkbook: file } });
      await fetchDataWorkbookExport(client, {
        projectId: 'p1',
        tables: [DataExportTable.Looks, DataExportTable.CueLists],
      });
      expect(query.mock.calls[0][0].variables.tables).toEqual(['LOOKS', 'CUE_LISTS']);
    });

    it('treats an empty table list as the default', async () => {
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataWorkbook: file } });
      await fetchDataWorkbookExport(client, { projectId: 'p1', tables: [] });
      expect(query.mock.calls[0][0].variables.tables).toBeNull();
    });
  });

  describe('downloads', () => {
    it('downloadDataExport sanitizes the server-supplied filename', () => {
      const downloadBinary = installBinaryBridge();
      downloadDataExport({ ...file, filename: '../etc/pass:wd.csv' });
      expect(downloadBinary).toHaveBeenCalledWith(file.contentBase64, '-etc-pass-wd.csv', 'text/csv');
    });

    it('downloadDataExport uses the binary download path', () => {
      const downloadBinary = installBinaryBridge();
      downloadDataExport(file);
      expect(downloadBinary).toHaveBeenCalledWith(file.contentBase64, file.filename, 'text/csv');
    });

    it('falls back to a decoded Blob download in the browser', () => {
      const anchors: HTMLAnchorElement[] = [];
      const realCreate = document.createElement.bind(document);
      const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = realCreate(tag);
        if (tag === 'a') {
          (el as HTMLAnchorElement).click = jest.fn();
          anchors.push(el as HTMLAnchorElement);
        }
        return el;
      });
      const originalCreateURL = URL.createObjectURL;
      const originalRevokeURL = URL.revokeObjectURL;
      const blobs: Blob[] = [];
      URL.createObjectURL = jest.fn((b: Blob) => {
        blobs.push(b);
        return 'blob:mock';
      }) as unknown as typeof URL.createObjectURL;
      URL.revokeObjectURL = jest.fn();
      try {
        downloadDataExport({ ...file, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        expect(anchors).toHaveLength(1);
        expect(anchors[0].download).toBe(file.filename);
        expect(blobs[0].size).toBe(8);
        expect(blobs[0].type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } finally {
        createSpy.mockRestore();
        URL.createObjectURL = originalCreateURL;
        URL.revokeObjectURL = originalRevokeURL;
      }
    });

    it('exportAndDownloadDataTable fetches then downloads', async () => {
      const downloadBinary = installBinaryBridge();
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataTable: file } });
      const result = await exportAndDownloadDataTable(client, {
        table: DataExportTable.Fixtures,
        format: DataExportFormat.Csv,
        projectId: 'p1',
      });
      expect(result.rowCount).toBe(1);
      expect(downloadBinary).toHaveBeenCalledWith(file.contentBase64, file.filename, file.mimeType);
    });

    it('exportAndDownloadDataWorkbook fetches then downloads', async () => {
      const downloadBinary = installBinaryBridge();
      const { client, query } = makeClient();
      query.mockResolvedValue({ data: { exportDataWorkbook: { ...file, filename: 'Show.xlsx' } } });
      const result = await exportAndDownloadDataWorkbook(client, { projectId: 'p1' });
      expect(result.filename).toBe('Show.xlsx');
      expect(downloadBinary).toHaveBeenCalledWith(file.contentBase64, 'Show.xlsx', file.mimeType);
    });

    it('does not download when the export fails', async () => {
      const downloadBinary = installBinaryBridge();
      const { client, query } = makeClient();
      query.mockRejectedValue(new Error('nope'));
      await expect(
        exportAndDownloadDataTable(client, {
          table: DataExportTable.Fixtures,
          format: DataExportFormat.Csv,
          projectId: 'p1',
        }),
      ).rejects.toThrow('nope');
      expect(downloadBinary).not.toHaveBeenCalled();
    });
  });

  describe('buildDataExportPageHref', () => {
    it('links to the data section with context', () => {
      expect(
        buildDataExportPageHref({ table: DataExportTable.LookDetails, scopeId: 'l 1', projectId: 'p1' }),
      ).toBe('/import-export?section=data&table=LOOK_DETAILS&scopeId=l+1&project=p1');
    });

    it('omits empty values', () => {
      expect(buildDataExportPageHref()).toBe('/import-export?section=data');
      expect(buildDataExportPageHref({ table: DataExportTable.FixtureLibrary, projectId: null })).toBe(
        '/import-export?section=data&table=FIXTURE_LIBRARY',
      );
    });
  });
});
