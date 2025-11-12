import { DocumentNode } from 'graphql';
import {
  GET_SYSTEM_VERSIONS,
  GET_AVAILABLE_VERSIONS,
  UPDATE_REPOSITORY,
  UPDATE_ALL_REPOSITORIES,
} from '../versionManagement';

// Helper type for accessing GraphQL AST properties
type GraphQLQuery = DocumentNode & {
  loc?: {
    source: {
      body: string;
    };
  };
};

describe('versionManagement GraphQL', () => {
  describe('GET_SYSTEM_VERSIONS', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_SYSTEM_VERSIONS).toBeInstanceOf(Object);
      expect((GET_SYSTEM_VERSIONS as DocumentNode).kind).toBe('Document');
    });

    it('should query for system versions', () => {
      const queryString = (GET_SYSTEM_VERSIONS as GraphQLQuery).loc?.source.body;
      expect(queryString).toContain('query GetSystemVersions');
      expect(queryString).toContain('systemVersions');
      expect(queryString).toContain('versionManagementSupported');
      expect(queryString).toContain('lastChecked');
      expect(queryString).toContain('repositories');
      expect(queryString).toContain('repository');
      expect(queryString).toContain('installed');
      expect(queryString).toContain('latest');
      expect(queryString).toContain('updateAvailable');
    });
  });

  describe('GET_AVAILABLE_VERSIONS', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_AVAILABLE_VERSIONS).toBeInstanceOf(Object);
      expect((GET_AVAILABLE_VERSIONS as DocumentNode).kind).toBe('Document');
    });

    it('should query for available versions with repository parameter', () => {
      const queryString = (GET_AVAILABLE_VERSIONS as GraphQLQuery).loc?.source.body;
      expect(queryString).toContain('query GetAvailableVersions');
      expect(queryString).toContain('$repository: String!');
      expect(queryString).toContain('availableVersions(repository: $repository)');
    });
  });

  describe('UPDATE_REPOSITORY', () => {
    it('should be a valid GraphQL mutation', () => {
      expect(UPDATE_REPOSITORY).toBeInstanceOf(Object);
      expect((UPDATE_REPOSITORY as DocumentNode).kind).toBe('Document');
    });

    it('should mutate repository with repository and version parameters', () => {
      const mutationString = (UPDATE_REPOSITORY as GraphQLQuery).loc?.source.body;
      expect(mutationString).toContain('mutation UpdateRepository');
      expect(mutationString).toContain('$repository: String!');
      expect(mutationString).toContain('$version: String');
      expect(mutationString).toContain('updateRepository(repository: $repository, version: $version)');
    });

    it('should return UpdateResult fields', () => {
      const mutationString = (UPDATE_REPOSITORY as GraphQLQuery).loc?.source.body;
      expect(mutationString).toContain('success');
      expect(mutationString).toContain('message');
      expect(mutationString).toContain('error');
      expect(mutationString).toContain('repository');
      expect(mutationString).toContain('previousVersion');
      expect(mutationString).toContain('newVersion');
    });
  });

  describe('UPDATE_ALL_REPOSITORIES', () => {
    it('should be a valid GraphQL mutation', () => {
      expect(UPDATE_ALL_REPOSITORIES).toBeInstanceOf(Object);
      expect((UPDATE_ALL_REPOSITORIES as DocumentNode).kind).toBe('Document');
    });

    it('should mutate all repositories', () => {
      const mutationString = (UPDATE_ALL_REPOSITORIES as GraphQLQuery).loc?.source.body;
      expect(mutationString).toContain('mutation UpdateAllRepositories');
      expect(mutationString).toContain('updateAllRepositories');
    });

    it('should return UpdateResult fields for all repositories', () => {
      const mutationString = (UPDATE_ALL_REPOSITORIES as GraphQLQuery).loc?.source.body;
      expect(mutationString).toContain('success');
      expect(mutationString).toContain('message');
      expect(mutationString).toContain('error');
      expect(mutationString).toContain('repository');
      expect(mutationString).toContain('previousVersion');
      expect(mutationString).toContain('newVersion');
    });
  });
});
