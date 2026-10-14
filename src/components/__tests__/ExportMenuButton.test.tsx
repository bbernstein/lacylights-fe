import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { InMemoryCache } from '@apollo/client';
import { GraphQLError } from 'graphql';
import ExportMenuButton, { type ExportMenuButtonProps } from '../ExportMenuButton';
import {
  EXPORT_DATA_TABLE,
  GET_DATA_EXPORT_TABLES,
  GET_DATA_EXPORT_TABLES_LEGACY,
} from '@/graphql/dataExport';
import { DataExportTable } from '@/generated/graphql';

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

const exportMock = (
  variables: Record<string, unknown>,
  filename = 'export.csv',
): MockedResponse => ({
  request: { query: EXPORT_DATA_TABLE, variables },
  result: {
    data: {
      exportDataTable: { filename, mimeType: 'text/csv', contentBase64: 'YQo=', rowCount: 1 },
    },
  },
});

function renderButton(props: ExportMenuButtonProps, mocks: MockedResponse[] = [], cache?: InMemoryCache) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false} cache={cache}>
      <ExportMenuButton {...props} />
    </MockedProvider>,
  );
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
}

describe('ExportMenuButton', () => {
  it('renders nothing without a table', () => {
    const { container } = renderButton({});
    expect(container).toBeEmptyDOMElement();
  });

  it('opens a menu with CSV, Excel and a link to the Import / Export page', () => {
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
    const button = screen.getByRole('button', { name: 'Export' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Export options' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
      'CSV',
      'Excel',
      'More import/export options…',
    ]);
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export?section=data&table=LOOKS&project=p1',
    );
  });

  it('includes the scope in the link for detail pages', () => {
    renderButton({ table: DataExportTable.CueListDetails, scopeId: 'cl1', projectId: 'p1' });
    openMenu();
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export?section=data&table=CUE_LIST_DETAILS&scopeId=cl1&project=p1',
    );
  });

  it('downloads CSV and closes the menu', async () => {
    const downloadBinary = installBridge();
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
      exportMock({ projectId: 'p1', table: 'LOOKS', format: 'CSV', scopeId: null }, 'looks.csv'),
    ]);
    openMenu();
    const csv = screen.getByRole('menuitem', { name: 'CSV' });
    fireEvent.click(csv);
    expect(csv).toHaveTextContent('Exporting...');
    expect(csv).toBeDisabled();
    await waitFor(() => expect(downloadBinary).toHaveBeenCalledWith('YQo=', 'looks.csv', 'text/csv'));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('returns focus to the Export button after a successful export', async () => {
    installBridge();
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
      exportMock({ projectId: 'p1', table: 'LOOKS', format: 'CSV', scopeId: null }, 'looks.csv'),
    ]);
    openMenu();
    const csv = screen.getByRole('menuitem', { name: 'CSV' });
    expect(csv).toHaveFocus();
    fireEvent.click(csv);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus();
  });

  it('downloads Excel with the scope id', async () => {
    const downloadBinary = installBridge();
    renderButton({ table: DataExportTable.LookDetails, scopeId: 'l1', projectId: 'p1' }, [
      exportMock({ projectId: 'p1', table: 'LOOK_DETAILS', format: 'XLSX', scopeId: 'l1' }, 'look.xlsx'),
    ]);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excel' }));
    await waitFor(() => expect(downloadBinary).toHaveBeenCalledWith('YQo=', 'look.xlsx', 'text/csv'));
  });

  it('keeps the menu open and shows an error when the export fails', async () => {
    const downloadBinary = installBridge();
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
      {
        request: {
          query: EXPORT_DATA_TABLE,
          variables: { projectId: 'p1', table: 'LOOKS', format: 'CSV', scopeId: null },
        },
        error: new Error('denied'),
      },
    ]);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export failed. denied');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(downloadBinary).not.toHaveBeenCalled();

    // Closing clears the error.
    openMenu();
    openMenu();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables downloads when a project-scoped table has no project', () => {
    renderButton({ table: DataExportTable.Looks });
    openMenu();
    expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Excel' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export?section=data&table=LOOKS',
    );
  });

  it('exports the fixture library without a project', async () => {
    const downloadBinary = installBridge();
    renderButton({ table: DataExportTable.FixtureLibrary, projectId: 'p1' }, [
      exportMock({ projectId: 'p1', table: 'FIXTURE_LIBRARY', format: 'CSV', scopeId: null }, 'lib.csv'),
    ]);
    openMenu();
    // The library is global, so the link carries no project.
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export?section=data&table=FIXTURE_LIBRARY',
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
    await waitFor(() => expect(downloadBinary).toHaveBeenCalledWith('YQo=', 'lib.csv', 'text/csv'));
  });

  it('groups several tables under headings', async () => {
    const downloadBinary = installBridge();
    renderButton(
      {
        projectId: 'p1',
        tables: [
          { table: DataExportTable.Fixtures, label: 'Fixtures' },
          { table: DataExportTable.FixtureTypes, label: 'Fixture types' },
        ],
      },
      [exportMock({ projectId: 'p1', table: 'FIXTURE_TYPES', format: 'XLSX', scopeId: null }, 'types.xlsx')],
    );
    openMenu();
    expect(screen.getByText('Fixtures')).toBeInTheDocument();
    expect(screen.getByText('Fixture types')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((el) => el.getAttribute('aria-label') ?? el.textContent)).toEqual([
      'Fixtures as CSV',
      'Fixtures as Excel',
      'Fixture types as CSV',
      'Fixture types as Excel',
      'More import/export options…',
    ]);
    // The link uses the first table.
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export?section=data&table=FIXTURES&project=p1',
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fixture types as Excel' }));
    await waitFor(() => expect(downloadBinary).toHaveBeenCalledWith('YQo=', 'types.xlsx', 'text/csv'));
  });

  it('closes on Escape, backdrop click and when following the link', () => {
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
    openMenu();
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu();
    fireEvent.click(screen.getByTestId('export-menu-backdrop'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'More import/export options…' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation and returns focus on Escape', () => {
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
    const trigger = screen.getByRole('button', { name: 'Export' });
    trigger.focus();
    openMenu();
    const menu = screen.getByRole('menu');
    const [csv, excel, more] = screen.getAllByRole('menuitem');
    expect(csv).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(excel).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'End' });
    expect(more).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(csv).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(more).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(csv).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'a' });
    expect(csv).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Tab', () => {
    renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
    openMenu();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('explains disabled items and skips them when navigating', () => {
    renderButton({ table: DataExportTable.Looks, projectId: null });
    openMenu();
    const csv = screen.getByRole('menuitem', { name: 'CSV' });
    expect(csv).toBeDisabled();
    expect(csv).toHaveAttribute('title', 'Open a project to export this list');
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveFocus();
  });

  it('shows why items are disabled as visible text linked to them', () => {
    renderButton({
      projectId: null,
      tables: [
        { table: DataExportTable.Looks, label: 'Looks' },
        { table: DataExportTable.FixtureLibrary, label: 'Library' },
      ],
    });
    openMenu();
    // Disabled items cannot be focused and a title is not shown on touch, so
    // the reason is in the menu as text, described-by from both items.
    const reason = screen.getByText('Open a project to export this list');
    expect(reason.id).toBeTruthy();
    for (const name of ['Looks as CSV', 'Looks as Excel']) {
      expect(screen.getByRole('menuitem', { name })).toHaveAttribute('aria-describedby', reason.id);
      expect(screen.getByRole('menuitem', { name })).toHaveAccessibleDescription('Open a project to export this list');
    }
    // Items that can be exported get no reason.
    expect(screen.getByRole('menuitem', { name: 'Library as CSV' })).not.toHaveAttribute('aria-describedby');
    expect(screen.getAllByText('Open a project to export this list')).toHaveLength(1);
  });

  it('keeps entries for the same table with different scopes apart', async () => {
    installBridge();
    renderButton(
      {
        tables: [
          { table: DataExportTable.LookBoardEntries, label: 'Board A', scopeId: 'a' },
          { table: DataExportTable.LookBoardEntries, label: 'Board B', scopeId: 'b' },
        ],
        projectId: 'p1',
      },
      [exportMock({ projectId: 'p1', table: 'LOOK_BOARD_ENTRIES', format: 'CSV', scopeId: 'b' }, 'b.csv')],
    );
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Board B as CSV' }));
    expect(screen.getByRole('menuitem', { name: 'Board B as CSV' })).toHaveTextContent('Exporting...');
    expect(screen.getByRole('menuitem', { name: 'Board A as CSV' })).toHaveTextContent('CSV');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('supports the toolbar appearance and compact label', () => {
    renderButton({ table: DataExportTable.Looks, projectId: 'p1', appearance: 'toolbar', compact: true, className: 'extra' });
    const button = screen.getByRole('button', { name: 'Export' });
    expect(button.className).toContain('bg-gray-700');
    expect(screen.getByText('Export')).toHaveClass('hidden', 'sm:inline');
    expect(button.parentElement).toHaveClass('extra');
  });

  describe('table rules from the server', () => {
    const tablesMock = (
      tables: Array<{ table: string; scope: string; scopeRequired: boolean }>,
    ): MockedResponse => ({
      request: { query: GET_DATA_EXPORT_TABLES },
      result: {
        data: { dataExportTables: tables.map((t) => ({ label: t.table, columns: [], ...t })) },
      },
    });

    it('disables a table whose scope is required when no scope id is given', async () => {
      renderButton({ table: DataExportTable.LookDetails, projectId: 'p1' }, [
        tablesMock([{ table: 'LOOK_DETAILS', scope: 'look', scopeRequired: true }]),
      ]);
      openMenu();
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeDisabled());
      expect(screen.getByRole('menuitem', { name: 'CSV' })).toHaveAttribute('title', 'Open a look to export this list');
      expect(screen.getByRole('menuitem', { name: 'Excel' })).toBeDisabled();
      // Focus moves off the item that just became disabled.
      expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveFocus();
    });

    it('allows a table whose scope the server marks optional without a scope id', async () => {
      installBridge();
      renderButton({ table: DataExportTable.LookDetails, projectId: 'p1' }, [
        tablesMock([{ table: 'LOOK_DETAILS', scope: 'look', scopeRequired: false }]),
        exportMock({ projectId: 'p1', table: 'LOOK_DETAILS', format: 'CSV', scopeId: null }, 'all.csv'),
      ]);
      openMenu();
      // Give the table list time to arrive; CSV must stay enabled.
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeEnabled());
      fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    });

    it('needs no project for a table whose scope is none', async () => {
      const downloadBinary = installBridge();
      renderButton({ table: DataExportTable.FixtureTypes }, [
        tablesMock([{ table: 'FIXTURE_TYPES', scope: 'none', scopeRequired: false }]),
        exportMock({ projectId: null, table: 'FIXTURE_TYPES', format: 'CSV', scopeId: null }, 'types.csv'),
      ]);
      openMenu();
      // Without the list the legacy rule would disable it (no project).
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeEnabled());
      expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
        'href',
        '/import-export?section=data&table=FIXTURE_TYPES',
      );
      fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
      await waitFor(() => expect(downloadBinary).toHaveBeenCalledWith('YQo=', 'types.csv', 'text/csv'));
    });

    it('explains a required scope that is not a look, cue list or look board', async () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
        tablesMock([{ table: 'LOOKS', scope: 'project', scopeRequired: true }]),
      ]);
      openMenu();
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeDisabled());
      expect(screen.getByRole('menuitem', { name: 'CSV' })).toHaveAttribute('title', 'Open an item to export this list');
    });

    it('applies the legacy scope rules on a backend without scopeRequired', async () => {
      renderButton(
        {
          projectId: 'p1',
          tables: [
            { table: DataExportTable.LookDetails, label: 'Look' },
            { table: DataExportTable.LookBoardEntries, label: 'Boards' },
          ],
        },
        [
          {
            request: { query: GET_DATA_EXPORT_TABLES },
            result: {
              errors: [new GraphQLError('Cannot query field "scopeRequired" on type "DataExportTableInfo".')],
            },
          },
          {
            request: { query: GET_DATA_EXPORT_TABLES_LEGACY },
            result: {
              data: {
                dataExportTables: [
                  { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', columns: [] },
                  { table: 'LOOK_BOARD_ENTRIES', label: 'Look board entries', scope: 'lookBoard', columns: [] },
                ],
              },
            },
          },
        ],
      );
      openMenu();
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Look as CSV' })).toBeDisabled());
      expect(screen.getByRole('menuitem', { name: 'Look as CSV' })).toHaveAttribute(
        'title',
        'Open a look to export this list',
      );
      expect(screen.getByRole('menuitem', { name: 'Boards as CSV' })).toBeEnabled();
      expect(screen.queryByText("This server version doesn't support CSV/Excel export; update LacyLights.")).not.toBeInTheDocument();
    });

    it('applies cached rules as soon as the menu opens', () => {
      const cache = new InMemoryCache({ addTypename: false });
      cache.writeQuery({
        query: GET_DATA_EXPORT_TABLES,
        data: {
          dataExportTables: [{ table: 'FIXTURE_TYPES', label: 'Fixture types', scope: 'none', scopeRequired: false, columns: [] }],
        },
      });
      renderButton({ table: DataExportTable.FixtureTypes }, [], cache);
      openMenu();
      // No flash of the legacy rule (which needs a project for this table).
      expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeEnabled();
    });

    it('stays usable with the legacy rules when the server returns no table list', async () => {
      renderButton(
        {
          projectId: 'p1',
          tables: [
            { table: DataExportTable.Looks, label: 'Looks' },
            { table: DataExportTable.LookDetails, label: 'Look' },
          ],
        },
        [{ request: { query: GET_DATA_EXPORT_TABLES }, result: { data: { dataExportTables: null } } }],
      );
      openMenu();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(screen.getByRole('menuitem', { name: 'Looks as CSV' })).toBeEnabled();
      // Without the list, the server enforces the scope (legacy rules only gate the project).
      expect(screen.getByRole('menuitem', { name: 'Look as CSV' })).toBeEnabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText("This server version doesn't support CSV/Excel export; update LacyLights.")).not.toBeInTheDocument();
    });
  });

  describe('with an older backend that has no data export', () => {
    const unsupportedText = "This server version doesn't support CSV/Excel export; update LacyLights.";
    const unknownField = (field: string) => ({
      errors: [new GraphQLError(`Cannot query field "${field}" on type "Query".`)],
    });

    it('replaces CSV / Excel with an explanation once the menu learns the server is too old', async () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
        { request: { query: GET_DATA_EXPORT_TABLES }, result: unknownField('dataExportTables') },
      ]);
      openMenu();
      expect(await screen.findByText(unsupportedText)).toBeInTheDocument();
      expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
        'More import/export options…',
      ]);
    });

    it('keeps CSV / Excel when the server lists the data tables', async () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
        {
          request: { query: GET_DATA_EXPORT_TABLES },
          result: { data: { dataExportTables: [] } },
        },
      ]);
      openMenu();
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeInTheDocument());
      expect(screen.queryByText(unsupportedText)).not.toBeInTheDocument();
    });

    it('shows the explanation when an export finds the field missing', async () => {
      const downloadBinary = installBridge();
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' }, [
        {
          request: {
            query: EXPORT_DATA_TABLE,
            variables: { projectId: 'p1', table: 'LOOKS', format: 'CSV', scopeId: null },
          },
          result: unknownField('exportDataTable'),
        },
      ]);
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
      expect(await screen.findByText(unsupportedText)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'CSV' })).not.toBeInTheDocument();
      expect(downloadBinary).not.toHaveBeenCalled();
    });
  });

  describe('touch screens and small viewports', () => {
    type Box = { left: number; top: number; width: number; height: number };
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    function setViewport(width: number, height: number) {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });
    }

    /** Fake layout: the Export button sits at `trigger`; the menu is `menu` px big. */
    function mockLayout(trigger: Box, menu: { width: number; height: number }) {
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const b = this.getAttribute('aria-label') === 'Export' ? trigger : { left: 0, top: 0, width: 0, height: 0 };
        return {
          x: b.left, y: b.top, left: b.left, top: b.top, width: b.width, height: b.height,
          right: b.left + b.width, bottom: b.top + b.height, toJSON: () => ({}),
        } as DOMRect;
      });
      jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'menu' ? menu.width : 0;
      });
      jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'menu' ? menu.height : 0;
      });
    }

    afterEach(() => {
      jest.restoreAllMocks();
      setViewport(originalWidth, originalHeight);
    });

    it('keeps the menu inside the viewport when the button is near the left edge', () => {
      // Phone list page: the Export button is the first button under the heading.
      setViewport(393, 659);
      mockLayout({ left: 16, top: 219, width: 113, height: 44 }, { width: 220, height: 171 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();

      const menu = screen.getByRole('menu');
      // Right-aligned it would start at 129 - 220 = -91; instead it starts 8px
      // from the viewport edge, i.e. 8px left of the button (at x = 16).
      expect(menu.style.left).toBe('-8px');
      expect(menu.style.right).toBe('auto');
      expect(menu).toHaveClass('top-full');
    });

    it('stays right-aligned with the button when there is room', () => {
      setViewport(393, 659);
      mockLayout({ left: 300, top: 8, width: 77, height: 44 }, { width: 220, height: 171 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();

      // Right edges line up: 300 + 77 - 220 = 157, which is 143px left of the button.
      expect(screen.getByRole('menu').style.left).toBe('-143px');
    });

    it('keeps the menu inside the right edge as well', () => {
      setViewport(320, 659);
      mockLayout({ left: 40, top: 8, width: 30, height: 44 }, { width: 300, height: 171 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();

      // Too wide to fit either way: pinned 8px from the left viewport edge.
      expect(screen.getByRole('menu').style.left).toBe('-32px');
    });

    it('opens upward when the button is near the bottom of the screen', () => {
      setViewport(393, 659);
      mockLayout({ left: 200, top: 600, width: 113, height: 44 }, { width: 220, height: 320 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();

      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('bottom-full');
      expect(menu).not.toHaveClass('top-full');
      expect(menu.style.maxHeight).toBe('');
    });

    it('caps the height and scrolls when the menu fits neither above nor below', () => {
      // Phone in landscape.
      setViewport(659, 393);
      mockLayout({ left: 281, top: 139, width: 113, height: 38 }, { width: 220, height: 280 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();

      const menu = screen.getByRole('menu');
      // More room below (393 - 177 - 4 - 8 = 204) than above (139 - 4 - 8 = 127).
      expect(menu).toHaveClass('top-full', 'overflow-y-auto');
      expect(menu.style.maxHeight).toBe('204px');
    });

    it('never sizes the menu past the viewport when there is very little room either way', () => {
      // Short viewport (split screen / on-screen keyboard): under 120px both ways.
      setViewport(659, 220);
      mockLayout({ left: 281, top: 90, width: 113, height: 38 }, { width: 220, height: 280 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();

      const menu = screen.getByRole('menu');
      // Below: 220 - 128 - 4 - 8 = 80; above: 90 - 4 - 8 = 78. The menu is
      // capped to the 80px that exist (it scrolls), not to a larger minimum.
      expect(menu).toHaveClass('top-full', 'overflow-y-auto');
      expect(menu.style.maxHeight).toBe('80px');
    });

    it('repositions when the screen is resized or rotated while open', () => {
      setViewport(393, 659);
      mockLayout({ left: 16, top: 219, width: 113, height: 44 }, { width: 220, height: 280 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();
      const menu = screen.getByRole('menu');
      expect(menu.style.left).toBe('-8px');
      expect(menu.style.maxHeight).toBe('');

      setViewport(659, 393);
      mockLayout({ left: 281, top: 139, width: 113, height: 38 }, { width: 220, height: 280 });
      fireEvent(window, new Event('resize'));
      expect(menu.style.left).toBe('-107px');
      expect(menu.style.maxHeight).toBe('204px');

      setViewport(393, 659);
      mockLayout({ left: 16, top: 219, width: 113, height: 44 }, { width: 220, height: 280 });
      fireEvent(window, new Event('orientationchange'));
      expect(menu.style.left).toBe('-8px');
      expect(menu.style.maxHeight).toBe('');
    });

    it('stops repositioning once closed', () => {
      setViewport(393, 659);
      mockLayout({ left: 16, top: 219, width: 113, height: 44 }, { width: 220, height: 171 });
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();
      fireEvent.click(screen.getByTestId('export-menu-backdrop'));
      const rectSpy = HTMLElement.prototype.getBoundingClientRect as jest.Mock;
      rectSpy.mockClear();

      fireEvent(window, new Event('resize'));

      expect(rectSpy).not.toHaveBeenCalled();
    });

    it('keeps 44px touch targets on touch screens at every width', () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      const trigger = screen.getByRole('button', { name: 'Export' });
      expect(trigger.className).toContain('min-h-[44px]');
      expect(trigger.className).toContain('[@media(any-pointer:coarse)]:min-h-[44px]');
      openMenu();
      for (const item of screen.getAllByRole('menuitem')) {
        expect(item.className).toContain('[@media(any-pointer:coarse)]:py-3');
      }
    });

    it('keeps the toolbar button a 44px touch target on touch screens', () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1', appearance: 'toolbar' });
      expect(screen.getByRole('button', { name: 'Export' }).className).toContain('[@media(any-pointer:coarse)]:min-h-[44px]');
    });

    it('stacks the backdrop and menu above the fixed mobile navigation (z-50)', () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      openMenu();
      expect(screen.getByTestId('export-menu-backdrop')).toHaveClass('z-[55]');
      expect(screen.getByRole('menu')).toHaveClass('z-[60]');
    });

    it('shows the focus ring only for keyboard focus, not after a tap', () => {
      renderButton({ table: DataExportTable.Looks, projectId: 'p1' });
      const cls = screen.getByRole('button', { name: 'Export' }).className.split(/\s+/);
      expect(cls).toEqual(expect.arrayContaining(['focus-visible:ring-2', 'focus-visible:ring-blue-500']));
      expect(cls).not.toContain('focus:ring-2');
    });
  });
});
