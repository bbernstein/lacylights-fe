import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import DashboardPage from "../page";
import { GET_PROJECT_FIXTURES } from "@/graphql/fixtures";
import { GET_PROJECT_LOOKS } from "@/graphql/looks";
import { GET_PROJECT_LOOK_BOARDS } from "@/graphql/lookBoards";
import { GET_PROJECT_CUE_LISTS } from "@/graphql/cueLists";
import { GET_EFFECTS } from "@/graphql/effects";
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
  looks: [],
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

const mockLooks = [
  {
    id: "look-1",
    name: "Look A",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    fixtureValues: [],
  },
  {
    id: "look-2",
    name: "Look B",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    fixtureValues: [],
  },
  {
    id: "look-3",
    name: "Look C",
    description: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    fixtureValues: [],
  },
];

const mockLookBoards = [
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

const mockEffects = [
  {
    __typename: "Effect",
    id: "effect-1",
    name: "Pulsing Red",
    description: "",
    projectId: "project-1",
    effectType: "WAVEFORM",
    priorityBand: "BASE",
    prioritySub: 0,
    compositionMode: "ADDITIVE",
    onCueChange: "PERSIST",
    fadeDuration: 1,
    waveform: "SINE",
    frequency: 1,
    amplitude: 1,
    offset: 0,
    phaseOffset: 0,
    masterValue: 1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    __typename: "Effect",
    id: "effect-2",
    name: "Color Fade",
    description: "",
    projectId: "project-1",
    effectType: "CROSSFADE",
    priorityBand: "BASE",
    prioritySub: 0,
    compositionMode: "ADDITIVE",
    onCueChange: "PERSIST",
    fadeDuration: 1,
    waveform: null,
    frequency: null,
    amplitude: null,
    offset: null,
    phaseOffset: null,
    masterValue: null,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    __typename: "Effect",
    id: "effect-3",
    name: "Master Dim",
    description: "",
    projectId: "project-1",
    effectType: "MASTER",
    priorityBand: "BASE",
    prioritySub: 0,
    compositionMode: "ADDITIVE",
    onCueChange: "PERSIST",
    fadeDuration: 1,
    waveform: null,
    frequency: null,
    amplitude: null,
    offset: null,
    phaseOffset: null,
    masterValue: 0.5,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

const mockSystemInfo = {
  artnetBroadcastAddress: "192.168.1.255",
  artnetEnabled: true,
  fadeUpdateRateHz: 60,
};

const mockPlaybackStatus: {
  isPlaying: boolean;
  isFading: boolean;
  cueListId: string | null;
  cueListName: string | null;
  currentCueIndex: number | null;
  cueCount: number | null;
  currentCueName: string | null;
  fadeProgress: number | null;
  lastUpdated: string;
} = {
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
    looks?: typeof mockLooks;
    lookBoards?: typeof mockLookBoards;
    cueLists?: typeof mockCueLists;
    effects?: typeof mockEffects;
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
      query: GET_PROJECT_LOOKS,
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        project: {
          id: "project-1",
          looks: options.looks ?? mockLooks,
        },
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_LOOK_BOARDS,
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        lookBoards: options.lookBoards ?? mockLookBoards,
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
      query: GET_EFFECTS,
      variables: { projectId: "project-1" },
    },
    result: {
      data: {
        effects: options.effects ?? mockEffects,
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

      expect(screen.getByTestId("looks-card")).toBeInTheDocument();
      expect(screen.getByTestId("effects-card")).toBeInTheDocument();
      expect(screen.getByTestId("look-boards-card")).toBeInTheDocument();
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

    it("truncates fixtures list and shows '+X more' when more than 5 fixtures", async () => {
      const manyFixtures = Array.from({ length: 7 }, (_, i) => ({
        id: `fixture-${i + 1}`,
        name: `Fixture ${i + 1}`,
        description: "",
        universe: 1,
        startChannel: i * 8 + 1,
        tags: [],
        projectOrder: i,
        createdAt: "2024-01-01",
        definitionId: `def-${i + 1}`,
        manufacturer: "Test",
        model: "Model",
        type: FixtureType.LED_PAR,
        modeName: "8-channel",
        channelCount: 8,
        channels: [],
      }));

      const mocks = createMocks({ fixtures: manyFixtures });

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

      const fixturesCard = screen.getByTestId("fixtures-card");
      // Should show first 5 fixtures
      expect(fixturesCard).toHaveTextContent("Fixture 1");
      expect(fixturesCard).toHaveTextContent("Fixture 5");
      // Should show "+2 more..." for remaining fixtures
      expect(fixturesCard).toHaveTextContent("+2 more...");
      // Should NOT show fixtures beyond 5
      expect(fixturesCard).not.toHaveTextContent("Fixture 6");
    });
  });

  describe("looks card", () => {
    it("displays look count and names", async () => {
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
        expect(screen.getByTestId("looks-card")).toBeInTheDocument();
      });

      const looksCard = screen.getByTestId("looks-card");
      expect(looksCard).toHaveTextContent("3");
      expect(screen.getByText("Look A")).toBeInTheDocument();
      expect(screen.getByText("Look B")).toBeInTheDocument();
      expect(screen.getByText("Look C")).toBeInTheDocument();
    });

    it("shows empty state when no looks", async () => {
      const mocks = createMocks({ looks: [] });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("looks-card")).toBeInTheDocument();
      });

      expect(screen.getByText("No looks created")).toBeInTheDocument();
    });

    it("truncates looks list and shows '+X more' when more than 8 looks", async () => {
      const manyLooks = Array.from({ length: 10 }, (_, i) => ({
        id: `look-${i + 1}`,
        name: `Look ${i + 1}`,
        description: "",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        fixtureValues: [],
      }));

      const mocks = createMocks({ looks: manyLooks });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("looks-card")).toBeInTheDocument();
      });

      const looksCard = screen.getByTestId("looks-card");
      // Should show first 8 looks
      expect(looksCard).toHaveTextContent("Look 1");
      expect(looksCard).toHaveTextContent("Look 8");
      // Should show "+2 more..." for remaining looks
      expect(looksCard).toHaveTextContent("+2 more...");
      // Should NOT show looks beyond 8
      expect(looksCard).not.toHaveTextContent("Look 9");
    });
  });

  describe("effects card", () => {
    it("displays effect count and names", async () => {
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
        expect(screen.getByTestId("effects-card")).toBeInTheDocument();
      });

      const effectsCard = screen.getByTestId("effects-card");
      expect(effectsCard).toHaveTextContent("3");
      expect(effectsCard).toHaveTextContent("Pulsing Red");
      expect(effectsCard).toHaveTextContent("Color Fade");
      expect(effectsCard).toHaveTextContent("Master Dim");
    });

    it("shows empty state when no effects", async () => {
      const mocks = createMocks({ effects: [] });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("effects-card")).toBeInTheDocument();
      });

      expect(screen.getByText("No effects created")).toBeInTheDocument();
    });

    it("truncates effects list and shows '+X more' when more than 6 effects", async () => {
      const manyEffects = Array.from({ length: 8 }, (_, i) => ({
        __typename: "Effect",
        id: `effect-${i + 1}`,
        name: `Effect ${i + 1}`,
        description: "",
        projectId: "project-1",
        effectType: "WAVEFORM",
        priorityBand: "BASE",
        prioritySub: 0,
        compositionMode: "ADDITIVE",
        onCueChange: "PERSIST",
        fadeDuration: 1,
        waveform: "SINE",
        frequency: 1,
        amplitude: 1,
        offset: 0,
        phaseOffset: 0,
        masterValue: 1,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }));

      const mocks = createMocks({ effects: manyEffects });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("effects-card")).toBeInTheDocument();
      });

      const effectsCard = screen.getByTestId("effects-card");
      // Should show count and first 6 effects
      expect(effectsCard).toHaveTextContent("8");
      expect(effectsCard).toHaveTextContent("Effect 1");
      expect(effectsCard).toHaveTextContent("Effect 6");
      // Should show "+2 more..." for remaining effects
      expect(effectsCard).toHaveTextContent("+2 more...");
      // Should NOT show effects beyond 6
      expect(effectsCard).not.toHaveTextContent("Effect 7");
    });

    it("displays color-coded effect type indicators", async () => {
      const effectsWithTypes = [
        {
          __typename: "Effect",
          id: "effect-waveform",
          name: "Wave Effect",
          description: "",
          projectId: "project-1",
          effectType: "WAVEFORM",
          priorityBand: "BASE",
          prioritySub: 0,
          compositionMode: "ADDITIVE",
          onCueChange: "PERSIST",
          fadeDuration: 1,
          waveform: "SINE",
          frequency: 1,
          amplitude: 1,
          offset: 0,
          phaseOffset: 0,
          masterValue: 1,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
        {
          __typename: "Effect",
          id: "effect-crossfade",
          name: "Fade Effect",
          description: "",
          projectId: "project-1",
          effectType: "CROSSFADE",
          priorityBand: "BASE",
          prioritySub: 0,
          compositionMode: "ADDITIVE",
          onCueChange: "PERSIST",
          fadeDuration: 1,
          waveform: null,
          frequency: null,
          amplitude: null,
          offset: null,
          phaseOffset: null,
          masterValue: null,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
        {
          __typename: "Effect",
          id: "effect-master",
          name: "Master Effect",
          description: "",
          projectId: "project-1",
          effectType: "MASTER",
          priorityBand: "BASE",
          prioritySub: 0,
          compositionMode: "ADDITIVE",
          onCueChange: "PERSIST",
          fadeDuration: 1,
          waveform: null,
          frequency: null,
          amplitude: null,
          offset: null,
          phaseOffset: null,
          masterValue: 0.5,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
        {
          __typename: "Effect",
          id: "effect-static",
          name: "Static Effect",
          description: "",
          projectId: "project-1",
          effectType: "STATIC",
          priorityBand: "BASE",
          prioritySub: 0,
          compositionMode: "ADDITIVE",
          onCueChange: "PERSIST",
          fadeDuration: 1,
          waveform: null,
          frequency: null,
          amplitude: null,
          offset: null,
          phaseOffset: null,
          masterValue: null,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ];

      const mocks = createMocks({ effects: effectsWithTypes });

      render(
        <MockedProvider
          mocks={[...mocks, createSubscriptionMock()]}
          addTypename={false}
        >
          <DashboardPage />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("effects-card")).toBeInTheDocument();
      });

      const effectsCard = screen.getByTestId("effects-card");

      // Check that all effect types are displayed
      expect(effectsCard).toHaveTextContent("Wave Effect");
      expect(effectsCard).toHaveTextContent("Fade Effect");
      expect(effectsCard).toHaveTextContent("Master Effect");
      expect(effectsCard).toHaveTextContent("Static Effect");

      // Check color indicators exist (purple for WAVEFORM, blue for CROSSFADE, yellow for MASTER, gray for STATIC)
      const indicators = effectsCard.querySelectorAll(".rounded-full");
      expect(indicators.length).toBe(4);
    });
  });

  describe("look boards card", () => {
    it("displays look board count and button counts", async () => {
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
        expect(screen.getByTestId("look-boards-card")).toBeInTheDocument();
      });

      const boardsCard = screen.getByTestId("look-boards-card");
      expect(boardsCard).toHaveTextContent("2");
      expect(boardsCard).toHaveTextContent("Main Board");
      expect(boardsCard).toHaveTextContent("(2 buttons)");
      expect(boardsCard).toHaveTextContent("Quick Access");
      expect(boardsCard).toHaveTextContent("(0 buttons)");
    });

    it("renders links to specific look boards", async () => {
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
        expect(screen.getByTestId("look-boards-card")).toBeInTheDocument();
      });

      const mainBoardLink = screen.getByRole("link", { name: /Main Board/i });
      expect(mainBoardLink).toHaveAttribute(
        "href",
        "/look-board?board=board-1",
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
      expect(cueListsCard).toHaveTextContent("(1 cue)");
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
      expect(settingsCard).toHaveTextContent("Art-Net Output");
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
      expect(screen.getByRole("link", { name: "Looks" })).toHaveAttribute(
        "href",
        "/looks",
      );
      expect(screen.getByRole("link", { name: "Effects" })).toHaveAttribute(
        "href",
        "/effects",
      );
      expect(
        screen.getByRole("link", { name: "Look Boards" }),
      ).toHaveAttribute("href", "/look-board");
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
      expect(viewAllLinks).toHaveLength(6);
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
