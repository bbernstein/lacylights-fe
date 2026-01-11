"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
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
  STOP_CUE_LIST,
  TOGGLE_CUE_SKIP,
} from "@/graphql/cueLists";
import {
  GET_PROJECT_SCENES,
  DUPLICATE_SCENE,
  ACTIVATE_SCENE,
} from "@/graphql/scenes";
import { Cue, Scene } from "@/types";
import { convertCueIndexForLocalState } from "@/utils/cueListHelpers";
import { shouldIgnoreKeyboardEvent } from "@/utils/keyboardUtils";
import BulkFadeUpdateModal from "./BulkFadeUpdateModal";
import AddCueDialog from "./AddCueDialog";
import { useCueListPlayback } from "@/hooks/useCueListPlayback";
import FadeProgressChart from "./FadeProgressChart";
import { EasingType } from "@/utils/easing";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import EditCueDialog from "./EditCueDialog";
import ContextMenu from "./ContextMenu";
import { PencilIcon } from "@heroicons/react/24/outline";
import { SkipIndicator } from "./SkipIndicator";

interface CueListUnifiedViewProps {
  cueListId: string;
  onClose: () => void;
  /** Callback invoked when the cue list data is loaded, providing the cue list name for parent components */
  onCueListLoaded?: (cueListName: string) => void;
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
  autoFocusFieldRef?: React.MutableRefObject<{
    fieldType: string;
    cueIndex: number;
  } | null>;
}

function EditableCell({
  value,
  onUpdate,
  disabled = false,
  suffix = "s",
  step = 0.001,
  min = 0,
  fieldType,
  cueIndex,
  autoFocusFieldRef,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if this field should auto-focus after render (for arrow navigation)
  // IMPORTANT: This intentionally runs on every render (no deps array) because:
  // 1. GraphQL refetch causes complete re-render with fresh data
  // 2. The ref persists across renders but doesn't trigger re-renders when changed
  // 3. We need to check on every render if THIS specific field instance should focus
  // 4. Adding deps would prevent it from running after refetch, breaking navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoFocusFieldRef?.current && fieldType && cueIndex !== undefined) {
      const { fieldType: targetFieldType, cueIndex: targetCueIndex } =
        autoFocusFieldRef.current;
      if (targetFieldType === fieldType && targetCueIndex === cueIndex) {
        setIsEditing(true);
        // Don't clear the ref here - wait until we actually focus
      }
    }
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();

      // Clear the ref now that we've actually entered edit mode
      if (autoFocusFieldRef?.current && fieldType && cueIndex !== undefined) {
        const { fieldType: targetFieldType, cueIndex: targetCueIndex } =
          autoFocusFieldRef.current;
        if (targetFieldType === fieldType && targetCueIndex === cueIndex) {
          autoFocusFieldRef.current = null;
        }
      }
    }
  }, [isEditing, autoFocusFieldRef, fieldType, cueIndex]);

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

  const navigateToField = (direction: "up" | "down") => {
    if (!fieldType || cueIndex === undefined) {
      return;
    }

    // Calculate target field
    const targetIndex = direction === "down" ? cueIndex + 1 : cueIndex - 1;

    // Store which field should auto-focus after the GraphQL refetch
    if (autoFocusFieldRef) {
      autoFocusFieldRef.current = {
        fieldType,
        cueIndex: targetIndex,
      };
    }

    // Save current field (this will trigger GraphQL mutation and refetch)
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleSave();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      handleCancel();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      navigateToField("down");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      navigateToField("up");
    }
    // Tab key: let default behavior happen, onBlur will save
  };

  return (
    <div className="inline-block w-14 min-w-14">
      {isEditing && !disabled ? (
        <input
          ref={inputRef}
          type="number"
          step={step}
          min={min}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-1 py-0 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button
          ref={buttonRef}
          onClick={() => !disabled && setIsEditing(true)}
          onFocus={() => !disabled && setIsEditing(true)}
          disabled={disabled}
          data-field-type={fieldType}
          data-cue-index={cueIndex}
          className={`text-left w-full ${disabled ? "cursor-default" : "hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded cursor-pointer"}`}
        >
          {value}
          {suffix}
        </button>
      )}
    </div>
  );
}

interface EditableTextCellProps {
  value: string;
  onUpdate: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  fieldType?: string;
  cueIndex?: number;
  autoFocusFieldRef?: React.MutableRefObject<{
    fieldType: string;
    cueIndex: number;
  } | null>;
}

function EditableTextCell({
  value,
  onUpdate,
  disabled = false,
  placeholder = "",
  fieldType,
  cueIndex,
  autoFocusFieldRef,
}: EditableTextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if this field should auto-focus after render (for arrow navigation)
  // IMPORTANT: This intentionally runs on every render (no deps array) because:
  // 1. GraphQL refetch causes complete re-render with fresh data
  // 2. The ref persists across renders but doesn't trigger re-renders when changed
  // 3. We need to check on every render if THIS specific field instance should focus
  // 4. Adding deps would prevent it from running after refetch, breaking navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoFocusFieldRef?.current && fieldType && cueIndex !== undefined) {
      const { fieldType: targetFieldType, cueIndex: targetCueIndex } =
        autoFocusFieldRef.current;
      if (targetFieldType === fieldType && targetCueIndex === cueIndex) {
        setIsEditing(true);
        // Don't clear the ref here - wait until we actually focus
      }
    }
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();

      // Clear the ref now that we've actually entered edit mode
      if (autoFocusFieldRef?.current && fieldType && cueIndex !== undefined) {
        const { fieldType: targetFieldType, cueIndex: targetCueIndex } =
          autoFocusFieldRef.current;
        if (targetFieldType === fieldType && targetCueIndex === cueIndex) {
          autoFocusFieldRef.current = null;
        }
      }
    }
  }, [isEditing, autoFocusFieldRef, fieldType, cueIndex]);

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

  const navigateToField = (direction: "up" | "down") => {
    if (!fieldType || cueIndex === undefined) {
      return;
    }

    // Calculate target field
    const targetIndex = direction === "down" ? cueIndex + 1 : cueIndex - 1;

    // Store which field should auto-focus after the GraphQL refetch
    if (autoFocusFieldRef) {
      autoFocusFieldRef.current = {
        fieldType,
        cueIndex: targetIndex,
      };
    }

    // Save current field (this will trigger GraphQL mutation and refetch)
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      handleSave();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      handleCancel();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      navigateToField("down");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      navigateToField("up");
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
      className={`text-left w-full ${disabled ? "cursor-default" : "hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded cursor-pointer"}`}
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
  currentCueRef?: React.MutableRefObject<
    HTMLTableRowElement | HTMLDivElement | null
  >;
  autoFocusFieldRef?: React.MutableRefObject<{
    fieldType: string;
    cueIndex: number;
  } | null>;
  highlightedCueNumber?: number | null;
  onContextMenu?: (e: React.MouseEvent, cue: Cue, index: number) => void;
  onTouchStart?: (e: React.TouchEvent, cue: Cue, index: number) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
  isInMoveMode?: boolean;
}

function SortableCueRow(props: SortableCueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.cue.id,
    disabled: !props.isInMoveMode && !props.editMode, // Only draggable in move mode or edit mode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine sortable ref and scroll ref
  const combinedRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      setNodeRef(node);
      // Only set ref if element is active AND visible (not hidden by CSS)
      if (
        props.currentCueRef &&
        props.isActive &&
        node &&
        node.offsetParent !== null
      ) {
        props.currentCueRef.current = node;
      }
    },
    [setNodeRef, props.currentCueRef, props.isActive],
  );

  return (
    <CueRow
      {...props}
      ref={combinedRef}
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
      highlightedCueNumber={props.highlightedCueNumber}
    />
  );
}

const CueRow = React.forwardRef<
  HTMLTableRowElement,
  SortableCueRowProps & {
    style?: React.CSSProperties;
    dragAttributes?: DraggableAttributes;
    dragListeners?: DraggableSyntheticListeners;
    isDragging?: boolean;
    highlightedCueNumber?: number | null;
  }
>(
  (
    {
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
      highlightedCueNumber,
      onContextMenu,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      isInMoveMode,
    },
    ref,
  ) => {
    const [showSceneSelect, setShowSceneSelect] = useState(false);
    const [selectedSceneId, setSelectedSceneId] = useState(cue.scene.id);

    const isHighlighted =
      highlightedCueNumber !== null && cue.cueNumber === highlightedCueNumber;

    let rowBgClass = "";
    let textColorClass = "text-gray-800 dark:text-gray-100";
    let borderClass = "";

    if (isActive) {
      rowBgClass = "bg-green-50 dark:bg-green-900/40";
      textColorClass = "text-gray-900 dark:text-white";
    } else if (isNext) {
      rowBgClass = "bg-blue-50 dark:bg-blue-900/30";
      textColorClass = "text-gray-900 dark:text-white";
    } else if (isPrevious) {
      rowBgClass = "bg-gray-50 dark:bg-gray-800/50";
    } else {
      rowBgClass = "bg-white dark:bg-gray-800";
    }

    if (isDragging) {
      rowBgClass = "bg-yellow-50 dark:bg-yellow-900/20";
    }

    if (isHighlighted) {
      borderClass = "border-l-4 border-yellow-500 animate-pulse";
    }

    // Skip styling - apply special styling for skipped cues
    let skipIndicator = null;
    let skipTextClass = "";
    if (cue.skip) {
      borderClass =
        borderClass || "border-l-4 border-gray-400 dark:border-gray-600";
      rowBgClass = "bg-gray-100 dark:bg-gray-800/30";
      textColorClass = "text-gray-400 dark:text-gray-500";
      skipTextClass = "line-through";
      skipIndicator = <SkipIndicator size="sm" className="ml-1" />;
    }

    const handleRowClick = () => {
      if (!editMode) {
        onJumpToCue(cue, index);
      }
    };

    const handleSceneChange = () => {
      onUpdateCue({
        ...cue,
        scene: scenes.find((s) => s.id === selectedSceneId) || cue.scene,
      });
      setShowSceneSelect(false);
    };

    return (
      <tr
        ref={ref}
        style={style}
        className={`${rowBgClass} ${borderClass} ${
          isInMoveMode ? "ring-2 ring-blue-500 animate-pulse" : ""
        } transition-colors duration-300 border-b border-gray-200 dark:border-gray-700 ${!editMode ? "cursor-pointer hover:bg-opacity-80" : ""}`}
        onClick={handleRowClick}
        onContextMenu={(e) => onContextMenu?.(e, cue, index)}
        onTouchStart={(e) => onTouchStart?.(e, cue, index)}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 mr-2 touch-none"
              {...dragAttributes}
              {...dragListeners}
              onClick={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9h8M8 15h8"
                />
              </svg>
            </button>
          )}
          <span
            className={`text-sm font-medium ${textColorClass} ${skipTextClass}`}
          >
            {cue.cueNumber}
          </span>
          {skipIndicator}
        </td>

        <td
          className={`px-3 py-3 text-sm font-medium ${textColorClass} ${skipTextClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <EditableTextCell
            value={cue.name}
            onUpdate={(value) => onUpdateCue({ ...cue, name: value })}
            disabled={!editMode}
            fieldType="name"
            cueIndex={index}
            autoFocusFieldRef={autoFocusFieldRef}
          />
        </td>

        <td
          className={`px-3 py-3 text-sm ${textColorClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {editMode && showSceneSelect ? (
            <div className="flex items-center space-x-1">
              <select
                value={selectedSceneId}
                onChange={(e) => setSelectedSceneId(e.target.value)}
                className="text-sm rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                {scenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSceneChange}
                className="text-green-600 hover:text-green-800 p-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedSceneId(cue.scene.id);
                  setShowSceneSelect(false);
                }}
                className="text-gray-600 hover:text-gray-800 p-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 relative">
              {/* Fade progress chart for active cue */}
              {isActive &&
                fadeProgress !== undefined &&
                fadeProgress > 0 &&
                fadeProgress < 100 &&
                !editMode && (
                  <div className="absolute inset-0 opacity-30 overflow-hidden rounded">
                    <FadeProgressChart
                      progress={fadeProgress}
                      easingType={
                        (cue.easingType as EasingType) || "EASE_IN_OUT_SINE"
                      }
                      className="w-full h-full"
                    />
                  </div>
                )}
              <button
                onClick={() => editMode && setShowSceneSelect(true)}
                disabled={!editMode}
                className={`relative z-10 ${editMode ? "hover:underline" : ""}`}
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

        <td
          className={`px-3 py-3 text-sm ${textColorClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <EditableCell
            value={cue.fadeInTime}
            onUpdate={(value) => onUpdateCue({ ...cue, fadeInTime: value })}
            disabled={!editMode}
            fieldType="fadeIn"
            cueIndex={index}
            autoFocusFieldRef={autoFocusFieldRef}
          />
        </td>

        <td
          className={`px-3 py-3 text-sm ${textColorClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <EditableCell
            value={cue.fadeOutTime}
            onUpdate={(value) => onUpdateCue({ ...cue, fadeOutTime: value })}
            disabled={!editMode}
            fieldType="fadeOut"
            cueIndex={index}
            autoFocusFieldRef={autoFocusFieldRef}
          />
        </td>

        <td
          className={`px-3 py-3 text-sm ${textColorClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <EditableCell
            value={cue.followTime ?? 0}
            onUpdate={(value) =>
              onUpdateCue({ ...cue, followTime: value > 0 ? value : undefined })
            }
            disabled={!editMode}
            fieldType="follow"
            cueIndex={index}
            autoFocusFieldRef={autoFocusFieldRef}
          />
        </td>

        <td className="px-3 py-3">
          <div className="flex items-center space-x-2">
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCue(cue);
                }}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete cue"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
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
  },
);

CueRow.displayName = "CueRow";

function SortableCueCard(props: SortableCueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.cue.id,
    disabled: !props.isInMoveMode && !props.editMode, // Only draggable in move mode or edit mode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine sortable ref and scroll ref
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      // Only set ref if element is active AND visible (not hidden by CSS)
      if (
        props.currentCueRef &&
        props.isActive &&
        node &&
        node.offsetParent !== null
      ) {
        props.currentCueRef.current = node;
      }
    },
    [setNodeRef, props.currentCueRef, props.isActive],
  );

  return (
    <CueCard
      {...props}
      ref={combinedRef}
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
      highlightedCueNumber={props.highlightedCueNumber}
    />
  );
}

const CueCard = React.forwardRef<
  HTMLDivElement,
  SortableCueRowProps & {
    style?: React.CSSProperties;
    dragAttributes?: DraggableAttributes;
    dragListeners?: DraggableSyntheticListeners;
    isDragging?: boolean;
    highlightedCueNumber?: number | null;
  }
>((props, ref) => {
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
    highlightedCueNumber,
    onContextMenu,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isInMoveMode,
  } = props;

  const [showSceneSelect, setShowSceneSelect] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState(cue.scene.id);

  const isHighlighted =
    highlightedCueNumber !== null && cue.cueNumber === highlightedCueNumber;

  let bgClass = "bg-white dark:bg-gray-800";
  let textColorClass = "text-gray-800 dark:text-gray-100";
  let borderClass = "border-2";

  if (isDragging) {
    bgClass = "bg-yellow-50 dark:bg-yellow-900/20";
  } else if (isActive) {
    bgClass = "bg-green-50 dark:bg-green-900/40";
    borderClass = "border-2 border-green-500";
    textColorClass = "text-gray-900 dark:text-white";
  } else if (isNext) {
    bgClass = "bg-blue-50 dark:bg-blue-900/30";
    borderClass = "border-2 border-blue-500";
    textColorClass = "text-gray-900 dark:text-white";
  } else if (isPrevious) {
    bgClass = "bg-gray-50 dark:bg-gray-800/50";
    borderClass = "border-2 border-gray-300 dark:border-gray-700";
  }

  if (isHighlighted) {
    borderClass = "border-4 border-yellow-500 animate-pulse";
  }

  // Skip styling - apply special styling for skipped cues
  let skipIndicator = null;
  let skipTextClass = "";
  if (cue.skip) {
    borderClass = borderClass.includes("border-yellow")
      ? borderClass
      : "border-2 border-gray-400 dark:border-gray-600";
    bgClass = "bg-gray-100 dark:bg-gray-800/30";
    textColorClass = "text-gray-400 dark:text-gray-500";
    skipTextClass = "line-through";
    skipIndicator = <SkipIndicator size="sm" className="ml-1" />;
  }

  const handleRowClick = () => {
    if (!editMode) {
      onJumpToCue(cue, index);
    }
  };

  const handleSceneChange = () => {
    onUpdateCue({
      ...cue,
      scene: scenes.find((s) => s.id === selectedSceneId) || cue.scene,
    });
    setShowSceneSelect(false);
  };

  return (
    <div
      ref={ref}
      style={style}
      className={`${bgClass} ${borderClass} ${
        isInMoveMode ? "ring-2 ring-blue-500 animate-pulse" : ""
      } rounded-lg p-4 mb-3 ${textColorClass} ${!editMode ? "cursor-pointer" : ""} select-none`}
      onClick={handleRowClick}
      onContextMenu={(e) => onContextMenu?.(e, cue, index)}
      onTouchStart={(e) => onTouchStart?.(e, cue, index)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 touch-none"
              {...dragAttributes}
              {...dragListeners}
              onClick={(e) => e.stopPropagation()}
              title="Drag to reorder"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9h8M8 15h8"
                />
              </svg>
            </button>
          )}
          <span className={`font-bold text-sm ${skipTextClass}`}>
            {cue.cueNumber}
          </span>
          {skipIndicator}
          <div
            className={`font-medium flex-1 ${skipTextClass}`}
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="flex items-center space-x-3"
          onClick={(e) => e.stopPropagation()}
        >
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
        </div>
      </div>

      {/* Line 2: Scene, Fade Out */}
      <div
        className="flex items-center justify-between mb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2 flex-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Scene:
          </span>
          {editMode && showSceneSelect ? (
            <div className="flex items-center space-x-1">
              <select
                value={selectedSceneId}
                onChange={(e) => setSelectedSceneId(e.target.value)}
                className="text-sm rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                {scenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSceneChange}
                className="text-green-600 hover:text-green-800 p-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedSceneId(cue.scene.id);
                  setShowSceneSelect(false);
                }}
                className="text-gray-600 hover:text-gray-800 p-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 relative flex-1">
              {isActive &&
                fadeProgress !== undefined &&
                fadeProgress > 0 &&
                fadeProgress < 100 &&
                !editMode && (
                  <div className="absolute inset-0 opacity-30 overflow-hidden rounded">
                    <FadeProgressChart
                      progress={fadeProgress}
                      easingType={
                        (cue.easingType as EasingType) || "EASE_IN_OUT_SINE"
                      }
                      className="w-full h-full"
                    />
                  </div>
                )}
              <button
                onClick={() => editMode && setShowSceneSelect(true)}
                disabled={!editMode}
                className={`relative z-10 text-sm ${editMode ? "hover:underline" : ""}`}
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
      <div
        className="flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-right">
            <span className="text-gray-500 dark:text-gray-400">follow: </span>
            <EditableCell
              value={cue.followTime ?? 0}
              onUpdate={(value) =>
                onUpdateCue({
                  ...cue,
                  followTime: value > 0 ? value : undefined,
                })
              }
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

CueCard.displayName = "CueCard";

export default function CueListUnifiedView({
  cueListId,
  onClose,
  onCueListLoaded,
}: CueListUnifiedViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = true; // Always in edit mode - use CueListPlayer for playing

  // Real-time playback synchronization
  const { playbackStatus } = useCueListPlayback(cueListId);

  // Get current state from subscription data only
  const currentCueIndex = convertCueIndexForLocalState(
    playbackStatus?.currentCueIndex,
  );
  const isPlaying = playbackStatus?.isPlaying || false;
  const fadeProgress = playbackStatus?.fadeProgress ?? 0;

  const [selectedCueIds, setSelectedCueIds] = useState<Set<string>>(new Set());
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showAddCue, setShowAddCue] = useState(false);
  const [showAddCueDialog, setShowAddCueDialog] = useState(false);
  const [cueListName, setCueListName] = useState("");
  const [cueListDescription, setCueListDescription] = useState("");
  const [cueListLoop, setCueListLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedCueNumber, setHighlightedCueNumber] = useState<
    number | null
  >(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cue: Cue;
    cueIndex: number;
  } | null>(null);
  const [moveModeCueId, setMoveModeCueId] = useState<string | null>(null);
  const [showEditCueDialog, setShowEditCueDialog] = useState(false);
  const [editingCue, setEditingCue] = useState<Cue | null>(null);

  const followTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCueRef = useRef<HTMLDivElement | HTMLTableRowElement | null>(
    null,
  );
  const autoFocusFieldRef = useRef<{
    fieldType: string;
    cueIndex: number;
  } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const [newCue, setNewCue] = useState({
    name: "",
    cueNumber: "1",
    sceneId: "",
    fadeInTime: "3",
    fadeOutTime: "3",
    followTime: "0",
    notes: "",
  });

  const {
    data: cueListData,
    loading,
    refetch,
  } = useQuery(GET_CUE_LIST, {
    variables: { id: cueListId },
    onCompleted: (data) => {
      if (data.cueList) {
        setCueListName(data.cueList.name);
        setCueListDescription(data.cueList.description || "");
        setCueListLoop(data.cueList.loop || false);
        // Notify parent component of the cue list name
        onCueListLoaded?.(data.cueList.name);
      }
    },
  });

  const { data: scenesData } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId: cueListData?.cueList?.project?.id },
    skip: !cueListData?.cueList?.project?.id,
  });

  // Memoize refetch configuration to avoid recreating on every render
  const refetchPlaybackStatus = useMemo(
    () => [{ query: GET_CUE_LIST_PLAYBACK_STATUS, variables: { cueListId } }],
    [cueListId],
  );

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
        name: "",
        cueNumber: "1",
        sceneId: "",
        fadeInTime: "3",
        fadeOutTime: "3",
        followTime: "0",
        notes: "",
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

  const [toggleCueSkip] = useMutation(TOGGLE_CUE_SKIP, {
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

  const [duplicateScene] = useMutation(DUPLICATE_SCENE, {
    onError: (error) => {
      setError(`Failed to duplicate scene: ${error.message}`);
    },
  });

  const [activateScene] = useMutation(ACTIVATE_SCENE, {
    onError: (error) => {
      setError(`Failed to activate scene: ${error.message}`);
    },
  });

  const cueList = cueListData?.cueList;
  const cues = useMemo(() => cueList?.cues || [], [cueList?.cues]);
  const scenes = scenesData?.project?.scenes || [];
  const currentCue =
    currentCueIndex >= 0 && currentCueIndex < cues.length
      ? cues[currentCueIndex]
      : null;

  // Calculate next cue with loop support
  const nextCue = useMemo(() => {
    if (currentCueIndex + 1 < cues.length) {
      return cues[currentCueIndex + 1];
    }
    // If on last cue and loop is enabled, next cue is the first cue
    if (
      cueList?.loop &&
      cues.length > 0 &&
      currentCueIndex === cues.length - 1
    ) {
      return cues[0];
    }
    return null;
  }, [currentCueIndex, cues, cueList?.loop]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay before activating
        tolerance: 5, // Allow 5px of movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
        if (
          currentCueRef.current &&
          currentCueRef.current.isConnected &&
          currentCueRef.current.offsetParent !== null
        ) {
          // Request animation frame for smoother scrolling, especially on mobile
          requestAnimationFrame(() => {
            currentCueRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          });
        }
      }, 250); // Increased delay for mobile layouts

      return () => {
        clearTimeout(scrollTimer);
      };
    }
  }, [currentCueIndex, editMode]);

  // Handle highlight flash effect when returning from scene editor
  useEffect(() => {
    const highlightCue = searchParams.get("highlightCue");
    if (highlightCue) {
      const cueNumber = parseFloat(highlightCue);
      setHighlightedCueNumber(cueNumber);

      // Clear highlight after 2 seconds
      const timer = setTimeout(() => {
        setHighlightedCueNumber(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Exit move mode when clicking outside
  useEffect(() => {
    if (!moveModeCueId) return;

    const handleClickOutside = (_e: MouseEvent) => {
      setMoveModeCueId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [moveModeCueId]);

  const handleJumpToCue = useCallback(
    async (cue: Cue, index: number) => {
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
    },
    [goToCue, cues, cueList],
  );

  // Context menu handlers
  const handleCueContextMenu = useCallback(
    (e: React.MouseEvent, cue: Cue, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        cue,
        cueIndex: index,
      });
    },
    [],
  );

  const startLongPressDetection = useCallback(
    (x: number, y: number, cue: Cue, index: number) => {
      touchStart.current = { x, y };
      longPressTimer.current = window.setTimeout(() => {
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
        setContextMenu({ x, y, cue, cueIndex: index });
      }, 500);
    },
    [],
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStart.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, cue: Cue, index: number) => {
      const touch = e.touches[0];
      // Prevent text selection during long-press detection
      e.preventDefault();
      startLongPressDetection(touch.clientX, touch.clientY, cue, index);
    },
    [startLongPressDetection],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStart.current.x);
      const dy = Math.abs(touch.clientY - touchStart.current.y);
      if (dx > 10 || dy > 10) {
        cancelLongPress();
      }
    },
    [cancelLongPress],
  );

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  const handleEditCue = useCallback(() => {
    if (!contextMenu) return;
    setEditingCue(contextMenu.cue);
    setShowEditCueDialog(true);
    setContextMenu(null);
  }, [contextMenu]);

  const handleContextMenuEditScene = useCallback(
    async (cue: Cue) => {
      await activateScene({
        variables: { sceneId: cue.scene.id },
      });
      router.push(
        `/scenes/${cue.scene.id}/edit?mode=layout&fromPlayer=true&cueListId=${cueListId}`,
      );
      setContextMenu(null);
    },
    [activateScene, router, cueListId],
  );

  const handleDuplicateCue = useCallback(async () => {
    if (!contextMenu || !cueList) return;
    const { cue } = contextMenu;

    try {
      const duplicateResult = await duplicateScene({
        variables: { id: cue.scene.id },
      });
      const newSceneId = duplicateResult.data?.duplicateScene?.id;

      const newCueNumber = cue.cueNumber + 0.1;
      await createCue({
        variables: {
          input: {
            cueNumber: newCueNumber,
            name: `${cue.name} (copy)`,
            cueListId: cueList.id,
            sceneId: newSceneId || cue.scene.id,
            fadeInTime: cue.fadeInTime,
            fadeOutTime: cue.fadeOutTime,
            followTime: cue.followTime,
          },
        },
        refetchQueries: [
          { query: GET_CUE_LIST, variables: { id: cueList.id } },
        ],
      });
    } catch (error) {
      console.error("Failed to duplicate cue:", error);
    }
    setContextMenu(null);
  }, [contextMenu, cueList, duplicateScene, createCue]);

  const handleContextMenuDeleteCue = useCallback(() => {
    if (!contextMenu) return;
    const { cue } = contextMenu;

    if (window.confirm(`Delete cue "${cue.name}"?`)) {
      deleteCue({ variables: { id: cue.id } });
    }
    setContextMenu(null);
  }, [contextMenu, deleteCue]);

  const handleMoveCue = useCallback(() => {
    if (!contextMenu) return;
    setMoveModeCueId(contextMenu.cue.id);
    setContextMenu(null);
  }, [contextMenu]);

  const handleToggleCueSkip = useCallback(() => {
    if (!contextMenu) return;
    toggleCueSkip({ variables: { cueId: contextMenu.cue.id } });
    setContextMenu(null);
  }, [contextMenu, toggleCueSkip]);

  const handleAddCueFromContextMenu = useCallback(() => {
    if (!contextMenu) return;
    const { cue } = contextMenu;

    // Set default values from the selected cue
    setNewCue({
      name: `Cue ${Math.floor(cue.cueNumber + 0.5)}`,
      cueNumber: (cue.cueNumber + 0.5).toString(),
      sceneId: cue.scene.id,
      fadeInTime: cue.fadeInTime.toString(),
      fadeOutTime: cue.fadeOutTime.toString(),
      followTime: cue.followTime?.toString() || "0",
      notes: "",
    });

    // Open the add cue dialog
    setShowAddCueDialog(true);
    setContextMenu(null);
  }, [contextMenu]);

  const handleEditCueDialogUpdate = useCallback(
    async (params: {
      cueId: string;
      cueNumber?: number;
      name?: string;
      sceneId?: string;
      fadeInTime?: number;
      fadeOutTime?: number;
      followTime?: number;
      action: "edit-scene" | "stay";
    }) => {
      try {
        await updateCue({
          variables: {
            id: params.cueId,
            input: {
              name: params.name,
              cueNumber: params.cueNumber,
              cueListId: cueList?.id,
              sceneId: params.sceneId,
              fadeInTime: params.fadeInTime,
              fadeOutTime: params.fadeOutTime,
              followTime: params.followTime,
            },
          },
          refetchQueries: [
            { query: GET_CUE_LIST, variables: { id: cueListId } },
          ],
        });

        if (params.action === "edit-scene" && params.sceneId) {
          await activateScene({
            variables: { sceneId: params.sceneId },
          });
          router.push(
            `/scenes/${params.sceneId}/edit?mode=layout&fromPlayer=true&cueListId=${cueListId}`,
          );
        }

        setShowEditCueDialog(false);
        setEditingCue(null);
      } catch (error) {
        console.error("Failed to update cue:", error);
      }
    },
    [cueList, cueListId, updateCue, activateScene, router],
  );

  const handleNext = useCallback(async () => {
    if (!cueList) return;

    // Early return if at the end of the list (unless loop is enabled)
    if (!cueList.loop && currentCueIndex + 1 >= cues.length) return;

    // When loop is enabled and at last cue, use first cue's fade time
    const isLooping = cueList.loop && currentCueIndex === cues.length - 1;
    const fadeInTime = isLooping
      ? cues[0]?.fadeInTime
      : cues[currentCueIndex + 1]?.fadeInTime;

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

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Ignore keyboard events when user is typing in input fields
      if (shouldIgnoreKeyboardEvent(e)) {
        return;
      }

      if (!editMode) {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          handleGo();
        } else if (e.key === "Escape") {
          handleStop();
        } else if (e.key === "ArrowLeft") {
          handlePrevious();
        } else if (e.key === "ArrowRight") {
          handleNext();
        }
      }
    },
    [editMode, handleGo, handleStop, handlePrevious, handleNext],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
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

    // Clear move mode after drag completes
    setMoveModeCueId(null);

    if (active.id !== over?.id && cueList) {
      const oldIndex = cueList.cues.findIndex(
        (cue: Cue) => cue.id === active.id,
      );
      const newIndex = cueList.cues.findIndex(
        (cue: Cue) => cue.id === over?.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedCues = arrayMove(cueList.cues, oldIndex, newIndex);
        const cueOrders = (reorderedCues as Cue[]).map(
          (cue: Cue, index: number) => ({
            cueId: cue.id,
            cueNumber: index + 1,
          }),
        );

        reorderCues({
          variables: {
            cueListId: cueList.id,
            cueOrders,
          },
        });
      }
    }
  };

  const handleRenumberCues = useCallback(() => {
    if (!cueList) return;

    // Confirm with user
    if (
      !window.confirm(
        "Renumber all cues to sequential whole numbers (1, 2, 3, ...)?\n\nThis will maintain the current order but remove decimal cue numbers.",
      )
    ) {
      return;
    }

    // Sort cues by current cue number and assign sequential numbers
    const sortedCues = [...cueList.cues].sort(
      (a: Cue, b: Cue) => a.cueNumber - b.cueNumber,
    );
    const cueOrders = sortedCues.map((cue: Cue, index: number) => ({
      cueId: cue.id,
      cueNumber: index + 1,
    }));

    reorderCues({
      variables: {
        cueListId: cueList.id,
        cueOrders,
      },
    });
  }, [cueList, reorderCues]);

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
          followTime:
            newCue.followTime === "" || newCue.followTime == null
              ? undefined
              : parseFloat(newCue.followTime),
          notes: newCue.notes || undefined,
        },
      },
    });
  };

  const handleAddCueFromDialog = useCallback(
    async (params: {
      cueNumber: number;
      name: string;
      sceneId: string;
      createCopy: boolean;
      fadeInTime: number;
      fadeOutTime: number;
      followTime?: number;
      action: "edit" | "stay";
    }) => {
      if (!cueList) return;

      try {
        // Duplicate scene if requested
        let targetSceneId = params.sceneId;
        if (params.createCopy) {
          const duplicateResult = await duplicateScene({
            variables: { id: params.sceneId },
          });
          targetSceneId =
            duplicateResult.data?.duplicateScene?.id || params.sceneId;
        }

        // Create the cue
        await createCue({
          variables: {
            input: {
              cueNumber: params.cueNumber,
              name: params.name,
              cueListId: cueList.id,
              sceneId: targetSceneId,
              fadeInTime: params.fadeInTime,
              fadeOutTime: params.fadeOutTime,
              followTime: params.followTime,
            },
          },
          refetchQueries: [
            { query: GET_CUE_LIST, variables: { id: cueList.id } },
          ],
        });

        if (params.action === "edit" && targetSceneId) {
          // Activate the scene before navigation to prevent blackout
          await activateScene({
            variables: { sceneId: targetSceneId },
          });

          // Navigate to scene editor in layout mode
          router.push(
            `/scenes/${targetSceneId}/edit?mode=layout&fromPlayer=true&cueListId=${cueList.id}&returnCueNumber=${params.cueNumber}`,
          );
        }

        // Close the dialog
        setShowAddCueDialog(false);
      } catch (error) {
        console.error("Failed to add cue:", error);
      }
    },
    [cueList, createCue, duplicateScene, activateScene, router],
  );

  const handleUpdateCueList = (
    overridesOrEvent?: { loop?: boolean } | React.FocusEvent,
  ) => {
    if (!cueList) return;

    // Check if this is an overrides object (has a loop property) or an event
    const overrides =
      overridesOrEvent && "loop" in overridesOrEvent
        ? overridesOrEvent
        : undefined;

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
    setSelectedCueIds((prev) => {
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
    const maxCueNumber = Math.max(
      0,
      ...cueList.cues.map((c: Cue) => c.cueNumber),
    );
    return maxCueNumber + 1;
  }, [cueList?.cues]);

  useEffect(() => {
    if (showAddCue) {
      setNewCue((prev) => ({
        ...prev,
        cueNumber: getNextCueNumber().toString(),
      }));
    }
  }, [showAddCue, getNextCueNumber]);

  const selectedCues =
    cueList?.cues.filter((cue: Cue) => selectedCueIds.has(cue.id)) || [];

  const handleEditScene = (sceneId: string) => {
    router.push(`/scenes/${sceneId}/edit?mode=layout`);
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
              <div className="px-3 py-1 rounded text-sm font-medium whitespace-nowrap bg-yellow-600 text-white">
                EDITING
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
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 flex-shrink-0"
            title="Close unified view"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
              <span className="text-sm text-gray-400">{cues.length} cues</span>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddCueDialog(true)}
                className="px-3 py-1 text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700"
              >
                Add Cue
              </button>
              <button
                onClick={() => setShowAddCue(!showAddCue)}
                className="px-3 py-1 text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                {showAddCue ? "Cancel" : "Quick Add"}
              </button>
              <button
                onClick={handleRenumberCues}
                className="px-3 py-1 text-sm font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                title="Renumber all cues to sequential whole numbers while maintaining order"
              >
                Renumber
              </button>
            </div>
          </div>

          {showAddCue && (
            <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 w-full">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Cue #"
                  value={newCue.cueNumber}
                  onChange={(e) =>
                    setNewCue({ ...newCue, cueNumber: e.target.value })
                  }
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <input
                  type="text"
                  placeholder="Cue name"
                  value={newCue.name}
                  onChange={(e) =>
                    setNewCue({ ...newCue, name: e.target.value })
                  }
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm md:col-span-2 min-w-0"
                />
                <select
                  value={newCue.sceneId}
                  onChange={(e) =>
                    setNewCue({ ...newCue, sceneId: e.target.value })
                  }
                  className="rounded border-gray-600 bg-gray-700 text-white text-sm min-w-0"
                >
                  <option value="">Select scene...</option>
                  {scenes.map((scene: Scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-1 min-w-0">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="In"
                    value={newCue.fadeInTime}
                    onChange={(e) =>
                      setNewCue({ ...newCue, fadeInTime: e.target.value })
                    }
                    className="rounded border-gray-600 bg-gray-700 text-white text-sm w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Out"
                    value={newCue.fadeOutTime}
                    onChange={(e) =>
                      setNewCue({ ...newCue, fadeOutTime: e.target.value })
                    }
                    className="rounded border-gray-600 bg-gray-700 text-white text-sm w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <button
                  onClick={handleAddCue}
                  disabled={!newCue.name || !newCue.sceneId}
                  className="px-3 py-1 text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 min-w-0"
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
                No cues yet.{" "}
                {editMode
                  ? "Add your first cue to get started."
                  : "Switch to edit mode to add cues."}
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
                  const isLoopingToFirst =
                    cueList?.loop &&
                    currentCueIndex === cues.length - 1 &&
                    index === 0;
                  const isNext =
                    index === currentCueIndex + 1 || isLoopingToFirst;
                  const isActive = index === currentCueIndex;

                  return (
                    <SortableCueCard
                      key={cue.id}
                      cue={cue}
                      index={index}
                      isActive={isActive}
                      isNext={isNext}
                      isPrevious={
                        index < currentCueIndex &&
                        !(isLoopingToFirst && index === 0)
                      }
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
                      highlightedCueNumber={highlightedCueNumber}
                      onContextMenu={handleCueContextMenu}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      isInMoveMode={moveModeCueId === cue.id}
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
                        checked={
                          selectedCueIds.size > 0 &&
                          selectedCueIds.size === cueList.cues.length
                        }
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
                    {!editMode && "Jump"}
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
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No cues yet.{" "}
                        {editMode
                          ? "Add your first cue to get started."
                          : "Switch to edit mode to add cues."}
                      </td>
                    </tr>
                  ) : (
                    cues.map((cue: Cue, index: number) => {
                      // Calculate isNext with loop support
                      const isLoopingToFirst =
                        cueList?.loop &&
                        currentCueIndex === cues.length - 1 &&
                        index === 0;
                      const isNext =
                        index === currentCueIndex + 1 || isLoopingToFirst;
                      const isActive = index === currentCueIndex;

                      return (
                        <SortableCueRow
                          key={cue.id}
                          cue={cue}
                          index={index}
                          isActive={isActive}
                          isNext={isNext}
                          isPrevious={
                            index < currentCueIndex &&
                            !(isLoopingToFirst && index === 0)
                          }
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
                          highlightedCueNumber={highlightedCueNumber}
                          onContextMenu={handleCueContextMenu}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          isInMoveMode={moveModeCueId === cue.id}
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

      {/* Control Panel - with bottom padding for mobile nav bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 pb-20 md:pb-4">
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
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
            title={
              cueList.loop
                ? "Loop enabled - Click to disable"
                : "Loop disabled - Click to enable"
            }
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            onClick={handlePrevious}
            disabled={currentCueIndex <= 0 || editMode}
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous (←)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={handleGo}
            disabled={
              isPlaying ||
              (!cueList?.loop && currentCueIndex >= cues.length - 1) ||
              editMode
            }
            className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
            title="GO (Space/Enter)"
          >
            {currentCueIndex === -1 ? "START" : "GO"}
          </button>

          <button
            onClick={handleNext}
            disabled={
              isPlaying ||
              (!cueList?.loop && currentCueIndex >= cues.length - 1) ||
              editMode
            }
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next (→)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={handleStop}
            disabled={editMode}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stop (Esc)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10h6v4H9z"
              />
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
                  ? "bg-green-500 w-3 h-3"
                  : index < currentCueIndex
                    ? "bg-gray-600"
                    : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={`${cue.cueNumber}: ${cue.name}`}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="mt-3 text-center text-xs text-gray-500">
          {!editMode && "Space/Enter = GO | ← → = Navigate | Esc = Stop"}
          {editMode && "Edit mode active - Click values to edit"}
        </div>

        {/* Additional info on larger screens */}
        <div className="hidden md:flex justify-between items-center mt-3 text-sm text-gray-400">
          <div>
            Current:{" "}
            {currentCue
              ? `Cue ${currentCue.cueNumber} - ${currentCue.name}`
              : "None"}
          </div>
          <div>
            Next:{" "}
            {nextCue
              ? `Cue ${nextCue.cueNumber} - ${nextCue.name}`
              : "End of list"}
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

      {/* Add Cue Dialog */}
      <AddCueDialog
        isOpen={showAddCueDialog}
        onClose={() => setShowAddCueDialog(false)}
        cueListId={cueListId}
        currentCueNumber={
          currentCueIndex >= 0 ? cues[currentCueIndex]?.cueNumber || 0 : 0
        }
        currentSceneId={currentCue?.scene.id || null}
        scenes={scenes}
        defaultFadeInTime={cueList?.defaultFadeInTime || 3}
        defaultFadeOutTime={cueList?.defaultFadeOutTime || 3}
        onAdd={handleAddCueFromDialog}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[
            {
              label: "Edit Cue",
              onClick: handleEditCue,
              icon: <PencilIcon className="w-4 h-4" />,
            },
            {
              label: "Edit Scene",
              onClick: () => handleContextMenuEditScene(contextMenu.cue),
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              ),
            },
            {
              label: "Duplicate Cue",
              onClick: handleDuplicateCue,
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              ),
            },
            {
              label: "Add Cue",
              onClick: handleAddCueFromContextMenu,
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              ),
            },
            {
              label: "Move Cue",
              onClick: handleMoveCue,
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              ),
            },
            {
              label: contextMenu.cue.skip ? "Unskip Cue" : "Skip Cue",
              onClick: handleToggleCueSkip,
              icon: contextMenu.cue.skip ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              ),
            },
            {
              label: "Delete Cue",
              onClick: handleContextMenuDeleteCue,
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              ),
              className:
                "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300",
            },
          ]}
          onDismiss={() => setContextMenu(null)}
        />
      )}

      {/* Edit Cue Dialog */}
      {showEditCueDialog && editingCue && (
        <EditCueDialog
          isOpen={showEditCueDialog}
          onClose={() => {
            setShowEditCueDialog(false);
            setEditingCue(null);
          }}
          cue={editingCue}
          scenes={scenes}
          onUpdate={handleEditCueDialogUpdate}
        />
      )}
    </div>
  );
}
