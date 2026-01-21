import { gql } from '@apollo/client';

/**
 * Subscription for real-time look data changes.
 * Triggered by undo/redo operations that affect looks.
 */
export const LOOK_DATA_CHANGED_SUBSCRIPTION = gql`
  subscription LookDataChanged($projectId: ID!) {
    lookDataChanged(projectId: $projectId) {
      lookId
      projectId
      changeType
      timestamp
    }
  }
`;

/**
 * Subscription for real-time look board data changes.
 * Triggered by undo/redo operations that affect look boards or their buttons.
 */
export const LOOK_BOARD_DATA_CHANGED_SUBSCRIPTION = gql`
  subscription LookBoardDataChanged($projectId: ID!) {
    lookBoardDataChanged(projectId: $projectId) {
      lookBoardId
      projectId
      changeType
      affectedButtonIds
      timestamp
    }
  }
`;

/**
 * Subscription for real-time fixture data changes.
 * Triggered by position updates or undo/redo operations that affect fixture positions.
 */
export const FIXTURE_DATA_CHANGED_SUBSCRIPTION = gql`
  subscription FixtureDataChanged($projectId: ID!) {
    fixtureDataChanged(projectId: $projectId) {
      fixtureIds
      projectId
      changeType
      timestamp
    }
  }
`;
