/**
 * Constants for import/export operations
 */

/**
 * Import modes
 * Matches the GraphQL ImportMode enum
 */
export enum ImportMode {
  CREATE = 'CREATE',
  MERGE = 'MERGE',
}

/**
 * Fixture conflict strategies
 * Matches the GraphQL FixtureConflictStrategy enum
 */
export enum FixtureConflictStrategy {
  SKIP = 'SKIP',
  REPLACE = 'REPLACE',
  ERROR = 'ERROR',
}