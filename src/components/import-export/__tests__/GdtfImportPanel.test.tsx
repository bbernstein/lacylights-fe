import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { strToU8, zipSync } from 'fflate';
import GdtfImportPanel from '../GdtfImportPanel';
import { IMPORT_GDTF_FIXTURES } from '@/graphql/fixtures';
import { FixtureSource, GdtfImportStatus } from '@/generated/graphql';
import { downloadFile } from '@/lib/importExport/download';

jest.mock('@/lib/importExport/download', () => ({
  ...jest.requireActual('@/lib/importExport/download'),
  downloadFile: jest.fn(),
}));

/** Synthetic description.xml text; not a real GDTF fixture. */
const xml = (name: string) => `<GDTF DataVersion="1.2"><FixtureType Name="${name}"/></GDTF>`;

function gdtfFile(name: string, relativePath?: string): File {
  const bytes = zipSync({ 'description.xml': strToU8(xml(name)) });
  const f = new File([bytes], `${name}.gdtf`);
  if (relativePath) Object.defineProperty(f, 'webkitRelativePath', { value: relativePath });
  return f;
}

function fileResult(
  fileName: string,
  overrides: Partial<{
    status: GdtfImportStatus;
    manufacturer: string | null;
    model: string | null;
    modeCount: number | null;
    warnings: string[];
    error: string | null;
    definition: unknown;
  }> = {},
) {
  const model = fileName.replace(/\.gdtf$/, '');
  return {
    fileName,
    status: GdtfImportStatus.Created,
    definition: { id: `def-${model}`, manufacturer: 'Acme', model, source: FixtureSource.Gdtf, sourceVersion: '1.2' },
    manufacturer: 'Acme',
    model,
    modeCount: 2,
    warnings: [],
    error: null,
    ...overrides,
  };
}

function importMock(
  files: Array<{ fileName: string; descriptionXml: string }>,
  results: ReturnType<typeof fileResult>[],
  onExisting = 'UPDATE',
  delay = 0,
): MockedResponse {
  const count = (s: GdtfImportStatus) => results.filter((r) => r.status === s).length;
  return {
    request: { query: IMPORT_GDTF_FIXTURES, variables: { files, options: { onExisting } } },
    delay,
    result: {
      data: {
        importGdtfFixtures: {
          results,
          createdCount: count(GdtfImportStatus.Created),
          updatedCount: count(GdtfImportStatus.Updated),
          unchangedCount: count(GdtfImportStatus.Unchanged),
          skippedCount: count(GdtfImportStatus.Skipped),
          failedCount: count(GdtfImportStatus.Failed),
        },
      },
    },
  };
}

function renderPanel(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <GdtfImportPanel />
    </MockedProvider>,
  );
}

function chooseFiles(files: File[], label = 'GDTF files') {
  fireEvent.change(screen.getByLabelText(label), { target: { files } });
}

describe('GdtfImportPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('offers file and folder pickers and a drop zone', () => {
    renderPanel([]);
    expect(screen.getByRole('button', { name: 'Choose files' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Choose folder' })).toBeEnabled();
    const filesInput = screen.getByLabelText('GDTF files');
    expect(filesInput).toHaveAttribute('accept', '.gdtf,.zip');
    expect(filesInput).toHaveAttribute('multiple');
    expect(screen.getByLabelText('GDTF folder')).toHaveAttribute('webkitdirectory');
    expect(screen.getByTestId('gdtf-drop-zone')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Update/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Skip/ })).not.toBeChecked();
  });

  it('opens the pickers from the buttons', () => {
    renderPanel([]);
    const filesClick = jest.spyOn(screen.getByLabelText('GDTF files') as HTMLInputElement, 'click');
    const folderClick = jest.spyOn(screen.getByLabelText('GDTF folder') as HTMLInputElement, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Choose files' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose folder' }));
    expect(filesClick).toHaveBeenCalled();
    expect(folderClick).toHaveBeenCalled();
  });

  it('imports chosen files and shows the results', async () => {
    const files = [
      { fileName: 'Spot.gdtf', descriptionXml: xml('Spot') },
      { fileName: 'Wash.gdtf', descriptionXml: xml('Wash') },
    ];
    renderPanel([
      importMock(
        files,
        [
          fileResult('Spot.gdtf', { warnings: ['Wheel slot 3 has no color'] }),
          fileResult('Wash.gdtf', {
            status: GdtfImportStatus.Failed,
            definition: null,
            manufacturer: null,
            model: null,
            modeCount: null,
            error: 'Unsupported GDTF version 1.0',
          }),
        ],
        'UPDATE',
        20,
      ),
    ]);

    chooseFiles([gdtfFile('Spot'), gdtfFile('Wash'), new File(['hi'], 'notes.txt')]);
    expect(await screen.findByTestId('gdtf-found')).toHaveTextContent(
      'Found 2 fixture types to import. 1 other file ignored (not .gdtf or .zip).',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Import 2 fixture types' }));
    expect(await screen.findByTestId('gdtf-import-progress')).toHaveTextContent('Importing… 0 of 2 fixture types');
    expect(screen.getByRole('progressbar', { name: 'Import progress' })).toHaveAttribute('aria-valuemax', '2');
    expect(screen.getByRole('button', { name: 'Choose files' })).toBeDisabled();

    const results = await screen.findByTestId('gdtf-results');
    expect(within(results).getByTestId('gdtf-summary')).toHaveTextContent(
      'Created: 1Updated: 0Unchanged: 0Skipped: 0Failed: 1',
    );
    const table = within(results).getByRole('table', { name: 'GDTF import results' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('Created');
    expect(rows[1]).toHaveTextContent('Spot.gdtf');
    expect(rows[1]).toHaveTextContent('Acme');
    expect(rows[1]).toHaveTextContent('GDTF');
    expect(rows[1]).toHaveTextContent('Wheel slot 3 has no color');
    expect(rows[2]).toHaveTextContent('Failed');
    expect(rows[2]).toHaveTextContent('Unsupported GDTF version 1.0');

    fireEvent.click(screen.getByRole('button', { name: 'Download results (CSV)' }));
    expect(downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('Spot.gdtf,Created,Acme,Spot,2,def-Spot,Wheel slot 3 has no color,'),
      expect.stringMatching(/^gdtf-import-results-\d{4}-\d{2}-\d{2}\.csv$/),
      'text/csv',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Import more files' }));
    expect(screen.queryByTestId('gdtf-results')).not.toBeInTheDocument();
  });

  it('sends the Skip option and adds unreadable files to the results', async () => {
    const files = [{ fileName: 'Fixtures/One.gdtf', descriptionXml: xml('One') }];
    renderPanel([
      importMock(files, [fileResult('Fixtures/One.gdtf', { status: GdtfImportStatus.Skipped })], 'SKIP'),
    ]);
    fireEvent.click(screen.getByRole('radio', { name: /Skip/ }));
    chooseFiles(
      [gdtfFile('One', 'Fixtures/One.gdtf'), new File(['not a zip'], 'Broken.gdtf')],
      'GDTF folder',
    );
    expect(await screen.findByTestId('gdtf-found')).toHaveTextContent(
      'Found 1 fixture type to import. 1 file could not be read.',
    );
    expect(screen.getByTestId('gdtf-read-errors')).toHaveTextContent('Broken.gdtf');

    fireEvent.click(screen.getByRole('button', { name: 'Import 1 fixture type' }));
    const results = await screen.findByTestId('gdtf-results');
    expect(within(results).getByTestId('gdtf-summary')).toHaveTextContent('Skipped: 1Failed: 1');
    const rows = within(results).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Fixtures/One.gdtf');
    expect(rows[2]).toHaveTextContent('Broken.gdtf');
    expect(rows[2]).toHaveTextContent('Not a zip archive');
  });

  it('sends batches of 25 one after another', async () => {
    const chosen = Array.from({ length: 26 }, (_, i) => gdtfFile(`F${i}`));
    const all = chosen.map((f, i) => ({ fileName: f.name, descriptionXml: xml(`F${i}`) }));
    renderPanel([
      importMock(all.slice(0, 25), all.slice(0, 25).map((f) => fileResult(f.fileName))),
      importMock(all.slice(25), all.slice(25).map((f) => fileResult(f.fileName, { status: GdtfImportStatus.Updated }))),
    ]);
    chooseFiles(chosen);
    fireEvent.click(await screen.findByRole('button', { name: 'Import 26 fixture types' }));
    const results = await screen.findByTestId('gdtf-results');
    expect(within(results).getByTestId('gdtf-summary')).toHaveTextContent('Created: 25Updated: 1');
    expect(within(results).getAllByRole('row')).toHaveLength(27);
  });

  it('reads dropped files', async () => {
    renderPanel([]);
    const zone = screen.getByTestId('gdtf-drop-zone');
    fireEvent.dragOver(zone, { dataTransfer: { files: [], dropEffect: 'none' } });
    expect(zone.className).toContain('border-blue-500');
    fireEvent.dragLeave(zone, { relatedTarget: null });
    expect(zone.className).not.toContain('border-blue-500');
    fireEvent.drop(zone, { dataTransfer: { files: [gdtfFile('Dropped')] } });
    expect(await screen.findByTestId('gdtf-found')).toHaveTextContent('Found 1 fixture type to import.');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByTestId('gdtf-found')).not.toBeInTheDocument();
  });

  describe('dropped folders', () => {
    const fileEntry = (path: string, file: File) => ({
      isFile: true,
      isDirectory: false,
      name: path.split('/').pop(),
      fullPath: `/${path}`,
      file: (resolve: (f: File) => void) => resolve(file),
    });
    const dropItems = (entry: unknown) => ({
      items: [{ kind: 'file', webkitGetAsEntry: () => entry }],
      files: [],
    });

    it('stays busy while a dropped folder is enumerated and ignores other input', async () => {
      let release: (entries: unknown[]) => void = () => {};
      const chunks: unknown[][] = [[fileEntry('Drop/Dropped.gdtf', gdtfFile('Dropped'))], []];
      const folder = {
        isFile: false,
        isDirectory: true,
        name: 'Drop',
        fullPath: '/Drop',
        createReader: () => ({
          // The first chunk is held back until the test releases it.
          readEntries: (resolve: (e: unknown[]) => void) => {
            const next = chunks.shift() ?? [];
            if (next.length > 0) release = () => resolve(next);
            else resolve(next);
          },
        }),
      };
      renderPanel([]);
      fireEvent.drop(screen.getByTestId('gdtf-drop-zone'), { dataTransfer: dropItems(folder) });

      expect(await screen.findByText('Looking for files…')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Choose files' })).toBeDisabled();
      // Another selection while enumerating is ignored.
      chooseFiles([gdtfFile('Other')]);
      fireEvent.drop(screen.getByTestId('gdtf-drop-zone'), { dataTransfer: { files: [gdtfFile('Third')] } });

      await act(async () => release([]));
      expect(await screen.findByTestId('gdtf-found')).toHaveTextContent('Found 1 fixture type to import.');
      expect(screen.queryByText(/Other/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Choose files' })).toBeEnabled();
    });

    it('reports unreadable dropped entries and imports the rest', async () => {
      const files = [{ fileName: 'Drop/Good.gdtf', descriptionXml: xml('Good') }];
      renderPanel([importMock(files, [fileResult('Drop/Good.gdtf')])]);
      const folder = {
        isFile: false,
        isDirectory: true,
        name: 'Drop',
        fullPath: '/Drop',
        createReader: () => {
          const chunks: unknown[][] = [
            [
              {
                isFile: true,
                isDirectory: false,
                name: 'Gone.gdtf',
                fullPath: '/Drop/Gone.gdtf',
                file: (_ok: unknown, fail: (e: Error) => void) => fail(new Error('NotFoundError')),
              },
              fileEntry('Drop/Good.gdtf', gdtfFile('Good')),
            ],
            [],
          ];
          return { readEntries: (resolve: (e: unknown[]) => void) => resolve(chunks.shift() ?? []) };
        },
      };
      fireEvent.drop(screen.getByTestId('gdtf-drop-zone'), { dataTransfer: dropItems(folder) });

      expect(await screen.findByTestId('gdtf-found')).toHaveTextContent(
        'Found 1 fixture type to import. 1 file could not be read.',
      );
      expect(screen.getByTestId('gdtf-read-errors')).toHaveTextContent('Drop/Gone.gdtf');
      fireEvent.click(screen.getByRole('button', { name: 'Import 1 fixture type' }));
      const results = await screen.findByTestId('gdtf-results');
      expect(within(results).getByTestId('gdtf-summary')).toHaveTextContent('Created: 1Updated: 0Unchanged: 0Skipped: 0Failed: 1');
    });
  });

  it('says when nothing importable was found', async () => {
    renderPanel([]);
    chooseFiles([new File(['x'], 'readme.txt')]);
    expect(await screen.findByTestId('gdtf-found')).toHaveTextContent(
      'No GDTF fixture types were found in the selected files.',
    );
    expect(screen.queryByRole('button', { name: /^Import \d/ })).not.toBeInTheDocument();
  });

  it('shows an "update LacyLights" message on backends without GDTF import', async () => {
    const files = [{ fileName: 'Spot.gdtf', descriptionXml: xml('Spot') }];
    renderPanel([
      {
        request: { query: IMPORT_GDTF_FIXTURES, variables: { files, options: { onExisting: 'UPDATE' } } },
        result: { errors: [new GraphQLError('Cannot query field "importGdtfFixtures" on type "Mutation".')] },
      },
    ]);
    chooseFiles([gdtfFile('Spot')]);
    fireEvent.click(await screen.findByRole('button', { name: 'Import 1 fixture type' }));
    expect(await screen.findByTestId('gdtf-import-unsupported')).toHaveTextContent('update LacyLights');
    expect(screen.queryByRole('button', { name: 'Choose files' })).not.toBeInTheDocument();
  });

  it('reports a failed request and lists the files that were not imported', async () => {
    const files = [{ fileName: 'Spot.gdtf', descriptionXml: xml('Spot') }];
    renderPanel([
      {
        request: { query: IMPORT_GDTF_FIXTURES, variables: { files, options: { onExisting: 'UPDATE' } } },
        error: new Error('Server unavailable'),
      },
    ]);
    chooseFiles([gdtfFile('Spot')]);
    fireEvent.click(await screen.findByRole('button', { name: 'Import 1 fixture type' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The import stopped: Server unavailable');
    await waitFor(() => expect(screen.getByTestId('gdtf-summary')).toHaveTextContent('Failed: 1'));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Not imported: Server unavailable');
  });
});
