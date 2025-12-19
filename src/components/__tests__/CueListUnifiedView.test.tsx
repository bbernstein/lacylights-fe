import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CueListUnifiedView from '../CueListUnifiedView';
import {
  GET_CUE_LIST,
  
  FADE_TO_BLACK,
  UPDATE_CUE,
  CREATE_CUE,
  DELETE_CUE,
  
  
  START_CUE_LIST,
  NEXT_CUE,
  
  GO_TO_CUE,
  STOP_CUE_LIST
} from '../../graphql/cueLists';
import { GET_PROJECT_SCENES } from '../../graphql/scenes';

// Mock drag and drop functionality
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
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
  SortableContext: ({ children }: {
    children: React.ReactNode;
    items?: string[];
    strategy?: unknown;
  }) => <div data-testid="sortable-context">{children}</div>,
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
  return function MockBulkFadeUpdateModal({ isOpen, onClose, selectedCues, onUpdate }: {
    isOpen?: boolean;
    onClose?: () => void;
    selectedCues?: unknown[];
    onUpdate?: () => void;
  }) {
    return isOpen ? (
      <div data-testid="bulk-fade-update-modal">
        <div>Selected cues: {selectedCues?.length || 0}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={onUpdate}>Update</button>
      </div>
    ) : null;
  };
});

jest.mock('../AddCueDialog', () => {
  return function MockAddCueDialog({ isOpen, onClose, onAdd }: {
    isOpen?: boolean;
    onClose?: () => void;
    onAdd?: (params: unknown) => void;
  }) {
    return isOpen ? (
      <div data-testid="add-cue-dialog">
        <button onClick={onClose}>Close Dialog</button>
        <button onClick={() => onAdd?.({
          cueNumber: 5.5,
          name: 'Test Cue',
          sceneId: 'scene-1',
          createCopy: true,
          fadeInTime: 3,
          fadeOutTime: 3,
          followTime: undefined,
          action: 'stay',
        })}>Add Cue</button>
      </div>
    ) : null;
  };
});

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(() => null),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  __typename: 'Project',
};

const mockCueList = {
  id: 'cuelist-1',
  name: 'Test Cue List',
  description: 'Test description',
  loop: false,
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
  let desktopViewportStyle: HTMLStyleElement | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm for delete tests
    window.confirm = jest.fn(() => true);
    // Mock window.open for player window
    window.open = jest.fn();

    // Simulate desktop viewport by hiding mobile layout and showing desktop layout
    // Mobile uses lg:hidden, desktop uses hidden lg:block
    desktopViewportStyle = document.createElement('style');
    desktopViewportStyle.innerHTML = `
      [class*="lg:hidden"] { display: none !important; }
      [class*="hidden"][class*="lg:block"] { display: block !important; }
    `;
    document.head.appendChild(desktopViewportStyle);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up the specific style element we created
    if (desktopViewportStyle && desktopViewportStyle.parentNode) {
      desktopViewportStyle.parentNode.removeChild(desktopViewportStyle);
    }
    desktopViewportStyle = null;
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

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await waitFor(() => {
        expect(screen.getByText('Cue list not found')).toBeInTheDocument();
      });
    });
  });

  describe('basic rendering', () => {
    it('renders cue list with header', async () => {
      renderWithProvider();

      // Wait for loading to complete before checking for the data
      await waitFor(() => {
        expect(screen.queryByText('Loading cue list...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });
    });

    it('renders cue list table', async () => {
      renderWithProvider();

      await waitFor(() => {
        // Both mobile and desktop views render, so use getAllByText
        expect(screen.getAllByText('Opening')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Transition')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Scene 1')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Scene 2')[0]).toBeInTheDocument();
      });
    });

    it('renders control panel', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTitle('Previous (←)')).toBeInTheDocument();
        expect(screen.getByText('START')).toBeInTheDocument();
        expect(screen.getByTitle('Next (→)')).toBeInTheDocument();
        expect(screen.getByTitle('Stop (Esc)')).toBeInTheDocument();
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
        const modeButton = screen.getByText('PLAYING');
        expect(modeButton).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      expect(screen.getByText('EDITING')).toBeInTheDocument();
      expect(screen.getByText('Add Cue')).toBeInTheDocument();
      expect(screen.getByText('2 cues')).toBeInTheDocument();
    });

    it('shows add cue form in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      const quickAddButton = screen.getByText('Quick Add');
      await userEvent.click(quickAddButton);

      expect(screen.getByPlaceholderText('Cue #')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Cue name')).toBeInTheDocument();
      expect(screen.getByText('Select scene...')).toBeInTheDocument();
    });

    it('shows checkboxes for cue selection in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

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
        const nextButton = screen.getByTitle('Next (→)');
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByTitle('Next (→)');
      await userEvent.click(nextButton);
    });

    it('handles previous cue button when available', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 1 });

      await waitFor(() => {
        const prevButton = screen.getByTitle('Previous (←)');
        expect(prevButton).toBeInTheDocument();
      });

      const prevButton = screen.getByTitle('Previous (←)');
      expect(prevButton).not.toBeDisabled();
      await userEvent.click(prevButton);
    });

    it('handles stop button', async () => {
      renderWithProvider();

      await waitFor(() => {
        const stopButton = screen.getByTitle('Stop (Esc)');
        expect(stopButton).toBeInTheDocument();
      });

      const stopButton = screen.getByTitle('Stop (Esc)');
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
        expect(screen.getByTitle('Stop (Esc)')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });
    });

    it('handles arrow keys for navigation', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTitle('Previous (←)')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });

    it('ignores keyboard shortcuts in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

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

      // Both mobile and desktop views render LIVE indicator
      expect(screen.getAllByText('LIVE')[0]).toBeInTheDocument();
    });

    it('shows NEXT indicator for next cue', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 0 });

      await waitFor(() => {
        // Both mobile and desktop views render NEXT indicator
        expect(screen.getAllByText('NEXT')[0]).toBeInTheDocument();
      });
    });

    it('handles cue deletion in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      const deleteButtons = screen.getAllByTitle('Delete cue');
      expect(deleteButtons.length).toBeGreaterThan(0);

      await userEvent.click(deleteButtons[0]);
      expect(window.confirm).toHaveBeenCalledWith('Delete cue "Opening"?');
    });
  });

  describe('modal management', () => {
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
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      // Select a cue
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // Skip the select all checkbox

      const updateButton = screen.getByText('Update Fades');
      await userEvent.click(updateButton);

      expect(screen.getByTestId('bulk-fade-update-modal')).toBeInTheDocument();
    });

    it('navigates to scene editor when edit button is clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      const editSceneButtons = screen.getAllByTitle('Edit scene');
      expect(editSceneButtons.length).toBeGreaterThan(0);

      await userEvent.click(editSceneButtons[0]);

      // Should navigate to the scene editor
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/scenes/'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('mode=layout'));
    });
  });

  describe('editable cells', () => {
    it('allows editing fade times in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

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
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      const fadeTimeButtons = screen.getAllByText('3s');
      await userEvent.click(fadeTimeButtons[0]);

      const input = screen.getByDisplayValue('3');
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should revert to button after escape (4 total: 2 mobile + 2 desktop)
      await waitFor(() => {
        expect(screen.getAllByText('3s')).toHaveLength(4);
      });
    });
  });

  describe('select all functionality', () => {
    it('handles select all checkbox', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('PLAYING')).toBeInTheDocument();
      });

      const modeButton = screen.getByText('PLAYING');
      await userEvent.click(modeButton);

      // Get select-all checkbox from desktop table (in thead)
      const table = screen.getByRole('table');
      const selectAllCheckbox = table.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
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
        // Both mobile and desktop views show empty state
        expect(screen.getAllByText(/No cues yet/)[0]).toBeInTheDocument();
      });
    });
  });

  describe('fade progress indicator', () => {
    it('shows fade progress for active cue', async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 0, fadeProgress: 75 });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Cue List')).toBeInTheDocument();
      });

      // Check for FadeProgressChart SVG elements (aria-label for accessibility)
      const fadeProgressCharts = document.querySelectorAll('[aria-label*="Fade progress"]');
      expect(fadeProgressCharts.length).toBeGreaterThan(0);
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

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

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
      // Both mobile and desktop views render jump buttons (2 cues × 2 views = 4)
      expect(screen.getAllByTitle('Jump to this cue')).toHaveLength(4);
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
        // Both mobile and desktop views have DndContext and SortableContext
        expect(screen.getAllByTestId('dnd-context')[0]).toBeInTheDocument();
        expect(screen.getAllByTestId('sortable-context')[0]).toBeInTheDocument();
      });
    });
  });

  describe('follow time functionality', () => {
    it('displays follow times for cues', async () => {
      renderWithProvider();

      await waitFor(() => {
        // Should show follow time of 5s for the second cue (both mobile and desktop)
        expect(screen.getAllByText('5s')[0]).toBeInTheDocument();
      });
    });
  });
});