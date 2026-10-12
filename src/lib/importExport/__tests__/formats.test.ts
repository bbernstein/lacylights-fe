import {
  PROJECT_FORMATS,
  PROJECT_FORMAT_LIST,
  acceptForImportFormat,
  detectFormatFromFilename,
  formatDisplayName,
  resolveImportFormat,
} from '../formats';

describe('importExport/formats', () => {
  describe('detectFormatFromFilename', () => {
    it.each([
      ['show.json', 'lacylights'],
      ['show.qxw', 'qlcplus'],
      ['show.asc', 'eos'],
      ['SHOW.ASC', 'eos'],
      ['My.Show.QXW', 'qlcplus'],
      ['backup.JSON', 'lacylights'],
    ])('detects %s as %s', (filename, expected) => {
      expect(detectFormatFromFilename(filename)).toBe(expected);
    });

    it.each(['show.txt', 'show', 'show.json.bak', ''])('returns null for %p', (filename) => {
      expect(detectFormatFromFilename(filename)).toBeNull();
    });
  });

  describe('resolveImportFormat', () => {
    it('auto-detects by default', () => {
      expect(resolveImportFormat('a.asc')).toBe('eos');
      expect(resolveImportFormat('a.qxw', 'auto')).toBe('qlcplus');
    });

    it('returns null when auto-detection fails', () => {
      expect(resolveImportFormat('a.txt', 'auto')).toBeNull();
    });

    it('lets an explicit format override the extension', () => {
      expect(resolveImportFormat('a.txt', 'eos')).toBe('eos');
      expect(resolveImportFormat('a.json', 'qlcplus')).toBe('qlcplus');
      expect(resolveImportFormat('a.asc', 'lacylights')).toBe('lacylights');
    });
  });

  describe('acceptForImportFormat', () => {
    it('accepts all extensions for auto', () => {
      expect(acceptForImportFormat('auto')).toBe('.json,.qxw,.asc');
    });

    it('accepts a single extension for an explicit format', () => {
      expect(acceptForImportFormat('lacylights')).toBe('.json');
      expect(acceptForImportFormat('qlcplus')).toBe('.qxw');
      expect(acceptForImportFormat('eos')).toBe('.asc');
    });
  });

  describe('format metadata', () => {
    it('formats display names with the extension', () => {
      expect(formatDisplayName('lacylights')).toBe('LacyLights (.json)');
      expect(formatDisplayName('qlcplus')).toBe('QLC+ (.qxw)');
      expect(formatDisplayName('eos')).toBe('ETC Eos ASCII (.asc)');
    });

    it('lists every format once, LacyLights first', () => {
      expect(PROJECT_FORMAT_LIST.map((f) => f.id)).toEqual(['lacylights', 'qlcplus', 'eos']);
      for (const f of PROJECT_FORMAT_LIST) {
        expect(PROJECT_FORMATS[f.id]).toBe(f);
        expect(f.description.length).toBeGreaterThan(0);
      }
    });

    it('uses the expected MIME types', () => {
      expect(PROJECT_FORMATS.lacylights.mimeType).toBe('application/json');
      expect(PROJECT_FORMATS.qlcplus.mimeType).toBe('application/xml');
      expect(PROJECT_FORMATS.eos.mimeType).toBe('text/plain');
    });
  });
});
