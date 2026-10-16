import FixtureSourceBadge from './FixtureSourceBadge';
import type { FixtureModelOption } from '@/hooks/useFixtureModels';

interface ModelOptionLabelProps {
  /** Model list in display (precedence) order */
  models: readonly FixtureModelOption[];
  /** Position of this entry in `models` */
  index: number;
  /** Text shown for the entry (the model name) */
  label: string;
}

/**
 * One row of a model picker: the model name plus the definition's source
 * badge. When a model exists from several sources, the first entry (the
 * preferred source) is marked "Preferred".
 */
export default function ModelOptionLabel({ models, index, label }: ModelOptionLabelProps) {
  const definition = models[index];
  if (!definition) return <>{label}</>;

  const sameModel = models.filter((m) => m.model === definition.model);
  const isPreferred = sameModel.length > 1 && sameModel[0] === definition;

  return (
    <span className="flex items-center justify-between gap-2">
      <span className="truncate">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {isPreferred && (
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Preferred</span>
        )}
        <FixtureSourceBadge source={definition.source} sourceVersion={definition.sourceVersion} />
      </span>
    </span>
  );
}

interface SelectedModelSourceProps {
  /** Model list in display (precedence) order */
  models: readonly FixtureModelOption[];
  /** The selected definition, if any */
  selected: FixtureModelOption | null;
}

/**
 * "Source: <badge>" under a model picker for the selected definition, noting
 * when the same model is available from other sources too. Renders nothing
 * when the backend does not report sources.
 */
export function SelectedModelSource({ models, selected }: SelectedModelSourceProps) {
  if (!selected?.source) return null;

  const count = models.filter((m) => m.model === selected.model).length;

  return (
    <p
      className="-mt-3 flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
      data-testid="selected-model-source"
    >
      <span>Source:</span>
      <FixtureSourceBadge source={selected.source} sourceVersion={selected.sourceVersion} srPrefix={false} />
      {count > 1 && <span>({count} sources available; pick another in the model list to switch)</span>}
    </p>
  );
}
