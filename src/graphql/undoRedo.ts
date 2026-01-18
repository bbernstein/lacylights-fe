import { gql } from '@apollo/client';

// Queries
export const GET_UNDO_REDO_STATUS = gql`
  query GetUndoRedoStatus($projectId: ID!) {
    undoRedoStatus(projectId: $projectId) {
      projectId
      canUndo
      canRedo
      currentSequence
      totalOperations
      undoDescription
      redoDescription
    }
  }
`;

export const GET_OPERATION_HISTORY = gql`
  query GetOperationHistory($projectId: ID!, $page: Int, $perPage: Int) {
    operationHistory(projectId: $projectId, page: $page, perPage: $perPage) {
      operations {
        id
        description
        operationType
        entityType
        sequence
        createdAt
        isCurrent
      }
      pagination {
        total
        page
        perPage
        totalPages
        hasMore
      }
      currentSequence
    }
  }
`;

export const GET_OPERATION = gql`
  query GetOperation($operationId: ID!) {
    operation(operationId: $operationId) {
      id
      projectId
      operationType
      entityType
      entityId
      description
      sequence
      createdAt
      relatedIds
    }
  }
`;

// Mutations
export const UNDO = gql`
  mutation Undo($projectId: ID!) {
    undo(projectId: $projectId) {
      success
      message
      restoredEntityId
      operation {
        id
        description
        operationType
        entityType
        sequence
      }
    }
  }
`;

export const REDO = gql`
  mutation Redo($projectId: ID!) {
    redo(projectId: $projectId) {
      success
      message
      restoredEntityId
      operation {
        id
        description
        operationType
        entityType
        sequence
      }
    }
  }
`;

export const JUMP_TO_OPERATION = gql`
  mutation JumpToOperation($projectId: ID!, $operationId: ID!) {
    jumpToOperation(projectId: $projectId, operationId: $operationId) {
      success
      message
      restoredEntityId
      operation {
        id
        description
        operationType
        entityType
        sequence
      }
    }
  }
`;

export const CLEAR_OPERATION_HISTORY = gql`
  mutation ClearOperationHistory($projectId: ID!, $confirmClear: Boolean!) {
    clearOperationHistory(projectId: $projectId, confirmClear: $confirmClear)
  }
`;

// Subscriptions
export const OPERATION_HISTORY_CHANGED = gql`
  subscription OperationHistoryChanged($projectId: ID!) {
    operationHistoryChanged(projectId: $projectId) {
      projectId
      canUndo
      canRedo
      currentSequence
      totalOperations
      undoDescription
      redoDescription
    }
  }
`;
