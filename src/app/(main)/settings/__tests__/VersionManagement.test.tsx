import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import VersionManagement from "../VersionManagement";
import { GET_SYSTEM_VERSIONS, GET_BUILD_INFO } from "@/graphql/versionManagement";

const mockSystemVersionsSupported = {
  versionManagementSupported: true,
  lastChecked: "2025-11-12T12:00:00Z",
  repositories: [
    {
      repository: "lacylights-fe",
      installed: "v1.0.0",
      latest: "v1.1.0",
      updateAvailable: true,
    },
    {
      repository: "lacylights-go",
      installed: "v2.0.0",
      latest: "v2.0.0",
      updateAvailable: false,
    },
  ],
};

const mockSystemVersionsNotSupported = {
  versionManagementSupported: false,
  lastChecked: "",
  repositories: [],
};

const mockBuildInfo = {
  version: "v2.0.0",
  gitCommit: "abc123def456",
  buildTime: "2025-11-12T10:00:00Z",
};

const createMocks = (
  systemVersions = mockSystemVersionsSupported,
  buildInfo = mockBuildInfo
) => [
  {
    request: {
      query: GET_SYSTEM_VERSIONS,
    },
    result: {
      data: {
        systemVersions,
      },
    },
  },
  {
    request: {
      query: GET_BUILD_INFO,
    },
    result: {
      data: {
        buildInfo,
      },
    },
  },
];

describe("VersionManagement (read-only)", () => {
  describe("Version management not supported", () => {
    it("shows not available message when version management is not supported", async () => {
      const mocks = createMocks(mockSystemVersionsNotSupported);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Version Management Not Available")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          /This system does not support automated version management/
        )
      ).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("shows loading state while fetching data", () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      expect(screen.getByText("Checking versions...")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("shows error message when query fails", async () => {
      const errorMocks = [
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          error: new Error("Network error"),
        },
        {
          request: {
            query: GET_BUILD_INFO,
          },
          result: {
            data: {
              buildInfo: mockBuildInfo,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading version information/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Repository list", () => {
    it("displays repository versions when supported", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("System Versions")).toBeInTheDocument();
      });

      expect(screen.getByText("lacylights-fe")).toBeInTheDocument();
      expect(screen.getByText("lacylights-go")).toBeInTheDocument();
    });

    it("shows update available badges for outdated repositories", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("System Versions")).toBeInTheDocument();
      });

      const updateBadges = screen.getAllByText("Update Available");
      expect(updateBadges).toHaveLength(1); // lacylights-fe only (lacylights-go is up to date)
    });

    it("displays installed and latest versions", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("v1.0.0")).toBeInTheDocument();
      });

      expect(screen.getByText("v1.1.0")).toBeInTheDocument();
    });

    it("displays last checked timestamp", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
      });
    });
  });

  describe("Build Info", () => {
    it("displays current server build information", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Current Server Build")).toBeInTheDocument();
      });

      // Version appears in both build info and repository list, so just check it exists
      expect(screen.getAllByText("v2.0.0").length).toBeGreaterThan(0);
      expect(screen.getByText("abc123d")).toBeInTheDocument(); // First 7 chars of commit
    });
  });

  describe("System Update link", () => {
    it("shows Updates Available button when updates are available", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Updates Available")).toBeInTheDocument();
      });

      // Should link to /system-update
      const link = screen.getByRole("link", { name: /Updates Available/ });
      expect(link).toHaveAttribute("href", "/system-update");
    });

    it("shows Manage Updates button when no updates available", async () => {
      const noUpdatesVersions = {
        ...mockSystemVersionsSupported,
        repositories: mockSystemVersionsSupported.repositories.map((repo) => ({
          ...repo,
          updateAvailable: false,
        })),
      };
      const mocks = createMocks(noUpdatesVersions);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Manage Updates")).toBeInTheDocument();
      });

      // Should link to /system-update
      const link = screen.getByRole("link", { name: /Manage Updates/ });
      expect(link).toHaveAttribute("href", "/system-update");
    });

    it("shows update notice with link when updates are available", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Updates are available. Go to the/)
        ).toBeInTheDocument();
      });

      // Should have a link to system-update in the notice
      const noticeLink = screen.getByRole("link", { name: /System Update/ });
      expect(noticeLink).toHaveAttribute("href", "/system-update");
    });
  });

  describe("Version arrow display", () => {
    it("shows version arrow for repositories with updates", async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("System Versions")).toBeInTheDocument();
      });

      // Should show arrow for lacylights-fe (has update)
      expect(screen.getByText("v1.0.0")).toBeInTheDocument();
      expect(screen.getAllByText("→").length).toBeGreaterThan(0);
    });
  });
});
