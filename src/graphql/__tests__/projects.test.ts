import {
  GET_PROJECTS,
  GET_PROJECT,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  IMPORT_PROJECT_FROM_QLC,
  GET_QLC_FIXTURE_MAPPING_SUGGESTIONS,
  EXPORT_PROJECT_TO_QLC,
} from '../projects';

describe('GraphQL Projects', () => {
  describe('Query exports', () => {
    it('exports GET_PROJECTS query', () => {
      expect(GET_PROJECTS).toBeDefined();
      expect(GET_PROJECTS.kind).toBe('Document');
    });

    it('exports GET_PROJECT query', () => {
      expect(GET_PROJECT).toBeDefined();
      expect(GET_PROJECT.kind).toBe('Document');
    });

    it('exports GET_QLC_FIXTURE_MAPPING_SUGGESTIONS query', () => {
      expect(GET_QLC_FIXTURE_MAPPING_SUGGESTIONS).toBeDefined();
      expect(GET_QLC_FIXTURE_MAPPING_SUGGESTIONS.kind).toBe('Document');
    });
  });

  describe('Mutation exports', () => {
    it('exports CREATE_PROJECT mutation', () => {
      expect(CREATE_PROJECT).toBeDefined();
      expect(CREATE_PROJECT.kind).toBe('Document');
    });

    it('exports UPDATE_PROJECT mutation', () => {
      expect(UPDATE_PROJECT).toBeDefined();
      expect(UPDATE_PROJECT.kind).toBe('Document');
    });

    it('exports DELETE_PROJECT mutation', () => {
      expect(DELETE_PROJECT).toBeDefined();
      expect(DELETE_PROJECT.kind).toBe('Document');
    });

    it('exports IMPORT_PROJECT_FROM_QLC mutation', () => {
      expect(IMPORT_PROJECT_FROM_QLC).toBeDefined();
      expect(IMPORT_PROJECT_FROM_QLC.kind).toBe('Document');
    });

    it('exports EXPORT_PROJECT_TO_QLC mutation', () => {
      expect(EXPORT_PROJECT_TO_QLC).toBeDefined();
      expect(EXPORT_PROJECT_TO_QLC.kind).toBe('Document');
    });
  });

  describe('GraphQL document validation', () => {
    it('all exports are valid GraphQL documents', () => {
      const allOperations = [
        GET_PROJECTS,
        GET_PROJECT,
        CREATE_PROJECT,
        UPDATE_PROJECT,
        DELETE_PROJECT,
        IMPORT_PROJECT_FROM_QLC,
        GET_QLC_FIXTURE_MAPPING_SUGGESTIONS,
        EXPORT_PROJECT_TO_QLC,
      ];

      allOperations.forEach(operation => {
        expect(operation.kind).toBe('Document');
        expect(operation.definitions).toBeDefined();
        expect(operation.definitions.length).toBeGreaterThan(0);
      });
    });

    it('operations have valid definitions', () => {
      const operations = [GET_PROJECTS, CREATE_PROJECT, UPDATE_PROJECT];

      operations.forEach(operation => {
        const definition = operation.definitions[0];
        expect(definition.kind).toBe('OperationDefinition');
      });
    });
  });

  describe('Basic structure validation', () => {
    it('GET_PROJECTS contains expected content', () => {
      const queryString = GET_PROJECTS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('projects');
    });

    it('CREATE_PROJECT contains expected content', () => {
      const mutationString = CREATE_PROJECT.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('create');
    });

    it('UPDATE_PROJECT contains expected content', () => {
      const mutationString = UPDATE_PROJECT.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('update');
    });

    it('DELETE_PROJECT contains expected content', () => {
      const mutationString = DELETE_PROJECT.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('delete');
    });
  });
});