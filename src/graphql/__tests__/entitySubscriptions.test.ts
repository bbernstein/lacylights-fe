import {
  LOOK_DATA_CHANGED_SUBSCRIPTION,
  LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
  FIXTURE_DATA_CHANGED_SUBSCRIPTION,
} from '../entitySubscriptions';

describe('GraphQL Entity Subscriptions', () => {
  describe('Subscription exports', () => {
    it('exports LOOK_DATA_CHANGED_SUBSCRIPTION', () => {
      expect(LOOK_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(LOOK_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });

    it('exports LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION', () => {
      expect(LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });

    it('exports FIXTURE_DATA_CHANGED_SUBSCRIPTION', () => {
      expect(FIXTURE_DATA_CHANGED_SUBSCRIPTION).toBeDefined();
      expect(FIXTURE_DATA_CHANGED_SUBSCRIPTION.kind).toBe('Document');
    });
  });

  describe('GraphQL document validation', () => {
    it('all subscriptions are valid GraphQL documents', () => {
      const subscriptions = [
        LOOK_DATA_CHANGED_SUBSCRIPTION,
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
        FIXTURE_DATA_CHANGED_SUBSCRIPTION,
      ];

      subscriptions.forEach(subscription => {
        expect(subscription.kind).toBe('Document');
        expect(subscription.definitions).toBeDefined();
        expect(subscription.definitions.length).toBeGreaterThan(0);
      });
    });

    it('subscriptions have valid operation definitions', () => {
      const subscriptions = [
        LOOK_DATA_CHANGED_SUBSCRIPTION,
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
        FIXTURE_DATA_CHANGED_SUBSCRIPTION,
      ];

      subscriptions.forEach(subscription => {
        const definition = subscription.definitions[0];
        expect(definition.kind).toBe('OperationDefinition');
      });
    });
  });

  describe('Subscription structure validation', () => {
    describe('LOOK_DATA_CHANGED_SUBSCRIPTION', () => {
      it('contains subscription keyword', () => {
        const subscriptionString = LOOK_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('subscription');
      });

      it('contains lookDataChanged field', () => {
        const subscriptionString = LOOK_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('lookDataChanged');
      });

      it('contains projectId variable', () => {
        const subscriptionString = LOOK_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('$projectId');
      });

      it('includes required response fields', () => {
        const subscriptionString = LOOK_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('lookId');
        expect(subscriptionString).toContain('projectId');
        expect(subscriptionString).toContain('changeType');
        expect(subscriptionString).toContain('timestamp');
      });
    });

    describe('LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION', () => {
      it('contains subscription keyword', () => {
        const subscriptionString = LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('subscription');
      });

      it('contains lookBoardDataChanged field', () => {
        const subscriptionString = LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('lookBoardDataChanged');
      });

      it('contains projectId variable', () => {
        const subscriptionString = LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('$projectId');
      });

      it('includes required response fields', () => {
        const subscriptionString = LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('lookBoardId');
        expect(subscriptionString).toContain('projectId');
        expect(subscriptionString).toContain('changeType');
        expect(subscriptionString).toContain('affectedButtonIds');
        expect(subscriptionString).toContain('timestamp');
      });
    });

    describe('FIXTURE_DATA_CHANGED_SUBSCRIPTION', () => {
      it('contains subscription keyword', () => {
        const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('subscription');
      });

      it('contains fixtureDataChanged field', () => {
        const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('fixtureDataChanged');
      });

      it('contains projectId variable', () => {
        const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('$projectId');
      });

      it('includes required response fields', () => {
        const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
        expect(subscriptionString).toContain('fixtureIds');
        expect(subscriptionString).toContain('projectId');
        expect(subscriptionString).toContain('changeType');
        expect(subscriptionString).toContain('timestamp');
      });
    });
  });

  describe('Variable requirements', () => {
    it('LOOK_DATA_CHANGED_SUBSCRIPTION requires projectId variable', () => {
      const operation = LOOK_DATA_CHANGED_SUBSCRIPTION.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION requires projectId variable', () => {
      const operation = LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('FIXTURE_DATA_CHANGED_SUBSCRIPTION requires projectId variable', () => {
      const operation = FIXTURE_DATA_CHANGED_SUBSCRIPTION.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasProjectIdVariable = operation.variableDefinitions.some(varDef =>
          varDef.variable.name.value === 'projectId'
        );
        expect(hasProjectIdVariable).toBe(true);
      }
    });

    it('all subscriptions have non-null projectId variable type', () => {
      const subscriptions = [
        LOOK_DATA_CHANGED_SUBSCRIPTION,
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
        FIXTURE_DATA_CHANGED_SUBSCRIPTION,
      ];

      subscriptions.forEach(subscription => {
        const operation = subscription.definitions[0];
        if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
          const projectIdVar = operation.variableDefinitions.find(varDef =>
            varDef.variable.name.value === 'projectId'
          );
          expect(projectIdVar).toBeDefined();
          // Non-null type has kind === 'NonNullType'
          expect(projectIdVar?.type.kind).toBe('NonNullType');
        }
      });
    });
  });

  describe('Operation types', () => {
    it('all subscriptions have subscription operation type', () => {
      const subscriptions = [
        LOOK_DATA_CHANGED_SUBSCRIPTION,
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
        FIXTURE_DATA_CHANGED_SUBSCRIPTION,
      ];

      subscriptions.forEach(subscription => {
        const operation = subscription.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('subscription');
        }
      });
    });
  });

  describe('Operation names', () => {
    it('LOOK_DATA_CHANGED_SUBSCRIPTION has correct operation name', () => {
      const operation = LOOK_DATA_CHANGED_SUBSCRIPTION.definitions[0];
      if (operation.kind === 'OperationDefinition') {
        expect(operation.name?.value).toBe('LookDataChanged');
      }
    });

    it('LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION has correct operation name', () => {
      const operation = LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION.definitions[0];
      if (operation.kind === 'OperationDefinition') {
        expect(operation.name?.value).toBe('LookBoardDataChanged');
      }
    });

    it('FIXTURE_DATA_CHANGED_SUBSCRIPTION has correct operation name', () => {
      const operation = FIXTURE_DATA_CHANGED_SUBSCRIPTION.definitions[0];
      if (operation.kind === 'OperationDefinition') {
        expect(operation.name?.value).toBe('FixtureDataChanged');
      }
    });
  });

  describe('Field selections for FIXTURE_DATA_CHANGED_SUBSCRIPTION', () => {
    it('includes fixtureIds field for affected fixtures', () => {
      const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('fixtureIds');
    });

    it('includes changeType field for operation type', () => {
      const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('changeType');
    });

    it('includes timestamp field for event timing', () => {
      const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      expect(subscriptionString).toContain('timestamp');
    });

    it('includes projectId field for project context', () => {
      const subscriptionString = FIXTURE_DATA_CHANGED_SUBSCRIPTION.loc?.source.body;
      // Check that projectId appears in the response fields (after the variable definition)
      const fieldsMatch = subscriptionString?.match(/fixtureDataChanged[^}]*\{([^}]*)\}/);
      expect(fieldsMatch?.[1]).toContain('projectId');
    });
  });

  describe('Subscription payload structure consistency', () => {
    it('all subscriptions include changeType and timestamp fields', () => {
      const subscriptions = [
        LOOK_DATA_CHANGED_SUBSCRIPTION,
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
        FIXTURE_DATA_CHANGED_SUBSCRIPTION,
      ];

      subscriptions.forEach((doc) => {
        const subscriptionString = doc.loc?.source.body;
        expect(subscriptionString).toContain('changeType');
        expect(subscriptionString).toContain('timestamp');
      });
    });

    it('all subscriptions include projectId in both variable and response', () => {
      const subscriptions = [
        LOOK_DATA_CHANGED_SUBSCRIPTION,
        LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION,
        FIXTURE_DATA_CHANGED_SUBSCRIPTION,
      ];

      subscriptions.forEach((doc) => {
        const subscriptionString = doc.loc?.source.body;
        // Check variable definition
        expect(subscriptionString).toContain('$projectId');
        // Check it's used in the subscription
        expect(subscriptionString).toContain('projectId: $projectId');
      });
    });
  });
});
