/**
 * GDTF (General Device Type Format) files in the browser.
 *
 * A `.gdtf` file is a zip archive with `description.xml` at its root, plus
 * thumbnails and 3D models that LacyLights does not use. The import screen
 * unzips files here and sends only the `description.xml` text to the
 * `importGdtfFixtures` mutation, so a folder of fixtures is a few MB on the
 * wire instead of a few GB.
 *
 * Accepted inputs: `.gdtf` files, `.zip` archives holding `.gdtf` files at
 * any depth (nested `.zip` files up to {@link GDTF_MAX_NESTING_DEPTH}), and
 * folders (their `.gdtf` / `.zip` files). The behaviour and limits mirror the
 * backend's reference extractor (lacylights-go
 * `internal/services/gdtf/archive.go`, `ExtractDescriptions`):
 * - at most {@link GDTF_MAX_ARCHIVE_ENTRIES} entries per archive;
 * - `description.xml` at most {@link GDTF_MAX_DESCRIPTION_BYTES} after
 *   decompression;
 * - a nested archive at most {@link GDTF_MAX_NESTED_ARCHIVE_BYTES} after
 *   decompression (it has to be held in memory to be opened);
 * - an archive with `description.xml` at its root is a `.gdtf`, whatever its
 *   extension; otherwise it is searched for `.gdtf` and `.zip` entries;
 * - macOS `__MACOSX/` and `._*` metadata entries are skipped;
 * - a `.gdtf` found inside a `.zip` is named `outer.zip/dir/Foo.gdtf`;
 * - a problem with one file or entry does not stop the others.
 *
 * Only the entries that are needed are inflated: the central directory is
 * read first (no decompression), then each wanted entry is inflated on its
 * own, so one archive's nested files are not all held in memory at once.
 */
import { strFromU8, unzipSync, type UnzipFileInfo } from 'fflate';

/** Most entries one archive (outer or nested) may contain. */
export const GDTF_MAX_ARCHIVE_ENTRIES = 2000;
/** Largest description.xml accepted, measured after decompression. */
export const GDTF_MAX_DESCRIPTION_BYTES = 32 * 1024 * 1024;
/**
 * How deep archives may nest: a `.gdtf` inside a `.zip` inside the chosen
 * `.zip` is depth 2, the deepest allowed.
 */
export const GDTF_MAX_NESTING_DEPTH = 2;
/** Largest nested archive (`.gdtf` or `.zip` inside a `.zip`), decompressed. */
export const GDTF_MAX_NESTED_ARCHIVE_BYTES = 512 * 1024 * 1024;
/** Files sent per `importGdtfFixtures` request. */
export const GDTF_BATCH_SIZE = 25;

/**
 * Upper bound on the description.xml bytes (UTF-8) sent in one request
 * (64 MB, the same cap the MCP tool uses). A single larger file is sent on
 * its own.
 */
export const GDTF_BATCH_MAX_BYTES = 64 * 1024 * 1024;
/** `accept` attribute for GDTF file pickers. */
export const GDTF_ACCEPT = '.gdtf,.zip';

const DESCRIPTION_FILE_NAME = 'description.xml';
const MB = 1024 * 1024;

/** Messages for files that cannot be read. Shown to the user per file. */
export const GDTF_ERROR_MESSAGES = {
  notArchive: 'Not a zip archive (a .gdtf file is a zip archive).',
  noDescription: 'No description.xml found; this is not a GDTF file.',
  noGdtfInArchive: 'No .gdtf files found in this archive.',
  tooManyEntries: `The archive has more than ${GDTF_MAX_ARCHIVE_ENTRIES} entries.`,
  descriptionTooLarge: `description.xml is larger than ${GDTF_MAX_DESCRIPTION_BYTES / MB} MB.`,
  nestingTooDeep: `Archives are nested more than ${GDTF_MAX_NESTING_DEPTH} levels deep.`,
  nestedTooLarge: `The nested archive is larger than ${GDTF_MAX_NESTED_ARCHIVE_BYTES / MB} MB.`,
  corrupt: 'The archive entry could not be decompressed (unsupported compression or a damaged file).',
  readFailed: 'The file could not be read.',
} as const;

/** One GDTF fixture type to import (matches `GdtfFileInput`). */
export interface GdtfDescription {
  /** Source name: "Foo.gdtf", "folder/Foo.gdtf" or "outer.zip/dir/Foo.gdtf". */
  fileName: string;
  /** Text of the .gdtf's description.xml. */
  descriptionXml: string;
}

/** A file or archive entry that could not be read. */
export interface GdtfCollectError {
  fileName: string;
  message: string;
}

export interface GdtfCollectResult {
  descriptions: GdtfDescription[];
  errors: GdtfCollectError[];
  /** Chosen files that are neither .gdtf nor .zip (e.g. a folder's README). */
  ignored: string[];
}

/** A file with an explicit path, e.g. from a folder dropped on the page. */
export interface GdtfPathFile {
  file: Blob;
  path: string;
}

/** A chosen file: a `File` (folder picks carry `webkitRelativePath`) or a path + Blob. */
export type GdtfInputFile = File | GdtfPathFile;

export interface CollectGdtfOptions {
  /** Called after each chosen file has been read. */
  onProgress?: (processed: number, total: number) => void;
}

/** An error whose message is meant for the user. */
class GdtfArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GdtfArchiveError';
  }
}

function isPathFile(f: GdtfInputFile): f is GdtfPathFile {
  return typeof (f as GdtfPathFile).path === 'string' && (f as GdtfPathFile).file instanceof Blob;
}

/** Display name of a chosen file: its path in a folder, or its name. */
export function gdtfInputFileName(f: GdtfInputFile): string {
  if (isPathFile(f)) return f.path;
  return f.webkitRelativePath || f.name;
}

function baseName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

function extensionOf(path: string): string {
  const base = baseName(path);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot).toLowerCase() : '';
}

/** True for macOS metadata: anything under `__MACOSX/` and `._*` files. */
export function isMacMetadataPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  if (normalized.split('/').includes('__MACOSX')) return true;
  return baseName(normalized).startsWith('._');
}

/** True when the name has a `.gdtf` or `.zip` extension. */
export function isGdtfCandidateName(path: string): boolean {
  const ext = extensionOf(path);
  return ext === '.gdtf' || ext === '.zip';
}

/** Split `list` into consecutive chunks of at most `size` items. */
export function batches<T>(list: ReadonlyArray<T>, size: number = GDTF_BATCH_SIZE): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`Batch size must be a positive integer, got ${size}`);
  }
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

/**
 * The UTF-8 encoded length of `s` in bytes, without allocating. Lone
 * surrogates count as 3 bytes (U+FFFD), as TextEncoder encodes them.
 */
export function utf8ByteLength(s: string): number {
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) {
      bytes += 1;
    } else if (c < 0x800) {
      bytes += 2;
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const next = s.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Group descriptions into import requests of at most `maxFiles` files and
 * `maxBytes` bytes of UTF-8 encoded XML. A description larger than
 * `maxBytes` gets a batch of its own. Order is preserved.
 */
export function gdtfBatches<T extends { descriptionXml: string }>(
  list: ReadonlyArray<T>,
  maxFiles: number = GDTF_BATCH_SIZE,
  maxBytes: number = GDTF_BATCH_MAX_BYTES,
): T[][] {
  if (!Number.isInteger(maxFiles) || maxFiles < 1) {
    throw new RangeError(`Batch size must be a positive integer, got ${maxFiles}`);
  }
  const out: T[][] = [];
  let current: T[] = [];
  let bytes = 0;
  for (const item of list) {
    const size = utf8ByteLength(item.descriptionXml);
    if (current.length > 0 && (current.length >= maxFiles || bytes + size > maxBytes)) {
      out.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length > 0) out.push(current);
  return out;
}

async function readBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsArrayBuffer(blob);
  });
}

class TooManyEntries extends Error {}

/** Read an archive's central directory without inflating anything. */
function listEntries(data: Uint8Array): UnzipFileInfo[] {
  // Shorter than an end-of-central-directory record: not a zip.
  if (data.length < 22) throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.notArchive);
  const entries: UnzipFileInfo[] = [];
  try {
    unzipSync(data, {
      filter: (info) => {
        entries.push(info);
        if (entries.length > GDTF_MAX_ARCHIVE_ENTRIES) throw new TooManyEntries();
        return false;
      },
    });
  } catch (error) {
    if (error instanceof TooManyEntries) {
      throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.tooManyEntries);
    }
    throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.notArchive);
  }
  return entries;
}

/**
 * Size an entry can inflate to. Deflated output is bounded by the declared
 * original size (fflate allocates exactly that much); a stored entry is
 * copied as-is, so its compressed size counts too.
 */
function entryOutputSize(info: UnzipFileInfo): number {
  return info.compression === 0 ? Math.max(info.size, info.originalSize) : info.originalSize;
}

/**
 * Inflate the entry at `index` only. The header's size is checked first and
 * the actual output length again afterwards, so a lying header cannot
 * exceed `limit`.
 */
function inflateEntry(data: Uint8Array, info: UnzipFileInfo, index: number, limit: number, tooLarge: string): Uint8Array {
  if (entryOutputSize(info) > limit) throw new GdtfArchiveError(tooLarge);
  let position = -1;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data, {
      filter: () => {
        position += 1;
        return position === index;
      },
    });
  } catch {
    throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.corrupt);
  }
  const bytes = files[info.name];
  if (!bytes) throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.corrupt);
  if (bytes.length > limit) throw new GdtfArchiveError(tooLarge);
  return bytes;
}

function readDescription(data: Uint8Array, info: UnzipFileInfo, index: number): string {
  const bytes = inflateEntry(
    data,
    info,
    index,
    GDTF_MAX_DESCRIPTION_BYTES,
    GDTF_ERROR_MESSAGES.descriptionTooLarge,
  );
  // GDTF descriptions are UTF-8. Drop a byte order mark so the server's XML
  // parser sees the declaration first.
  return strFromU8(bytes).replace(/^﻿/, '');
}

/** Directories and macOS metadata inside an archive. */
function skipEntry(name: string): boolean {
  return name.endsWith('/') || isMacMetadataPath(name);
}

// Yield to the browser now and then so progress can render while large
// archives are read (but not per entry: nested timers are clamped to 4 ms).
const YIELD_INTERVAL_MS = 50;
let lastYield = 0;
async function maybeYield(): Promise<void> {
  const now = Date.now();
  if (now - lastYield < YIELD_INTERVAL_MS) return;
  lastYield = now;
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/**
 * Extract the description(s) from one archive into `out`. Throws a
 * GdtfArchiveError when the archive as a whole is unusable; problems with
 * single entries of a container are added to `out.errors` instead.
 */
async function extract(data: Uint8Array, name: string, depth: number, out: GdtfCollectResult): Promise<void> {
  if (depth > GDTF_MAX_NESTING_DEPTH) throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.nestingTooDeep);
  const entries = listEntries(data);

  const rootIndex = entries.findIndex((e) => e.name.toLowerCase() === DESCRIPTION_FILE_NAME);
  if (rootIndex >= 0) {
    out.descriptions.push({ fileName: name, descriptionXml: readDescription(data, entries[rootIndex], rootIndex) });
    return;
  }
  if (extensionOf(name) === '.gdtf') throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.noDescription);

  const before = out.descriptions.length + out.errors.length;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (skipEntry(entry.name) || !isGdtfCandidateName(entry.name)) continue;
    const entryName = `${name}/${entry.name}`;
    try {
      if (depth + 1 > GDTF_MAX_NESTING_DEPTH) {
        throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.nestingTooDeep);
      }
      const inner = inflateEntry(data, entry, i, GDTF_MAX_NESTED_ARCHIVE_BYTES, GDTF_ERROR_MESSAGES.nestedTooLarge);
      await extract(inner, entryName, depth + 1, out);
    } catch (error) {
      out.errors.push({ fileName: entryName, message: errorMessage(error) });
    }
    await maybeYield();
  }
  if (out.descriptions.length + out.errors.length === before) {
    throw new GdtfArchiveError(GDTF_ERROR_MESSAGES.noGdtfInArchive);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof GdtfArchiveError) return error.message;
  const detail = error instanceof Error ? error.message : String(error);
  return detail ? `${GDTF_ERROR_MESSAGES.readFailed} ${detail}` : GDTF_ERROR_MESSAGES.readFailed;
}

/**
 * Read the GDTF descriptions from chosen files: `.gdtf` files, `.zip`
 * archives of them and folder contents. Other files are listed in
 * `ignored`; macOS metadata files are skipped silently. Files are read one
 * at a time, in order.
 */
export async function collectGdtfDescriptions(
  files: ReadonlyArray<GdtfInputFile>,
  options: CollectGdtfOptions = {},
): Promise<GdtfCollectResult> {
  const out: GdtfCollectResult = { descriptions: [], errors: [], ignored: [] };
  const total = files.length;
  let processed = 0;
  for (const f of files) {
    const name = gdtfInputFileName(f);
    if (isMacMetadataPath(name)) {
      // Skipped silently.
    } else if (!isGdtfCandidateName(name)) {
      out.ignored.push(name);
    } else {
      try {
        const data = await readBytes(isPathFile(f) ? f.file : f);
        await extract(data, name, 0, out);
      } catch (error) {
        out.errors.push({ fileName: name, message: errorMessage(error) });
      }
    }
    processed += 1;
    options.onProgress?.(processed, total);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Drag and drop
// ---------------------------------------------------------------------------

function readEntryFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readDirectoryBatch(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

/** Files found in a drop, and the entries that could not be read. */
export interface GdtfDroppedFiles {
  files: GdtfInputFile[];
  errors: GdtfCollectError[];
}

function entryPath(entry: FileSystemEntry): string {
  return entry.fullPath.replace(/^\/+/, '') || entry.name;
}

// An unreadable entry (deleted, no permission) is recorded in out.errors and
// its siblings are still visited.
async function walkEntry(entry: FileSystemEntry, out: GdtfDroppedFiles): Promise<void> {
  if (entry.isFile) {
    try {
      const file = await readEntryFile(entry as FileSystemFileEntry);
      out.files.push({ file, path: entryPath(entry) || file.name });
    } catch (error) {
      out.errors.push({ fileName: entryPath(entry), message: errorMessage(error) });
    }
    return;
  }
  if (entry.isDirectory) {
    if (entry.name === '__MACOSX') return;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries returns results in chunks; call until it returns none.
    for (;;) {
      let chunk: FileSystemEntry[];
      try {
        chunk = await readDirectoryBatch(reader);
      } catch (error) {
        out.errors.push({ fileName: entryPath(entry), message: errorMessage(error) });
        return;
      }
      if (chunk.length === 0) break;
      for (const child of chunk) {
        await walkEntry(child, out);
      }
    }
  }
}

/**
 * The files dropped on the page, with dropped folders expanded (paths like
 * "Fixtures/Foo.gdtf", as for a folder pick). Must be called from the drop
 * event handler: the entries are taken synchronously before the first await,
 * as browsers clear the DataTransfer once the event returns. Browsers
 * without `webkitGetAsEntry` get the plain file list. Entries that cannot be
 * read are returned in `errors`; the rest of the drop is still collected.
 */
export async function filesFromDataTransfer(dataTransfer: DataTransfer | null): Promise<GdtfDroppedFiles> {
  if (!dataTransfer) return { files: [], errors: [] };
  const items = dataTransfer.items ? Array.from(dataTransfer.items).filter((i) => i.kind === 'file') : [];
  const entries = items.map((item) =>
    typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null,
  );
  const plainFiles = Array.from(dataTransfer.files ?? []);
  if (entries.length === 0 || entries.some((e) => !e)) {
    return { files: plainFiles, errors: [] };
  }
  const out: GdtfDroppedFiles = { files: [], errors: [] };
  for (const entry of entries as FileSystemEntry[]) {
    await walkEntry(entry, out);
  }
  return out;
}
