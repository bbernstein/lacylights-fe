import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CueListEditorModal from '../CueListEditorModal';
import {
  GET_CUE_LIST,
  UPDATE_CUE_LIST,
  CREATE_CUE,
  UPDATE_CUE,
  DELETE_CUE,
  REORDER_CUES,
  BULK_UPDATE_CUES,
} from '../../graphql/cueLists';
import { GET_PROJECT_SCENES } from '../../graphql/scenes';

// Mock the dnd-kit library
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: unknown) => (
    <div data-testid="dnd-context">
      {children}
    </div>
  ),
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn((array, oldIndex, newIndex) => {
    const result = [...array];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: {
    children: React.ReactNode;
    items?: string[];
    strategy?: unknown;
  }) => <tbody data-testid="sortable-context">{children}</tbody>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}));

// Mock BulkFadeUpdateModal
jest.mock('../BulkFadeUpdateModal', () => {
  return function MockBulkFadeUpdateModal({ isOpen, onClose, selectedCues, onUpdate }: {
    isOpen?: boolean;
    onClose?: () => void;
    selectedCues?: unknown[];
    onUpdate?: () => void;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="bulk-update-modal">
        <div>Selected Cues: {selectedCues.length}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => { onUpdate(); onClose(); }}>Update</button>
      </div>
    );
  };
});

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  __typename: 'Project',
};

const mockScenes = [
  {
    id: 'scene-1',
    name: 'Scene 1',
    description: 'Test Scene 1',
    project: mockProject,
    fixtureValues: [],
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    __typename: 'Scene',
  },
  {
    id: 'scene-2',
    name: 'Scene 2',
    description: 'Test Scene 2',
    project: mockProject,
    fixtureValues: [],
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    __typename: 'Scene',
  },
];

const mockCues = [
  {
    id: 'cue-1',
    name: 'Cue 1',
    cueNumber: 1,
    scene: mockScenes[0],
    fadeInTime: 3,
    fadeOutTime: 3,
    followTime: null,
    notes: 'Test notes',
    __typename: 'Cue',
  },
  {
    id: 'cue-2',
    name: 'Cue 2',
    cueNumber: 2,
    scene: mockScenes[1],
    fadeInTime: 5,
    fadeOutTime: 5,
    followTime: 2,
    notes: null,
    __typename: 'Cue',
  },
];

const mockCueList = {
  id: 'cuelist-1',
  name: 'Test Cue List',
  description: 'Test Description',
  project: mockProject,
  cues: mockCues,
  createdAt: '2023-01-01T12:00:00Z',
  updatedAt: '2023-01-01T12:00:00Z',
  __typename: 'CueList',
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  cueListId: 'cuelist-1',
  onCueListUpdated: jest.fn(),
  onRunCueList: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_CUE_LIST,
      variables: { id: 'cuelist-1' },
    },
    result: {
      data: {
        cueList: mockCueList,
      },
    },
  },
  // Additional refetch mock
  {
    request: {
      query: GET_CUE_LIST,
      variables: { id: 'cuelist-1' },
    },
    result: {
      data: {
        cueList: mockCueList,
      },
    },
  },
  // Another refetch mock
  {
    request: {
      query: GET_CUE_LIST,
      variables: { id: 'cuelist-1' },
    },
    result: {
      data: {
        cueList: mockCueList,
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_SCENES,
      variables: { projectId: 'project-1' },
    },
    result: {
      data: {
        project: {
          id: 'project-1',
          scenes: mockScenes,
          __typename: 'Project',
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_CUE_LIST,
      variables: {
        id: 'cuelist-1',
        input: {
          name: 'Updated Cue List',
          description: 'Updated Description',
          projectId: 'project-1',
        },
      },
    },
    result: {
      data: {
        updateCueList: {
          ...mockCueList,
          name: 'Updated Cue List',
          description: 'Updated Description',
        },
      },
    },
  },
  {
    request: {
      query: CREATE_CUE,
      variables: {
        input: {
          name: 'New Cue',
          cueNumber: 3,
          cueListId: 'cuelist-1',
          sceneId: 'scene-1',
          fadeInTime: 3,
          fadeOutTime: 3,
          followTime: undefined,
          notes: undefined,
        },
      },
    },
    result: {
      data: {
        createCue: {
          id: 'cue-3',
          name: 'New Cue',
          cueNumber: 3,
          scene: mockScenes[0],
          fadeInTime: 3,
          fadeOutTime: 3,
          followTime: null,
          notes: null,
          __typename: 'Cue',
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_CUE,
      variables: {
        id: 'cue-1',
        input: {
          name: 'Updated Cue',
          cueNumber: 1,
          cueListId: 'cuelist-1',
          sceneId: 'scene-1',
          fadeInTime: 4,
          fadeOutTime: 4,
          followTime: undefined,
          notes: undefined,
        },
      },
    },
    result: {
      data: {
        updateCue: {
          ...mockCues[0],
          name: 'Updated Cue',
          fadeInTime: 4,
          fadeOutTime: 4,
        },
      },
    },
  },
  {
    request: {
      query: DELETE_CUE,
      variables: { id: 'cue-1' },
    },
    result: {
      data: {
        deleteCue: true,
      },
    },
  },
  {
    request: {
      query: REORDER_CUES,
      variables: {
        cueListId: 'cuelist-1',
        cueOrders: [
          { cueId: 'cue-2', cueNumber: 1 },
          { cueId: 'cue-1', cueNumber: 2 },
        ],
      },
    },
    result: {
      data: {
        reorderCues: true,
      },
    },
  },
  {
    request: {
      query: BULK_UPDATE_CUES,
      variables: {
        input: {
          cueIds: ['cue-1', 'cue-2'],
          fadeInTime: 5,
          fadeOutTime: 5,
        },
      },
    },
    result: {
      data: {
        bulkUpdateCues: true,
      },
    },
  },
];

const renderWithProvider = (mocks = createMocks(), props = {}) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CueListEditorModal {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('CueListEditorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      renderWithProvider(createMocks(), { isOpen: false });
      expect(screen.queryByRole('heading', { name: 'Edit Cue List' })).not.toBeInTheDocument();
    });

    it('renders nothing when no cueListId provided', () => {
      renderWithProvider(createMocks(), { cueListId: null });
      expect(screen.queryByRole('heading', { name: 'Edit Cue List' })).not.toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderWithProvider();
      expect(screen.getByText('Loading cue list...')).toBeInTheDocument();
    });

    it('renders modal when open with cueListId', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Cue List' })).toBeInTheDocument();
      });
    });

    it('shows error when cue list not found', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          result: {
            data: {
              cueList: null,
            },
          },
        },
      ];

      renderWithProvider(errorMocks);

      await waitFor(() => {
        expect(screen.getByText('Cue list not found')).toBeInTheDocument();
      });
    });
  });

  describe('cue list form fields', () => {
    it('displays cue list name and description fields', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      });
    });

    it('allows editing cue list name', async () => {
      renderWithProvider();

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test Cue List');
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Cue List');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'New Name');
      expect(nameInput).toHaveValue('New Name');
    });

    it('allows editing cue list description', async () => {
      renderWithProvider();

      await waitFor(() => {
        const descInput = screen.getByDisplayValue('Test Description');
        expect(descInput).toBeInTheDocument();
      });

      const descInput = screen.getByDisplayValue('Test Description');
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'New Description');
      expect(descInput).toHaveValue('New Description');
    });
  });

  describe('cue table display', () => {
    it('displays cue list with correct number of cues', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cues (2)')).toBeInTheDocument();
      });
    });

    it('displays cue data in table', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
        expect(screen.getByText('Cue 2')).toBeInTheDocument();
        expect(screen.getByText('Scene 1')).toBeInTheDocument();
        expect(screen.getByText('Scene 2')).toBeInTheDocument();
      });
    });

    it('displays fade times correctly', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getAllByText('3s')).toHaveLength(2); // Cue 1 has 3s for both fade in and fade out
        expect(screen.getAllByText('5s')).toHaveLength(2); // Cue 2 has 5s for both fade in and fade out
      });
    });

    it('displays follow times correctly', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getAllByText('0s')).toHaveLength(1); // Cue 1 has null followTime, shows as 0s
        expect(screen.getByText('2s')).toBeInTheDocument(); // Cue 2 has followTime 2
      });
    });

    it('shows empty state when no cues', async () => {
      const emptyCueListMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          result: {
            data: {
              cueList: {
                ...mockCueList,
                cues: [],
              },
            },
          },
        },
        {
          request: {
            query: GET_PROJECT_SCENES,
            variables: { projectId: 'project-1' },
          },
          result: {
            data: {
              project: {
                id: 'project-1',
                scenes: mockScenes,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      renderWithProvider(emptyCueListMocks);

      await waitFor(() => {
        expect(screen.getByText('No cues yet. Add your first cue to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('add cue functionality', () => {
    it('toggles add cue form', async () => {
      renderWithProvider();

      await waitFor(() => {
        const addButton = screen.getByText('Add Cue');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Cue');
      await userEvent.click(addButton);

      expect(screen.getByText('Add New Cue')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows add cue form with correct fields', async () => {
      renderWithProvider();

      await waitFor(() => {
        const addButton = screen.getByText('Add Cue');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Cue');
      await userEvent.click(addButton);

      expect(screen.getAllByText('Cue #')).toHaveLength(2); // One in table header, one in form
      expect(screen.getAllByText('Name')).toHaveLength(2); // One in table header, one in form
      expect(screen.getAllByText('Scene')).toHaveLength(2); // One in table header, one in form
      expect(screen.getByText('Fade In (sec)')).toBeInTheDocument();
      expect(screen.getByText('Fade Out (sec)')).toBeInTheDocument();
      expect(screen.getByText('Follow (sec)')).toBeInTheDocument();
      expect(screen.getByText('Notes (optional)')).toBeInTheDocument();
    });

    it('populates next cue number automatically', async () => {
      renderWithProvider();

      await waitFor(() => {
        const addButton = screen.getByText('Add Cue');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Cue');
      await userEvent.click(addButton);

      // Find the cue number input by looking at the structure
      const cueNumberInputs = screen.getAllByDisplayValue('3');
      expect(cueNumberInputs.length).toBeGreaterThan(0); // Should have default value 3
    });

    it('shows Add Cue button initially disabled', async () => {
      renderWithProvider();

      await waitFor(() => {
        const addButton = screen.getByText('Add Cue');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Cue');
      await userEvent.click(addButton);

      const _submitButton = screen.getByRole('button', { name: 'Add Cue' });
      expect(_submitButton).toBeDisabled();
    });
  });

  describe('cue editing', () => {
    it('enables inline editing when edit button clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit cue');
      await userEvent.click(editButtons[0]);

      expect(screen.getByDisplayValue('Cue 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByTitle('Save')).toBeInTheDocument();
      expect(screen.getByTitle('Cancel')).toBeInTheDocument();
    });

    it('allows editing cue fields in inline mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit cue');
      await userEvent.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('Cue 1');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Cue');
      expect(nameInput).toHaveValue('Updated Cue');

      // Find one of the fade in time inputs (there could be multiple 3s)
      const fadeInputs = screen.getAllByDisplayValue('3');
      const fadeInInput = fadeInputs[0]; // Use the first one
      await userEvent.clear(fadeInInput);
      await userEvent.type(fadeInInput, '4');
      expect(fadeInInput).toHaveValue(4); // Numeric input should have numeric value
    });

    it('cancels editing when cancel button clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit cue');
      await userEvent.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('Cue 1');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Changed Name');

      const cancelButton = screen.getByTitle('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.getByText('Cue 1')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument();
    });
  });

  describe('cue deletion', () => {
    it('shows confirmation dialog when delete clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete cue');
      await userEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Delete cue "Cue 1"?');
    });

    it('does not delete when confirmation cancelled', async () => {
      mockConfirm.mockReturnValue(false);
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete cue');
      await userEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Delete cue "Cue 1"?');
      expect(screen.getByText('Cue 1')).toBeInTheDocument();
    });
  });

  describe('bulk operations', () => {
    it('shows selection checkboxes', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3); // 1 select all + 2 individual cues
    });

    it('allows selecting individual cues', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const cueCheckbox = checkboxes[1]; // First cue checkbox

      await userEvent.click(cueCheckbox);
      expect(cueCheckbox).toBeChecked();

      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Update Fades')).toBeInTheDocument();
    });

    it('allows selecting all cues', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];

      await userEvent.click(selectAllCheckbox);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByText('Update Fades')).toBeInTheDocument();
    });

    it('opens bulk update modal when Update Fades clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const cueCheckbox = checkboxes[1];

      await userEvent.click(cueCheckbox);

      const updateButton = screen.getByText('Update Fades');
      await userEvent.click(updateButton);

      expect(screen.getByTestId('bulk-update-modal')).toBeInTheDocument();
      expect(screen.getByText('Selected Cues: 1')).toBeInTheDocument();
    });
  });

  describe('drag and drop', () => {
    it('renders dnd context and sortable context', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });

    it('shows drag handles for cues', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      const dragHandles = screen.getAllByTitle('Drag to reorder');
      expect(dragHandles).toHaveLength(2); // One for each cue
    });
  });

  describe('run cue list functionality', () => {
    it('shows Run Cue List button when onRunCueList provided and cues exist', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Run Cue List')).toBeInTheDocument();
      });
    });

    it('does not show Run Cue List button when no onRunCueList provided', async () => {
      renderWithProvider(createMocks(), { onRunCueList: undefined });

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      expect(screen.queryByText('Run Cue List')).not.toBeInTheDocument();
    });

    it('calls onRunCueList when Run Cue List clicked', async () => {
      const onRunCueList = jest.fn();
      renderWithProvider(createMocks(), { onRunCueList });

      await waitFor(() => {
        expect(screen.getByText('Run Cue List')).toBeInTheDocument();
      });

      const runButton = screen.getByText('Run Cue List');
      await userEvent.click(runButton);

      expect(onRunCueList).toHaveBeenCalledWith('cuelist-1');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('modal actions', () => {
    it('calls onClose when Close button clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Cue List' })).toBeInTheDocument();
      });

      const backdrop = document.querySelector('.bg-gray-500');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });
  });

  describe('error handling', () => {
    it('displays error messages', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          result: {
            data: {
              cueList: mockCueList,
            },
          },
        },
        {
          request: {
            query: GET_PROJECT_SCENES,
            variables: { projectId: 'project-1' },
          },
          result: {
            data: {
              project: {
                id: 'project-1',
                scenes: mockScenes,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: UPDATE_CUE_LIST,
            variables: {
              id: 'cuelist-1',
              input: {
                name: 'Test Cue List',
                description: 'Test Description',
                projectId: 'project-1',
              },
            },
          },
          error: new Error('Update failed'),
        },
      ];

      renderWithProvider(errorMocks);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Cue List');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    it('handles GraphQL loading errors gracefully', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          error: new Error('Network error'),
        },
      ];

      renderWithProvider(errorMocks);

      // Should not crash, but may show loading state
      expect(screen.getByText('Loading cue list...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByLabelText('Cue List Name *')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
      });
    });

    it('has proper table headers', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue #')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Scene')).toBeInTheDocument();
        expect(screen.getByText('Fade In')).toBeInTheDocument();
        expect(screen.getByText('Fade Out')).toBeInTheDocument();
        expect(screen.getByText('Follow')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('has proper button roles and titles', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add Cue' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      });

      expect(screen.getAllByTitle('Edit cue')).toHaveLength(2);
      expect(screen.getAllByTitle('Delete cue')).toHaveLength(2);
      expect(screen.getAllByTitle('Drag to reorder')).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('handles cue list without description', async () => {
      const cueListWithoutDesc = {
        ...mockCueList,
        description: null,
      };

      const mocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          result: {
            data: {
              cueList: cueListWithoutDesc,
            },
          },
        },
        {
          request: {
            query: GET_PROJECT_SCENES,
            variables: { projectId: 'project-1' },
          },
          result: {
            data: {
              project: {
                id: 'project-1',
                scenes: mockScenes,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Cue List' })).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText('Description');
      expect(descInput).toHaveValue('');
    });

    it('handles cues without follow time or notes', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Cue 1')).toBeInTheDocument();
      });

      // Cue 1 has no followTime, should show as 0s
      expect(screen.getAllByText('0s')).toHaveLength(1);
    });

    it('calculates next cue number correctly when no cues exist', async () => {
      const emptyCueListMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          result: {
            data: {
              cueList: {
                ...mockCueList,
                cues: [],
              },
            },
          },
        },
        {
          request: {
            query: GET_PROJECT_SCENES,
            variables: { projectId: 'project-1' },
          },
          result: {
            data: {
              project: {
                id: 'project-1',
                scenes: mockScenes,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      renderWithProvider(emptyCueListMocks);

      await waitFor(() => {
        const addButton = screen.getByText('Add Cue');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Cue');
      await userEvent.click(addButton);

      // Find the cue number input (should default to 1 when no cues)
      const cueNumberInputs = screen.getAllByDisplayValue('1');
      expect(cueNumberInputs.length).toBeGreaterThan(0); // Should have default value 1
    });
  });
});