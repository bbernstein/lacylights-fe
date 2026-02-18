'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_CUE_LISTS, DELETE_CUE_LIST } from '@/graphql/cueLists';
import { useProject } from '@/contexts/ProjectContext';
import { useStreamDock, BrowseHandlers } from '@/contexts/StreamDockContext';
import { useRecentItems } from '@/hooks/useRecentItems';
import CreateCueListModal from '@/components/CreateCueListModal';
import CueListPlaybackStatus from '@/components/CueListPlaybackStatus';
import { CueList } from '@/types';

export default function CueListsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [highlightedCueListId, setHighlightedCueListId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentProject, loading: projectLoading } = useProject();
  const streamDock = useStreamDock();
  const { addItem: addRecentItem } = useRecentItems();

  const { data, loading, error, refetch } = useQuery(GET_PROJECT_CUE_LISTS, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [deleteCueList] = useMutation(DELETE_CUE_LIST, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting cue list: ${error.message}`);
    },
  });

  const cueLists = useMemo(() => data?.project?.cueLists || [], [data?.project?.cueLists]);

  // Memoize the mapped cue list data to avoid duplication
  const browserCueLists = useMemo(
    () =>
      cueLists.map((cl: CueList) => ({
        id: cl.id,
        name: cl.name,
        cueCount: cl.cues.length,
      })),
    [cueLists],
  );

  // Publish cue list browser state to Stream Deck plugin
  useEffect(() => {
    if (!browserCueLists.length) {
      streamDock.publishCueListBrowserState(null);
      return;
    }

    streamDock.publishCueListBrowserState({
      cueLists: browserCueLists,
      highlightedIndex: 0,
    });
  }, [browserCueLists, streamDock]);

  // Clear cue list browser state on unmount only
  useEffect(() => {
    return () => { streamDock.publishCueListBrowserState(null); };
  }, [streamDock]);

  // Handle highlight from Stream Deck
  const handleHighlightCueList = useCallback((cueListId: string) => {
    setHighlightedCueListId(cueListId);
    // Re-publish with updated highlighted index
    const idx = cueLists.findIndex((cl: CueList) => cl.id === cueListId);
    if (idx >= 0) {
      streamDock.publishCueListBrowserState({
        cueLists: browserCueLists,
        highlightedIndex: idx,
      });
    }
  }, [cueLists, browserCueLists, streamDock]);

  // Register browse handlers for Stream Deck
  useEffect(() => {
    const handlers: BrowseHandlers = {
      handleHighlight: handleHighlightCueList,
      handleSelect: (cueListId: string) => router.push(`/cue-lists/${cueListId}`),
    };
    streamDock.registerBrowseHandlers('cueList', handlers);
    return () => {
      streamDock.registerBrowseHandlers('cueList', null);
    };
  }, [streamDock, handleHighlightCueList, router]);

  // Auto-scroll highlighted cue list into view
  useEffect(() => {
    if (highlightedCueListId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedCueListId]);

  const handleCueListCreated = () => {
    refetch();
  };

  const handleDeleteCueList = (cueList: CueList) => {
    if (window.confirm(`Are you sure you want to delete "${cueList.name}"? This action cannot be undone.`)) {
      deleteCueList({
        variables: {
          id: cueList.id,
        },
      });
    }
  };

  const handleOpenCueList = (cueList: CueList) => {
    addRecentItem({ id: cueList.id, name: cueList.name, type: 'cueList', route: `/cue-lists/${cueList.id}` });
    router.push(`/cue-lists/${cueList.id}`);
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">No project selected.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading cue lists: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Cue Lists</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Sequence your scenes into cue lists for playback
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Cue List
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-500 dark:text-gray-400">Loading cue lists...</p>
        </div>
      ) : cueLists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-500 dark:text-gray-400">No cue lists yet. Create your first cue list to get started.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-4">
            {cueLists.map((cueList: CueList) => {
              const isHighlighted = cueList.id === highlightedCueListId;
              return (
              <div
                key={cueList.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={`shadow rounded-lg p-4 space-y-3 ${
                  isHighlighted
                    ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 dark:ring-blue-400'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-lg">
                    {cueList.name}
                  </div>
                  <CueListPlaybackStatus cueListId={cueList.id} cueCount={cueList.cues.length} />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {cueList.description || '-'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {cueList.cues.length} cues
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleOpenCueList(cueList)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Open cue list"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCueList(cueList)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete cue list"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cues
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cueLists.map((cueList: CueList) => {
                const isHighlighted = cueList.id === highlightedCueListId;
                return (
                <tr
                  key={cueList.id}
                  ref={isHighlighted ? highlightRef as React.Ref<HTMLTableRowElement> : undefined}
                  className={`${
                    isHighlighted
                      ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 dark:ring-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cueList.name}
                      </div>
                      <CueListPlaybackStatus cueListId={cueList.id} cueCount={cueList.cues.length} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs break-words">
                    {cueList.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cueList.cues.length} cues
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenCueList(cueList)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Open cue list"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteCueList(cueList)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete cue list"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}

      {currentProject && (
        <CreateCueListModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={currentProject.id}
          onCueListCreated={handleCueListCreated}
        />
      )}
    </div>
  );
}