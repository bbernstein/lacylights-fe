import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { fetchDataExportTables, type DataExportTableEntry } from '@/lib/importExport/dataExport';
import { noteDataExportError } from '@/lib/importExport/backendCompat';

export interface DataExportTablesState {
  /** The exportable tables, each with `scopeRequired`; null until loaded. */
  tables: ReadonlyArray<DataExportTableEntry> | null;
  loading: boolean;
  /** The last load error, if any. */
  error: unknown;
}

export interface UseDataExportTablesOptions {
  /** Do not load (e.g. a closed menu, or a backend known to lack data export). */
  skip?: boolean;
}

/**
 * The server's exportable tables (`dataExportTables`), with
 * `scopeRequired` from the server or, on backends that predate that field,
 * from the legacy frontend rules ({@link fetchDataExportTables}).
 *
 * Loads whenever `skip` turns false (Apollo's cache answers repeat loads).
 * An error showing that the backend has no data export at all is
 * remembered for the client via `noteDataExportError`, so every Export
 * button and panel can switch to the "update LacyLights" note.
 */
export function useDataExportTables({ skip = false }: UseDataExportTablesOptions = {}): DataExportTablesState {
  const client = useApolloClient();
  const [state, setState] = useState<DataExportTablesState>({ tables: null, loading: !skip, error: null });

  useEffect(() => {
    if (skip) {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      return;
    }
    let active = true;
    setState((prev) => (prev.loading && !prev.error ? prev : { ...prev, loading: true, error: null }));
    fetchDataExportTables(client).then(
      (tables) => {
        if (active) setState({ tables, loading: false, error: null });
      },
      (error: unknown) => {
        if (active) setState({ tables: null, loading: false, error });
        noteDataExportError(client, error);
      },
    );
    return () => {
      active = false;
    };
  }, [client, skip]);

  return state;
}
