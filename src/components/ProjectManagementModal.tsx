'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { GET_PROJECTS, CREATE_PROJECT, DELETE_PROJECT, UPDATE_PROJECT } from '@/graphql/projects';
import { useProject } from '@/contexts/ProjectContext';
import { useGroup, getGroupIdForQuery } from '@/contexts/GroupContext';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import ImportExportButtons from './ImportExportButtons';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagementModal({ isOpen, onClose }: ProjectManagementModalProps) {
  const isMobile = useIsMobile();
  const { refetchAndSelectById, selectProjectById, selectedProjectId } = useProject();
  const { groups, activeGroup } = useGroup();
  const { isAdmin } = useAuth();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectGroupId, setNewProjectGroupId] = useState('');
  const [editingProject, setEditingProject] = useState<{id: string, name: string, description: string, groupId: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupIdVar = getGroupIdForQuery(activeGroup);
  const { data, loading, refetch } = useQuery(GET_PROJECTS, {
    variables: { groupId: groupIdVar },
  });
  const [createProject] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS, variables: { groupId: groupIdVar } }],
    onError: (error) => {
      setError(`Failed to create project: ${error.message}`);
    },
  });
  const [deleteProject] = useMutation(DELETE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS, variables: { groupId: groupIdVar } }],
    onError: (error) => {
      setError(`Failed to delete project: ${error.message}`);
    },
  });
  const [updateProject] = useMutation(UPDATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS, variables: { groupId: groupIdVar } }],
    onError: (error) => {
      setError(`Failed to update project: ${error.message}`);
    },
  });

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedProjects.size === data?.projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(data?.projects.map((p: Project) => p.id)));
    }
  };

  const handleToggleSelect = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedProjects.size === 0) return;
    
    const confirmMessage = selectedProjects.size === 1 
      ? 'Are you sure you want to delete this project?' 
      : `Are you sure you want to delete ${selectedProjects.size} projects?`;
    
    if (!confirm(confirmMessage)) return;

    setError(null);
    
    for (const projectId of selectedProjects) {
      await deleteProject({ variables: { id: projectId } });
    }
    
    setSelectedProjects(new Set());
    
    // If we deleted the currently selected project, select another one
    if (selectedProjectId && selectedProjects.has(selectedProjectId)) {
      const remainingProjects = data?.projects.filter((p: Project) => !selectedProjects.has(p.id));
      if (remainingProjects?.length > 0) {
        selectProjectById(remainingProjects[0].id);
      }
    }
  };

  const handleDeleteSingle = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setError(null);
    
    await deleteProject({ variables: { id: projectId } });
    
    // If we deleted the currently selected project, select another one
    if (selectedProjectId === projectId) {
      const remainingProjects = data?.projects.filter((p: Project) => p.id !== projectId);
      if (remainingProjects?.length > 0) {
        selectProjectById(remainingProjects[0].id);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setError(null);

    const input: { name: string; description?: string; groupId?: string } = {
      name: newProjectName.trim(),
    };
    const trimmedDescription = newProjectDescription.trim();
    if (trimmedDescription) {
      input.description = trimmedDescription;
    }
    // Use explicitly selected group, or fall back to active group
    const groupId = newProjectGroupId || activeGroup?.id;
    if (groupId) {
      input.groupId = groupId;
    }

    const result = await createProject({
      variables: { input }
    });

    await refetch();
    setIsCreating(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectGroupId('');

    // Select the newly created project
    if (result.data?.createProject?.id) {
      selectProjectById(result.data.createProject.id);
    }
  };

  const handleStartEdit = (project: Project) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description || '',
      groupId: project.groupId ?? '',
    });
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editingProject.name.trim()) return;

    setError(null);

    const input: { name: string; description: string; groupId?: string | null } = {
      name: editingProject.name.trim(),
      description: editingProject.description.trim(),
    };
    // Include groupId: empty string means clear (null), otherwise set to selected group
    if (editingProject.groupId === '') {
      input.groupId = null;
    } else {
      input.groupId = editingProject.groupId;
    }

    const _result = await updateProject({
      variables: {
        id: editingProject.id,
        input,
      }
    });

    await refetch();
    setEditingProject(null);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleImportComplete = async (projectId: string) => {
    await refetch();
    await refetchAndSelectById(projectId);
  };

  const handleExportError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formContent = (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className={`flex gap-2 flex-wrap ${isMobile ? 'flex-col' : ''}`}>
        <button
          onClick={() => setIsCreating(true)}
          className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation`}
        >
          <PlusIcon className="h-4 w-4" />
          New Project
        </button>

        <ImportExportButtons
          onImportComplete={handleImportComplete}
          onError={handleExportError}
        />

        {selectedProjects.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation`}
          >
            <TrashIcon className="h-4 w-4" />
            Delete Selected ({selectedProjects.size})
          </button>
        )}

        {data?.projects?.length > 0 && (
          <button
            onClick={handleSelectAll}
            className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
          >
            {selectedProjects.size === data?.projects.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {isCreating && (
        <div className="p-4 bg-gray-700 rounded">
          <h3 className="text-white font-medium mb-2">Create New Project</h3>
          <input
            type="text"
            placeholder="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
            rows={2}
          />
          {groups.length > 1 && (
            <select
              value={newProjectGroupId}
              onChange={(e) => setNewProjectGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="">
                {activeGroup ? `${activeGroup.name}${activeGroup.isPersonal ? ' (Personal)' : ''} (current)` : 'Select group...'}
              </option>
              {groups
                .filter((g) => g.id !== activeGroup?.id)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}{g.isPersonal ? ' (Personal)' : ''}
                  </option>
                ))}
            </select>
          )}
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation`}
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewProjectName('');
                setNewProjectDescription('');
              }}
              className={`${isMobile ? 'w-full' : ''} px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading projects...</div>
        ) : data?.projects?.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No projects found</div>
        ) : (
          data?.projects.map((project: Project) => (
            <div
              key={project.id}
              className={`flex items-center gap-3 p-3 rounded ${
                selectedProjectId === project.id ? 'bg-gray-700' : 'bg-gray-700/50'
              } hover:bg-gray-700 transition-colors`}
            >
              <input
                type="checkbox"
                checked={selectedProjects.has(project.id)}
                onChange={() => handleToggleSelect(project.id)}
                className="h-5 w-5 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                {editingProject && editingProject.id === project.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                      className="w-full px-2 py-1 bg-gray-600 text-white rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <textarea
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                      className="w-full px-2 py-1 bg-gray-600 text-white rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="Description (optional)"
                    />
                    {groups.length > 1 && (
                      <select
                        value={editingProject.groupId}
                        onChange={(e) => setEditingProject({...editingProject, groupId: e.target.value})}
                        className="w-full px-2 py-1 bg-gray-600 text-white rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {isAdmin && (
                          <option value="">Unassigned</option>
                        )}
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}{g.isPersonal ? ' (Personal)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                      <button
                        onClick={handleUpdateProject}
                        disabled={!editingProject.name.trim()}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation`}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium truncate">{project.name}</div>
                      {project.group && groups.length > 1 && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-600 text-gray-300">
                          {project.group.name}{project.group.isPersonal ? ' (Personal)' : ''}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <div className="text-gray-400 text-sm truncate">{project.description}</div>
                    )}
                    <div className="text-gray-500 text-xs mt-1">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              {selectedProjectId === project.id && (
                <span className="text-green-500 text-sm shrink-0">Current</span>
              )}
              <div className="flex gap-2 items-center shrink-0">
                <ImportExportButtons
                  projectId={project.id}
                  onError={handleExportError}
                  exportOnly={true}
                />
                <button
                  onClick={() => handleStartEdit(project)}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  title="Rename project"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteSingle(project.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  title="Delete project"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'}`}>
      <button
        onClick={onClose}
        className={`${isMobile ? 'w-full' : ''} px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation`}
      >
        Close
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Projects"
      footer={footerContent}
      maxWidth="max-w-2xl"
      testId="project-management-modal"
    >
      {formContent}
    </BottomSheet>
  );
}