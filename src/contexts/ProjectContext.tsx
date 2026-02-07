'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECTS, CREATE_PROJECT } from '@/graphql/projects';
import { Project } from '@/types';
import { useGroup } from '@/contexts/GroupContext';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: Error | null;
  selectProject: (project: Project) => void;
  selectProjectById: (projectId: string) => void;
  createNewProject: (name: string, description?: string, groupId?: string) => Promise<void>;
  selectedProjectId: string | null;
  refetchAndGet: () => Promise<Project[]>;
  refetchAndSelectById: (projectId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { activeGroup } = useGroup();
  const prevGroupIdRef = useRef<string | null | undefined>(undefined);
  const autoCreateAttemptedRef = useRef(false);

  const { data, loading, error, refetch: refetchQuery } = useQuery(GET_PROJECTS);
  const [createProject] = useMutation(CREATE_PROJECT);

  const projects = useMemo(() => data?.projects || [], [data?.projects]);

  const refetchAndGet = useCallback(async () => {
    const result = await refetchQuery();
    return result.data?.projects || [];
  }, [refetchQuery]);

  const createNewProject = useCallback(async (name: string, description?: string, groupId?: string) => {
    try {
      const input: { name: string; description?: string; groupId?: string } = { name, description };
      // Use provided groupId, or fall back to active group
      if (groupId) {
        input.groupId = groupId;
      } else if (activeGroup) {
        input.groupId = activeGroup.id;
      }

      const result = await createProject({
        variables: { input }
      });

      await refetchAndGet();

      if (result.data?.createProject) {
        setCurrentProject(result.data.createProject);
        localStorage.setItem('currentProjectId', result.data.createProject.id);
      }
    } catch (err) {
      // Error handled by UI error states
      throw err;
    }
  }, [createProject, refetchAndGet, activeGroup]);

  // Auto-select first project or create one if none exist
  useEffect(() => {
    if (!loading && !currentProject && projects.length > 0) {
      setCurrentProject(projects[0]);
    } else if (!loading && projects.length === 0 && !error && !autoCreateAttemptedRef.current) {
      // Auto-create a default project if none exist
      autoCreateAttemptedRef.current = true;
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

  const refetchAndSelectById = useCallback(async (projectId: string) => {
    const updatedProjects = await refetchAndGet();
    const project = updatedProjects.find((p: Project) => p.id === projectId);
    if (project) {
      selectProject(project);
    }
  }, [refetchAndGet]);


  // Refetch projects when active group changes (backend auto-filters by group)
  useEffect(() => {
    const currentGroupId = activeGroup?.id ?? null;
    if (prevGroupIdRef.current !== undefined && prevGroupIdRef.current !== currentGroupId) {
      setCurrentProject(null);
      // Reset auto-create guard so a new group with zero projects can trigger auto-create
      autoCreateAttemptedRef.current = false;
      refetchQuery();
    }
    prevGroupIdRef.current = currentGroupId;
  }, [activeGroup?.id, refetchQuery]);

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
        refetchAndGet,
        refetchAndSelectById,
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