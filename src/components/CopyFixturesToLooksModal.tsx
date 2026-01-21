'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CUES_WITH_LOOK_INFO } from '@/graphql/cueLists';
import { GET_PROJECT_LOOKS, COPY_FIXTURES_TO_LOOKS } from '@/graphql/looks';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CopyFixturesToLooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Project ID */
  projectId: string;
  /** Look ID we're copying FROM */
  sourceLookId: string;
  /** Fixture IDs to copy */
  fixtureIds: string[];
  /** Fixture names for display */
  fixtureNames: Map<string, string>;
  /** Channel values for each fixture (fixtureId -> dense array) */
  fixtureValues: Map<string, number[]>;
  /** Active channels for each fixture (fixtureId -> Set of offsets) */
  activeChannels: Map<string, Set<number>>;
  /** Cue list ID - OPTIONAL, enables cue-centric display */
  cueListId?: string;
  /** Cue number we're editing from (for centering the list) */
  returnCueNumber?: string;
  /** Callback on successful copy */
  onSuccess: (result: { lookCount: number; cueCount: number }) => void;
}

interface CueWithLookInfo {
  cueId: string;
  cueNumber: number;
  cueName: string;
  lookId: string;
  lookName: string;
  otherCueNumbers: number[];
}

interface LookSummary {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Modal for copying fixture values to other looks.
 *
 * When cueListId is provided, shows a cue-centric list sorted by cue number.
 * When no cueListId, shows a look-centric list sorted alphabetically.
 */
export default function CopyFixturesToLooksModal({
  isOpen,
  onClose,
  projectId,
  sourceLookId,
  fixtureIds,
  fixtureNames,
  fixtureValues: _fixtureValues, // Reserved for preview feature
  activeChannels,
  cueListId,
  returnCueNumber: _returnCueNumber, // Reserved for centering list on current cue
  onSuccess,
}: CopyFixturesToLooksModalProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLookIds, setSelectedLookIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // Fetch cues with look info (cue-centric mode)
  const { data: cuesData, loading: cuesLoading } = useQuery(GET_CUES_WITH_LOOK_INFO, {
    variables: { cueListId },
    skip: !cueListId || !isOpen,
  });

  // Fetch all looks (look-centric mode fallback)
  const { data: looksData, loading: looksLoading } = useQuery(GET_PROJECT_LOOKS, {
    variables: { projectId },
    skip: !!cueListId || !isOpen,
  });

  // Mutation for copying fixtures
  const [copyFixtures, { loading: copying }] = useMutation(COPY_FIXTURES_TO_LOOKS, {
    onCompleted: (data) => {
      const result = data.copyFixturesToLooks;
      onSuccess({
        lookCount: result.updatedLookCount,
        cueCount: result.affectedCueCount
      });
      handleClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const loading = cuesLoading || looksLoading;

  // Process cues data for cue-centric display
  const cuesWithLookInfo: CueWithLookInfo[] = useMemo(() => {
    if (!cuesData?.cuesWithLookInfo?.cues) return [];
    return cuesData.cuesWithLookInfo.cues;
  }, [cuesData]);

  const orphanLooks: LookSummary[] = useMemo(() => {
    if (!cuesData?.cuesWithLookInfo?.orphanLooks) return [];
    return cuesData.cuesWithLookInfo.orphanLooks;
  }, [cuesData]);

  // Process looks data for look-centric display
  const allLooks: LookSummary[] = useMemo(() => {
    if (!looksData?.project?.looks) return [];
    return [...looksData.project.looks].sort((a: LookSummary, b: LookSummary) =>
      a.name.localeCompare(b.name)
    );
  }, [looksData]);

  // Build look -> cues mapping for cue-centric mode
  const lookToCues = useMemo(() => {
    const map = new Map<string, CueWithLookInfo[]>();
    cuesWithLookInfo.forEach(cue => {
      const existing = map.get(cue.lookId) || [];
      existing.push(cue);
      map.set(cue.lookId, existing);
    });
    return map;
  }, [cuesWithLookInfo]);

  // Get unique looks from cues (for selection tracking)
  const uniqueLookIds = useMemo(() => {
    const ids = new Set<string>();
    cuesWithLookInfo.forEach(cue => ids.add(cue.lookId));
    orphanLooks.forEach(look => ids.add(look.id));
    return ids;
  }, [cuesWithLookInfo, orphanLooks]);

  // Filter items based on search query
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cuesWithLookInfo;
    const query = searchQuery.toLowerCase();
    return cuesWithLookInfo.filter(cue =>
      cue.cueName.toLowerCase().includes(query) ||
      cue.lookName.toLowerCase().includes(query) ||
      cue.cueNumber.toString().includes(query)
    );
  }, [cuesWithLookInfo, searchQuery]);

  const filteredOrphanLooks = useMemo(() => {
    if (!searchQuery.trim()) return orphanLooks;
    const query = searchQuery.toLowerCase();
    return orphanLooks.filter(look =>
      look.name.toLowerCase().includes(query)
    );
  }, [orphanLooks, searchQuery]);

  const filteredAllLooks = useMemo(() => {
    if (!searchQuery.trim()) return allLooks;
    const query = searchQuery.toLowerCase();
    return allLooks.filter(look =>
      look.name.toLowerCase().includes(query)
    );
  }, [allLooks, searchQuery]);

  // Calculate fixture summary
  const fixtureSummary = useMemo(() => {
    const names = fixtureIds
      .map(id => fixtureNames.get(id) || 'Unknown')
      .slice(0, 3);
    const remaining = fixtureIds.length - 3;
    const nameText = remaining > 0
      ? `${names.join(', ')} +${remaining} more`
      : names.join(', ');

    let totalChannels = 0;
    fixtureIds.forEach(id => {
      const channels = activeChannels.get(id);
      if (channels) totalChannels += channels.size;
    });

    return { nameText, totalChannels };
  }, [fixtureIds, fixtureNames, activeChannels]);

  // Calculate affected cue count for selected looks
  const affectedCueCount = useMemo(() => {
    let count = 0;
    selectedLookIds.forEach(lookId => {
      const cues = lookToCues.get(lookId);
      if (cues) count += cues.length;
    });
    return count;
  }, [selectedLookIds, lookToCues]);

  // Handle look selection toggle
  const toggleLookSelection = useCallback((lookId: string) => {
    if (lookId === sourceLookId) return; // Can't select source look
    setSelectedLookIds(prev => {
      const next = new Set(prev);
      if (next.has(lookId)) {
        next.delete(lookId);
      } else {
        next.add(lookId);
      }
      return next;
    });
  }, [sourceLookId]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allIds = cueListId
      ? new Set([...uniqueLookIds].filter(id => id !== sourceLookId))
      : new Set(allLooks.filter(l => l.id !== sourceLookId).map(l => l.id));

    if (selectedLookIds.size === allIds.size) {
      // Deselect all
      setSelectedLookIds(new Set());
    } else {
      // Select all
      setSelectedLookIds(allIds);
    }
  }, [cueListId, uniqueLookIds, allLooks, sourceLookId, selectedLookIds.size]);

  // Check if all selectable items are selected
  const allSelected = useMemo(() => {
    const selectableCount = cueListId
      ? uniqueLookIds.size - (uniqueLookIds.has(sourceLookId) ? 1 : 0)
      : allLooks.filter(l => l.id !== sourceLookId).length;
    return selectableCount > 0 && selectedLookIds.size === selectableCount;
  }, [cueListId, uniqueLookIds, allLooks, sourceLookId, selectedLookIds.size]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSelectedLookIds(new Set());
    setError('');
    onClose();
  }, [onClose]);

  // Handle copy submission
  const handleCopy = useCallback(() => {
    if (selectedLookIds.size === 0) {
      setError('Please select at least one target look');
      return;
    }

    setError('');
    copyFixtures({
      variables: {
        input: {
          sourceLookId,
          fixtureIds,
          targetLookIds: Array.from(selectedLookIds),
        },
      },
    });
  }, [selectedLookIds, sourceLookId, fixtureIds, copyFixtures]);

  // Render a cue row (cue-centric mode)
  const renderCueRow = (cue: CueWithLookInfo, isSourceLook: boolean) => {
    const isSelected = selectedLookIds.has(cue.lookId);
    const otherCueNumbers = cue.otherCueNumbers.length > 0
      ? ` (#${cue.otherCueNumbers.join(', #')})`
      : '';

    return (
      <div
        key={cue.cueId}
        className={`flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
          isSourceLook
            ? 'bg-gray-100 dark:bg-gray-800 opacity-60'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
        }`}
        onClick={() => !isSourceLook && toggleLookSelection(cue.lookId)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isSourceLook}
          onChange={() => toggleLookSelection(cue.lookId)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              #{cue.cueNumber}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {cue.cueName}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {cue.lookName}{otherCueNumbers}
            {isSourceLook && <span className="ml-2 text-xs text-gray-400">(source)</span>}
          </div>
        </div>
      </div>
    );
  };

  // Render a look row (look-centric mode or orphan looks)
  const renderLookRow = (look: LookSummary, isSourceLook: boolean) => {
    const isSelected = selectedLookIds.has(look.id);

    return (
      <div
        key={look.id}
        className={`flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
          isSourceLook
            ? 'bg-gray-100 dark:bg-gray-800 opacity-60'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
        }`}
        onClick={() => !isSourceLook && toggleLookSelection(look.id)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isSourceLook}
          onChange={() => toggleLookSelection(look.id)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {look.name}
            {isSourceLook && <span className="ml-2 text-xs text-gray-400">(source)</span>}
          </div>
          {look.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {look.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Build button label
  const buttonLabel = useMemo(() => {
    if (copying) return 'Copying...';
    if (selectedLookIds.size === 0) return 'Copy to Looks';

    const lookText = selectedLookIds.size === 1 ? '1 Look' : `${selectedLookIds.size} Looks`;
    if (cueListId && affectedCueCount > 0) {
      const cueText = affectedCueCount === 1 ? '1 cue' : `${affectedCueCount} cues`;
      return `Copy to ${lookText} (${cueText})`;
    }
    return `Copy to ${lookText}`;
  }, [copying, selectedLookIds.size, cueListId, affectedCueCount]);

  const formContent = (
    <div className="space-y-4">
      {/* Fixture Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Copying: {fixtureIds.length} fixture{fixtureIds.length !== 1 ? 's' : ''} ({fixtureSummary.nameText})
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
          {fixtureSummary.totalChannels} active channel{fixtureSummary.totalChannels !== 1 ? 's' : ''} will be copied
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={cueListId ? "Search cues or looks..." : "Search looks..."}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Select All */}
      <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={handleSelectAll}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select All
        </span>
        {selectedLookIds.size > 0 && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {selectedLookIds.size} selected
            {cueListId && affectedCueCount > 0 && ` (${affectedCueCount} cues)`}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Cue-centric list */}
      {cueListId && !loading && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-64 overflow-y-auto">
          {filteredCues.map(cue => renderCueRow(cue, cue.lookId === sourceLookId))}

          {/* Orphan looks section */}
          {filteredOrphanLooks.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Looks not in any cue
                </span>
              </div>
              {filteredOrphanLooks.map(look => renderLookRow(look, look.id === sourceLookId))}
            </>
          )}

          {filteredCues.length === 0 && filteredOrphanLooks.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No cues or looks found
            </div>
          )}
        </div>
      )}

      {/* Look-centric list */}
      {!cueListId && !loading && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-64 overflow-y-auto">
          {filteredAllLooks.map(look => renderLookRow(look, look.id === sourceLookId))}

          {filteredAllLooks.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No looks found
            </div>
          )}
        </div>
      )}

      {/* Warning for multi-cue looks */}
      {cueListId && selectedLookIds.size > 0 && affectedCueCount > selectedLookIds.size && (
        <div className="flex items-start space-x-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Some selected looks are used by multiple cues. All {affectedCueCount} cues using these looks will be affected.
          </p>
        </div>
      )}
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end space-x-3'}`}>
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying || selectedLookIds.size === 0}
            className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
          >
            {buttonLabel}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            disabled={copying}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={copying}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying || selectedLookIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        </>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Copy Fixtures to Other Looks"
      footer={footerContent}
      maxWidth="max-w-lg"
      testId="copy-fixtures-to-looks-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
