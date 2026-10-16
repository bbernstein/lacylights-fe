/**
 * Fixture definition sources: labels and precedence ordering.
 *
 * A manufacturer + model can exist once per source (built-in, OFL, GDTF, a
 * user's own definition, ...). The backend stores a source precedence
 * (`fixtureSourcePrecedence`, highest first); pickers list same-model
 * definitions in that order and pre-select the first.
 */
import { FixtureSource } from '@/types';

/** Backend default precedence (lacylights-go), highest first. */
export const DEFAULT_FIXTURE_SOURCE_PRECEDENCE: readonly FixtureSource[] = [
  FixtureSource.USER,
  FixtureSource.GDTF,
  FixtureSource.OFL,
  FixtureSource.BUILTIN,
  FixtureSource.EOS,
  FixtureSource.SYNTHESIZED,
];

/**
 * Feature key (see `src/lib/importExport/backendCompat.ts`) recorded when the
 * backend predates fixture definition sources.
 */
export const FIXTURE_SOURCE_FEATURE = 'fixtureSource';

export interface FixtureSourceInfo {
  /** Short badge label */
  label: string;
  /** Longer explanation (tooltip / settings description) */
  description: string;
}

export const FIXTURE_SOURCE_INFO: Record<FixtureSource, FixtureSourceInfo> = {
  [FixtureSource.BUILTIN]: {
    label: 'Built-in',
    description: 'Shipped with LacyLights',
  },
  [FixtureSource.OFL]: {
    label: 'OFL',
    description: 'Imported from the Open Fixture Library',
  },
  [FixtureSource.GDTF]: {
    label: 'GDTF',
    description: 'Imported from a GDTF file',
  },
  [FixtureSource.EOS]: {
    label: 'Eos library',
    description: 'Imported from an Eos fixture library',
  },
  [FixtureSource.USER]: {
    label: 'Custom',
    description: 'Created or edited by a user',
  },
  [FixtureSource.SYNTHESIZED]: {
    label: 'Eos ASCII',
    description: 'Synthesized from an Eos ASCII show file personality',
  },
};

const KNOWN_SOURCES = new Set<string>(Object.values(FixtureSource));

export function isFixtureSource(value: unknown): value is FixtureSource {
  return typeof value === 'string' && KNOWN_SOURCES.has(value);
}

/** Badge label for a source; unknown values are shown as-is. */
export function fixtureSourceLabel(source: FixtureSource | string): string {
  return isFixtureSource(source) ? FIXTURE_SOURCE_INFO[source].label : source;
}

/** Tooltip / description for a source. */
export function fixtureSourceDescription(source: FixtureSource | string): string {
  return isFixtureSource(source) ? FIXTURE_SOURCE_INFO[source].description : `Source: ${source}`;
}

/**
 * Complete a (possibly partial) precedence list: keeps the given order,
 * drops unknown values and duplicates, and appends missing sources in
 * default order, mirroring what the backend stores.
 */
export function normalizePrecedence(
  order: readonly (FixtureSource | string)[] | null | undefined,
): FixtureSource[] {
  const result: FixtureSource[] = [];
  for (const source of order ?? []) {
    if (isFixtureSource(source) && !result.includes(source)) result.push(source);
  }
  for (const source of DEFAULT_FIXTURE_SOURCE_PRECEDENCE) {
    if (!result.includes(source)) result.push(source);
  }
  return result;
}

/** Rank of a source in a precedence list (lower is preferred). */
function rankOf(source: FixtureSource | string | null | undefined, precedence: readonly FixtureSource[]): number {
  if (!source) return precedence.length + 1;
  const index = precedence.indexOf(source as FixtureSource);
  return index === -1 ? precedence.length : index;
}

/**
 * Order definitions for a picker. Model groups keep the order the backend
 * returned (by first appearance); within a model name, definitions are
 * ordered by source precedence (highest first). Lists without duplicate
 * model names come back unchanged. Returns a new array.
 */
export function sortDefinitionsByPrecedence<T extends { model: string; source?: FixtureSource | string | null }>(
  definitions: readonly T[],
  precedence: readonly FixtureSource[],
): T[] {
  const groupOrder = new Map<string, number>();
  definitions.forEach((def) => {
    if (!groupOrder.has(def.model)) groupOrder.set(def.model, groupOrder.size);
  });
  return definitions
    .map((def, index) => ({ def, index }))
    .sort(
      (a, b) =>
        groupOrder.get(a.def.model)! - groupOrder.get(b.def.model)! ||
        rankOf(a.def.source, precedence) - rankOf(b.def.source, precedence) ||
        a.index - b.index,
    )
    .map(({ def }) => def);
}

/** Whether any model name appears more than once (several sources). */
export function hasDuplicateModels(definitions: readonly { model: string }[]): boolean {
  const seen = new Set<string>();
  for (const def of definitions) {
    if (seen.has(def.model)) return true;
    seen.add(def.model);
  }
  return false;
}
