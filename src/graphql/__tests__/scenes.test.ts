import {
  GET_PROJECT_SCENES,
  GET_SCENE,
  CREATE_SCENE,
  UPDATE_SCENE,
  DELETE_SCENE,
  ACTIVATE_SCENE,
  GET_CURRENT_ACTIVE_SCENE,
  DUPLICATE_SCENE,
} from '../scenes';

describe('GraphQL Scenes', () => {
  describe('Query definitions', () => {
    it('exports GET_PROJECT_SCENES query', () => {
      expect(GET_PROJECT_SCENES).toBeDefined();
      expect(GET_PROJECT_SCENES.kind).toBe('Document');
    });

    it('exports GET_SCENE query', () => {
      expect(GET_SCENE).toBeDefined();
      expect(GET_SCENE.kind).toBe('Document');
    });

    it('exports GET_CURRENT_ACTIVE_SCENE query', () => {
      expect(GET_CURRENT_ACTIVE_SCENE).toBeDefined();
      expect(GET_CURRENT_ACTIVE_SCENE.kind).toBe('Document');
    });

    it('GET_PROJECT_SCENES query structure', () => {
      const queryString = GET_PROJECT_SCENES.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString).toContain('project');
      expect(queryString).toContain('$projectId');
    });

    it('GET_SCENE query structure', () => {
      const queryString = GET_SCENE.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString).toContain('scene');
      expect(queryString).toContain('$id');
    });

    it('GET_CURRENT_ACTIVE_SCENE query structure', () => {
      const queryString = GET_CURRENT_ACTIVE_SCENE.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString).toContain('currentActiveScene');
    });
  });

  describe('CRUD Mutation definitions', () => {
    it('exports CREATE_SCENE mutation', () => {
      expect(CREATE_SCENE).toBeDefined();
      expect(CREATE_SCENE.kind).toBe('Document');
    });

    it('exports UPDATE_SCENE mutation', () => {
      expect(UPDATE_SCENE).toBeDefined();
      expect(UPDATE_SCENE.kind).toBe('Document');
    });

    it('exports DELETE_SCENE mutation', () => {
      expect(DELETE_SCENE).toBeDefined();
      expect(DELETE_SCENE.kind).toBe('Document');
    });

    it('exports DUPLICATE_SCENE mutation', () => {
      expect(DUPLICATE_SCENE).toBeDefined();
      expect(DUPLICATE_SCENE.kind).toBe('Document');
    });

    it('CREATE_SCENE mutation structure', () => {
      const mutationString = CREATE_SCENE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString).toContain('createScene');
      expect(mutationString).toContain('$input');
    });

    it('UPDATE_SCENE mutation structure', () => {
      const mutationString = UPDATE_SCENE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString).toContain('updateScene');
      expect(mutationString).toContain('$id');
      expect(mutationString).toContain('$input');
    });

    it('DELETE_SCENE mutation structure', () => {
      const mutationString = DELETE_SCENE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString).toContain('deleteScene');
      expect(mutationString).toContain('$id');
    });
  });

  describe('Scene Control Mutations', () => {
    it('exports ACTIVATE_SCENE mutation', () => {
      expect(ACTIVATE_SCENE).toBeDefined();
      expect(ACTIVATE_SCENE.kind).toBe('Document');
    });

    it('ACTIVATE_SCENE mutation structure', () => {
      const mutationString = ACTIVATE_SCENE.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString).toContain('setSceneLive');
      expect(mutationString).toContain('$sceneId');
    });
  });


  describe('GraphQL document validation', () => {
    it('all queries are valid GraphQL documents', () => {
      const queries = [GET_PROJECT_SCENES, GET_SCENE, GET_CURRENT_ACTIVE_SCENE];

      queries.forEach(query => {
        expect(query.kind).toBe('Document');
        expect(query.definitions).toBeDefined();
        expect(query.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all mutations are valid GraphQL documents', () => {
      const mutations = [
        CREATE_SCENE,
        UPDATE_SCENE,
        DELETE_SCENE,
        DUPLICATE_SCENE,
        ACTIVATE_SCENE,
      ];

      mutations.forEach(mutation => {
        expect(mutation.kind).toBe('Document');
        expect(mutation.definitions).toBeDefined();
        expect(mutation.definitions.length).toBeGreaterThan(0);
      });
    });

    it('operations have correct operation types', () => {
      const queries = [GET_PROJECT_SCENES, GET_SCENE, GET_CURRENT_ACTIVE_SCENE];
      queries.forEach(query => {
        const operation = query.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('query');
        }
      });

      const mutations = [
        CREATE_SCENE,
        UPDATE_SCENE,
        DELETE_SCENE,
        DUPLICATE_SCENE,
        ACTIVATE_SCENE,
      ];
      mutations.forEach(mutation => {
        const operation = mutation.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('mutation');
        }
      });
    });
  });

  describe('Variable requirements', () => {
    it('GET_SCENE requires id variable', () => {
      const operation = GET_SCENE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'id'
        );
        expect(hasIdVariable).toBe(true);
      }
    });

    it('GET_PROJECT_SCENES requires projectId variable', () => {
      const operation = GET_PROJECT_SCENES.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('ACTIVATE_SCENE requires sceneId variable', () => {
      const operation = ACTIVATE_SCENE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasSceneIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'sceneId'
        );
        expect(hasSceneIdVariable).toBe(true);
      }
    });

    it('UPDATE_SCENE requires id and input variables', () => {
      const operation = UPDATE_SCENE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const variableNames = operation.variableDefinitions.map(varDef =>
          varDef.variable.name.value
        );
        expect(variableNames).toContain('id');
        expect(variableNames).toContain('input');
      }
    });

    it('CREATE_SCENE requires input variable', () => {
      const operation = CREATE_SCENE.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasInputVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'input'
        );
        expect(hasInputVariable).toBe(true);
      }
    });
  });

  describe('Field selections', () => {
    it('scene queries include essential fields', () => {
      const queryString = GET_PROJECT_SCENES.loc?.source.body;
      expect(queryString).toContain('id');
      expect(queryString).toContain('name');
    });

    it('GET_CURRENT_ACTIVE_SCENE includes scene data', () => {
      const queryString = GET_CURRENT_ACTIVE_SCENE.loc?.source.body;
      expect(queryString).toContain('currentActiveScene');
    });
  });
});