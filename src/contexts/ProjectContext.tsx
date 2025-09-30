'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECTS, CREATE_PROJECT } from '@/graphql/projects';
import { Project } from '@/types';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: Error | null;
  selectProject: (project: Project) => void;
  selectProjectById: (projectId: string) => void;
  createNewProject: (name: string, description?: string) => Promise<void>;
  selectedProjectId: string | null;
  refetch: () => Promise<Project[]>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  const { data, loading, error, refetch: refetchQuery } = useQuery(GET_PROJECTS);
  const [createProject] = useMutation(CREATE_PROJECT);

  const projects = useMemo(() => data?.projects || [], [data?.projects]);

  const refetch = useCallback(async () => {
    const result = await refetchQuery();
    return result.data?.projects || [];
  }, [refetchQuery]);

  const createNewProject = useCallback(async (name: string, description?: string) => {
    try {
      const result = await createProject({
        variables: {
          input: { name, description }
        }
      });

      await refetch();

      if (result.data?.createProject) {
        setCurrentProject(result.data.createProject);
        localStorage.setItem('currentProjectId', result.data.createProject.id);
      }
    } catch (err) {
      // Error handled by UI error states
      throw err;
    }
  }, [createProject, refetch]);

  // Auto-select first project or create one if none exist
  useEffect(() => {
    if (!loading && !currentProject && projects.length > 0) {
      setCurrentProject(projects[0]);
    } else if (!loading && projects.length === 0 && !error) {
      // Auto-create a default project if none exist
      createNewProject('Default Project', 'Automatically created project');
    }
  }, [loading, projects, currentProject, error, createNewProject]);

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    // Store in localStorage for persistence
    localStorage.setItem('currentProjectId', project.id);
  };

  const selectProjectById = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === projectId);
    if (project) {
      selectProject(project);
    }
  };


  // Try to restore project from localStorage
  useEffect(() => {
    const storedProjectId = localStorage.getItem('currentProjectId');
    if (storedProjectId && projects.length > 0) {
      const storedProject = projects.find((p: Project) => p.id === storedProjectId);
      if (storedProject) {
        setCurrentProject(storedProject);
      }
    }
  }, [projects]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        error: error || null,
        selectProject,
        selectProjectById,
        createNewProject,
        selectedProjectId: currentProject?.id || null,
        refetch,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}