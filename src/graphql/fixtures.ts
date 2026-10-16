import { gql } from '@apollo/client';

export const GET_FIXTURE_DEFINITIONS = gql`
  query GetFixtureDefinitions($filter: FixtureDefinitionFilter) {
    fixtureDefinitions(filter: $filter) {
      id
      manufacturer
      model
      type
      source
      sourceVersion
      modes {
        id
        name
        channelCount
      }
    }
  }
`;

export const GET_MANUFACTURERS = gql`
  query GetManufacturers($search: String) {
    fixtureDefinitions(filter: { manufacturer: $search }) {
      manufacturer
    }
  }
`;

/**
 * Models (one entry per fixture definition) for a manufacturer. Several
 * definitions can share a model name, one per source (OFL, GDTF, a user's
 * own definition, ...); `source` tells them apart. See
 * `src/lib/fixtureSources.ts` for ordering them by the source precedence.
 */
export const GET_MODELS = gql`
  query GetModels($manufacturer: String!, $search: String) {
    fixtureDefinitions(filter: { manufacturer: $manufacturer, model: $search }) {
      id
      model
      source
      sourceVersion
      modes {
        id
        name
        channelCount
      }
    }
  }
`;

/**
 * GET_MODELS without the source fields, for backends that predate fixture
 * definition sources (they reject `FixtureDefinition.source`). Used by
 * `useFixtureModels` as a fallback; such backends have at most one
 * definition per manufacturer + model.
 */
export const GET_MODELS_LEGACY = gql`
  query GetModelsLegacy($manufacturer: String!, $search: String) {
    fixtureDefinitions(filter: { manufacturer: $manufacturer, model: $search }) {
      id
      model
      modes {
        id
        name
        channelCount
      }
    }
  }
`;

/** Fixture sources in preference order, highest first. */
export const GET_FIXTURE_SOURCE_PRECEDENCE = gql`
  query GetFixtureSourcePrecedence {
    fixtureSourcePrecedence
  }
`;

/**
 * Store the fixture source preference order (highest first). The backend
 * appends sources left out (in default order), rejects duplicates and
 * returns the stored order.
 */
export const SET_FIXTURE_SOURCE_PRECEDENCE = gql`
  mutation SetFixtureSourcePrecedence($order: [FixtureSource!]!) {
    setFixtureSourcePrecedence(order: $order)
  }
`;

export const CREATE_FIXTURE_INSTANCE = gql`
  mutation CreateFixtureInstance($input: CreateFixtureInstanceInput!) {
    createFixtureInstance(input: $input) {
      id
      name
      description
      universe
      startChannel
      # Flattened fields
      manufacturer
      model
      modeName
      channelCount
    }
  }
`;

export const UPDATE_FIXTURE_INSTANCE = gql`
  mutation UpdateFixtureInstance($id: ID!, $input: UpdateFixtureInstanceInput!) {
    updateFixtureInstance(id: $id, input: $input) {
      id
      name
      description
      universe
      startChannel
      # Flattened fields
      manufacturer
      model
      modeName
      channelCount
    }
  }
`;

export const DELETE_FIXTURE_INSTANCE = gql`
  mutation DeleteFixtureInstance($id: ID!) {
    deleteFixtureInstance(id: $id)
  }
`;

export const IMPORT_OFL_FIXTURE = gql`
  mutation ImportOFLFixture($input: ImportOFLFixtureInput!) {
    importOFLFixture(input: $input) {
      id
      manufacturer
      model
      type
      channels {
        id
        name
        type
        offset
        fadeBehavior
        isDiscrete
      }
      modes {
        id
        name
        shortName
        channelCount
      }
    }
  }
`;

export const GET_PROJECT_FIXTURES = gql`
  query GetProjectFixtures($projectId: ID!) {
    project(id: $projectId) {
      id
      fixtures {
        id
        name
        description
        universe
        startChannel
        tags
        projectOrder
        createdAt
        
        # Flattened fields
        definitionId
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
          fadeBehavior
          isDiscrete
        }

      }
    }
  }
`;

export const REORDER_PROJECT_FIXTURES = gql`
  mutation ReorderProjectFixtures($projectId: ID!, $fixtureOrders: [FixtureOrderInput!]!) {
    reorderProjectFixtures(projectId: $projectId, fixtureOrders: $fixtureOrders)
  }
`;

export const REORDER_LOOK_FIXTURES = gql`
  mutation ReorderLookFixtures($lookId: ID!, $fixtureOrders: [FixtureOrderInput!]!) {
    reorderLookFixtures(lookId: $lookId, fixtureOrders: $fixtureOrders)
  }
`;

export const UPDATE_FIXTURE_POSITIONS = gql`
  mutation UpdateFixturePositions($positions: [FixturePositionInput!]!) {
    updateFixturePositions(positions: $positions)
  }
`;

export const SUGGEST_CHANNEL_ASSIGNMENT = gql`
  query SuggestChannelAssignment($input: ChannelAssignmentInput!) {
    suggestChannelAssignment(input: $input) {
      universe
      assignments {
        fixtureName
        manufacturer
        model
        mode
        startChannel
        endChannel
        channelCount
        channelRange
      }
      totalChannelsNeeded
      availableChannelsRemaining
    }
  }
`;

export const GET_CHANNEL_MAP = gql`
  query GetChannelMap($projectId: ID!, $universe: Int) {
    channelMap(projectId: $projectId, universe: $universe) {
      projectId
      universes {
        universe
        fixtures {
          id
          name
          type
          startChannel
          endChannel
          channelCount
        }
        availableChannels
        usedChannels
      }
    }
  }
`;

// Bulk Fixture Operations
export const BULK_CREATE_FIXTURES = gql`
  mutation BulkCreateFixtures($input: BulkFixtureCreateInput!) {
    bulkCreateFixtures(input: $input) {
      id
      name
      description
      universe
      startChannel
      tags
      projectOrder
      createdAt

      # Flattened fields
      definitionId
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
        fadeBehavior
        isDiscrete
      }

      # 2D Layout Position
      layoutX
      layoutY
      layoutRotation
    }
  }
`;

export const BULK_UPDATE_FIXTURES = gql`
  mutation BulkUpdateFixtures($input: BulkFixtureUpdateInput!) {
    bulkUpdateFixtures(input: $input) {
      id
      name
      description
      universe
      startChannel
      tags
      projectOrder

      # Flattened fields
      definitionId
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
        fadeBehavior
        isDiscrete
      }

      # 2D Layout Position
      layoutX
      layoutY
      layoutRotation
    }
  }
`;

// Instance Channel Updates
export const UPDATE_INSTANCE_CHANNEL_FADE_BEHAVIOR = gql`
  mutation UpdateInstanceChannelFadeBehavior(
    $channelId: ID!
    $fadeBehavior: FadeBehavior!
  ) {
    updateInstanceChannelFadeBehavior(
      channelId: $channelId
      fadeBehavior: $fadeBehavior
    ) {
      id
      offset
      name
      type
      minValue
      maxValue
      defaultValue
      fadeBehavior
      isDiscrete
    }
  }
`;

export const BULK_UPDATE_INSTANCE_CHANNELS_FADE_BEHAVIOR = gql`
  mutation BulkUpdateInstanceChannelsFadeBehavior(
    $updates: [ChannelFadeBehaviorInput!]!
  ) {
    bulkUpdateInstanceChannelsFadeBehavior(updates: $updates) {
      id
      offset
      name
      type
      minValue
      maxValue
      defaultValue
      fadeBehavior
      isDiscrete
    }
  }
`;