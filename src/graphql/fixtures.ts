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
      definition {
        manufacturer
        model
      }
      mode {
        id
        name
        channelCount
      }
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
      definition {
        id
        manufacturer
        model
      }
      mode {
        id
        name
        channelCount
      }
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
        mode {
          id
          name
          channelCount
          channels {
            id
            channel {
              id
              name
              type
              defaultValue
              minValue
              maxValue
            }
          }
        }
        definition {
          id
          manufacturer
          model
          type
          channels {
            id
            name
            type
            defaultValue
            minValue
            maxValue
          }
          modes {
            id
            name
            channelCount
            channels {
              id
              channel {
                id
                name
                type
                defaultValue
                minValue
                maxValue
              }
            }
          }
        }
      }
    }
  }
`;