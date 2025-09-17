import { gql } from '@apollo/client';

export const GET_PROJECT_CUE_LISTS = gql`
  query GetProjectCueLists($projectId: ID!) {
    project(id: $projectId) {
      id
      cueLists {
        id
        name
        description
        createdAt
        updatedAt
        cues {
          id
          name
          cueNumber
          scene {
            id
            name
          }
          fadeInTime
          fadeOutTime
          followTime
          notes
        }
      }
    }
  }
`;

export const GET_CUE_LIST = gql`
  query GetCueList($id: ID!) {
    cueList(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      project {
        id
        name
      }
      cues {
        id
        name
        cueNumber
        scene {
          id
          name
          description
        }
        fadeInTime
        fadeOutTime
        followTime
        notes
      }
    }
  }
`;

export const CREATE_CUE_LIST = gql`
  mutation CreateCueList($input: CreateCueListInput!) {
    createCueList(input: $input) {
      id
      name
      description
      createdAt
      cues {
        id
        name
        cueNumber
      }
    }
  }
`;

export const UPDATE_CUE_LIST = gql`
  mutation UpdateCueList($id: ID!, $input: CreateCueListInput!) {
    updateCueList(id: $id, input: $input) {
      id
      name
      description
      updatedAt
      cues {
        id
        name
        cueNumber
      }
    }
  }
`;

export const DELETE_CUE_LIST = gql`
  mutation DeleteCueList($id: ID!) {
    deleteCueList(id: $id)
  }
`;

export const CREATE_CUE = gql`
  mutation CreateCue($input: CreateCueInput!) {
    createCue(input: $input) {
      id
      name
      cueNumber
      scene {
        id
        name
      }
      fadeInTime
      fadeOutTime
      followTime
      notes
    }
  }
`;

export const UPDATE_CUE = gql`
  mutation UpdateCue($id: ID!, $input: CreateCueInput!) {
    updateCue(id: $id, input: $input) {
      id
      name
      cueNumber
      scene {
        id
        name
      }
      fadeInTime
      fadeOutTime
      followTime
      notes
    }
  }
`;

export const DELETE_CUE = gql`
  mutation DeleteCue($id: ID!) {
    deleteCue(id: $id)
  }
`;

export const PLAY_CUE = gql`
  mutation PlayCue($cueId: ID!, $fadeInTime: Float) {
    playCue(cueId: $cueId, fadeInTime: $fadeInTime)
  }
`;

export const FADE_TO_BLACK = gql`
  mutation FadeToBlack($fadeOutTime: Float!) {
    fadeToBlack(fadeOutTime: $fadeOutTime)
  }
`;

export const REORDER_CUES = gql`
  mutation ReorderCues($cueListId: ID!, $cueOrders: [CueOrderInput!]!) {
    reorderCues(cueListId: $cueListId, cueOrders: $cueOrders)
  }
`;

export const BULK_UPDATE_CUES = gql`
  mutation BulkUpdateCues($input: BulkCueUpdateInput!) {
    bulkUpdateCues(input: $input) {
      id
      name
      cueNumber
      scene {
        id
        name
      }
      fadeInTime
      fadeOutTime
      followTime
      notes
    }
  }
`;