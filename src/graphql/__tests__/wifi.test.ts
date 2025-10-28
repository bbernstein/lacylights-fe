import {
  WIFI_NETWORKS,
  WIFI_STATUS,
  SAVED_WIFI_NETWORKS,
  CONNECT_WIFI,
  DISCONNECT_WIFI,
  SET_WIFI_ENABLED,
  FORGET_WIFI_NETWORK,
  WIFI_STATUS_UPDATED,
} from '../wifi';

describe('GraphQL WiFi', () => {
  describe('Query exports', () => {
    it('exports WIFI_NETWORKS query', () => {
      expect(WIFI_NETWORKS).toBeDefined();
      expect(WIFI_NETWORKS.kind).toBe('Document');
    });

    it('exports WIFI_STATUS query', () => {
      expect(WIFI_STATUS).toBeDefined();
      expect(WIFI_STATUS.kind).toBe('Document');
    });

    it('exports SAVED_WIFI_NETWORKS query', () => {
      expect(SAVED_WIFI_NETWORKS).toBeDefined();
      expect(SAVED_WIFI_NETWORKS.kind).toBe('Document');
    });
  });

  describe('Mutation exports', () => {
    it('exports CONNECT_WIFI mutation', () => {
      expect(CONNECT_WIFI).toBeDefined();
      expect(CONNECT_WIFI.kind).toBe('Document');
    });

    it('exports DISCONNECT_WIFI mutation', () => {
      expect(DISCONNECT_WIFI).toBeDefined();
      expect(DISCONNECT_WIFI.kind).toBe('Document');
    });

    it('exports SET_WIFI_ENABLED mutation', () => {
      expect(SET_WIFI_ENABLED).toBeDefined();
      expect(SET_WIFI_ENABLED.kind).toBe('Document');
    });

    it('exports FORGET_WIFI_NETWORK mutation', () => {
      expect(FORGET_WIFI_NETWORK).toBeDefined();
      expect(FORGET_WIFI_NETWORK.kind).toBe('Document');
    });
  });

  describe('Subscription exports', () => {
    it('exports WIFI_STATUS_UPDATED subscription', () => {
      expect(WIFI_STATUS_UPDATED).toBeDefined();
      expect(WIFI_STATUS_UPDATED.kind).toBe('Document');
    });
  });

  describe('GraphQL document validation', () => {
    it('all queries are valid GraphQL documents', () => {
      const queries = [WIFI_NETWORKS, WIFI_STATUS, SAVED_WIFI_NETWORKS];

      queries.forEach(query => {
        expect(query.kind).toBe('Document');
        expect(query.definitions).toBeDefined();
        expect(query.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all mutations are valid GraphQL documents', () => {
      const mutations = [CONNECT_WIFI, DISCONNECT_WIFI, SET_WIFI_ENABLED, FORGET_WIFI_NETWORK];

      mutations.forEach(mutation => {
        expect(mutation.kind).toBe('Document');
        expect(mutation.definitions).toBeDefined();
        expect(mutation.definitions.length).toBeGreaterThan(0);
      });
    });

    it('all subscriptions are valid GraphQL documents', () => {
      const subscriptions = [WIFI_STATUS_UPDATED];

      subscriptions.forEach(subscription => {
        expect(subscription.kind).toBe('Document');
        expect(subscription.definitions).toBeDefined();
        expect(subscription.definitions.length).toBeGreaterThan(0);
      });
    });

    it('operations have valid definitions', () => {
      const operations = [
        WIFI_NETWORKS,
        WIFI_STATUS,
        CONNECT_WIFI,
        DISCONNECT_WIFI,
        SET_WIFI_ENABLED,
        WIFI_STATUS_UPDATED,
      ];

      operations.forEach(operation => {
        const definition = operation.definitions[0];
        expect(definition.kind).toBe('OperationDefinition');
      });
    });
  });

  describe('Query structure validation', () => {
    it('WIFI_NETWORKS contains expected content', () => {
      const queryString = WIFI_NETWORKS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('wifinetworks');
      expect(queryString).toContain('$rescan');
    });

    it('WIFI_STATUS contains expected content', () => {
      const queryString = WIFI_STATUS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('wifistatus');
    });

    it('SAVED_WIFI_NETWORKS contains expected content', () => {
      const queryString = SAVED_WIFI_NETWORKS.loc?.source.body;
      expect(queryString).toContain('query');
      expect(queryString?.toLowerCase()).toContain('savedwifinetworks');
    });
  });

  describe('Mutation structure validation', () => {
    it('CONNECT_WIFI contains expected content', () => {
      const mutationString = CONNECT_WIFI.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('connectwifi');
      expect(mutationString).toContain('$ssid');
      expect(mutationString).toContain('$password');
    });

    it('DISCONNECT_WIFI contains expected content', () => {
      const mutationString = DISCONNECT_WIFI.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('disconnectwifi');
    });

    it('SET_WIFI_ENABLED contains expected content', () => {
      const mutationString = SET_WIFI_ENABLED.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('setwifienabled');
      expect(mutationString).toContain('$enabled');
    });

    it('FORGET_WIFI_NETWORK contains expected content', () => {
      const mutationString = FORGET_WIFI_NETWORK.loc?.source.body;
      expect(mutationString).toContain('mutation');
      expect(mutationString?.toLowerCase()).toContain('forgetwifinetwork');
      expect(mutationString).toContain('$ssid');
    });
  });

  describe('Subscription structure validation', () => {
    it('WIFI_STATUS_UPDATED contains expected content', () => {
      const subscriptionString = WIFI_STATUS_UPDATED.loc?.source.body;
      expect(subscriptionString).toContain('subscription');
      expect(subscriptionString?.toLowerCase()).toContain('wifistatusupdated');
    });
  });

  describe('Variable requirements', () => {
    it('WIFI_NETWORKS accepts rescan variable', () => {
      const operation = WIFI_NETWORKS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasRescanVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'rescan'
        );
        expect(hasRescanVariable).toBe(true);
      }
    });

    it('CONNECT_WIFI requires ssid variable', () => {
      const operation = CONNECT_WIFI.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasSsidVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'ssid'
        );
        expect(hasSsidVariable).toBe(true);
      }
    });

    it('CONNECT_WIFI accepts password variable', () => {
      const operation = CONNECT_WIFI.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasPasswordVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'password'
        );
        expect(hasPasswordVariable).toBe(true);
      }
    });

    it('SET_WIFI_ENABLED requires enabled variable', () => {
      const operation = SET_WIFI_ENABLED.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasEnabledVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'enabled'
        );
        expect(hasEnabledVariable).toBe(true);
      }
    });

    it('FORGET_WIFI_NETWORK requires ssid variable', () => {
      const operation = FORGET_WIFI_NETWORK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.variableDefinitions) {
        const hasSsidVariable = operation.variableDefinitions.some(
          varDef => varDef.variable.name.value === 'ssid'
        );
        expect(hasSsidVariable).toBe(true);
      }
    });
  });

  describe('Field selections', () => {
    it('WIFI_NETWORKS query includes network fields', () => {
      const queryString = WIFI_NETWORKS.loc?.source.body;
      expect(queryString).toContain('ssid');
      expect(queryString).toContain('signalStrength');
      expect(queryString).toContain('frequency');
      expect(queryString).toContain('security');
      expect(queryString).toContain('inUse');
      expect(queryString).toContain('saved');
    });

    it('WIFI_STATUS query includes status fields', () => {
      const queryString = WIFI_STATUS.loc?.source.body;
      expect(queryString).toContain('available');
      expect(queryString).toContain('enabled');
      expect(queryString).toContain('connected');
      expect(queryString).toContain('ssid');
      expect(queryString).toContain('signalStrength');
      expect(queryString).toContain('ipAddress');
      expect(queryString).toContain('macAddress');
      expect(queryString).toContain('frequency');
    });

    it('SAVED_WIFI_NETWORKS query includes network fields', () => {
      const queryString = SAVED_WIFI_NETWORKS.loc?.source.body;
      expect(queryString).toContain('ssid');
      expect(queryString).toContain('signalStrength');
      expect(queryString).toContain('frequency');
      expect(queryString).toContain('security');
      expect(queryString).toContain('inUse');
      expect(queryString).toContain('saved');
    });

    it('CONNECT_WIFI mutation includes result fields', () => {
      const mutationString = CONNECT_WIFI.loc?.source.body;
      expect(mutationString).toContain('success');
      expect(mutationString).toContain('message');
      expect(mutationString).toContain('connected');
    });

    it('DISCONNECT_WIFI mutation includes result fields', () => {
      const mutationString = DISCONNECT_WIFI.loc?.source.body;
      expect(mutationString).toContain('success');
      expect(mutationString).toContain('message');
      expect(mutationString).toContain('connected');
    });

    it('SET_WIFI_ENABLED mutation includes status fields', () => {
      const mutationString = SET_WIFI_ENABLED.loc?.source.body;
      expect(mutationString).toContain('available');
      expect(mutationString).toContain('enabled');
      expect(mutationString).toContain('connected');
      expect(mutationString).toContain('ssid');
      expect(mutationString).toContain('signalStrength');
      expect(mutationString).toContain('ipAddress');
      expect(mutationString).toContain('macAddress');
      expect(mutationString).toContain('frequency');
    });

    it('WIFI_STATUS_UPDATED subscription includes status fields', () => {
      const subscriptionString = WIFI_STATUS_UPDATED.loc?.source.body;
      expect(subscriptionString).toContain('available');
      expect(subscriptionString).toContain('enabled');
      expect(subscriptionString).toContain('connected');
      expect(subscriptionString).toContain('ssid');
      expect(subscriptionString).toContain('signalStrength');
      expect(subscriptionString).toContain('ipAddress');
      expect(subscriptionString).toContain('macAddress');
      expect(subscriptionString).toContain('frequency');
    });
  });

  describe('Operation types', () => {
    it('queries have correct operation type', () => {
      const queries = [WIFI_NETWORKS, WIFI_STATUS, SAVED_WIFI_NETWORKS];
      queries.forEach(query => {
        const operation = query.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('query');
        }
      });
    });

    it('mutations have correct operation type', () => {
      const mutations = [CONNECT_WIFI, DISCONNECT_WIFI, SET_WIFI_ENABLED, FORGET_WIFI_NETWORK];
      mutations.forEach(mutation => {
        const operation = mutation.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('mutation');
        }
      });
    });

    it('subscriptions have correct operation type', () => {
      const subscriptions = [WIFI_STATUS_UPDATED];
      subscriptions.forEach(subscription => {
        const operation = subscription.definitions[0];
        if (operation.kind === 'OperationDefinition') {
          expect(operation.operation).toBe('subscription');
        }
      });
    });
  });

  describe('GraphQL operation names', () => {
    it('WIFI_NETWORKS has WiFiNetworks operation name', () => {
      const operation = WIFI_NETWORKS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('WiFiNetworks');
      }
    });

    it('WIFI_STATUS has WiFiStatus operation name', () => {
      const operation = WIFI_STATUS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('WiFiStatus');
      }
    });

    it('SAVED_WIFI_NETWORKS has SavedWiFiNetworks operation name', () => {
      const operation = SAVED_WIFI_NETWORKS.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('SavedWiFiNetworks');
      }
    });

    it('CONNECT_WIFI has ConnectWiFi operation name', () => {
      const operation = CONNECT_WIFI.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('ConnectWiFi');
      }
    });

    it('DISCONNECT_WIFI has DisconnectWiFi operation name', () => {
      const operation = DISCONNECT_WIFI.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('DisconnectWiFi');
      }
    });

    it('SET_WIFI_ENABLED has SetWiFiEnabled operation name', () => {
      const operation = SET_WIFI_ENABLED.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('SetWiFiEnabled');
      }
    });

    it('FORGET_WIFI_NETWORK has ForgetWiFiNetwork operation name', () => {
      const operation = FORGET_WIFI_NETWORK.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('ForgetWiFiNetwork');
      }
    });

    it('WIFI_STATUS_UPDATED has WiFiStatusUpdated operation name', () => {
      const operation = WIFI_STATUS_UPDATED.definitions[0];
      if (operation.kind === 'OperationDefinition' && operation.name) {
        expect(operation.name.value).toBe('WiFiStatusUpdated');
      }
    });
  });
});
