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
import { getFixtureKey, getManufacturer, getModel } from '@/constants/fixtures';
import { ImportMode, FixtureConflictStrategy } from '@/constants/import';
import type {
  EosWarning,
  ExportProjectMutation,
  ExportProjectToEosMutation,
  ExportProjectToQlcMutation,
  GetQlcFixtureMappingSuggestionsQuery,
  ImportProjectFromEosMutation,
  ImportProjectFromQlcMutation,
  ImportProjectMutation,
} from '@/generated/graphql';
import { PROJECT_FORMATS, type ProjectExportFormat, type ProjectFileFormat } from './formats';
import { buildProjectExportFilename, projectNameFromFilename } from './filenames';
import { downloadFile } from './download';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApolloClient = ApolloClient<any>;

/** A count shown in the import summary, e.g. { label: 'Looks', count: 4 }. */
export interface ImportStat {
  label: string;
  count: number;
}

export interface ProjectImportResult {
  format: ProjectFileFormat;
  projectId: string;
  /** Project name when the backend returns one (QLC+, Eos) */
  projectName?: string;
  stats: ImportStat[];
  /** Plain-text warnings (LacyLights JSON and QLC+ imports) */
  warnings: string[];
  /** Structured warnings (Eos imports) */
  eosWarnings: EosWarning[];
}

export interface ProjectExportResult {
  format: ProjectExportFormat;
  projectId: string;
  projectName: string;
  filename: string;
  mimeType: string;
  content: string;
  /** Structured warnings (Eos exports) */
  eosWarnings: EosWarning[];
}

export interface FixtureMappingInput {
  lacyLightsKey: string;
  qlcManufacturer: string;
  qlcModel: string;
  qlcMode: string;
}

/**
 * Format an error message from a caught exception, e.g.
 * formatErrorMessage(err, 'Failed to export project.')
 */
export function formatErrorMessage(error: unknown, prefix: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return `${prefix} ${errorMessage}`;
}

/**
 * Create QLC+ fixture mappings from the backend's default mappings, or, when
 * there are none, from the project's LacyLights fixtures with a 'Default' mode.
 */
export function createFixtureMappings(
  defaultMappings: ReadonlyArray<FixtureMappingInput>,
  lacyLightsFixtures: ReadonlyArray<{ manufacturer: string | null; model: string | null }>,
): FixtureMappingInput[] {
  const rawMappings =
    defaultMappings.length > 0
      ? defaultMappings
      : lacyLightsFixtures.map((fixture) => ({
          lacyLightsKey: getFixtureKey(fixture.manufacturer, fixture.model),
          qlcManufacturer: getManufacturer(fixture.manufacturer),
          qlcModel: getModel(fixture.model),
          qlcMode: 'Default',
        }));

  // Strip any extra fields (e.g. __typename) before sending as input.
  return rawMappings.map((mapping) => ({
    lacyLightsKey: mapping.lacyLightsKey,
    qlcManufacturer: mapping.qlcManufacturer,
    qlcModel: mapping.qlcModel,
    qlcMode: mapping.qlcMode,
  }));
}

/**
 * Import project file content in the given format. Throws on failure.
 *
 * @param client   Apollo client (e.g. from useApolloClient())
 * @param content  File text content
 * @param filename Original filename (used for project naming)
 * @param format   Resolved (non-auto) format
 */
export async function importProjectContent(
  client: AnyApolloClient,
  content: string,
  filename: string,
  format: ProjectFileFormat,
): Promise<ProjectImportResult> {
  if (format === 'eos') {
    const newProjectName = projectNameFromFilename(filename, 'eos');
    const { data } = await client.mutate<ImportProjectFromEosMutation>({
      mutation: IMPORT_PROJECT_FROM_EOS,
      variables: { asciiContent: content, options: { newProjectName } },
    });
    const r = data?.importProjectFromEos;
    if (!r?.projectId) {
      throw new Error('No project was returned by the server.');
    }
    return {
      format,
      projectId: r.projectId,
      projectName: newProjectName,
      stats: [
        { label: 'Fixture definitions', count: r.fixtureDefinitionsCount },
        { label: 'Fixtures', count: r.fixtureInstancesCount },
        { label: 'Looks', count: r.looksCount },
        { label: 'Cue lists', count: r.cueListsCount },
        { label: 'Cues', count: r.cuesCount },
        { label: 'Groups', count: r.groupsCount },
      ],
      warnings: [],
      eosWarnings: [...(r.warnings ?? [])],
    };
  }

  if (format === 'qlcplus') {
    const { data } = await client.mutate<ImportProjectFromQlcMutation>({
      mutation: IMPORT_PROJECT_FROM_QLC,
      variables: { xmlContent: content, originalFileName: filename },
    });
    const r = data?.importProjectFromQLC;
    if (!r?.project?.id) {
      throw new Error('No project was returned by the server.');
    }
    return {
      format,
      projectId: r.project.id,
      projectName: r.project.name,
      stats: [
        { label: 'Fixtures', count: r.fixtureCount },
        { label: 'Looks', count: r.lookCount },
        { label: 'Cue lists', count: r.cueListCount },
      ],
      warnings: [...(r.warnings ?? [])],
      eosWarnings: [],
    };
  }

  // LacyLights native format
  const { data } = await client.mutate<ImportProjectMutation>({
    mutation: IMPORT_PROJECT,
    variables: {
      jsonContent: content,
      options: {
        mode: ImportMode.CREATE,
        fixtureConflictStrategy: FixtureConflictStrategy.SKIP,
        importBuiltInFixtures: true,
      },
    },
  });
  const r = data?.importProject;
  if (!r?.projectId) {
    throw new Error('No project was returned by the server.');
  }
  return {
    format,
    projectId: r.projectId,
    stats: [
      { label: 'Fixture definitions', count: r.stats.fixtureDefinitionsCreated },
      { label: 'Fixtures', count: r.stats.fixtureInstancesCreated },
      { label: 'Looks', count: r.stats.looksCreated },
      { label: 'Cue lists', count: r.stats.cueListsCreated },
      { label: 'Cues', count: r.stats.cuesCreated },
    ],
    warnings: [...(r.warnings ?? [])],
    eosWarnings: [],
  };
}

/**
 * Export a project in the given format. Does not download; see
 * downloadProjectExport / exportAndDownloadProject. Throws on failure.
 */
export async function exportProjectAs(
  client: AnyApolloClient,
  projectId: string,
  format: ProjectExportFormat,
): Promise<ProjectExportResult> {
  const { mimeType } = PROJECT_FORMATS[format];

  if (format === 'eos') {
    const { data } = await client.mutate<ExportProjectToEosMutation>({
      mutation: EXPORT_PROJECT_TO_EOS,
      variables: { projectId },
    });
    const r = data?.exportProjectToEos;
    if (!r) {
      throw new Error('No export data was returned by the server.');
    }
    return {
      format,
      projectId,
      projectName: r.projectName,
      // The backend's filenameSuffix is informational only; the extension
      // always comes from the frontend format table.
      filename: buildProjectExportFilename(r.projectName, format),
      mimeType,
      content: r.asciiContent,
      eosWarnings: [...(r.warnings ?? [])],
    };
  }

  if (format === 'qlcplus') {
    const mappingResult = await client.query<GetQlcFixtureMappingSuggestionsQuery>({
      query: GET_QLC_FIXTURE_MAPPING_SUGGESTIONS,
      variables: { projectId },
      fetchPolicy: 'network-only',
    });
    const mappingData = mappingResult.data?.getQLCFixtureMappingSuggestions;
    if (!mappingData) {
      throw new Error('Failed to get fixture mappings.');
    }
    const fixtureMappings = createFixtureMappings(
      mappingData.defaultMappings,
      mappingData.lacyLightsFixtures,
    );
    const { data } = await client.mutate<ExportProjectToQlcMutation>({
      mutation: EXPORT_PROJECT_TO_QLC,
      variables: { projectId, fixtureMappings },
    });
    const r = data?.exportProjectToQLC;
    if (!r) {
      throw new Error('No export data was returned by the server.');
    }
    return {
      format,
      projectId,
      projectName: r.projectName,
      filename: buildProjectExportFilename(r.projectName, format),
      mimeType,
      content: r.xmlContent,
      eosWarnings: [],
    };
  }

  // LacyLights native export
  const { data } = await client.mutate<ExportProjectMutation>({
    mutation: EXPORT_PROJECT,
    variables: {
      projectId,
      options: {
        includeFixtures: true,
        includeLooks: true,
        includeCueLists: true,
      },
    },
  });
  const r = data?.exportProject;
  if (!r) {
    throw new Error('No export data was returned by the server.');
  }
  return {
    format,
    projectId,
    projectName: r.projectName,
    filename: buildProjectExportFilename(r.projectName, format),
    mimeType,
    content: r.jsonContent,
    eosWarnings: [],
  };
}

/** Download a previously generated project export. */
export function downloadProjectExport(result: ProjectExportResult): void {
  downloadFile(result.content, result.filename, result.mimeType);
}

/** Export a project in the given format and immediately download it. */
export async function exportAndDownloadProject(
  client: AnyApolloClient,
  projectId: string,
  format: ProjectExportFormat,
): Promise<ProjectExportResult> {
  const result = await exportProjectAs(client, projectId, format);
  downloadProjectExport(result);
  return result;
}
