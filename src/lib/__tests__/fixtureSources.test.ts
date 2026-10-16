import { FixtureSource } from '@/types';
import { FixtureSource as GeneratedFixtureSource } from '@/generated/graphql';
import type { GetModelsQuery, GetFixtureSourcePrecedenceQuery } from '@/generated/graphql';
import {
  DEFAULT_FIXTURE_SOURCE_PRECEDENCE,
  FIXTURE_SOURCE_INFO,
  fixtureSourceDescription,
  fixtureSourceLabel,
  hasDuplicateModels,
  isFixtureSource,
  normalizePrecedence,
  sortDefinitionsByPrecedence,
} from '../fixtureSources';

describe('fixtureSources', () => {
  describe('FixtureSource enum', () => {
    it('matches the generated GraphQL enum values', () => {
      expect(Object.values(FixtureSource).sort()).toEqual(Object.values(GeneratedFixtureSource).sort());
    });

    it('generated query types carry the source fields', () => {
      // Compile-time check: fails type-check if codegen drops the fields.
      const definition: GetModelsQuery['fixtureDefinitions'][number] = {
        id: 'd1',
        model: 'S4',
        source: GeneratedFixtureSource.Ofl,
        sourceVersion: '1.0',
        modes: [],
      };
      const precedence: GetFixtureSourcePrecedenceQuery = {
        fixtureSourcePrecedence: [GeneratedFixtureSource.User, GeneratedFixtureSource.Builtin],
      };
      expect(definition.source).toBe('OFL');
      expect(precedence.fixtureSourcePrecedence).toEqual(['USER', 'BUILTIN']);
    });

    it('has a label and description for every source', () => {
      Object.values(FixtureSource).forEach((source) => {
        expect(FIXTURE_SOURCE_INFO[source].label).toBeTruthy();
        expect(FIXTURE_SOURCE_INFO[source].description).toBeTruthy();
      });
    });
  });

  describe('labels', () => {
    it.each([
      [FixtureSource.BUILTIN, 'Built-in'],
      [FixtureSource.OFL, 'OFL'],
      [FixtureSource.GDTF, 'GDTF'],
      [FixtureSource.EOS, 'Eos library'],
      [FixtureSource.USER, 'Custom'],
      [FixtureSource.SYNTHESIZED, 'Eos ASCII'],
    ])('labels %s as %s', (source, label) => {
      expect(fixtureSourceLabel(source)).toBe(label);
    });

    it('shows unknown sources as-is', () => {
      expect(fixtureSourceLabel('MVR')).toBe('MVR');
      expect(fixtureSourceDescription('MVR')).toBe('Source: MVR');
      expect(isFixtureSource('MVR')).toBe(false);
      expect(isFixtureSource(42)).toBe(false);
    });
  });

  describe('normalizePrecedence', () => {
    it('returns the default order for missing input', () => {
      expect(normalizePrecedence(undefined)).toEqual([...DEFAULT_FIXTURE_SOURCE_PRECEDENCE]);
      expect(normalizePrecedence(null)).toEqual([...DEFAULT_FIXTURE_SOURCE_PRECEDENCE]);
    });

    it('matches the backend default order', () => {
      expect(DEFAULT_FIXTURE_SOURCE_PRECEDENCE).toEqual(['USER', 'GDTF', 'OFL', 'BUILTIN', 'EOS', 'SYNTHESIZED']);
    });

    it('keeps the given order and appends missing sources in default order', () => {
      expect(normalizePrecedence([FixtureSource.BUILTIN, FixtureSource.OFL])).toEqual([
        'BUILTIN',
        'OFL',
        'USER',
        'GDTF',
        'EOS',
        'SYNTHESIZED',
      ]);
    });

    it('drops duplicates and unknown values', () => {
      expect(normalizePrecedence(['OFL', 'OFL', 'NOPE', 'USER'])).toEqual([
        'OFL',
        'USER',
        'GDTF',
        'BUILTIN',
        'EOS',
        'SYNTHESIZED',
      ]);
    });
  });

  describe('sortDefinitionsByPrecedence', () => {
    const defs = [
      { id: 'a-ofl', model: 'Aura', source: FixtureSource.OFL },
      { id: 'par', model: 'Par', source: FixtureSource.BUILTIN },
      { id: 'a-builtin', model: 'Aura', source: FixtureSource.BUILTIN },
      { id: 'a-user', model: 'Aura', source: FixtureSource.USER },
    ];

    it('groups same-model definitions by precedence, keeping model order', () => {
      const sorted = sortDefinitionsByPrecedence(defs, DEFAULT_FIXTURE_SOURCE_PRECEDENCE);
      expect(sorted.map((d) => d.id)).toEqual(['a-user', 'a-ofl', 'a-builtin', 'par']);
    });

    it('follows a custom precedence', () => {
      const sorted = sortDefinitionsByPrecedence(defs, normalizePrecedence(['BUILTIN', 'OFL']));
      expect(sorted.map((d) => d.id)).toEqual(['a-builtin', 'a-ofl', 'a-user', 'par']);
    });

    it('leaves lists without duplicates unchanged and does not mutate input', () => {
      const unique = [
        { id: '2', model: 'Zeta' },
        { id: '1', model: 'Alpha' },
      ];
      const sorted = sortDefinitionsByPrecedence(unique, DEFAULT_FIXTURE_SOURCE_PRECEDENCE);
      expect(sorted.map((d) => d.id)).toEqual(['2', '1']);
      expect(sorted).not.toBe(unique);
    });

    it('puts unknown and missing sources last, keeping their order', () => {
      const sorted = sortDefinitionsByPrecedence(
        [
          { id: 'none', model: 'X', source: null },
          { id: 'odd', model: 'X', source: 'MVR' },
          { id: 'ofl', model: 'X', source: FixtureSource.OFL },
        ],
        DEFAULT_FIXTURE_SOURCE_PRECEDENCE,
      );
      expect(sorted.map((d) => d.id)).toEqual(['ofl', 'odd', 'none']);
    });
  });

  describe('hasDuplicateModels', () => {
    it('detects repeated model names', () => {
      expect(hasDuplicateModels([{ model: 'A' }, { model: 'B' }])).toBe(false);
      expect(hasDuplicateModels([{ model: 'A' }, { model: 'B' }, { model: 'A' }])).toBe(true);
      expect(hasDuplicateModels([])).toBe(false);
    });
  });
});
