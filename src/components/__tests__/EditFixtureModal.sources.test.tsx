import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import EditFixtureModal from '../EditFixtureModal';
import {
  GET_MANUFACTURERS,
  GET_MODELS,
  GET_PROJECT_FIXTURES,
  GET_FIXTURE_SOURCE_PRECEDENCE,
} from '../../graphql/fixtures';
import { FixtureInstance, FixtureSource, FixtureType } from '../../types';

jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false),
}));

const fixture = {
  id: 'fixture-1',
  name: 'Aura 1',
  description: '',
  universe: 1,
  startChannel: 1,
  tags: [],
  projectOrder: 1,
  createdAt: '2024-01-01T00:00:00Z',
  definitionId: 'aura-builtin',
  manufacturer: 'Martin',
  model: 'Aura',
  type: FixtureType.MOVING_HEAD,
  modeName: 'Built-in Basic',
  channelCount: 8,
  channels: [],
  project: { id: 'project-1' },
} as unknown as FixtureInstance;

const models = [
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

const modelsMock: MockedResponse = {
  request: { query: GET_MODELS, variables: { manufacturer: 'Martin' } },
  result: { data: { fixtureDefinitions: models } },
};

// GET_MANUFACTURERS and GET_MODELS share the Query.fixtureDefinitions cache
// field for the same manufacturer filter, so the modal can refetch models
// after the manufacturer list lands; provide the models response a few times.
const mocks: MockedResponse[] = [
  modelsMock,
  modelsMock,
  {
    request: { query: GET_PROJECT_FIXTURES, variables: { projectId: 'project-1' } },
    result: { data: { project: { id: 'project-1', fixtures: [] } } },
  },
  {
    request: { query: GET_MANUFACTURERS, variables: { search: 'Martin' } },
    result: { data: { fixtureDefinitions: [{ manufacturer: 'Martin' }] } },
  },
  {
    request: { query: GET_MODELS, variables: { manufacturer: 'Martin' } },
    result: { data: { fixtureDefinitions: models } },
  },
  {
    request: { query: GET_FIXTURE_SOURCE_PRECEDENCE },
    result: { data: { fixtureSourcePrecedence: [FixtureSource.USER, FixtureSource.BUILTIN] } },
  },
];

const renderModal = () =>
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <EditFixtureModal isOpen onClose={jest.fn()} fixture={fixture} onFixtureUpdated={jest.fn()} />
    </MockedProvider>,
  );

describe('EditFixtureModal fixture sources', () => {
  it("keeps the fixture's own definition selected even when another source is preferred", async () => {
    renderModal();

    const source = await screen.findByTestId('selected-model-source');
    expect(within(source).getByTestId('fixture-source-badge')).toHaveAttribute('data-source', 'BUILTIN');
    expect(source).toHaveTextContent('2 sources available');
  });

  it('lists entries by precedence and switches to the picked entry', async () => {
    renderModal();
    await screen.findByTestId('selected-model-source');

    await userEvent.click(screen.getByLabelText('Model'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aura Preferred Source: Custom' })).toBeInTheDocument();
    });
    const entries = screen.getAllByRole('button', { name: /^Aura/ });
    expect(entries.map((b) => b.textContent)).toEqual(['AuraPreferredSource: Custom', 'AuraSource: Built-in']);

    await userEvent.click(entries[0]);
    await waitFor(() => {
      const source = screen.getByTestId('selected-model-source');
      expect(within(source).getByTestId('fixture-source-badge')).toHaveAttribute('data-source', 'USER');
    });
    expect(screen.getByRole('option', { name: 'My Mode (10 channels)' })).toBeInTheDocument();
  });
});
