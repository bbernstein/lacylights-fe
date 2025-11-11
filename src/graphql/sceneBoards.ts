import { gql } from '@apollo/client';

// Get all scene boards for a project
export const GET_PROJECT_SCENE_BOARDS = gql`
  query GetProjectSceneBoards($projectId: ID!) {
    sceneBoards(projectId: $projectId) {
      id
      name
      description
      defaultFadeTime
      gridSize
      createdAt
      updatedAt
      buttons {
        id
        layoutX
        layoutY
        width
        height
        color
        label
        scene {
          id
          name
          description
        }
      }
    }
  }
`;

// Get a specific scene board with all its buttons
export const GET_SCENE_BOARD = gql`
  query GetSceneBoard($id: ID!) {
    sceneBoard(id: $id) {
      id
      name
      description
      defaultFadeTime
      gridSize
      createdAt
      updatedAt
      project {
        id
        name
      }
      buttons {
        id
        layoutX
        layoutY
        width
        height
        color
        label
        createdAt
        scene {
          id
          name
          description
        }
      }
    }
  }
`;

// Create a new scene board
export const CREATE_SCENE_BOARD = gql`
  mutation CreateSceneBoard($input: CreateSceneBoardInput!) {
    createSceneBoard(input: $input) {
      id
      name
      description
      defaultFadeTime
      gridSize
      createdAt
      buttons {
        id
        layoutX
        layoutY
        scene {
          id
          name
        }
      }
    }
  }
`;

// Update scene board settings
export const UPDATE_SCENE_BOARD = gql`
  mutation UpdateSceneBoard($id: ID!, $input: UpdateSceneBoardInput!) {
    updateSceneBoard(id: $id, input: $input) {
      id
      name
      description
      defaultFadeTime
      gridSize
      updatedAt
    }
  }
`;

// Delete a scene board
export const DELETE_SCENE_BOARD = gql`
  mutation DeleteSceneBoard($id: ID!) {
    deleteSceneBoard(id: $id)
  }
`;

// Add a scene button to a board
export const ADD_SCENE_TO_BOARD = gql`
  mutation AddSceneToBoard($input: CreateSceneBoardButtonInput!) {
    addSceneToBoard(input: $input) {
      id
      layoutX
      layoutY
      width
      height
      color
      label
      scene {
        id
        name
        description
      }
      sceneBoard {
        id
      }
    }
  }
`;

// Update a scene button's properties
export const UPDATE_SCENE_BOARD_BUTTON = gql`
  mutation UpdateSceneBoardButton($id: ID!, $input: UpdateSceneBoardButtonInput!) {
    updateSceneBoardButton(id: $id, input: $input) {
      id
      layoutX
      layoutY
      width
      height
      color
      label
    }
  }
`;

// Remove a scene button from a board
export const REMOVE_SCENE_FROM_BOARD = gql`
  mutation RemoveSceneFromBoard($buttonId: ID!) {
    removeSceneFromBoard(buttonId: $buttonId)
  }
`;

// Bulk update button positions (for drag operations)
export const UPDATE_SCENE_BOARD_BUTTON_POSITIONS = gql`
  mutation UpdateSceneBoardButtonPositions($positions: [SceneBoardButtonPositionInput!]!) {
    updateSceneBoardButtonPositions(positions: $positions)
  }
`;

// Activate a scene from the board with fade
export const ACTIVATE_SCENE_FROM_BOARD = gql`
  mutation ActivateSceneFromBoard(
    $sceneBoardId: ID!
    $sceneId: ID!
    $fadeTimeOverride: Float
  ) {
    activateSceneFromBoard(
      sceneBoardId: $sceneBoardId
      sceneId: $sceneId
      fadeTimeOverride: $fadeTimeOverride
    )
  }
`;
