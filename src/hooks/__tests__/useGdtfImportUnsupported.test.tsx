import { act, renderHook } from '@testing-library/react';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import type { ReactNode } from 'react';
import { useGdtfImportUnsupported } from '../useGdtfImportUnsupported';
import { GDTF_IMPORT_FEATURE, markFeatureUnsupported } from '@/lib/importExport/backendCompat';

describe('useGdtfImportUnsupported', () => {
  it('turns true when the client is marked as lacking GDTF import', () => {
    const client = new ApolloClient({ cache: new InMemoryCache() });
    const other = new ApolloClient({ cache: new InMemoryCache() });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );
    const { result } = renderHook(() => useGdtfImportUnsupported(), { wrapper });
    expect(result.current).toBe(false);

    act(() => markFeatureUnsupported(other, GDTF_IMPORT_FEATURE));
    expect(result.current).toBe(false);

    act(() => markFeatureUnsupported(client, GDTF_IMPORT_FEATURE));
    expect(result.current).toBe(true);
  });
});
