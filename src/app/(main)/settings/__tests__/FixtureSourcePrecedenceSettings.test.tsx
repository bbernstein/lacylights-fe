import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import FixtureSourcePrecedenceSettings, {
  FIXTURE_SOURCE_PRECEDENCE_UNSUPPORTED_MESSAGE,
} from '../FixtureSourcePrecedenceSettings';
import { GET_FIXTURE_SOURCE_PRECEDENCE, SET_FIXTURE_SOURCE_PRECEDENCE } from '@/graphql/fixtures';
import { FixtureSource } from '@/types';

const DEFAULT = ['USER', 'GDTF', 'OFL', 'BUILTIN', 'EOS', 'SYNTHESIZED'] as FixtureSource[];

const precedenceMock = (order: FixtureSource[]): MockedResponse => ({
  request: { query: GET_FIXTURE_SOURCE_PRECEDENCE },
  result: { data: { fixtureSourcePrecedence: order } },
});

const renderSettings = (mocks: MockedResponse[]) =>
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <FixtureSourcePrecedenceSettings />
    </MockedProvider>,
  );

const listedOrder = () =>
  screen.getAllByTestId('fixture-source-precedence-item').map((li) => li.getAttribute('data-source'));

describe('FixtureSourcePrecedenceSettings', () => {
  it('shows the stored order with labels', async () => {
    renderSettings([precedenceMock(DEFAULT)]);

    expect(screen.getByText('Fixture source preference')).toBeInTheDocument();
    await waitFor(() => expect(listedOrder()).toEqual(DEFAULT));
    const first = screen.getAllByTestId('fixture-source-precedence-item')[0];
    expect(within(first).getByText('Custom', { selector: '.font-medium.text-sm' })).toBeInTheDocument();
    expect(within(first).getByTestId('fixture-source-badge')).toHaveAttribute('data-source', 'USER');
    expect(within(first).getByText('Created or edited by a user')).toBeInTheDocument();
  });

  it('disables moving the first item up and the last item down', async () => {
    renderSettings([precedenceMock(DEFAULT)]);
    await waitFor(() => expect(listedOrder()).toEqual(DEFAULT));

    expect(screen.getByRole('button', { name: 'Move Custom up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Eos ASCII down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save order' })).toBeDisabled();
  });

  it('reorders with the move buttons, keeps focus on the moved item and announces it', async () => {
    renderSettings([precedenceMock(DEFAULT)]);
    await waitFor(() => expect(listedOrder()).toEqual(DEFAULT));

    await userEvent.click(screen.getByRole('button', { name: 'Move OFL up' }));
    expect(listedOrder()).toEqual(['USER', 'OFL', 'GDTF', 'BUILTIN', 'EOS', 'SYNTHESIZED']);
    expect(screen.getByRole('status')).toHaveTextContent('OFL moved to position 2 of 6.');
    expect(screen.getByRole('button', { name: 'Move OFL up' })).toHaveFocus();

    // Reaching the top disables "up", so focus moves to "down".
    await userEvent.click(screen.getByRole('button', { name: 'Move OFL up' }));
    expect(listedOrder()[0]).toBe('OFL');
    expect(screen.getByRole('button', { name: 'Move OFL down' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Move Built-in down' }));
    expect(listedOrder()).toEqual(['OFL', 'USER', 'GDTF', 'EOS', 'BUILTIN', 'SYNTHESIZED']);
    expect(screen.getByRole('button', { name: 'Save order' })).toBeEnabled();
  });

  it('can be operated with the keyboard', async () => {
    renderSettings([precedenceMock(DEFAULT)]);
    await waitFor(() => expect(listedOrder()).toEqual(DEFAULT));

    screen.getByRole('button', { name: 'Move GDTF down' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(listedOrder().slice(0, 3)).toEqual(['USER', 'OFL', 'GDTF']);
    await userEvent.keyboard(' ');
    expect(listedOrder().slice(0, 4)).toEqual(['USER', 'OFL', 'BUILTIN', 'GDTF']);
  });

  it('saves the order and shows the order the server stored', async () => {
    const newOrder = ['OFL', 'USER', 'GDTF', 'BUILTIN', 'EOS', 'SYNTHESIZED'] as FixtureSource[];
    // The server may store a different (completed) order; the UI shows it.
    const storedOrder = ['OFL', 'USER', 'BUILTIN', 'GDTF', 'EOS', 'SYNTHESIZED'] as FixtureSource[];
    const mutationResult = jest.fn(() => ({ data: { setFixtureSourcePrecedence: storedOrder } }));
    renderSettings([
      precedenceMock(DEFAULT),
      {
        request: { query: SET_FIXTURE_SOURCE_PRECEDENCE, variables: { order: newOrder } },
        result: mutationResult,
      },
    ]);
    await waitFor(() => expect(listedOrder()).toEqual(DEFAULT));

    await userEvent.click(screen.getByRole('button', { name: 'Move OFL up' }));
    await userEvent.click(screen.getByRole('button', { name: 'Move OFL up' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save order' }));

    await waitFor(() => expect(mutationResult).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Saved. Preference order: OFL, Custom, Built-in, GDTF, Eos library, Eos ASCII.',
      ),
    );
    expect(listedOrder()).toEqual(storedOrder);
    expect(screen.getByRole('button', { name: 'Save order' })).toBeDisabled();
  });

  it('shows an error when saving fails and keeps the edited order', async () => {
    const newOrder = ['GDTF', 'USER', 'OFL', 'BUILTIN', 'EOS', 'SYNTHESIZED'] as FixtureSource[];
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderSettings([
      precedenceMock(DEFAULT),
      {
        request: { query: SET_FIXTURE_SOURCE_PRECEDENCE, variables: { order: newOrder } },
        result: { errors: [new GraphQLError('duplicate source in order: OFL')] },
      },
    ]);
    await waitFor(() => expect(listedOrder()).toEqual(DEFAULT));

    await userEvent.click(screen.getByRole('button', { name: 'Move GDTF up' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save order' }));

    expect(
      await screen.findByText('Failed to save fixture source preference: duplicate source in order: OFL'),
    ).toBeInTheDocument();
    expect(listedOrder()).toEqual(newOrder);
    expect(screen.getByRole('button', { name: 'Save order' })).toBeEnabled();
    consoleError.mockRestore();
  });

  it('discards changes and resets to the default order', async () => {
    const custom = ['BUILTIN', 'OFL', 'USER', 'GDTF', 'EOS', 'SYNTHESIZED'] as FixtureSource[];
    renderSettings([precedenceMock(custom)]);
    await waitFor(() => expect(listedOrder()).toEqual(custom));

    await userEvent.click(screen.getByRole('button', { name: 'Move OFL up' }));
    expect(listedOrder()[0]).toBe('OFL');
    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(listedOrder()).toEqual(custom);

    await userEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(listedOrder()).toEqual(DEFAULT);
    expect(screen.getByRole('button', { name: 'Reset to default' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save order' })).toBeEnabled();
  });

  it('completes a partial stored order with the missing sources', async () => {
    renderSettings([precedenceMock(['OFL'] as FixtureSource[])]);
    await waitFor(() => expect(listedOrder()).toEqual(['OFL', 'USER', 'GDTF', 'BUILTIN', 'EOS', 'SYNTHESIZED']));
  });

  it('explains when the server does not support fixture sources', async () => {
    renderSettings([
      {
        request: { query: GET_FIXTURE_SOURCE_PRECEDENCE },
        result: { errors: [new GraphQLError('Cannot query field "fixtureSourcePrecedence" on type "Query".')] },
      },
    ]);
    expect(await screen.findByText(FIXTURE_SOURCE_PRECEDENCE_UNSUPPORTED_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();
  });

  it('shows other load errors', async () => {
    renderSettings([{ request: { query: GET_FIXTURE_SOURCE_PRECEDENCE }, error: new Error('Network down') }]);
    expect(await screen.findByText('Error loading fixture source preference: Network down')).toBeInTheDocument();
  });
});
