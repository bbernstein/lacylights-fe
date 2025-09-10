import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      fixtures {
        id
        name
      }
      scenes {
        id
        name
      }
      cueLists {
        id
        name
      }
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: CreateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const IMPORT_PROJECT_FROM_QLC = gql`
  mutation ImportProjectFromQLC($xmlContent: String!, $originalFileName: String!) {
    importProjectFromQLC(xmlContent: $xmlContent, originalFileName: $originalFileName) {
      project {
        id
        name
        description
        createdAt
        updatedAt
      }
      originalFileName
      fixtureCount
      sceneCount
      cueListCount
      warnings
    }
  }
`;

export const GET_QLC_FIXTURE_MAPPING_SUGGESTIONS = gql`
  query GetQLCFixtureMappingSuggestions($projectId: ID!) {
    getQLCFixtureMappingSuggestions(projectId: $projectId) {
      projectId
      lacyLightsFixtures {
        manufacturer
        model
      }
      suggestions {
        fixture {
          manufacturer
          model
        }
        suggestions {
          manufacturer
          model
          type
          modes {
            name
            channelCount
          }
        }
      }
      defaultMappings {
        lacyLightsKey
        qlcManufacturer
        qlcModel
        qlcMode
      }
    }
  }
`;

export const EXPORT_PROJECT_TO_QLC = gql`
  mutation ExportProjectToQLC($projectId: ID!, $fixtureMappings: [FixtureMappingInput!]!) {
    exportProjectToQLC(projectId: $projectId, fixtureMappings: $fixtureMappings) {
      projectName
      xmlContent
      fixtureCount
      sceneCount
      cueListCount
    }
  }
`;