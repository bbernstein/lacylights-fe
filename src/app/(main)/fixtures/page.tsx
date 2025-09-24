'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_FIXTURES, DELETE_FIXTURE_INSTANCE, CREATE_FIXTURE_INSTANCE, REORDER_PROJECT_FIXTURES } from '@/graphql/fixtures';
import AddFixtureModal from '@/components/AddFixtureModal';
import EditFixtureModal from '@/components/EditFixtureModal';
import { useProject } from '@/contexts/ProjectContext';
import { FixtureInstance } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

type SortField = 'name' | 'universe' | 'startChannel' | 'original';
type SortDirection = 'asc' | 'desc';

interface SortableHeaderProps {
  field: SortField;
  currentField: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, currentField, currentDirection, onSort, children }: SortableHeaderProps) {
  const isActive = currentField === field;
  
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
      <button
        onClick={() => onSort(field)}
        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
      >
        <span>{children}</span>
        <div className="flex flex-col">
          <svg 
            className={`w-3 h-3 ${isActive && currentDirection === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-3 h-3 -mt-1 ${isActive && currentDirection === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
    </th>
  );
}

interface SortableRowProps {
  fixture: FixtureInstance;
  onEdit: (fixture: FixtureInstance) => void;
  onDuplicate: (fixture: FixtureInstance) => void;
  onDelete: (fixture: FixtureInstance) => void;
  duplicating: boolean;
}

function SortableRow({ fixture, onEdit, onDuplicate, onDelete, duplicating }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: fixture.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
      {...attributes}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        <div className="flex items-center">
          <button
            className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            {...listeners}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          {fixture.name}
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs">
        <div className="break-words whitespace-normal">
          {fixture.description || 'No description'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {fixture.modeName} ({fixture.channelCount} ch)
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {fixture.universe}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {fixture.startChannel}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button 
            onClick={() => onEdit(fixture)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Edit fixture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDuplicate(fixture)}
            disabled={duplicating}
            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate fixture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(fixture)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete fixture"
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

export default function FixturesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<FixtureInstance | null>(null);
  const [sortField, setSortField] = useState<SortField>('original');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { currentProject, loading: projectLoading } = useProject();
  
  const { data, loading, error, refetch } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId: currentProject?.id },
    skip: !currentProject?.id,
  });

  const [deleteFixture] = useMutation(DELETE_FIXTURE_INSTANCE, {
    onCompleted: () => {
      // Even if the mutation returns null/undefined, refresh the list
      refetch();
    },
    onError: (error) => {
      // Check if this is just a null return value issue
      if (error.message.includes('Cannot return null for non-nullable field')) {
        // The deletion might have succeeded, just refresh the list
        refetch();
      } else {
        alert(`Error deleting fixture: ${error.message}`);
      }
    },
  });

  const [duplicateFixture, { loading: duplicating }] = useMutation(CREATE_FIXTURE_INSTANCE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error duplicating fixture: ${error.message}`);
    },
  });

  const [reorderFixtures] = useMutation(REORDER_PROJECT_FIXTURES, {
    onError: (_error) => {
      // TODO: Replace with toast notification system
      refetch(); // Refresh to restore original order
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort fixtures based on current sort settings with memoization
  const fixtures = useMemo(() => {
    const rawFixtures = data?.project?.fixtures || [];
    return [...rawFixtures].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'universe':
          comparison = a.universe - b.universe;
          break;
        case 'startChannel':
          comparison = a.startChannel - b.startChannel;
          break;
        case 'original':
          // Use projectOrder if available, fallback to createdAt timestamp
          const aOrder = a.projectOrder ?? Date.parse(a.createdAt);
          const bOrder = b.projectOrder ?? Date.parse(b.createdAt);
          comparison = aOrder - bOrder;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data?.project?.fixtures, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fixtures.findIndex((fixture) => fixture.id === active.id);
      const newIndex = fixtures.findIndex((fixture) => fixture.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFixtures = arrayMove(fixtures, oldIndex, newIndex);
        
        // Update projectOrder for all fixtures
        const fixtureOrders = newFixtures.map((fixture, index) => ({
          fixtureId: fixture.id,
          order: index + 1,
        }));

        try {
          await reorderFixtures({
            variables: {
              projectId: currentProject?.id,
              fixtureOrders,
            },
          });
          
          // Switch to original order view to show the new custom order
          setSortField('original');
          setSortDirection('asc');
          refetch();
        } catch {
          // The mutation's onError handler will also trigger
        }
      }
    }
  };

  const handleFixtureAdded = () => {
    refetch();
  };

  const handleEditFixture = (fixture: FixtureInstance) => {
    setSelectedFixture(fixture);
    setIsEditModalOpen(true);
  };

  const handleFixtureUpdated = () => {
    refetch();
    setSelectedFixture(null);
  };

  const handleDeleteFixture = (fixture: FixtureInstance) => {
    if (window.confirm(`Are you sure you want to delete "${fixture.name}"? This action cannot be undone.`)) {
      deleteFixture({
        variables: {
          id: fixture.id,
        },
      });
    }
  };

  // Find next available channel in the same universe
  const findNextAvailableChannel = (universe: number, channelCount: number) => {
    const fixturesInUniverse: FixtureInstance[] = fixtures
      .filter((f: FixtureInstance) => f.universe === universe)
      .sort((a: FixtureInstance, b: FixtureInstance) => a.startChannel - b.startChannel);

    // Check if we can start at channel 1
    if (fixturesInUniverse.length === 0 || fixturesInUniverse[0].startChannel > channelCount) {
      return 1;
    }

    // Check gaps between fixtures
    for (let i = 0; i < fixturesInUniverse.length; i++) {
      const currentFixture = fixturesInUniverse[i];
      const currentEnd = currentFixture.startChannel + (currentFixture.channelCount || 1) - 1;
      
      // Check if there's space after this fixture
      const nextStart = currentEnd + 1;
      
      if (i === fixturesInUniverse.length - 1) {
        // Last fixture, check if there's room after it
        if (nextStart + channelCount - 1 <= 512) {
          return nextStart;
        }
      } else {
        // Check gap to next fixture
        const nextFixture = fixturesInUniverse[i + 1];
        if (nextStart + channelCount - 1 < nextFixture.startChannel) {
          return nextStart;
        }
      }
    }

    // No space found in this universe
    return -1;
  };

  const handleDuplicateFixture = (fixture: FixtureInstance) => {
    const channelCount = fixture.channelCount || 1;
    const nextChannel = findNextAvailableChannel(fixture.universe, channelCount);
    
    if (nextChannel === -1) {
      alert(`No space available in universe ${fixture.universe} for a fixture with ${channelCount} channels`);
      return;
    }

    // Generate default name format: "Manufacturer Model - U#:startChannel"
    const newName = `${fixture.manufacturer} ${fixture.model} - U${fixture.universe}:${nextChannel}`;

    duplicateFixture({
      variables: {
        input: {
          name: newName,
          definitionId: fixture.definitionId,
          // Note: modeId not needed with flattened structure
          projectId: currentProject?.id,
          universe: fixture.universe,
          startChannel: nextChannel,
        },
      },
    });
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">No project selected. Creating default project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading fixtures: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Fixtures</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your lighting fixtures and DMX patching
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Fixture
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400">Loading fixtures...</p>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500 dark:text-gray-400">No fixtures yet. Add your first fixture to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''} 
                {sortField !== 'original' && (
                  <span> • Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})</span>
                )}
              </div>
              <button
                onClick={() => handleSort('original')}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset to Original Order
              </button>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fixtures.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <SortableHeader field="name" currentField={sortField} currentDirection={sortDirection} onSort={handleSort}>
                        Name
                      </SortableHeader>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mode
                      </th>
                      <SortableHeader field="universe" currentField={sortField} currentDirection={sortDirection} onSort={handleSort}>
                        Universe
                      </SortableHeader>
                      <SortableHeader field="startChannel" currentField={sortField} currentDirection={sortDirection} onSort={handleSort}>
                        Start Channel
                      </SortableHeader>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {fixtures.map((fixture: FixtureInstance) => (
                      <SortableRow
                        key={fixture.id}
                        fixture={fixture}
                        onEdit={handleEditFixture}
                        onDuplicate={handleDuplicateFixture}
                        onDelete={handleDeleteFixture}
                        duplicating={duplicating}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>

      {currentProject && (
        <>
          <AddFixtureModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            projectId={currentProject.id}
            onFixtureAdded={handleFixtureAdded}
          />
          <EditFixtureModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedFixture(null);
            }}
            fixture={selectedFixture}
            onFixtureUpdated={handleFixtureUpdated}
          />
        </>
      )}
    </div>
  );
}