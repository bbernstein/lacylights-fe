'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_CUE_LIST,
  GET_CUE_LIST_PLAYBACK_STATUS,
  FADE_TO_BLACK,
  UPDATE_CUE,
  CREATE_CUE,
  DELETE_CUE,
  REORDER_CUES,
  UPDATE_CUE_LIST,
  START_CUE_LIST,
  NEXT_CUE,
  PREVIOUS_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST
} from '@/graphql/cueLists';
import { GET_PROJECT_SCENES } from '@/graphql/scenes';
import { Cue, Scene } from '@/types';
import { convertCueIndexForLocalState } from '@/utils/cueListHelpers';
import BulkFadeUpdateModal from './BulkFadeUpdateModal';
import SceneEditorModal from './SceneEditorModal';
import { useCueListPlayback } from '@/hooks/useCueListPlayback';
import { PencilIcon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CueListUnifiedViewProps {
  cueListId: string;
  onClose: () => void;
}


interface EditableCellProps {
  value: number;
  onUpdate: (value: number) => void;
  disabled?: boolean;
  suffix?: string;
  step?: number;
  min?: number;
}

function EditableCell({ value, onUpdate, disabled = false, suffix = 's', step = 0.1, min = 0 }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue >= min) {
      onUpdate(newValue);
    } else {
      setEditValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      handleCancel();
    }
  };

  if (isEditing && !disabled) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={step}
        min={min}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-20 px-1 py-0 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={`text-left ${disabled ? 'cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded cursor-pointer'}`}
    >
      {value}{suffix}
    </button>
  );
}

interface SortableCueRowProps {
  cue: Cue;
  index: number;
  isActive: boolean;
  isNext: boolean;
  isPrevious: boolean;
  fadeProgress?: number;
  onJumpToCue: (cue: Cue, index: number) => void;
  onUpdateCue: (cue: Cue) => void;
  onDeleteCue: (cue: Cue) => void;
  onEditScene: (sceneId: string) => void;
  editMode: boolean;
  scenes: Scene[];
  isSelected: boolean;
  onSelect: (cueId: string, selected: boolean) => void;
}

function SortableCueRow(props: SortableCueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.cue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <CueRow
      {...props}
      ref={setNodeRef}
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
    />
  );
}

const CueRow = React.forwardRef<HTMLTableRowElement, SortableCueRowProps & {
  style?: React.CSSProperties;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
}>(({
  cue,
  index,
  isActive,
  isNext,
  isPrevious,
  fadeProgress,
  onJumpToCue,
  onUpdateCue,
  onDeleteCue,
  onEditScene,
  editMode,
  scenes,
  isSelected,
  onSelect,
  style,
  dragAttributes,
  dragListeners,
  isDragging
}, ref) => {
  const [showSceneSelect, setShowSceneSelect] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState(cue.scene.id);

  let rowBgClass = '';
  let textColorClass = 'text-gray-800 dark:text-gray-100';

  if (isActive) {
    rowBgClass = 'bg-green-50 dark:bg-green-900/40';
    textColorClass = 'text-gray-900 dark:text-white';
  } else if (isNext) {
    rowBgClass = 'bg-blue-50 dark:bg-blue-900/30';
    textColorClass = 'text-gray-900 dark:text-white';
  } else if (isPrevious) {
    rowBgClass = 'bg-gray-50 dark:bg-gray-800/50';
  } else {
    rowBgClass = 'bg-white dark:bg-gray-800';
  }

  if (isDragging) {
    rowBgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
  }

  const handleRowClick = () => {
    if (!editMode) {
      onJumpToCue(cue, index);
    }
  };

  const handleSceneChange = () => {
    onUpdateCue({
      ...cue,
      scene: scenes.find(s => s.id === selectedSceneId) || cue.scene,
    });
    setShowSceneSelect(false);
  };

  return (
    <tr
      ref={ref}
      style={style}
      className={`${rowBgClass} transition-colors duration-300 border-b border-gray-200 dark:border-gray-700 ${!editMode ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
      onClick={handleRowClick}
    >
      <td className="px-3 py-3">
        {editMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(cue.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}
      </td>

      <td className="px-3 py-3">
        {editMode && (
          <button
            className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 mr-2"
            {...dragAttributes}
            {...dragListeners}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
            </svg>
          </button>
        )}
        <span className={`text-sm font-medium ${textColorClass}`}>
          {cue.cueNumber}
        </span>
      </td>

      <td className={`px-3 py-3 text-sm font-medium ${textColorClass}`}>
        {cue.name}
      </td>

      <td className={`px-3 py-3 text-sm ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        {editMode && showSceneSelect ? (
          <div className="flex items-center space-x-1">
            <select
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              className="text-sm rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>{scene.name}</option>
              ))}
            </select>
            <button
              onClick={handleSceneChange}
              className="text-green-600 hover:text-green-800 p-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setSelectedSceneId(cue.scene.id);
                setShowSceneSelect(false);
              }}
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => editMode && setShowSceneSelect(true)}
              disabled={!editMode}
              className={editMode ? 'hover:underline' : ''}
            >
              {cue.scene.name}
            </button>
            {editMode && (
              <button
                onClick={() => onEditScene(cue.scene.id)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                title="Edit scene"
                aria-label="Edit scene"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </td>

      <td className={`px-3 py-3 text-sm ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        <EditableCell
          value={cue.fadeInTime}
          onUpdate={(value) => onUpdateCue({ ...cue, fadeInTime: value })}
          disabled={!editMode}
        />
      </td>

      <td className={`px-3 py-3 text-sm ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        <EditableCell
          value={cue.fadeOutTime}
          onUpdate={(value) => onUpdateCue({ ...cue, fadeOutTime: value })}
          disabled={!editMode}
        />
      </td>

      <td className={`px-3 py-3 text-sm ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        <EditableCell
          value={cue.followTime || 0}
          onUpdate={(value) => onUpdateCue({ ...cue, followTime: value > 0 ? value : undefined })}
          disabled={!editMode}
        />
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center space-x-2">
          {isActive && (
            <>
              <span className="text-green-600 dark:text-green-400 font-medium text-sm">LIVE</span>
              {fadeProgress !== undefined && fadeProgress < 100 && (
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-100"
                    style={{ width: `${fadeProgress}%` }}
                  />
                </div>
              )}
            </>
          )}
          {isNext && !isActive && (
            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">NEXT</span>
          )}
          {editMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCue(cue);
              }}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete cue"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>

      <td className="px-3 py-3">
        {!editMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJumpToCue(cue, index);
            }}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs font-medium"
            title="Jump to this cue"
          >
            GO
          </button>
        )}
      </td>
    </tr>
  );
});

CueRow.displayName = 'CueRow';

export default function CueListUnifiedView({ cueListId, onClose }: CueListUnifiedViewProps) {
  const [editMode, setEditMode] = useState(false);

  // Real-time playback synchronization
  const { playbackStatus } = useCueListPlayback(cueListId);

  // Get current state from subscription data only
  const currentCueIndex = convertCueIndexForLocalState(playbackStatus?.currentCueIndex);
  const isPlaying = playbackStatus?.isPlaying || false;
  const fadeProgress = playbackStatus?.fadeProgress ?? 0;


  const [selectedCueIds, setSelectedCueIds] = useState<Set<string>>(new Set());
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showAddCue, setShowAddCue] = useState(false);
  const [cueListName, setCueListName] = useState('');
  const [cueListDescription, setCueListDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [newCue, setNewCue] = useState({
    name: '',
    cueNumber: '1',
    sceneId: '',
    fadeInTime: '3',
    fadeOutTime: '3',
    followTime: '0',
    notes: '',
  });

  const { data: cueListData, loading, refetch } = useQuery(GET_CUE_LIST, {
    variables: { id: cueListId },
    onCompleted: (data) => {
      if (data.cueList) {
        setCueListName(data.cueList.name);
        setCueListDescription(data.cueList.description || '');
      }
    },
  });

  const { data: scenesData } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId: cueListData?.cueList?.project?.id },
    skip: !cueListData?.cueList?.project?.id,
  });


  const [fadeToBlack] = useMutation(FADE_TO_BLACK, {
    onError: (error) => {
      console.error('Error fading to black:', error);
      setError(`Failed to fade to black: ${error.message}`);
    },
  });

  const [startCueList] = useMutation(START_CUE_LIST, {
    refetchQueries: [{ query: GET_CUE_LIST_PLAYBACK_STATUS, variables: { cueListId } }],
    onError: (error) => {
      console.error('Error starting cue list:', error);
      setError(`Failed to start cue list: ${error.message}`);
    },
  });

  const [nextCueMutation] = useMutation(NEXT_CUE, {
    onError: (error) => {
      console.error('Error going to next cue:', error);
      setError(`Failed to go to next cue: ${error.message}`);
    },
  });

  const [previousCueMutation] = useMutation(PREVIOUS_CUE, {
    onError: (error) => {
      console.error('Error going to previous cue:', error);
      setError(`Failed to go to previous cue: ${error.message}`);
    },
  });

  const [goToCue] = useMutation(GO_TO_CUE, {
    onError: (error) => {
      console.error('Error jumping to cue:', error);
      setError(`Failed to jump to cue: ${error.message}`);
    },
  });

  const [stopCueList] = useMutation(STOP_CUE_LIST, {
    onError: (error) => {
      console.error('Error stopping cue list:', error);
      setError(`Failed to stop cue list: ${error.message}`);
    },
  });

  const [updateCue] = useMutation(UPDATE_CUE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [createCue] = useMutation(CREATE_CUE, {
    onCompleted: () => {
      refetch();
      setShowAddCue(false);
      setNewCue({
        name: '',
        cueNumber: '1',
        sceneId: '',
        fadeInTime: '3',
        fadeOutTime: '3',
        followTime: '0',
        notes: '',
      });
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [deleteCue] = useMutation(DELETE_CUE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [reorderCues] = useMutation(REORDER_CUES, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [updateCueList] = useMutation(UPDATE_CUE_LIST, {
    onError: (error) => {
      setError(error.message);
    },
  });

  const cueList = cueListData?.cueList;
  const cues = useMemo(() => cueList?.cues || [], [cueList?.cues]);
  const scenes = scenesData?.project?.scenes || [];
  const currentCue = currentCueIndex >= 0 && currentCueIndex < cues.length ? cues[currentCueIndex] : null;
  const nextCue = currentCueIndex + 1 < cues.length ? cues[currentCueIndex + 1] : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    return () => {
      if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
    };
  }, []);


  const handleJumpToCue = useCallback(async (cue: Cue, index: number) => {
    if (!cueList) return;

    if (followTimeoutRef.current) {
      clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = null;
    }

    await goToCue({
      variables: {
        cueListId: cueList.id,
        cueIndex: index,
        fadeInTime: cue.fadeInTime,
      },
    });

    if (cue.followTime && cue.followTime > 0 && index + 1 < cues.length) {
      const totalWaitTime = (cue.fadeInTime + cue.followTime) * 1000;
      const nextCueIndex = index + 1;
      const nextCueToPlay = cues[nextCueIndex];

      followTimeoutRef.current = setTimeout(() => {
        handleJumpToCue(nextCueToPlay, nextCueIndex);
      }, totalWaitTime);
    }
  }, [goToCue, cues, cueList]);

  const handleNext = useCallback(async () => {
    if (!cueList) return;

    // Early return if at the end of the list to avoid unnecessary mutation
    if (currentCueIndex + 1 >= cues.length) return;

    await nextCueMutation({
      variables: {
        cueListId: cueList.id,
        fadeInTime: cues[currentCueIndex + 1]?.fadeInTime,
      },
    });
  }, [nextCueMutation, cueList, currentCueIndex, cues]);

  const handlePrevious = useCallback(async () => {
    if (!cueList || currentCueIndex <= 0) return;

    await previousCueMutation({
      variables: {
        cueListId: cueList.id,
        fadeInTime: cues[currentCueIndex - 1]?.fadeInTime,
      },
    });
  }, [previousCueMutation, cueList, currentCueIndex, cues]);

  const handleGo = useCallback(async () => {
    if (!cueList) return;

    if (currentCueIndex === -1 && cues.length > 0) {
      // Starting fresh - use START_CUE_LIST
      await startCueList({
        variables: {
          cueListId: cueList.id,
          startFromCue: 0,
        },
      });
    } else {
      // Already in progress - use NEXT_CUE
      handleNext();
    }
  }, [currentCueIndex, cues, cueList, startCueList, handleNext]);

  const handleStop = useCallback(async () => {
    if (!cueList) return;

    if (followTimeoutRef.current) {
      clearTimeout(followTimeoutRef.current);
      followTimeoutRef.current = null;
    }

    // Use stopCueList for formal cue list stopping, then fade to black
    await stopCueList({
      variables: {
        cueListId: cueList.id,
      },
    });

    await fadeToBlack({
      variables: {
        fadeOutTime: 3,
      },
    });
  }, [cueList, stopCueList, fadeToBlack]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!editMode) {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleGo();
      } else if (e.key === 'Escape') {
        handleStop();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    }
  }, [editMode, handleGo, handleStop, handlePrevious, handleNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleUpdateCue = (cue: Cue) => {
    updateCue({
      variables: {
        id: cue.id,
        input: {
          name: cue.name,
          cueNumber: cue.cueNumber,
          cueListId: cueList?.id,
          sceneId: cue.scene.id,
          fadeInTime: cue.fadeInTime,
          fadeOutTime: cue.fadeOutTime,
          followTime: cue.followTime || undefined,
          notes: cue.notes || undefined,
        },
      },
    });
  };

  const handleDeleteCue = (cue: Cue) => {
    if (window.confirm(`Delete cue "${cue.name}"?`)) {
      deleteCue({
        variables: {
          id: cue.id,
        },
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && cueList) {
      const oldIndex = cueList.cues.findIndex((cue: Cue) => cue.id === active.id);
      const newIndex = cueList.cues.findIndex((cue: Cue) => cue.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCues = arrayMove(cueList.cues, oldIndex, newIndex);
        const cueOrders = (reorderedCues as Cue[]).map((cue: Cue, index: number) => ({
          cueId: cue.id,
          cueNumber: index + 1,
        }));

        reorderCues({
          variables: {
            cueListId: cueList.id,
            cueOrders,
          },
        });
      }
    }
  };

  const handleAddCue = () => {
    if (!cueList || !newCue.sceneId) return;

    createCue({
      variables: {
        input: {
          name: newCue.name,
          cueNumber: newCue.cueNumber ? parseFloat(newCue.cueNumber) : 1,
          cueListId: cueList.id,
          sceneId: newCue.sceneId,
          fadeInTime: parseFloat(newCue.fadeInTime) || 3,
          fadeOutTime: parseFloat(newCue.fadeOutTime) || 3,
          followTime: newCue.followTime === '' || newCue.followTime == null ? undefined : parseFloat(newCue.followTime),
          notes: newCue.notes || undefined,
        },
      },
    });
  };

  const handleUpdateCueList = () => {
    if (!cueList) return;

    updateCueList({
      variables: {
        id: cueList.id,
        input: {
          name: cueListName,
          description: cueListDescription || undefined,
          projectId: cueList.project.id,
        },
      },
    });
  };

  const handleSelectCue = (cueId: string, selected: boolean) => {
    setSelectedCueIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(cueId);
      } else {
        newSet.delete(cueId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && cueList?.cues) {
      setSelectedCueIds(new Set(cueList.cues.map((cue: Cue) => cue.id)));
    } else {
      setSelectedCueIds(new Set());
    }
  };

  const getNextCueNumber = useCallback(() => {
    if (!cueList?.cues || cueList.cues.length === 0) return 1;
    const maxCueNumber = Math.max(0, ...cueList.cues.map((c: Cue) => c.cueNumber));
    return maxCueNumber + 1;
  }, [cueList?.cues]);

  useEffect(() => {
    if (showAddCue) {
      setNewCue(prev => ({ ...prev, cueNumber: getNextCueNumber().toString() }));
    }
  }, [showAddCue, getNextCueNumber]);

  const selectedCues = cueList?.cues.filter((cue: Cue) => selectedCueIds.has(cue.id)) || [];

  const handleEditScene = (sceneId: string) => {
    setEditingSceneId(sceneId);
  };

  const handleSceneUpdated = () => {
    refetch();
  };

  const handleCloseSceneEditor = () => {
    setEditingSceneId(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <p className="text-white text-xl">Loading cue list...</p>
      </div>
    );
  }

  if (!cueList) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <p className="text-red-500 text-xl">Cue list not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={cueListName}
                onChange={(e) => setCueListName(e.target.value)}
                onBlur={handleUpdateCueList}
                className="text-2xl font-bold bg-transparent text-white border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={!editMode}
              />
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  editMode
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={editMode ? 'Exit edit mode' : 'Enter edit mode'}
              >
                {editMode ? 'EDITING' : 'EDIT MODE'}
              </button>
              <button
                onClick={() => {
                  const width = 600;
                  const height = 700;
                  const left = (window.screen.width - width) / 2;
                  const top = (window.screen.height - height) / 2;
                  window.open(
                    `/player/${cueListId}`,
                    'cueListPlayer',
                    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
                  );
                }}
                className="px-3 py-1 rounded text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1"
                title="Open player in new window"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Pop Out Player</span>
              </button>
            </div>
            {cueListDescription && (
              <input
                type="text"
                value={cueListDescription}
                onChange={(e) => setCueListDescription(e.target.value)}
                onBlur={handleUpdateCueList}
                className="text-gray-400 mt-1 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={!editMode}
              />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700"
            title="Close unified view"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-6 py-2">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Add Cue Section */}
      {editMode && (
        <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {cues.length} cues
              </span>
              {selectedCueIds.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {selectedCueIds.size} selected
                  </span>
                  <button
                    onClick={() => setShowBulkUpdateModal(true)}
                    className="px-2 py-1 text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Update Fades
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAddCue(!showAddCue)}
              className="px-3 py-1 text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
            >
              {showAddCue ? 'Cancel' : 'Add Cue'}
            </button>
          </div>

          {showAddCue && (
            <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="grid grid-cols-6 gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Cue #"
                  value={newCue.cueNumber}
                  onChange={(e) => setNewCue({ ...newCue, cueNumber: e.target.value })}
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Cue name"
                  value={newCue.name}
                  onChange={(e) => setNewCue({ ...newCue, name: e.target.value })}
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm col-span-2"
                />
                <select
                  value={newCue.sceneId}
                  onChange={(e) => setNewCue({ ...newCue, sceneId: e.target.value })}
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm"
                >
                  <option value="">Select scene...</option>
                  {scenes.map((scene: Scene) => (
                    <option key={scene.id} value={scene.id}>{scene.name}</option>
                  ))}
                </select>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="In"
                    value={newCue.fadeInTime}
                    onChange={(e) => setNewCue({ ...newCue, fadeInTime: e.target.value })}
                    className="rounded border-gray-600 bg-gray-700 text-white text-sm w-16"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Out"
                    value={newCue.fadeOutTime}
                    onChange={(e) => setNewCue({ ...newCue, fadeOutTime: e.target.value })}
                    className="rounded border-gray-600 bg-gray-700 text-white text-sm w-16"
                  />
                </div>
                <button
                  onClick={handleAddCue}
                  disabled={!newCue.name || !newCue.sceneId}
                  className="px-3 py-1 text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cue List Table */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800/90 rounded-lg overflow-hidden shadow-lg">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-3 py-3 text-left">
                    {editMode && (
                      <input
                        type="checkbox"
                        checked={selectedCueIds.size > 0 && selectedCueIds.size === cueList.cues.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Cue #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Scene
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    In
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Out
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Follow
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    {!editMode && 'Jump'}
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={cueList.cues.map((cue: Cue) => cue.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="bg-white dark:bg-gray-800">
                  {cues.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No cues yet. {editMode ? 'Add your first cue to get started.' : 'Switch to edit mode to add cues.'}
                      </td>
                    </tr>
                  ) : (
                    cues.map((cue: Cue, index: number) => (
                      <SortableCueRow
                        key={cue.id}
                        cue={cue}
                        index={index}
                        isActive={index === currentCueIndex}
                        isNext={index === currentCueIndex + 1}
                        isPrevious={index < currentCueIndex}
                        fadeProgress={index === currentCueIndex ? fadeProgress : undefined}
                        onJumpToCue={handleJumpToCue}
                        onUpdateCue={handleUpdateCue}
                        onDeleteCue={handleDeleteCue}
                        onEditScene={handleEditScene}
                        editMode={editMode}
                        scenes={scenes}
                        isSelected={selectedCueIds.has(cue.id)}
                        onSelect={handleSelectCue}
                      />
                    ))
                  )}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevious}
              disabled={currentCueIndex <= 0 || editMode}
              className="inline-flex items-center px-4 py-3 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={handleGo}
              disabled={isPlaying || (currentCueIndex >= cues.length - 1) || editMode}
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-md text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentCueIndex === -1 ? 'START' : 'GO'}
              <span className="ml-2 text-sm font-normal">
                {nextCue ? `(${nextCue.cueNumber})` : ''}
              </span>
            </button>

            <button
              onClick={handleNext}
              disabled={!nextCue || editMode}
              className="inline-flex items-center px-4 py-3 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleStop}
              disabled={editMode}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
              STOP
            </button>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">
              Current: {currentCue ? `Cue ${currentCue.cueNumber} - ${currentCue.name}` : 'None'}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Next: {nextCue ? `Cue ${nextCue.cueNumber} - ${nextCue.name}` : 'End of list'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {!editMode && 'Keyboard: Space/Enter = GO | ← → = Navigate | Esc = Stop'}
              {editMode && 'Edit mode active - Click values to edit'}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      <BulkFadeUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        selectedCues={selectedCues}
        onUpdate={refetch}
      />

      {/* Scene Editor Modal */}
      <SceneEditorModal
        isOpen={!!editingSceneId}
        onClose={handleCloseSceneEditor}
        sceneId={editingSceneId}
        onSceneUpdated={handleSceneUpdated}
      />
    </div>
  );
}