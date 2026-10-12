import type { ApolloClient } from '@apollo/client';
import {
  IMPORT_PROJECT,
  IMPORT_PROJECT_FROM_QLC,
  IMPORT_PROJECT_FROM_EOS,
  EXPORT_PROJECT,
  EXPORT_PROJECT_TO_QLC,
  EXPORT_PROJECT_TO_EOS,
  GET_QLC_FIXTURE_MAPPING_SUGGESTIONS,
} from '@/graphql/projects';
import {
  createFixtureMappings,
  exportAndDownloadProject,
  exportProjectAs,
  formatErrorMessage,
  importProjectContent,
} from '../projectOperations';

function makeClient() {
  const mutate = jest.fn();
  const query = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = { mutate, query } as unknown as ApolloClient<any>;
  return { client, mutate, query };
}

const eosWarning = {
  code: 'EFFECT_SKIPPED',
  severity: 'INFO',
  message: 'Effect FX1 skipped',
  context: [],
};

describe('importExport/projectOperations', () => {
  describe('formatErrorMessage', () => {
    it('uses Error.message', () => {
      expect(formatErrorMessage(new Error('boom'), 'Failed.')).toBe('Failed. boom');
    });
    it('stringifies non-Error values', () => {
      expect(formatErrorMessage('nope', 'Failed:')).toBe('Failed: nope');
    });
  });

  describe('createFixtureMappings', () => {
    it('uses default mappings when present and strips extra fields', () => {
      const mappings = createFixtureMappings(
        [
          {
            lacyLightsKey: 'k',
            qlcManufacturer: 'M',
            qlcModel: 'X',
            qlcMode: '8ch',
            __typename: 'FixtureMapping',
          } as never,
        ],
        [{ manufacturer: 'Other', model: 'Y' }],
      );
      expect(mappings).toEqual([
        { lacyLightsKey: 'k', qlcManufacturer: 'M', qlcModel: 'X', qlcMode: '8ch' },
      ]);
    });

    it('builds mappings from project fixtures when there are no defaults', () => {
      const mappings = createFixtureMappings([], [{ manufacturer: 'Chauvet', model: 'SlimPAR' }]);
      expect(mappings).toHaveLength(1);
      expect(mappings[0]).toMatchObject({
        qlcManufacturer: 'Chauvet',
        qlcModel: 'SlimPAR',
        qlcMode: 'Default',
      });
      expect(mappings[0].lacyLightsKey).toContain('Chauvet');
    });
  });

  describe('importProjectContent', () => {
    it('imports Eos ASCII with the project name from the filename', async () => {
      const { client, mutate } = makeClient();
      mutate.mockResolvedValue({
        data: {
          importProjectFromEos: {
            projectId: 'p1',
            fixtureDefinitionsCount: 1,
            fixtureInstancesCount: 2,
            looksCount: 3,
            cueListsCount: 4,
            cuesCount: 5,
            groupsCount: 6,
            warnings: [eosWarning],
            synthesizedDefinitionIds: [],
          },
        },
      });
      const result = await importProjectContent(client, 'Ident 3:0', 'My Show.ASC', 'eos');
      expect(mutate).toHaveBeenCalledWith({
        mutation: IMPORT_PROJECT_FROM_EOS,
        variables: { asciiContent: 'Ident 3:0', options: { newProjectName: 'My Show' } },
      });
      expect(result.projectId).toBe('p1');
      expect(result.projectName).toBe('My Show');
      expect(result.eosWarnings).toEqual([eosWarning]);
      expect(result.stats).toContainEqual({ label: 'Groups', count: 6 });
    });

    it('imports QLC+ with the original filename', async () => {
      const { client, mutate } = makeClient();
      mutate.mockResolvedValue({
        data: {
          importProjectFromQLC: {
            project: { id: 'q1', name: 'QLC Show' },
            originalFileName: 'show.qxw',
            fixtureCount: 2,
            lookCount: 1,
            cueListCount: 0,
            warnings: ['w1'],
          },
        },
      });
      const result = await importProjectContent(client, '<xml/>', 'show.qxw', 'qlcplus');
      expect(mutate).toHaveBeenCalledWith({
        mutation: IMPORT_PROJECT_FROM_QLC,
        variables: { xmlContent: '<xml/>', originalFileName: 'show.qxw' },
      });
      expect(result).toMatchObject({
        format: 'qlcplus',
        projectId: 'q1',
        projectName: 'QLC Show',
        warnings: ['w1'],
        eosWarnings: [],
      });
    });

    it('imports LacyLights JSON in CREATE mode', async () => {
      const { client, mutate } = makeClient();
      mutate.mockResolvedValue({
        data: {
          importProject: {
            projectId: 'j1',
            warnings: [],
            stats: {
              fixtureDefinitionsCreated: 1,
              fixtureInstancesCreated: 2,
              looksCreated: 3,
              cueListsCreated: 4,
              cuesCreated: 5,
            },
          },
        },
      });
      const result = await importProjectContent(client, '{}', 'show.json', 'lacylights');
      expect(mutate).toHaveBeenCalledWith({
        mutation: IMPORT_PROJECT,
        variables: {
          jsonContent: '{}',
          options: {
            mode: 'CREATE',
            fixtureConflictStrategy: 'SKIP',
            importBuiltInFixtures: true,
          },
        },
      });
      expect(result.projectId).toBe('j1');
      expect(result.stats).toContainEqual({ label: 'Cues', count: 5 });
    });

    it.each(['eos', 'qlcplus', 'lacylights'] as const)(
      'throws when the %s import returns no project',
      async (format) => {
        const { client, mutate } = makeClient();
        mutate.mockResolvedValue({ data: null });
        await expect(importProjectContent(client, 'x', 'x', format)).rejects.toThrow(
          /No project was returned/,
        );
      },
    );

    it('propagates GraphQL errors', async () => {
      const { client, mutate } = makeClient();
      mutate.mockRejectedValue(new Error('bad file'));
      await expect(importProjectContent(client, 'x', 'x.json', 'lacylights')).rejects.toThrow(
        'bad file',
      );
    });
  });

  describe('exportProjectAs', () => {
    it('exports Eos ASCII as .asc with warnings', async () => {
      const { client, mutate } = makeClient();
      mutate.mockResolvedValue({
        data: {
          exportProjectToEos: {
            projectId: 'p1',
            projectName: 'Show One',
            asciiContent: 'Ident 3:0\n',
            warnings: [eosWarning],
          },
        },
      });
      const result = await exportProjectAs(client, 'p1', 'eos');
      expect(mutate).toHaveBeenCalledWith({
        mutation: EXPORT_PROJECT_TO_EOS,
        variables: { projectId: 'p1' },
      });
      expect(result).toMatchObject({
        filename: 'Show One.asc',
        mimeType: 'text/plain',
        content: 'Ident 3:0\n',
        eosWarnings: [eosWarning],
      });
    });

    it('exports QLC+ using fixture mapping suggestions', async () => {
      const { client, mutate, query } = makeClient();
      query.mockResolvedValue({
        data: {
          getQLCFixtureMappingSuggestions: {
            projectId: 'p1',
            lacyLightsFixtures: [{ manufacturer: 'A', model: 'B' }],
            suggestions: [],
            defaultMappings: [],
          },
        },
      });
      mutate.mockResolvedValue({
        data: {
          exportProjectToQLC: {
            projectName: 'Show',
            xmlContent: '<Workspace/>',
            fixtureCount: 1,
            lookCount: 0,
            cueListCount: 0,
          },
        },
      });
      const result = await exportProjectAs(client, 'p1', 'qlcplus');
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: GET_QLC_FIXTURE_MAPPING_SUGGESTIONS,
          variables: { projectId: 'p1' },
        }),
      );
      expect(mutate).toHaveBeenCalledWith({
        mutation: EXPORT_PROJECT_TO_QLC,
        variables: {
          projectId: 'p1',
          fixtureMappings: [
            expect.objectContaining({ qlcManufacturer: 'A', qlcModel: 'B', qlcMode: 'Default' }),
          ],
        },
      });
      expect(result).toMatchObject({
        filename: 'Show.qxw',
        mimeType: 'application/xml',
        content: '<Workspace/>',
      });
    });

    it('fails the QLC+ export when mapping suggestions are missing', async () => {
      const { client, mutate, query } = makeClient();
      query.mockResolvedValue({ data: null });
      await expect(exportProjectAs(client, 'p1', 'qlcplus')).rejects.toThrow(
        /fixture mappings/,
      );
      expect(mutate).not.toHaveBeenCalled();
    });

    it('exports LacyLights JSON with everything included', async () => {
      const { client, mutate } = makeClient();
      mutate.mockResolvedValue({
        data: {
          exportProject: {
            projectId: 'p1',
            projectName: 'Show/Two',
            jsonContent: '{"v":1}',
            stats: {},
          },
        },
      });
      const result = await exportProjectAs(client, 'p1', 'lacylights');
      expect(mutate).toHaveBeenCalledWith({
        mutation: EXPORT_PROJECT,
        variables: {
          projectId: 'p1',
          options: { includeFixtures: true, includeLooks: true, includeCueLists: true },
        },
      });
      expect(result).toMatchObject({
        filename: 'Show-Two.json',
        mimeType: 'application/json',
        content: '{"v":1}',
      });
    });

    it.each(['eos', 'lacylights'] as const)(
      'throws when the %s export returns no data',
      async (format) => {
        const { client, mutate } = makeClient();
        mutate.mockResolvedValue({ data: null });
        await expect(exportProjectAs(client, 'p1', format)).rejects.toThrow(/No export data/);
      },
    );

    it('throws when the QLC+ export returns no data', async () => {
      const { client, mutate, query } = makeClient();
      query.mockResolvedValue({
        data: {
          getQLCFixtureMappingSuggestions: {
            lacyLightsFixtures: [],
            defaultMappings: [],
          },
        },
      });
      mutate.mockResolvedValue({ data: null });
      await expect(exportProjectAs(client, 'p1', 'qlcplus')).rejects.toThrow(/No export data/);
    });
  });

  describe('exportAndDownloadProject', () => {
    it('exports and downloads in one step', async () => {
      const { client, mutate } = makeClient();
      mutate.mockResolvedValue({
        data: {
          exportProject: {
            projectId: 'p1',
            projectName: 'Show',
            jsonContent: '{}',
            stats: {},
          },
        },
      });
      // Use the Mac bridge path so no real browser download is attempted.
      const nativeDownload = jest.fn();
      window.lacylights = {
        download: nativeDownload,
        send: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
        getAppVersion: jest.fn(),
      };
      try {
        const result = await exportAndDownloadProject(client, 'p1', 'lacylights');
        expect(result.filename).toBe('Show.json');
        expect(nativeDownload).toHaveBeenCalledWith('{}', 'Show.json');
      } finally {
        delete window.lacylights;
      }
    });
  });
});
