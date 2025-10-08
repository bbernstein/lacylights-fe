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
  fieldType?: string;
  cueIndex?: number;
  autoFocusFieldRef?: React.MutableRefObject<{ fieldType: string; cueIndex: number } | null>;
}

function EditableCell({ value, onUpdate, disabled = false, suffix = 's', step = 0.001, min = 0, fieldType, cueIndex, autoFocusFieldRef }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if this field should auto-focus after render (for arrow navigation)
  useEffect(() => {
    if (autoFocusFieldRef?.current && fieldType && cueIndex !== undefined) {
      const { fieldType: targetFieldType, cueIndex: targetCueIndex } = autoFocusFieldRef.current;
      if (targetFieldType === fieldType && targetCueIndex === cueIndex) {
        console.log('Auto-focusing field from ref', { fieldType, cueIndex });
        setIsEditing(true);
        autoFocusFieldRef.current = null; // Clear the ref after using it
      }
    }
  }, [autoFocusFieldRef, fieldType, cueIndex]);

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

  const navigateToField = (direction: 'up' | 'down') => {
    if (!fieldType || cueIndex === undefined) {
      console.log('No fieldType or cueIndex', { fieldType, cueIndex });
      return;
    }

    console.log('Navigating', { direction, fieldType, currentIndex: cueIndex });

    // Calculate target field
    const targetIndex = direction === 'down' ? cueIndex + 1 : cueIndex - 1;

    // Store which field should auto-focus after the GraphQL refetch
    if (autoFocusFieldRef) {
      autoFocusFieldRef.current = {
        fieldType,
        cueIndex: targetIndex
      };
      console.log('Set autoFocusFieldRef to', autoFocusFieldRef.current);
    }

    // Save current field (this will trigger GraphQL mutation and refetch)
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      handleCancel();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      navigateToField('down');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      navigateToField('up');
    }
    // Tab key: let default behavior happen, onBlur will save
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
        className="w-20 px-1 py-0 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={() => !disabled && setIsEditing(true)}
      onFocus={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      data-field-type={fieldType}
      data-cue-index={cueIndex}
      className={`text-left ${disabled ? 'cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded cursor-pointer'}`}
    >
      {value}{suffix}
    </button>
  );
}

interface EditableTextCellProps {
  value: string;
  onUpdate: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  fieldType?: string;
  cueIndex?: number;
  autoFocusFieldRef?: React.MutableRefObject<{ fieldType: string; cueIndex: number } | null>;
}

function EditableTextCell({ value, onUpdate, disabled = false, placeholder = '', fieldType, cueIndex, autoFocusFieldRef }: EditableTextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if this field should auto-focus after render (for arrow navigation)
  useEffect(() => {
    if (autoFocusFieldRef?.current && fieldType && cueIndex !== undefined) {
      const { fieldType: targetFieldType, cueIndex: targetCueIndex } = autoFocusFieldRef.current;
      if (targetFieldType === fieldType && targetCueIndex === cueIndex) {
        console.log('Auto-focusing field from ref', { fieldType, cueIndex });
        setIsEditing(true);
        autoFocusFieldRef.current = null; // Clear the ref after using it
      }
    }
  }, [autoFocusFieldRef, fieldType, cueIndex]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue) {
      onUpdate(trimmedValue);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const navigateToField = (direction: 'up' | 'down') => {
    if (!fieldType || cueIndex === undefined) {
      console.log('No fieldType or cueIndex', { fieldType, cueIndex });
      return;
    }

    console.log('Navigating', { direction, fieldType, currentIndex: cueIndex });

    // Calculate target field
    const targetIndex = direction === 'down' ? cueIndex + 1 : cueIndex - 1;

    // Store which field should auto-focus after the GraphQL refetch
    if (autoFocusFieldRef) {
      autoFocusFieldRef.current = {
        fieldType,
        cueIndex: targetIndex
      };
      console.log('Set autoFocusFieldRef to', autoFocusFieldRef.current);
    }

    // Save current field (this will trigger GraphQL mutation and refetch)
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      handleCancel();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      navigateToField('down');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      navigateToField('up');
    }
    // Tab key: let default behavior happen, onBlur will save
  };

  if (isEditing && !disabled) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-1 py-0 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={() => !disabled && setIsEditing(true)}
      onFocus={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      data-field-type={fieldType}
      data-cue-index={cueIndex}
      className={`text-left w-full ${disabled ? 'cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded cursor-pointer'}`}
    >
      {value}
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
  currentCueRef?: React.MutableRefObject<HTMLTableRowElement | HTMLDivElement | null>;
  autoFocusFieldRef?: React.MutableRefObject<{ fieldType: string; cueIndex: number } | null>;
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

  // Combine sortable ref and scroll ref
  const combinedRef = useCallback((node: HTMLTableRowElement | null) => {
    setNodeRef(node);
    // Only set ref if element is active AND visible (not hidden by CSS)
    if (props.currentCueRef && props.isActive && node && node.offsetParent !== null) {
      props.currentCueRef.current = node;
    }
  }, [setNodeRef, props.currentCueRef, props.isActive]);

  return (
    <CueRow
      {...props}
      ref={combinedRef}
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
  isDragging,
  autoFocusFieldRef
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

      <td className={`px-3 py-3 text-sm font-medium ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        <EditableTextCell
          value={cue.name}
          onUpdate={(value) => onUpdateCue({ ...cue, name: value })}
          disabled={!editMode}
          fieldType="name"
          cueIndex={index}
          autoFocusFieldRef={autoFocusFieldRef}
        />
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
          <div className="flex items-center space-x-2 relative">
            {/* Fade progress background for active cue */}
            {isActive && fadeProgress !== undefined && fadeProgress < 100 && (
              <div
                className="absolute inset-0 bg-green-600/20 dark:bg-green-400/20 transition-all duration-100 rounded"
                style={{ width: `${fadeProgress}%` }}
              />
            )}
            <button
              onClick={() => editMode && setShowSceneSelect(true)}
              disabled={!editMode}
              className={`relative z-10 ${editMode ? 'hover:underline' : ''}`}
            >
              {cue.scene.name}
            </button>
            {editMode && (
              <button
                onClick={() => onEditScene(cue.scene.id)}
                className="relative z-10 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
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
          fieldType="fadeIn"
          cueIndex={index}
          autoFocusFieldRef={autoFocusFieldRef}
        />
      </td>

      <td className={`px-3 py-3 text-sm ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        <EditableCell
          value={cue.fadeOutTime}
          onUpdate={(value) => onUpdateCue({ ...cue, fadeOutTime: value })}
          disabled={!editMode}
          fieldType="fadeOut"
          cueIndex={index}
          autoFocusFieldRef={autoFocusFieldRef}
        />
      </td>

      <td className={`px-3 py-3 text-sm ${textColorClass}`} onClick={(e) => e.stopPropagation()}>
        <EditableCell
          value={cue.followTime ?? 0}
          onUpdate={(value) => onUpdateCue({ ...cue, followTime: value >= 0 ? value : undefined })}
          disabled={!editMode}
          fieldType="follow"
          cueIndex={index}
          autoFocusFieldRef={autoFocusFieldRef}
        />
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center space-x-2">
          {isActive && (
            <span className="text-green-600 dark:text-green-400 font-medium text-sm">LIVE</span>
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

function SortableCueCard(props: SortableCueRowProps) {
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

  // Combine sortable ref and scroll ref
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    // Only set ref if element is active AND visible (not hidden by CSS)
    if (props.currentCueRef && props.isActive && node && node.offsetParent !== null) {
      props.currentCueRef.current = node;
    }
  }, [setNodeRef, props.currentCueRef, props.isActive]);

  return (
    <CueCard
      {...props}
      ref={combinedRef}
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
    />
  );
}

const CueCard = React.forwardRef<HTMLDivElement, SortableCueRowProps & {
  style?: React.CSSProperties;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
}>((props, ref) => {
  const {
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
    isDragging,
    autoFocusFieldRef,
  } = props;

  const [showSceneSelect, setShowSceneSelect] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState(cue.scene.id);

  let bgClass = 'bg-white dark:bg-gray-800';
  let textColorClass = 'text-gray-800 dark:text-gray-100';

  if (isDragging) {
    bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
  } else if (isActive) {
    bgClass = 'bg-green-50 dark:bg-green-900/40 border-green-500';
    textColorClass = 'text-gray-900 dark:text-white';
  } else if (isNext) {
    bgClass = 'bg-blue-50 dark:bg-blue-900/30 border-blue-500';
    textColorClass = 'text-gray-900 dark:text-white';
  } else if (isPrevious) {
    bgClass = 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700';
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
    <div
      ref={ref}
      style={style}
      className={`${bgClass} border-2 rounded-lg p-4 mb-3 ${textColorClass} ${!editMode ? 'cursor-pointer' : ''}`}
      onClick={handleRowClick}
    >
      {/* Line 1: Cue # + Name, Fade In, Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1">
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
          {editMode && (
            <button
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
          <span className="font-bold text-sm">{cue.cueNumber}</span>
          <div className="font-medium flex-1" onClick={(e) => e.stopPropagation()}>
            <EditableTextCell
              value={cue.name}
              onUpdate={(value) => onUpdateCue({ ...cue, name: value })}
              disabled={!editMode}
              fieldType="name"
              cueIndex={index}
              autoFocusFieldRef={autoFocusFieldRef}
            />
          </div>
        </div>
        <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
          <div className="text-sm text-right">
            <span className="text-gray-500 dark:text-gray-400">in: </span>
            <EditableCell
              value={cue.fadeInTime}
              onUpdate={(value) => onUpdateCue({ ...cue, fadeInTime: value })}
              disabled={!editMode}
              fieldType="fadeIn"
              cueIndex={index}
              autoFocusFieldRef={autoFocusFieldRef}
            />
          </div>
          {isActive && <span className="text-green-600 dark:text-green-400 font-bold text-xs">LIVE</span>}
          {isNext && !isActive && <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">NEXT</span>}
        </div>
      </div>

      {/* Line 2: Scene, Fade Out */}
      <div className="flex items-center justify-between mb-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-2 flex-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Scene:</span>
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
            <div className="flex items-center space-x-2 relative flex-1">
              {isActive && fadeProgress !== undefined && fadeProgress < 100 && (
                <div
                  className="absolute inset-0 bg-green-600/20 dark:bg-green-400/20 transition-all duration-100 rounded"
                  style={{ width: `${fadeProgress}%` }}
                />
              )}
              <button
                onClick={() => editMode && setShowSceneSelect(true)}
                disabled={!editMode}
                className={`relative z-10 text-sm ${editMode ? 'hover:underline' : ''}`}
              >
                {cue.scene.name}
              </button>
              {editMode && (
                <button
                  onClick={() => onEditScene(cue.scene.id)}
                  className="relative z-10 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Edit scene"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="text-sm text-right">
          <span className="text-gray-500 dark:text-gray-400">out: </span>
          <EditableCell
            value={cue.fadeOutTime}
            onUpdate={(value) => onUpdateCue({ ...cue, fadeOutTime: value })}
            disabled={!editMode}
            fieldType="fadeOut"
            cueIndex={index}
            autoFocusFieldRef={autoFocusFieldRef}
          />
        </div>
      </div>

      {/* Line 3: Follow time, GO button, Delete */}
      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1">
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
        <div className="flex items-center space-x-3">
          <div className="text-sm text-right">
            <span className="text-gray-500 dark:text-gray-400">follow: </span>
            <EditableCell
              value={cue.followTime ?? 0}
              onUpdate={(value) => onUpdateCue({ ...cue, followTime: value >= 0 ? value : undefined })}
              disabled={!editMode}
              fieldType="follow"
              cueIndex={index}
              autoFocusFieldRef={autoFocusFieldRef}
            />
          </div>
          {!editMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJumpToCue(cue, index);
              }}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm font-bold"
              title="Jump to this cue"
            >
              GO
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

CueCard.displayName = 'CueCard';

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
  const [cueListLoop, setCueListLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCueRef = useRef<HTMLDivElement | HTMLTableRowElement | null>(null);
  const autoFocusFieldRef = useRef<{ fieldType: string; cueIndex: number } | null>(null);

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
        setCueListLoop(data.cueList.loop || false);
      }
    },
  });

  const { data: scenesData } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId: cueListData?.cueList?.project?.id },
    skip: !cueListData?.cueList?.project?.id,
  });

  // Memoize refetch configuration to avoid recreating on every render
  const refetchPlaybackStatus = useMemo(() => [
    { query: GET_CUE_LIST_PLAYBACK_STATUS, variables: { cueListId } }
  ], [cueListId]);

  const [fadeToBlack] = useMutation(FADE_TO_BLACK, {
    onError: (error) => {
      setError(`Failed to fade to black: ${error.message}`);
    },
  });

  const [startCueList] = useMutation(START_CUE_LIST, {
    refetchQueries: refetchPlaybackStatus,
    onError: (error) => {
      setError(`Failed to start cue list: ${error.message}`);
    },
  });

  const [nextCueMutation] = useMutation(NEXT_CUE, {
    onError: (error) => {
      setError(`Failed to go to next cue: ${error.message}`);
    },
  });

  const [previousCueMutation] = useMutation(PREVIOUS_CUE, {
    onError: (error) => {
      setError(`Failed to go to previous cue: ${error.message}`);
    },
  });

  const [goToCue] = useMutation(GO_TO_CUE, {
    onError: (error) => {
      setError(`Failed to jump to cue: ${error.message}`);
    },
  });

  const [stopCueList] = useMutation(STOP_CUE_LIST, {
    onError: (error) => {
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

  // Calculate next cue with loop support
  const nextCue = useMemo(() => {
    if (currentCueIndex + 1 < cues.length) {
      return cues[currentCueIndex + 1];
    }
    // If on last cue and loop is enabled, next cue is the first cue
    if (cueList?.loop && cues.length > 0 && currentCueIndex === cues.length - 1) {
      return cues[0];
    }
    return null;
  }, [currentCueIndex, cues, cueList?.loop]);

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

  // Auto-scroll to current cue when it changes (only in play mode, not edit mode)
  useEffect(() => {
    if (!editMode && currentCueIndex >= 0) {
      // Use setTimeout to ensure DOM is ready, especially for mobile layout
      const scrollTimer = setTimeout(() => {
        if (currentCueRef.current && currentCueRef.current.isConnected && currentCueRef.current.offsetParent !== null) {
          // Request animation frame for smoother scrolling, especially on mobile
          requestAnimationFrame(() => {
            currentCueRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          });
        }
      }, 250); // Increased delay for mobile layouts

      return () => {
        clearTimeout(scrollTimer);
      };
    }
  }, [currentCueIndex, editMode]);


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

    // Early return if at the end of the list (unless loop is enabled)
    if (!cueList.loop && currentCueIndex + 1 >= cues.length) return;

    // When loop is enabled and at last cue, use first cue's fade time
    const isLooping = cueList.loop && currentCueIndex === cues.length - 1;
    const fadeInTime = isLooping ? cues[0]?.fadeInTime : cues[currentCueIndex + 1]?.fadeInTime;

    await nextCueMutation({
      variables: {
        cueListId: cueList.id,
        fadeInTime,
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
          followTime: cue.followTime ?? undefined,
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

  const handleUpdateCueList = (overridesOrEvent?: { loop?: boolean } | React.FocusEvent) => {
    if (!cueList) return;

    // Check if this is an overrides object (has a loop property) or an event
    const overrides = overridesOrEvent && 'loop' in overridesOrEvent ? overridesOrEvent : undefined;

    updateCueList({
      variables: {
        id: cueList.id,
        input: {
          name: cueListName,
          description: cueListDescription || undefined,
          loop: overrides?.loop !== undefined ? overrides.loop : cueListLoop,
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
    <div className="absolute inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Cue List Name and Buttons */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <input
                type="text"
                value={cueListName}
                onChange={(e) => setCueListName(e.target.value)}
                onBlur={handleUpdateCueList}
                className="text-xl md:text-2xl font-bold bg-transparent text-white border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={!editMode}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${
                    editMode
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  title={editMode ? 'Exit edit mode' : 'Enter edit mode'}
                >
                  {editMode ? 'EDITING' : 'EDIT MODE'}
                </button>
              </div>
            </div>
            {/* Description */}
            {cueListDescription && (
              <input
                type="text"
                value={cueListDescription}
                onChange={(e) => setCueListDescription(e.target.value)}
                onBlur={handleUpdateCueList}
                className="text-gray-400 mt-1 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none w-full text-sm md:text-base"
                disabled={!editMode}
              />
            )}
            {/* Loop checkbox */}
            {editMode && (
              <div className="mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cueListLoop}
                    onChange={(e) => {
                      const newLoopValue = e.target.checked;
                      setCueListLoop(newLoopValue);
                      // Update immediately with new value (don't wait for state update)
                      handleUpdateCueList({ loop: newLoopValue });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Loop cue list (restart from first cue after last cue finishes)
                  </span>
                </label>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 flex-shrink-0"
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
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    step="0.001"
                    placeholder="In"
                    value={newCue.fadeInTime}
                    onChange={(e) => setNewCue({ ...newCue, fadeInTime: e.target.value })}
                    className="rounded border-gray-600 bg-gray-700 text-white text-sm w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Out"
                    value={newCue.fadeOutTime}
                    onChange={(e) => setNewCue({ ...newCue, fadeOutTime: e.target.value })}
                    className="rounded border-gray-600 bg-gray-700 text-white text-sm w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
        {/* Mobile Card Layout */}
        <div className="lg:hidden">
          {cues.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No cues yet. {editMode ? 'Add your first cue to get started.' : 'Switch to edit mode to add cues.'}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={cueList.cues.map((cue: Cue) => cue.id)}
                strategy={verticalListSortingStrategy}
              >
                {cues.map((cue: Cue, index: number) => {
                  // Calculate isNext with loop support
                  const isLoopingToFirst = cueList?.loop && currentCueIndex === cues.length - 1 && index === 0;
                  const isNext = index === currentCueIndex + 1 || isLoopingToFirst;
                  const isActive = index === currentCueIndex;

                  return (
                    <SortableCueCard
                      key={cue.id}
                      cue={cue}
                      index={index}
                      isActive={isActive}
                      isNext={isNext}
                      isPrevious={index < currentCueIndex && !(isLoopingToFirst && index === 0)}
                      fadeProgress={isActive ? fadeProgress : undefined}
                      onJumpToCue={handleJumpToCue}
                      onUpdateCue={handleUpdateCue}
                      onDeleteCue={handleDeleteCue}
                      onEditScene={handleEditScene}
                      editMode={editMode}
                      scenes={scenes}
                      isSelected={selectedCueIds.has(cue.id)}
                      onSelect={handleSelectCue}
                      currentCueRef={currentCueRef}
                      autoFocusFieldRef={autoFocusFieldRef}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block bg-white dark:bg-gray-800/90 rounded-lg overflow-hidden shadow-lg">
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
                    cues.map((cue: Cue, index: number) => {
                      // Calculate isNext with loop support
                      const isLoopingToFirst = cueList?.loop && currentCueIndex === cues.length - 1 && index === 0;
                      const isNext = index === currentCueIndex + 1 || isLoopingToFirst;
                      const isActive = index === currentCueIndex;

                      return (
                        <SortableCueRow
                          key={cue.id}
                          cue={cue}
                          index={index}
                          isActive={isActive}
                          isNext={isNext}
                          isPrevious={index < currentCueIndex && !(isLoopingToFirst && index === 0)}
                          fadeProgress={isActive ? fadeProgress : undefined}
                          onJumpToCue={handleJumpToCue}
                          onUpdateCue={handleUpdateCue}
                          onDeleteCue={handleDeleteCue}
                          onEditScene={handleEditScene}
                          editMode={editMode}
                          scenes={scenes}
                          isSelected={selectedCueIds.has(cue.id)}
                          onSelect={handleSelectCue}
                          currentCueRef={currentCueRef}
                          autoFocusFieldRef={autoFocusFieldRef}
                        />
                      );
                    })
                  )}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        {/* Mobile/Compact Controls (always shown) */}
        <div className="flex items-center justify-center space-x-4">
          {/* Loop toggle button */}
          <button
            onClick={() => {
              const newLoopValue = !cueList.loop;
              setCueListLoop(newLoopValue);
              handleUpdateCueList({ loop: newLoopValue });
            }}
            className={`p-3 rounded-lg transition-colors ${
              cueList.loop
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={cueList.loop ? 'Loop enabled - Click to disable' : 'Loop disabled - Click to enable'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handlePrevious}
            disabled={currentCueIndex <= 0 || editMode}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous (←)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleGo}
            disabled={isPlaying || (!cueList?.loop && currentCueIndex >= cues.length - 1) || editMode}
            className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
            title="GO (Space/Enter)"
          >
            {currentCueIndex === -1 ? 'START' : 'GO'}
          </button>

          <button
            onClick={handleGo}
            disabled={isPlaying || (!cueList?.loop && currentCueIndex >= cues.length - 1) || editMode}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next (→)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleStop}
            disabled={editMode}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stop (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
          </button>
        </div>

        {/* Cue List Progress */}
        <div className="mt-4 flex items-center justify-center space-x-2 flex-wrap">
          {cues.map((cue: Cue, index: number) => (
            <button
              key={cue.id}
              onClick={() => handleJumpToCue(cue, index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentCueIndex
                  ? 'bg-green-500 w-3 h-3'
                  : index < currentCueIndex
                  ? 'bg-gray-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={`${cue.cueNumber}: ${cue.name}`}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="mt-3 text-center text-xs text-gray-500">
          {!editMode && 'Space/Enter = GO | ← → = Navigate | Esc = Stop'}
          {editMode && 'Edit mode active - Click values to edit'}
        </div>

        {/* Additional info on larger screens */}
        <div className="hidden md:flex justify-between items-center mt-3 text-sm text-gray-400">
          <div>
            Current: {currentCue ? `Cue ${currentCue.cueNumber} - ${currentCue.name}` : 'None'}
          </div>
          <div>
            Next: {nextCue ? `Cue ${nextCue.cueNumber} - ${nextCue.name}` : 'End of list'}
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