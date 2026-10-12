import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import ImportExportPage, { parseImportExportParams, sectionDomId } from '../ImportExportPage';
import { IMPORT_PROJECT_FROM_EOS } from '@/graphql/projects';

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
/** A project in another group: visible in Manage Projects, not in the active group. */
const otherGroupProject = { id: 'p3', name: 'Other Group Show' };
const allProjects = [...projects, otherGroupProject];
let mockCurrentProject: { id: string; name: string } | null = projects[0];

jest.mock('@/contexts/ProjectContext', () => ({
  useProject: () => ({
    currentProject: mockCurrentProject,
    projects,
    allProjects,
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

  it('honours ?project= for a project outside the active group', () => {
    mockSearchParams = new URLSearchParams('section=export&project=p3');
    renderPage();
    expect(screen.getByLabelText('Project')).toHaveValue('p3');
    expect(screen.getByRole('option', { name: 'Other Group Show' })).toBeInTheDocument();
  });

  it('tolerates table and scopeId params', () => {
    mockSearchParams = new URLSearchParams('section=import&table=LOOKS&scopeId=x');
    renderPage();
    expect(scrollIntoView.mock.instances[0]).toBe(document.getElementById(sectionDomId('import')));
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
