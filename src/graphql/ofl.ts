import { gql } from '@apollo/client';

// Fragments for reuse
export const OFL_IMPORT_STATS_FRAGMENT = gql`
  fragment OFLImportStatsFields on OFLImportStats {
    totalProcessed
    successfulImports
    failedImports
    skippedDuplicates
    updatedFixtures
    durationSeconds
  }
`;

export const OFL_IMPORT_STATUS_FRAGMENT = gql`
  fragment OFLImportStatusFields on OFLImportStatus {
    isImporting
    phase
    currentManufacturer
    currentFixture
    totalFixtures
    processedFixtures
    successfulImports
    failedImports
    skippedDuplicates
    updatedFixtures
    percentComplete
    startedAt
    estimatedSecondsRemaining
    errorMessage
  }
`;

export const OFL_FIXTURE_UPDATE_FRAGMENT = gql`
  fragment OFLFixtureUpdateFields on OFLFixtureUpdate {
    manufacturer
    model
    changeType
    isInUse
    instanceCount
    currentHash
    newHash
  }
`;

// Queries
export const GET_OFL_IMPORT_STATUS = gql`
  query GetOFLImportStatus {
    oflImportStatus {
      ...OFLImportStatusFields
    }
  }
  ${OFL_IMPORT_STATUS_FRAGMENT}
`;

export const CHECK_OFL_UPDATES = gql`
  query CheckOFLUpdates($manufacturerFilter: [String!]) {
    checkOFLUpdates(manufacturerFilter: $manufacturerFilter) {
      hasUpdates
      totalNew
      totalUpdated
      totalInUse
      oflVersion
      currentVersion
      updates {
        ...OFLFixtureUpdateFields
      }
    }
  }
  ${OFL_FIXTURE_UPDATE_FRAGMENT}
`;

// Mutations
export const TRIGGER_OFL_IMPORT = gql`
  mutation TriggerOFLImport($options: OFLImportOptionsInput) {
    triggerOFLImport(options: $options) {
      success
      stats {
        ...OFLImportStatsFields
      }
      errorMessage
      oflVersion
    }
  }
  ${OFL_IMPORT_STATS_FRAGMENT}
`;

export const CANCEL_OFL_IMPORT = gql`
  mutation CancelOFLImport {
    cancelOFLImport
  }
`;

// Subscription
export const OFL_IMPORT_PROGRESS = gql`
  subscription OFLImportProgress {
    oflImportProgress {
      ...OFLImportStatusFields
    }
  }
  ${OFL_IMPORT_STATUS_FRAGMENT}
`;
