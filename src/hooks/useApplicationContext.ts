import { usePathname } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useProject } from '@/contexts/ProjectContext';

const GET_PROJECT_CONTEXT = gql`
  query GetProjectContext($projectId: ID!) {
    project(id: $projectId) {
      id
      name
      description
      fixtures {
        id
        name
        manufacturer
        model
        type
      }
      scenes {
        id
        name
        description
      }
      cueLists {
        id
        name
        cues {
          id
        }
      }
    }
  }
`;

export interface ApplicationContext {
  projectId?: string;
  projectName?: string;
  currentMode?: 'fixtures' | 'scenes' | 'cues' | 'overview';
  availableFixtures?: Array<{
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    type: string;
  }>;
  availableScenes?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  availableCueLists?: Array<{
    id: string;
    name: string;
    cueCount: number;
  }>;
}

export function useApplicationContext(): {
  context: ApplicationContext;
  loading: boolean;
  error: Error | null;
} {
  const { currentProject } = useProject();
  const pathname = usePathname();

  // Determine current mode from URL
  const getCurrentMode = (): ApplicationContext['currentMode'] => {
    if (pathname?.includes('/fixtures')) return 'fixtures';
    if (pathname?.includes('/scenes')) return 'scenes';
    if (pathname?.includes('/cues')) return 'cues';
    return 'overview';
  };

  // Fetch project context data if we have a current project
  const { data, loading, error } = useQuery(GET_PROJECT_CONTEXT, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const context: ApplicationContext = {
    projectId: currentProject?.id,
    projectName: currentProject?.name,
    currentMode: getCurrentMode(),
  };

  if (data?.project) {
    context.availableFixtures = data.project.fixtures.map((f: {
      id: string;
      name: string;
      manufacturer: string;
      model: string;
      type: string;
    }) => ({
      id: f.id,
      name: f.name,
      manufacturer: f.manufacturer,
      model: f.model,
      type: f.type,
    }));

    context.availableScenes = data.project.scenes.map((s: {
      id: string;
      name: string;
      description?: string;
    }) => ({
      id: s.id,
      name: s.name,
      description: s.description,
    }));

    context.availableCueLists = data.project.cueLists.map((cl: {
      id: string;
      name: string;
      cues: Array<{ id: string }>;
    }) => ({
      id: cl.id,
      name: cl.name,
      cueCount: cl.cues.length,
    }));
  }

  return {
    context,
    loading,
    error: error || null,
  };
}