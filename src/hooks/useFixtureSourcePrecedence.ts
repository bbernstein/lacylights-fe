import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FIXTURE_SOURCE_PRECEDENCE } from '@/graphql/fixtures';
import { FixtureSource } from '@/types';
import { normalizePrecedence } from '@/lib/fixtureSources';

interface UseFixtureSourcePrecedenceOptions {
  /** Skip the request (e.g. when no model has several sources). */
  skip?: boolean;
}

/**
 * The fixture source precedence (highest first) for ordering same-model
 * definitions. Falls back to the default order while loading, when skipped,
 * or when the backend does not support it.
 */
export function useFixtureSourcePrecedence({ skip = false }: UseFixtureSourcePrecedenceOptions = {}): {
  precedence: FixtureSource[];
  loading: boolean;
} {
  const { data, loading } = useQuery<{ fixtureSourcePrecedence: FixtureSource[] }>(GET_FIXTURE_SOURCE_PRECEDENCE, {
    skip,
  });
  const precedence = useMemo(() => normalizePrecedence(data?.fixtureSourcePrecedence), [data]);
  return { precedence, loading };
}
