import { DocumentNode } from 'graphql';
import {
  GET_SETTINGS,
  GET_SETTING,
  UPDATE_SETTING,
  GET_SYSTEM_INFO,
  GET_NETWORK_INTERFACE_OPTIONS,
  SYSTEM_INFO_UPDATED,
} from '../settings';

// Helper type for accessing GraphQL AST properties
type GraphQLQuery = DocumentNode & {
  loc?: {
    source: {
      body: string;
    };
  };
};

describe('settings GraphQL', () => {
  describe('GET_SETTINGS', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_SETTINGS).toBeInstanceOf(Object);
      expect((GET_SETTINGS as DocumentNode).kind).toBe('Document');
    });

    it('should query for settings', () => {
      const queryString = (GET_SETTINGS as GraphQLQuery).loc?.source.body;
      expect(queryString).toContain('query GetSettings');
      expect(queryString).toContain('settings');
      expect(queryString).toContain('id');
      expect(queryString).toContain('key');
      expect(queryString).toContain('value');
    });
  });

  describe('GET_SETTING', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_SETTING).toBeInstanceOf(Object);
      expect((GET_SETTING as DocumentNode).kind).toBe('Document');
    });

    it('should query for a single setting with key parameter', () => {
      const queryString = (GET_SETTING as GraphQLQuery).loc?.source.body;
      expect(queryString).toContain('query GetSetting');
      expect(queryString).toContain('$key: String!');
      expect(queryString).toContain('setting(key: $key)');
    });
  });

  describe('UPDATE_SETTING', () => {
    it('should be a valid GraphQL mutation', () => {
      expect(UPDATE_SETTING).toBeInstanceOf(Object);
      expect((UPDATE_SETTING as DocumentNode).kind).toBe('Document');
    });

    it('should mutate setting with input parameter', () => {
      const mutationString = (UPDATE_SETTING as GraphQLQuery).loc?.source.body;
      expect(mutationString).toContain('mutation UpdateSetting');
      expect(mutationString).toContain('$input: UpdateSettingInput!');
      expect(mutationString).toContain('updateSetting(input: $input)');
    });
  });

  describe('GET_SYSTEM_INFO', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_SYSTEM_INFO).toBeInstanceOf(Object);
      expect((GET_SYSTEM_INFO as DocumentNode).kind).toBe('Document');
    });

    it('should query for system info', () => {
      const queryString = (GET_SYSTEM_INFO as GraphQLQuery).loc?.source.body;
      expect(queryString).toContain('query GetSystemInfo');
      expect(queryString).toContain('systemInfo');
      expect(queryString).toContain('artnetBroadcastAddress');
      expect(queryString).toContain('artnetEnabled');
    });
  });

  describe('GET_NETWORK_INTERFACE_OPTIONS', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_NETWORK_INTERFACE_OPTIONS).toBeInstanceOf(Object);
      expect((GET_NETWORK_INTERFACE_OPTIONS as DocumentNode).kind).toBe('Document');
    });

    it('should query for network interface options', () => {
      const queryString = (GET_NETWORK_INTERFACE_OPTIONS as GraphQLQuery).loc?.source.body;
      expect(queryString).toContain('query GetNetworkInterfaceOptions');
      expect(queryString).toContain('networkInterfaceOptions');
      expect(queryString).toContain('name');
      expect(queryString).toContain('address');
      expect(queryString).toContain('broadcast');
      expect(queryString).toContain('description');
      expect(queryString).toContain('interfaceType');
    });
  });

  describe('SYSTEM_INFO_UPDATED', () => {
    it('should be a valid GraphQL subscription', () => {
      expect(SYSTEM_INFO_UPDATED).toBeInstanceOf(Object);
      expect((SYSTEM_INFO_UPDATED as DocumentNode).kind).toBe('Document');
    });

    it('should subscribe to system info updates', () => {
      const subscriptionString = (SYSTEM_INFO_UPDATED as GraphQLQuery).loc?.source.body;
      expect(subscriptionString).toContain('subscription SystemInfoUpdated');
      expect(subscriptionString).toContain('systemInfoUpdated');
      expect(subscriptionString).toContain('artnetBroadcastAddress');
      expect(subscriptionString).toContain('artnetEnabled');
    });
  });
});
