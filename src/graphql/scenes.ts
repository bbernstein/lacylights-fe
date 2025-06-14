import { gql } from '@apollo/client';

export const GET_PROJECT_SCENES = gql`
  query GetProjectScenes($projectId: ID!) {
    project(id: $projectId) {
      id
      scenes {
        id
        name
        description
        createdAt
        updatedAt
        fixtureValues {
          id
          fixture {
            id
            name
            universe
            startChannel
            definition {
              manufacturer
              model
            }
          }
          channelValues {
            channel {
              id
              name
              type
            }
            value
          }
        }
      }
    }
  }
`;

export const GET_SCENE = gql`
  query GetScene($id: ID!) {
    scene(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      project {
        id
        name
      }
      fixtureValues {
        id
        fixture {
          id
          name
          universe
          startChannel
          definition {
            id
            manufacturer
            model
            channels {
              id
              name
              type
              defaultValue
              minValue
              maxValue
            }
          }
          mode {
            id
            name
            channelCount
          }
        }
        channelValues {
          channel {
            id
            name
            type
            minValue
            maxValue
            defaultValue
          }
          value
        }
      }
    }
  }
`;

export const CREATE_SCENE = gql`
  mutation CreateScene($input: CreateSceneInput!) {
    createScene(input: $input) {
      id
      name
      description
      createdAt
      fixtureValues {
        fixture {
          id
          name
        }
        channelValues {
          channel {
            name
            type
          }
          value
        }
      }
    }
  }
`;

export const UPDATE_SCENE = gql`
  mutation UpdateScene($id: ID!, $input: UpdateSceneInput!) {
    updateScene(id: $id, input: $input) {
      id
      name
      description
      updatedAt
      fixtureValues {
        fixture {
          id
          name
        }
        channelValues {
          channel {
            name
            type
          }
          value
        }
      }
    }
  }
`;

export const DELETE_SCENE = gql`
  mutation DeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`;

export const DUPLICATE_SCENE = gql`
  mutation DuplicateScene($id: ID!) {
    duplicateScene(id: $id) {
      id
      name
      description
      createdAt
      fixtureValues {
        fixture {
          id
          name
        }
        channelValues {
          channel {
            name
            type
          }
          value
        }
      }
    }
  }
`;

export const ACTIVATE_SCENE = gql`
  mutation ActivateScene($sceneId: ID!) {
    setSceneLive(sceneId: $sceneId)
  }
`;