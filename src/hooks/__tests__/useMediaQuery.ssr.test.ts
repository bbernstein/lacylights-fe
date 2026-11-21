/**
 * @jest-environment node
 */
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useMediaQuery } from '../useMediaQuery';

// Runs in the node environment so `window` is genuinely undefined (jsdom on
// Node >= 24 forbids `delete global.window`). Rendering via react-dom/server
// is the real SSR path, and needs no DOM.
describe('useMediaQuery SSR safety', () => {
  it('should return false when window is undefined (SSR)', () => {
    expect(typeof window).toBe('undefined');

    function Probe() {
      return createElement('span', null, String(useMediaQuery('(max-width: 767px)')));
    }

    expect(renderToString(createElement(Probe))).toContain('false');
  });
});
