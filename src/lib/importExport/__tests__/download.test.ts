import {
  base64ToBlob,
  base64ToBytes,
  downloadBase64,
  downloadBlob,
  downloadFile,
  mimeTypeForFilename,
} from '../download';
import { getNativeBridge, hasNativeBinaryDownload, hasNativeTextDownload } from '../bridge';
import { readFileAsText } from '../files';

/** Capture anchors created for downloads and stub URL object APIs. */
function setupBrowserDownload() {
  const anchors: HTMLAnchorElement[] = [];
  const realCreate = document.createElement.bind(document);
  const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreate(tag);
    if (tag === 'a') {
      (el as HTMLAnchorElement).click = jest.fn();
      anchors.push(el as HTMLAnchorElement);
    }
    return el;
  });
  const originalCreateURL = URL.createObjectURL;
  const originalRevokeURL = URL.revokeObjectURL;
  const blobs: Blob[] = [];
  URL.createObjectURL = jest.fn((b: Blob) => {
    blobs.push(b);
    return 'blob:mock';
  }) as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = jest.fn();
  return {
    anchors,
    blobs,
    restore: () => {
      createSpy.mockRestore();
      URL.createObjectURL = originalCreateURL;
      URL.revokeObjectURL = originalRevokeURL;
    },
  };
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

afterEach(() => {
  delete window.lacylights;
});

describe('importExport/download', () => {
  describe('mimeTypeForFilename', () => {
    it.each([
      ['a.json', 'application/json'],
      ['a.asc', 'text/plain'],
      ['a.qxw', 'application/xml'],
      ['a.CSV', 'text/csv'],
      ['a.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      ['a.bin', 'application/octet-stream'],
      ['noext', 'application/octet-stream'],
    ])('%s -> %s', (filename, mime) => {
      expect(mimeTypeForFilename(filename)).toBe(mime);
    });
  });

  describe('base64 decoding', () => {
    it('decodes base64 into bytes, including non-ASCII bytes', () => {
      // 0x00 0xFF 0x10 0x80 0x50 0x4B
      const bytes = base64ToBytes('AP8QgFBL');
      expect(Array.from(bytes)).toEqual([0x00, 0xff, 0x10, 0x80, 0x50, 0x4b]);
    });

    it('ignores whitespace and line breaks', () => {
      expect(Array.from(base64ToBytes('SGVs\nbG8=\r\n'))).toEqual(
        [0x48, 0x65, 0x6c, 0x6c, 0x6f], // "Hello"
      );
    });

    it('produces a Blob with the given type and decoded content', async () => {
      const blob = base64ToBlob('SGVsbG8=', 'text/csv');
      expect(blob.type).toBe('text/csv');
      expect(blob.size).toBe(5);
      expect(await readBlobText(blob)).toBe('Hello');
    });

    it('throws on invalid base64', () => {
      expect(() => base64ToBytes('***')).toThrow();
    });
  });

  describe('downloadBlob', () => {
    it('clicks a temporary anchor and revokes the URL', () => {
      const env = setupBrowserDownload();
      try {
        downloadBlob(new Blob(['x']), 'x.txt');
        expect(env.anchors).toHaveLength(1);
        expect(env.anchors[0].download).toBe('x.txt');
        expect(env.anchors[0].click).toHaveBeenCalled();
        expect(document.body.contains(env.anchors[0])).toBe(false);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
      } finally {
        env.restore();
      }
    });
  });

  describe('downloadFile (text)', () => {
    it('uses the browser download with a MIME type inferred from the filename', async () => {
      const env = setupBrowserDownload();
      try {
        downloadFile('{"a":1}', 'show.json');
        expect(env.blobs[0].type).toBe('application/json');
        expect(await readBlobText(env.blobs[0])).toBe('{"a":1}');
        expect(env.anchors[0].download).toBe('show.json');
      } finally {
        env.restore();
      }
    });

    it('honours an explicit MIME type', () => {
      const env = setupBrowserDownload();
      try {
        downloadFile('a,b', 'data.txt', 'text/csv');
        expect(env.blobs[0].type).toBe('text/csv');
      } finally {
        env.restore();
      }
    });

    it('uses the Mac bridge download when available', () => {
      const download = jest.fn();
      window.lacylights = {
        download,
        send: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
        getAppVersion: jest.fn(),
      };
      const env = setupBrowserDownload();
      try {
        downloadFile('Ident 3:0', 'show.asc');
        expect(download).toHaveBeenCalledWith('Ident 3:0', 'show.asc');
        expect(env.anchors).toHaveLength(0);
      } finally {
        env.restore();
      }
    });
  });

  describe('downloadBase64 (binary)', () => {
    const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    it('decodes to a Blob in the browser', async () => {
      const env = setupBrowserDownload();
      try {
        downloadBase64('UEsDBA==', 'data.xlsx', XLSX);
        expect(env.blobs[0].type).toBe(XLSX);
        expect(Array.from(await readBlobBytes(env.blobs[0]))).toEqual([0x50, 0x4b, 0x03, 0x04]);
        expect(env.anchors[0].download).toBe('data.xlsx');
      } finally {
        env.restore();
      }
    });

    it('uses the Mac bridge downloadBinary when available', () => {
      const download = jest.fn();
      const downloadBinary = jest.fn();
      window.lacylights = {
        download,
        downloadBinary,
        send: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
        getAppVersion: jest.fn(),
      };
      const env = setupBrowserDownload();
      try {
        downloadBase64('UEsDBA==', 'data.xlsx', XLSX);
        expect(downloadBinary).toHaveBeenCalledWith('UEsDBA==', 'data.xlsx', XLSX);
        expect(download).not.toHaveBeenCalled();
        expect(env.anchors).toHaveLength(0);
      } finally {
        env.restore();
      }
    });

    it('falls back to a Blob download on older Mac builds without downloadBinary', () => {
      const download = jest.fn();
      window.lacylights = {
        download,
        send: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
        getAppVersion: jest.fn(),
      };
      const env = setupBrowserDownload();
      try {
        downloadBase64('UEsDBA==', 'data.xlsx', XLSX);
        expect(download).not.toHaveBeenCalled();
        expect(env.anchors).toHaveLength(1);
        expect(env.blobs[0].type).toBe(XLSX);
      } finally {
        env.restore();
      }
    });
  });
});

describe('importExport/bridge', () => {
  it('reports no native support in a plain browser', () => {
    expect(getNativeBridge()).toBeUndefined();
    expect(hasNativeTextDownload()).toBe(false);
    expect(hasNativeBinaryDownload()).toBe(false);
  });

  it('detects text-only and binary-capable bridges', () => {
    const base = {
      download: jest.fn(),
      send: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      getAppVersion: jest.fn(),
    };
    window.lacylights = base;
    expect(hasNativeTextDownload()).toBe(true);
    expect(hasNativeBinaryDownload()).toBe(false);

    window.lacylights = { ...base, downloadBinary: jest.fn() };
    expect(hasNativeBinaryDownload()).toBe(true);
  });
});

describe('importExport/files', () => {
  it('uses Blob.text() when available', async () => {
    const blob = new Blob(['hello']);
    (blob as Blob & { text: () => Promise<string> }).text = jest.fn().mockResolvedValue('hello');
    await expect(readFileAsText(blob)).resolves.toBe('hello');
  });

  it('falls back to FileReader', async () => {
    const blob = new Blob(['from reader']);
    Object.defineProperty(blob, 'text', { value: undefined });
    await expect(readFileAsText(blob)).resolves.toBe('from reader');
  });
});
