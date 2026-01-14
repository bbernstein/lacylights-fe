import {
  GET_PROJECT_LOOKS,
  GET_LOOK,
  CREATE_LOOK,
  UPDATE_LOOK,
  DELETE_LOOK,
  DUPLICATE_LOOK,
  GET_CURRENT_ACTIVE_LOOK,
  ACTIVATE_LOOK,
  START_PREVIEW_SESSION,
  CANCEL_PREVIEW_SESSION,
  COMMIT_PREVIEW_SESSION,
  UPDATE_PREVIEW_CHANNEL,
  INITIALIZE_PREVIEW_WITH_LOOK,
  GET_PREVIEW_SESSION,
  PREVIEW_SESSION_UPDATED,
  DMX_OUTPUT_CHANGED,
} from '../looks';

describe('GraphQL Looks', () => {
  describe('Query exports', () => {
    it('exports GET_PROJECT_LOOKS query', () => {
      expect(GET_PROJECT_LOOKS).toBeDefined();
      expect(GET_PROJECT_LOOKS.kind).toBe('Document');
    });

    it('exports GET_LOOK query', () => {
      expect(GET_LOOK).toBeDefined();
      expect(GET_LOOK.kind).toBe('Document');
    });

    it('exports GET_CURRENT_ACTIVE_LOOK query', () => {
      expect(GET_CURRENT_ACTIVE_LOOK).toBeDefined();
      expect(GET_CURRENT_ACTIVE_LOOK.kind).toBe('Document');
    });

    it('exports GET_PREVIEW_SESSION query', () => {
      expect(GET_PREVIEW_SESSION).toBeDefined();
      expect(GET_PREVIEW_SESSION.kind).toBe('Document');
    });
  });

  describe('Mutation exports', () => {
    it('exports CREATE_LOOK mutation', () => {
      expect(CREATE_LOOK).toBeDefined();
      expect(CREATE_LOOK.kind).toBe('Document');
    });

    it('exports UPDATE_LOOK mutation', () => {
      expect(UPDATE_LOOK).toBeDefined();
      expect(UPDATE_LOOK.kind).toBe('Document');
    });

    it('exports DELETE_LOOK mutation', () => {
      expect(DELETE_LOOK).toBeDefined();
      expect(DELETE_LOOK.kind).toBe('Document');
    });

    it('exports DUPLICATE_LOOK mutation', () => {
      expect(DUPLICATE_LOOK).toBeDefined();
      expect(DUPLICATE_LOOK.kind).toBe('Document');
    });

    it('exports ACTIVATE_LOOK mutation', () => {
      expect(ACTIVATE_LOOK).toBeDefined();
      expect(ACTIVATE_LOOK.kind).toBe('Document');
    });

    it('exports START_PREVIEW_SESSION mutation', () => {
      expect(START_PREVIEW_SESSION).toBeDefined();
      expect(START_PREVIEW_SESSION.kind).toBe('Document');
    });

    it('exports CANCEL_PREVIEW_SESSION mutation', () => {
      expect(CANCEL_PREVIEW_SESSION).toBeDefined();
      expect(CANCEL_PREVIEW_SESSION.kind).toBe('Document');
    });

    it('exports COMMIT_PREVIEW_SESSION mutation', () => {
      expect(COMMIT_PREVIEW_SESSION).toBeDefined();
      expect(COMMIT_PREVIEW_SESSION.kind).toBe('Document');
    });

    it('exports UPDATE_PREVIEW_CHANNEL mutation', () => {
      expect(UPDATE_PREVIEW_CHANNEL).toBeDefined();
      expect(UPDATE_PREVIEW_CHANNEL.kind).toBe('Document');
    });

    it('exports INITIALIZE_PREVIEW_WITH_LOOK mutation', () => {
      expect(INITIALIZE_PREVIEW_WITH_LOOK).toBeDefined();
      expect(INITIALIZE_PREVIEW_WITH_LOOK.kind).toBe('Document');
    });
  });

  describe('Subscription exports', () => {
    it('exports PREVIEW_SESSION_UPDATED subscription', () => {
      expect(PREVIEW_SESSION_UPDATED).toBeDefined();
      expect(PREVIEW_SESSION_UPDATED.kind).toBe('Document');
    });

    it('exports DMX_OUTPUT_CHANGED subscription', () => {
      expect(DMX_OUTPUT_CHANGED).toBeDefined();
      expect(DMX_OUTPUT_CHANGED.kind).toBe('Document');
    });
  });

  describe('GraphQL document validation', () => {
    it('all queries are valid GraphQL documents', () => {
      const queries = [
        GET_PROJECT_LOOKS,
        GET_LOOK,
        GET_CURRENT_ACTIVE_LOOK,
        GET_PREVIEW_SESSION,
      ];

      queries.forEach(query => {
        expect(query.kind).toBe('Document');
        expect(query.definitions).toBeDefined();
        expect(query.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all mutations are valid GraphQL documents', () => {
      const mutations = [
        CREATE_LOOK,
        UPDATE_LOOK,
        DELETE_LOOK,
        DUPLICATE_LOOK,
        ACTIVATE_LOOK,
        START_PREVIEW_SESSION,
        CANCEL_PREVIEW_SESSION,
        COMMIT_PREVIEW_SESSION,
        UPDATE_PREVIEW_CHANNEL,
        INITIALIZE_PREVIEW_WITH_LOOK,
      ];

      mutations.forEach(mutation => {
        expect(mutation.kind).toBe('Document');
        expect(mutation.definitions).toBeDefined();
        expect(mutation.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all subscriptions are valid GraphQL documents', () => {
      const subscriptions = [PREVIEW_SESSION_UPDATED, DMX_OUTPUT_CHANGED];

      subscriptions.forEach(subscription => {
        expect(subscription.kind).toBe('Document');
        expect(subscription.definitions).toBeDefined();
        expect(subscription.definitions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Query structure validation', () => {
    it('GET_PROJECT_LOOKS contains expected content', () => {
      const queryString = GET_PROJECT_LOOKS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('project');
      expect(queryString).toContain('$projectId');
      expect(queryString?.toLowerCase()).toContain('looks');
    });

    it('GET_LOOK contains expected content', () => {
      const queryString = GET_LOOK.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('look');
      expect(queryString).toContain('$id');
    });

    it('GET_CURRENT_ACTIVE_LOOK contains expected content', () => {
      const queryString = GET_CURRENT_ACTIVE_LOOK.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('currentactivelook');
    });

    it('GET_PREVIEW_SESSION contains expected content', () => {
      const queryString = GET_PREVIEW_SESSION.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('previewsession');
      expect(queryString).toContain('$sessionId');
    });
  });

  describe('Mutation structure validation', () => {
    it('CREATE_LOOK contains expected content', () => {
      const mutationString = CREATE_LOOK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('createlook');
      expect(mutationString).toContain('$input');
    });

    it('UPDATE_LOOK contains expected content', () => {
      const mutationString = UPDATE_LOOK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('updatelook');
      expect(mutationString).toContain('$id');
      expect(mutationString).toContain('$input');
    });

    it('DELETE_LOOK contains expected content', () => {
      const mutationString = DELETE_LOOK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('deletelook');
      expect(mutationString).toContain('$id');
    });

    it('DUPLICATE_LOOK contains expected content', () => {
      const mutationString = DUPLICATE_LOOK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('duplicatelook');
      expect(mutationString).toContain('$id');
    });

    it('ACTIVATE_LOOK contains expected content', () => {
      const mutationString = ACTIVATE_LOOK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('setlooklive');
      expect(mutationString).toContain('$lookId');
    });

    it('START_PREVIEW_SESSION contains expected content', () => {
      const mutationString = START_PREVIEW_SESSION.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('startpreviewsession');
      expect(mutationString).toContain('$projectId');
    });

    it('CANCEL_PREVIEW_SESSION contains expected content', () => {
      const mutationString = CANCEL_PREVIEW_SESSION.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('cancelpreviewsession');
      expect(mutationString).toContain('$sessionId');
    });

    it('COMMIT_PREVIEW_SESSION contains expected content', () => {
      const mutationString = COMMIT_PREVIEW_SESSION.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('commitpreviewsession');
      expect(mutationString).toContain('$sessionId');
    });

    it('UPDATE_PREVIEW_CHANNEL contains expected content', () => {
      const mutationString = UPDATE_PREVIEW_CHANNEL.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('updatepreviewchannel');
      expect(mutationString).toContain('$sessionId');
      expect(mutationString).toContain('$fixtureId');
      expect(mutationString).toContain('$channelIndex');
      expect(mutationString).toContain('$value');
    });

    it('INITIALIZE_PREVIEW_WITH_LOOK contains expected content', () => {
      const mutationString = INITIALIZE_PREVIEW_WITH_LOOK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('initializepreviewwithlook');
      expect(mutationString).toContain('$sessionId');
      expect(mutationString).toContain('$lookId');
    });
  });

  describe('Subscription structure validation', () => {
    it('PREVIEW_SESSION_UPDATED contains expected content', () => {
      const subscriptionString = PREVIEW_SESSION_UPDATED.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString?.toLowerCase()).toContain('previewsessionupdated');
      expect(subscriptionString).toContain('$projectId');
    });

    it('DMX_OUTPUT_CHANGED contains expected content', () => {
      const subscriptionString = DMX_OUTPUT_CHANGED.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString?.toLowerCase()).toContain('dmxoutputchanged');
    });
  });

  describe('Variable requirements', () => {
    it('GET_PROJECT_LOOKS requires projectId variable', () => {
      const operation = GET_PROJECT_LOOKS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('GET_LOOK requires id variable', () => {
      const operation = GET_LOOK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'id'
        );
        expect(hasIdVariable).toBe(true);
      }
    });

    it('CREATE_LOOK requires input variable', () => {
      const operation = CREATE_LOOK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasInputVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'input'
        );
        expect(hasInputVariable).toBe(true);
      }
    });

    it('UPDATE_LOOK requires id and input variables', () => {
      const operation = UPDATE_LOOK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const variableNames = operation.variableDefinitions.map(
          varDef => varDef.variable.name.value
        );
        expect(variableNames).toContain('id');
        expect(variableNames).toContain('input');
      }
    });

    it('DELETE_LOOK requires id variable', () => {
      const operation = DELETE_LOOK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'id'
        );
        expect(hasIdVariable).toBe(true);
      }
    });

    it('ACTIVATE_LOOK requires lookId variable', () => {
      const operation = ACTIVATE_LOOK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasLookIdVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'lookId'
        );
        expect(hasLookIdVariable).toBe(true);
      }
    });
  });

  describe('Field selections', () => {
    it('look queries include essential fields', () => {
      const queryString = GET_PROJECT_LOOKS.loc?.source.body;
      expect(queryString).toContain('id');
      expect(queryString).toContain('name');
      expect(queryString).toContain('description');
    });

    it('GET_LOOK includes fixture values', () => {
      const queryString = GET_LOOK.loc?.source.body;
      expect(queryString).toContain('fixtureValues');
      expect(queryString).toContain('fixture');
      expect(queryString).toContain('channels');
    });

    it('preview session queries include dmxOutput', () => {
      const queryString = GET_PREVIEW_SESSION.loc?.source.body;
      expect(queryString).toContain('dmxOutput');
      expect(queryString).toContain('universe');
      expect(queryString).toContain('channels');
    });
  });

  describe('Operation types', () => {
    it('queries have correct operation type', () => {
      const queries = [GET_PROJECT_LOOKS, GET_LOOK, GET_CURRENT_ACTIVE_LOOK, GET_PREVIEW_SESSION];
      queries.forEach(query => {
        const operation = query.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('query');
        }
      });
    });

    it('mutations have correct operation type', () => {
      const mutations = [
        CREATE_LOOK,
        UPDATE_LOOK,
        DELETE_LOOK,
        DUPLICATE_LOOK,
        ACTIVATE_LOOK,
        START_PREVIEW_SESSION,
        CANCEL_PREVIEW_SESSION,
        COMMIT_PREVIEW_SESSION,
        UPDATE_PREVIEW_CHANNEL,
        INITIALIZE_PREVIEW_WITH_LOOK,
      ];
      mutations.forEach(mutation => {
        const operation = mutation.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('mutation');
        }
      });
    });

    it('subscriptions have correct operation type', () => {
      const subscriptions = [PREVIEW_SESSION_UPDATED, DMX_OUTPUT_CHANGED];
      subscriptions.forEach(subscription => {
        const operation = subscription.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('subscription');
        }
      });
    });
  });
});
