"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useProject } from "@/contexts/ProjectContext";
import { GET_PROJECT_FIXTURES } from "@/graphql/fixtures";
import { GET_PROJECT_SCENES } from "@/graphql/scenes";
import { GET_PROJECT_SCENE_BOARDS } from "@/graphql/sceneBoards";
import { GET_PROJECT_CUE_LISTS } from "@/graphql/cueLists";
import { GET_SYSTEM_INFO } from "@/graphql/settings";
import { useGlobalPlaybackStatus } from "@/hooks/useGlobalPlaybackStatus";
import {
  FixtureInstance,
  Scene,
  SceneBoard,
  CueList,
  FixtureType,
  SystemInfo,
} from "@/types";

/**
 * Format fixture type for display
 */
function formatFixtureType(type: FixtureType): string {
  switch (type) {
    case FixtureType.LED_PAR:
      return "LED PAR";
    case FixtureType.MOVING_HEAD:
      return "Moving Head";
    case FixtureType.STROBE:
      return "Strobe";
    case FixtureType.DIMMER:
      return "Dimmer";
    case FixtureType.OTHER:
    default:
      return "Other";
  }
}

/**
 * Dashboard card component for consistent styling
 */
interface DashboardCardProps {
  title: string;
  href: string;
  count: number;
  countLabel: string;
  children: React.ReactNode;
  testId?: string;
}

function DashboardCard({
  title,
  href,
  count,
  countLabel,
  children,
  testId,
}: DashboardCardProps) {
  return (
    <div
      className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex flex-col"
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <Link
          href={href}
          className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {title}
        </Link>
        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {count}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {countLabel}
      </p>
      <div className="flex-1">{children}</div>
      <Link
        href={href}
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        View all &rarr;
      </Link>
    </div>
  );
}

/**
 * Dashboard page component
 * Shows an overview of all main sections of the application
 */
export default function DashboardPage() {
  const { currentProject, loading: projectLoading } = useProject();
  const projectId = currentProject?.id;

  // Fetch all data
  const {
    data: fixturesData,
    loading: fixturesLoading,
    error: fixturesError,
  } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId },
    skip: !projectId,
  });

  const {
    data: scenesData,
    loading: scenesLoading,
    error: scenesError,
  } = useQuery(GET_PROJECT_SCENES, {
    variables: { projectId },
    skip: !projectId,
  });

  const {
    data: sceneBoardsData,
    loading: sceneBoardsLoading,
    error: sceneBoardsError,
  } = useQuery(GET_PROJECT_SCENE_BOARDS, {
    variables: { projectId },
    skip: !projectId,
  });

  const {
    data: cueListsData,
    loading: cueListsLoading,
    error: cueListsError,
  } = useQuery(GET_PROJECT_CUE_LISTS, {
    variables: { projectId },
    skip: !projectId,
  });

  const { data: systemInfoData } = useQuery(GET_SYSTEM_INFO);
  const { playbackStatus } = useGlobalPlaybackStatus();

  // Extract and memoize data to avoid dependency issues
  const fixtures = useMemo<FixtureInstance[]>(
    () => fixturesData?.project?.fixtures || [],
    [fixturesData?.project?.fixtures],
  );
  const scenes: Scene[] = scenesData?.project?.scenes || [];
  const sceneBoards: SceneBoard[] = sceneBoardsData?.sceneBoards || [];
  const cueLists = useMemo<CueList[]>(
    () => cueListsData?.project?.cueLists || [],
    [cueListsData?.project?.cueLists],
  );
  const systemInfo: SystemInfo | undefined = systemInfoData?.systemInfo;

  // Calculate fixture type breakdown
  const fixtureTypeBreakdown = useMemo(() => {
    const breakdown: Record<FixtureType, number> = {} as Record<
      FixtureType,
      number
    >;
    fixtures.forEach((fixture) => {
      breakdown[fixture.type] = (breakdown[fixture.type] || 0) + 1;
    });
    return Object.entries(breakdown)
      .map(
        ([type, count]) => `${count} ${formatFixtureType(type as FixtureType)}`,
      )
      .join(", ");
  }, [fixtures]);

  // Sort cue lists to show currently playing first
  const sortedCueLists = useMemo(() => {
    if (!playbackStatus?.cueListId) return cueLists;
    return [...cueLists].sort((a, b) => {
      if (a.id === playbackStatus.cueListId) return -1;
      if (b.id === playbackStatus.cueListId) return 1;
      return 0;
    });
  }, [cueLists, playbackStatus?.cueListId]);

  // Loading state
  const isLoading =
    projectLoading ||
    fixturesLoading ||
    scenesLoading ||
    sceneBoardsLoading ||
    cueListsLoading;

  // Error state
  const hasError =
    fixturesError || scenesError || sceneBoardsError || cueListsError;

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
        <p className="text-yellow-800 dark:text-yellow-200">
          No project selected. Please select or create a project to view the
          dashboard.
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          Error loading data:{" "}
          {
            (fixturesError || scenesError || sceneBoardsError || cueListsError)
              ?.message
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Overview of your lighting setup for {currentProject.name}
        </p>
      </div>

      {/* Loading indicator for data */}
      {isLoading && (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            Loading dashboard data...
          </p>
        </div>
      )}

      {/* Dashboard Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fixtures Card */}
          <DashboardCard
            title="Fixtures"
            href="/fixtures"
            count={fixtures.length}
            countLabel={fixtureTypeBreakdown || "No fixtures yet"}
            testId="fixtures-card"
          >
            {fixtures.length > 0 ? (
              <ul className="space-y-1">
                {fixtures.slice(0, 5).map((fixture) => (
                  <li
                    key={fixture.id}
                    className="text-sm text-gray-600 dark:text-gray-300 truncate"
                  >
                    <span className="font-medium">{fixture.name}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-2">
                      ({fixture.manufacturer} {fixture.model})
                    </span>
                  </li>
                ))}
                {fixtures.length > 5 && (
                  <li className="text-sm text-gray-400 dark:text-gray-500">
                    +{fixtures.length - 5} more...
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No fixtures configured
              </p>
            )}
          </DashboardCard>

          {/* Scenes Card */}
          <DashboardCard
            title="Scenes"
            href="/scenes"
            count={scenes.length}
            countLabel={
              scenes.length === 1 ? "1 scene" : `${scenes.length} scenes`
            }
            testId="scenes-card"
          >
            {scenes.length > 0 ? (
              <ul className="space-y-1">
                {scenes.slice(0, 8).map((scene) => (
                  <li
                    key={scene.id}
                    className="text-sm text-gray-600 dark:text-gray-300 truncate"
                  >
                    {scene.name}
                  </li>
                ))}
                {scenes.length > 8 && (
                  <li className="text-sm text-gray-400 dark:text-gray-500">
                    +{scenes.length - 8} more...
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No scenes created
              </p>
            )}
          </DashboardCard>

          {/* Scene Boards Card */}
          <DashboardCard
            title="Scene Boards"
            href="/scene-board"
            count={sceneBoards.length}
            countLabel={
              sceneBoards.length === 1
                ? "1 board"
                : `${sceneBoards.length} boards`
            }
            testId="scene-boards-card"
          >
            {sceneBoards.length > 0 ? (
              <ul className="space-y-1">
                {sceneBoards.map((board) => (
                  <li key={board.id} className="text-sm">
                    <Link
                      href={`/scene-board?board=${board.id}`}
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span className="font-medium">{board.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 ml-2">
                        ({board.buttons?.length || 0} buttons)
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No scene boards created
              </p>
            )}
          </DashboardCard>

          {/* Cue Lists Card */}
          <DashboardCard
            title="Cue Lists"
            href="/cue-lists"
            count={cueLists.length}
            countLabel={
              cueLists.length === 1
                ? "1 cue list"
                : `${cueLists.length} cue lists`
            }
            testId="cue-lists-card"
          >
            {sortedCueLists.length > 0 ? (
              <ul className="space-y-1">
                {sortedCueLists.map((cueList) => {
                  const isPlaying =
                    playbackStatus?.cueListId === cueList.id &&
                    playbackStatus?.isPlaying;
                  return (
                    <li key={cueList.id} className="text-sm">
                      <Link
                        href={`/cue-lists/${cueList.id}`}
                        className={`flex items-center gap-2 ${
                          isPlaying
                            ? "text-green-600 dark:text-green-400 font-medium"
                            : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        }`}
                      >
                        {isPlaying && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                        <span>{cueList.name}</span>
                        <span className="text-gray-400 dark:text-gray-500">
                          ({cueList.cues?.length || 0} cues)
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No cue lists created
              </p>
            )}
          </DashboardCard>

          {/* Settings Card */}
          <DashboardCard
            title="Settings"
            href="/settings"
            count={0}
            countLabel="System configuration"
            testId="settings-card"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  ArtNet Output
                </span>
                <span
                  className={`text-sm font-medium ${
                    systemInfo?.artnetEnabled
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {systemInfo?.artnetEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {systemInfo?.artnetEnabled &&
                systemInfo?.artnetBroadcastAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Broadcast Address
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {systemInfo.artnetBroadcastAddress}
                    </span>
                  </div>
                )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Fade Update Rate
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {systemInfo?.fadeUpdateRateHz || 60} Hz
                </span>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
