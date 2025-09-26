import {
  GET_FIXTURE_DEFINITIONS,
  GET_MANUFACTURERS,
  GET_MODELS,
  CREATE_FIXTURE_INSTANCE,
  UPDATE_FIXTURE_INSTANCE,
  DELETE_FIXTURE_INSTANCE,
  GET_PROJECT_FIXTURES,
  REORDER_PROJECT_FIXTURES,
  REORDER_SCENE_FIXTURES,
} from '../fixtures';

describe('GraphQL Fixtures', () => {
  describe('Query exports', () => {
    it('exports GET_FIXTURE_DEFINITIONS query', () => {
      expect(GET_FIXTURE_DEFINITIONS).toBeDefined();
      expect(GET_FIXTURE_DEFINITIONS.kind).toBe('Document');
    });

    it('exports GET_MANUFACTURERS query', () => {
      expect(GET_MANUFACTURERS).toBeDefined();
      expect(GET_MANUFACTURERS.kind).toBe('Document');
    });

    it('exports GET_MODELS query', () => {
      expect(GET_MODELS).toBeDefined();
      expect(GET_MODELS.kind).toBe('Document');
    });

    it('exports GET_PROJECT_FIXTURES query', () => {
      expect(GET_PROJECT_FIXTURES).toBeDefined();
      expect(GET_PROJECT_FIXTURES.kind).toBe('Document');
    });
  });

  describe('Mutation exports', () => {
    it('exports CREATE_FIXTURE_INSTANCE mutation', () => {
      expect(CREATE_FIXTURE_INSTANCE).toBeDefined();
      expect(CREATE_FIXTURE_INSTANCE.kind).toBe('Document');
    });

    it('exports UPDATE_FIXTURE_INSTANCE mutation', () => {
      expect(UPDATE_FIXTURE_INSTANCE).toBeDefined();
      expect(UPDATE_FIXTURE_INSTANCE.kind).toBe('Document');
    });

    it('exports DELETE_FIXTURE_INSTANCE mutation', () => {
      expect(DELETE_FIXTURE_INSTANCE).toBeDefined();
      expect(DELETE_FIXTURE_INSTANCE.kind).toBe('Document');
    });

    it('exports REORDER_PROJECT_FIXTURES mutation', () => {
      expect(REORDER_PROJECT_FIXTURES).toBeDefined();
      expect(REORDER_PROJECT_FIXTURES.kind).toBe('Document');
    });

    it('exports REORDER_SCENE_FIXTURES mutation', () => {
      expect(REORDER_SCENE_FIXTURES).toBeDefined();
      expect(REORDER_SCENE_FIXTURES.kind).toBe('Document');
    });
  });

  describe('GraphQL document validation', () => {
    it('all queries are valid GraphQL documents', () => {
      const queries = [
        GET_FIXTURE_DEFINITIONS,
        GET_MANUFACTURERS,
        GET_MODELS,
        GET_PROJECT_FIXTURES,
      ];

      queries.forEach(query => {
        expect(query.kind).toBe('Document');
        expect(query.definitions).toBeDefined();
        expect(query.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all mutations are valid GraphQL documents', () => {
      const mutations = [
        CREATE_FIXTURE_INSTANCE,
        UPDATE_FIXTURE_INSTANCE,
        DELETE_FIXTURE_INSTANCE,
        REORDER_PROJECT_FIXTURES,
        REORDER_SCENE_FIXTURES,
      ];

      mutations.forEach(mutation => {
        expect(mutation.kind).toBe('Document');
        expect(mutation.definitions).toBeDefined();
        expect(mutation.definitions.length).toBeGreaterThan(0);
      });
    });

    it('operations have valid definitions', () => {
      const operations = [
        GET_FIXTURE_DEFINITIONS,
        CREATE_FIXTURE_INSTANCE,
        UPDATE_FIXTURE_INSTANCE,
        DELETE_FIXTURE_INSTANCE,
      ];

      operations.forEach(operation => {
        const definition = operation.definitions[0];
        expect(definition.kind).toBe('OperationDefinition');
      });
    });
  });

  describe('Query structure validation', () => {
    it('GET_FIXTURE_DEFINITIONS contains expected content', () => {
      const queryString = GET_FIXTURE_DEFINITIONS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('fixturedefinitions');
      expect(queryString).toContain('$filter');
    });

    it('GET_MANUFACTURERS contains expected content', () => {
      const queryString = GET_MANUFACTURERS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('manufacturers');
      expect(queryString).toContain('$search');
    });

    it('GET_MODELS contains expected content', () => {
      const queryString = GET_MODELS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('models');
      expect(queryString).toContain('$manufacturer');
      expect(queryString).toContain('$search');
    });

    it('GET_PROJECT_FIXTURES contains expected content', () => {
      const queryString = GET_PROJECT_FIXTURES.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('projectfixtures');
      expect(queryString).toContain('$projectId');
    });
  });

  describe('Mutation structure validation', () => {
    it('CREATE_FIXTURE_INSTANCE contains expected content', () => {
      const mutationString = CREATE_FIXTURE_INSTANCE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('createfixtureinstance');
      expect(mutationString).toContain('$input');
    });

    it('UPDATE_FIXTURE_INSTANCE contains expected content', () => {
      const mutationString = UPDATE_FIXTURE_INSTANCE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('updatefixtureinstance');
      expect(mutationString).toContain('$id');
      expect(mutationString).toContain('$input');
    });

    it('DELETE_FIXTURE_INSTANCE contains expected content', () => {
      const mutationString = DELETE_FIXTURE_INSTANCE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('deletefixtureinstance');
      expect(mutationString).toContain('$id');
    });

    it('REORDER_PROJECT_FIXTURES contains expected content', () => {
      const mutationString = REORDER_PROJECT_FIXTURES.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('reorderprojectfixtures');
      expect(mutationString).toContain('$projectId');
      expect(mutationString).toContain('$fixtureOrders');
    });

    it('REORDER_SCENE_FIXTURES contains expected content', () => {
      const mutationString = REORDER_SCENE_FIXTURES.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('reorderscenefixtures');
      expect(mutationString).toContain('$sceneId');
      expect(mutationString).toContain('$fixtureOrders');
    });
  });

  describe('Variable requirements', () => {
    it('GET_FIXTURE_DEFINITIONS accepts filter variable', () => {
      const operation = GET_FIXTURE_DEFINITIONS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasFilterVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'filter'
        );
        expect(hasFilterVariable).toBe(true);
      }
    });

    it('GET_MANUFACTURERS requires search variable', () => {
      const operation = GET_MANUFACTURERS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasSearchVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'search'
        );
        expect(hasSearchVariable).toBe(true);
      }
    });

    it('GET_MODELS requires manufacturer and search variables', () => {
      const operation = GET_MODELS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const variableNames = operation.variableDefinitions.map(varDef =>
          varDef.variable.name.value
        );
        expect(variableNames).toContain('manufacturer');
        expect(variableNames).toContain('search');
      }
    });

    it('GET_PROJECT_FIXTURES requires projectId variable', () => {
      const operation = GET_PROJECT_FIXTURES.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('CREATE_FIXTURE_INSTANCE requires input variable', () => {
      const operation = CREATE_FIXTURE_INSTANCE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasInputVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'input'
        );
        expect(hasInputVariable).toBe(true);
      }
    });

    it('UPDATE_FIXTURE_INSTANCE requires id and input variables', () => {
      const operation = UPDATE_FIXTURE_INSTANCE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const variableNames = operation.variableDefinitions.map(varDef =>
          varDef.variable.name.value
        );
        expect(variableNames).toContain('id');
        expect(variableNames).toContain('input');
      }
    });

    it('DELETE_FIXTURE_INSTANCE requires id variable', () => {
      const operation = DELETE_FIXTURE_INSTANCE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'id'
        );
        expect(hasIdVariable).toBe(true);
      }
    });
  });

  describe('Field selections', () => {
    it('fixture queries include essential fields', () => {
      const queryString = GET_FIXTURE_DEFINITIONS.loc?.source.body;
      expect(queryString).toContain('id');
      expect(queryString).toContain('manufacturer');
      expect(queryString).toContain('model');
      expect(queryString).toContain('type');
    });

    it('project fixtures query includes detailed fields', () => {
      const queryString = GET_PROJECT_FIXTURES.loc?.source.body;
      expect(queryString).toContain('fixtures');
      expect(queryString).toContain('universe');
      expect(queryString).toContain('startChannel');
      expect(queryString).toContain('channels');
    });

    it('fixture mutations include required response fields', () => {
      const mutationString = CREATE_FIXTURE_INSTANCE.loc?.source.body;
      expect(mutationString).toContain('id');
      expect(mutationString).toContain('name');
      expect(mutationString).toContain('channelCount');
    });
  });

  describe('Operation types', () => {
    it('queries have correct operation type', () => {
      const queries = [GET_FIXTURE_DEFINITIONS, GET_MANUFACTURERS, GET_MODELS, GET_PROJECT_FIXTURES];
      queries.forEach(query => {
        const operation = query.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('query');
        }
      });
    });

    it('mutations have correct operation type', () => {
      const mutations = [
        CREATE_FIXTURE_INSTANCE,
        UPDATE_FIXTURE_INSTANCE,
        DELETE_FIXTURE_INSTANCE,
        REORDER_PROJECT_FIXTURES,
        REORDER_SCENE_FIXTURES,
      ];
      mutations.forEach(mutation => {
        const operation = mutation.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('mutation');
        }
      });
    });
  });
});