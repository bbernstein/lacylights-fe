import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { useApolloClient } from '@apollo/client';
import { GraphQLError } from 'graphql';
import type { ReactNode } from 'react';
import { useDataExportTables, type UseDataExportTablesOptions } from '../useDataExportTables';
import { GET_DATA_EXPORT_TABLES, GET_DATA_EXPORT_TABLES_LEGACY } from '@/graphql/dataExport';
import {
  DATA_EXPORT_FEATURE,
  DATA_EXPORT_SCOPE_REQUIRED_FEATURE,
  isFeatureUnsupported,
} from '@/lib/importExport/backendCompat';

const newTables: MockedResponse = {
  request: { query: GET_DATA_EXPORT_TABLES },
  result: {
    data: {
      dataExportTables: [
        { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', scopeRequired: true, columns: [] },
        { table: 'LOOK_BOARD_ENTRIES', label: 'Look board entries', scope: 'lookBoard', scopeRequired: false, columns: [] },
      ],
    },
  },
};

function setup(mocks: MockedResponse[], initial: UseDataExportTablesOptions = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
  return renderHook(
    (options: UseDataExportTablesOptions) => ({ state: useDataExportTables(options), client: useApolloClient() }),
    { wrapper, initialProps: initial },
  );
}

describe('useDataExportTables', () => {
  it('loads the tables with scopeRequired from the server', async () => {
    const { result } = setup([newTables]);
    expect(result.current.state.loading).toBe(true);
    expect(result.current.state.tables).toBeNull();
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.tables?.map((t) => [t.table, t.scopeRequired])).toEqual([
      ['LOOK_DETAILS', true],
      ['LOOK_BOARD_ENTRIES', false],
    ]);
  });

  it('falls back to the legacy query on a backend without scopeRequired', async () => {
    const { result } = setup([
      {
        request: { query: GET_DATA_EXPORT_TABLES },
        result: { errors: [new GraphQLError('Cannot query field "scopeRequired" on type "DataExportTableInfo".')] },
      },
      {
        request: { query: GET_DATA_EXPORT_TABLES_LEGACY },
        result: {
          data: {
            dataExportTables: [
              { table: 'LOOK_DETAILS', label: 'Look details', scope: 'look', columns: [] },
              { table: 'LOOK_BOARD_ENTRIES', label: 'Look board entries', scope: 'lookBoard', columns: [] },
            ],
          },
        },
      },
    ]);
    await waitFor(() => expect(result.current.state.tables).not.toBeNull());
    expect(result.current.state.tables?.map((t) => [t.table, t.scopeRequired])).toEqual([
      ['LOOK_DETAILS', true],
      ['LOOK_BOARD_ENTRIES', false],
    ]);
    expect(isFeatureUnsupported(result.current.client, DATA_EXPORT_SCOPE_REQUIRED_FEATURE)).toBe(true);
  });

  it('reports errors and remembers a backend without data export', async () => {
    const { result } = setup([
      {
        request: { query: GET_DATA_EXPORT_TABLES },
        result: { errors: [new GraphQLError('Cannot query field "dataExportTables" on type "Query".')] },
      },
    ]);
    await waitFor(() => expect(result.current.state.error).toBeTruthy());
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.tables).toBeNull();
    expect(isFeatureUnsupported(result.current.client, DATA_EXPORT_FEATURE)).toBe(true);
  });

  it('does not load while skipped, then loads when un-skipped', async () => {
    const { result, rerender } = setup([newTables], { skip: true });
    expect(result.current.state).toEqual({ tables: null, loading: false, error: null });
    rerender({ skip: false });
    expect(result.current.state.loading).toBe(true);
    await waitFor(() => expect(result.current.state.tables).toHaveLength(2));
    // Skipping again keeps the loaded tables.
    rerender({ skip: true });
    expect(result.current.state.tables).toHaveLength(2);
    expect(result.current.state.loading).toBe(false);
  });

  it('stops loading when skipped mid-request and ignores the late result', async () => {
    const { result, rerender } = setup([{ ...newTables, delay: 20 }]);
    expect(result.current.state.loading).toBe(true);
    rerender({ skip: true });
    expect(result.current.state.loading).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.state.tables).toBeNull();
  });
});
