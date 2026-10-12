import { ApolloError, type ApolloClient } from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  DATA_EXPORT_FEATURE,
  DATA_EXPORT_UNSUPPORTED_MESSAGE,
  isFeatureUnsupported,
  isUnknownQueryFieldError,
  markFeatureUnsupported,
  noteDataExportError,
  queryWithLegacyMutationFallback,
  subscribeToBackendCapabilities,
} from '../backendCompat';

function makeClient() {
  const mutate = jest.fn();
  const query = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = { mutate, query } as unknown as ApolloClient<any>;
  return { client, mutate, query };
}

const unknownField = (field: string) => `Cannot query field "${field}" on type "Query".`;

/** gqlgen answers validation failures with HTTP 422, which Apollo reports as a network error. */
function validationNetworkError(field: string): ApolloError {
  const networkError = Object.assign(new Error('Response not successful: Received status code 422'), {
    name: 'ServerError',
    statusCode: 422,
    result: { errors: [{ message: unknownField(field) }] },
  });
  return new ApolloError({ networkError });
}

function validationGraphQLError(field: string): ApolloError {
  return new ApolloError({ graphQLErrors: [new GraphQLError(unknownField(field))] });
}

describe('importExport/backendCompat', () => {
  describe('isUnknownQueryFieldError', () => {
    it('detects the error in graphQLErrors', () => {
      expect(isUnknownQueryFieldError(validationGraphQLError('projectExport'), 'projectExport')).toBe(true);
    });

    it('detects the error in a 422 network error body', () => {
      expect(isUnknownQueryFieldError(validationNetworkError('projectExport'), 'projectExport')).toBe(true);
    });

    it('detects the error in a plain Error message', () => {
      expect(isUnknownQueryFieldError(new Error(unknownField('dataExportTables')), 'dataExportTables')).toBe(
        true,
      );
    });

    it('requires the exact field name', () => {
      expect(isUnknownQueryFieldError(validationGraphQLError('projectExportEos'), 'projectExport')).toBe(false);
    });

    it('ignores other errors', () => {
      expect(isUnknownQueryFieldError(new ApolloError({ graphQLErrors: [new GraphQLError('project not found')] }), 'projectExport')).toBe(false);
      expect(isUnknownQueryFieldError(new Error('Network down'), 'projectExport')).toBe(false);
      expect(isUnknownQueryFieldError('Cannot query field "projectExport" on type "Query"', 'projectExport')).toBe(
        false,
      );
      expect(isUnknownQueryFieldError(null, 'projectExport')).toBe(false);
    });

    it('does not trust the message of an ApolloError whose network body is not GraphQL', () => {
      const networkError = Object.assign(new Error(unknownField('projectExport')), {
        name: 'ServerError',
        statusCode: 502,
        result: '<html>Cannot query field "projectExport" on type "Query"</html>',
      });
      expect(isUnknownQueryFieldError(new ApolloError({ networkError }), 'projectExport')).toBe(false);
    });
  });

  describe('feature flags', () => {
    it('are tracked per client and notify subscribers', () => {
      const a = makeClient().client;
      const b = makeClient().client;
      const listener = jest.fn();
      const unsubscribe = subscribeToBackendCapabilities(listener);

      expect(isFeatureUnsupported(a, 'x')).toBe(false);
      markFeatureUnsupported(a, 'x');
      expect(isFeatureUnsupported(a, 'x')).toBe(true);
      expect(isFeatureUnsupported(b, 'x')).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);

      // Marking again is a no-op.
      markFeatureUnsupported(a, 'x');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      markFeatureUnsupported(b, 'x');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('treats a missing client as supported', () => {
      expect(isFeatureUnsupported(null, 'x')).toBe(false);
      expect(() => markFeatureUnsupported(undefined, 'x')).not.toThrow();
    });
  });

  describe('noteDataExportError', () => {
    it.each(['dataExportTables', 'exportDataTable', 'exportDataWorkbook'])(
      'marks data export unsupported when %s is unknown',
      (field) => {
        const { client } = makeClient();
        expect(noteDataExportError(client, validationNetworkError(field))).toBe(true);
        expect(isFeatureUnsupported(client, DATA_EXPORT_FEATURE)).toBe(true);
      },
    );

    it('leaves the flag alone for other errors', () => {
      const { client } = makeClient();
      expect(noteDataExportError(client, new Error('boom'))).toBe(false);
      expect(isFeatureUnsupported(client, DATA_EXPORT_FEATURE)).toBe(false);
    });

    it('has a user-facing message', () => {
      expect(DATA_EXPORT_UNSUPPORTED_MESSAGE).toMatch(/doesn.t support CSV\/Excel export/);
      expect(DATA_EXPORT_UNSUPPORTED_MESSAGE).toMatch(/update LacyLights/);
    });
  });

  describe('queryWithLegacyMutationFallback', () => {
    const QUERY = { kind: 'Document', definitions: [] } as never;
    const MUTATION = { kind: 'Document', definitions: [{}] } as never;
    const primary = { query: QUERY, field: 'projectExport' };
    const legacy = { mutation: MUTATION, field: 'exportProject' };
    const variables = { projectId: 'p1' };

    it('returns the Query result when the backend supports it', async () => {
      const { client, query, mutate } = makeClient();
      query.mockResolvedValue({ data: { projectExport: { jsonContent: '{}' } } });
      const result = await queryWithLegacyMutationFallback(client, primary, legacy, variables);
      expect(result).toEqual({ jsonContent: '{}' });
      expect(query).toHaveBeenCalledWith({ query: QUERY, variables, fetchPolicy: 'no-cache' });
      expect(mutate).not.toHaveBeenCalled();
    });

    it('falls back to the legacy Mutation on "Cannot query field" and remembers it', async () => {
      const { client, query, mutate } = makeClient();
      query.mockRejectedValue(validationNetworkError('projectExport'));
      mutate.mockResolvedValue({ data: { exportProject: { jsonContent: 'old' } } });

      const result = await queryWithLegacyMutationFallback(client, primary, legacy, variables);
      expect(result).toEqual({ jsonContent: 'old' });
      expect(mutate).toHaveBeenCalledWith({ mutation: MUTATION, variables, fetchPolicy: 'no-cache' });

      // Later exports on the same client go straight to the Mutation.
      query.mockClear();
      mutate.mockClear();
      mutate.mockResolvedValue({ data: { exportProject: { jsonContent: 'again' } } });
      await expect(queryWithLegacyMutationFallback(client, primary, legacy, variables)).resolves.toEqual({
        jsonContent: 'again',
      });
      expect(query).not.toHaveBeenCalled();
    });

    it('does not fall back on other errors', async () => {
      const { client, query, mutate } = makeClient();
      const error = new ApolloError({ graphQLErrors: [new GraphQLError('project not found')] });
      query.mockRejectedValue(error);
      await expect(queryWithLegacyMutationFallback(client, primary, legacy, variables)).rejects.toBe(error);
      expect(mutate).not.toHaveBeenCalled();
      expect(isFeatureUnsupported(client, 'query:projectExport')).toBe(false);
    });

    it('does not fall back when a different field is unknown', async () => {
      const { client, query, mutate } = makeClient();
      query.mockRejectedValue(validationGraphQLError('somethingElse'));
      await expect(queryWithLegacyMutationFallback(client, primary, legacy, variables)).rejects.toBeInstanceOf(
        ApolloError,
      );
      expect(mutate).not.toHaveBeenCalled();
    });

    it('propagates errors from the legacy Mutation', async () => {
      const { client, query, mutate } = makeClient();
      query.mockRejectedValue(validationGraphQLError('projectExport'));
      mutate.mockRejectedValue(new Error('mutation failed'));
      await expect(queryWithLegacyMutationFallback(client, primary, legacy, variables)).rejects.toThrow(
        'mutation failed',
      );
    });

    it('throws when the response lacks the field', async () => {
      const { client, query, mutate } = makeClient();
      query.mockResolvedValue({ data: null });
      await expect(queryWithLegacyMutationFallback(client, primary, legacy, variables)).rejects.toThrow(
        'No export data was returned by the server.',
      );

      query.mockRejectedValue(validationGraphQLError('projectExport'));
      mutate.mockResolvedValue({ data: { exportProject: null } });
      await expect(
        queryWithLegacyMutationFallback(makeClient().client, primary, legacy, variables),
      ).rejects.toThrow();
    });
  });
});
