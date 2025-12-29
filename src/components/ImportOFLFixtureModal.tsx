'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { IMPORT_OFL_FIXTURE } from '@/graphql/fixtures';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ImportOFLFixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFixtureImported: () => void;
}

export default function ImportOFLFixtureModal({ isOpen, onClose, onFixtureImported }: ImportOFLFixtureModalProps) {
  const isMobile = useIsMobile();
  const [manufacturer, setManufacturer] = useState('');
  const [oflJson, setOflJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [existingFixtureInfo, setExistingFixtureInfo] = useState<{ name: string; instanceCount: number } | null>(null);

  const [importFixture, { loading }] = useMutation(IMPORT_OFL_FIXTURE, {
    onCompleted: () => {
      onFixtureImported();
      handleClose();
    },
    onError: (err) => {
      // Check if this is a duplicate fixture error
      if (err.message.startsWith('FIXTURE_EXISTS:')) {
        const parts = err.message.split(':');

        // Validate that we have all expected parts
        if (parts.length >= 3) {
          const fixtureName = parts[1];
          const instanceCount = parseInt(parts[2], 10);

          // Verify instanceCount is a valid number
          if (!isNaN(instanceCount)) {
            setExistingFixtureInfo({ name: fixtureName, instanceCount });
            setShowReplaceConfirm(true);
            setError(null);
            return;
          }
        }

        // If parsing failed, treat as regular error
        setError('Error parsing fixture existence check. Please try again.');
      } else {
        setError(err.message);
      }
    },
  });

  const handleClose = () => {
    setManufacturer('');
    setOflJson('');
    setError(null);
    setShowReplaceConfirm(false);
    setExistingFixtureInfo(null);
    onClose();
  };

  const performImport = async (replace = false) => {
    setError(null);

    // Validate JSON format
    let parsedJson;
    try {
      parsedJson = JSON.parse(oflJson);
    } catch {
      setError('Invalid JSON format. Please check your input.');
      return;
    }

    // Validate required OFL fields
    const validationErrors: string[] = [];
    if (!parsedJson.name || typeof parsedJson.name !== 'string') {
      validationErrors.push('Missing required field: "name"');
    }
    if (!Array.isArray(parsedJson.categories) || parsedJson.categories.length === 0) {
      validationErrors.push('Missing or empty required field: "categories"');
    }
    if (!parsedJson.availableChannels || typeof parsedJson.availableChannels !== 'object' || Object.keys(parsedJson.availableChannels).length === 0) {
      validationErrors.push('Missing or empty required field: "availableChannels"');
    }
    if (!Array.isArray(parsedJson.modes) || parsedJson.modes.length === 0) {
      validationErrors.push('Missing or empty required field: "modes"');
    }

    if (validationErrors.length > 0) {
      setError(`Invalid OFL JSON:\n${validationErrors.join('\n')}`);
      return;
    }

    await importFixture({
      variables: {
        input: {
          manufacturer,
          oflFixtureJson: oflJson,
          replace,
        },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performImport(false);
  };

  const handleReplaceConfirm = async () => {
    setShowReplaceConfirm(false);
    await performImport(true);
  };

  const handleReplaceCancel = () => {
    setShowReplaceConfirm(false);
    setExistingFixtureInfo(null);
    setError('Fixture import cancelled. The existing fixture was not replaced.');
  };

  if (!isOpen) {
    return null;
  }

  // Show replace confirmation dialog
  if (showReplaceConfirm && existingFixtureInfo) {
    const replaceFooter = (
      <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-3'}`}>
        {isMobile ? (
          <>
            <button
              onClick={handleReplaceConfirm}
              disabled={loading}
              className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              {loading ? 'Replacing...' : 'Replace Fixture'}
            </button>
            <button
              onClick={handleReplaceCancel}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReplaceCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleReplaceConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Replacing...' : 'Replace Fixture'}
            </button>
          </>
        )}
      </div>
    );

    return (
      <BottomSheet
        isOpen={true}
        onClose={handleReplaceCancel}
        title="Fixture Already Exists"
        footer={replaceFooter}
        maxWidth="max-w-md"
        closeOnBackdrop={false}
        testId="import-ofl-replace-modal"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            The fixture <span className="font-semibold text-gray-900 dark:text-white">{existingFixtureInfo.name}</span> already exists in your library.
          </p>

          {existingFixtureInfo.instanceCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This fixture is currently used by <strong>{existingFixtureInfo.instanceCount}</strong> fixture instance{existingFixtureInfo.instanceCount !== 1 ? 's' : ''} in your projects. Replacing it will update the definition for all existing instances.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Would you like to replace the existing fixture definition with the new one?
          </p>
        </div>
      </BottomSheet>
    );
  }

  const formContent = (
    <form id="import-ofl-form" onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How to get OFL fixture JSON:
        </h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Visit <a href="https://open-fixture-library.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">open-fixture-library.org</a></li>
          <li>Search for your fixture</li>
          <li>Click on the fixture to view its details</li>
          <li>Click &quot;Export&quot; and select &quot;OFL (JSON)&quot; format</li>
          <li>Copy the entire JSON content and paste it below</li>
        </ol>
      </div>

      <div>
        <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Manufacturer Name *
        </label>
        <input
          type="text"
          id="manufacturer"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          required
          placeholder="e.g., Chauvet, Martin, ETC"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          The manufacturer name (this can be different from the one in the JSON)
        </p>
      </div>

      <div>
        <label htmlFor="oflJson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          OFL Fixture JSON *
        </label>
        <textarea
          id="oflJson"
          value={oflJson}
          onChange={(e) => setOflJson(e.target.value)}
          required
          rows={isMobile ? 10 : 15}
          placeholder='Paste the complete OFL JSON here (e.g., {"name": "...", "categories": [...], ...})'
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-base"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Paste the complete JSON fixture definition from Open Fixture Library
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          Required JSON fields:
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">name</code> - Fixture model name</li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">categories</code> - Array of fixture categories</li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">availableChannels</code> - Object defining all channels</li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">modes</code> - Array of fixture modes</li>
        </ul>
      </div>
    </form>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row justify-end space-x-3'}`}>
      {isMobile ? (
        <>
          <button
            type="submit"
            form="import-ofl-form"
            disabled={loading || !manufacturer || !oflJson}
            className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            {loading ? 'Importing...' : 'Import Fixture'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="import-ofl-form"
            disabled={loading || !manufacturer || !oflJson}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Fixture'}
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Import OFL Fixture Definition"
      footer={footerContent}
      maxWidth="max-w-3xl"
      testId="import-ofl-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
