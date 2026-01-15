import { gql } from '@apollo/client';

// =============================================================================
// Effect Fragments
// =============================================================================

export const EFFECT_FIXTURE_FRAGMENT = gql`
  fragment EffectFixtureFields on EffectFixture {
    id
    effectId
    fixtureId
    fixture {
      id
      name
      universe
      startChannel
      manufacturer
      model
      type
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
    phaseOffset
    amplitudeScale
    effectOrder
    channels {
      id
      effectFixtureId
      channelOffset
      channelType
      amplitudeScale
      frequencyScale
      minValue
      maxValue
    }
  }
`;

export const EFFECT_FRAGMENT = gql`
  fragment EffectFields on Effect {
    id
    name
    description
    projectId
    effectType
    priorityBand
    prioritySub
    compositionMode
    onCueChange
    fadeDuration
    waveform
    frequency
    amplitude
    offset
    phaseOffset
    masterValue
    createdAt
    updatedAt
  }
`;

export const EFFECT_WITH_FIXTURES_FRAGMENT = gql`
  ${EFFECT_FIXTURE_FRAGMENT}
  fragment EffectWithFixturesFields on Effect {
    id
    name
    description
    projectId
    effectType
    priorityBand
    prioritySub
    compositionMode
    onCueChange
    fadeDuration
    waveform
    frequency
    amplitude
    offset
    phaseOffset
    masterValue
    fixtures {
      ...EffectFixtureFields
    }
    createdAt
    updatedAt
  }
`;

// =============================================================================
// Queries
// =============================================================================

export const GET_EFFECTS = gql`
  ${EFFECT_FRAGMENT}
  query GetEffects($projectId: ID!) {
    effects(projectId: $projectId) {
      ...EffectFields
    }
  }
`;

export const GET_EFFECT = gql`
  ${EFFECT_WITH_FIXTURES_FRAGMENT}
  query GetEffect($id: ID!) {
    effect(id: $id) {
      ...EffectWithFixturesFields
    }
  }
`;

export const GET_MODULATOR_STATUS = gql`
  query GetModulatorStatus {
    modulatorStatus {
      isRunning
      updateRateHz
      activeEffectCount
      activeEffects {
        effectId
        effectName
        effectType
        intensity
        phase
        isComplete
        startTime
      }
      isBlackoutActive
      blackoutIntensity
      grandMasterValue
      hasActiveTransition
      transitionProgress
    }
  }
`;

// =============================================================================
// Effect CRUD Mutations
// =============================================================================

export const CREATE_EFFECT = gql`
  ${EFFECT_FRAGMENT}
  mutation CreateEffect($input: CreateEffectInput!) {
    createEffect(input: $input) {
      ...EffectFields
    }
  }
`;

export const UPDATE_EFFECT = gql`
  ${EFFECT_FRAGMENT}
  mutation UpdateEffect($id: ID!, $input: UpdateEffectInput!) {
    updateEffect(id: $id, input: $input) {
      ...EffectFields
    }
  }
`;

export const DELETE_EFFECT = gql`
  mutation DeleteEffect($id: ID!) {
    deleteEffect(id: $id)
  }
`;

// =============================================================================
// Effect-Fixture Association Mutations
// =============================================================================

export const ADD_FIXTURE_TO_EFFECT = gql`
  ${EFFECT_FIXTURE_FRAGMENT}
  mutation AddFixtureToEffect($input: AddFixtureToEffectInput!) {
    addFixtureToEffect(input: $input) {
      ...EffectFixtureFields
    }
  }
`;

export const REMOVE_FIXTURE_FROM_EFFECT = gql`
  mutation RemoveFixtureFromEffect($effectId: ID!, $fixtureId: ID!) {
    removeFixtureFromEffect(effectId: $effectId, fixtureId: $fixtureId)
  }
`;

export const UPDATE_EFFECT_FIXTURE = gql`
  ${EFFECT_FIXTURE_FRAGMENT}
  mutation UpdateEffectFixture($id: ID!, $input: UpdateEffectFixtureInput!) {
    updateEffectFixture(id: $id, input: $input) {
      ...EffectFixtureFields
    }
  }
`;

// =============================================================================
// Effect Channel Mutations
// =============================================================================

export const EFFECT_CHANNEL_FRAGMENT = gql`
  fragment EffectChannelFields on EffectChannel {
    id
    effectFixtureId
    channelOffset
    channelType
    amplitudeScale
    frequencyScale
    minValue
    maxValue
  }
`;

export const ADD_CHANNEL_TO_EFFECT_FIXTURE = gql`
  ${EFFECT_CHANNEL_FRAGMENT}
  mutation AddChannelToEffectFixture($effectFixtureId: ID!, $input: EffectChannelInput!) {
    addChannelToEffectFixture(effectFixtureId: $effectFixtureId, input: $input) {
      ...EffectChannelFields
    }
  }
`;

export const UPDATE_EFFECT_CHANNEL = gql`
  ${EFFECT_CHANNEL_FRAGMENT}
  mutation UpdateEffectChannel($id: ID!, $input: EffectChannelInput!) {
    updateEffectChannel(id: $id, input: $input) {
      ...EffectChannelFields
    }
  }
`;

export const REMOVE_CHANNEL_FROM_EFFECT_FIXTURE = gql`
  mutation RemoveChannelFromEffectFixture($id: ID!) {
    removeChannelFromEffectFixture(id: $id)
  }
`;

// =============================================================================
// Effect-Cue Association Mutations
// =============================================================================

export const ADD_EFFECT_TO_CUE = gql`
  mutation AddEffectToCue($input: AddEffectToCueInput!) {
    addEffectToCue(input: $input) {
      id
      cueId
      effectId
      effect {
        id
        name
        effectType
        waveform
        frequency
      }
      intensity
      speed
      onCueChange
    }
  }
`;

export const REMOVE_EFFECT_FROM_CUE = gql`
  mutation RemoveEffectFromCue($cueId: ID!, $effectId: ID!) {
    removeEffectFromCue(cueId: $cueId, effectId: $effectId)
  }
`;

// =============================================================================
// Effect Playback Control Mutations
// =============================================================================

export const ACTIVATE_EFFECT = gql`
  mutation ActivateEffect($effectId: ID!, $fadeTime: Float) {
    activateEffect(effectId: $effectId, fadeTime: $fadeTime)
  }
`;

export const STOP_EFFECT = gql`
  mutation StopEffect($effectId: ID!, $fadeTime: Float) {
    stopEffect(effectId: $effectId, fadeTime: $fadeTime)
  }
`;

// =============================================================================
// System Control Mutations (Blackout, Grand Master)
// =============================================================================

export const ACTIVATE_BLACKOUT = gql`
  mutation ActivateBlackout($fadeTime: Float) {
    activateBlackout(fadeTime: $fadeTime)
  }
`;

export const RELEASE_BLACKOUT = gql`
  mutation ReleaseBlackout($fadeTime: Float) {
    releaseBlackout(fadeTime: $fadeTime)
  }
`;

export const SET_GRAND_MASTER = gql`
  mutation SetGrandMaster($value: Float!) {
    setGrandMaster(value: $value)
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

// NOTE: modulatorStatusUpdated subscription not yet implemented in backend
// TODO: Add subscription to backend schema when needed
// export const MODULATOR_STATUS_UPDATED = gql`
//   subscription ModulatorStatusUpdated {
//     modulatorStatusUpdated {
//       isRunning
//       updateRateHz
//       activeEffectCount
//       activeEffects {
//         effectId
//         effectName
//         effectType
//         intensity
//         phase
//         isComplete
//         startTime
//       }
//       isBlackoutActive
//       blackoutIntensity
//       grandMasterValue
//       hasActiveTransition
//       transitionProgress
//     }
//   }
// `;
