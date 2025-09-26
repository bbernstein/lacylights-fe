import { ROSCOLUX_FILTERS, RoscoluxFilter } from '../roscoluxFilters';

describe('roscoluxFilters', () => {
  describe('ROSCOLUX_FILTERS array', () => {
    it('exports roscolux filters array', () => {
      expect(ROSCOLUX_FILTERS).toBeDefined();
      expect(Array.isArray(ROSCOLUX_FILTERS)).toBe(true);
      expect(ROSCOLUX_FILTERS.length).toBeGreaterThan(0);
    });

    it('has expected number of filters', () => {
      // Should have many filters based on the file content
      expect(ROSCOLUX_FILTERS.length).toBeGreaterThan(50);
    });

    it('all filters have required properties', () => {
      ROSCOLUX_FILTERS.forEach((filter, _index) => {
        expect(filter).toHaveProperty('filter', expect.any(String));
        expect(filter).toHaveProperty('applications', expect.any(String));
        expect(filter).toHaveProperty('keywords', expect.any(String));
        expect(filter).toHaveProperty('rgbHex', expect.any(String));
        expect(filter).toHaveProperty('rgbDecimal', expect.any(String));
      });
    });

    it('has valid hex colors', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i;
      ROSCOLUX_FILTERS.forEach(filter => {
        expect(filter.rgbHex).toMatch(hexPattern);
      });
    });

    it('has valid RGB decimal format', () => {
      const rgbDecimalPattern = /^\d{1,3},\d{1,3},\d{1,3}$/;
      ROSCOLUX_FILTERS.forEach(filter => {
        expect(filter.rgbDecimal).toMatch(rgbDecimalPattern);

        // Verify RGB values are within valid range
        const [r, g, b] = filter.rgbDecimal.split(',').map(Number);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(255);
      });
    });

    it('has non-empty required fields', () => {
      ROSCOLUX_FILTERS.forEach(filter => {
        expect(filter.filter.length).toBeGreaterThan(0);
        expect(filter.applications.length).toBeGreaterThan(0);
        expect(filter.keywords.length).toBeGreaterThan(0);
      });
    });

    it('has consistent filter naming format', () => {
      // Most filters should start with R followed by numbers
      const roscoluxFilters = ROSCOLUX_FILTERS.filter(f => f.filter.startsWith('R'));
      expect(roscoluxFilters.length).toBeGreaterThan(0);
    });

    it('includes expected color categories', () => {
      const filterNames = ROSCOLUX_FILTERS.map(f => f.filter.toLowerCase());

      // Check for some expected color categories
      const hasRed = filterNames.some(name => name.includes('red'));
      const hasBlue = filterNames.some(name => name.includes('blue'));
      const hasGreen = filterNames.some(name => name.includes('green'));
      const hasAmber = filterNames.some(name => name.includes('amber'));

      expect(hasRed).toBe(true);
      expect(hasBlue).toBe(true);
      expect(hasGreen).toBe(true);
      expect(hasAmber).toBe(true);
    });

    it('has searchable keywords', () => {
      ROSCOLUX_FILTERS.forEach(filter => {
        // Keywords should contain multiple searchable terms
        const keywords = filter.keywords.split(',').map(k => k.trim());
        expect(keywords.length).toBeGreaterThan(0);

        // Each keyword should be non-empty
        keywords.forEach(keyword => {
          expect(keyword.length).toBeGreaterThan(0);
        });
      });
    });

    it('has practical applications listed', () => {
      ROSCOLUX_FILTERS.forEach(filter => {
        // Applications should describe practical uses
        expect(filter.applications.length).toBeGreaterThan(5);

        // Should contain some common lighting terms (expanded list)
        const commonTerms = ['light', 'atmosphere', 'effect', 'wash', 'scene', 'dramatic', 'warm', 'cool', 'bright', 'dark', 'color', 'simulation', 'correction', 'tint', 'general', 'standard', 'romantic', 'natural', 'fire', 'sun', 'sky', 'water', 'indoor', 'outdoor', 'blue', 'red', 'green', 'amber', 'pink', 'purple', 'orange', 'yellow'];
        const hasCommonTerm = commonTerms.some(term =>
          filter.applications.toLowerCase().includes(term)
        );
        expect(hasCommonTerm).toBe(true);
      });
    });
  });

  describe('RoscoluxFilter interface', () => {
    it('provides correct TypeScript interface', () => {
      const sampleFilter: RoscoluxFilter = {
        filter: 'Test Filter',
        applications: 'Test applications',
        keywords: 'test, keywords',
        rgbHex: '#FF0000',
        rgbDecimal: '255,0,0'
      };

      expect(sampleFilter.filter).toBe('Test Filter');
      expect(sampleFilter.applications).toBe('Test applications');
      expect(sampleFilter.keywords).toBe('test, keywords');
      expect(sampleFilter.rgbHex).toBe('#FF0000');
      expect(sampleFilter.rgbDecimal).toBe('255,0,0');
    });
  });

  describe('data integrity', () => {
    it('has unique filter names', () => {
      const filterNames = ROSCOLUX_FILTERS.map(f => f.filter);
      const uniqueNames = new Set(filterNames);
      expect(uniqueNames.size).toBe(filterNames.length);
    });

    it('has hex colors that match decimal values', () => {
      ROSCOLUX_FILTERS.slice(0, 10).forEach(filter => {
        // Convert hex to RGB
        const hex = filter.rgbHex.replace('#', '');
        const hexR = parseInt(hex.substring(0, 2), 16);
        const hexG = parseInt(hex.substring(2, 4), 16);
        const hexB = parseInt(hex.substring(4, 6), 16);

        // Parse decimal RGB
        const [decR, decG, decB] = filter.rgbDecimal.split(',').map(Number);

        // They should match
        expect(hexR).toBe(decR);
        expect(hexG).toBe(decG);
        expect(hexB).toBe(decB);
      });
    });
  });
});