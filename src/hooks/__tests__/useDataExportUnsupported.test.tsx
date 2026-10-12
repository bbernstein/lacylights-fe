import { act, renderHook } from '@testing-library/react';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import type { ReactNode } from 'react';
import { useDataExportUnsupported } from '../useDataExportUnsupported';
import { DATA_EXPORT_FEATURE, markFeatureUnsupported } from '@/lib/importExport/backendCompat';

describe('useDataExportUnsupported', () => {
  it('turns true when the client is marked as lacking data export', () => {
    const client = new ApolloClient({ cache: new InMemoryCache() });
    const other = new ApolloClient({ cache: new InMemoryCache() });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );
    const { result } = renderHook(() => useDataExportUnsupported(), { wrapper });
    expect(result.current).toBe(false);

    act(() => markFeatureUnsupported(other, DATA_EXPORT_FEATURE));
    expect(result.current).toBe(false);

    act(() => markFeatureUnsupported(client, DATA_EXPORT_FEATURE));
    expect(result.current).toBe(true);
  });
});
