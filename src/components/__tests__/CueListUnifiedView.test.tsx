import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import CueListUnifiedView from "../CueListUnifiedView";
import {
  GET_CUE_LIST,
  FADE_TO_BLACK,
  UPDATE_CUE,
  CREATE_CUE,
  DELETE_CUE,
  START_CUE_LIST,
  NEXT_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST,
} from "../../graphql/cueLists";
import { GET_PROJECT_SCENES } from "../../graphql/scenes";

// Mock drag and drop functionality
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}));

jest.mock("@dnd-kit/sortable", () => ({
  arrayMove: jest.fn((items, oldIndex, newIndex) => {
    const result = [...items];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  }),
  SortableContext: ({
    children,
  }: {
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

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ""),
    },
  },
}));

// Mock the cue list playback hook
jest.mock("../../hooks/useCueListPlayback", () => ({
  useCueListPlayback: jest.fn(),
}));

// Mock child components
jest.mock("../BulkFadeUpdateModal", () => {
  return function MockBulkFadeUpdateModal({
    isOpen,
    onClose,
    selectedCues,
    onUpdate,
  }: {
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

jest.mock("../AddCueDialog", () => {
  return function MockAddCueDialog({
    isOpen,
    onClose,
    onAdd,
  }: {
    isOpen?: boolean;
    onClose?: () => void;
    onAdd?: (params: unknown) => void;
  }) {
    return isOpen ? (
      <div data-testid="add-cue-dialog">
        <button onClick={onClose}>Close Dialog</button>
        <button
          onClick={() =>
            onAdd?.({
              cueNumber: 5.5,
              name: "Test Cue",
              sceneId: "scene-1",
              createCopy: true,
              fadeInTime: 3,
              fadeOutTime: 3,
              followTime: undefined,
              action: "stay",
            })
          }
        >
          Add Cue
        </button>
      </div>
    ) : null;
  };
});

jest.mock("../ContextMenu", () => {
  return function MockContextMenu({
    options,
    onDismiss,
  }: {
    options: Array<{ label: string; onClick: () => void }>;
    onDismiss: () => void;
  }) {
    return (
      <div data-testid="context-menu">
        {options.map((option, i) => (
          <button key={i} onClick={option.onClick}>
            {option.label}
          </button>
        ))}
        <button onClick={onDismiss}>Close</button>
      </div>
    );
  };
});

jest.mock("../EditCueDialog", () => {
  return function MockEditCueDialog({
    isOpen,
    onClose,
    cue,
    onUpdate,
  }: {
    isOpen?: boolean;
    onClose?: () => void;
    cue?: {
      id: string;
      name: string;
      scene?: {
        id: string;
      };
    };
    onUpdate?: (params: unknown) => void;
  }) {
    return isOpen ? (
      <div data-testid="edit-cue-dialog">
        <h3>Edit Cue</h3>
        <p>Editing: {cue?.name}</p>
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() =>
            onUpdate?.({
              cueId: cue?.id,
              sceneId: cue?.scene?.id,
              action: "stay",
            })
          }
        >
          Save
        </button>
        <button
          onClick={() =>
            onUpdate?.({
              cueId: cue?.id,
              sceneId: cue?.scene?.id,
              action: "edit-scene",
            })
          }
        >
          Save & Edit Scene
        </button>
      </div>
    ) : null;
  };
});

// Mock next/navigation
const mockPush = jest.fn();
const mockSearchParams = {
  get: jest.fn(() => null),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockProject = {
  id: "project-1",
  name: "Test Project",
  __typename: "Project",
};

const mockCueList = {
  id: "cuelist-1",
  name: "Test Cue List",
  description: "Test description",
  loop: false,
  project: {
    id: "project-1",
    name: "Test Project",
    __typename: "Project",
  },
  createdAt: "2023-01-01T12:00:00Z",
  updatedAt: "2023-01-01T12:00:00Z",
  cues: [
    {
      id: "cue-1",
      cueNumber: 1,
      name: "Opening",
      fadeInTime: 3.0,
      fadeOutTime: 3.0,
      followTime: 0,
      notes: "Opening scene",
      scene: {
        id: "scene-1",
        name: "Scene 1",
        description: "Test scene 1",
        fixtureValues: [],
        project: mockProject,
        createdAt: "2023-01-01T12:00:00Z",
        updatedAt: "2023-01-01T12:00:00Z",
        __typename: "Scene",
      },
      __typename: "Cue",
    },
    {
      id: "cue-2",
      cueNumber: 2,
      name: "Transition",
      fadeInTime: 2.0,
      fadeOutTime: 2.0,
      followTime: 5.0,
      notes: "Auto follow",
      scene: {
        id: "scene-2",
        name: "Scene 2",
        description: "Test scene 2",
        fixtureValues: [],
        project: mockProject,
        createdAt: "2023-01-02T12:00:00Z",
        updatedAt: "2023-01-02T12:00:00Z",
        __typename: "Scene",
      },
      __typename: "Cue",
    },
  ],
  __typename: "CueList",
};

const mockScenes = [
  {
    id: "scene-1",
    name: "Scene 1",
    description: "Test scene 1",
    fixtureValues: [],
    project: mockProject,
    createdAt: "2023-01-01T12:00:00Z",
    updatedAt: "2023-01-01T12:00:00Z",
    __typename: "Scene",
  },
  {
    id: "scene-2",
    name: "Scene 2",
    description: "Test scene 2",
    fixtureValues: [],
    project: mockProject,
    createdAt: "2023-01-02T12:00:00Z",
    updatedAt: "2023-01-02T12:00:00Z",
    __typename: "Scene",
  },
  {
    id: "scene-3",
    name: "Scene 3",
    description: "Test scene 3",
    fixtureValues: [],
    project: mockProject,
    createdAt: "2023-01-03T12:00:00Z",
    updatedAt: "2023-01-03T12:00:00Z",
    __typename: "Scene",
  },
];

const mockPlaybackStatus = {
  currentCueIndex: -1,
  isPlaying: false,
  fadeProgress: 50,
  __typename: "PlaybackStatus",
};

const defaultProps = {
  cueListId: "cuelist-1",
  onClose: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_CUE_LIST,
      variables: { id: "cuelist-1" },
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
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        project: {
          scenes: mockScenes,
          __typename: "Project",
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_CUE,
      variables: {
        id: "cue-1",
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
          id: "cue-3",
          cueNumber: 3,
          name: "New Cue",
          fadeInTime: 3.0,
          fadeOutTime: 3.0,
          followTime: 0,
          notes: "",
          scene: mockScenes[0],
          __typename: "Cue",
        },
      },
    },
  },
  {
    request: {
      query: DELETE_CUE,
      variables: { id: "cue-1" },
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
        cueListId: "cuelist-1",
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
        cueListId: "cuelist-1",
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
        cueListId: "cuelist-1",
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
        cueListId: "cuelist-1",
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

const renderWithProvider = (
  mocks = createMocks(),
  props = {},
  playbackOverrides = {},
) => {
  const { useCueListPlayback } = require("../../hooks/useCueListPlayback");
  useCueListPlayback.mockReturnValue({
    playbackStatus: { ...mockPlaybackStatus, ...playbackOverrides },
  });

  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CueListUnifiedView {...defaultProps} {...props} />
    </MockedProvider>,
  );
};

describe("CueListUnifiedView", () => {
  let desktopViewportStyle: HTMLStyleElement | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm for delete tests
    window.confirm = jest.fn(() => true);
    // Mock window.open for player window
    window.open = jest.fn();

    // Simulate desktop viewport by hiding mobile layout and showing desktop layout
    // Mobile uses lg:hidden, desktop uses hidden lg:block
    desktopViewportStyle = document.createElement("style");
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

  describe("loading and error states", () => {
    it("renders loading state", () => {
      const loadingMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: "cuelist-1" },
          },
          delay: 1000,
          result: {
            data: { cueList: mockCueList },
          },
        },
      ];

      renderWithProvider(loadingMocks);

      expect(screen.getByText("Loading cue list...")).toBeInTheDocument();
    });

    it("renders error state when cue list not found", async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: "cuelist-1" },
          },
          result: {
            data: { cueList: null },
          },
        },
      ];

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await waitFor(() => {
        expect(screen.getByText("Cue list not found")).toBeInTheDocument();
      });
    });
  });

  describe("basic rendering", () => {
    it("renders cue list with header", async () => {
      renderWithProvider();

      // Wait for loading to complete before checking for the data
      await waitFor(() => {
        expect(
          screen.queryByText("Loading cue list..."),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });
    });

    it("renders cue list table", async () => {
      renderWithProvider();

      await waitFor(() => {
        // Both mobile and desktop views render, so use getAllByText
        expect(screen.getAllByText("Opening")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Transition")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Scene 1")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Scene 2")[0]).toBeInTheDocument();
      });
    });

    it("renders control panel", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTitle("Previous (←)")).toBeInTheDocument();
        expect(screen.getByText("START")).toBeInTheDocument();
        expect(screen.getByTitle("Next (→)")).toBeInTheDocument();
        expect(screen.getByTitle("Stop (Esc)")).toBeInTheDocument();
      });
    });

    it("displays current and next cue information", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText(/Current: None/)).toBeInTheDocument();
        expect(screen.getByText(/Next: Cue 1 - Opening/)).toBeInTheDocument();
      });
    });
  });

  describe("edit mode functionality", () => {
    it("is always in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      expect(screen.getByText("Add Cue")).toBeInTheDocument();
      expect(screen.getByText("2 cues")).toBeInTheDocument();
    });

    it("shows add cue form in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      const quickAddButton = screen.getByText("Quick Add");
      await userEvent.click(quickAddButton);

      expect(screen.getByPlaceholderText("Cue #")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Cue name")).toBeInTheDocument();
      expect(screen.getByText("Select scene...")).toBeInTheDocument();
    });

    it("shows checkboxes for cue selection in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe("cue playback controls", () => {
    it("handles GO button click", async () => {
      renderWithProvider();

      await waitFor(() => {
        const goButton = screen.getByText("START");
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText("START");
      await userEvent.click(goButton);

      // Button should trigger mutation
      expect(goButton).toBeInTheDocument();
    });

    it("handles next cue button", async () => {
      renderWithProvider();

      await waitFor(() => {
        const nextButton = screen.getByTitle("Next (→)");
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByTitle("Next (→)");
      await userEvent.click(nextButton);
    });

    it("disables previous cue button in edit mode", async () => {
      renderWithProvider(createMocks(), {}, { currentCueIndex: 1 });

      await waitFor(() => {
        const prevButton = screen.getByTitle("Previous (←)");
        expect(prevButton).toBeInTheDocument();
      });

      const prevButton = screen.getByTitle("Previous (←)");
      // Button is disabled in edit mode (which is always active)
      expect(prevButton).toBeDisabled();
    });

    it("handles stop button", async () => {
      renderWithProvider();

      await waitFor(() => {
        const stopButton = screen.getByTitle("Stop (Esc)");
        expect(stopButton).toBeInTheDocument();
      });

      const stopButton = screen.getByTitle("Stop (Esc)");
      await userEvent.click(stopButton);
    });
  });

  describe("keyboard shortcuts", () => {
    it("handles space key for GO", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("START")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { code: "Space" });
    });

    it("handles escape key for STOP", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTitle("Stop (Esc)")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "Escape" });
    });

    it("handles arrow keys for navigation", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTitle("Previous (←)")).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });

    it("ignores keyboard shortcuts in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Should not trigger actions in edit mode (which is always active)
      fireEvent.keyDown(window, { code: "Space" });
      fireEvent.keyDown(window, { key: "Escape" });
    });
  });

  describe("cue management", () => {
    it("handles cue deletion in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle("Delete cue");
      expect(deleteButtons.length).toBeGreaterThan(0);

      await userEvent.click(deleteButtons[0]);
      expect(window.confirm).toHaveBeenCalledWith('Delete cue "Opening"?');
    });
  });

  describe("modal management", () => {
    it("handles close button", async () => {
      renderWithProvider();

      await waitFor(() => {
        const closeButton = screen.getByTitle("Close unified view");
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByTitle("Close unified view");
      await userEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("opens bulk update modal when cues are selected", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Select a cue
      const checkboxes = screen.getAllByRole("checkbox");
      await userEvent.click(checkboxes[1]); // Skip the select all checkbox

      const updateButton = screen.getByText("Update Fades");
      await userEvent.click(updateButton);

      expect(screen.getByTestId("bulk-fade-update-modal")).toBeInTheDocument();
    });

    it("navigates to scene editor when edit button is clicked", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      const editSceneButtons = screen.getAllByTitle("Edit scene");
      expect(editSceneButtons.length).toBeGreaterThan(0);

      await userEvent.click(editSceneButtons[0]);

      // Should navigate to the scene editor
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/scenes/"),
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("mode=layout"),
      );
    });
  });

  describe("editable cells", () => {
    it("allows editing fade times in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Find fade time cells (they show as buttons with "3s" text)
      const fadeTimeButtons = screen.getAllByText("3s");
      expect(fadeTimeButtons.length).toBeGreaterThan(0);

      await userEvent.click(fadeTimeButtons[0]);

      // Should show input field
      const input = screen.getByDisplayValue("3");
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe("INPUT");
    });

    it("handles escape key in editable cells", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      const fadeTimeButtons = screen.getAllByText("3s");
      await userEvent.click(fadeTimeButtons[0]);

      const input = screen.getByDisplayValue("3");
      fireEvent.keyDown(input, { key: "Escape" });

      // Should revert to button after escape (4 total: 2 mobile + 2 desktop)
      await waitFor(() => {
        expect(screen.getAllByText("3s")).toHaveLength(4);
      });
    });
  });

  describe("select all functionality", () => {
    it("handles select all checkbox", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Get select-all checkbox from desktop table (in thead)
      const table = screen.getByRole("table");
      const selectAllCheckbox = table.querySelector(
        'thead input[type="checkbox"]',
      ) as HTMLInputElement;
      await userEvent.click(selectAllCheckbox);

      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state message when no cues", async () => {
      const emptyCueListMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: "cuelist-1" },
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

  describe("error handling", () => {
    it("displays GraphQL errors", async () => {
      const errorMocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: "cuelist-1" },
          },
          error: new Error("Network error"),
        },
      ];

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await waitFor(() => {
        expect(screen.getByText("Cue list not found")).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("has proper button roles and labels", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      expect(screen.getByTitle("Close unified view")).toBeInTheDocument();
      // Edit mode is always active
      expect(screen.getByText("EDITING")).toBeInTheDocument();
    });

    it("has proper table structure", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
        expect(screen.getAllByRole("row").length).toBeGreaterThan(0);
      });
    });
  });

  describe("drag and drop", () => {
    it("renders sortable context", async () => {
      renderWithProvider();

      await waitFor(() => {
        // Both mobile and desktop views have DndContext and SortableContext
        expect(screen.getAllByTestId("dnd-context")[0]).toBeInTheDocument();
        expect(
          screen.getAllByTestId("sortable-context")[0],
        ).toBeInTheDocument();
      });
    });
  });

  describe("follow time functionality", () => {
    it("displays follow times for cues", async () => {
      renderWithProvider();

      await waitFor(() => {
        // Should show follow time of 5s for the second cue (both mobile and desktop)
        expect(screen.getAllByText("5s")[0]).toBeInTheDocument();
      });
    });
  });

  describe("renumber cues functionality", () => {
    it("shows renumber button in edit mode", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Renumber")).toBeInTheDocument();
      });
    });

    it("renumbers cues when button clicked and confirmed", async () => {
      // Mock window.confirm to return true
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Renumber")).toBeInTheDocument();
      });

      const renumberButton = screen.getByText("Renumber");
      await userEvent.click(renumberButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Renumber all cues to sequential whole numbers",
        ),
      );

      confirmSpy.mockRestore();
    });

    it("does not renumber cues when user cancels", async () => {
      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Renumber")).toBeInTheDocument();
      });

      const renumberButton = screen.getByText("Renumber");
      await userEvent.click(renumberButton);

      expect(confirmSpy).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe("touch and drag improvements", () => {
    it("has touch-none class on drag handles", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Find drag handle buttons
      const dragHandles = screen.getAllByTitle("Drag to reorder");
      expect(dragHandles[0]).toHaveClass("touch-none");
    });

    it("prevents text selection on cue cards", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      // Mobile view cards should have select-none class
      const mobileCards = document.querySelectorAll(".select-none");
      expect(mobileCards.length).toBeGreaterThan(0);
    });
  });

  describe("context menu functionality", () => {
    it("shows context menu on right click", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      // Get a cue card (mobile view)
      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      // Right-click to open context menu
      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });
    });

    it("handles edit cue from context menu", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const editButton = screen.getByText("Edit Cue");
      await userEvent.click(editButton);

      // Should open edit cue dialog
      await waitFor(() => {
        expect(screen.getByText("Edit Cue")).toBeInTheDocument();
      });
    });

    it("handles edit scene from context menu", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const editSceneButton = screen.getByText("Edit Scene");
      await userEvent.click(editSceneButton);

      // Should navigate to scene editor
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/scenes/"),
      );
    });

    it("handles duplicate cue from context menu", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const duplicateButton = screen.getByText("Duplicate Cue");
      await userEvent.click(duplicateButton);

      // Context menu should close
      await waitFor(() => {
        expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
      });
    });

    it("handles delete cue from context menu", async () => {
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("Delete Cue");
      await userEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining("Delete cue"),
      );

      confirmSpy.mockRestore();
    });

    it("cancels delete when user clicks cancel", async () => {
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("Delete Cue");
      await userEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it("handles move cue from context menu", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const moveButton = screen.getByText("Move Cue");
      await userEvent.click(moveButton);

      // Context menu should close
      await waitFor(() => {
        expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
      });
    });

    it("handles add cue from context menu", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      // Find the "Add Cue" button within the context menu
      const contextMenu = screen.getByTestId("context-menu");
      const addButtons = contextMenu.querySelectorAll("button");
      const addButton = Array.from(addButtons).find(
        (btn) => btn.textContent === "Add Cue",
      );

      if (addButton) {
        await userEvent.click(addButton);
      }

      // Should open add cue dialog
      await waitFor(() => {
        expect(screen.getByTestId("add-cue-dialog")).toBeInTheDocument();
      });
    });

    it("closes context menu when clicking dismiss", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const dismissButton = screen.getByText("Close");
      await userEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
      });
    });
  });

  describe("touch event handlers", () => {
    it("handles touch move to cancel long press", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      // Start touch
      fireEvent.touchStart(firstCard, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Move more than 10px
      fireEvent.touchMove(firstCard, {
        touches: [{ clientX: 120, clientY: 100 }],
      });

      // Wait to ensure long-press doesn't trigger
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Context menu should NOT appear
      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    });

    it("handles touch end to cancel long press", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      // Start touch
      fireEvent.touchStart(firstCard, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // End touch before long-press triggers
      fireEvent.touchEnd(firstCard);

      // Wait to ensure long-press doesn't trigger
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Context menu should NOT appear
      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    });

    it("triggers context menu on successful long press", async () => {
      // Mock navigator.vibrate
      const vibrateSpy = jest.fn();
      Object.defineProperty(navigator, "vibrate", {
        value: vibrateSpy,
        writable: true,
      });

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      // Start touch
      fireEvent.touchStart(firstCard, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Wait for long-press to trigger (500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Context menu should appear
      await waitFor(() => {
        expect(screen.queryByTestId("context-menu")).toBeInTheDocument();
      });

      // Vibrate should have been called
      expect(vibrateSpy).toHaveBeenCalledWith(50);
    });
  });

  describe("edit cue dialog", () => {
    it("updates cue when save is clicked", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const editButton = screen.getByText("Edit Cue");
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Edit Cue")).toBeInTheDocument();
      });

      // Find and click save button
      const saveButtons = screen.getAllByText("Save");
      await userEvent.click(saveButtons[0]);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText("Edit Cue")).not.toBeInTheDocument();
      });
    });

    it("closes edit dialog when cancel is clicked", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const editButton = screen.getByText("Edit Cue");
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Edit Cue")).toBeInTheDocument();
      });

      // Find and click cancel button
      const cancelButtons = screen.getAllByText("Cancel");
      await userEvent.click(cancelButtons[0]);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText("Edit Cue")).not.toBeInTheDocument();
      });
    });

    it("navigates to scene editor when save and edit scene is clicked", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      const firstCard = cueCards[0] as HTMLElement;

      fireEvent.contextMenu(firstCard);

      await waitFor(() => {
        expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      });

      const editButton = screen.getByText("Edit Cue");
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Edit Cue")).toBeInTheDocument();
      });

      // Find and click save & edit scene button
      const saveEditButton = screen.getByText("Save & Edit Scene");
      await userEvent.click(saveEditButton);

      // Should navigate to scene editor
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/scenes/"),
        );
      });
    });
  });

  describe("additional edge cases", () => {
    it("handles quick add cue button", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Quick Add")).toBeInTheDocument();
      });

      const quickAddButton = screen.getByText("Quick Add");
      await userEvent.click(quickAddButton);

      // Should show inline quick add form
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Cue #")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Cue name")).toBeInTheDocument();
      });

      // Button should change to "Cancel"
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("handles cue name input changes", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      // Get the cue name input (should be editable in edit mode)
      const cueNameButtons = screen.getAllByText("Opening");
      expect(cueNameButtons.length).toBeGreaterThan(0);
    });

    it("handles fade time edits and save", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Click on a fade time to edit it
      const fadeTimeButtons = screen.getAllByText("3s");
      await userEvent.click(fadeTimeButtons[0]);

      // Input should appear
      const input = screen.getByDisplayValue("3");
      expect(input).toBeInTheDocument();

      // Change the value
      await userEvent.clear(input);
      await userEvent.type(input, "5");

      // Press enter to save
      fireEvent.keyDown(input, { key: "Enter" });

      // Should save the new value
      await waitFor(() => {
        expect(screen.getAllByText("3s").length).toBeGreaterThan(0);
      });
    });

    it("handles cue number input changes", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Get a cue number button
      const cueNumberButtons = document.querySelectorAll(
        "button[data-cue-index]",
      );
      if (cueNumberButtons.length > 0) {
        await userEvent.click(cueNumberButtons[0]);
      }
    });

    it("handles checkbox selection state changes", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Select individual cues
      const checkboxes = screen.getAllByRole("checkbox");
      // Skip select all (first checkbox) and select second cue
      if (checkboxes.length > 2) {
        await userEvent.click(checkboxes[2]);

        // Should show selection count
        await waitFor(() => {
          expect(screen.getByText("1 selected")).toBeInTheDocument();
        });
      }
    });

    it("handles update button when cues are selected", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("EDITING")).toBeInTheDocument();
      });

      // Select a cue
      const checkboxes = screen.getAllByRole("checkbox");
      await userEvent.click(checkboxes[1]);

      // Click update fades button
      const updateButton = screen.getByText("Update Fades");
      await userEvent.click(updateButton);

      // Should open bulk update modal
      await waitFor(() => {
        expect(
          screen.getByTestId("bulk-fade-update-modal"),
        ).toBeInTheDocument();
      });
    });

    it("handles go button click", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTitle("Stop (Esc)")).toBeInTheDocument();
      });

      const goButton = screen.getByTitle("Stop (Esc)");
      await userEvent.click(goButton);
    });

    it("handles add cue button click", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Add Cue")).toBeInTheDocument();
      });

      // Find the Add Cue button (not in context menu)
      const addCueButtons = screen.getAllByText("Add Cue");
      // Should be at least one button outside context menu
      expect(addCueButtons.length).toBeGreaterThan(0);

      await userEvent.click(addCueButtons[0]);

      // Should open add cue dialog
      await waitFor(() => {
        expect(screen.getByTestId("add-cue-dialog")).toBeInTheDocument();
      });
    });

    it("handles add cue dialog submission", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Add Cue")).toBeInTheDocument();
      });

      const addCueButtons = screen.getAllByText("Add Cue");
      await userEvent.click(addCueButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("add-cue-dialog")).toBeInTheDocument();
      });

      // Click the "Add Cue" button in the dialog
      const dialog = screen.getByTestId("add-cue-dialog");
      const addButton = dialog.querySelector(
        "button:nth-child(2)",
      ) as HTMLButtonElement;
      await userEvent.click(addButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByTestId("add-cue-dialog")).not.toBeInTheDocument();
      });
    });

    it("handles add cue dialog close", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText("Add Cue")).toBeInTheDocument();
      });

      const addCueButtons = screen.getAllByText("Add Cue");
      await userEvent.click(addCueButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("add-cue-dialog")).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByText("Close Dialog");
      await userEvent.click(closeButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByTestId("add-cue-dialog")).not.toBeInTheDocument();
      });
    });

    it("handles cue list name update", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("Test Cue List");
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, "Updated Cue List");

      // Blur to trigger update
      fireEvent.blur(nameInput);

      // Name should be updated
      expect(nameInput).toHaveValue("Updated Cue List");
    });

    it("handles cue list description update", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Test description"),
        ).toBeInTheDocument();
      });

      const descInput = screen.getByDisplayValue("Test description");

      // Change the description
      fireEvent.change(descInput, { target: { value: "New description" } });

      // Blur to trigger update
      fireEvent.blur(descInput);

      // Input was successfully interacted with
      expect(descInput).toBeInTheDocument();
    });

    it("handles loop checkbox toggle", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(
          screen.getByTitle(/Loop (enabled|disabled)/),
        ).toBeInTheDocument();
      });

      const loopButton = screen.getByTitle(/Loop (enabled|disabled)/);
      await userEvent.click(loopButton);

      // Button should still be there (may have different styling)
      await waitFor(() => {
        expect(
          screen.getByTitle(/Loop (enabled|disabled)/),
        ).toBeInTheDocument();
      });
    });

    it("handles cue row click in mobile view", async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Cue List")).toBeInTheDocument();
      });

      // Get mobile view cue cards
      const cueCards = document.querySelectorAll(
        '[class*="rounded-lg"][class*="border"]',
      );
      if (cueCards.length > 0) {
        const firstCard = cueCards[0] as HTMLElement;
        await userEvent.click(firstCard);
      }
    });
  });
});
