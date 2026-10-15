import { useCallback, useEffect, useRef, useState } from 'react';
import { useApolloClient, useLazyQuery } from '@apollo/client';
import { GET_MODELS, GET_MODELS_LEGACY } from '@/graphql/fixtures';
import { FixtureSource } from '@/types';
import { FIXTURE_SOURCE_FEATURE } from '@/lib/fixtureSources';
import {
  isFeatureUnsupported,
  isUnknownFieldError,
  markFeatureUnsupported,
} from '@/lib/importExport/backendCompat';

/** One fixture definition as listed in a model picker. */
export interface FixtureModelOption {
  id: string;
  model: string;
  /** Missing on backends that predate fixture definition sources */
  source?: FixtureSource | null;
  sourceVersion?: string | null;
  modes: Array<{ id: string; name: string; channelCount: number }>;
}

export interface GetModelsVariables {
  manufacturer: string;
  search?: string;
}

interface UseFixtureModelsOptions {
  /** Called with the loaded definitions (like useLazyQuery's onCompleted). */
  onCompleted?: (models: FixtureModelOption[]) => void;
}

/**
 * Loads the model list (GET_MODELS) for a manufacturer, including each
 * definition's `source`. Backends that predate fixture sources reject
 * `FixtureDefinition.source`; the hook then remembers that (per Apollo
 * client) and uses GET_MODELS_LEGACY, so pickers keep working without
 * source badges.
 */
export function useFixtureModels({ onCompleted }: UseFixtureModelsOptions = {}) {
  const client = useApolloClient();
  const [models, setModels] = useState<FixtureModelOption[]>([]);
  const lastVariables = useRef<GetModelsVariables | null>(null);
  const onCompletedRef = useRef(onCompleted);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  const handleLoaded = useCallback((data: { fixtureDefinitions?: FixtureModelOption[] } | undefined) => {
    const definitions = data?.fixtureDefinitions ?? [];
    setModels(definitions);
    onCompletedRef.current?.(definitions);
  }, []);

  const [runLegacy, { loading: loadingLegacy }] = useLazyQuery(GET_MODELS_LEGACY, {
    onCompleted: handleLoaded,
  });

  const [runCurrent, { loading: loadingCurrent }] = useLazyQuery(GET_MODELS, {
    onCompleted: handleLoaded,
    onError: (error) => {
      const unsupported =
        isUnknownFieldError(error, 'source', 'FixtureDefinition') ||
        isUnknownFieldError(error, 'sourceVersion', 'FixtureDefinition');
      if (!unsupported) return;
      markFeatureUnsupported(client, FIXTURE_SOURCE_FEATURE);
      if (lastVariables.current) {
        void runLegacy({ variables: lastVariables.current });
      }
    },
  });

  const loadModels = useCallback(
    (options: { variables: GetModelsVariables }) => {
      lastVariables.current = options.variables;
      if (isFeatureUnsupported(client, FIXTURE_SOURCE_FEATURE)) {
        return runLegacy(options);
      }
      return runCurrent(options);
    },
    [client, runCurrent, runLegacy],
  );

  return { loadModels, models, setModels, loading: loadingCurrent || loadingLegacy };
}
