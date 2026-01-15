import { DocumentNode } from 'graphql';
import {
  EFFECT_FIXTURE_FRAGMENT,
  EFFECT_FRAGMENT,
  EFFECT_WITH_FIXTURES_FRAGMENT,
  GET_EFFECTS,
  GET_EFFECT,
  GET_MODULATOR_STATUS,
  CREATE_EFFECT,
  UPDATE_EFFECT,
  DELETE_EFFECT,
  ADD_FIXTURE_TO_EFFECT,
  REMOVE_FIXTURE_FROM_EFFECT,
  UPDATE_EFFECT_FIXTURE,
  EFFECT_CHANNEL_FRAGMENT,
  ADD_CHANNEL_TO_EFFECT_FIXTURE,
  UPDATE_EFFECT_CHANNEL,
  REMOVE_CHANNEL_FROM_EFFECT_FIXTURE,
  ADD_EFFECT_TO_CUE,
  REMOVE_EFFECT_FROM_CUE,
  ACTIVATE_EFFECT,
  STOP_EFFECT,
  ACTIVATE_BLACKOUT,
  RELEASE_BLACKOUT,
  SET_GRAND_MASTER,
} from '../effects';

describe('effects graphql', () => {
  // Helper to check if something is a valid GraphQL DocumentNode
  const isDocumentNode = (doc: DocumentNode): boolean => {
    return doc.kind === 'Document' && Array.isArray(doc.definitions);
  };

  describe('fragments', () => {
    it('exports EFFECT_FIXTURE_FRAGMENT', () => {
      expect(EFFECT_FIXTURE_FRAGMENT).toBeDefined();
      expect(isDocumentNode(EFFECT_FIXTURE_FRAGMENT)).toBe(true);
    });

    it('exports EFFECT_FRAGMENT', () => {
      expect(EFFECT_FRAGMENT).toBeDefined();
      expect(isDocumentNode(EFFECT_FRAGMENT)).toBe(true);
    });

    it('exports EFFECT_WITH_FIXTURES_FRAGMENT', () => {
      expect(EFFECT_WITH_FIXTURES_FRAGMENT).toBeDefined();
      expect(isDocumentNode(EFFECT_WITH_FIXTURES_FRAGMENT)).toBe(true);
    });

    it('exports EFFECT_CHANNEL_FRAGMENT', () => {
      expect(EFFECT_CHANNEL_FRAGMENT).toBeDefined();
      expect(isDocumentNode(EFFECT_CHANNEL_FRAGMENT)).toBe(true);
    });
  });

  describe('queries', () => {
    it('exports GET_EFFECTS', () => {
      expect(GET_EFFECTS).toBeDefined();
      expect(isDocumentNode(GET_EFFECTS)).toBe(true);
    });

    it('exports GET_EFFECT', () => {
      expect(GET_EFFECT).toBeDefined();
      expect(isDocumentNode(GET_EFFECT)).toBe(true);
    });

    it('exports GET_MODULATOR_STATUS', () => {
      expect(GET_MODULATOR_STATUS).toBeDefined();
      expect(isDocumentNode(GET_MODULATOR_STATUS)).toBe(true);
    });
  });

  describe('effect CRUD mutations', () => {
    it('exports CREATE_EFFECT', () => {
      expect(CREATE_EFFECT).toBeDefined();
      expect(isDocumentNode(CREATE_EFFECT)).toBe(true);
    });

    it('exports UPDATE_EFFECT', () => {
      expect(UPDATE_EFFECT).toBeDefined();
      expect(isDocumentNode(UPDATE_EFFECT)).toBe(true);
    });

    it('exports DELETE_EFFECT', () => {
      expect(DELETE_EFFECT).toBeDefined();
      expect(isDocumentNode(DELETE_EFFECT)).toBe(true);
    });
  });

  describe('effect-fixture association mutations', () => {
    it('exports ADD_FIXTURE_TO_EFFECT', () => {
      expect(ADD_FIXTURE_TO_EFFECT).toBeDefined();
      expect(isDocumentNode(ADD_FIXTURE_TO_EFFECT)).toBe(true);
    });

    it('exports REMOVE_FIXTURE_FROM_EFFECT', () => {
      expect(REMOVE_FIXTURE_FROM_EFFECT).toBeDefined();
      expect(isDocumentNode(REMOVE_FIXTURE_FROM_EFFECT)).toBe(true);
    });

    it('exports UPDATE_EFFECT_FIXTURE', () => {
      expect(UPDATE_EFFECT_FIXTURE).toBeDefined();
      expect(isDocumentNode(UPDATE_EFFECT_FIXTURE)).toBe(true);
    });
  });

  describe('effect channel mutations', () => {
    it('exports ADD_CHANNEL_TO_EFFECT_FIXTURE', () => {
      expect(ADD_CHANNEL_TO_EFFECT_FIXTURE).toBeDefined();
      expect(isDocumentNode(ADD_CHANNEL_TO_EFFECT_FIXTURE)).toBe(true);
    });

    it('exports UPDATE_EFFECT_CHANNEL', () => {
      expect(UPDATE_EFFECT_CHANNEL).toBeDefined();
      expect(isDocumentNode(UPDATE_EFFECT_CHANNEL)).toBe(true);
    });

    it('exports REMOVE_CHANNEL_FROM_EFFECT_FIXTURE', () => {
      expect(REMOVE_CHANNEL_FROM_EFFECT_FIXTURE).toBeDefined();
      expect(isDocumentNode(REMOVE_CHANNEL_FROM_EFFECT_FIXTURE)).toBe(true);
    });
  });

  describe('effect-cue association mutations', () => {
    it('exports ADD_EFFECT_TO_CUE', () => {
      expect(ADD_EFFECT_TO_CUE).toBeDefined();
      expect(isDocumentNode(ADD_EFFECT_TO_CUE)).toBe(true);
    });

    it('exports REMOVE_EFFECT_FROM_CUE', () => {
      expect(REMOVE_EFFECT_FROM_CUE).toBeDefined();
      expect(isDocumentNode(REMOVE_EFFECT_FROM_CUE)).toBe(true);
    });
  });

  describe('effect playback control mutations', () => {
    it('exports ACTIVATE_EFFECT', () => {
      expect(ACTIVATE_EFFECT).toBeDefined();
      expect(isDocumentNode(ACTIVATE_EFFECT)).toBe(true);
    });

    it('exports STOP_EFFECT', () => {
      expect(STOP_EFFECT).toBeDefined();
      expect(isDocumentNode(STOP_EFFECT)).toBe(true);
    });
  });

  describe('system control mutations', () => {
    it('exports ACTIVATE_BLACKOUT', () => {
      expect(ACTIVATE_BLACKOUT).toBeDefined();
      expect(isDocumentNode(ACTIVATE_BLACKOUT)).toBe(true);
    });

    it('exports RELEASE_BLACKOUT', () => {
      expect(RELEASE_BLACKOUT).toBeDefined();
      expect(isDocumentNode(RELEASE_BLACKOUT)).toBe(true);
    });

    it('exports SET_GRAND_MASTER', () => {
      expect(SET_GRAND_MASTER).toBeDefined();
      expect(isDocumentNode(SET_GRAND_MASTER)).toBe(true);
    });
  });
});
