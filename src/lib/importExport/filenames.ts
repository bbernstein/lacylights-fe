import { PROJECT_FORMATS, type ProjectFileFormat } from './formats';

/** Maximum filename length accepted by common filesystems. */
export const MAX_FILENAME_LENGTH = 255;

/**
 * Sanitize a filename to prevent directory traversal and remove characters
 * that are invalid on common filesystems.
 */
export function sanitizeFilename(filename: string): string {
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid characters with dash
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
  // If the filename is empty after sanitization, use a default name
  if (!sanitized) {
    sanitized = 'untitled';
  }
  // Truncate to maximum allowed length
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
  }
  return sanitized;
}

/**
 * Build the download filename for a project export.
 *
 * The extension is always taken from the frontend format table (rather than
 * any backend-provided suffix) so the filename and the download MIME type
 * stay aligned even if the backend returns something unexpected.
 */
export function buildProjectExportFilename(
  projectName: string,
  format: ProjectFileFormat,
): string {
  return `${sanitizeFilename(projectName)}${PROJECT_FORMATS[format].extension}`;
}

/**
 * Derive a project name from an imported filename by stripping the
 * format's extension (case-insensitive), e.g. "My Show.asc" -> "My Show".
 */
export function projectNameFromFilename(filename: string, format?: ProjectFileFormat): string {
  if (format) {
    const ext = PROJECT_FORMATS[format].extension.replace('.', '\\.');
    return filename.replace(new RegExp(`${ext}$`, 'i'), '');
  }
  return filename.replace(/\.[^./\\]+$/, '');
}
