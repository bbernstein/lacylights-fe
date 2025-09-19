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
            
            # Flattened fields
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
          channelValues
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
          
          # Flattened fields
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
        channelValues
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
        channelValues
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
        channelValues
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
        channelValues
      }
    }
  }
`;

export const GET_CURRENT_ACTIVE_SCENE = gql`
  query GetCurrentActiveScene {
    currentActiveScene {
      id
    }
  }
`;

export const ACTIVATE_SCENE = gql`
  mutation ActivateScene($sceneId: ID!) {
    setSceneLive(sceneId: $sceneId)
  }
`;

// Preview System Queries and Mutations
export const START_PREVIEW_SESSION = gql`
  mutation StartPreviewSession($projectId: ID!) {
    startPreviewSession(projectId: $projectId) {
      id
      project {
        id
        name
      }
      isActive
      createdAt
      dmxOutput {
        universe
        channels
      }
    }
  }
`;

export const CANCEL_PREVIEW_SESSION = gql`
  mutation CancelPreviewSession($sessionId: ID!) {
    cancelPreviewSession(sessionId: $sessionId)
  }
`;

export const COMMIT_PREVIEW_SESSION = gql`
  mutation CommitPreviewSession($sessionId: ID!) {
    commitPreviewSession(sessionId: $sessionId)
  }
`;

export const UPDATE_PREVIEW_CHANNEL = gql`
  mutation UpdatePreviewChannel($sessionId: ID!, $fixtureId: ID!, $channelIndex: Int!, $value: Int!) {
    updatePreviewChannel(sessionId: $sessionId, fixtureId: $fixtureId, channelIndex: $channelIndex, value: $value)
  }
`;

export const INITIALIZE_PREVIEW_WITH_SCENE = gql`
  mutation InitializePreviewWithScene($sessionId: ID!, $sceneId: ID!) {
    initializePreviewWithScene(sessionId: $sessionId, sceneId: $sceneId)
  }
`;

export const GET_PREVIEW_SESSION = gql`
  query GetPreviewSession($sessionId: ID!) {
    previewSession(sessionId: $sessionId) {
      id
      project {
        id
        name
      }
      isActive
      createdAt
      dmxOutput {
        universe
        channels
      }
    }
  }
`;

// Subscriptions
export const PREVIEW_SESSION_UPDATED = gql`
  subscription PreviewSessionUpdated($projectId: ID!) {
    previewSessionUpdated(projectId: $projectId) {
      id
      project {
        id
        name
      }
      isActive
      createdAt
      dmxOutput {
        universe
        channels
      }
    }
  }
`;

export const DMX_OUTPUT_CHANGED = gql`
  subscription DmxOutputChanged($universe: Int) {
    dmxOutputChanged(universe: $universe) {
      universe
      channels
    }
  }
`;