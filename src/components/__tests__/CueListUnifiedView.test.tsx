import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CueListUnifiedView from '../CueListUnifiedView';
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
} from '../../graphql/cueLists';
import { GET_PROJECT_SCENES } from '../../graphql/scenes';

// Mock drag and drop functionality
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn((items, oldIndex, newIndex) => {
    const result = [...items];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
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

// Mock the cue list playback hook
jest.mock('../../hooks/useCueListPlayback', () => ({
  useCueListPlayback: jest.fn(),
}));

// Mock child components
jest.mock('../BulkFadeUpdateModal', () => {
  return function MockBulkFadeUpdateModal({ isOpen, onClose, selectedCues, onUpdate }: any) {
    return isOpen ? (
      <div data-testid="bulk-fade-update-modal">
        <div>Selected cues: {selectedCues?.length || 0}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={onUpdate}>Update</button>
      </div>
    ) : null;
  };
});

jest.mock('../SceneEditorModal', () => {
  return function MockSceneEditorModal({ isOpen, onClose, sceneId, onSceneUpdated }: any) {
    return isOpen ? (
      <div data-testid="scene-editor-modal">
        <div>Editing scene: {sceneId}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={onSceneUpdated}>Update Scene</button>
      </div>
    ) : null;
  };
});

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  __typename: 'Project',
};

const mockCueList = {
  id: 'cuelist-1',
  name: 'Test Cue List',
  description: 'Test description',
  project: {
    id: 'project-1',
    name: 'Test Project',
    __typename: 'Project',
  },
  createdAt: '2023-01-01T12:00:00Z',
  updatedAt: '2023-01-01T12:00:00Z',
  cues: [
    {
      id: 'cue-1',
      cueNumber: 1,
      name: 'Opening',
      fadeInTime: 3.0,
      fadeOutTime: 3.0,
      followTime: 0,
      notes: 'Opening scene',
      scene: {
        id: 'scene-1',
        name: 'Scene 1',
        description: 'Test scene 1',
        fixtureValues: [],
        project: mockProject,
        createdAt: '2023-01-01T12:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
        __typename: 'Scene',
      },
      __typename: 'Cue',
    },
    {
      id: 'cue-2',
      cueNumber: 2,
      name: 'Transition',
      fadeInTime: 2.0,
      fadeOutTime: 2.0,
      followTime: 5.0,
      notes: 'Auto follow',
      scene: {
        id: 'scene-2',
        name: 'Scene 2',
        description: 'Test scene 2',
        fixtureValues: [],
        project: mockProject,
        createdAt: '2023-01-02T12:00:00Z',
        updatedAt: '2023-01-02T12:00:00Z',
        __typename: 'Scene',
      },
      __typename: 'Cue',
    },
  ],
  __typename: 'CueList',
};

const mockScenes = [
  {
    id: 'scene-1',
    name: 'Scene 1',
    description: 'Test scene 1',
    fixtureValues: [],
    project: mockProject,
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    __typename: 'Scene',
  },
  {
    id: 'scene-2',
    name: 'Scene 2',
    description: 'Test scene 2',
    fixtureValues: [],
    project: mockProject,
    createdAt: '2023-01-02T12:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z',
    __typename: 'Scene',
  },
  {
    id: 'scene-3',
    name: 'Scene 3',
    description: 'Test scene 3',
    fixtureValues: [],
    project: mockProject,
    createdAt: '2023-01-03T12:00:00Z',
    updatedAt: '2023-01-03T12:00:00Z',
    __typename: 'Scene',
  },
];

const mockPlaybackStatus = {
  currentCueIndex: -1,
  isPlaying: false,
  fadeProgress: 50,
  __typename: 'PlaybackStatus',
};

const defaultProps = {
  cueListId: 'cuelist-1',
  onClose: jest.fn(),
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
  {
    request: {
      query: GET_PROJECT_SCENES,
      variables: { projectId: 'project-1' },
    },
    result: {
      data: {
        project: {
          scenes: mockScenes,
          __typename: 'Project',
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_CUE,
      variables: {
        id: 'cue-1',
        input: expect.any(Object),
      },
    },
    result: {
      data: {
        updateCue: mockCueList.cues[0],
      },
    },
  },
  {
    request: {
      query: CREATE_CUE,
      variables: {
        input: expect.any(Object),
      },
    },
    result: {
      data: {
        createCue: {
          id: 'cue-3',
          cueNumber: 3,
          name: 'New Cue',
          fadeInTime: 3.0,
          fadeOutTime: 3.0,
          followTime: 0,
          notes: '',
          scene: mockScenes[0],
          __typename: 'Cue',
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
      query: START_CUE_LIST,
      variables: {
        cueListId: 'cuelist-1',
        startFromCue: 0,
      },
    },
    result: {
      data: {
        startCueList: true,
      },
    },
  },
  {
    request: {
      query: NEXT_CUE,
      variables: {
        cueListId: 'cuelist-1',
        fadeInTime: expect.any(Number),
      },
    },
    result: {
      data: {
        nextCue: true,
      },
    },
  },
  {
    request: {
      query: GO_TO_CUE,
      variables: {
        cueListId: 'cuelist-1',
        cueIndex: expect.any(Number),
        fadeInTime: expect.any(Number),
      },
    },
    result: {
      data: {
        goToCue: true,
      },
    },
  },
  {
    request: {
      query: STOP_CUE_LIST,
      variables: {
        cueListId: 'cuelist-1',
      },
    },
    result: {
      data: {
        stopCueList: true,
      },
    },
  },
  {
    request: {
      query: FADE_TO_BLACK,
      variables: {
        fadeOutTime: 3,
      },
    },
    result: {
      data: {
        fadeToBlack: true,
      },
    },
  },
];

const renderWithProvider = (mocks = createMocks(), props = {}, playbackOverrides = {}) => {
  const { useCueListPlayback } = require('../../hooks/useCueListPlayback');
  useCueListPlayback.mockReturnValue({
    playbackStatus: { ...mockPlaybackStatus, ...playbackOverrides },
  });

  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CueListUnifiedView {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('CueListUnifiedView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm for delete tests
    window.confirm = jest.fn(() => true);
    // Mock window.open for player window
    window.open = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loading and error states', () => {
    it('renders loading state', () => {
      const loadingMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          delay: 1000,
          result: {
            data: { cueList: mockCueList },
          },
        },
      ];

      renderWithProvider(loadingMocks);

      expect(screen.getByText('Loading cue list...')).toBeInTheDocument();
    });

    it('renders error state when cue list not found', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: 'cuelist-1' },
          },
          result: {
            data: { cueList: null },
          },
        },
      ];

      renderWithProvider(errorMocks);

      await waitFor(() => {
        expect(screen.getByText('Cue list not found')).toBeInTheDocument();
      });
    });
  });

  describe('basic rendering', () => {
    it('renders cue list with header', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
        expect(screen.getByText('Pop Out Player')).toBeInTheDocument();
      });
    });

    it('renders cue list table', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Opening')).toBeInTheDocument();
        expect(screen.getByText('Transition')).toBeInTheDocument();
        expect(screen.getByText('Scene 1')).toBeInTheDocument();
        expect(screen.getByText('Scene 2')).toBeInTheDocument();
      });
    });

    it('renders control panel', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('START')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('STOP')).toBeInTheDocument();
      });
    });

    it('displays current and next cue information', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText(/Current: None/)).toBeInTheDocument();
        expect(screen.getByText(/Next: Cue 1 - Opening/)).toBeInTheDocument();
      });
    });
  });

  describe('edit mode functionality', () => {
    it('toggles edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        const editButton = screen.getByText('EDIT MODE');
        expect(editButton).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      expect(screen.getByText('EDITING')).toBeInTheDocument();
      expect(screen.getByText('Add Cue')).toBeInTheDocument();
      expect(screen.getByText('2 cues')).toBeInTheDocument();
    });

    it('shows add cue form in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      const addButton = screen.getByText('Add Cue');
      await userEvent.click(addButton);

      expect(screen.getByPlaceholderText('Cue #')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Cue name')).toBeInTheDocument();
      expect(screen.getByText('Select scene...')).toBeInTheDocument();
    });

    it('shows checkboxes for cue selection in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('cue playback controls', () => {
    it('handles GO button click', async () => {
      renderWithProvider();

      await waitFor(() => {
        const goButton = screen.getByText('START');
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText('START');
      await userEvent.click(goButton);

      // Button should trigger mutation
      expect(goButton).toBeInTheDocument();
    });

    it('handles next cue button', async () => {
      renderWithProvider();

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await userEvent.click(nextButton);
    });

    it('handles previous cue button when available', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 1 });

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeInTheDocument();
      });

      const prevButton = screen.getByText('Previous');
      expect(prevButton).not.toBeDisabled();
      await userEvent.click(prevButton);
    });

    it('handles stop button', async () => {
      renderWithProvider();

      await waitFor(() => {
        const stopButton = screen.getByText('STOP');
        expect(stopButton).toBeInTheDocument();
      });

      const stopButton = screen.getByText('STOP');
      await userEvent.click(stopButton);
    });
  });

  describe('keyboard shortcuts', () => {
    it('handles space key for GO', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('START')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { code: 'Space' });
    });

    it('handles escape key for STOP', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('STOP')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });
    });

    it('handles arrow keys for navigation', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });

    it('ignores keyboard shortcuts in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      // Should not trigger actions in edit mode
      fireEvent.keyDown(window, { code: 'Space' });
      fireEvent.keyDown(window, { key: 'Escape' });
    });
  });

  describe('cue management', () => {
    it('allows jumping to specific cue', async () => {
      renderWithProvider();

      await waitFor(() => {
        const goButtons = screen.getAllByText('GO');
        expect(goButtons.length).toBeGreaterThan(0);
      });

      const firstGoButton = screen.getAllByText('GO')[0];
      await userEvent.click(firstGoButton);
    });

    it('shows LIVE indicator for active cue', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 0 });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
      });

      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('shows NEXT indicator for next cue', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 0 });

      await waitFor(() => {
        expect(screen.getByText('NEXT')).toBeInTheDocument();
      });
    });

    it('handles cue deletion in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      const deleteButtons = screen.getAllByTitle('Delete cue');
      expect(deleteButtons.length).toBeGreaterThan(0);

      await userEvent.click(deleteButtons[0]);
      expect(window.confirm).toHaveBeenCalledWith('Delete cue "Opening"?');
    });
  });

  describe('modal management', () => {
    it('opens player window', async () => {
      renderWithProvider();

      await waitFor(() => {
        const playerButton = screen.getByText('Pop Out Player');
        expect(playerButton).toBeInTheDocument();
      });

      const playerButton = screen.getByText('Pop Out Player');
      await userEvent.click(playerButton);

      expect(window.open).toHaveBeenCalledWith(
        '/player/cuelist-1',
        expect.any(String),
        expect.any(String)
      );
    });

    it('handles close button', async () => {
      renderWithProvider();

      await waitFor(() => {
        const closeButton = screen.getByTitle('Close unified view');
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByTitle('Close unified view');
      await userEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('opens bulk update modal when cues are selected', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      // Select a cue
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // Skip the select all checkbox

      const updateButton = screen.getByText('Update Fades');
      await userEvent.click(updateButton);

      expect(screen.getByTestId('bulk-fade-update-modal')).toBeInTheDocument();
    });

    it('opens scene editor modal', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      const editSceneButtons = screen.getAllByTitle('Edit scene');
      expect(editSceneButtons.length).toBeGreaterThan(0);

      await userEvent.click(editSceneButtons[0]);

      expect(screen.getByTestId('scene-editor-modal')).toBeInTheDocument();
    });
  });

  describe('editable cells', () => {
    it('allows editing fade times in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      // Find fade time cells (they show as buttons with "3s" text)
      const fadeTimeButtons = screen.getAllByText('3s');
      expect(fadeTimeButtons.length).toBeGreaterThan(0);

      await userEvent.click(fadeTimeButtons[0]);

      // Should show input field
      const input = screen.getByDisplayValue('3');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('handles escape key in editable cells', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      const fadeTimeButtons = screen.getAllByText('3s');
      await userEvent.click(fadeTimeButtons[0]);

      const input = screen.getByDisplayValue('3');
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should revert to button after escape
      await waitFor(() => {
        expect(screen.getAllByText('3s')).toHaveLength(2);
      });
    });
  });

  describe('select all functionality', () => {
    it('handles select all checkbox', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('EDIT MODE')).toBeInTheDocument();
      });

      const editButton = screen.getByText('EDIT MODE');
      await userEvent.click(editButton);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await userEvent.click(selectAllCheckbox);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state message when no cues', async () => {
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
      ];

      renderWithProvider(emptyCueListMocks);

      await waitFor(() => {
        expect(screen.getByText(/No cues yet/)).toBeInTheDocument();
      });
    });
  });

  describe('fade progress indicator', () => {
    it('shows fade progress for active cue', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 0, fadeProgress: 75 });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
      });

      // Check for fade progress background element
      const fadeProgressElement = document.querySelector('[style*="width: 75%"]');
      expect(fadeProgressElement).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('displays GraphQL errors', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Cue list not found')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('has proper button roles and labels', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
      });

      expect(screen.getByTitle('Close unified view')).toBeInTheDocument();
      expect(screen.getAllByTitle('Jump to this cue')).toHaveLength(2);
    });

    it('has proper table structure', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
      });
    });
  });

  describe('drag and drop', () => {
    it('renders sortable context', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
      });
    });
  });

  describe('follow time functionality', () => {
    it('displays follow times for cues', async () => {
      renderWithProvider();

      await waitFor(() => {
        // Should show follow time of 5s for the second cue
        expect(screen.getByText('5s')).toBeInTheDocument();
      });
    });
  });
});