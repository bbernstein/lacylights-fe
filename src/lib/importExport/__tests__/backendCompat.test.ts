import { ApolloError, type ApolloClient } from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  DATA_EXPORT_FEATURE,
  DATA_EXPORT_UNSUPPORTED_MESSAGE,
  isFeatureUnsupported,
  isUnknownQueryFieldError,
  markFeatureUnsupported,
  noteDataExportError,
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
});
