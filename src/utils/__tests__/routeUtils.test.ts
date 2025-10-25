import { extractDynamicRouteId, extractSceneId, extractCueListId } from '../routeUtils';

describe('routeUtils', () => {
  describe('extractDynamicRouteId', () => {
    describe('when NOT in static export mode', () => {
      it('should return the original id prop when not __dynamic__', () => {
        const result = extractDynamicRouteId('abc123', /\/scenes\/([^\/\?#]+)/);
        expect(result).toBe('abc123');
      });

      it('should return regular id even if window exists', () => {
        const result = extractDynamicRouteId('xyz789', /\/cue-lists\/([^\/\?#]+)/);
        expect(result).toBe('xyz789');
      });
    });

    describe('when in static export mode (idProp === __dynamic__)', () => {
      beforeEach(() => {
        // Reset location before each test
        delete (window as any).location;
      });

      it('should extract id from URL when idProp is __dynamic__', () => {
        (window as any).location = { pathname: '/scenes/my-scene-id-123/edit' };

        const result = extractDynamicRouteId('__dynamic__', /\/scenes\/([^\/\?#]+)/);
        expect(result).toBe('my-scene-id-123');
      });

      it('should return __dynamic__ if pattern does not match URL', () => {
        (window as any).location = { pathname: '/fixtures' };

        const result = extractDynamicRouteId('__dynamic__', /\/scenes\/([^\/\?#]+)/);
        expect(result).toBe('__dynamic__');
      });

      it('should handle complex IDs with dashes and underscores', () => {
        (window as any).location = { pathname: '/cue-lists/cue_list-with-dashes_123' };

        const result = extractDynamicRouteId('__dynamic__', /\/cue-lists\/([^\/\?#]+)/);
        expect(result).toBe('cue_list-with-dashes_123');
      });

      it('should stop at query parameters', () => {
        (window as any).location = { pathname: '/scenes/scene-123?tab=settings' };

        const result = extractDynamicRouteId('__dynamic__', /\/scenes\/([^\/\?#]+)/);
        expect(result).toBe('scene-123');
      });

      it('should stop at hash fragments', () => {
        (window as any).location = { pathname: '/scenes/scene-456#section' };

        const result = extractDynamicRouteId('__dynamic__', /\/scenes\/([^\/\?#]+)/);
        expect(result).toBe('scene-456');
      });

      it('should handle trailing slashes in pathname', () => {
        (window as any).location = { pathname: '/cue-lists/list-789/' };

        const result = extractDynamicRouteId('__dynamic__', /\/cue-lists\/([^\/\?#]+)/);
        expect(result).toBe('list-789');
      });
    });
  });

  describe('extractSceneId', () => {
    beforeEach(() => {
      delete (window as any).location;
    });

    it('should return original id when not in static export mode', () => {
      const result = extractSceneId('scene-abc');
      expect(result).toBe('scene-abc');
    });

    it('should extract scene id from /scenes/:id URL', () => {
      (window as any).location = { pathname: '/scenes/extracted-scene-id' };

      const result = extractSceneId('__dynamic__');
      expect(result).toBe('extracted-scene-id');
    });

    it('should extract scene id from /scenes/:id/edit URL', () => {
      (window as any).location = { pathname: '/scenes/edit-scene-id/edit' };

      const result = extractSceneId('__dynamic__');
      expect(result).toBe('edit-scene-id');
    });

    it('should handle CUID format scene IDs', () => {
      (window as any).location = { pathname: '/scenes/cmggobir40ntk4ipsxdkg2o9y/edit' };

      const result = extractSceneId('__dynamic__');
      expect(result).toBe('cmggobir40ntk4ipsxdkg2o9y');
    });
  });

  describe('extractCueListId', () => {
    beforeEach(() => {
      delete (window as any).location;
    });

    it('should return original id when not in static export mode', () => {
      const result = extractCueListId('cue-list-xyz');
      expect(result).toBe('cue-list-xyz');
    });

    it('should extract cue list id from /cue-lists/:id URL', () => {
      (window as any).location = { pathname: '/cue-lists/extracted-cue-list' };

      const result = extractCueListId('__dynamic__');
      expect(result).toBe('extracted-cue-list');
    });

    it('should handle CUID format cue list IDs', () => {
      (window as any).location = { pathname: '/cue-lists/cm1234567890abcdefghij' };

      const result = extractCueListId('__dynamic__');
      expect(result).toBe('cm1234567890abcdefghij');
    });

    it('should handle /player/:id route pattern', () => {
      (window as any).location = { pathname: '/player/player-cue-list-id' };

      // extractCueListId only handles /cue-lists/ pattern, not /player/
      // This test verifies it doesn't accidentally match wrong patterns
      const result = extractCueListId('__dynamic__');
      expect(result).toBe('__dynamic__'); // Should not match
    });
  });
});
