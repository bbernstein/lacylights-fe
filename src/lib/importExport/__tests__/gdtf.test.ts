import { strToU8, zipSync, type Zippable } from 'fflate';
import {
  GDTF_BATCH_SIZE,
  GDTF_ERROR_MESSAGES,
  GDTF_MAX_ARCHIVE_ENTRIES,
  GDTF_MAX_DESCRIPTION_BYTES,
  batches,
  collectGdtfDescriptions,
  filesFromDataTransfer,
  gdtfInputFileName,
  isGdtfCandidateName,
  isMacMetadataPath,
} from '../gdtf';

/** Synthetic description.xml text; not a real GDTF fixture. */
function xml(name: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><GDTF DataVersion="1.2"><FixtureType Name="${name}"/></GDTF>`;
}

/** A synthetic .gdtf: description.xml plus an unused "model" entry. */
function gdtf(name: string, extra: Zippable = {}): Uint8Array {
  return zipSync({
    'description.xml': strToU8(xml(name)),
    'models/3ds/body.3ds': new Uint8Array(64),
    ...extra,
  });
}

function file(bytes: Uint8Array | string, name: string, relativePath?: string): File {
  const f = new File([typeof bytes === 'string' ? bytes : bytes], name);
  if (relativePath) {
    Object.defineProperty(f, 'webkitRelativePath', { value: relativePath });
  }
  return f;
}

describe('batches', () => {
  it('splits a list into chunks of the batch size', () => {
    const list = Array.from({ length: 60 }, (_, i) => i);
    const result = batches(list);
    expect(GDTF_BATCH_SIZE).toBe(25);
    expect(result.map((b) => b.length)).toEqual([25, 25, 10]);
    expect(result.flat()).toEqual(list);
  });

  it('handles empty lists and custom sizes', () => {
    expect(batches([])).toEqual([]);
    expect(batches([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });

  it('rejects invalid sizes', () => {
    expect(() => batches([1], 0)).toThrow(RangeError);
    expect(() => batches([1], 1.5)).toThrow(RangeError);
  });
});

describe('name helpers', () => {
  it('detects macOS metadata', () => {
    expect(isMacMetadataPath('__MACOSX/Foo.gdtf')).toBe(true);
    expect(isMacMetadataPath('dir/__MACOSX/._Foo.gdtf')).toBe(true);
    expect(isMacMetadataPath('dir/._Foo.gdtf')).toBe(true);
    expect(isMacMetadataPath('dir/Foo.gdtf')).toBe(false);
  });

  it('accepts only .gdtf and .zip names', () => {
    expect(isGdtfCandidateName('a/Foo.GDTF')).toBe(true);
    expect(isGdtfCandidateName('Pack.zip')).toBe(true);
    expect(isGdtfCandidateName('README.txt')).toBe(false);
    expect(isGdtfCandidateName('.gdtf')).toBe(false);
  });

  it('names folder files by their relative path', () => {
    expect(gdtfInputFileName(file('', 'Foo.gdtf', 'Fixtures/Foo.gdtf'))).toBe('Fixtures/Foo.gdtf');
    expect(gdtfInputFileName(file('', 'Foo.gdtf'))).toBe('Foo.gdtf');
    expect(gdtfInputFileName({ file: new Blob([]), path: 'Dropped/Foo.gdtf' })).toBe('Dropped/Foo.gdtf');
  });
});

describe('collectGdtfDescriptions', () => {
  it('reads a single .gdtf', async () => {
    const result = await collectGdtfDescriptions([file(gdtf('Spot'), 'Spot.gdtf')]);
    expect(result).toEqual({
      descriptions: [{ fileName: 'Spot.gdtf', descriptionXml: xml('Spot') }],
      errors: [],
      ignored: [],
    });
  });

  it('strips a UTF-8 byte order mark', async () => {
    const bytes = zipSync({ 'description.xml': strToU8(`﻿${xml('Bom')}`) });
    const result = await collectGdtfDescriptions([file(bytes, 'Bom.gdtf')]);
    expect(result.descriptions[0].descriptionXml).toBe(xml('Bom'));
  });

  it('treats an archive with a root description.xml as a .gdtf whatever its extension', async () => {
    const result = await collectGdtfDescriptions([file(gdtf('Renamed'), 'Renamed.zip')]);
    expect(result.descriptions).toEqual([{ fileName: 'Renamed.zip', descriptionXml: xml('Renamed') }]);
  });

  it('reads every .gdtf in a zip at any depth, skipping metadata and other files', async () => {
    const zip = zipSync({
      'A.gdtf': gdtf('A'),
      'vendor/B.gdtf': gdtf('B'),
      'vendor/readme.txt': strToU8('hello'),
      '__MACOSX/vendor/._B.gdtf': strToU8('junk'),
      'vendor/._C.gdtf': strToU8('junk'),
      'empty/': new Uint8Array(0),
    });
    const result = await collectGdtfDescriptions([file(zip, 'pack.zip')]);
    expect(result.errors).toEqual([]);
    expect(result.descriptions).toEqual([
      { fileName: 'pack.zip/A.gdtf', descriptionXml: xml('A') },
      { fileName: 'pack.zip/vendor/B.gdtf', descriptionXml: xml('B') },
    ]);
  });

  it('reads nested zips up to depth 2', async () => {
    const inner = zipSync({ 'Inner.gdtf': gdtf('Inner') });
    const outer = zipSync({ 'sub/inner.zip': inner, 'Top.gdtf': gdtf('Top') });
    const result = await collectGdtfDescriptions([file(outer, 'outer.zip')]);
    expect(result.errors).toEqual([]);
    expect(result.descriptions.map((d) => d.fileName)).toEqual([
      'outer.zip/sub/inner.zip/Inner.gdtf',
      'outer.zip/Top.gdtf',
    ]);
  });

  it('reports archives nested too deeply but keeps the others', async () => {
    const deepest = zipSync({ 'Deep.gdtf': gdtf('Deep') });
    const middle = zipSync({ 'deepest.zip': deepest });
    const outer = zipSync({ 'middle.zip': middle, 'Ok.gdtf': gdtf('Ok') });
    const result = await collectGdtfDescriptions([file(outer, 'outer.zip')]);
    expect(result.descriptions.map((d) => d.fileName)).toEqual(['outer.zip/Ok.gdtf']);
    expect(result.errors).toEqual([
      {
        fileName: 'outer.zip/middle.zip/deepest.zip/Deep.gdtf',
        message: GDTF_ERROR_MESSAGES.nestingTooDeep,
      },
    ]);
  });

  it('reports a .gdtf without description.xml', async () => {
    const bad = zipSync({ 'thumbnail.png': new Uint8Array(8) });
    const zip = zipSync({ 'Bad.gdtf': bad, 'Good.gdtf': gdtf('Good') });
    const result = await collectGdtfDescriptions([file(bad, 'Bad.gdtf'), file(zip, 'mixed.zip')]);
    expect(result.descriptions.map((d) => d.fileName)).toEqual(['mixed.zip/Good.gdtf']);
    expect(result.errors).toEqual([
      { fileName: 'Bad.gdtf', message: GDTF_ERROR_MESSAGES.noDescription },
      { fileName: 'mixed.zip/Bad.gdtf', message: GDTF_ERROR_MESSAGES.noDescription },
    ]);
  });

  it('reports a zip without .gdtf files', async () => {
    const zip = zipSync({ 'notes.txt': strToU8('nothing here') });
    const result = await collectGdtfDescriptions([file(zip, 'empty.zip')]);
    expect(result.errors).toEqual([{ fileName: 'empty.zip', message: GDTF_ERROR_MESSAGES.noGdtfInArchive }]);
  });

  it('reports files that are not zip archives', async () => {
    const result = await collectGdtfDescriptions([
      file('<GDTF/>', 'plain.gdtf'),
      file('x'.repeat(100), 'garbage.zip'),
    ]);
    expect(result.descriptions).toEqual([]);
    expect(result.errors).toEqual([
      { fileName: 'plain.gdtf', message: GDTF_ERROR_MESSAGES.notArchive },
      { fileName: 'garbage.zip', message: GDTF_ERROR_MESSAGES.notArchive },
    ]);
  });

  it('rejects an oversize description.xml (stored and deflated)', async () => {
    const big = new Uint8Array(GDTF_MAX_DESCRIPTION_BYTES + 1).fill(0x20);
    const stored = zipSync({ 'description.xml': [big, { level: 0 }] });
    const deflated = zipSync({ 'description.xml': [big, { level: 1 }] });
    const result = await collectGdtfDescriptions([file(stored, 'Stored.gdtf'), file(deflated, 'Deflated.gdtf')]);
    expect(result.descriptions).toEqual([]);
    expect(result.errors).toEqual([
      { fileName: 'Stored.gdtf', message: GDTF_ERROR_MESSAGES.descriptionTooLarge },
      { fileName: 'Deflated.gdtf', message: GDTF_ERROR_MESSAGES.descriptionTooLarge },
    ]);
  });

  it('rejects archives with too many entries', async () => {
    const entries: Zippable = {};
    for (let i = 0; i <= GDTF_MAX_ARCHIVE_ENTRIES; i++) entries[`f${i}.txt`] = new Uint8Array(0);
    const result = await collectGdtfDescriptions([file(zipSync(entries), 'huge.zip')]);
    expect(result.errors).toEqual([{ fileName: 'huge.zip', message: GDTF_ERROR_MESSAGES.tooManyEntries }]);
  });

  it('reports entries that cannot be decompressed', async () => {
    const bytes = zipSync({ 'description.xml': strToU8(xml('X')) });
    // Change the compression method in the central directory to an unknown one.
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < bytes.length - 4; i++) {
      if (view.getUint32(i, true) === 0x02014b50) view.setUint16(i + 10, 99, true);
    }
    const result = await collectGdtfDescriptions([file(bytes, 'Odd.gdtf')]);
    expect(result.errors).toEqual([{ fileName: 'Odd.gdtf', message: GDTF_ERROR_MESSAGES.corrupt }]);
  });

  it('reports read failures', async () => {
    const blob = new Blob([]);
    blob.arrayBuffer = jest.fn().mockRejectedValue(new Error('permission denied'));
    const result = await collectGdtfDescriptions([{ file: blob, path: 'Locked.gdtf' }]);
    expect(result.errors).toEqual([
      { fileName: 'Locked.gdtf', message: `${GDTF_ERROR_MESSAGES.readFailed} permission denied` },
    ]);
  });

  it('handles a folder file list: names by relative path, ignores other files', async () => {
    const onProgress = jest.fn();
    const result = await collectGdtfDescriptions(
      [
        file(gdtf('One'), 'One.gdtf', 'Fixtures/One.gdtf'),
        file(zipSync({ 'Two.gdtf': gdtf('Two') }), 'more.zip', 'Fixtures/sub/more.zip'),
        file('notes', 'README.md', 'Fixtures/README.md'),
        file('junk', '.DS_Store', 'Fixtures/.DS_Store'),
        file('junk', '._One.gdtf', 'Fixtures/._One.gdtf'),
      ],
      { onProgress },
    );
    expect(result.descriptions.map((d) => d.fileName)).toEqual([
      'Fixtures/One.gdtf',
      'Fixtures/sub/more.zip/Two.gdtf',
    ]);
    expect(result.ignored).toEqual(['Fixtures/README.md', 'Fixtures/.DS_Store']);
    expect(result.errors).toEqual([]);
    expect(onProgress).toHaveBeenCalledTimes(5);
    expect(onProgress).toHaveBeenLastCalledWith(5, 5);
  });

  it('falls back to FileReader when Blob.arrayBuffer is missing', async () => {
    const f = file(gdtf('Legacy'), 'Legacy.gdtf');
    Object.defineProperty(f, 'arrayBuffer', { value: undefined });
    const result = await collectGdtfDescriptions([f]);
    expect(result.descriptions).toEqual([{ fileName: 'Legacy.gdtf', descriptionXml: xml('Legacy') }]);
  });
});

describe('filesFromDataTransfer', () => {
  function fileEntry(path: string, f: File) {
    return {
      isFile: true,
      isDirectory: false,
      name: path.split('/').pop(),
      fullPath: path,
      file: (resolve: (f: File) => void) => resolve(f),
    };
  }

  function dirEntry(path: string, children: unknown[]) {
    return {
      isFile: false,
      isDirectory: true,
      name: path.split('/').pop(),
      fullPath: path,
      createReader: () => {
        // Return the children in two chunks, then none.
        const chunks = [children.slice(0, 1), children.slice(1), []];
        return { readEntries: (resolve: (e: unknown[]) => void) => resolve(chunks.shift() ?? []) };
      },
    };
  }

  it('expands dropped folders with relative paths', async () => {
    const a = new File(['a'], 'A.gdtf');
    const b = new File(['b'], 'B.zip');
    const loose = new File(['c'], 'C.gdtf');
    const folder = dirEntry('/Fixtures', [
      fileEntry('/Fixtures/A.gdtf', a),
      dirEntry('/Fixtures/sub', [fileEntry('/Fixtures/sub/B.zip', b)]),
      dirEntry('/Fixtures/__MACOSX', [fileEntry('/Fixtures/__MACOSX/._A.gdtf', a)]),
    ]);
    const items = [folder, fileEntry('/C.gdtf', loose)].map((entry) => ({
      kind: 'file',
      webkitGetAsEntry: () => entry,
    }));
    const result = await filesFromDataTransfer({ items, files: [] } as unknown as DataTransfer);
    expect(result).toEqual([
      { file: a, path: 'Fixtures/A.gdtf' },
      { file: b, path: 'Fixtures/sub/B.zip' },
      { file: loose, path: 'C.gdtf' },
    ]);
  });

  it('falls back to the plain file list', async () => {
    const f = new File(['a'], 'A.gdtf');
    expect(await filesFromDataTransfer({ files: [f] } as unknown as DataTransfer)).toEqual([f]);
    expect(
      await filesFromDataTransfer({
        items: [{ kind: 'file', webkitGetAsEntry: () => null }],
        files: [f],
      } as unknown as DataTransfer),
    ).toEqual([f]);
    expect(await filesFromDataTransfer(null)).toEqual([]);
  });
});
