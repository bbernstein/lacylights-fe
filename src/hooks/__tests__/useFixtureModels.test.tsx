import { act, renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import type { ReactNode } from 'react';
import { useFixtureModels } from '../useFixtureModels';
import { useFixtureSourcePrecedence } from '../useFixtureSourcePrecedence';
import { GET_FIXTURE_SOURCE_PRECEDENCE, GET_MODELS, GET_MODELS_LEGACY } from '@/graphql/fixtures';
import { DEFAULT_FIXTURE_SOURCE_PRECEDENCE } from '@/lib/fixtureSources';

const legacyDefs = (model: string) => [{ id: `${model}-id`, model, modes: [] }];

const unknownSourceError = (manufacturer: string): MockedResponse => ({
  request: { query: GET_MODELS, variables: { manufacturer } },
  result: { errors: [new GraphQLError('Cannot query field "source" on type "FixtureDefinition".')] },
});

const legacyMock = (manufacturer: string, model: string): MockedResponse => ({
  request: { query: GET_MODELS_LEGACY, variables: { manufacturer } },
  result: { data: { fixtureDefinitions: legacyDefs(model) } },
});

function wrapperFor(mocks: MockedResponse[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };
}

describe('useFixtureModels', () => {
  it('loads models with sources and calls onCompleted', async () => {
    const onCompleted = jest.fn();
    const defs = [{ id: 'a', model: 'Aura', source: 'OFL', sourceVersion: null, modes: [] }];
    const { result } = renderHook(() => useFixtureModels({ onCompleted }), {
      wrapper: wrapperFor([
        { request: { query: GET_MODELS, variables: { manufacturer: 'Martin' } }, result: { data: { fixtureDefinitions: defs } } },
      ]),
    });

    act(() => {
      void result.current.loadModels({ variables: { manufacturer: 'Martin' } });
    });
    await waitFor(() => expect(result.current.models).toEqual(defs));
    expect(onCompleted).toHaveBeenCalledWith(defs);
  });

  it('falls back to the legacy query and remembers that for later loads', async () => {
    const legacySecond = jest.fn(() => ({ data: { fixtureDefinitions: legacyDefs('Par') } }));
    const { result } = renderHook(() => useFixtureModels(), {
      wrapper: wrapperFor([
        unknownSourceError('Martin'),
        legacyMock('Martin', 'Aura'),
        // A second GET_MODELS for Chauvet would fail the test (no mock); the
        // hook must go straight to the legacy query.
        { request: { query: GET_MODELS_LEGACY, variables: { manufacturer: 'Chauvet' } }, result: legacySecond },
      ]),
    });

    act(() => {
      void result.current.loadModels({ variables: { manufacturer: 'Martin' } });
    });
    await waitFor(() => expect(result.current.models).toEqual(legacyDefs('Aura')));

    act(() => {
      void result.current.loadModels({ variables: { manufacturer: 'Chauvet' } });
    });
    await waitFor(() => expect(result.current.models).toEqual(legacyDefs('Par')));
    expect(legacySecond).toHaveBeenCalled();
  });

  it('does not fall back on other errors', async () => {
    const legacy = jest.fn(() => ({ data: { fixtureDefinitions: legacyDefs('Aura') } }));
    const { result } = renderHook(() => useFixtureModels(), {
      wrapper: wrapperFor([
        { request: { query: GET_MODELS, variables: { manufacturer: 'Martin' } }, error: new Error('offline') },
        { request: { query: GET_MODELS_LEGACY, variables: { manufacturer: 'Martin' } }, result: legacy },
      ]),
    });

    act(() => {
      void result.current.loadModels({ variables: { manufacturer: 'Martin' } });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(legacy).not.toHaveBeenCalled();
    expect(result.current.models).toEqual([]);
  });
});

describe('useFixtureSourcePrecedence', () => {
  it('returns the default order when skipped', () => {
    const { result } = renderHook(() => useFixtureSourcePrecedence({ skip: true }), { wrapper: wrapperFor([]) });
    expect(result.current.precedence).toEqual([...DEFAULT_FIXTURE_SOURCE_PRECEDENCE]);
    expect(result.current.loading).toBe(false);
  });

  it('returns the stored order, completed with missing sources', async () => {
    const { result } = renderHook(() => useFixtureSourcePrecedence(), {
      wrapper: wrapperFor([
        { request: { query: GET_FIXTURE_SOURCE_PRECEDENCE }, result: { data: { fixtureSourcePrecedence: ['BUILTIN'] } } },
      ]),
    });
    await waitFor(() =>
      expect(result.current.precedence).toEqual(['BUILTIN', 'USER', 'GDTF', 'OFL', 'EOS', 'SYNTHESIZED']),
    );
  });
});
