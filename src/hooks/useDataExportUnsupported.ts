import { useCallback, useSyncExternalStore } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  DATA_EXPORT_FEATURE,
  isFeatureUnsupported,
  subscribeToBackendCapabilities,
} from '@/lib/importExport/backendCompat';

/**
 * True once the current backend is known to lack CSV / Excel data export
 * (an older server rejected `dataExportTables` / `exportDataTable` /
 * `exportDataWorkbook` with "Cannot query field"). Remembered per Apollo
 * client, so every Export button and panel updates together.
 */
export function useDataExportUnsupported(): boolean {
  const client = useApolloClient();
  const getSnapshot = useCallback(() => isFeatureUnsupported(client, DATA_EXPORT_FEATURE), [client]);
  return useSyncExternalStore(subscribeToBackendCapabilities, getSnapshot, () => false);
}
