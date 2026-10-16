import { FixtureSource } from '@/types';
import { fixtureSourceDescription, fixtureSourceLabel } from '@/lib/fixtureSources';

interface FixtureSourceBadgeProps {
  /** Definition source; nothing is rendered when it is missing (older backends). */
  source?: FixtureSource | string | null;
  /** Source version, appended to the tooltip when known */
  sourceVersion?: string | null;
  /**
   * Prefix the label with a visually hidden "Source: " for screen readers.
   * Turn off when the surrounding text already says "Source".
   */
  srPrefix?: boolean;
  className?: string;
}

const COLORS: Record<FixtureSource, string> = {
  [FixtureSource.BUILTIN]:
    'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  [FixtureSource.OFL]:
    'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  [FixtureSource.GDTF]:
    'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
  [FixtureSource.EOS]:
    'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
  [FixtureSource.USER]:
    'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  [FixtureSource.SYNTHESIZED]:
    'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
};

const FALLBACK_COLOR =
  'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';

/**
 * Small badge naming where a fixture definition came from (Built-in, OFL,
 * GDTF, Custom, ...). The label is text, so the source does not depend on
 * color; screen readers hear "Source: <label>".
 */
export default function FixtureSourceBadge({
  source,
  sourceVersion,
  srPrefix = true,
  className = '',
}: FixtureSourceBadgeProps) {
  if (!source) return null;

  const color = (COLORS as Record<string, string>)[source] ?? FALLBACK_COLOR;
  const description = fixtureSourceDescription(source);
  const title = sourceVersion ? `${description} (version ${sourceVersion})` : description;

  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium leading-4 whitespace-nowrap ${color} ${className}`}
      title={title}
      data-testid="fixture-source-badge"
      data-source={source}
    >
      {srPrefix && <span className="sr-only">Source: </span>}
      {fixtureSourceLabel(source)}
    </span>
  );
}
