import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import AddFixtureModal from '../AddFixtureModal';
import {
  GET_MODELS,
  GET_MODELS_LEGACY,
  GET_PROJECT_FIXTURES,
  GET_FIXTURE_SOURCE_PRECEDENCE,
} from '../../graphql/fixtures';
import { FixtureSource } from '../../types';

jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false),
}));

const PROJECT_ID = 'project-1';

// One model ("Aura") from three sources plus an unrelated model, in the
// order the backend might return them.
const auraModels = [
  {
    id: 'aura-ofl',
    model: 'Aura',
    source: FixtureSource.OFL,
    sourceVersion: '2024-05',
    modes: [{ id: 'ofl-mode', name: 'OFL Standard', channelCount: 14 }],
  },
  {
    id: 'par-builtin',
    model: 'Par',
    source: FixtureSource.BUILTIN,
    sourceVersion: null,
    modes: [{ id: 'par-mode', name: 'RGB', channelCount: 3 }],
  },
  {
    id: 'aura-builtin',
    model: 'Aura',
    source: FixtureSource.BUILTIN,
    sourceVersion: null,
    modes: [{ id: 'builtin-mode', name: 'Built-in Basic', channelCount: 8 }],
  },
  {
    id: 'aura-user',
    model: 'Aura',
    source: FixtureSource.USER,
    sourceVersion: null,
    modes: [{ id: 'user-mode', name: 'My Mode', channelCount: 10 }],
  },
];

const projectFixturesMock: MockedResponse = {
  request: { query: GET_PROJECT_FIXTURES, variables: { projectId: PROJECT_ID } },
  result: { data: { project: { id: PROJECT_ID, fixtures: [] } } },
};

const modelsMock = (fixtureDefinitions: unknown[]): MockedResponse => ({
  request: { query: GET_MODELS, variables: { manufacturer: 'Martin' } },
  result: { data: { fixtureDefinitions } },
});

const precedenceMock = (order: FixtureSource[]): MockedResponse => ({
  request: { query: GET_FIXTURE_SOURCE_PRECEDENCE },
  result: { data: { fixtureSourcePrecedence: order } },
});

const renderModal = (mocks: MockedResponse[], props: Record<string, unknown> = {}) =>
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AddFixtureModal
        isOpen
        onClose={jest.fn()}
        projectId={PROJECT_ID}
        onFixtureAdded={jest.fn()}
        initialManufacturer="Martin"
        {...props}
      />
    </MockedProvider>,
  );

const optionButtons = () => {
  const modelInput = screen.getByLabelText('Model');
  const dropdown = modelInput.parentElement!.querySelector('div.absolute') as HTMLElement;
  return within(dropdown).getAllByRole('button');
};

describe('AddFixtureModal fixture sources', () => {
  it('lists same-model definitions by stored precedence with source badges', async () => {
    renderModal([
      projectFixturesMock,
      modelsMock(auraModels),
      precedenceMock([FixtureSource.BUILTIN, FixtureSource.OFL, FixtureSource.USER]),
    ]);

    await userEvent.click(screen.getByLabelText('Model'));

    await waitFor(() => {
      expect(optionButtons().map((b) => b.textContent)).toEqual([
        'AuraPreferredSource: Built-in',
        'AuraSource: OFL',
        'AuraSource: Custom',
        'ParSource: Built-in',
      ]);
    });
  });

  it('uses the default precedence when the precedence query fails', async () => {
    renderModal([
      projectFixturesMock,
      modelsMock(auraModels),
      { request: { query: GET_FIXTURE_SOURCE_PRECEDENCE }, error: new Error('boom') },
    ]);

    await userEvent.click(screen.getByLabelText('Model'));

    // Default: USER, GDTF, OFL, BUILTIN, ...
    await waitFor(() => {
      expect(optionButtons().map((b) => b.textContent)).toEqual([
        'AuraPreferredSource: Custom',
        'AuraSource: OFL',
        'AuraSource: Built-in',
        'ParSource: Built-in',
      ]);
    });
  });

  it('pre-selects the highest-precedence definition for a model name', async () => {
    renderModal(
      [
        projectFixturesMock,
        modelsMock(auraModels),
        precedenceMock([FixtureSource.OFL, FixtureSource.USER, FixtureSource.BUILTIN]),
      ],
      { initialModel: 'Aura' },
    );

    await waitFor(() => {
      const source = screen.getByTestId('selected-model-source');
      expect(within(source).getByTestId('fixture-source-badge')).toHaveAttribute('data-source', 'OFL');
    });
    expect(screen.getByTestId('selected-model-source')).toHaveTextContent('3 sources available');
    // Modes come from the pre-selected (OFL) definition
    expect(screen.getByRole('option', { name: 'OFL Standard (14 channels)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /My Mode/ })).not.toBeInTheDocument();
  });

  it('selects the specific entry the user picks', async () => {
    renderModal([
      projectFixturesMock,
      modelsMock(auraModels),
      precedenceMock([FixtureSource.USER, FixtureSource.OFL, FixtureSource.BUILTIN]),
    ]);

    await userEvent.click(screen.getByLabelText('Model'));
    await waitFor(() => expect(optionButtons()[0]).toHaveTextContent('Custom'));
    await userEvent.click(screen.getByRole('button', { name: 'Aura Source: Built-in' }));

    const source = await screen.findByTestId('selected-model-source');
    expect(within(source).getByTestId('fixture-source-badge')).toHaveAttribute('data-source', 'BUILTIN');
    expect(screen.getByLabelText('Model')).toHaveValue('Aura');
    expect(screen.getByRole('option', { name: 'Built-in Basic (8 channels)' })).toBeInTheDocument();
  });

  it('does not fetch the precedence when no model has several sources', async () => {
    const precedenceResult = jest.fn(() => ({ data: { fixtureSourcePrecedence: [FixtureSource.OFL] } }));
    renderModal(
      [
        projectFixturesMock,
        modelsMock([auraModels[0], auraModels[1]]),
        { request: { query: GET_FIXTURE_SOURCE_PRECEDENCE }, result: precedenceResult },
      ],
      { initialModel: 'Par' },
    );

    const source = await screen.findByTestId('selected-model-source');
    expect(within(source).getByTestId('fixture-source-badge')).toHaveAttribute('data-source', 'BUILTIN');
    expect(source).not.toHaveTextContent('sources available');
    expect(precedenceResult).not.toHaveBeenCalled();
  });

  it('falls back to the legacy model query on backends without fixture sources', async () => {
    renderModal(
      [
        projectFixturesMock,
        {
          request: { query: GET_MODELS, variables: { manufacturer: 'Martin' } },
          result: {
            errors: [new GraphQLError('Cannot query field "source" on type "FixtureDefinition".')],
          },
        },
        {
          request: { query: GET_MODELS_LEGACY, variables: { manufacturer: 'Martin' } },
          result: {
            data: {
              fixtureDefinitions: [
                { id: 'old-1', model: 'Aura', modes: [{ id: 'old-mode', name: 'Std', channelCount: 14 }] },
              ],
            },
          },
        },
      ],
      { initialModel: 'Aura' },
    );

    expect(await screen.findByRole('option', { name: 'Std (14 channels)' })).toBeInTheDocument();
    expect(screen.queryByTestId('selected-model-source')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fixture-source-badge')).not.toBeInTheDocument();
  });
});
