import { ApolloClient, ApolloError, InMemoryCache } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { IMPORT_GDTF_FIXTURES } from '@/graphql/fixtures';
import { FixtureSource } from '@/generated/graphql';
import {
  GDTF_IMPORT_FEATURE,
  GDTF_IMPORT_UNSUPPORTED_MESSAGE,
  isFeatureUnsupported,
  isGdtfImportUnsupportedError,
  noteGdtfImportError,
} from '../backendCompat';
import { escapeCsvCell, toCsv } from '../csv';
import {
  GdtfExistingPolicy,
  GdtfImportStatus,
  GdtfImportUnsupportedError,
  buildGdtfResultsCsv,
  evictFixtureDefinitionQueries,
  failedGdtfRow,
  gdtfResultsCsvFilename,
  rowsFromCollectErrors,
  runGdtfImport,
  summarizeGdtfRows,
  type GdtfImportRow,
} from '../gdtfImport';

function descriptions(n: number) {
  return Array.from({ length: n }, (_, i) => ({ fileName: `F${i}.gdtf`, descriptionXml: `<GDTF n="${i}"/>` }));
}

function serverResult(files: Array<{ fileName: string }>, status = GdtfImportStatus.Created) {
  return {
    data: {
      importGdtfFixtures: {
        results: files.map((f, i) => ({
          fileName: f.fileName,
          status,
          definition: { id: `d-${f.fileName}`, manufacturer: 'Acme', model: `M${i}`, source: FixtureSource.Gdtf, sourceVersion: '1.2' },
          manufacturer: null,
          model: null,
          modeCount: 2,
          warnings: [],
          error: null,
        })),
        createdCount: status === GdtfImportStatus.Created ? files.length : 0,
        updatedCount: 0,
        unchangedCount: status === GdtfImportStatus.Unchanged ? files.length : 0,
        skippedCount: 0,
        failedCount: 0,
      },
    },
  };
}

function fakeClient(mutate: jest.Mock) {
  const client = new ApolloClient({ cache: new InMemoryCache() });
  client.mutate = mutate;
  return client;
}

const unknownMutationError = () =>
  new ApolloError({
    graphQLErrors: [new GraphQLError('Cannot query field "importGdtfFixtures" on type "Mutation".')],
  });

describe('runGdtfImport', () => {
  it('sends sequential batches of 25 with the policy and reports progress', async () => {
    const mutate = jest.fn(({ variables }) => Promise.resolve(serverResult(variables.files)));
    const client = fakeClient(mutate);
    const evict = jest.spyOn(client.cache, 'evict');
    const onProgress = jest.fn();

    const result = await runGdtfImport(client, descriptions(30), { onExisting: GdtfExistingPolicy.Skip, onProgress });

    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate.mock.calls[0][0].mutation).toBe(IMPORT_GDTF_FIXTURES);
    expect(mutate.mock.calls[0][0].variables.files).toHaveLength(25);
    expect(mutate.mock.calls[0][0].variables.options).toEqual({ onExisting: 'SKIP' });
    expect(mutate.mock.calls[1][0].variables.files).toEqual(descriptions(30).slice(25));
    expect(onProgress.mock.calls).toEqual([
      [0, 30],
      [25, 30],
      [30, 30],
    ]);
    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(30);
    expect(result.rows[0]).toEqual({
      fileName: 'F0.gdtf',
      status: GdtfImportStatus.Created,
      manufacturer: 'Acme',
      model: 'M0',
      modeCount: 2,
      warnings: [],
      error: null,
      definition: { id: 'd-F0.gdtf', manufacturer: 'Acme', model: 'M0', source: FixtureSource.Gdtf, sourceVersion: '1.2' },
    });
    expect(evict).toHaveBeenCalledWith({ id: 'ROOT_QUERY', fieldName: 'fixtureDefinitions' });
  });

  it('does not evict the cache when nothing changed', async () => {
    const mutate = jest.fn(({ variables }) => Promise.resolve(serverResult(variables.files, GdtfImportStatus.Unchanged)));
    const client = fakeClient(mutate);
    const evict = jest.spyOn(client.cache, 'evict');
    await runGdtfImport(client, descriptions(2), { onExisting: GdtfExistingPolicy.Update });
    expect(evict).not.toHaveBeenCalled();
  });

  it('stops at a failed request and marks the remaining files as not imported', async () => {
    const mutate = jest
      .fn()
      .mockImplementationOnce(({ variables }) => Promise.resolve(serverResult(variables.files)))
      .mockRejectedValueOnce(new Error('Network down'));
    const client = fakeClient(mutate);
    const evict = jest.spyOn(client.cache, 'evict');
    const result = await runGdtfImport(client, descriptions(5), { onExisting: GdtfExistingPolicy.Update, batchSize: 2 });
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(result.error).toBe('Network down');
    expect(result.rows.map((r) => r.status)).toEqual([
      GdtfImportStatus.Created,
      GdtfImportStatus.Created,
      GdtfImportStatus.Failed,
      GdtfImportStatus.Failed,
      GdtfImportStatus.Failed,
    ]);
    expect(result.rows[4].error).toBe('Not imported: Network down');
    // The first batch created definitions, so the lists are refreshed anyway.
    expect(evict).toHaveBeenCalled();
  });

  it('treats an empty response as a failed request', async () => {
    const client = fakeClient(jest.fn().mockResolvedValue({ data: null }));
    const result = await runGdtfImport(client, descriptions(1), { onExisting: GdtfExistingPolicy.Update });
    expect(result.error).toBe('No import result was returned by the server.');
  });

  it('throws GdtfImportUnsupportedError on backends without the mutation', async () => {
    const client = fakeClient(jest.fn().mockRejectedValue(unknownMutationError()));
    await expect(
      runGdtfImport(client, descriptions(1), { onExisting: GdtfExistingPolicy.Update }),
    ).rejects.toBeInstanceOf(GdtfImportUnsupportedError);
    expect(isFeatureUnsupported(client, GDTF_IMPORT_FEATURE)).toBe(true);
  });
});

describe('GDTF backend compatibility', () => {
  it('recognises unknown mutation and unknown input type errors', () => {
    expect(isGdtfImportUnsupportedError(unknownMutationError())).toBe(true);
    expect(
      isGdtfImportUnsupportedError(
        new ApolloError({ graphQLErrors: [new GraphQLError('Unknown type "GdtfFileInput".')] }),
      ),
    ).toBe(true);
    expect(isGdtfImportUnsupportedError(new Error('Unknown type "GdtfImportOptions".'))).toBe(true);
    expect(isGdtfImportUnsupportedError(new Error('boom'))).toBe(false);
    expect(GDTF_IMPORT_UNSUPPORTED_MESSAGE).toMatch(/update LacyLights/);
  });

  it('remembers the missing feature only for unsupported errors', () => {
    const client = new ApolloClient({ cache: new InMemoryCache() });
    expect(noteGdtfImportError(client, new Error('boom'))).toBe(false);
    expect(isFeatureUnsupported(client, GDTF_IMPORT_FEATURE)).toBe(false);
    expect(noteGdtfImportError(client, unknownMutationError())).toBe(true);
    expect(isFeatureUnsupported(client, GDTF_IMPORT_FEATURE)).toBe(true);
  });
});

describe('rows, summary and CSV', () => {
  const rows: GdtfImportRow[] = [
    {
      fileName: 'pack.zip/=Spot.gdtf',
      status: GdtfImportStatus.Updated,
      manufacturer: 'Acme, Inc.',
      model: 'Spot "XL"',
      modeCount: 3,
      warnings: ['Wheel slot 3 has no color', 'Virtual channel dropped'],
      error: null,
      definition: { id: 'def-1', manufacturer: 'Acme, Inc.', model: 'Spot "XL"' },
    },
    ...rowsFromCollectErrors([{ fileName: 'Bad.gdtf', message: 'No description.xml found' }]),
    { ...failedGdtfRow('x', 'y'), status: GdtfImportStatus.Skipped },
    { ...failedGdtfRow('u', 'v'), status: GdtfImportStatus.Unchanged },
    { ...failedGdtfRow('c', 'd'), status: GdtfImportStatus.Created },
  ];

  it('counts rows by status', () => {
    expect(summarizeGdtfRows(rows)).toEqual({ created: 1, updated: 1, unchanged: 1, skipped: 1, failed: 1, total: 5 });
  });

  it('builds an escaped CSV', () => {
    const csv = buildGdtfResultsCsv(rows.slice(0, 2));
    expect(csv).toBe(
      'File,Status,Manufacturer,Model,Modes,Definition ID,Warnings,Error\r\n' +
        'pack.zip/=Spot.gdtf,Updated,"Acme, Inc.","Spot ""XL""",3,def-1,"Wheel slot 3 has no color\nVirtual channel dropped",\r\n' +
        'Bad.gdtf,Failed,,,,,,No description.xml found\r\n',
    );
  });

  it('escapes CSV cells', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
    expect(escapeCsvCell(4)).toBe('4');
    expect(escapeCsvCell(true)).toBe('true');
    expect(escapeCsvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(escapeCsvCell('-1,2')).toBe('"\'-1,2"');
    expect(toCsv(['a'], [['b']])).toBe('a\r\nb\r\n');
  });

  it('names the CSV by date', () => {
    expect(gdtfResultsCsvFilename(new Date(2026, 0, 5))).toBe('gdtf-import-results-2026-01-05.csv');
    expect(gdtfResultsCsvFilename()).toMatch(/^gdtf-import-results-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('evicts fixture definition lists from the cache', () => {
    const client = new ApolloClient({ cache: new InMemoryCache() });
    const evict = jest.spyOn(client.cache, 'evict');
    const gc = jest.spyOn(client.cache, 'gc');
    evictFixtureDefinitionQueries(client);
    expect(evict).toHaveBeenCalledWith({ id: 'ROOT_QUERY', fieldName: 'fixtureDefinitions' });
    expect(gc).toHaveBeenCalled();
  });
});
