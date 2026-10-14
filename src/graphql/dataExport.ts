import { gql } from '@apollo/client';

/**
 * CSV / Excel (XLSX) data-list exports. These are read-only Queries whose
 * results carry the whole file as base64, so always run them through the
 * helpers in `src/lib/importExport/dataExport.ts`, which force
 * `fetchPolicy: 'no-cache'` to keep large payloads out of the Apollo cache.
 */

export const GET_DATA_EXPORT_TABLES = gql`
  query GetDataExportTables {
    dataExportTables {
      table
      label
      scope
      columns
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
