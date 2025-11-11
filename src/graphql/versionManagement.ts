import { gql } from '@apollo/client';

export const GET_SYSTEM_VERSIONS = gql`
  query GetSystemVersions {
    systemVersions {
      versionManagementSupported
      repositories {
        repository
        installed
        latest
        updateAvailable
      }
      lastChecked
    }
  }
`;

export const GET_AVAILABLE_VERSIONS = gql`
  query GetAvailableVersions($repository: String!) {
    availableVersions(repository: $repository)
  }
`;

export const UPDATE_REPOSITORY = gql`
  mutation UpdateRepository($repository: String!, $version: String) {
    updateRepository(repository: $repository, version: $version) {
      success
      repository
      previousVersion
      newVersion
      message
      error
    }
  }
`;

export const UPDATE_ALL_REPOSITORIES = gql`
  mutation UpdateAllRepositories {
    updateAllRepositories {
      success
      repository
      previousVersion
      newVersion
      message
      error
    }
  }
`;
