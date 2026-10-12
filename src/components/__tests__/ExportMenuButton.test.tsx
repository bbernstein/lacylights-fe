import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ExportMenuButton, { type ExportMenuButtonProps } from '../ExportMenuButton';
import { EXPORT_DATA_TABLE } from '@/graphql/dataExport';
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

function renderButton(props: ExportMenuButtonProps, mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
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

  it('supports the toolbar appearance and compact label', () => {
    renderButton({ table: DataExportTable.Looks, projectId: 'p1', appearance: 'toolbar', compact: true, className: 'extra' });
    const button = screen.getByRole('button', { name: 'Export' });
    expect(button.className).toContain('bg-gray-700');
    expect(screen.getByText('Export')).toHaveClass('hidden', 'sm:inline');
    expect(button.parentElement).toHaveClass('extra');
  });
});
