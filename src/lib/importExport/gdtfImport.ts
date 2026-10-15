/**
 * Sending GDTF descriptions to the backend (`importGdtfFixtures`) and
 * turning the answers into rows for the results table and CSV.
 * Reading the files is in gdtf.ts.
 */
import type { ApolloClient } from '@apollo/client';
import { IMPORT_GDTF_FIXTURES } from '@/graphql/fixtures';
import {
  GdtfExistingPolicy,
  GdtfImportStatus,
  type FixtureSource,
  type ImportGdtfFixturesMutation,
  type ImportGdtfFixturesMutationVariables,
} from '@/generated/graphql';
import { noteGdtfImportError } from './backendCompat';
import { toCsv } from './csv';
import { GDTF_BATCH_SIZE, batches, type GdtfCollectError, type GdtfDescription } from './gdtf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApolloClient = ApolloClient<any>;

export { GdtfExistingPolicy, GdtfImportStatus };

/** One imported (or failed) file, for the results table and CSV. */
export interface GdtfImportRow {
  fileName: string;
  status: GdtfImportStatus;
  manufacturer: string | null;
  model: string | null;
  modeCount: number | null;
  warnings: ReadonlyArray<string>;
  error: string | null;
  /** The created, updated or existing definition; null when FAILED. */
  definition: {
    id: string;
    manufacturer: string;
    model: string;
    source?: FixtureSource | null;
    sourceVersion?: string | null;
  } | null;
}

export interface GdtfImportSummary {
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  total: number;
}

/** Thrown when the backend has no `importGdtfFixtures` (an older server). */
export class GdtfImportUnsupportedError extends Error {
  constructor() {
    super('GDTF import is not supported by this server.');
    this.name = 'GdtfImportUnsupportedError';
  }
}

/** User-facing labels for import statuses. */
export const GDTF_STATUS_LABELS: Record<GdtfImportStatus, string> = {
  [GdtfImportStatus.Created]: 'Created',
  [GdtfImportStatus.Updated]: 'Updated',
  [GdtfImportStatus.Unchanged]: 'Unchanged',
  [GdtfImportStatus.Skipped]: 'Skipped',
  [GdtfImportStatus.Failed]: 'Failed',
};

/** A FAILED row for a file that never reached (or was rejected before) the server. */
export function failedGdtfRow(fileName: string, error: string): GdtfImportRow {
  return {
    fileName,
    status: GdtfImportStatus.Failed,
    manufacturer: null,
    model: null,
    modeCount: null,
    warnings: [],
    error,
    definition: null,
  };
}

/** FAILED rows for files that could not be read in the browser. */
export function rowsFromCollectErrors(errors: ReadonlyArray<GdtfCollectError>): GdtfImportRow[] {
  return errors.map((e) => failedGdtfRow(e.fileName, e.message));
}

type ServerFileResult = ImportGdtfFixturesMutation['importGdtfFixtures']['results'][number];

function rowFromResult(r: ServerFileResult): GdtfImportRow {
  return {
    fileName: r.fileName,
    status: r.status,
    manufacturer: r.manufacturer ?? r.definition?.manufacturer ?? null,
    model: r.model ?? r.definition?.model ?? null,
    modeCount: r.modeCount ?? null,
    warnings: r.warnings ?? [],
    error: r.error ?? null,
    definition: r.definition
      ? {
          id: r.definition.id,
          manufacturer: r.definition.manufacturer,
          model: r.definition.model,
          source: r.definition.source,
          sourceVersion: r.definition.sourceVersion ?? null,
        }
      : null,
  };
}

/** Count rows by status. */
export function summarizeGdtfRows(rows: ReadonlyArray<GdtfImportRow>): GdtfImportSummary {
  const summary: GdtfImportSummary = { created: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, total: rows.length };
  for (const row of rows) {
    switch (row.status) {
      case GdtfImportStatus.Created:
        summary.created += 1;
        break;
      case GdtfImportStatus.Updated:
        summary.updated += 1;
        break;
      case GdtfImportStatus.Unchanged:
        summary.unchanged += 1;
        break;
      case GdtfImportStatus.Skipped:
        summary.skipped += 1;
        break;
      default:
        summary.failed += 1;
    }
  }
  return summary;
}

/**
 * Drop cached fixture definition lists so model / manufacturer pickers load
 * the new definitions. Active queries refetch; others load fresh next time.
 */
export function evictFixtureDefinitionQueries(client: AnyApolloClient): void {
  client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'fixtureDefinitions' });
  client.cache.gc();
}

export interface RunGdtfImportOptions {
  onExisting: GdtfExistingPolicy;
  /** Files per request; defaults to {@link GDTF_BATCH_SIZE}. */
  batchSize?: number;
  /** Called with the number of files sent so far (after each batch, and with 0 first). */
  onProgress?: (processed: number, total: number) => void;
}

export interface RunGdtfImportResult {
  rows: GdtfImportRow[];
  /**
   * Set when a request failed. The import stops there: files of that batch
   * and later ones are FAILED rows ("Not imported: …").
   */
  error: string | null;
}

/**
 * Import descriptions in sequential batches. Per-file failures are reported
 * by the server and do not stop the import. Throws
 * {@link GdtfImportUnsupportedError} when the backend has no GDTF import
 * (remembered per client). The fixture definition lists in the Apollo cache
 * are evicted once anything was created or updated.
 */
export async function runGdtfImport(
  client: AnyApolloClient,
  descriptions: ReadonlyArray<GdtfDescription>,
  { onExisting, batchSize = GDTF_BATCH_SIZE, onProgress }: RunGdtfImportOptions,
): Promise<RunGdtfImportResult> {
  const groups = batches(descriptions, batchSize);
  const total = descriptions.length;
  const rows: GdtfImportRow[] = [];
  let processed = 0;
  let changed = false;
  onProgress?.(0, total);

  try {
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      let result: ImportGdtfFixturesMutation['importGdtfFixtures'] | undefined;
      try {
        const { data } = await client.mutate<ImportGdtfFixturesMutation, ImportGdtfFixturesMutationVariables>({
          mutation: IMPORT_GDTF_FIXTURES,
          variables: {
            files: group.map((d) => ({ fileName: d.fileName, descriptionXml: d.descriptionXml })),
            options: { onExisting },
          },
        });
        result = data?.importGdtfFixtures;
        if (!result) throw new Error('No import result was returned by the server.');
      } catch (error) {
        if (noteGdtfImportError(client, error)) throw new GdtfImportUnsupportedError();
        const message = error instanceof Error ? error.message : String(error);
        for (const rest of groups.slice(i)) {
          for (const d of rest) rows.push(failedGdtfRow(d.fileName, `Not imported: ${message}`));
        }
        return { rows, error: message };
      }
      rows.push(...result.results.map(rowFromResult));
      if (result.createdCount > 0 || result.updatedCount > 0) changed = true;
      processed += group.length;
      onProgress?.(processed, total);
    }
  } finally {
    if (changed) evictFixtureDefinitionQueries(client);
  }
  return { rows, error: null };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export const GDTF_RESULTS_CSV_HEADER = [
  'File',
  'Status',
  'Manufacturer',
  'Model',
  'Modes',
  'Definition ID',
  'Warnings',
  'Error',
] as const;

/** The results table as CSV (one row per file; warnings one per line). */
export function buildGdtfResultsCsv(rows: ReadonlyArray<GdtfImportRow>): string {
  return toCsv(
    GDTF_RESULTS_CSV_HEADER,
    rows.map((r) => [
      r.fileName,
      GDTF_STATUS_LABELS[r.status] ?? r.status,
      r.manufacturer,
      r.model,
      r.modeCount,
      r.definition?.id,
      r.warnings.join('\n'),
      r.error,
    ]),
  );
}

/** Download name for the results CSV, e.g. "gdtf-import-results-2026-10-15.csv". */
export function gdtfResultsCsvFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `gdtf-import-results-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.csv`;
}
