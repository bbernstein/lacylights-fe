import { FADE_PROGRESS_THRESHOLD, PLAYER_WINDOW, DEFAULT_FADEOUT_TIME } from '../playback';

describe('playback constants', () => {
  describe('FADE_PROGRESS_THRESHOLD', () => {
    it('exports fade progress threshold', () => {
      expect(FADE_PROGRESS_THRESHOLD).toBeDefined();
      expect(typeof FADE_PROGRESS_THRESHOLD).toBe('number');
      expect(FADE_PROGRESS_THRESHOLD).toBe(1);
    });

    it('has reasonable threshold value', () => {
      expect(FADE_PROGRESS_THRESHOLD).toBeGreaterThan(0);
      expect(FADE_PROGRESS_THRESHOLD).toBeLessThanOrEqual(5);
    });
  });

  describe('PLAYER_WINDOW', () => {
    it('exports player window configuration', () => {
      expect(PLAYER_WINDOW).toBeDefined();
      expect(typeof PLAYER_WINDOW).toBe('object');
    });

    it('has required window properties', () => {
      expect(PLAYER_WINDOW.width).toBeDefined();
      expect(PLAYER_WINDOW.height).toBeDefined();
      expect(PLAYER_WINDOW.name).toBeDefined();
      expect(PLAYER_WINDOW.features).toBeDefined();
    });

    it('has valid window dimensions', () => {
      expect(typeof PLAYER_WINDOW.width).toBe('number');
      expect(typeof PLAYER_WINDOW.height).toBe('number');
      expect(PLAYER_WINDOW.width).toBeGreaterThan(0);
      expect(PLAYER_WINDOW.height).toBeGreaterThan(0);
    });

    it('has valid window name and features', () => {
      expect(typeof PLAYER_WINDOW.name).toBe('string');
      expect(typeof PLAYER_WINDOW.features).toBe('string');
      expect(PLAYER_WINDOW.name.length).toBeGreaterThan(0);
      expect(PLAYER_WINDOW.features.length).toBeGreaterThan(0);
    });

    it('contains expected window features', () => {
      expect(PLAYER_WINDOW.features).toContain('resizable=yes');
      expect(PLAYER_WINDOW.features).toContain('toolbar=no');
      expect(PLAYER_WINDOW.features).toContain('menubar=no');
    });
  });

  describe('DEFAULT_FADEOUT_TIME', () => {
    it('exports default fadeout time', () => {
      expect(DEFAULT_FADEOUT_TIME).toBeDefined();
      expect(typeof DEFAULT_FADEOUT_TIME).toBe('number');
      expect(DEFAULT_FADEOUT_TIME).toBe(3);
    });

    it('has reasonable fadeout time', () => {
      expect(DEFAULT_FADEOUT_TIME).toBeGreaterThan(0);
      expect(DEFAULT_FADEOUT_TIME).toBeLessThanOrEqual(10);
    });
  });
});