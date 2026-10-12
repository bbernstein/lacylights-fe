'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_PROJECT_NAME } from '@/graphql/projects';
import type { GetProjectNameQuery } from '@/generated/graphql';
import { useProject } from '@/contexts/ProjectContext';
import ProjectImportPanel from './ProjectImportPanel';
import ProjectExportPanel from './ProjectExportPanel';
import DataExportPanel from './DataExportPanel';

/**
 * Section ids on the Import / Export page. Used as DOM ids and as values of
 * the `?section=` query parameter. Add new sections here and in the
 * `sections` list below.
 */
export type ImportExportSectionId = 'import' | 'export' | 'data';

export const IMPORT_EXPORT_SECTION_IDS: ReadonlyArray<ImportExportSectionId> = [
  'import',
  'export',
  'data',
];

/** Parsed query parameters for the Import / Export page. */
export interface ImportExportPageParams {
  section: ImportExportSectionId | null;
  projectId: string | null;
  /** Data (CSV / Excel) export: table to preselect, e.g. `LOOKS`. */
  table: string | null;
  /** Data (CSV / Excel) export: look / cue list / board id to preselect. */
  scopeId: string | null;
}

/** Parse the page's query parameters, ignoring unknown sections. */
export function parseImportExportParams(
  params: Pick<URLSearchParams, 'get'> | null | undefined,
): ImportExportPageParams {
  const rawSection = params?.get('section') ?? null;
  const section =
    rawSection && (IMPORT_EXPORT_SECTION_IDS as ReadonlyArray<string>).includes(rawSection)
      ? (rawSection as ImportExportSectionId)
      : null;
  return {
    section,
    projectId: params?.get('project') || null,
    table: params?.get('table') || null,
    scopeId: params?.get('scopeId') || null,
  };
}

/** DOM id for a section, e.g. "import-export-section-export". */
export function sectionDomId(id: ImportExportSectionId): string {
  return `import-export-section-${id}`;
}

interface SectionDefinition {
  id: ImportExportSectionId;
  title: string;
  description: string;
  content: ReactNode;
}

/**
 * The Import / Export page: project import, project export and CSV / Excel
 * data export, each in its own card.
 */
export default function ImportExportPage() {
  const searchParams = useSearchParams();
  const params = parseImportExportParams(searchParams);
  const { currentProject, projects, refetchAndGet, refetchAndSelectById } = useProject();
  const sectionRefs = useRef<Partial<Record<ImportExportSectionId, HTMLElement | null>>>({});

  // Scroll to and focus the requested section.
  useEffect(() => {
    if (!params.section) return;
    const el = sectionRefs.current[params.section];
    if (!el) return;
    el.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    el.focus?.({ preventScroll: true });
  }, [params.section]);

  // ProjectContext.projects only holds the active group's projects. A deep
  // link (e.g. "More import/export options…" on a look board) can point at
  // an accessible project in another group, so look that one up and offer
  // it too. Projects the user cannot access fail the lookup and are ignored.
  const requestedInList = !!params.projectId && projects.some((p) => p.id === params.projectId);
  const { data: requestedProjectData } = useQuery<GetProjectNameQuery>(GET_PROJECT_NAME, {
    variables: { id: params.projectId ?? '' },
    skip: !params.projectId || requestedInList,
  });
  const requestedExtraProject =
    !requestedInList && requestedProjectData?.project?.id === params.projectId
      ? requestedProjectData.project
      : null;
  const exportProjects = useMemo(
    () =>
      requestedExtraProject
        ? [...projects, { id: requestedExtraProject.id, name: requestedExtraProject.name }]
        : projects,
    [projects, requestedExtraProject],
  );

  // Only honour ?project= when it refers to a project the user can see.
  const requestedProjectId = requestedInList || requestedExtraProject ? params.projectId : null;
  const defaultExportProjectId = requestedProjectId ?? currentProject?.id ?? null;

  const sections: SectionDefinition[] = [
    {
      id: 'import',
      title: 'Import project',
      description: 'Create a new project from a LacyLights, QLC+ or ETC Eos file.',
      content: (
        <ProjectImportPanel
          currentProjectId={currentProject?.id ?? null}
          onImported={async () => {
            await refetchAndGet();
          }}
          onSwitchToProject={refetchAndSelectById}
        />
      ),
    },
    {
      id: 'export',
      title: 'Export project',
      description: 'Download a whole project to back it up or move it to another console.',
      content: (
        <ProjectExportPanel projects={exportProjects} defaultProjectId={defaultExportProjectId} />
      ),
    },
    {
      id: 'data',
      title: 'Export data (CSV / Excel)',
      description:
        'Download a list (fixtures, looks, cue lists, …) as a spreadsheet, or every list in one Excel workbook.',
      content: (
        <DataExportPanel
          projects={exportProjects}
          defaultProjectId={defaultExportProjectId}
          defaultTable={params.table}
          defaultScopeId={params.scopeId}
        />
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import / Export</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Move projects in and out of LacyLights, or export lists as spreadsheets.
        </p>
      </header>

      {sections.map((section) => (
        <section
          key={section.id}
          id={sectionDomId(section.id)}
          ref={(el) => {
            sectionRefs.current[section.id] = el;
          }}
          tabIndex={-1}
          aria-labelledby={`${sectionDomId(section.id)}-title`}
          className={`scroll-mt-4 bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 space-y-4 focus:outline-none ${
            params.section === section.id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div>
            <h2
              id={`${sectionDomId(section.id)}-title`}
              className="text-lg font-medium text-gray-900 dark:text-white"
            >
              {section.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
          </div>
          {section.content}
        </section>
      ))}
    </div>
  );
}
