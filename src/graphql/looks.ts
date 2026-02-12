import { gql } from '@apollo/client';

export const GET_PROJECT_LOOKS = gql`
  query GetProjectLooks($projectId: ID!) {
    project(id: $projectId) {
      id
      looks {
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
          channels {
            offset
            value
          }
        }
      }
    }
  }
`;

export const GET_LOOK = gql`
  query GetLook($id: ID!) {
    look(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      project {
        id
        name
        layoutCanvasWidth
        layoutCanvasHeight
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

          # 2D Layout Position
          layoutX
          layoutY
          layoutRotation
        }
        channels {
          offset
          value
        }
      }
    }
  }
`;

export const CREATE_LOOK = gql`
  mutation CreateLook($input: CreateLookInput!) {
    createLook(input: $input) {
      id
      name
      description
      createdAt
      fixtureValues {
        fixture {
          id
          name
        }
        channels {
          offset
          value
        }
      }
    }
  }
`;

export const UPDATE_LOOK = gql`
  mutation UpdateLook($id: ID!, $input: UpdateLookInput!) {
    updateLook(id: $id, input: $input) {
      id
      name
      description
      updatedAt
      fixtureValues {
        fixture {
          id
          name
        }
        channels {
          offset
          value
        }
      }
    }
  }
`;

export const DELETE_LOOK = gql`
  mutation DeleteLook($id: ID!) {
    deleteLook(id: $id)
  }
`;

export const DUPLICATE_LOOK = gql`
  mutation DuplicateLook($id: ID!) {
    duplicateLook(id: $id) {
      id
      name
      description
      createdAt
      fixtureValues {
        fixture {
          id
          name
        }
        channels {
          offset
          value
        }
      }
    }
  }
`;

export const GET_CURRENT_ACTIVE_LOOK = gql`
  query GetCurrentActiveLook {
    currentActiveLook {
      id
    }
  }
`;

export const ACTIVATE_LOOK = gql`
  mutation ActivateLook($lookId: ID!) {
    setLookLive(lookId: $lookId)
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

export const UPDATE_PREVIEW_CHANNELS = gql`
  mutation UpdatePreviewChannels($sessionId: ID!, $updates: [PreviewChannelUpdateInput!]!) {
    updatePreviewChannels(sessionId: $sessionId, updates: $updates)
  }
`;

export const INITIALIZE_PREVIEW_WITH_LOOK = gql`
  mutation InitializePreviewWithLook($sessionId: ID!, $lookId: ID!) {
    initializePreviewWithLook(sessionId: $sessionId, lookId: $lookId)
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

export const COPY_FIXTURES_TO_LOOKS = gql`
  mutation CopyFixturesToLooks($input: CopyFixturesToLooksInput!) {
    copyFixturesToLooks(input: $input) {
      updatedLookCount
      affectedCueCount
      operationId
      updatedLooks {
        id
        name
        updatedAt
        fixtureValues {
          fixture {
            id
            name
          }
          channels {
            offset
            value
          }
        }
      }
    }
  }
`;
