/**
 * Type definitions and helpers for the native Mac app bridge
 * (`window.lacylights`), injected by the lacylights-mac WebView.
 */

export interface LacyLightsBridge {
  /** Save a text file via the native save panel. */
  download: (content: string, filename: string) => void;
  /**
   * Save a binary file via the native save panel. Added for spreadsheet
   * (XLSX) exports; older Mac builds do not provide it, so callers must
   * check for it and fall back to a browser Blob download.
   */
  downloadBinary?: (base64: string, filename: string, mimeType: string) => void;
  send: (message: Record<string, unknown>) => void;
  log: (message: string) => void;
  error: (message: string) => void;
  getAppVersion: () => void;
}

declare global {
  interface Window {
    lacylights?: LacyLightsBridge;
  }
}

/** Returns the native bridge when running inside the Mac app, else undefined. */
export function getNativeBridge(): LacyLightsBridge | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.lacylights;
}

/** True when the Mac app bridge can save text files. */
export function hasNativeTextDownload(): boolean {
  return typeof getNativeBridge()?.download === 'function';
}

/** True when the Mac app bridge can save binary files. */
export function hasNativeBinaryDownload(): boolean {
  return typeof getNativeBridge()?.downloadBinary === 'function';
}
