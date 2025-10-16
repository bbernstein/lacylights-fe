import { gql } from '@apollo/client';

export const GET_FIXTURE_DEFINITIONS = gql`
  query GetFixtureDefinitions($filter: FixtureDefinitionFilter) {
    fixtureDefinitions(filter: $filter) {
      id
      manufacturer
      model
      type
      modes {
        id
        name
        channelCount
      }
    }
  }
`;

export const GET_MANUFACTURERS = gql`
  query GetManufacturers($search: String) {
    fixtureDefinitions(filter: { manufacturer: $search }) {
      manufacturer
    }
  }
`;

export const GET_MODELS = gql`
  query GetModels($manufacturer: String!, $search: String) {
    fixtureDefinitions(filter: { manufacturer: $manufacturer, model: $search }) {
      id
      model
      modes {
        id
        name
        channelCount
      }
    }
  }
`;

export const CREATE_FIXTURE_INSTANCE = gql`
  mutation CreateFixtureInstance($input: CreateFixtureInstanceInput!) {
    createFixtureInstance(input: $input) {
      id
      name
      description
      universe
      startChannel
      # Flattened fields
      manufacturer
      model
      modeName
      channelCount
    }
  }
`;

export const UPDATE_FIXTURE_INSTANCE = gql`
  mutation UpdateFixtureInstance($id: ID!, $input: UpdateFixtureInstanceInput!) {
    updateFixtureInstance(id: $id, input: $input) {
      id
      name
      description
      universe
      startChannel
      # Flattened fields
      manufacturer
      model
      modeName
      channelCount
    }
  }
`;

export const DELETE_FIXTURE_INSTANCE = gql`
  mutation DeleteFixtureInstance($id: ID!) {
    deleteFixtureInstance(id: $id)
  }
`;

export const GET_PROJECT_FIXTURES = gql`
  query GetProjectFixtures($projectId: ID!) {
    project(id: $projectId) {
      id
      fixtures {
        id
        name
        description
        universe
        startChannel
        tags
        projectOrder
        createdAt
        
        # Flattened fields
        definitionId
        manufacturer
        model
        type
        modeName
        channelCount
        channels {
          id
          offset
          name
          type
          minValue
          maxValue
          defaultValue
        }
        
      }
    }
  }
`;

export const REORDER_PROJECT_FIXTURES = gql`
  mutation ReorderProjectFixtures($projectId: ID!, $fixtureOrders: [FixtureOrderInput!]!) {
    reorderProjectFixtures(projectId: $projectId, fixtureOrders: $fixtureOrders)
  }
`;

export const REORDER_SCENE_FIXTURES = gql`
  mutation ReorderSceneFixtures($sceneId: ID!, $fixtureOrders: [FixtureOrderInput!]!) {
    reorderSceneFixtures(sceneId: $sceneId, fixtureOrders: $fixtureOrders)
  }
`;

export const UPDATE_FIXTURE_POSITIONS = gql`
  mutation UpdateFixturePositions($positions: [FixturePositionInput!]!) {
    updateFixturePositions(positions: $positions)
  }
`;