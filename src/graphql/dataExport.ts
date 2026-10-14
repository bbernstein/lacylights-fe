import { gql } from '@apollo/client';

/**
 * CSV / Excel (XLSX) data-list exports. These are read-only Queries whose
 * results carry the whole file as base64, so always run them through the
 * helpers in `src/lib/importExport/dataExport.ts`, which force
 * `fetchPolicy: 'no-cache'` to keep large payloads out of the Apollo cache.
 */

/**
 * Exportable tables. `scopeRequired` says whether `exportDataTable` needs a
 * `scopeId` for the table. Backends up to lacylights-go v0.4.1 lack that
 * field and reject this query; `fetchDataExportTables`
 * (`src/lib/importExport/dataExport.ts`) then retries with
 * {@link GET_DATA_EXPORT_TABLES_LEGACY}.
 */
export const GET_DATA_EXPORT_TABLES = gql`
  query GetDataExportTables {
    dataExportTables {
      table
      label
      scope
      scopeRequired
      columns
    }
  }
`;

/** {@link GET_DATA_EXPORT_TABLES} without `scopeRequired`, for older backends. */
export const GET_DATA_EXPORT_TABLES_LEGACY = gql`
  query GetDataExportTablesLegacy {
    dataExportTables {
      table
      label
      scope
      columns
    }
  }
`;

/*
 * Names-only lists for the Export data panel's look / cue list / look board
 * pickers. They ask for nothing but `id` and `name`, so they stay cheap on
 * large projects (the full list queries load fixture values, cues or
 * buttons). `Project.looks` / `Project.cueLists` cost one SELECT each; the
 * top-level `looks` / `cueLists` queries would count fixtures / cues per
 * row. Look boards use the top-level `lookBoards(projectId)` because
 * `Project.lookBoards` is not resolved by the backend.
 */

export const GET_DATA_EXPORT_LOOK_NAMES = gql`
  query GetDataExportLookNames($projectId: ID!) {
    project(id: $projectId) {
      id
      looks {
        id
        name
      }
    }
  }
`;

export const GET_DATA_EXPORT_CUE_LIST_NAMES = gql`
  query GetDataExportCueListNames($projectId: ID!) {
    project(id: $projectId) {
      id
      cueLists {
        id
        name
      }
    }
  }
`;

export const GET_DATA_EXPORT_LOOK_BOARD_NAMES = gql`
  query GetDataExportLookBoardNames($projectId: ID!) {
    lookBoards(projectId: $projectId) {
      id
      name
    }
  }
`;

export const EXPORT_DATA_TABLE = gql`
  query ExportDataTable(
    $projectId: ID
    $table: DataExportTable!
    $format: DataExportFormat!
    $scopeId: ID
  ) {
    exportDataTable(projectId: $projectId, table: $table, format: $format, scopeId: $scopeId) {
      filename
      mimeType
      contentBase64
      rowCount
    }
  }
`;

export const EXPORT_DATA_WORKBOOK = gql`
  query ExportDataWorkbook($projectId: ID!, $tables: [DataExportTable!]) {
    exportDataWorkbook(projectId: $projectId, tables: $tables) {
      filename
      mimeType
      contentBase64
      rowCount
    }
  }
`;
