import { gql } from '@apollo/client';

export const GET_PROJECT_CUE_LISTS = gql`
  query GetProjectCueLists($projectId: ID!) {
    project(id: $projectId) {
      id
      cueLists {
        id
        name
        description
        loop
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
          easingType
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
      loop
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
        easingType
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
      loop
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
      loop
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
      easingType
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
      easingType
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
      easingType
    }
  }
`;

export const GET_CUE_LIST_PLAYBACK_STATUS = gql`
  query GetCueListPlaybackStatus($cueListId: ID!) {
    cueListPlaybackStatus(cueListId: $cueListId) {
      cueListId
      currentCueIndex
      isPlaying
      isPaused
      isFading
      fadeProgress
      lastUpdated
    }
  }
`;

export const START_CUE_LIST = gql`
  mutation StartCueList($cueListId: ID!, $startFromCue: Int) {
    startCueList(cueListId: $cueListId, startFromCue: $startFromCue)
  }
`;

export const NEXT_CUE = gql`
  mutation NextCue($cueListId: ID!, $fadeInTime: Float) {
    nextCue(cueListId: $cueListId, fadeInTime: $fadeInTime)
  }
`;

export const PREVIOUS_CUE = gql`
  mutation PreviousCue($cueListId: ID!, $fadeInTime: Float) {
    previousCue(cueListId: $cueListId, fadeInTime: $fadeInTime)
  }
`;

export const GO_TO_CUE = gql`
  mutation GoToCue($cueListId: ID!, $cueIndex: Int!, $fadeInTime: Float) {
    goToCue(cueListId: $cueListId, cueIndex: $cueIndex, fadeInTime: $fadeInTime)
  }
`;

export const STOP_CUE_LIST = gql`
  mutation StopCueList($cueListId: ID!) {
    stopCueList(cueListId: $cueListId)
  }
`;

export const CUE_LIST_PLAYBACK_SUBSCRIPTION = gql`
  subscription CueListPlaybackUpdated($cueListId: ID!) {
    cueListPlaybackUpdated(cueListId: $cueListId) {
      cueListId
      currentCueIndex
      isPlaying
      isPaused
      isFading
      fadeProgress
      lastUpdated
    }
  }
`;

export const GET_GLOBAL_PLAYBACK_STATUS = gql`
  query GetGlobalPlaybackStatus {
    globalPlaybackStatus {
      isPlaying
      isPaused
      isFading
      cueListId
      cueListName
      currentCueIndex
      cueCount
      currentCueName
      fadeProgress
      lastUpdated
    }
  }
`;

export const GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION = gql`
  subscription GlobalPlaybackStatusUpdated {
    globalPlaybackStatusUpdated {
      isPlaying
      isPaused
      isFading
      cueListId
      cueListName
      currentCueIndex
      cueCount
      currentCueName
      fadeProgress
      lastUpdated
    }
  }
`;

export const RESUME_CUE_LIST = gql`
  mutation ResumeCueList($cueListId: ID!) {
    resumeCueList(cueListId: $cueListId)
  }
`;
