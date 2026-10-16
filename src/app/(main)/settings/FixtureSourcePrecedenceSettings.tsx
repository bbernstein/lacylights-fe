'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_FIXTURE_SOURCE_PRECEDENCE, SET_FIXTURE_SOURCE_PRECEDENCE } from '@/graphql/fixtures';
import { FixtureSource } from '@/types';
import {
  DEFAULT_FIXTURE_SOURCE_PRECEDENCE,
  fixtureSourceDescription,
  fixtureSourceLabel,
  normalizePrecedence,
} from '@/lib/fixtureSources';
import { isUnknownQueryFieldError } from '@/lib/importExport/backendCompat';
import FixtureSourceBadge from '@/components/FixtureSourceBadge';

/** Shown instead of the control when the backend predates fixture sources. */
export const FIXTURE_SOURCE_PRECEDENCE_UNSUPPORTED_MESSAGE =
  "This server version doesn't support fixture source preferences; update LacyLights.";

function sameOrder(a: readonly FixtureSource[], b: readonly FixtureSource[]): boolean {
  return a.length === b.length && a.every((source, i) => source === b[i]);
}

type FocusTarget = { source: FixtureSource; direction: 'up' | 'down' };

/**
 * Settings → Fixture Library → "Fixture source preference".
 *
 * When the same manufacturer + model exists from several sources (built-in,
 * OFL, GDTF, a custom definition, ...), fixture pickers list them in this
 * order and pre-select the first. Reordering uses Move up / Move down buttons
 * (keyboard accessible); "Save order" stores it with
 * `setFixtureSourcePrecedence` and shows the order the server stored.
 */
export default function FixtureSourcePrecedenceSettings() {
  const { data, loading, error } = useQuery<{ fixtureSourcePrecedence: FixtureSource[] }>(
    GET_FIXTURE_SOURCE_PRECEDENCE,
  );
  const [savePrecedence, { loading: saving }] = useMutation<
    { setFixtureSourcePrecedence: FixtureSource[] },
    { order: FixtureSource[] }
  >(SET_FIXTURE_SOURCE_PRECEDENCE, {
    update(cache, { data: result }) {
      if (!result) return;
      // Keep pickers (which read the precedence query) in sync.
      cache.writeQuery({
        query: GET_FIXTURE_SOURCE_PRECEDENCE,
        data: { fixtureSourcePrecedence: result.setFixtureSourcePrecedence },
      });
    },
  });

  const [draft, setDraft] = useState<FixtureSource[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [pendingFocus, setPendingFocus] = useState<FocusTarget | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const stored = normalizePrecedence(data?.fixtureSourcePrecedence);
  const order = draft ?? stored;
  const dirty = draft !== null && !sameOrder(draft, stored);
  const isDefault = sameOrder(order, DEFAULT_FIXTURE_SOURCE_PRECEDENCE);

  // Keep keyboard focus on the moved item. When it reaches the top or bottom
  // its button in that direction is disabled, so focus moves to the other one.
  useEffect(() => {
    if (!pendingFocus) return;
    const index = order.indexOf(pendingFocus.source);
    let direction = pendingFocus.direction;
    if (direction === 'up' && index === 0) direction = 'down';
    if (direction === 'down' && index === order.length - 1) direction = 'up';
    buttonRefs.current.get(`${pendingFocus.source}:${direction}`)?.focus();
    setPendingFocus(null);
  }, [pendingFocus, order]);

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
    setSaveError(null);
    setStatus(`${fixtureSourceLabel(next[target])} moved to position ${target + 1} of ${next.length}.`);
    setPendingFocus({ source: next[target], direction: delta === -1 ? 'up' : 'down' });
  };

  const handleSave = async () => {
    setSaveError(null);
    setStatus('');
    try {
      const result = await savePrecedence({ variables: { order } });
      const savedOrder = result.data?.setFixtureSourcePrecedence;
      setDraft(null);
      setStatus(
        savedOrder
          ? `Saved. Preference order: ${normalizePrecedence(savedOrder).map(fixtureSourceLabel).join(', ')}.`
          : 'Saved.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setSaveError(`Failed to save fixture source preference: ${message}`);
      console.error('Error saving fixture source preference:', err);
    }
  };

  const handleDiscard = () => {
    setDraft(null);
    setSaveError(null);
    setStatus('Changes discarded.');
  };

  const handleResetToDefault = () => {
    setDraft([...DEFAULT_FIXTURE_SOURCE_PRECEDENCE]);
    setSaveError(null);
    setStatus('Default order restored. Save the order to keep it.');
  };

  const header = (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white" id="fixture-source-precedence-heading">
        Fixture source preference
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        When the same fixture model is available from several sources, fixture pickers list them in this order
        and pre-select the first.
      </p>
    </div>
  );

  if (error) {
    const unsupported = isUnknownQueryFieldError(error, 'fixtureSourcePrecedence');
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6" data-testid="fixture-source-precedence">
        {header}
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {unsupported
              ? FIXTURE_SOURCE_PRECEDENCE_UNSUPPORTED_MESSAGE
              : `Error loading fixture source preference: ${error.message}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6" data-testid="fixture-source-precedence">
      {header}

      {loading && !data ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading fixture source preference...</p>
      ) : (
        <>
          <ol className="mt-4 space-y-2" aria-labelledby="fixture-source-precedence-heading">
            {order.map((source, index) => {
              const label = fixtureSourceLabel(source);
              return (
                <li
                  key={source}
                  className="flex items-center gap-3 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2"
                  data-testid="fixture-source-precedence-item"
                  data-source={source}
                >
                  <span className="w-6 text-right text-sm font-medium text-gray-500 dark:text-gray-400" aria-hidden="true">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                      {/* Same badge as in fixture pickers; decorative here (the label is already text) */}
                      <span aria-hidden="true" className="hidden sm:inline-flex">
                        <FixtureSourceBadge source={source} srPrefix={false} />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fixtureSourceDescription(source)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) buttonRefs.current.set(`${source}:up`, el);
                        else buttonRefs.current.delete(`${source}:up`);
                      }}
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || saving}
                      aria-label={`Move ${label} up`}
                      title={`Move ${label} up`}
                      className="min-h-[36px] min-w-[36px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) buttonRefs.current.set(`${source}:down`, el);
                        else buttonRefs.current.delete(`${source}:down`);
                      }}
                      onClick={() => move(index, 1)}
                      disabled={index === order.length - 1 || saving}
                      aria-label={`Move ${label} down`}
                      title={`Move ${label} down`}
                      className="min-h-[36px] min-w-[36px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save order'}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!dirty || saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isDefault || saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to default
            </button>
          </div>
        </>
      )}

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
        {status}
      </p>

      {saveError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{saveError}</p>
        </div>
      )}
    </div>
  );
}
