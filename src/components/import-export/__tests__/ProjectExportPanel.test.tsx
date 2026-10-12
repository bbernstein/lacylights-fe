import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ProjectExportPanel from '../ProjectExportPanel';
import {
  PROJECT_EXPORT,
  PROJECT_EXPORT_EOS,
  PROJECT_EXPORT_QLC,
  GET_QLC_FIXTURE_MAPPING_SUGGESTIONS,
} from '@/graphql/projects';

const projects = [
  { id: 'p1', name: 'Show One' },
  { id: 'p2', name: 'Show Two' },
];

/** Use the Mac bridge to capture downloads (content + filename). */
function installBridge() {
  const download = jest.fn();
  window.lacylights = {
    download,
    send: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    getAppVersion: jest.fn(),
  };
  return download;
}

afterEach(() => {
  delete window.lacylights;
});

function renderPanel(
  mocks: MockedResponse[],
  props: Partial<React.ComponentProps<typeof ProjectExportPanel>> = {},
) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ProjectExportPanel projects={projects} {...props} />
    </MockedProvider>,
  );
}

const eosExportMock = (projectId: string, projectName: string, warnings: unknown[] = []): MockedResponse => ({
  request: { query: PROJECT_EXPORT_EOS, variables: { projectId } },
  result: {
    data: {
      projectExportEos: { projectId, projectName, asciiContent: 'Ident 3:0\n', warnings },
    },
  },
});

describe('ProjectExportPanel', () => {
  it('shows a message when there are no projects', () => {
    renderPanel([], { projects: [] });
    expect(screen.getByText('There are no projects to export.')).toBeInTheDocument();
  });

  it('defaults to the given project', () => {
    renderPanel([], { defaultProjectId: 'p2' });
    expect(screen.getByLabelText('Project')).toHaveValue('p2');
  });

  it('falls back to the first project when the default is unknown', () => {
    renderPanel([], { defaultProjectId: 'missing' });
    expect(screen.getByLabelText('Project')).toHaveValue('p1');
  });

  it('follows changes to the default project', () => {
    const { rerender } = renderPanel([], { defaultProjectId: 'p1' });
    rerender(
      <MockedProvider mocks={[]} addTypename={false}>
        <ProjectExportPanel projects={projects} defaultProjectId="p2" />
      </MockedProvider>,
    );
    expect(screen.getByLabelText('Project')).toHaveValue('p2');
  });

  it("keeps the user's choice when the default project changes later", () => {
    const { rerender } = renderPanel([], { defaultProjectId: undefined });
    expect(screen.getByLabelText('Project')).toHaveValue('p1');
    fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'p2' } });
    // e.g. the current project loads, or the user switches to an imported project
    rerender(
      <MockedProvider mocks={[]} addTypename={false}>
        <ProjectExportPanel projects={projects} defaultProjectId="p1" />
      </MockedProvider>,
    );
    expect(screen.getByLabelText('Project')).toHaveValue('p2');
  });

  it('offers the three formats with descriptions and Export buttons', () => {
    renderPanel([]);
    expect(screen.getByRole('button', { name: 'Export as LacyLights (.json)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export as QLC+ (.qxw)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export as ETC Eos ASCII (.asc)' })).toBeInTheDocument();
    expect(screen.getByText(/Native LacyLights project file/)).toBeInTheDocument();
  });

  it('exports an Eos .asc file and renders warnings inline', async () => {
    const download = installBridge();
    renderPanel([
      eosExportMock('p1', 'Show One', [
        { code: 'EFFECT_SKIPPED', severity: 'INFO', message: 'Effect FX42 skipped', context: [] },
      ]),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Export as ETC Eos ASCII (.asc)' }));

    await waitFor(() => expect(screen.getByText(/Effects skipped \(1\)/)).toBeInTheDocument());
    expect(download).toHaveBeenCalledWith('Ident 3:0\n', 'Show One.asc');
    expect(screen.getByText('Saved Show One.asc')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText(/Effects skipped/)).not.toBeInTheDocument();
  });

  it('downloads Eos exports as .asc through the browser path', async () => {
    let capturedFilename: string | null = null;
    const realCreate = document.createElement.bind(document);
    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        (el as HTMLAnchorElement).click = jest.fn();
        Object.defineProperty(el, 'download', {
          set(value: string) {
            capturedFilename = value;
          },
          get() {
            return capturedFilename ?? '';
          },
          configurable: true,
        });
      }
      return el;
    });
    const originalCreateURL = URL.createObjectURL;
    const originalRevokeURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();

    try {
      renderPanel([eosExportMock('p1', 'Show')]);
      fireEvent.click(screen.getByRole('button', { name: 'Export as ETC Eos ASCII (.asc)' }));
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      expect(capturedFilename).toBe('Show.asc');
    } finally {
      createSpy.mockRestore();
      URL.createObjectURL = originalCreateURL;
      URL.revokeObjectURL = originalRevokeURL;
    }
  });

  it('exports the selected project as LacyLights JSON', async () => {
    const download = installBridge();
    renderPanel([
      {
        request: {
          query: PROJECT_EXPORT,
          variables: {
            projectId: 'p2',
            options: { includeFixtures: true, includeLooks: true, includeCueLists: true },
          },
        },
        result: {
          data: {
            projectExport: {
              projectId: 'p2',
              projectName: 'Show Two',
              jsonContent: '{"v":1}',
              stats: {
                fixtureDefinitionsCount: 0,
                fixtureInstancesCount: 0,
                looksCount: 0,
                cueListsCount: 0,
                cuesCount: 0,
              },
            },
          },
        },
      },
    ]);
    fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export as LacyLights (.json)' }));
    await waitFor(() => expect(download).toHaveBeenCalledWith('{"v":1}', 'Show Two.json'));
  });

  it('exports QLC+ using the fixture mapping suggestions', async () => {
    const download = installBridge();
    renderPanel([
      {
        request: { query: GET_QLC_FIXTURE_MAPPING_SUGGESTIONS, variables: { projectId: 'p1' } },
        result: {
          data: {
            getQLCFixtureMappingSuggestions: {
              projectId: 'p1',
              lacyLightsFixtures: [],
              suggestions: [],
              defaultMappings: [
                { lacyLightsKey: 'A/B', qlcManufacturer: 'A', qlcModel: 'B', qlcMode: '8ch' },
              ],
            },
          },
        },
      },
      {
        request: {
          query: PROJECT_EXPORT_QLC,
          variables: {
            projectId: 'p1',
            fixtureMappings: [
              { lacyLightsKey: 'A/B', qlcManufacturer: 'A', qlcModel: 'B', qlcMode: '8ch' },
            ],
          },
        },
        result: {
          data: {
            projectExportQLC: {
              projectName: 'Show One',
              xmlContent: '<Workspace/>',
              fixtureCount: 1,
              lookCount: 0,
              cueListCount: 0,
            },
          },
        },
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Export as QLC+ (.qxw)' }));
    await waitFor(() => expect(download).toHaveBeenCalledWith('<Workspace/>', 'Show One.qxw'));
  });

  it('shows an error when the export fails', async () => {
    renderPanel([
      {
        request: { query: PROJECT_EXPORT_EOS, variables: { projectId: 'p1' } },
        error: new Error('server down'),
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Export as ETC Eos ASCII (.asc)' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to export project. server down');
  });

  it('clears the previous result when another project is selected', async () => {
    installBridge();
    renderPanel([eosExportMock('p1', 'Show One')]);
    fireEvent.click(screen.getByRole('button', { name: 'Export as ETC Eos ASCII (.asc)' }));
    expect(await screen.findByText('Saved Show One.asc')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'p2' } });
    expect(screen.queryByText('Saved Show One.asc')).not.toBeInTheDocument();
  });
});
