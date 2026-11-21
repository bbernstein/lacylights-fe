/**
 * Project import/export format definitions and detection.
 *
 * Pure logic only (no React, no GraphQL) so it can be shared by the
 * Import / Export page, the Manage Projects window and future callers.
 */

/** A concrete project file format understood by the backend. */
export type ProjectFileFormat = 'lacylights' | 'qlcplus' | 'eos';

/** Import format selection; `auto` detects the format from the file extension. */
export type ImportFormat = 'auto' | ProjectFileFormat;

/** Formats a project can be exported to. */
export type ProjectExportFormat = ProjectFileFormat;

export interface ProjectFormatInfo {
  id: ProjectFileFormat;
  /** Human-readable name, e.g. "QLC+" */
  label: string;
  /** Short name used in compact messages, e.g. "ETC Eos" */
  shortLabel: string;
  /** File extension including the leading dot, e.g. ".qxw" */
  extension: string;
  /** MIME type used for downloads */
  mimeType: string;
  /** Short description shown on the Import / Export page */
  description: string;
  /** Whether the format is offered in the UI (pickers, lists, accept filters) */
  available: boolean;
}

export const PROJECT_FORMATS: Record<ProjectFileFormat, ProjectFormatInfo> = {
  lacylights: {
    id: 'lacylights',
    label: 'LacyLights',
    shortLabel: 'LacyLights',
    extension: '.json',
    mimeType: 'application/json',
    description:
      'Native LacyLights project file. Includes fixtures, looks, cue lists and effects with full fidelity.',
    available: true,
  },
  qlcplus: {
    id: 'qlcplus',
    label: 'QLC+',
    shortLabel: 'QLC+',
    extension: '.qxw',
    mimeType: 'application/xml',
    description:
      'QLC+ workspace file. Fixtures are mapped to QLC+ fixture definitions; some LacyLights features may not carry over.',
    available: false, // QLC+ backend not implemented yet (go#91 import, go#97 export)
  },
  eos: {
    id: 'eos',
    label: 'ETC Eos ASCII',
    shortLabel: 'ETC Eos',
    extension: '.asc',
    mimeType: 'text/plain',
    description:
      'ETC Eos show file in USITT ASCII format. Unsupported items (effects, submasters, etc.) are reported as warnings.',
    available: true,
  },
};

/** Ordered list of available formats, for rendering pickers and cards. */
export const PROJECT_FORMAT_LIST: ProjectFormatInfo[] = [
  PROJECT_FORMATS.lacylights,
  PROJECT_FORMATS.qlcplus,
  PROJECT_FORMATS.eos,
].filter((f) => f.available);

/** Error message shown when a file's format cannot be determined. */
export const UNKNOWN_FORMAT_MESSAGE = `Unable to determine file format. Supported formats: ${[
  ...PROJECT_FORMAT_LIST,
]
  .sort((a, b) => a.extension.localeCompare(b.extension))
  .map((f) => `${f.extension} (${f.shortLabel})`)
  .join(', ')}.`;

/**
 * Format a project format for display, e.g. "QLC+ (.qxw)".
 */
export function formatDisplayName(format: ProjectFileFormat): string {
  const info = PROJECT_FORMATS[format];
  return `${info.label} (${info.extension})`;
}

/**
 * Message shown when a recognised format cannot be used yet, e.g.
 * "QLC+ (.qxw) import isn't available yet."
 */
export function unavailableFormatMessage(format: ProjectFileFormat): string {
  return `${formatDisplayName(format)} import isn't available yet.`;
}

/**
 * Detect a project file format from its filename extension.
 * Returns null when the extension is not recognised.
 */
export function detectFormatFromFilename(filename: string): ProjectFileFormat | null {
  const lower = filename.toLowerCase();
  // Recognise every known format (even unavailable ones) so callers can
  // give a specific message instead of a generic unknown-format error.
  for (const info of Object.values(PROJECT_FORMATS)) {
    if (lower.endsWith(info.extension)) {
      return info.id;
    }
  }
  return null;
}

/**
 * Resolve the format to use for an import. An explicit (non-`auto`)
 * selection always wins; otherwise the format is detected from the
 * filename. Returns null when `auto` is selected and detection fails.
 */
export function resolveImportFormat(
  filename: string,
  selected: ImportFormat = 'auto',
): ProjectFileFormat | null {
  if (selected !== 'auto') {
    return selected;
  }
  return detectFormatFromFilename(filename);
}

/**
 * Value for an `<input type="file" accept>` attribute for an import format.
 * Per-format data is kept even for unavailable formats (e.g. `qlcplus` still returns `.qxw`); it is simply unreachable from the UI.
 */
export function acceptForImportFormat(format: ImportFormat): string {
  if (format === 'auto') {
    return PROJECT_FORMAT_LIST.map((f) => f.extension).join(',');
  }
  return PROJECT_FORMATS[format].extension;
}
