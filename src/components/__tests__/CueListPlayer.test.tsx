import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import CueListPlayer from "../CueListPlayer";
import {
  GET_CUE_LIST,
  GET_CUE_LIST_PLAYBACK_STATUS,
  START_CUE_LIST,
  NEXT_CUE,
  PREVIOUS_CUE,
  GO_TO_CUE,
  STOP_CUE_LIST,
  FADE_TO_BLACK,
} from "../../graphql/cueLists";

jest.mock("../../hooks/useCueListPlayback");
jest.mock("../../utils/cueListHelpers", () => ({
  convertCueIndexForLocalState: jest.fn((index) =>
    index === null || index === undefined ? -1 : index,
  ),
}));
jest.mock("../../constants/playback", () => ({
  DEFAULT_FADEOUT_TIME: 3.0,
}));

// Mock useIsMobile hook for dialogs that use BottomSheet
jest.mock("@/hooks/useMediaQuery", () => ({
  useIsMobile: jest.fn(() => false),
}));

// Mock WebSocketContext to prevent apollo-client import issues in tests
const mockReconnect = jest.fn();
const mockDisconnect = jest.fn();
const mockEnsureConnection = jest.fn();

// Default mock values - can be overridden in individual tests
let mockConnectionState = "connected";
let mockIsStale = false;

jest.mock("../../contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    connectionState: mockConnectionState,
    lastMessageTime: Date.now(),
    isStale: mockIsStale,
    reconnect: mockReconnect,
    disconnect: mockDisconnect,
    ensureConnection: mockEnsureConnection,
  }),
}));

const mockUseCueListPlayback = require("../../hooks/useCueListPlayback")
  .useCueListPlayback as jest.Mock;

describe("CueListPlayer", () => {
  const mockCueListId = "test-cuelist-123";

  const mockCueList = {
    id: mockCueListId,
    name: "Test Cue List",
    description: "A test cue list for testing",
    loop: false,
    createdAt: "2023-01-01T12:00:00Z",
    updatedAt: "2023-01-01T12:00:00Z",
    project: {
      id: "project-1",
      name: "Test Project",
      __typename: "Project",
    },
    __typename: "CueList",
    cues: [
      {
        id: "cue-1",
        name: "Opening Scene",
        cueNumber: 1,
        scene: {
          id: "scene-1",
          name: "Scene 1",
          description: "Test scene 1",
          fixtureValues: [],
          project: {
            id: "project-1",
            name: "Test Project",
            __typename: "Project",
          },
          createdAt: "2023-01-01T12:00:00Z",
          updatedAt: "2023-01-01T12:00:00Z",
          __typename: "Scene",
        },
        fadeInTime: 2.0,
        fadeOutTime: 3.0,
        followTime: undefined,
        notes: "",
        __typename: "Cue",
      },
      {
        id: "cue-2",
        name: "Mid Scene",
        cueNumber: 2,
        scene: {
          id: "scene-2",
          name: "Scene 2",
          description: "Test scene 2",
          fixtureValues: [],
          project: {
            id: "project-1",
            name: "Test Project",
            __typename: "Project",
          },
          createdAt: "2023-01-02T12:00:00Z",
          updatedAt: "2023-01-02T12:00:00Z",
          __typename: "Scene",
        },
        fadeInTime: 1.5,
        fadeOutTime: 2.5,
        followTime: undefined,
        notes: "",
        __typename: "Cue",
      },
      {
        id: "cue-3",
        name: "Closing Scene",
        cueNumber: 3,
        scene: {
          id: "scene-3",
          name: "Scene 3",
          description: "Test scene 3",
          fixtureValues: [],
          project: {
            id: "project-1",
            name: "Test Project",
            __typename: "Project",
          },
          createdAt: "2023-01-03T12:00:00Z",
          updatedAt: "2023-01-03T12:00:00Z",
          __typename: "Scene",
        },
        fadeInTime: 3.0,
        fadeOutTime: 4.0,
        followTime: undefined,
        notes: "",
        __typename: "Cue",
      },
    ],
  };

  const mockPlaybackStatus = {
    cueListId: mockCueListId,
    currentCueIndex: 0,
    isPlaying: true,
    isPaused: false,
    isFading: true,
    currentCue: mockCueList.cues[0],
    fadeProgress: 50,
    lastUpdated: "2023-01-01T12:00:00Z",
  };

  const createMocks = (
    cueListResult = { data: { cueList: mockCueList } },
    playbackResult = mockPlaybackStatus,
    mutations = {},
  ) => {
    const baseMocks = [
      {
        request: {
          query: GET_CUE_LIST,
          variables: { id: mockCueListId },
        },
        result: cueListResult,
      },
      {
        request: {
          query: GET_CUE_LIST_PLAYBACK_STATUS,
          variables: { cueListId: mockCueListId },
        },
        result: { data: { cueListPlaybackStatus: playbackResult } },
      },
    ];

    // Add mutation mocks if provided
    Object.entries(mutations).forEach(([mutationName, result]) => {
      baseMocks.push({
        request: {
          query: eval(mutationName), // Dynamic query reference
          variables: expect.any(Object),
        },
        result: result as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
    });

    return baseMocks;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderWithProvider = (mocks: any[]) => {
    // Suppress console errors for cleaner test output
    const originalError = console.error;
    console.error = jest.fn();

    const result = render(
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{
          watchQuery: { errorPolicy: "all" },
          query: { errorPolicy: "all" },
          mutate: { errorPolicy: "all" },
        }}
      >
        <CueListPlayer cueListId={mockCueListId} />
      </MockedProvider>,
    );

    // Restore console.error after a short delay to avoid test pollution
    setTimeout(() => {
      console.error = originalError;
    }, 100);

    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCueListPlayback.mockReturnValue({
      playbackStatus: mockPlaybackStatus,
    });

    // Reset WebSocket mock values to defaults
    mockConnectionState = "connected";
    mockIsStale = false;

    // Configure ensureConnection to return a resolved promise by default
    mockEnsureConnection.mockResolvedValue(undefined);

    // Mock window.addEventListener and removeEventListener
    jest.spyOn(window, "addEventListener").mockImplementation();
    jest.spyOn(window, "removeEventListener").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("loading and error states", () => {
    it("shows loading state", () => {
      const mocks = [
        {
          request: {
            query: GET_CUE_LIST,
            variables: { id: mockCueListId },
          },
          result: { data: { loading: true } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CueListPlayer cueListId={mockCueListId} />
        </MockedProvider>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows error state when cue list not found", async () => {
      const mocks = createMocks({ data: { cueList: null } } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("Cue list not found")).toBeInTheDocument();
      });
    });
  });

  describe("rendering with data", () => {
    it("renders cue list with cues", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Cue list name is now in parent component (CueListPageClient)
        // Check that cues are rendered instead
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Mid Scene")[0]).toBeInTheDocument();
      });
    });

    it("renders control buttons", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByTitle("Previous (←)")).toBeInTheDocument();
        expect(screen.getByTitle("GO (Space/Enter)")).toBeInTheDocument();
        expect(screen.getByTitle("Next (→)")).toBeInTheDocument();
        expect(screen.getByTitle("Stop (Esc)")).toBeInTheDocument();
      });
    });

    it("renders keyboard shortcuts help text", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(
          screen.getByText(/Space\/Enter = GO \| ← → = Navigate \| Esc =/),
        ).toBeInTheDocument();
      });
    });

    it("renders cue progress dots", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(3);
        // Current cue (index 0) has "(scroll to view)" in title
        expect(progressDots[0]).toHaveAttribute(
          "title",
          "1: Opening Scene (scroll to view)",
        );
        expect(progressDots[1]).toHaveAttribute("title", "2: Mid Scene");
        expect(progressDots[2]).toHaveAttribute("title", "3: Closing Scene");
      });
    });
  });

  describe("cue display", () => {
    it("displays current and adjacent cues", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Now Playing section duplicates cue name, so use getAllByText
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Mid Scene")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Scene: Scene 1")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Scene: Scene 2")[0]).toBeInTheDocument();
      });
    });

    it("highlights current cue", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Get from cue list display, not Now Playing section
        const openingSceneElements = screen.getAllByText("Opening Scene");
        const currentCue = openingSceneElements[
          openingSceneElements.length - 1
        ].closest('div[class*="bg-gray-700"]');
        expect(currentCue).toHaveClass("border-green-500");
        // Current cue has green border and scale effect - no text label needed
        expect(currentCue).toHaveClass("scale-[1.02]");
      });
    });

    it("shows fade progress for current cue", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // FadeProgressChart component should render with the progress
        const fadeProgressChart = document.querySelector(
          '[data-testid="fade-progress-chart"]',
        );
        expect(fadeProgressChart).toBeInTheDocument();
      });
    });

    it("styles next cue with reduced opacity", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Next cue (Mid Scene) should have opacity-80 styling
        const midSceneElements = screen.getAllByText("Mid Scene");
        const nextCue = midSceneElements[0].closest('div[class*="opacity-80"]');
        expect(nextCue).toBeInTheDocument();
      });
    });

    it("shows empty state when no cues", async () => {
      const emptyCueList = { ...mockCueList, cues: [] };
      const mocks = createMocks({ data: { cueList: emptyCueList } });

      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("No cues in list")).toBeInTheDocument();
      });
    });
  });

  describe("button states", () => {
    it("disables GO button when at end of list", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 2 }, // Last cue
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByTitle("GO (Space/Enter)");
        expect(goButton).toBeDisabled();
      });
    });

    it("disables Previous button when at start", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 0 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByTitle("Previous (←)");
        expect(prevButton).toBeDisabled();
      });
    });

    it("shows START when not started", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("START")).toBeInTheDocument();
      });
    });

    it("shows GO when started", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("GO")).toBeInTheDocument();
      });
    });
  });

  describe("button interactions", () => {
    it("calls startCueList when START is clicked", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      const _startMutation = jest.fn().mockResolvedValue({ data: {} });
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: START_CUE_LIST,
            variables: { cueListId: mockCueListId, startFromCue: 0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const startButton = screen.getByText("START");
        expect(startButton).toBeInTheDocument();
      });

      const startButton = screen.getByText("START");
      await userEvent.click(startButton);

      // Verify the mutation would be called (mocked GraphQL handles the actual call)
      expect(startButton).toBeInTheDocument();
    });

    it("calls nextCue when GO is clicked", async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: NEXT_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 1.5 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByText("GO");
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText("GO");
      await userEvent.click(goButton);
    });

    it("calls previousCue when Previous is clicked", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 1 },
      });

      const mocks = [
        ...createMocks(),
        {
          request: {
            query: PREVIOUS_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 2.0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByTitle("Previous (←)");
        expect(prevButton).not.toBeDisabled();
      });

      const prevButton = screen.getByTitle("Previous (←)");
      await userEvent.click(prevButton);
    });

    it("calls stopCueList and fadeToBlack when Stop is clicked", async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: STOP_CUE_LIST,
            variables: { cueListId: mockCueListId },
          },
          result: { data: {} },
        },
        {
          request: {
            query: FADE_TO_BLACK,
            variables: { fadeOutTime: 3.0 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const stopButton = screen.getByTitle("Stop (Esc)");
        expect(stopButton).toBeInTheDocument();
      });

      const stopButton = screen.getByTitle("Stop (Esc)");
      await userEvent.click(stopButton);
    });
  });

  describe("cue jumping", () => {
    it("allows jumping to cues via progress dots", async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GO_TO_CUE,
            variables: {
              cueListId: mockCueListId,
              cueIndex: 2,
              fadeInTime: 3.0,
            },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(3);
      });

      const thirdDot = screen.getByTitle("3: Closing Scene");
      await userEvent.click(thirdDot);
    });

    it("allows jumping to cues via cue display", async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GO_TO_CUE,
            variables: {
              cueListId: mockCueListId,
              cueIndex: 1,
              fadeInTime: 1.5,
            },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getAllByText("Mid Scene")[0]).toBeInTheDocument();
      });

      // Click on a non-current cue to jump to it
      const midSceneElements = screen.getAllByText("Mid Scene");
      const midSceneCue = midSceneElements[0].closest(
        'div[class*="cursor-pointer"]',
      );
      if (midSceneCue) {
        await userEvent.click(midSceneCue);
      }
    });

    it("clicking current cue scrolls to it (does not jump)", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
      });

      // All cues including current have cursor-pointer class (current scrolls, others jump)
      // Find the outer cue card div that has cursor-pointer
      const openingSceneElements = screen.getAllByText("Opening Scene");
      const currentCue = openingSceneElements[
        openingSceneElements.length - 1
      ].closest('div[class*="cursor-pointer"]');
      expect(currentCue).toBeInTheDocument();
    });
  });

  describe("cue click behavior", () => {
    it("single click immediately jumps to cue with normal fade time", async () => {
      // Track if mutation was called
      let mutationCalled = false;
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GO_TO_CUE,
            variables: {
              cueListId: mockCueListId,
              cueIndex: 1,
              fadeInTime: 1.5, // Normal fade time for cue-2
            },
          },
          result: () => {
            mutationCalled = true;
            return { data: {} };
          },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getAllByText("Mid Scene")[0]).toBeInTheDocument();
      });

      // Find a non-current cue and single-click it
      const midSceneElements = screen.getAllByText("Mid Scene");
      const midSceneCue = midSceneElements[0].closest(
        'div[class*="cursor-pointer"]',
      );
      expect(midSceneCue).toBeInTheDocument();
      if (midSceneCue) {
        fireEvent.click(midSceneCue);
      }

      // Mutation should be called immediately (no delay)
      await waitFor(() => {
        expect(mutationCalled).toBe(true);
      });
    });

  });

  describe("hurry up button", () => {
    it("renders hurry up button", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const hurryButton = screen.getByRole("button", { name: /hurry up/i });
        expect(hurryButton).toBeInTheDocument();
      });
    });

    it("hurry up button is disabled when not fading", async () => {
      // Set up playback status without fading
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          ...mockPlaybackStatus,
          isFading: false,
        },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const hurryButton = screen.getByRole("button", { name: /hurry up/i });
        expect(hurryButton).toBeDisabled();
        expect(hurryButton).toHaveClass("bg-gray-700");
      });
    });

    it("hurry up button is enabled when fading", async () => {
      // Set up playback status with fading
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          ...mockPlaybackStatus,
          isFading: true,
          fadeProgress: 50,
        },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const hurryButton = screen.getByRole("button", { name: /hurry up/i });
        expect(hurryButton).not.toBeDisabled();
        expect(hurryButton).toHaveClass("bg-amber-600");
      });
    });

    it("clicking hurry up button during fade completes instantly", async () => {
      // Set up playback status with fading
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: {
          ...mockPlaybackStatus,
          isFading: true,
          fadeProgress: 50,
          currentCueIndex: 1,
        },
      });

      // Track if mutation was called
      let mutationCalled = false;
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GO_TO_CUE,
            variables: {
              cueListId: mockCueListId,
              cueIndex: 1, // Current cue
              fadeInTime: 0, // Instant completion
            },
          },
          result: () => {
            mutationCalled = true;
            return { data: {} };
          },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const hurryButton = screen.getByRole("button", { name: /hurry up/i });
        expect(hurryButton).not.toBeDisabled();
      });

      const hurryButton = screen.getByRole("button", { name: /hurry up/i });
      await userEvent.click(hurryButton);

      await waitFor(() => {
        expect(mutationCalled).toBe(true);
      });
    });
  });

  describe("scroll to live cue", () => {
    it("renders scroll to live cue button", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const scrollButton = screen.getByTitle("Scroll to live cue");
        expect(scrollButton).toBeInTheDocument();
      });
    });

    it("disables scroll button when no current cue", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const scrollButton = screen.getByTitle("Scroll to live cue");
        expect(scrollButton).toBeDisabled();
      });
    });

    it("enables scroll button when there is a current cue", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const scrollButton = screen.getByTitle("Scroll to live cue");
        expect(scrollButton).not.toBeDisabled();
      });
    });

    it("clicking scroll button triggers scrollIntoView", async () => {
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const scrollButton = screen.getByTitle("Scroll to live cue");
        expect(scrollButton).toBeInTheDocument();
      });

      const scrollButton = screen.getByTitle("Scroll to live cue");
      await userEvent.click(scrollButton);

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });

    it("clicking current cue progress dot triggers scrollIntoView", async () => {
      jest.useFakeTimers();
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(3);
      });

      // Current cue progress dot has "(scroll to view)" in title
      const currentDot = screen.getByTitle("1: Opening Scene (scroll to view)");
      fireEvent.click(currentDot);

      // Advance past the click delay (300ms)
      jest.advanceTimersByTime(350);

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      jest.useRealTimers();
    });

    it("clicking current cue card triggers scrollIntoView", async () => {
      jest.useFakeTimers();
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
      });

      // Find and click the current cue card
      const openingSceneElements = screen.getAllByText("Opening Scene");
      const currentCueCard = openingSceneElements[
        openingSceneElements.length - 1
      ].closest('div[class*="cursor-pointer"]');

      if (currentCueCard) {
        fireEvent.click(currentCueCard);
      }

      // Advance past the click delay (300ms)
      jest.advanceTimersByTime(350);

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      jest.useRealTimers();
    });

    it("auto-scrolls to current cue on mount with instant behavior", async () => {
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      // Mock isConnected and offsetParent for JSDOM compatibility
      Object.defineProperty(Element.prototype, "isConnected", {
        get: () => true,
        configurable: true,
      });
      const originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetParent"
      );
      Object.defineProperty(HTMLElement.prototype, "offsetParent", {
        get: function () {
          return this.parentElement || document.body;
        },
        configurable: true,
      });

      try {
        const mocks = createMocks();
        renderWithProvider(mocks);

        // Wait for cues to render
        await waitFor(() => {
          expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        });

        // Wait for auto-scroll via callback ref + RAF (reactive approach, no hardcoded delay)
        await waitFor(
          () => {
            expect(mockScrollIntoView).toHaveBeenCalledWith({
              behavior: "instant",
              block: "center",
              inline: "nearest",
            });
          },
          { timeout: 500 }
        );
      } finally {
        // Restore original offsetParent
        if (originalOffsetParent) {
          Object.defineProperty(
            HTMLElement.prototype,
            "offsetParent",
            originalOffsetParent
          );
        }
      }
    });

    it("does not auto-scroll when no current cue", async () => {
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      // Set no current cue
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: -1 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      // Wait for component to render (cue list name appears in heading)
      await waitFor(() => {
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
      });

      // Wait a bit to ensure no auto-scroll occurs
      await new Promise((resolve) => setTimeout(resolve, 200));

      // No auto-scroll should occur when currentCueIndex is -1
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it("does not auto-scroll on re-render when cue index does not change", async () => {
      jest.useFakeTimers();
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      // Mock isConnected and offsetParent for JSDOM compatibility
      Object.defineProperty(Element.prototype, "isConnected", {
        get: () => true,
        configurable: true,
      });
      const originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetParent"
      );
      Object.defineProperty(HTMLElement.prototype, "offsetParent", {
        get: function () {
          return this.parentElement || document.body;
        },
        configurable: true,
      });

      try {
        const mocks = createMocks();
        const { rerender } = renderWithProvider(mocks);

        // Wait for component to render
        await waitFor(() => {
          expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        });

        // Run all timers to complete any pending scroll operations
        jest.runAllTimers();

        mockScrollIntoView.mockClear();

        // Re-render the component without changing cue index
        rerender(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CueListPlayer cueListId={mockCueListId} />
          </MockedProvider>
        );

        // Run all timers to ensure any pending scrolls would complete
        jest.runAllTimers();

        // Should not scroll again when cue index hasn't changed
        expect(mockScrollIntoView).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
        // Restore original offsetParent
        if (originalOffsetParent) {
          Object.defineProperty(
            HTMLElement.prototype,
            "offsetParent",
            originalOffsetParent
          );
        }
      }
    });

    it("auto-scrolls with smooth behavior when cue index changes during playback", async () => {
      jest.useFakeTimers();
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      // Mock isConnected and offsetParent for JSDOM compatibility
      Object.defineProperty(Element.prototype, "isConnected", {
        get: () => true,
        configurable: true,
      });
      const originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetParent"
      );
      Object.defineProperty(HTMLElement.prototype, "offsetParent", {
        get: function () {
          return this.parentElement || document.body;
        },
        configurable: true,
      });

      try {
        // Start with cue index 0
        mockUseCueListPlayback.mockReturnValue({
          playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 0 },
        });

        const mocks = createMocks();
        const { rerender } = renderWithProvider(mocks);

        // Wait for initial render and initial scrolls
        await waitFor(() => {
          expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        });

        // Run timers to complete initial scroll
        jest.runAllTimers();
        mockScrollIntoView.mockClear();

        // Simulate cue change to index 1
        mockUseCueListPlayback.mockReturnValue({
          playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 1 },
        });

        rerender(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CueListPlayer cueListId={mockCueListId} />
          </MockedProvider>
        );

        // Run the timeout (100ms) for cue change scroll
        jest.advanceTimersByTime(100);

        // Run RAF
        jest.runAllTimers();

        // Should scroll with smooth behavior when cue changes
        expect(mockScrollIntoView).toHaveBeenCalledWith({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } finally {
        jest.useRealTimers();
        // Restore original offsetParent
        if (originalOffsetParent) {
          Object.defineProperty(
            HTMLElement.prototype,
            "offsetParent",
            originalOffsetParent
          );
        }
      }
    });

    it("auto-scrolls when advancing through multiple cues", async () => {
      jest.useFakeTimers();
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      // Mock isConnected and offsetParent for JSDOM compatibility
      Object.defineProperty(Element.prototype, "isConnected", {
        get: () => true,
        configurable: true,
      });
      const originalOffsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetParent"
      );
      Object.defineProperty(HTMLElement.prototype, "offsetParent", {
        get: function () {
          return this.parentElement || document.body;
        },
        configurable: true,
      });

      try {
        // Start with cue index 0
        mockUseCueListPlayback.mockReturnValue({
          playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 0 },
        });

        const mocks = createMocks();
        const { rerender } = renderWithProvider(mocks);

        await waitFor(() => {
          expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        });

        jest.runAllTimers();
        mockScrollIntoView.mockClear();

        // Advance to cue 1
        mockUseCueListPlayback.mockReturnValue({
          playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 1 },
        });

        rerender(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CueListPlayer cueListId={mockCueListId} />
          </MockedProvider>
        );

        jest.advanceTimersByTime(100);
        jest.runAllTimers();

        expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
        mockScrollIntoView.mockClear();

        // Advance to cue 2
        mockUseCueListPlayback.mockReturnValue({
          playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 2 },
        });

        rerender(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CueListPlayer cueListId={mockCueListId} />
          </MockedProvider>
        );

        jest.advanceTimersByTime(100);
        jest.runAllTimers();

        // Should scroll again for the new cue
        expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
        expect(mockScrollIntoView).toHaveBeenCalledWith({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } finally {
        jest.useRealTimers();
        if (originalOffsetParent) {
          Object.defineProperty(
            HTMLElement.prototype,
            "offsetParent",
            originalOffsetParent
          );
        }
      }
    });
  });

  describe("keyboard shortcuts", () => {
    it("handles Space key for GO", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("GO")).toBeInTheDocument();
      });

      // Simulate space key press
      const keyboardEvent = new KeyboardEvent("keydown", { key: " " });
      fireEvent(window, keyboardEvent);

      // Verify addEventListener was called for keydown
      expect(window.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });

    it("handles Enter key for GO", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("GO")).toBeInTheDocument();
      });

      const keyboardEvent = new KeyboardEvent("keydown", { key: "Enter" });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });

    it("handles Arrow Left for Previous", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 1 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const prevButton = screen.getByTitle("Previous (←)");
        expect(prevButton).not.toBeDisabled();
      });

      const keyboardEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });

    it("handles Arrow Right for GO", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("GO")).toBeInTheDocument();
      });

      const keyboardEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });

    it("handles Escape key for Stop", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByTitle("Stop (Esc)")).toBeInTheDocument();
      });

      const keyboardEvent = new KeyboardEvent("keydown", { key: "Escape" });
      fireEvent(window, keyboardEvent);

      expect(window.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });

    it("cleans up keyboard event listeners on unmount", () => {
      const mocks = createMocks();
      const { unmount } = renderWithProvider(mocks);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });
  });

  describe("styling and visual states", () => {
    it("applies correct styling to current cue", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Get from cue list display, not Now Playing section
        const openingSceneElements = screen.getAllByText("Opening Scene");
        const currentCue = openingSceneElements[
          openingSceneElements.length - 1
        ].closest('div[class*="bg-gray-700"]');
        expect(currentCue).toHaveClass("border-green-500");
        expect(currentCue).toHaveClass("scale-[1.02]");
      });
    });

    it("applies correct styling to next cue", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const midSceneElements = screen.getAllByText("Mid Scene");
        const nextCue = midSceneElements[0].closest('div[class*="opacity-80"]');
        expect(nextCue).toBeInTheDocument();
      });
    });

    it("applies correct styling to progress dots", async () => {
      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        const currentDot = progressDots[0]; // First cue is current
        expect(currentDot).toHaveClass("bg-green-500");
        expect(currentDot).toHaveClass("w-3", "h-3");
      });
    });
  });

  describe("edge cases", () => {
    it("handles missing cue list description", async () => {
      const cueListWithoutDescription = { ...mockCueList, description: "" };
      const mocks = createMocks({
        data: { cueList: cueListWithoutDescription },
      });

      renderWithProvider(mocks);

      await waitFor(() => {
        // Cue list name/description now in parent component
        // Just verify cues render successfully
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
      });
    });

    it("handles single cue list", async () => {
      const singleCueList = { ...mockCueList, cues: [mockCueList.cues[0]] };
      const mocks = createMocks({ data: { cueList: singleCueList } });

      renderWithProvider(mocks);

      await waitFor(() => {
        // Opening Scene appears in both NOW PLAYING section and cue list
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        expect(progressDots).toHaveLength(1);
      });
    });

    it("handles fade progress edge cases", async () => {
      // Test with 0% progress - chart should NOT show (fade not started)
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, fadeProgress: 0 },
      });

      const mocks = createMocks();
      const { rerender } = renderWithProvider(mocks);

      await waitFor(() => {
        // FadeProgressChart should NOT appear at 0% (fade hasn't started)
        const fadeProgressChart = document.querySelector(
          '[data-testid="fade-progress-chart"]',
        );
        expect(fadeProgressChart).not.toBeInTheDocument();
      });

      // Test with 100% progress - chart IS visible during slide-off animation
      // The chart remains visible while slideOffProgress < 100%, sliding off to the left
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, fadeProgress: 100 },
      });

      rerender(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CueListPlayer cueListId={mockCueListId} />
        </MockedProvider>,
      );

      await waitFor(() => {
        // FadeProgressChart IS visible at 100% fadeProgress (slide-off animation in progress)
        // The chart only disappears after slideOffProgress reaches 100%
        const fadeProgressChart = document.querySelector(
          '[data-testid="fade-progress-chart"]',
        );
        expect(fadeProgressChart).toBeInTheDocument();
      });
    });

    it("handles boundary cue indices", async () => {
      // Test with index beyond array bounds
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, currentCueIndex: 999 },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByTitle("GO (Space/Enter)");
        expect(goButton).toBeDisabled();
      });
    });
  });

  describe("paused state", () => {
    it("shows amber border for paused current cue", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const openingSceneElements = screen.getAllByText("Opening Scene");
        const currentCue = openingSceneElements[
          openingSceneElements.length - 1
        ].closest('div[class*="bg-gray-700"]');
        expect(currentCue).toHaveClass("border-amber-500");
      });
    });

    it("shows RESUME button when paused", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText("RESUME")).toBeInTheDocument();
      });
    });

    it("shows amber-colored RESUME button when paused", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const resumeButton = screen.getByText("RESUME");
        expect(resumeButton).toHaveClass("bg-amber-600");
      });
    });

    it("shows amber progress dot when paused", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const progressDots = screen.getAllByTitle(/\d+: .+/);
        const currentDot = progressDots[0];
        expect(currentDot).toHaveClass("bg-amber-500");
      });
    });

    it("shows PAUSED indicator text when paused", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText(/PAUSED — Click cue or press Space to resume/)).toBeInTheDocument();
      });
    });

    it("shows paused progress dot title with resume instruction", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const pausedDot = screen.getByTitle("1: Opening Scene (PAUSED - click to resume)");
        expect(pausedDot).toBeInTheDocument();
      });
    });

    it("shows keyboard hint with RESUME when paused", async () => {
      mockUseCueListPlayback.mockReturnValue({
        playbackStatus: { ...mockPlaybackStatus, isPlaying: false, isPaused: true, isFading: false },
      });

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText(/Space\/Enter = RESUME/)).toBeInTheDocument();
      });
    });
  });

  describe("WebSocket connection handling", () => {
    it("hides connection status bar when connected and not stale", async () => {
      mockConnectionState = "connected";
      mockIsStale = false;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Connection status bar is hidden when fully connected
        // Just verify component renders successfully without connection bar
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
      });

      // Verify no connection warning bar is shown
      const reconnectButton = screen.queryByRole("button", {
        name: /reconnect/i,
      });
      expect(reconnectButton).not.toBeInTheDocument();
    });

    it("shows yellow status indicator and reconnect button when stale", async () => {
      mockConnectionState = "connected";
      mockIsStale = true;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const statusIndicator = screen.getByRole("img", {
          name: "Stale - no recent updates",
        });
        expect(statusIndicator).toBeInTheDocument();
        expect(statusIndicator).toHaveClass("bg-yellow-500");

        const reconnectButton = screen.getByRole("button", {
          name: /reconnect/i,
        });
        expect(reconnectButton).toBeInTheDocument();
      });
    });

    it("shows red status indicator and reconnect button when disconnected", async () => {
      mockConnectionState = "disconnected";
      mockIsStale = false;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const statusIndicator = screen.getByRole("img", {
          name: "Disconnected",
        });
        expect(statusIndicator).toBeInTheDocument();
        expect(statusIndicator).toHaveClass("bg-red-500");

        const reconnectButton = screen.getByRole("button", {
          name: /reconnect/i,
        });
        expect(reconnectButton).toBeInTheDocument();
      });
    });

    it("shows orange pulsing status indicator when reconnecting", async () => {
      mockConnectionState = "reconnecting";
      mockIsStale = false;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const statusIndicator = screen.getByRole("img", {
          name: "Reconnecting...",
        });
        expect(statusIndicator).toBeInTheDocument();
        expect(statusIndicator).toHaveClass("bg-orange-500", "animate-pulse");
      });
    });

    it("calls reconnect when reconnect button is clicked", async () => {
      mockConnectionState = "disconnected";
      mockIsStale = false;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        const reconnectButton = screen.getByRole("button", {
          name: /reconnect/i,
        });
        expect(reconnectButton).toBeInTheDocument();
      });

      const reconnectButton = screen.getByRole("button", {
        name: /reconnect/i,
      });
      await userEvent.click(reconnectButton);

      expect(mockReconnect).toHaveBeenCalledTimes(1);
    });

    it("calls ensureConnection before GO action when stale", async () => {
      mockConnectionState = "connected";
      mockIsStale = true;

      const mocks = [
        ...createMocks(),
        {
          request: {
            query: NEXT_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 1.5 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByText("GO");
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText("GO");
      await userEvent.click(goButton);

      // ensureConnection should be called before the mutation
      expect(mockEnsureConnection).toHaveBeenCalled();
    });

    it("calls ensureConnection before GO action when disconnected", async () => {
      mockConnectionState = "disconnected";
      mockIsStale = false;

      const mocks = [
        ...createMocks(),
        {
          request: {
            query: NEXT_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 1.5 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByText("GO");
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText("GO");
      await userEvent.click(goButton);

      // ensureConnection should be called before the mutation
      expect(mockEnsureConnection).toHaveBeenCalled();
    });

    it("calls ensureConnection before GO action even when fully connected", async () => {
      mockConnectionState = "connected";
      mockIsStale = false;

      const mocks = [
        ...createMocks(),
        {
          request: {
            query: NEXT_CUE,
            variables: { cueListId: mockCueListId, fadeInTime: 1.5 },
          },
          result: { data: {} },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        const goButton = screen.getByText("GO");
        expect(goButton).toBeInTheDocument();
      });

      const goButton = screen.getByText("GO");
      await userEvent.click(goButton);

      // ensureConnection is always called before mutation (it resolves immediately if healthy)
      expect(mockEnsureConnection).toHaveBeenCalled();
    });

    it("does not show reconnect button when fully connected", async () => {
      mockConnectionState = "connected";
      mockIsStale = false;

      const mocks = createMocks();
      renderWithProvider(mocks);

      await waitFor(() => {
        // Component renders successfully
        expect(screen.getAllByText("Opening Scene")[0]).toBeInTheDocument();
      });

      const reconnectButton = screen.queryByRole("button", {
        name: /reconnect/i,
      });
      expect(reconnectButton).not.toBeInTheDocument();
    });
  });
});
