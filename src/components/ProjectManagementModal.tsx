'use client';

import { useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { XMarkIcon, TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { GET_PROJECTS, CREATE_PROJECT, DELETE_PROJECT, UPDATE_PROJECT, IMPORT_PROJECT_FROM_QLC } from '@/graphql/projects';
import { useProject } from '@/contexts/ProjectContext';

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagementModal({ isOpen, onClose }: ProjectManagementModalProps) {
  const { selectProjectById, selectedProjectId } = useProject();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<{id: string, name: string, description: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PROJECTS);
  const [createProject] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
    onError: (error) => {
      console.error('Create project error:', error);
      setError(`Failed to create project: ${error.message}`);
    },
  });
  const [deleteProject] = useMutation(DELETE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
    onError: (error) => {
      console.error('Delete project error:', error);
      setError(`Failed to delete project: ${error.message}`);
    },
  });
  const [updateProject] = useMutation(UPDATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
    onError: (error) => {
      console.error('Update project error:', error);
      setError(`Failed to update project: ${error.message}`);
    },
  });
  const [importProjectFromQLC] = useLazyQuery(IMPORT_PROJECT_FROM_QLC, {
    onError: (error) => {
      console.error('Import project error:', error);
      setError(`Failed to import project: ${error.message}`);
    },
    onCompleted: async (data) => {
      await refetch();
      
      if (data?.importProjectFromQLC?.project?.id) {
        selectProjectById(data.importProjectFromQLC.project.id);
        
        // Show success message with import details
        const importResult = data.importProjectFromQLC;
        let successMessage = `Successfully imported "${importResult.project.name}"`;
        successMessage += `\n• ${importResult.fixtureCount} fixtures`;
        successMessage += `\n• ${importResult.sceneCount} scenes`;
        successMessage += `\n• ${importResult.cueListCount} cue lists`;
        
        // Log detailed information to console for easy copying
        console.log('=== QLC+ Import Results ===');
        console.log(`Project: ${importResult.project.name}`);
        console.log(`Fixtures: ${importResult.fixtureCount}`);
        console.log(`Scenes: ${importResult.sceneCount}`);
        console.log(`Cue Lists: ${importResult.cueListCount}`);
        
        if (importResult.warnings.length > 0) {
          successMessage += `\n\nWarnings: ${importResult.warnings.length} (see console for details)`;
          console.log('\n=== Import Warnings ===');
          importResult.warnings.forEach((warning, index) => {
            console.log(`${index + 1}. ${warning}`);
          });
          console.log('========================\n');
        }
        
        alert(successMessage);
      }
    },
  });

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedProjects.size === data?.projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(data?.projects.map((p: any) => p.id)));
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
      const result = await deleteProject({ variables: { id: projectId } });
      console.log('Delete result:', result);
    }
    
    setSelectedProjects(new Set());
    
    // If we deleted the currently selected project, select another one
    if (selectedProjectId && selectedProjects.has(selectedProjectId)) {
      const remainingProjects = data?.projects.filter((p: any) => !selectedProjects.has(p.id));
      if (remainingProjects?.length > 0) {
        selectProjectById(remainingProjects[0].id);
      }
    }
  };

  const handleDeleteSingle = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    setError(null);
    
    const result = await deleteProject({ variables: { id: projectId } });
    console.log('Delete single result:', result);
    
    // If we deleted the currently selected project, select another one
    if (selectedProjectId === projectId) {
      const remainingProjects = data?.projects.filter((p: any) => p.id !== projectId);
      if (remainingProjects?.length > 0) {
        selectProjectById(remainingProjects[0].id);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setError(null);
    
    const result = await createProject({
      variables: {
        input: {
          name: newProjectName.trim(),
          description: newProjectDescription.trim()
        }
      }
    });
    
    await refetch();
    setIsCreating(false);
    setNewProjectName('');
    setNewProjectDescription('');
    
    // Select the newly created project
    if (result.data?.createProject?.id) {
      selectProjectById(result.data.createProject.id);
    }
  };

  const handleStartEdit = (project: any) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description || ''
    });
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editingProject.name.trim()) return;

    setError(null);
    
    const result = await updateProject({
      variables: {
        id: editingProject.id,
        input: {
          name: editingProject.name.trim(),
          description: editingProject.description.trim()
        }
      }
    });
    
    await refetch();
    setEditingProject(null);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.qxw')) {
      setError('Please select a QLC+ workspace file (.qxw)');
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const xmlContent = await file.text();
      await importProjectFromQLC({
        variables: {
          xmlContent,
          originalFileName: file.name
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import project. Please check the file and try again.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Manage Projects</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            New Project
          </button>
          
          <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept=".qxw"
              onChange={handleFileImport}
              className="hidden"
              disabled={isImporting}
            />
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isImporting ? 'Importing...' : 'Import QLC+'}
          </label>
          
          {selectedProjects.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Delete Selected ({selectedProjects.size})
            </button>
          )}
          
          {data?.projects?.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              {selectedProjects.size === data?.projects.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {isCreating && (
          <div className="mb-4 p-4 bg-gray-700 rounded">
            <h3 className="text-white font-medium mb-2">Create New Project</h3>
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading projects...</div>
          ) : data?.projects?.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No projects found</div>
          ) : (
            <div className="space-y-2">
              {data?.projects.map((project: any) => (
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
                    className="h-4 w-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    {editingProject && editingProject.id === project.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingProject.name}
                          onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                          className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <textarea
                          value={editingProject.description}
                          onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                          className="w-full px-2 py-1 bg-gray-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Description (optional)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateProject}
                            disabled={!editingProject.name.trim()}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-white font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-gray-400 text-sm">{project.description}</div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedProjectId === project.id && (
                    <span className="text-green-500 text-sm">Current</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(project)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Rename project"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSingle(project.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete project"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}