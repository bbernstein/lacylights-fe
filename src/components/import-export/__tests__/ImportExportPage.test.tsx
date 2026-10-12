import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ImportExportPage, { parseImportExportParams, sectionDomId } from '../ImportExportPage';
import { GET_PROJECT_NAME, IMPORT_PROJECT_FROM_EOS } from '@/graphql/projects';
import { GET_DATA_EXPORT_TABLES } from '@/graphql/dataExport';
import { GET_PROJECT_LOOKS } from '@/graphql/looks';

let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: jest.fn() }),
}));

const mockRefetchAndGet = jest.fn().mockResolvedValue([]);
const mockRefetchAndSelectById = jest.fn().mockResolvedValue(undefined);
const projects = [
  { id: 'p1', name: 'Show One' },
  { id: 'p2', name: 'Show Two' },
];
let mockCurrentProject: { id: string; name: string } | null = projects[0];

jest.mock('@/contexts/ProjectContext', () => ({
  useProject: () => ({
    currentProject: mockCurrentProject,
    projects,
    refetchAndGet: mockRefetchAndGet,
    refetchAndSelectById: mockRefetchAndSelectById,
  }),
}));

const scrollIntoView = jest.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = new URLSearchParams();
  mockCurrentProject = projects[0];
});

function renderPage(mocks: MockedResponse[] = []) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ImportExportPage />
    </MockedProvider>,
  );
}

describe('parseImportExportParams', () => {
  it('parses known params', () => {
    expect(
      parseImportExportParams(
        new URLSearchParams('section=export&project=p2&table=LOOKS&scopeId=l1'),
      ),
    ).toEqual({ section: 'export', projectId: 'p2', table: 'LOOKS', scopeId: 'l1' });
  });

  it('ignores unknown sections and empty values', () => {
    expect(parseImportExportParams(new URLSearchParams('section=bogus&project='))).toEqual({
      section: null,
      projectId: null,
      table: null,
      scopeId: null,
    });
  });

  it('tolerates missing params', () => {
    expect(parseImportExportParams(null)).toEqual({
      section: null,
      projectId: null,
      table: null,
      scopeId: null,
    });
  });
});

describe('ImportExportPage', () => {
  it('renders the import and export sections', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Import / Export' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Import project' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Export project' })).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('defaults the export project to the current project', () => {
    renderPage();
    expect(screen.getByLabelText('Project')).toHaveValue('p1');
  });

  it('handles a missing current project', () => {
    mockCurrentProject = null;
    renderPage();
    expect(screen.getByLabelText('Project')).toHaveValue('p1');
  });

  it('scrolls to and preselects the project for ?section=export&project=', () => {
    mockSearchParams = new URLSearchParams('section=export&project=p2');
    renderPage();
    const section = document.getElementById(sectionDomId('export'))!;
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(section);
    expect(document.activeElement).toBe(section);
    expect(section.className).toContain('ring-2');
    expect(screen.getByLabelText('Project')).toHaveValue('p2');
  });

  it('ignores a ?project= the user cannot see', () => {
    mockSearchParams = new URLSearchParams('section=export&project=nope');
    renderPage();
    expect(screen.getByLabelText('Project')).toHaveValue('p1');
  });

  it('offers a deep-linked accessible project from another group', async () => {
    mockSearchParams = new URLSearchParams('section=export&project=p9');
    renderPage([
      {
        request: { query: GET_PROJECT_NAME, variables: { id: 'p9' } },
        result: { data: { project: { id: 'p9', name: 'Other Group Show' } } },
      },
    ]);
    // The panel remounts once the project resolves, so query it again.
    await waitFor(() => expect(screen.getByLabelText('Project')).toHaveValue('p9'));
    expect(
      within(screen.getByLabelText('Project')).getByRole('option', { name: 'Other Group Show' }),
    ).toBeInTheDocument();
  });

  it('disables the export panels while a deep-linked project is looked up', async () => {
    mockSearchParams = new URLSearchParams('section=data&table=LOOKS&project=p9');
    renderPage([
      {
        request: { query: GET_PROJECT_NAME, variables: { id: 'p9' } },
        result: { data: { project: { id: 'p9', name: 'Other Group Show' } } },
        delay: 20,
      },
    ]);
    const exportRegion = screen.getByRole('region', { name: 'Export project' });
    expect(within(exportRegion).getByLabelText('Project')).toBeDisabled();
    await waitFor(() => expect(within(exportRegion).getByLabelText('Project')).toBeEnabled());
    expect(within(exportRegion).getByLabelText('Project')).toHaveValue('p9');
  });

  it('ignores a deep-linked project the server does not return', async () => {
    mockSearchParams = new URLSearchParams('section=export&project=p9');
    renderPage([
      {
        request: { query: GET_PROJECT_NAME, variables: { id: 'p9' } },
        result: { data: { project: null } },
      },
    ]);
    await waitFor(() => expect(screen.getByLabelText('Project')).toHaveValue('p1'));
    expect(screen.queryByRole('option', { name: /Other/ })).not.toBeInTheDocument();
  });

  it('keeps the requested section when table and scopeId are also given', () => {
    mockSearchParams = new URLSearchParams('section=import&table=LOOKS&scopeId=x');
    renderPage();
    expect(scrollIntoView.mock.instances[0]).toBe(document.getElementById(sectionDomId('import')));
  });

  describe('data section', () => {
    const tablesMock: MockedResponse = {
      request: { query: GET_DATA_EXPORT_TABLES },
      result: {
        data: {
          dataExportTables: [
            { table: 'FIXTURES', label: 'Fixtures', scope: 'project', columns: ['Name'] },
            { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', columns: ['Fixture'] },
          ],
        },
      },
    };
    const looksMock: MockedResponse = {
      request: { query: GET_PROJECT_LOOKS, variables: { projectId: 'p2' } },
      result: {
        data: {
          project: {
            id: 'p2',
            looks: [
              {
                id: 'l1',
                name: 'Warm',
                description: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                fixtureValues: [],
              },
              {
                id: 'l7',
                name: 'Cool',
                description: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
                fixtureValues: [],
              },
            ],
          },
        },
      },
    };

    it('renders the Export data (CSV / Excel) section', async () => {
      renderPage([tablesMock]);
      const region = screen.getByRole('region', { name: 'Export data (CSV / Excel)' });
      expect(await within(region).findByLabelText('Data')).toHaveValue('FIXTURES');
      expect(within(region).getByLabelText('Project')).toHaveValue('p1');
    });

    it('opens the data section with table, scope and project from the query string', async () => {
      mockSearchParams = new URLSearchParams('section=data&table=LOOK_DETAILS&scopeId=l7&project=p2');
      renderPage([tablesMock, looksMock]);
      const section = document.getElementById(sectionDomId('data'))!;
      expect(scrollIntoView.mock.instances[0]).toBe(section);
      expect(section.className).toContain('ring-2');

      const region = screen.getByRole('region', { name: 'Export data (CSV / Excel)' });
      expect(await within(region).findByLabelText('Look')).toHaveValue('l7');
      expect(within(region).getByLabelText('Data')).toHaveValue('LOOK_DETAILS');
      expect(within(region).getByLabelText('Project')).toHaveValue('p2');
    });
  });

  it('refreshes projects after import and switches only when asked', async () => {
    renderPage([
      {
        request: {
          query: IMPORT_PROJECT_FROM_EOS,
          variables: { asciiContent: 'Ident 3:0\n', options: { newProjectName: 'show' } },
        },
        result: {
          data: {
            importProjectFromEos: {
              projectId: 'p9',
              fixtureDefinitionsCount: 0,
              fixtureInstancesCount: 0,
              looksCount: 0,
              cueListsCount: 0,
              cuesCount: 0,
              groupsCount: 0,
              warnings: [],
              synthesizedDefinitionIds: [],
            },
          },
        },
      },
    ]);
    const file = new File(['Ident 3:0\n'], 'show.asc');
    file.text = jest.fn().mockResolvedValue('Ident 3:0\n');
    fireEvent.change(screen.getByLabelText('Project file'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }));

    await waitFor(() => expect(mockRefetchAndGet).toHaveBeenCalled());
    expect(mockRefetchAndSelectById).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole('button', { name: 'Switch to imported project' }));
    await waitFor(() => expect(mockRefetchAndSelectById).toHaveBeenCalledWith('p9'));
  });
});
