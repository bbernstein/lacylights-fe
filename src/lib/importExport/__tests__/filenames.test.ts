import {
  MAX_FILENAME_LENGTH,
  buildProjectExportFilename,
  projectNameFromFilename,
  sanitizeFilename,
} from '../filenames';

describe('importExport/filenames', () => {
  describe('sanitizeFilename', () => {
    it('keeps ordinary names', () => {
      expect(sanitizeFilename('My Show')).toBe('My Show');
    });

    it('replaces invalid and path characters with dashes', () => {
      expect(sanitizeFilename('a/b\\c?d%e*f:g|h"i<j>k')).toBe('a-b-c-d-e-f-g-h-i-j-k');
    });

    it('collapses repeated dots and strips leading dots', () => {
      expect(sanitizeFilename('..hidden...name')).toBe('hidden.name');
    });

    it('trims surrounding whitespace', () => {
      expect(sanitizeFilename('  spaced  ')).toBe('spaced');
    });

    it('falls back to "untitled" when nothing is left', () => {
      expect(sanitizeFilename('')).toBe('untitled');
      expect(sanitizeFilename('...')).toBe('untitled');
      expect(sanitizeFilename('   ')).toBe('untitled');
    });

    it('truncates very long names', () => {
      const long = 'x'.repeat(400);
      expect(sanitizeFilename(long)).toHaveLength(MAX_FILENAME_LENGTH);
    });
  });

  describe('buildProjectExportFilename', () => {
    it('uses the format extension', () => {
      expect(buildProjectExportFilename('Show', 'lacylights')).toBe('Show.json');
      expect(buildProjectExportFilename('Show', 'qlcplus')).toBe('Show.qxw');
      expect(buildProjectExportFilename('Show', 'eos')).toBe('Show.asc');
    });

    it('sanitizes the project name', () => {
      expect(buildProjectExportFilename('Act 1/2', 'eos')).toBe('Act 1-2.asc');
    });
  });

  describe('projectNameFromFilename', () => {
    it('strips the given format extension case-insensitively', () => {
      expect(projectNameFromFilename('show.asc', 'eos')).toBe('show');
      expect(projectNameFromFilename('Show.ASC', 'eos')).toBe('Show');
    });

    it('leaves the name alone when the extension does not match', () => {
      expect(projectNameFromFilename('show.txt', 'eos')).toBe('show.txt');
    });

    it('strips any extension when no format is given', () => {
      expect(projectNameFromFilename('my.show.qxw')).toBe('my.show');
      expect(projectNameFromFilename('noext')).toBe('noext');
    });
  });
});
