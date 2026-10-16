'use client';

import { useCallback, useId, useRef, useState, type DragEvent } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentPlusIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import FixtureSourceBadge from '@/components/FixtureSourceBadge';
import { useGdtfImportUnsupported } from '@/hooks/useGdtfImportUnsupported';
import {
  GDTF_ACCEPT,
  GDTF_IMPORT_UNSUPPORTED_MESSAGE,
  GDTF_STATUS_LABELS,
  GdtfExistingPolicy,
  GdtfImportStatus,
  GdtfImportUnsupportedError,
  buildGdtfResultsCsv,
  collectGdtfDescriptions,
  downloadFile,
  filesFromDataTransfer,
  formatErrorMessage,
  gdtfResultsCsvFilename,
  rowsFromCollectErrors,
  runGdtfImport,
  summarizeGdtfRows,
  type GdtfCollectError,
  type GdtfCollectResult,
  type GdtfImportRow,
  type GdtfInputFile,
} from '@/lib/importExport';

type Phase = 'idle' | 'reading' | 'ready' | 'importing' | 'done';

interface Progress {
  done: number;
  total: number;
}

const STATUS_STYLES: Record<GdtfImportStatus, string> = {
  [GdtfImportStatus.Created]:
    'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  [GdtfImportStatus.Updated]:
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  [GdtfImportStatus.Unchanged]:
    'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  [GdtfImportStatus.Skipped]:
    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  [GdtfImportStatus.Failed]:
    'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const BUTTON_SECONDARY =
  'px-4 py-2 min-h-[44px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation';

function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function StatusBadge({ status }: { status: GdtfImportStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap ${
        STATUS_STYLES[status] ?? STATUS_STYLES[GdtfImportStatus.Failed]
      }`}
    >
      {GDTF_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ProgressBar({ label, progress }: { label: string; progress: Progress }) {
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={progress.total}
      aria-valuenow={progress.done}
      aria-valuetext={`${progress.done} of ${progress.total}`}
      className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden"
    >
      <div className="h-full bg-blue-600 dark:bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** Fixture column: the definition's name (with source badge) or the parsed name. */
function FixtureCell({ row }: { row: GdtfImportRow }) {
  const manufacturer = row.definition?.manufacturer ?? row.manufacturer;
  const model = row.definition?.model ?? row.model;
  if (!manufacturer && !model) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1" title={row.definition ? `Definition ID ${row.definition.id}` : undefined}>
      <span>
        {manufacturer && <span className="text-gray-600 dark:text-gray-400">{manufacturer} </span>}
        <span className="font-medium text-gray-900 dark:text-gray-100">{model}</span>
      </span>
      {row.definition?.source && (
        <FixtureSourceBadge source={row.definition.source} sourceVersion={row.definition.sourceVersion} />
      )}
    </span>
  );
}

function NotesCell({ row }: { row: GdtfImportRow }) {
  if (!row.error && row.warnings.length === 0) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }
  return (
    <div className="space-y-1">
      {row.error && <p className="text-red-700 dark:text-red-300">{row.error}</p>}
      {row.warnings.length > 0 && (
        <ul className="list-disc pl-4 text-amber-800 dark:text-amber-300">
          {row.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Import GDTF fixture definitions: `.gdtf` files, `.zip` archives of them or
 * a whole folder, picked or dropped. Files are unzipped in the browser and
 * only their description.xml is sent, in batches of 25 (GDTF_BATCH_SIZE).
 */
export default function GdtfImportPanel() {
  const client = useApolloClient();
  const unsupported = useGdtfImportUnsupported();
  const filesInputId = useId();
  const folderInputId = useId();
  const policyName = useId();
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [readProgress, setReadProgress] = useState<Progress>({ done: 0, total: 0 });
  const [importProgress, setImportProgress] = useState<Progress>({ done: 0, total: 0 });
  const [collected, setCollected] = useState<GdtfCollectResult | null>(null);
  const [policy, setPolicy] = useState<GdtfExistingPolicy>(GdtfExistingPolicy.Update);
  const [rows, setRows] = useState<GdtfImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const busy = phase === 'reading' || phase === 'importing';

  // One operation at a time: dropping a folder, reading files and importing
  // each hold this lock from the moment they start (before any await), so a
  // second pick, drop or import cannot interleave and overwrite the panel.
  const operationRef = useRef(false);
  const tryLock = () => {
    if (operationRef.current) return false;
    operationRef.current = true;
    return true;
  };
  const unlock = () => {
    operationRef.current = false;
  };

  // React does not know `webkitdirectory`; set it on the element directly.
  const setFolderInput = useCallback((el: HTMLInputElement | null) => {
    folderInputRef.current = el;
    if (el) {
      el.setAttribute('webkitdirectory', '');
      el.setAttribute('directory', '');
    }
  }, []);

  const resetInputs = () => {
    if (filesInputRef.current) filesInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const startReading = (total: number) => {
    setPhase('reading');
    setError(null);
    setRows(null);
    setCollected(null);
    setReadProgress({ done: 0, total });
  };

  // Reads files while holding the operation lock, and releases it.
  // `unreadable` lists dropped entries that could not be opened; they are
  // reported with the collection errors.
  const readFilesLocked = async (files: GdtfInputFile[], unreadable: GdtfCollectError[] = []) => {
    try {
      if (files.length === 0 && unreadable.length === 0) {
        setPhase('idle');
        return;
      }
      startReading(files.length);
      const result = await collectGdtfDescriptions(files, {
        onProgress: (done, total) => setReadProgress({ done, total }),
      });
      setCollected({ ...result, errors: [...unreadable, ...result.errors] });
      setPhase('ready');
    } catch (err) {
      setError(formatErrorMessage(err, 'Could not read the selected files. Error:'));
      setPhase('idle');
    } finally {
      resetInputs();
      unlock();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0 || !tryLock()) {
      resetInputs();
      return;
    }
    void readFilesLocked(files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = busy ? 'none' : 'copy';
    if (!busy) setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Ignore moves between children of the drop zone.
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    // Ignore drops without files (text, links) so earlier results stay.
    const dt = e.dataTransfer;
    const hasFiles =
      (dt?.files?.length ?? 0) > 0 || Array.from(dt?.items ?? []).some((item) => item.kind === 'file');
    if (!hasFiles || !tryLock()) return;
    // Show the panel as busy while dropped folders are enumerated.
    startReading(0);
    // Entries must be taken during the event; filesFromDataTransfer does.
    const pending = filesFromDataTransfer(e.dataTransfer);
    void pending
      .then(({ files, errors }) => readFilesLocked(files, errors))
      .catch((err) => {
        setError(formatErrorMessage(err, 'Could not read the dropped files. Error:'));
        setPhase('idle');
        unlock();
      });
  };

  const handleImport = async () => {
    if (!collected || collected.descriptions.length === 0 || !tryLock()) return;
    setPhase('importing');
    setError(null);
    setImportProgress({ done: 0, total: collected.descriptions.length });
    try {
      const result = await runGdtfImport(client, collected.descriptions, {
        onExisting: policy,
        onProgress: (done, total) => setImportProgress({ done, total }),
      });
      setRows([...result.rows, ...rowsFromCollectErrors(collected.errors)]);
      setError(result.error ? `The import stopped: ${result.error}` : null);
      setPhase('done');
    } catch (err) {
      if (err instanceof GdtfImportUnsupportedError) {
        // The panel now shows the "update LacyLights" message.
        setPhase('idle');
        setCollected(null);
        return;
      }
      setError(formatErrorMessage(err, 'Failed to import fixture definitions. Error:'));
      setPhase('ready');
    } finally {
      unlock();
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setCollected(null);
    setRows(null);
    setError(null);
    resetInputs();
  };

  const handleDownloadCsv = () => {
    if (!rows) return;
    downloadFile(buildGdtfResultsCsv(rows), gdtfResultsCsvFilename(), 'text/csv');
  };

  if (unsupported) {
    return (
      <p
        role="status"
        data-testid="gdtf-import-unsupported"
        className="p-3 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300"
      >
        {GDTF_IMPORT_UNSUPPORTED_MESSAGE}
      </p>
    );
  }

  const summary = rows ? summarizeGdtfRows(rows) : null;
  const foundCount = collected?.descriptions.length ?? 0;

  return (
    <div className="space-y-4">
      <div
        data-testid="gdtf-drop-zone"
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-4 space-y-3 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => filesInputRef.current?.click()}
            disabled={busy}
            className={BUTTON_SECONDARY}
          >
            <DocumentPlusIcon className="h-4 w-4" aria-hidden="true" />
            Choose files
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={busy}
            className={BUTTON_SECONDARY}
          >
            <FolderOpenIcon className="h-4 w-4" aria-hidden="true" />
            Choose folder
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose .gdtf files, .zip archives of them, or a folder; or drop them here. Only the
          fixture description is read; images and 3D models stay on this device.
        </p>
        <input
          ref={filesInputRef}
          id={filesInputId}
          type="file"
          accept={GDTF_ACCEPT}
          multiple
          hidden
          aria-label="GDTF files"
          onChange={handleInputChange}
          disabled={busy}
        />
        <input
          ref={setFolderInput}
          id={folderInputId}
          type="file"
          multiple
          hidden
          aria-label="GDTF folder"
          onChange={handleInputChange}
          disabled={busy}
        />
      </div>

      <fieldset className="space-y-1" disabled={busy}>
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          If a fixture was already imported from GDTF
        </legend>
        <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1">
          <label className="inline-flex items-center gap-2 min-h-[44px] text-sm text-gray-800 dark:text-gray-200">
            <input
              type="radio"
              name={policyName}
              value={GdtfExistingPolicy.Update}
              checked={policy === GdtfExistingPolicy.Update}
              onChange={() => setPolicy(GdtfExistingPolicy.Update)}
              className="h-4 w-4"
            />
            Update
            <span className="text-gray-500 dark:text-gray-400">(replace it with the new file)</span>
          </label>
          <label className="inline-flex items-center gap-2 min-h-[44px] text-sm text-gray-800 dark:text-gray-200">
            <input
              type="radio"
              name={policyName}
              value={GdtfExistingPolicy.Skip}
              checked={policy === GdtfExistingPolicy.Skip}
              onChange={() => setPolicy(GdtfExistingPolicy.Skip)}
              className="h-4 w-4"
            />
            Skip
            <span className="text-gray-500 dark:text-gray-400">(keep the existing definition)</span>
          </label>
        </div>
      </fieldset>

      <div aria-live="polite" className="space-y-2">
        {phase === 'reading' && readProgress.total === 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="gdtf-read-progress">
            Looking for files…
          </p>
        )}
        {phase === 'reading' && readProgress.total > 0 && (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="gdtf-read-progress">
              Reading files… {readProgress.done} of {readProgress.total}
            </p>
            <ProgressBar label="Reading files" progress={readProgress} />
          </>
        )}
        {phase === 'importing' && (
          <>
            <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="gdtf-import-progress">
              Importing… {importProgress.done} of {plural(importProgress.total, 'fixture type')}
            </p>
            <ProgressBar label="Import progress" progress={importProgress} />
          </>
        )}
        {collected && phase === 'ready' && (
          <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="gdtf-found">
            {foundCount > 0
              ? `Found ${plural(foundCount, 'fixture type')} to import.`
              : 'No GDTF fixture types were found in the selected files.'}
            {collected.errors.length > 0 &&
              ` ${plural(collected.errors.length, 'file')} could not be read.`}
            {collected.ignored.length > 0 &&
              ` ${plural(collected.ignored.length, 'other file')} ignored (not .gdtf or .zip).`}
          </p>
        )}
      </div>

      {collected && phase === 'ready' && collected.errors.length > 0 && (
        <ul
          data-testid="gdtf-read-errors"
          className="text-sm list-disc pl-5 max-h-40 overflow-y-auto text-red-700 dark:text-red-300"
        >
          {collected.errors.map((e, i) => (
            <li key={`${e.fileName}-${i}`}>
              <span className="font-medium break-all">{e.fileName}</span>: {e.message}
            </li>
          ))}
        </ul>
      )}

      {phase === 'ready' && collected && (
        <div className="flex flex-col sm:flex-row gap-2">
          {foundCount > 0 && (
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-2 min-h-[44px] bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 touch-manipulation"
            >
              <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
              {`Import ${plural(foundCount, 'fixture type')}`}
            </button>
          )}
          <button type="button" onClick={handleReset} className={BUTTON_SECONDARY}>
            Clear
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {phase === 'done' && rows && summary && (
        <div className="space-y-3" data-testid="gdtf-results">
          <ul
            data-testid="gdtf-summary"
            className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300"
          >
            <li>Created: {summary.created}</li>
            <li>Updated: {summary.updated}</li>
            <li>Unchanged: {summary.unchanged}</li>
            <li>Skipped: {summary.skipped}</li>
            <li>Failed: {summary.failed}</li>
          </ul>

          {rows.length > 0 && (
            <div className="max-h-96 overflow-auto rounded border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm text-left">
                <caption className="sr-only">GDTF import results</caption>
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 sticky top-0">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Status</th>
                    <th scope="col" className="px-3 py-2 font-medium">File</th>
                    <th scope="col" className="px-3 py-2 font-medium">Fixture</th>
                    <th scope="col" className="px-3 py-2 font-medium">Modes</th>
                    <th scope="col" className="px-3 py-2 font-medium">Warnings / error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                  {rows.map((row, i) => (
                    <tr key={`${row.fileName}-${i}`} className="align-top">
                      <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                      <td className="px-3 py-2 break-all">{row.fileName}</td>
                      <td className="px-3 py-2"><FixtureCell row={row} /></td>
                      <td className="px-3 py-2">{row.modeCount ?? '—'}</td>
                      <td className="px-3 py-2"><NotesCell row={row} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={handleDownloadCsv} className={BUTTON_SECONDARY}>
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Download results (CSV)
            </button>
            <button type="button" onClick={handleReset} className={BUTTON_SECONDARY}>
              Import more files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
