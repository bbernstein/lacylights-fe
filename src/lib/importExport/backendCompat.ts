/**
 * Compatibility with older LacyLights backends.
 *
 * The Mac and Raspberry Pi platforms update the frontend and backend
 * separately, so a newer frontend can talk to a backend that predates the
 * read-only `Query.projectExport*` fields and the CSV / Excel data export
 * (`dataExportTables`, `exportDataTable`, `exportDataWorkbook`). Such a
 * backend rejects the request with the GraphQL validation error
 * `Cannot query field "<field>" on type "Query"`.
 *
 * - Project exports retry with the legacy export Mutation
 *   ({@link queryWithLegacyMutationFallback}).
 * - Data export UI hides itself or explains that the server needs an update
 *   ({@link DATA_EXPORT_FEATURE}, {@link noteDataExportError}).
 *
 * What a backend lacks is remembered per Apollo client (one client per
 * session/backend), so later requests skip the doomed attempt.
 */
import {
  ApolloError,
  type ApolloClient,
  type DocumentNode,
  type OperationVariables,
  type TypedDocumentNode,
} from '@apollo/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApolloClient = ApolloClient<any>;

/** Feature key for CSV / Excel data export. */
export const DATA_EXPORT_FEATURE = 'dataExport';

/** Shown where CSV / Excel export would be when the backend is too old. */
export const DATA_EXPORT_UNSUPPORTED_MESSAGE =
  "This server version doesn't support CSV/Excel export; update LacyLights.";

/** Query fields whose absence means the backend has no data export. */
const DATA_EXPORT_FIELDS = ['dataExportTables', 'exportDataTable', 'exportDataWorkbook'] as const;

function graphQLMessages(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((e) => (e && typeof e === 'object' ? (e as { message?: unknown }).message : undefined))
    .filter((m): m is string => typeof m === 'string');
}

/**
 * Messages of the GraphQL errors carried by `error`. For an ApolloError only
 * the parsed GraphQL errors count (in `graphQLErrors`, or in the network
 * error's JSON body: gqlgen answers validation failures with HTTP 422), so a
 * non-GraphQL body such as an HTML error page can never trigger a fallback.
 */
function errorMessages(error: unknown): string[] {
  if (!(error instanceof Error)) return [];
  // instanceof covers the normal case; the name check also covers an
  // ApolloError from a duplicated @apollo/client bundle. Revisit on an
  // Apollo Client 4 upgrade (errors are restructured there); the tests use
  // real ApolloError instances and will fail if the shape changes.
  if (!(error instanceof ApolloError) && error.name !== 'ApolloError') return [error.message];
  const apollo = error as Error & {
    graphQLErrors?: unknown;
    networkError?: { result?: unknown } | null;
  };
  const result = apollo.networkError?.result;
  const networkErrors =
    result && typeof result === 'object' ? graphQLMessages((result as { errors?: unknown }).errors) : [];
  return [...graphQLMessages(apollo.graphQLErrors), ...networkErrors];
}

/**
 * True when `error` says the server does not know `field` on the Query type,
 * which is how older backends reject newly added Query fields.
 */
export function isUnknownQueryFieldError(error: unknown, field: string): boolean {
  const needle = `Cannot query field "${field}" on type "Query"`;
  return errorMessages(error).some((m) => m.includes(needle));
}

// ---------------------------------------------------------------------------
// Per-client feature flags
// ---------------------------------------------------------------------------

const unsupportedByClient = new WeakMap<object, Set<string>>();
const listeners = new Set<() => void>();

/** True once `feature` is known to be missing on the client's backend. */
export function isFeatureUnsupported(client: AnyApolloClient | null | undefined, feature: string): boolean {
  if (!client) return false;
  return unsupportedByClient.get(client)?.has(feature) ?? false;
}

/** Remember that the client's backend lacks `feature`. */
export function markFeatureUnsupported(client: AnyApolloClient | null | undefined, feature: string): void {
  if (!client) return;
  let set = unsupportedByClient.get(client);
  if (!set) {
    set = new Set();
    unsupportedByClient.set(client, set);
  }
  if (set.has(feature)) return;
  set.add(feature);
  listeners.forEach((listener) => listener());
}

/** Subscribe to feature-flag changes (for useSyncExternalStore). */
export function subscribeToBackendCapabilities(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True when `error` shows the backend has no CSV / Excel data export. */
export function isDataExportUnsupportedError(error: unknown): boolean {
  return DATA_EXPORT_FIELDS.some((field) => isUnknownQueryFieldError(error, field));
}

/**
 * If `error` shows the backend has no CSV / Excel data export, remember that
 * for the client and return true. Otherwise return false.
 */
export function noteDataExportError(client: AnyApolloClient | null | undefined, error: unknown): boolean {
  if (!isDataExportUnsupportedError(error)) {
    return false;
  }
  markFeatureUnsupported(client, DATA_EXPORT_FEATURE);
  return true;
}

// ---------------------------------------------------------------------------
// Query with legacy Mutation fallback
// ---------------------------------------------------------------------------

type AnyDocument<TData, TVariables> = DocumentNode | TypedDocumentNode<TData, TVariables>;

function pickField<T>(data: unknown, field: string): T {
  const value = data && typeof data === 'object' ? (data as Record<string, unknown>)[field] : undefined;
  if (value === undefined || value === null) {
    throw new Error('No export data was returned by the server.');
  }
  return value as T;
}

/**
 * Run a read-only export Query, falling back to the legacy export Mutation
 * when the backend does not know the Query field yet. Only for legacy
 * Mutations that are side-effect free apart from what the Query does too
 * (the deprecated project export Mutations). Any other error is
 * rethrown. Both requests use `fetchPolicy: 'no-cache'` so large file
 * contents never land in the Apollo cache.
 *
 * Returns the value of the requested field (e.g. `data.projectExport`).
 */
export async function queryWithLegacyMutationFallback<
  TResult,
  TVariables extends OperationVariables = OperationVariables,
>(
  client: AnyApolloClient,
  primary: { query: AnyDocument<unknown, TVariables>; field: string },
  legacy: { mutation: AnyDocument<unknown, TVariables>; field: string },
  variables: TVariables,
): Promise<TResult> {
  const feature = `query:${primary.field}`;

  if (!isFeatureUnsupported(client, feature)) {
    try {
      const { data } = await client.query({
        query: primary.query,
        variables,
        fetchPolicy: 'no-cache',
      });
      return pickField<TResult>(data, primary.field);
    } catch (error) {
      if (!isUnknownQueryFieldError(error, primary.field)) {
        throw error;
      }
      markFeatureUnsupported(client, feature);
    }
  }

  const { data } = await client.mutate({
    mutation: legacy.mutation,
    variables,
    fetchPolicy: 'no-cache',
  });
  return pickField<TResult>(data, legacy.field);
}
