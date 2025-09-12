'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CUE_LIST, UPDATE_CUE_LIST, CREATE_CUE, UPDATE_CUE, DELETE_CUE, REORDER_CUES } from '@/graphql/cueLists';
import { GET_PROJECT_SCENES } from '@/graphql/scenes';
import { Cue, Scene } from '@/types';
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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CueListEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cueListId: string | null;
  onCueListUpdated: () => void;
  onRunCueList?: (cueListId: string) => void;
}

interface CueRowProps {
  cue: Cue;
  scenes: Scene[];
  onUpdate: (cue: Cue) => void;
  onDelete: (cue: Cue) => void;
  isDragging?: boolean;
}

function SortableCueRow({ cue, scenes, onUpdate, onDelete }: CueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <CueRow
      ref={setNodeRef}
      style={style}
      cue={cue}
      scenes={scenes}
      onUpdate={onUpdate}
      onDelete={onDelete}
      isDragging={isDragging}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
}

interface CueRowInternalProps extends CueRowProps {
  style?: React.CSSProperties;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}

const CueRow = React.forwardRef<HTMLTableRowElement, CueRowInternalProps>(
  ({ cue, scenes, onUpdate, onDelete, isDragging, style, dragAttributes, dragListeners }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: cue.name,
    cueNumber: cue.cueNumber.toString(),
    sceneId: cue.scene.id,
    fadeInTime: cue.fadeInTime.toString(),
    fadeOutTime: cue.fadeOutTime.toString(),
    followTime: (cue.followTime || 0).toString(),
    notes: cue.notes || '',
  });

  const handleSave = () => {
    onUpdate({
      ...cue,
      name: editData.name,
      cueNumber: parseFloat(editData.cueNumber) || 0,
      scene: scenes.find(s => s.id === editData.sceneId) || cue.scene,
      fadeInTime: parseFloat(editData.fadeInTime) || 0,
      fadeOutTime: parseFloat(editData.fadeOutTime) || 0,
      followTime: parseFloat(editData.followTime) || undefined,
      notes: editData.notes || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: cue.name,
      cueNumber: cue.cueNumber.toString(),
      sceneId: cue.scene.id,
      fadeInTime: cue.fadeInTime.toString(),
      fadeOutTime: cue.fadeOutTime.toString(),
      followTime: (cue.followTime || 0).toString(),
      notes: cue.notes || '',
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr ref={ref} style={style} className="bg-blue-50 dark:bg-blue-900/20">
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <button
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              {...dragAttributes}
              {...dragListeners}
              title="Drag to reorder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
              </svg>
            </button>
            <input
              type="number"
              step="0.1"
              min="0"
              value={editData.cueNumber}
              onChange={(e) => setEditData({ ...editData, cueNumber: e.target.value })}
              className="w-16 rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={editData.sceneId}
            onChange={(e) => setEditData({ ...editData, sceneId: e.target.value })}
            className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>{scene.name}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            step="0.1"
            min="0"
            value={editData.fadeInTime}
            onChange={(e) => setEditData({ ...editData, fadeInTime: e.target.value })}
            className="w-20 rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            step="0.1"
            min="0"
            value={editData.fadeOutTime}
            onChange={(e) => setEditData({ ...editData, fadeOutTime: e.target.value })}
            className="w-20 rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            step="0.1"
            min="0"
            value={editData.followTime}
            onChange={(e) => setEditData({ ...editData, followTime: e.target.value })}
            className="w-20 rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800 p-1"
              title="Save"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 p-1"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr 
      ref={ref} 
      style={style} 
      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    >
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
        <div className="flex items-center space-x-2">
          <button
            className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            {...dragAttributes}
            {...dragListeners}
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
            </svg>
          </button>
          <span>{cue.cueNumber}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{cue.name}</td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cue.scene.name}</td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cue.fadeInTime}s</td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cue.fadeOutTime}s</td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cue.followTime || 0}s</td>
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit cue"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(cue)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete cue"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
  }
);

CueRow.displayName = 'CueRow';

export default function CueListEditorModal({ isOpen, onClose, cueListId, onCueListUpdated, onRunCueList }: CueListEditorModalProps) {
  const [cueListName, setCueListName] = useState('');
  const [cueListDescription, setCueListDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAddCue, setShowAddCue] = useState(false);
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
    skip: !cueListId,
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

  const [updateCueList] = useMutation(UPDATE_CUE_LIST, {
    onCompleted: () => {
      onCueListUpdated();
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

  const [updateCue] = useMutation(UPDATE_CUE, {
    onCompleted: () => {
      refetch();
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

  const cueList = cueListData?.cueList;
  const scenes = scenesData?.project?.scenes || [];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && cueList) {
      const oldIndex = cueList.cues.findIndex((cue) => cue.id === active.id);
      const newIndex = cueList.cues.findIndex((cue) => cue.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create the reordered array to calculate new cue numbers
        const reorderedCues = arrayMove(cueList.cues, oldIndex, newIndex);
        
        // Generate new cue numbers based on position, maintaining gaps for insertions
        const cueOrders = reorderedCues.map((cue: Cue, index: number) => ({
          cueId: cue.id,
          cueNumber: index + 1, // Simple sequential numbering
        }));

        // Execute the mutation
        reorderCues({
          variables: {
            cueListId: cueList.id,
            cueOrders,
          },
        });
      }
    }
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

  const handleAddCue = () => {
    if (!cueList || !newCue.sceneId) return;

    createCue({
      variables: {
        input: {
          name: newCue.name,
          cueNumber: parseFloat(newCue.cueNumber) || 1,
          cueListId: cueList.id,
          sceneId: newCue.sceneId,
          fadeInTime: parseFloat(newCue.fadeInTime) || 3,
          fadeOutTime: parseFloat(newCue.fadeOutTime) || 3,
          followTime: parseFloat(newCue.followTime) || undefined,
          notes: newCue.notes || undefined,
        },
      },
    });
  };

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

  const handleClose = () => {
    setCueListName('');
    setCueListDescription('');
    setError(null);
    setShowAddCue(false);
    onClose();
  };

  const getNextCueNumber = useCallback(() => {
    if (!cueList?.cues || cueList.cues.length === 0) return 1;
    const maxCueNumber = Math.max(...cueList.cues.map(c => c.cueNumber));
    return maxCueNumber + 1;
  }, [cueList?.cues]);

  useEffect(() => {
    if (showAddCue) {
      setNewCue(prev => ({ ...prev, cueNumber: getNextCueNumber().toString() }));
    }
  }, [showAddCue, getNextCueNumber]);

  if (!isOpen || !cueListId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading cue list...</p>
            </div>
          ) : !cueList ? (
            <div className="text-center py-8">
              <p className="text-red-500">Cue list not found</p>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Edit Cue List
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="cuelist-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cue List Name *
                    </label>
                    <input
                      id="cuelist-name"
                      type="text"
                      value={cueListName}
                      onChange={(e) => setCueListName(e.target.value)}
                      onBlur={handleUpdateCueList}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="cuelist-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      id="cuelist-description"
                      type="text"
                      value={cueListDescription}
                      onChange={(e) => setCueListDescription(e.target.value)}
                      onBlur={handleUpdateCueList}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Cues ({cueList.cues.length})
                </h4>
                <button
                  onClick={() => setShowAddCue(!showAddCue)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {showAddCue ? 'Cancel' : 'Add Cue'}
                </button>
              </div>

              {showAddCue && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add New Cue</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cue #</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newCue.cueNumber}
                        onChange={(e) => setNewCue({ ...newCue, cueNumber: e.target.value })}
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={newCue.name}
                        onChange={(e) => setNewCue({ ...newCue, name: e.target.value })}
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Scene</label>
                      <select
                        value={newCue.sceneId}
                        onChange={(e) => setNewCue({ ...newCue, sceneId: e.target.value })}
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">Select scene...</option>
                        {scenes.map((scene) => (
                          <option key={scene.id} value={scene.id}>{scene.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={newCue.notes}
                        onChange={(e) => setNewCue({ ...newCue, notes: e.target.value })}
                        placeholder="Optional notes..."
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fade In (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newCue.fadeInTime}
                        onChange={(e) => setNewCue({ ...newCue, fadeInTime: e.target.value })}
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fade Out (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newCue.fadeOutTime}
                        onChange={(e) => setNewCue({ ...newCue, fadeOutTime: e.target.value })}
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Follow (sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newCue.followTime}
                        onChange={(e) => setNewCue({ ...newCue, followTime: e.target.value })}
                        className="w-full rounded border-gray-300 text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddCue}
                      disabled={!newCue.name || !newCue.sceneId}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      Add Cue
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cue #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Scene</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fade In</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fade Out</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Follow</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <SortableContext
                      items={cueList.cues.map(cue => cue.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {cueList.cues.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              No cues yet. Add your first cue to get started.
                            </td>
                          </tr>
                        ) : (
                          cueList.cues.map(cue => (
                            <SortableCueRow
                              key={cue.id}
                              cue={cue}
                              scenes={scenes}
                              onUpdate={handleUpdateCue}
                              onDelete={handleDeleteCue}
                            />
                          ))
                        )}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>

              <div className="mt-6 flex justify-between">
                <div>
                  {onRunCueList && cueList.cues.length > 0 && (
                    <button
                      onClick={() => {
                        handleClose();
                        onRunCueList(cueList.id);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run Cue List
                    </button>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}