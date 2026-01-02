import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import DashboardPage from "../page";
import { GET_PROJECT_FIXTURES } from "@/graphql/fixtures";
import { GET_PROJECT_SCENES } from "@/graphql/scenes";
import { GET_PROJECT_SCENE_BOARDS } from "@/graphql/sceneBoards";
import { GET_PROJECT_CUE_LISTS } from "@/graphql/cueLists";
import { GET_SYSTEM_INFO } from "@/graphql/settings";
import {
  GET_GLOBAL_PLAYBACK_STATUS,
  GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
} from "@/graphql/cueLists";
import { FixtureType } from "@/types";

// Mock the ProjectContext
const mockProject = {
  id: "project-1",
  name: "Test Project",
  description: "",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  fixtures: [],
  scenes: [],
  cueLists: [],
  users: [],
};

jest.mock("@/contexts/ProjectContext", () => ({
  useProject: jest.fn(() => ({
    currentProject: mockProject,
    loading: false,
  })),
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const mockFixtures = [
  {
    id: "fixture-1",
    name: "LED PAR 1",
    description: "",
    universe: 1,
    startChannel: 1,
    tags: [],
    projectOrder: 0,
    createdAt: "2024-01-01",
    definitionId: "def-1",
    manufacturer: "Chauvet",
    model: "SlimPAR Pro",
    type: FixtureType.LED_PAR,
    modeName: "8-channel",
    channelCount: 8,
    channels: [],
  },
  {
    id: "fixture-2",
    name: "Moving Head 1",
    description: "",
    universe: 1,
    startChannel: 9,
    tags: [],
    projectOrder: 1,
    createdAt: "2024-01-01",
    definitionId: "def-2",
    manufacturer: "ADJ",
    model: "Focus Spot",
    type: FixtureType.MOVING_HEAD,
    modeName: "16-channel",
    channelCount: 16,
    channels: [],
  },
];

const mockScenes = [
  {
    id: "scene-1",
    name: "Scene A",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    fixtureValues: [],
  },
  {
    id: "scene-2",
    name: "Scene B",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    fixtureValues: [],
  },
  {
    id: "scene-3",
    name: "Scene C",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    fixtureValues: [],
  },
];

const mockSceneBoards = [
  {
    id: "board-1",
    name: "Main Board",
    description: "",
    defaultFadeTime: 2,
    canvasWidth: 2000,
    canvasHeight: 2000,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    buttons: [{ id: "btn-1" }, { id: "btn-2" }],
  },
  {
    id: "board-2",
    name: "Quick Access",
    description: "",
    defaultFadeTime: 1,
    canvasWidth: 2000,
    canvasHeight: 2000,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    buttons: [],
  },
];

const mockCueLists = [
  {
    id: "cue-list-1",
    name: "Show 1",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    cues: [{ id: "cue-1" }, { id: "cue-2" }],
  },
  {
    id: "cue-list-2",
    name: "Show 2",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    cues: [{ id: "cue-3" }],
  },
];

const mockSystemInfo = {
  artnetBroadcastAddress: "192.168.1.255",
  artnetEnabled: true,
  fadeUpdateRateHz: 60,
};

const mockPlaybackStatus = {
  isPlaying: false,
  isFading: false,
  cueListId: null,
  cueListName: null,
  currentCueIndex: null,
  cueCount: null,
  currentCueName: null,
  fadeProgress: null,
  lastUpdated: "2024-01-01",
};

const createMocks = (
  options: {
    fixtures?: typeof mockFixtures;
    scenes?: typeof mockScenes;
    sceneBoards?: typeof mockSceneBoards;
    cueLists?: typeof mockCueLists;
    systemInfo?: typeof mockSystemInfo;
    playbackStatus?: typeof mockPlaybackStatus;
  } = {},
) => [
  {
    request: {
      query: GET_PROJECT_FIXTURES,
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        project: {
          id: "project-1",
          fixtures: options.fixtures ?? mockFixtures,
        },
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
          id: "project-1",
          scenes: options.scenes ?? mockScenes,
        },
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_SCENE_BOARDS,
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        sceneBoards: options.sceneBoards ?? mockSceneBoards,
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_CUE_LISTS,
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        project: {
          id: "project-1",
          cueLists: options.cueLists ?? mockCueLists,
        },
      },
    },
  },
  {
    request: {
      query: GET_SYSTEM_INFO,
    },
    result: {
      data: {
        systemInfo: options.systemInfo ?? mockSystemInfo,
      },
    },
  },
  {
    request: {
      query: GET_GLOBAL_PLAYBACK_STATUS,
    },
    result: {
      data: {
        globalPlaybackStatus: options.playbackStatus ?? mockPlaybackStatus,
      },
    },
  },
];

// Create subscription mock
const createSubscriptionMock = (playbackStatus = mockPlaybackStatus) => ({
  request: {
    query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
  },
  result: {
    data: {
      globalPlaybackStatusUpdated: playbackStatus,
    },
  },
});

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the dashboard page with title", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText(/Overview of your lighting setup for Test Project/),
      ).toBeInTheDocument();
    });

    it("renders all dashboard cards", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("fixtures-card")).toBeInTheDocument();
      });

      expect(screen.getByTestId("scenes-card")).toBeInTheDocument();
      expect(screen.getByTestId("scene-boards-card")).toBeInTheDocument();
      expect(screen.getByTestId("cue-lists-card")).toBeInTheDocument();
      expect(screen.getByTestId("settings-card")).toBeInTheDocument();
    });
  });

  describe("fixtures card", () => {
    it("displays fixture count and type breakdown", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("fixtures-card")).toBeInTheDocument();
      });

      // Check count
      const fixturesCard = screen.getByTestId("fixtures-card");
      expect(fixturesCard).toHaveTextContent("2");

      // Check type breakdown
      expect(fixturesCard).toHaveTextContent("1 LED PAR");
      expect(fixturesCard).toHaveTextContent("1 Moving Head");
    });

    it("displays fixture names", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("LED PAR 1")).toBeInTheDocument();
      });

      expect(screen.getByText("Moving Head 1")).toBeInTheDocument();
    });

    it("shows empty state when no fixtures", async () => {
      const mocks = createMocks({ fixtures: [] });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("fixtures-card")).toBeInTheDocument();
      });

      expect(screen.getByText("No fixtures configured")).toBeInTheDocument();
    });
  });

  describe("scenes card", () => {
    it("displays scene count and names", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("scenes-card")).toBeInTheDocument();
      });

      const scenesCard = screen.getByTestId("scenes-card");
      expect(scenesCard).toHaveTextContent("3");
      expect(screen.getByText("Scene A")).toBeInTheDocument();
      expect(screen.getByText("Scene B")).toBeInTheDocument();
      expect(screen.getByText("Scene C")).toBeInTheDocument();
    });

    it("shows empty state when no scenes", async () => {
      const mocks = createMocks({ scenes: [] });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("scenes-card")).toBeInTheDocument();
      });

      expect(screen.getByText("No scenes created")).toBeInTheDocument();
    });
  });

  describe("scene boards card", () => {
    it("displays scene board count and button counts", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("scene-boards-card")).toBeInTheDocument();
      });

      const boardsCard = screen.getByTestId("scene-boards-card");
      expect(boardsCard).toHaveTextContent("2");
      expect(boardsCard).toHaveTextContent("Main Board");
      expect(boardsCard).toHaveTextContent("(2 buttons)");
      expect(boardsCard).toHaveTextContent("Quick Access");
      expect(boardsCard).toHaveTextContent("(0 buttons)");
    });

    it("renders links to specific scene boards", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("scene-boards-card")).toBeInTheDocument();
      });

      const mainBoardLink = screen.getByRole("link", { name: /Main Board/i });
      expect(mainBoardLink).toHaveAttribute(
        "href",
        "/scene-board?board=board-1",
      );
    });
  });

  describe("cue lists card", () => {
    it("displays cue list count and cue counts", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("cue-lists-card")).toBeInTheDocument();
      });

      const cueListsCard = screen.getByTestId("cue-lists-card");
      expect(cueListsCard).toHaveTextContent("2");
      expect(cueListsCard).toHaveTextContent("Show 1");
      expect(cueListsCard).toHaveTextContent("(2 cues)");
      expect(cueListsCard).toHaveTextContent("Show 2");
      expect(cueListsCard).toHaveTextContent("(1 cues)");
    });

    it("renders links to specific cue lists", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("cue-lists-card")).toBeInTheDocument();
      });

      const show1Link = screen.getByRole("link", { name: /Show 1/i });
      expect(show1Link).toHaveAttribute("href", "/cue-lists/cue-list-1");
    });

    it("shows currently playing cue list with indicator", async () => {
      const playingStatus = {
        ...mockPlaybackStatus,
        isPlaying: true,
        cueListId: "cue-list-1",
        cueListName: "Show 1",
        currentCueIndex: 0,
        cueCount: 2,
      };

      const mocks = createMocks({ playbackStatus: playingStatus });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock(playingStatus)]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("cue-lists-card")).toBeInTheDocument();
      });

      // The playing cue list should have green styling
      const show1Link = screen.getByRole("link", { name: /Show 1/i });
      expect(show1Link).toHaveClass("text-green-600");
    });
  });

  describe("settings card", () => {
    it("displays ArtNet status", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("settings-card")).toBeInTheDocument();
      });

      const settingsCard = screen.getByTestId("settings-card");
      expect(settingsCard).toHaveTextContent("ArtNet Output");
      expect(settingsCard).toHaveTextContent("Enabled");
      expect(settingsCard).toHaveTextContent("192.168.1.255");
    });

    it("displays fade update rate", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("settings-card")).toBeInTheDocument();
      });

      const settingsCard = screen.getByTestId("settings-card");
      expect(settingsCard).toHaveTextContent("Fade Update Rate");
      expect(settingsCard).toHaveTextContent("60 Hz");
    });

    it("shows disabled ArtNet status", async () => {
      const mocks = createMocks({
        systemInfo: { ...mockSystemInfo, artnetEnabled: false },
      });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("settings-card")).toBeInTheDocument();
      });

      const settingsCard = screen.getByTestId("settings-card");
      expect(settingsCard).toHaveTextContent("Disabled");
    });
  });

  describe("navigation links", () => {
    it("renders links to all main pages", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      // Check card title links
      expect(screen.getByRole("link", { name: "Fixtures" })).toHaveAttribute(
        "href",
        "/fixtures",
      );
      expect(screen.getByRole("link", { name: "Scenes" })).toHaveAttribute(
        "href",
        "/scenes",
      );
      expect(
        screen.getByRole("link", { name: "Scene Boards" }),
      ).toHaveAttribute("href", "/scene-board");
      expect(screen.getByRole("link", { name: "Cue Lists" })).toHaveAttribute(
        "href",
        "/cue-lists",
      );
      expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "href",
        "/settings",
      );
    });

    it('renders "View all" links for each card', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      const viewAllLinks = screen.getAllByText(/View all/);
      expect(viewAllLinks).toHaveLength(5);
    });
  });

  describe("loading states", () => {
    it("shows loading state for project", async () => {
      // Override the mock to show loading
      const { useProject } = require("@/contexts/ProjectContext");
      useProject.mockReturnValueOnce({
        currentProject: null,
        loading: true,
      });

      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      expect(screen.getByText("Loading project...")).toBeInTheDocument();
    });
  });

  describe("no project state", () => {
    it("shows message when no project is selected", async () => {
      const { useProject } = require("@/contexts/ProjectContext");
      useProject.mockReturnValueOnce({
        currentProject: null,
        loading: false,
      });

      const mocks = createMocks();

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      expect(screen.getByText(/No project selected/)).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("shows error message when data fails to load", async () => {
      const errorMocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: "project-1" },
          },
          error: new Error("Failed to load fixtures"),
        },
        ...createMocks().slice(1),
      ];

      render(
        <MockedProvider
          mocks={[...errorMocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/Error loading data/)).toBeInTheDocument();
      });
    });
  });
});
