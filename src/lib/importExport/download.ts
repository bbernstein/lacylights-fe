import { getNativeBridge } from './bridge';

const EXTENSION_MIME_TYPES: Record<string, string> = {
  json: 'application/json',
  asc: 'text/plain',
  txt: 'text/plain',
  qxw: 'application/xml',
  xml: 'application/xml',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Guess a MIME type from a filename's extension. Unknown extensions fall
 * back to `application/octet-stream`.
 */
export function mimeTypeForFilename(filename: string): string {
  const match = /\.([^.]+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : '';
  return EXTENSION_MIME_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Decode a base64 string into raw bytes. Whitespace (e.g. line breaks
 * from MIME-style wrapping) is ignored.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Decode a base64 string into a Blob of the given MIME type. */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  return new Blob([base64ToBytes(base64)], { type: mimeType });
}

/**
 * How long to keep a download's object URL alive after clicking the link.
 * Revoking it immediately can cancel the download in Safari and for large
 * files (e.g. big XLSX workbooks) that the browser has not started reading.
 */
export const REVOKE_OBJECT_URL_DELAY_MS = 1000;

/** Trigger a browser download for a Blob via a temporary anchor element. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Look up revokeObjectURL now so the deferred call uses the same API that
  // created the URL, then release the Blob once the download has started.
  const revoke = URL.revokeObjectURL.bind(URL);
  setTimeout(() => revoke(url), REVOKE_OBJECT_URL_DELAY_MS);
}

/**
 * Download text content. Uses the Mac app's native bridge when available,
 * otherwise falls back to a browser Blob download.
 */
export function downloadFile(content: string, filename: string, mimeType?: string): void {
  const bridge = getNativeBridge();
  if (typeof bridge?.download === 'function') {
    bridge.download(content, filename);
    return;
  }
  downloadBlob(new Blob([content], { type: mimeType ?? mimeTypeForFilename(filename) }), filename);
}

/**
 * Download binary content delivered as base64 (e.g. XLSX). Uses the Mac
 * app's `downloadBinary` bridge method when available; older Mac builds
 * and regular browsers fall back to decoding into a Blob.
 */
export function downloadBase64(base64: string, filename: string, mimeType: string): void {
  const bridge = getNativeBridge();
  if (typeof bridge?.downloadBinary === 'function') {
    bridge.downloadBinary(base64, filename, mimeType);
    return;
  }
  downloadBlob(base64ToBlob(base64, mimeType), filename);
}
