import { extractDynamicRouteId, extractLookId, extractCueListId } from '../routeUtils';

describe('routeUtils', () => {
  describe('extractDynamicRouteId', () => {
    describe('when NOT in static export mode', () => {
      it('should return the original id prop when not __dynamic__', () => {
        const result = extractDynamicRouteId('abc123', /\/looks\/([^\/\?#]+)/);
        expect(result).toBe('abc123');
      });

      it('should return regular id even if window exists', () => {
        const result = extractDynamicRouteId('xyz789', /\/cue-lists\/([^\/\?#]+)/);
        expect(result).toBe('xyz789');
      });
    });

    // Note: The following tests are skipped due to JSDOM limitations with window.location mocking.
    // JSDOM does not allow window.location to be deleted or redefined, making it impossible to
    // properly test static export mode behavior. These tests should be covered by E2E tests instead.
    describe.skip('when in static export mode (idProp === __dynamic__)', () => {
      let originalLocation: Location;
      let locationDescriptor: PropertyDescriptor | undefined;

      beforeEach(() => {
        originalLocation = window.location;
        locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
        delete (window as { location?: Location }).location;
      });

      afterEach(() => {
        if (locationDescriptor) {
          Object.defineProperty(window, 'location', locationDescriptor);
        } else {
          (window as { location?: Location }).location = originalLocation;
        }
      });

      it('should extract id from URL when idProp is __dynamic__', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/looks/my-look-id-123/edit' },
          writable: true,
          configurable: true,
        });

        const result = extractDynamicRouteId('__dynamic__', /\/looks\/([^\/\?#]+)/);
        expect(result).toBe('my-look-id-123');
      });

      it('should return __dynamic__ if pattern does not match URL', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/fixtures' },
          writable: true,
          configurable: true,
        });

        const result = extractDynamicRouteId('__dynamic__', /\/looks\/([^\/\?#]+)/);
        expect(result).toBe('__dynamic__');
      });

      it('should handle complex IDs with dashes and underscores', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/cue-lists/cue_list-with-dashes_123' },
          writable: true,
          configurable: true,
        });

        const result = extractDynamicRouteId('__dynamic__', /\/cue-lists\/([^\/\?#]+)/);
        expect(result).toBe('cue_list-with-dashes_123');
      });

      it('should stop at query parameters', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/looks/look-123?tab=settings' },
          writable: true,
          configurable: true,
        });

        const result = extractDynamicRouteId('__dynamic__', /\/looks\/([^\/\?#]+)/);
        expect(result).toBe('look-123');
      });

      it('should stop at hash fragments', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/looks/look-456#section' },
          writable: true,
          configurable: true,
        });

        const result = extractDynamicRouteId('__dynamic__', /\/looks\/([^\/\?#]+)/);
        expect(result).toBe('look-456');
      });

      it('should handle trailing slashes in pathname', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/cue-lists/list-789/' },
          writable: true,
          configurable: true,
        });

        const result = extractDynamicRouteId('__dynamic__', /\/cue-lists\/([^\/\?#]+)/);
        expect(result).toBe('list-789');
      });
    });
  });

  // Note: Tests for static export mode are skipped due to JSDOM limitations with window.location mocking.
  describe('extractLookId', () => {
    it('should return original id when not in static export mode', () => {
      const result = extractLookId('look-abc');
      expect(result).toBe('look-abc');
    });

    describe.skip('static export mode tests (skipped due to JSDOM limitations)', () => {
      let originalLocation: Location;
      let locationDescriptor: PropertyDescriptor | undefined;

      beforeEach(() => {
        originalLocation = window.location;
        locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
        delete (window as { location?: Location }).location;
      });

      afterEach(() => {
        if (locationDescriptor) {
          Object.defineProperty(window, 'location', locationDescriptor);
        } else {
          (window as { location?: Location }).location = originalLocation;
        }
      });

      it('should extract look id from /looks/:id URL', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/looks/extracted-look-id' },
          writable: true,
          configurable: true,
        });

        const result = extractLookId('__dynamic__');
        expect(result).toBe('extracted-look-id');
      });

      it('should extract look id from /looks/:id/edit URL', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/looks/edit-look-id/edit' },
          writable: true,
          configurable: true,
        });

        const result = extractLookId('__dynamic__');
        expect(result).toBe('edit-look-id');
      });

      it('should handle CUID format look IDs', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/looks/cmggobir40ntk4ipsxdkg2o9y/edit' },
          writable: true,
          configurable: true,
        });

        const result = extractLookId('__dynamic__');
        expect(result).toBe('cmggobir40ntk4ipsxdkg2o9y');
      });
    });
  });

  // Note: Tests for static export mode are skipped due to JSDOM limitations with window.location mocking.
  describe('extractCueListId', () => {
    it('should return original id when not in static export mode', () => {
      const result = extractCueListId('cue-list-xyz');
      expect(result).toBe('cue-list-xyz');
    });

    describe.skip('static export mode tests (skipped due to JSDOM limitations)', () => {
      let originalLocation: Location;
      let locationDescriptor: PropertyDescriptor | undefined;

      beforeEach(() => {
        originalLocation = window.location;
        locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
        delete (window as { location?: Location }).location;
      });

      afterEach(() => {
        if (locationDescriptor) {
          Object.defineProperty(window, 'location', locationDescriptor);
        } else {
          (window as { location?: Location }).location = originalLocation;
        }
      });

      it('should extract cue list id from /cue-lists/:id URL', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/cue-lists/extracted-cue-list' },
          writable: true,
          configurable: true,
        });

        const result = extractCueListId('__dynamic__');
        expect(result).toBe('extracted-cue-list');
      });

      it('should handle CUID format cue list IDs', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/cue-lists/cm1234567890abcdefghij' },
          writable: true,
          configurable: true,
        });

        const result = extractCueListId('__dynamic__');
        expect(result).toBe('cm1234567890abcdefghij');
      });

      it('should handle /player/:id route pattern', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/player/player-cue-list-id' },
          writable: true,
          configurable: true,
        });

        // extractCueListId only handles /cue-lists/ pattern, not /player/
        // This test verifies it doesn't accidentally match wrong patterns
        const result = extractCueListId('__dynamic__');
        expect(result).toBe('__dynamic__'); // Should not match
      });
    });
  });
});
