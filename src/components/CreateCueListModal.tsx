'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_CUE_LIST } from '@/graphql/cueLists';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface CreateCueListModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCueListCreated: () => void;
}

export default function CreateCueListModal({ isOpen, onClose, projectId, onCueListCreated }: CreateCueListModalProps) {
  const isMobile = useIsMobile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [createCueList, { loading: creating }] = useMutation(CREATE_CUE_LIST, {
    onCompleted: () => {
      onCueListCreated();
      handleClose();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setError(null);

    createCueList({
      variables: {
        input: {
          name,
          description: description || undefined,
          projectId,
        },
      },
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  const formContent = (
    <form id="create-cue-list-form" onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Create a new cue list to sequence your scenes for playback.
      </p>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error creating cue list
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p className="whitespace-pre-wrap select-all">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="cue-list-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cue List Name *
        </label>
        <input
          id="cue-list-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Show, Act 1, Opening"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="cue-list-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="cue-list-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description of this cue list..."
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </form>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-3 justify-end'}`}>
      {isMobile ? (
        <>
          <button
            type="submit"
            form="create-cue-list-form"
            disabled={creating || !name.trim()}
            className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {creating ? 'Creating...' : 'Create Cue List'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px]"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-cue-list-form"
            disabled={creating || !name.trim()}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Cue List'}
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Cue List"
      footer={footerContent}
      maxWidth="max-w-lg"
    >
      {formContent}
    </BottomSheet>
  );
}