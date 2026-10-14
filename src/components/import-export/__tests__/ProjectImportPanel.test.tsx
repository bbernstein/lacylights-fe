import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ProjectImportPanel from '../ProjectImportPanel';
import {
  IMPORT_PROJECT,
  IMPORT_PROJECT_FROM_QLC,
  IMPORT_PROJECT_FROM_EOS,
} from '@/graphql/projects';

function makeFile(content: string, name: string): File {
  const file = new File([content], name, { type: 'text/plain' });
  // jsdom's File doesn't implement .text(); polyfill on the instance.
  file.text = jest.fn().mockResolvedValue(content);
  return file;
}

function selectFile(file: File) {
  const input = screen.getByLabelText('Project file') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  return input;
}

function renderPanel(mocks: MockedResponse[], props: Partial<React.ComponentProps<typeof ProjectImportPanel>> = {}) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ProjectImportPanel {...props} />
    </MockedProvider>,
  );
}

const eosImportMock = (warnings: unknown[] = [], projectId = 'p42'): MockedResponse => ({
  request: {
    query: IMPORT_PROJECT_FROM_EOS,
    variables: { asciiContent: 'Ident 3:0\n', options: { newProjectName: 'show' } },
  },
  result: {
    data: {
      importProjectFromEos: {
        projectId,
        fixtureDefinitionsCount: 1,
        fixtureInstancesCount: 2,
        looksCount: 3,
        cueListsCount: 1,
        cuesCount: 4,
        groupsCount: 0,
        warnings,
        synthesizedDefinitionIds: [],
      },
    },
  },
});

describe('ProjectImportPanel', () => {
  it('describes each supported format', () => {
    renderPanel([]);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual([
      expect.stringMatching(/^LacyLights \(\.json\) – Native LacyLights project file/),
      expect.stringMatching(/^QLC\+ \(\.qxw\) – QLC\+ workspace file/),
      expect.stringMatching(/^ETC Eos ASCII \(\.asc\) – ETC Eos show file/),
    ]);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Auto-detect', 'LacyLights (.json)', 'QLC+ (.qxw)', 'ETC Eos ASCII (.asc)']);
  });

  it('accepts all formats in auto mode and narrows accept on override', () => {
    renderPanel([]);
    const input = screen.getByLabelText('Project file');
    expect(input).toHaveAttribute('accept', '.json,.qxw,.asc');
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'qlcplus' } });
    expect(input).toHaveAttribute('accept', '.qxw');
  });

  it('disables Import until a file is chosen', () => {
    renderPanel([]);
    expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled();
  });

  it('shows the auto-detected format for the selected file', () => {
    renderPanel([]);
    selectFile(makeFile('x', 'show.qxw'));
    expect(screen.getByTestId('import-detected-format')).toHaveTextContent(
      'Will import show.qxw as QLC+ (.qxw) (auto-detected).',
    );
  });

  it('reports undetectable files and lets an override fix it', async () => {
    renderPanel([]);
    selectFile(makeFile('x', 'show.txt'));
    expect(screen.getByTestId('import-detected-format')).toHaveTextContent(
      /Could not detect the format of show.txt/,
    );
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to determine file format/);

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'eos' } });
    expect(screen.getByTestId('import-detected-format')).toHaveTextContent(
      'Will import show.txt as ETC Eos ASCII (.asc).',
    );
  });

  it('warns when the override disagrees with the extension', () => {
    renderPanel([]);
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'lacylights' } });
    selectFile(makeFile('x', 'show.asc'));
    expect(
      screen.getByText('The file extension suggests ETC Eos ASCII (.asc).'),
    ).toBeInTheDocument();
  });

  it('imports an Eos .asc file, reports completion and shows warnings', async () => {
    const onImported = jest.fn();
    renderPanel(
      [
        eosImportMock([
          { code: 'EFFECT_SKIPPED', severity: 'INFO', message: 'Effect FX1 skipped', context: [] },
          { code: 'EFFECT_SKIPPED', severity: 'INFO', message: 'Effect FX2 skipped', context: [] },
        ]),
      ],
      { onImported },
    );
    selectFile(makeFile('Ident 3:0\n', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    await waitFor(() =>
      expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p42', format: 'eos' })),
    );
    expect(screen.getByTestId('import-result')).toHaveTextContent('Imported "show" from ETC Eos ASCII (.asc)');
    expect(screen.getByText('Looks: 3')).toBeInTheDocument();
    expect(screen.getByText(/Effects skipped \(2\)/)).toBeInTheDocument();

    // Dismiss removes the result panel.
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByTestId('import-result')).not.toBeInTheDocument();
  });

  it('does not auto-switch; the user switches via the button', async () => {
    const onSwitchToProject = jest.fn().mockResolvedValue(undefined);
    renderPanel([eosImportMock()], { onSwitchToProject, currentProjectId: 'other' });
    selectFile(makeFile('Ident 3:0\n', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    const switchButton = await screen.findByRole('button', { name: 'Switch to imported project' });
    expect(onSwitchToProject).not.toHaveBeenCalled();
    fireEvent.click(switchButton);
    await waitFor(() => expect(onSwitchToProject).toHaveBeenCalledWith('p42'));
  });

  it('hides the switch button once the imported project is current', async () => {
    renderPanel([eosImportMock()], { onSwitchToProject: jest.fn(), currentProjectId: 'p42' });
    selectFile(makeFile('Ident 3:0\n', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    expect(await screen.findByText('This is now the current project.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch to imported project' })).not.toBeInTheDocument();
  });

  it('imports a QLC+ file and lists plain-text warnings', async () => {
    renderPanel([
      {
        request: {
          query: IMPORT_PROJECT_FROM_QLC,
          variables: { xmlContent: '<Workspace/>', originalFileName: 'show.qxw' },
        },
        result: {
          data: {
            importProjectFromQLC: {
              project: {
                id: 'q1',
                name: 'QLC Show',
                description: null,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
              },
              originalFileName: 'show.qxw',
              fixtureCount: 2,
              lookCount: 1,
              cueListCount: 0,
              warnings: ['Unknown fixture skipped'],
            },
          },
        },
      },
    ]);
    selectFile(makeFile('<Workspace/>', 'show.qxw'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    expect(await screen.findByText('Unknown fixture skipped')).toBeInTheDocument();
    expect(screen.getByText('Warnings (1)')).toBeInTheDocument();
    expect(screen.getByTestId('import-result')).toHaveTextContent('Imported "QLC Show" from QLC+ (.qxw)');
  });

  it('imports a LacyLights JSON file', async () => {
    renderPanel([
      {
        request: {
          query: IMPORT_PROJECT,
          variables: {
            jsonContent: '{}',
            options: { mode: 'CREATE', fixtureConflictStrategy: 'SKIP', importBuiltInFixtures: true },
          },
        },
        result: {
          data: {
            importProject: {
              projectId: 'j1',
              warnings: [],
              stats: {
                fixtureDefinitionsCreated: 0,
                fixtureInstancesCreated: 5,
                looksCreated: 2,
                cueListsCreated: 1,
                cuesCreated: 7,
              },
            },
          },
        },
      },
    ]);
    selectFile(makeFile('{}', 'backup.json'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    expect(await screen.findByText('Cues: 7')).toBeInTheDocument();
    expect(screen.getByTestId('import-result')).toHaveTextContent('Imported project from LacyLights (.json)');
  });

  it('shows an error when the import fails', async () => {
    renderPanel([
      {
        request: {
          query: IMPORT_PROJECT_FROM_EOS,
          variables: { asciiContent: 'bad', options: { newProjectName: 'show' } },
        },
        error: new Error('parse error'),
      },
    ]);
    selectFile(makeFile('bad', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to import project. Please check the file and try again. Error: parse error',
    );
    expect(screen.queryByTestId('import-result')).not.toBeInTheDocument();
  });
  it('reports a refresh failure separately from a successful import', async () => {
    const onImported = jest.fn().mockRejectedValue(new Error('network down'));
    renderPanel([eosImportMock()], { onImported });
    selectFile(makeFile('Ident 3:0\n', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    const warning = await screen.findByTestId('import-refresh-warning');
    expect(warning).toHaveTextContent(
      'The project was imported, but the project list could not be refreshed. Error: network down',
    );
    expect(warning).toHaveAttribute('role', 'status');
    // Shown as a warning on the success result, not as an import error.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // The successful import result stays visible so the user doesn't retry
    // (which would create a duplicate project).
    expect(screen.getByTestId('import-result')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^import$/i })).toHaveTextContent('Import');
  });

  it('surfaces a failed switch to the imported project and re-enables the button', async () => {
    const onSwitchToProject = jest.fn().mockRejectedValue(new Error('refetch failed'));
    renderPanel([eosImportMock()], { onSwitchToProject, currentProjectId: 'other' });
    selectFile(makeFile('Ident 3:0\n', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    const switchButton = await screen.findByRole('button', { name: 'Switch to imported project' });
    fireEvent.click(switchButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to switch to the imported project. Error: refetch failed',
    );
    expect(onSwitchToProject).toHaveBeenCalledWith('p42');
    expect(screen.getByRole('button', { name: 'Switch to imported project' })).toBeEnabled();
    expect(screen.getByTestId('import-result')).toBeInTheDocument();
  });

  it('clears a previous switch error when switching again succeeds', async () => {
    const onSwitchToProject = jest
      .fn()
      .mockRejectedValueOnce(new Error('refetch failed'))
      .mockResolvedValueOnce(undefined);
    renderPanel([eosImportMock()], { onSwitchToProject, currentProjectId: 'other' });
    selectFile(makeFile('Ident 3:0\n', 'show.asc'));
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    fireEvent.click(await screen.findByRole('button', { name: 'Switch to imported project' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to imported project' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(onSwitchToProject).toHaveBeenCalledTimes(2);
  });
});
