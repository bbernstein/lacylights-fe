import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import DataExportPanel, { type DataExportPanelProps } from '../DataExportPanel';
import {
  EXPORT_DATA_TABLE,
  EXPORT_DATA_WORKBOOK,
  GET_DATA_EXPORT_TABLES,
} from '@/graphql/dataExport';
import { GET_PROJECT_LOOKS } from '@/graphql/looks';
import { GET_PROJECT_CUE_LISTS } from '@/graphql/cueLists';
import { GET_PROJECT_LOOK_BOARDS } from '@/graphql/lookBoards';

const projects = [
  { id: 'p1', name: 'Show One' },
  { id: 'p2', name: 'Show Two' },
];

const tablesMock: MockedResponse = {
  request: { query: GET_DATA_EXPORT_TABLES },
  result: {
    data: {
      dataExportTables: [
        { table: 'FIXTURES', label: 'Fixtures', scope: 'project', columns: ['Name', 'Universe'] },
        { table: 'FIXTURE_LIBRARY', label: 'Fixture library', scope: 'none', columns: ['Manufacturer'] },
        { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', columns: ['Fixture'] },
        { table: 'CUE_LIST_DETAILS', label: 'Cue list details', scope: 'cueList', columns: [] },
        { table: 'LOOK_BOARD_ENTRIES', label: 'Look board entries', scope: 'lookBoard', columns: ['Board'] },
      ],
    },
  },
};

const looksMock = (projectId: string, looks: Array<{ id: string; name: string }>): MockedResponse => ({
  request: { query: GET_PROJECT_LOOKS, variables: { projectId } },
  result: {
    data: {
      project: {
        id: projectId,
        looks: looks.map((l) => ({
          ...l,
          description: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          fixtureValues: [],
        })),
      },
    },
  },
});

const cueListsMock = (projectId: string, cueLists: Array<{ id: string; name: string }>): MockedResponse => ({
  request: { query: GET_PROJECT_CUE_LISTS, variables: { projectId } },
  result: {
    data: {
      project: {
        id: projectId,
        cueLists: cueLists.map((c) => ({
          ...c,
          description: null,
          loop: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          cues: [],
        })),
      },
    },
  },
});

const boardsMock = (projectId: string, boards: Array<{ id: string; name: string }>): MockedResponse => ({
  request: { query: GET_PROJECT_LOOK_BOARDS, variables: { projectId } },
  result: {
    data: {
      lookBoards: boards.map((b) => ({
        ...b,
        description: null,
        defaultFadeTime: 3,
        gridSize: 50,
        canvasWidth: 2000,
        canvasHeight: 2000,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        buttons: [],
      })),
    },
  },
});

const exportResult = (filename: string, rowCount = 3) => ({
  filename,
  mimeType: 'text/csv',
  contentBase64: 'YSxiCg==',
  rowCount,
});

const tableExportMock = (
  variables: Record<string, unknown>,
  filename = 'export.csv',
  rowCount = 3,
): MockedResponse => ({
  request: { query: EXPORT_DATA_TABLE, variables },
  result: { data: { exportDataTable: exportResult(filename, rowCount) } },
});

function installBridge() {
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

function renderPanel(mocks: MockedResponse[], props: Partial<DataExportPanelProps> = {}) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <DataExportPanel projects={projects} defaultProjectId="p1" {...props} />
    </MockedProvider>,
  );
}

describe('DataExportPanel', () => {
  it('shows a loading state, then builds the table picker from the server', async () => {
    renderPanel([tablesMock]);
    expect(screen.getByText('Loading export options...')).toBeInTheDocument();
    const select = await screen.findByLabelText('Data');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Fixtures',
      'Fixture library',
      'Look details',
      'Cue list details',
      'Look board entries',
    ]);
    expect(select).toHaveValue('FIXTURES');
    expect(screen.getByTestId('data-export-columns')).toHaveTextContent('Columns: Name, Universe');
    expect(screen.getByLabelText('Project')).toHaveValue('p1');
  });

  it('shows an error when the table list cannot be loaded', async () => {
    renderPanel([{ request: { query: GET_DATA_EXPORT_TABLES }, error: new Error('offline') }]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load the list of exportable data. offline',
    );
  });

  it('exports a project table as CSV and reports the row count', async () => {
    const downloadBinary = installBridge();
    renderPanel([
      tablesMock,
      tableExportMock(
        { projectId: 'p2', table: 'FIXTURES', format: 'CSV', scopeId: null },
        'Show-Two-fixtures.csv',
        1,
      ),
    ]);
    await screen.findByLabelText('Data');
    fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('button', { name: 'Exporting...' })).toBeDisabled();
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent(
      'Saved Show-Two-fixtures.csv (1 row)',
    );
    expect(downloadBinary).toHaveBeenCalledWith('YSxiCg==', 'Show-Two-fixtures.csv', 'text/csv');
  });

  it('exports as Excel when the format toggle is switched', async () => {
    installBridge();
    renderPanel([
      tablesMock,
      tableExportMock({ projectId: 'p1', table: 'FIXTURES', format: 'XLSX', scopeId: null }, 'f.xlsx'),
    ]);
    await screen.findByLabelText('Data');
    const excel = screen.getByRole('radio', { name: 'Excel' });
    fireEvent.click(excel);
    expect(excel).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent('Saved f.xlsx (3 rows)');
  });

  it('honours the table and scope defaults and exports look details', async () => {
    installBridge();
    renderPanel(
      [
        tablesMock,
        looksMock('p1', [
          { id: 'l1', name: 'Warm' },
          { id: 'l2', name: 'Cool' },
        ]),
        tableExportMock({ projectId: 'p1', table: 'LOOK_DETAILS', format: 'CSV', scopeId: 'l2' }, 'cool.csv'),
      ],
      { defaultTable: 'LOOK_DETAILS', defaultScopeId: 'l2' },
    );
    const lookSelect = await screen.findByLabelText('Look');
    expect(screen.getByLabelText('Data')).toHaveValue('LOOK_DETAILS');
    expect(within(lookSelect).queryByText('All looks')).not.toBeInTheDocument();
    expect(lookSelect).toHaveValue('l2');
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent('Saved cool.csv');
  });

  it('selects the first item when the requested scope is not in the project', async () => {
    renderPanel(
      [tablesMock, cueListsMock('p1', [{ id: 'c1', name: 'Act 1' }])],
      { defaultTable: 'CUE_LIST_DETAILS', defaultScopeId: 'missing' },
    );
    const select = await screen.findByLabelText('Cue list');
    await waitFor(() => expect(select).toHaveValue('c1'));
  });

  it('disables export when a required scope has no items', async () => {
    renderPanel([tablesMock, looksMock('p1', [])], { defaultTable: 'LOOK_DETAILS' });
    expect(await screen.findByText('This project has no looks.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
    // The workbook does not depend on the selected table.
    expect(screen.getByRole('button', { name: 'Export all (workbook)' })).toBeEnabled();
  });

  it('allows exporting all look boards when no board is chosen', async () => {
    installBridge();
    renderPanel(
      [
        tablesMock,
        boardsMock('p1', [{ id: 'b1', name: 'Main' }]),
        tableExportMock({ projectId: 'p1', table: 'LOOK_BOARD_ENTRIES', format: 'CSV', scopeId: null }, 'all.csv'),
        tableExportMock({ projectId: 'p1', table: 'LOOK_BOARD_ENTRIES', format: 'CSV', scopeId: 'b1' }, 'main.csv'),
      ],
      { defaultTable: 'LOOK_BOARD_ENTRIES' },
    );
    const select = await screen.findByLabelText('Look board');
    expect(select).toHaveValue('');
    expect(within(select).getByText('All look boards')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent('Saved all.csv');

    fireEvent.change(select, { target: { value: 'b1' } });
    expect(screen.queryByTestId('data-export-result')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent('Saved main.csv');
  });

  it('exports the fixture library without a project picker', async () => {
    installBridge();
    renderPanel(
      [
        tablesMock,
        tableExportMock({ projectId: 'p1', table: 'FIXTURE_LIBRARY', format: 'CSV', scopeId: null }, 'lib.csv'),
      ],
      { defaultTable: 'FIXTURE_LIBRARY' },
    );
    await screen.findByLabelText('Data');
    expect(screen.queryByLabelText('Project')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent('Saved lib.csv');
  });

  it('switching tables resets the scope picker', async () => {
    renderPanel([tablesMock, looksMock('p1', [{ id: 'l1', name: 'Warm' }])]);
    const select = await screen.findByLabelText('Data');
    expect(screen.queryByLabelText('Look')).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'LOOK_DETAILS' } });
    const lookSelect = await screen.findByLabelText('Look');
    await waitFor(() => expect(lookSelect).toHaveValue('l1'));
  });

  it('exports the whole project as a workbook', async () => {
    const downloadBinary = installBridge();
    renderPanel([
      tablesMock,
      {
        request: { query: EXPORT_DATA_WORKBOOK, variables: { projectId: 'p1', tables: null } },
        result: {
          data: {
            exportDataWorkbook: {
              filename: 'Show-One.xlsx',
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              contentBase64: 'UEsDBA==',
              rowCount: 42,
            },
          },
        },
      },
    ]);
    await screen.findByLabelText('Data');
    fireEvent.click(screen.getByRole('button', { name: 'Export all (workbook)' }));
    expect(await screen.findByTestId('data-export-result')).toHaveTextContent(
      'Saved Show-One.xlsx (42 rows)',
    );
    expect(downloadBinary).toHaveBeenCalledWith(
      'UEsDBA==',
      'Show-One.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('shows an error when the export fails', async () => {
    const downloadBinary = installBridge();
    renderPanel([
      tablesMock,
      {
        request: {
          query: EXPORT_DATA_TABLE,
          variables: { projectId: 'p1', table: 'FIXTURES', format: 'CSV', scopeId: null },
        },
        error: new Error('access denied'),
      },
    ]);
    await screen.findByLabelText('Data');
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export failed. access denied');
    expect(downloadBinary).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
  });

  it('explains when there are no projects', async () => {
    renderPanel([tablesMock], { projects: [], defaultProjectId: null });
    expect(await screen.findByText('There are no projects to export.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export all (workbook)' })).toBeDisabled();
  });

  it('ignores an unknown table param', async () => {
    renderPanel([tablesMock], { defaultTable: 'BOGUS' });
    expect(await screen.findByLabelText('Data')).toHaveValue('FIXTURES');
  });

  it('follows a later default project', async () => {
    const { rerender } = renderPanel([tablesMock]);
    await screen.findByLabelText('Data');
    rerender(
      <MockedProvider mocks={[tablesMock]} addTypename={false}>
        <DataExportPanel projects={projects} defaultProjectId="p2" />
      </MockedProvider>,
    );
    expect(screen.getByLabelText('Project')).toHaveValue('p2');
  });

  describe('with an older backend that has no data export', () => {
    const unsupportedText = "This server version doesn't support CSV/Excel export; update LacyLights.";

    it('explains that the server needs an update instead of showing an error', async () => {
      renderPanel([
        {
          request: { query: GET_DATA_EXPORT_TABLES },
          result: { errors: [new GraphQLError('Cannot query field "dataExportTables" on type "Query".')] },
        },
      ]);
      expect(await screen.findByText(unsupportedText)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Export all (workbook)' })).not.toBeInTheDocument();
    });

    it('switches to the explanation when an export finds the field missing', async () => {
      const downloadBinary = installBridge();
      renderPanel([
        tablesMock,
        {
          request: {
            query: EXPORT_DATA_TABLE,
            variables: { projectId: 'p1', table: 'FIXTURES', format: 'CSV', scopeId: null },
          },
          result: { errors: [new GraphQLError('Cannot query field "exportDataTable" on type "Query".')] },
        },
      ]);
      await screen.findByLabelText('Data');
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      expect(await screen.findByText(unsupportedText)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(downloadBinary).not.toHaveBeenCalled();
    });
  });
});
