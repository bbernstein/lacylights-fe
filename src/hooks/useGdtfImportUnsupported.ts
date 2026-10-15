import { useCallback, useSyncExternalStore } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  GDTF_IMPORT_FEATURE,
  isFeatureUnsupported,
  subscribeToBackendCapabilities,
} from '@/lib/importExport/backendCompat';

/**
 * True once the current backend is known to lack GDTF fixture import (an
 * older server rejected `importGdtfFixtures`). Remembered per Apollo client.
 */
export function useGdtfImportUnsupported(): boolean {
  const client = useApolloClient();
  const getSnapshot = useCallback(() => isFeatureUnsupported(client, GDTF_IMPORT_FEATURE), [client]);
  return useSyncExternalStore(subscribeToBackendCapabilities, getSnapshot, () => false);
}
