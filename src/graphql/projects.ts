import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      createdAt
      updatedAt
      layoutCanvasWidth
      layoutCanvasHeight
      groupId
      group {
        id
        name
        isPersonal
      }
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
      layoutCanvasWidth
      layoutCanvasHeight
      groupId
      group {
        id
        name
        isPersonal
      }
      fixtures {
        id
        name
      }
      looks {
        id
        name
      }
      cueLists {
        id
        name
        loop
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
      groupId
      group {
        id
        name
        isPersonal
      }
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
      lookCount
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
      lookCount
      cueListCount
    }
  }
`;

export const EXPORT_PROJECT = gql`
  mutation ExportProject($projectId: ID!, $options: ExportOptionsInput) {
    exportProject(projectId: $projectId, options: $options) {
      projectId
      projectName
      jsonContent
      stats {
        fixtureDefinitionsCount
        fixtureInstancesCount
        looksCount
        cueListsCount
        cuesCount
      }
    }
  }
`;

export const IMPORT_PROJECT = gql`
  mutation ImportProject($jsonContent: String!, $options: ImportOptionsInput!) {
    importProject(jsonContent: $jsonContent, options: $options) {
      projectId
      stats {
        fixtureDefinitionsCreated
        fixtureInstancesCreated
        looksCreated
        cueListsCreated
        cuesCreated
      }
      warnings
    }
  }
`;