import { gql } from '@apollo/client';

/**
 * GraphQL operations for Open Fixture Library (OFL) management.
 * OFL is a free, open-source database of lighting fixture definitions.
 * These operations allow importing, updating, and monitoring fixture definitions from OFL.
 */

/**
 * Fragment containing statistics about an OFL import operation.
 * Reused across queries, mutations, and subscriptions.
 */
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

/**
 * Fragment containing real-time status of an ongoing OFL import.
 * Includes progress tracking, current fixture being processed, and timing estimates.
 */
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

/**
 * Fragment containing information about a fixture that has updates available.
 * Used to display which fixtures would be affected by an import operation.
 */
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

/**
 * Fetches the current OFL import status.
 * Returns the phase, progress, and any error messages for an ongoing or recent import.
 */
export const GET_OFL_IMPORT_STATUS = gql`
  query GetOFLImportStatus {
    oflImportStatus {
      ...OFLImportStatusFields
    }
  }
  ${OFL_IMPORT_STATUS_FRAGMENT}
`;

/**
 * Checks for available updates from the Open Fixture Library.
 * Compares local fixture definitions against the latest OFL data.
 * @param manufacturerFilter - Optional array of manufacturer names to filter the check
 */
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

/**
 * Triggers an OFL import operation.
 * Downloads fixture definitions from OFL and imports them into the local database.
 * @param options - Import options including forceReimport, updateInUseFixtures, and preferBundled
 */
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

/**
 * Cancels an ongoing OFL import operation.
 * The import will stop at the next safe checkpoint.
 */
export const CANCEL_OFL_IMPORT = gql`
  mutation CancelOFLImport {
    cancelOFLImport
  }
`;

// Subscription

/**
 * Subscribes to real-time OFL import progress updates.
 * Provides live status updates during an import operation via WebSocket.
 */
export const OFL_IMPORT_PROGRESS = gql`
  subscription OFLImportProgress {
    oflImportProgress {
      ...OFLImportStatusFields
    }
  }
  ${OFL_IMPORT_STATUS_FRAGMENT}
`;
