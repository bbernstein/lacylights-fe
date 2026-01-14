import { gql } from '@apollo/client';

// Get all look boards for a project
export const GET_PROJECT_LOOK_BOARDS = gql`
  query GetProjectLookBoards($projectId: ID!) {
    lookBoards(projectId: $projectId) {
      id
      name
      description
      defaultFadeTime
      gridSize
      canvasWidth
      canvasHeight
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
        look {
          id
          name
          description
        }
      }
    }
  }
`;

// Get a specific look board with all its buttons
export const GET_LOOK_BOARD = gql`
  query GetLookBoard($id: ID!) {
    lookBoard(id: $id) {
      id
      name
      description
      defaultFadeTime
      gridSize
      canvasWidth
      canvasHeight
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
        look {
          id
          name
          description
        }
      }
    }
  }
`;

// Create a new look board
export const CREATE_LOOK_BOARD = gql`
  mutation CreateLookBoard($input: CreateLookBoardInput!) {
    createLookBoard(input: $input) {
      id
      name
      description
      defaultFadeTime
      gridSize
      canvasWidth
      canvasHeight
      createdAt
      buttons {
        id
        layoutX
        layoutY
        look {
          id
          name
        }
      }
    }
  }
`;

// Update look board settings
export const UPDATE_LOOK_BOARD = gql`
  mutation UpdateLookBoard($id: ID!, $input: UpdateLookBoardInput!) {
    updateLookBoard(id: $id, input: $input) {
      id
      name
      description
      defaultFadeTime
      gridSize
      canvasWidth
      canvasHeight
      updatedAt
    }
  }
`;

// Delete a look board
export const DELETE_LOOK_BOARD = gql`
  mutation DeleteLookBoard($id: ID!) {
    deleteLookBoard(id: $id)
  }
`;

// Add a look button to a board
export const ADD_LOOK_TO_BOARD = gql`
  mutation AddLookToBoard($input: CreateLookBoardButtonInput!) {
    addLookToBoard(input: $input) {
      id
      layoutX
      layoutY
      width
      height
      color
      label
      look {
        id
        name
        description
      }
      lookBoard {
        id
      }
    }
  }
`;

// Update a look button's properties
export const UPDATE_LOOK_BOARD_BUTTON = gql`
  mutation UpdateLookBoardButton($id: ID!, $input: UpdateLookBoardButtonInput!) {
    updateLookBoardButton(id: $id, input: $input) {
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

// Remove a look button from a board
export const REMOVE_LOOK_FROM_BOARD = gql`
  mutation RemoveLookFromBoard($buttonId: ID!) {
    removeLookFromBoard(buttonId: $buttonId)
  }
`;

// Bulk update button positions (for drag operations)
export const UPDATE_LOOK_BOARD_BUTTON_POSITIONS = gql`
  mutation UpdateLookBoardButtonPositions($positions: [LookBoardButtonPositionInput!]!) {
    updateLookBoardButtonPositions(positions: $positions)
  }
`;

// Activate a look from the board with fade
export const ACTIVATE_LOOK_FROM_BOARD = gql`
  mutation ActivateLookFromBoard(
    $lookBoardId: ID!
    $lookId: ID!
    $fadeTimeOverride: Float
  ) {
    activateLookFromBoard(
      lookBoardId: $lookBoardId
      lookId: $lookId
      fadeTimeOverride: $fadeTimeOverride
    )
  }
`;
