import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type BulkCueCreateInput = {
  readonly cues: ReadonlyArray<CreateCueInput>;
};

export type BulkCueListCreateInput = {
  readonly cueLists: ReadonlyArray<CreateCueListInput>;
};

export type BulkCueListUpdateInput = {
  readonly cueLists: ReadonlyArray<CueListUpdateItem>;
};

export type BulkCueUpdateInput = {
  readonly cueIds: ReadonlyArray<Scalars['ID']['input']>;
  readonly easingType?: InputMaybe<EasingType>;
  readonly fadeInTime?: InputMaybe<Scalars['Float']['input']>;
  readonly fadeOutTime?: InputMaybe<Scalars['Float']['input']>;
  readonly followTime?: InputMaybe<Scalars['Float']['input']>;
};

export type BulkDeleteResult = {
  readonly __typename?: 'BulkDeleteResult';
  readonly deletedCount: Scalars['Int']['output'];
  readonly deletedIds: ReadonlyArray<Scalars['ID']['output']>;
};

export type BulkFixtureCreateInput = {
  readonly fixtures: ReadonlyArray<CreateFixtureInstanceInput>;
};

export type BulkFixtureDefinitionCreateInput = {
  readonly definitions: ReadonlyArray<CreateFixtureDefinitionInput>;
};

export type BulkFixtureDefinitionUpdateInput = {
  readonly definitions: ReadonlyArray<FixtureDefinitionUpdateItem>;
};

export type BulkFixtureUpdateInput = {
  readonly fixtures: ReadonlyArray<FixtureUpdateItem>;
};

export type BulkProjectCreateInput = {
  readonly projects: ReadonlyArray<CreateProjectInput>;
};

export type BulkProjectUpdateInput = {
  readonly projects: ReadonlyArray<ProjectUpdateItem>;
};

export type BulkSceneBoardButtonCreateInput = {
  readonly buttons: ReadonlyArray<CreateSceneBoardButtonInput>;
};

export type BulkSceneBoardButtonUpdateInput = {
  readonly buttons: ReadonlyArray<SceneBoardButtonUpdateItem>;
};

export type BulkSceneBoardCreateInput = {
  readonly sceneBoards: ReadonlyArray<CreateSceneBoardInput>;
};

export type BulkSceneBoardUpdateInput = {
  readonly sceneBoards: ReadonlyArray<SceneBoardUpdateItem>;
};

export type BulkSceneCreateInput = {
  readonly scenes: ReadonlyArray<CreateSceneInput>;
};

export type BulkSceneUpdateInput = {
  readonly scenes: ReadonlyArray<SceneUpdateItem>;
};

export type ChannelAssignmentInput = {
  readonly fixtureSpecs: ReadonlyArray<FixtureSpecInput>;
  readonly projectId: Scalars['ID']['input'];
  readonly startingChannel?: InputMaybe<Scalars['Int']['input']>;
  readonly universe?: InputMaybe<Scalars['Int']['input']>;
};

export type ChannelAssignmentSuggestion = {
  readonly __typename?: 'ChannelAssignmentSuggestion';
  readonly assignments: ReadonlyArray<FixtureChannelAssignment>;
  readonly availableChannelsRemaining: Scalars['Int']['output'];
  readonly totalChannelsNeeded: Scalars['Int']['output'];
  readonly universe: Scalars['Int']['output'];
};

export type ChannelDefinition = {
  readonly __typename?: 'ChannelDefinition';
  readonly defaultValue: Scalars['Int']['output'];
  readonly fadeBehavior: FadeBehavior;
  readonly id: Scalars['ID']['output'];
  readonly isDiscrete: Scalars['Boolean']['output'];
  readonly maxValue: Scalars['Int']['output'];
  readonly minValue: Scalars['Int']['output'];
  readonly name: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
  readonly type: ChannelType;
};

export type ChannelFadeBehaviorInput = {
  readonly channelId: Scalars['ID']['input'];
  readonly fadeBehavior: FadeBehavior;
};

export type ChannelMapFixture = {
  readonly __typename?: 'ChannelMapFixture';
  readonly channelCount: Scalars['Int']['output'];
  readonly endChannel: Scalars['Int']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly startChannel: Scalars['Int']['output'];
  readonly type: FixtureType;
};

export type ChannelMapResult = {
  readonly __typename?: 'ChannelMapResult';
  readonly projectId: Scalars['ID']['output'];
  readonly universes: ReadonlyArray<UniverseChannelMap>;
};

export enum ChannelType {
  Amber = 'AMBER',
  Blue = 'BLUE',
  ColorWheel = 'COLOR_WHEEL',
  Effect = 'EFFECT',
  Focus = 'FOCUS',
  Gobo = 'GOBO',
  Green = 'GREEN',
  Intensity = 'INTENSITY',
  Iris = 'IRIS',
  Macro = 'MACRO',
  Other = 'OTHER',
  Pan = 'PAN',
  Red = 'RED',
  Strobe = 'STROBE',
  Tilt = 'TILT',
  Uv = 'UV',
  White = 'WHITE',
  Zoom = 'ZOOM'
}

export type ChannelUsage = {
  readonly __typename?: 'ChannelUsage';
  readonly channelType: ChannelType;
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
};

export type CreateChannelDefinitionInput = {
  readonly defaultValue: Scalars['Int']['input'];
  readonly fadeBehavior?: InputMaybe<FadeBehavior>;
  readonly isDiscrete?: InputMaybe<Scalars['Boolean']['input']>;
  readonly maxValue: Scalars['Int']['input'];
  readonly minValue: Scalars['Int']['input'];
  readonly name: Scalars['String']['input'];
  readonly offset: Scalars['Int']['input'];
  readonly type: ChannelType;
};

export type CreateCueInput = {
  readonly cueListId: Scalars['ID']['input'];
  readonly cueNumber: Scalars['Float']['input'];
  readonly easingType?: InputMaybe<EasingType>;
  readonly fadeInTime: Scalars['Float']['input'];
  readonly fadeOutTime: Scalars['Float']['input'];
  readonly followTime?: InputMaybe<Scalars['Float']['input']>;
  readonly name: Scalars['String']['input'];
  readonly notes?: InputMaybe<Scalars['String']['input']>;
  readonly sceneId: Scalars['ID']['input'];
};

export type CreateCueListInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly loop?: InputMaybe<Scalars['Boolean']['input']>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
};

export type CreateFixtureDefinitionInput = {
  readonly channels: ReadonlyArray<CreateChannelDefinitionInput>;
  readonly manufacturer: Scalars['String']['input'];
  readonly model: Scalars['String']['input'];
  readonly type: FixtureType;
};

export type CreateFixtureInstanceInput = {
  readonly definitionId: Scalars['ID']['input'];
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly modeId?: InputMaybe<Scalars['ID']['input']>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
  readonly startChannel: Scalars['Int']['input'];
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly universe: Scalars['Int']['input'];
};

export type CreateProjectInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly name: Scalars['String']['input'];
};

export type CreateSceneBoardButtonInput = {
  readonly color?: InputMaybe<Scalars['String']['input']>;
  readonly height?: InputMaybe<Scalars['Int']['input']>;
  readonly label?: InputMaybe<Scalars['String']['input']>;
  readonly layoutX: Scalars['Int']['input'];
  readonly layoutY: Scalars['Int']['input'];
  readonly sceneBoardId: Scalars['ID']['input'];
  readonly sceneId: Scalars['ID']['input'];
  readonly width?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateSceneBoardInput = {
  readonly canvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly canvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly defaultFadeTime?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly gridSize?: InputMaybe<Scalars['Int']['input']>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
};

export type CreateSceneInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly fixtureValues: ReadonlyArray<FixtureValueInput>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
};

export type Cue = {
  readonly __typename?: 'Cue';
  readonly cueList: CueList;
  readonly cueNumber: Scalars['Float']['output'];
  readonly easingType?: Maybe<EasingType>;
  readonly fadeInTime: Scalars['Float']['output'];
  readonly fadeOutTime: Scalars['Float']['output'];
  readonly followTime?: Maybe<Scalars['Float']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly notes?: Maybe<Scalars['String']['output']>;
  readonly scene: Scene;
};

export type CueList = {
  readonly __typename?: 'CueList';
  readonly createdAt: Scalars['String']['output'];
  readonly cueCount: Scalars['Int']['output'];
  readonly cues: ReadonlyArray<Cue>;
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly loop: Scalars['Boolean']['output'];
  readonly name: Scalars['String']['output'];
  readonly project: Project;
  readonly totalDuration: Scalars['Float']['output'];
  readonly updatedAt: Scalars['String']['output'];
};

export type CueListPlaybackStatus = {
  readonly __typename?: 'CueListPlaybackStatus';
  readonly cueListId: Scalars['ID']['output'];
  readonly currentCue?: Maybe<Cue>;
  readonly currentCueIndex?: Maybe<Scalars['Int']['output']>;
  readonly fadeProgress?: Maybe<Scalars['Float']['output']>;
  /** True when a fade-in transition is in progress */
  readonly isFading: Scalars['Boolean']['output'];
  /** True when a scene's values are currently active on DMX fixtures (stays true after fade completes until stopped) */
  readonly isPlaying: Scalars['Boolean']['output'];
  readonly lastUpdated: Scalars['String']['output'];
  readonly nextCue?: Maybe<Cue>;
  readonly previousCue?: Maybe<Cue>;
};

export type CueListSummary = {
  readonly __typename?: 'CueListSummary';
  readonly createdAt: Scalars['String']['output'];
  readonly cueCount: Scalars['Int']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly loop: Scalars['Boolean']['output'];
  readonly name: Scalars['String']['output'];
  readonly totalDuration: Scalars['Float']['output'];
};

export type CueListUpdateItem = {
  readonly cueListId: Scalars['ID']['input'];
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly loop?: InputMaybe<Scalars['Boolean']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type CueOrderInput = {
  readonly cueId: Scalars['ID']['input'];
  readonly cueNumber: Scalars['Float']['input'];
};

export type CuePage = {
  readonly __typename?: 'CuePage';
  readonly cues: ReadonlyArray<Cue>;
  readonly pagination: PaginationInfo;
};

export type CueUsageSummary = {
  readonly __typename?: 'CueUsageSummary';
  readonly cueId: Scalars['ID']['output'];
  readonly cueListId: Scalars['ID']['output'];
  readonly cueListName: Scalars['String']['output'];
  readonly cueName: Scalars['String']['output'];
  readonly cueNumber: Scalars['Float']['output'];
};

export enum DifferenceType {
  OnlyInScene1 = 'ONLY_IN_SCENE1',
  OnlyInScene2 = 'ONLY_IN_SCENE2',
  ValuesChanged = 'VALUES_CHANGED'
}

export enum EasingType {
  Bezier = 'BEZIER',
  EaseInOutCubic = 'EASE_IN_OUT_CUBIC',
  EaseInOutSine = 'EASE_IN_OUT_SINE',
  EaseOutExponential = 'EASE_OUT_EXPONENTIAL',
  Linear = 'LINEAR',
  SCurve = 'S_CURVE'
}

export type ExportOptionsInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly includeCueLists?: InputMaybe<Scalars['Boolean']['input']>;
  readonly includeFixtures?: InputMaybe<Scalars['Boolean']['input']>;
  readonly includeScenes?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ExportResult = {
  readonly __typename?: 'ExportResult';
  readonly jsonContent: Scalars['String']['output'];
  readonly projectId: Scalars['String']['output'];
  readonly projectName: Scalars['String']['output'];
  readonly stats: ExportStats;
};

export type ExportStats = {
  readonly __typename?: 'ExportStats';
  readonly cueListsCount: Scalars['Int']['output'];
  readonly cuesCount: Scalars['Int']['output'];
  readonly fixtureDefinitionsCount: Scalars['Int']['output'];
  readonly fixtureInstancesCount: Scalars['Int']['output'];
  readonly scenesCount: Scalars['Int']['output'];
};

/**
 * Determines how a channel behaves during scene transitions.
 * FADE - Interpolate smoothly between values (default for intensity, colors)
 * SNAP - Jump to target value at start of transition (for gobos, macros, effects)
 * SNAP_END - Jump to target value at end of transition
 */
export enum FadeBehavior {
  Fade = 'FADE',
  Snap = 'SNAP',
  SnapEnd = 'SNAP_END'
}

export type FixtureChannelAssignment = {
  readonly __typename?: 'FixtureChannelAssignment';
  readonly channelCount: Scalars['Int']['output'];
  readonly channelRange: Scalars['String']['output'];
  readonly endChannel: Scalars['Int']['output'];
  readonly fixtureName: Scalars['String']['output'];
  readonly manufacturer: Scalars['String']['output'];
  readonly mode?: Maybe<Scalars['String']['output']>;
  readonly model: Scalars['String']['output'];
  readonly startChannel: Scalars['Int']['output'];
};

export enum FixtureConflictStrategy {
  Error = 'ERROR',
  Replace = 'REPLACE',
  Skip = 'SKIP'
}

export type FixtureDefinition = {
  readonly __typename?: 'FixtureDefinition';
  readonly channels: ReadonlyArray<ChannelDefinition>;
  readonly createdAt: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly isBuiltIn: Scalars['Boolean']['output'];
  readonly manufacturer: Scalars['String']['output'];
  readonly model: Scalars['String']['output'];
  readonly modes: ReadonlyArray<FixtureMode>;
  readonly type: FixtureType;
};

export type FixtureDefinitionFilter = {
  readonly channelTypes?: InputMaybe<ReadonlyArray<ChannelType>>;
  readonly isBuiltIn?: InputMaybe<Scalars['Boolean']['input']>;
  readonly manufacturer?: InputMaybe<Scalars['String']['input']>;
  readonly model?: InputMaybe<Scalars['String']['input']>;
  readonly type?: InputMaybe<FixtureType>;
};

export type FixtureDefinitionUpdateItem = {
  readonly definitionId: Scalars['ID']['input'];
  readonly manufacturer?: InputMaybe<Scalars['String']['input']>;
  readonly model?: InputMaybe<Scalars['String']['input']>;
  readonly type?: InputMaybe<FixtureType>;
};

export type FixtureFilterInput = {
  readonly manufacturer?: InputMaybe<Scalars['String']['input']>;
  readonly model?: InputMaybe<Scalars['String']['input']>;
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly type?: InputMaybe<FixtureType>;
  readonly universe?: InputMaybe<Scalars['Int']['input']>;
};

export type FixtureInstance = {
  readonly __typename?: 'FixtureInstance';
  readonly channelCount: Scalars['Int']['output'];
  readonly channels: ReadonlyArray<InstanceChannel>;
  readonly createdAt: Scalars['String']['output'];
  readonly definitionId: Scalars['ID']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly layoutRotation?: Maybe<Scalars['Float']['output']>;
  readonly layoutX?: Maybe<Scalars['Float']['output']>;
  readonly layoutY?: Maybe<Scalars['Float']['output']>;
  readonly manufacturer: Scalars['String']['output'];
  readonly modeName: Scalars['String']['output'];
  readonly model: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
  readonly project: Project;
  readonly projectOrder?: Maybe<Scalars['Int']['output']>;
  readonly startChannel: Scalars['Int']['output'];
  readonly tags: ReadonlyArray<Scalars['String']['output']>;
  readonly type: FixtureType;
  readonly universe: Scalars['Int']['output'];
};

export type FixtureInstancePage = {
  readonly __typename?: 'FixtureInstancePage';
  readonly fixtures: ReadonlyArray<FixtureInstance>;
  readonly pagination: PaginationInfo;
};

export type FixtureMapping = {
  readonly __typename?: 'FixtureMapping';
  readonly lacyLightsKey: Scalars['String']['output'];
  readonly qlcManufacturer: Scalars['String']['output'];
  readonly qlcMode: Scalars['String']['output'];
  readonly qlcModel: Scalars['String']['output'];
};

export type FixtureMappingInput = {
  readonly lacyLightsKey: Scalars['String']['input'];
  readonly qlcManufacturer: Scalars['String']['input'];
  readonly qlcMode: Scalars['String']['input'];
  readonly qlcModel: Scalars['String']['input'];
};

export type FixtureMappingSuggestion = {
  readonly __typename?: 'FixtureMappingSuggestion';
  readonly fixture: LacyLightsFixture;
  readonly suggestions: ReadonlyArray<QlcFixtureDefinition>;
};

export type FixtureMode = {
  readonly __typename?: 'FixtureMode';
  readonly channelCount: Scalars['Int']['output'];
  readonly channels: ReadonlyArray<ModeChannel>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly shortName?: Maybe<Scalars['String']['output']>;
};

export type FixtureOrderInput = {
  readonly fixtureId: Scalars['ID']['input'];
  readonly order: Scalars['Int']['input'];
};

export type FixturePositionInput = {
  readonly fixtureId: Scalars['ID']['input'];
  readonly layoutRotation?: InputMaybe<Scalars['Float']['input']>;
  readonly layoutX: Scalars['Float']['input'];
  readonly layoutY: Scalars['Float']['input'];
};

export type FixtureSpecInput = {
  readonly channelCount?: InputMaybe<Scalars['Int']['input']>;
  readonly manufacturer: Scalars['String']['input'];
  readonly mode?: InputMaybe<Scalars['String']['input']>;
  readonly model: Scalars['String']['input'];
  readonly name: Scalars['String']['input'];
};

export enum FixtureType {
  Dimmer = 'DIMMER',
  LedPar = 'LED_PAR',
  MovingHead = 'MOVING_HEAD',
  Other = 'OTHER',
  Strobe = 'STROBE'
}

export type FixtureUpdateItem = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly fixtureId: Scalars['ID']['input'];
  readonly layoutRotation?: InputMaybe<Scalars['Float']['input']>;
  readonly layoutX?: InputMaybe<Scalars['Float']['input']>;
  readonly layoutY?: InputMaybe<Scalars['Float']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly startChannel?: InputMaybe<Scalars['Int']['input']>;
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly universe?: InputMaybe<Scalars['Int']['input']>;
};

export type FixtureUsage = {
  readonly __typename?: 'FixtureUsage';
  readonly cues: ReadonlyArray<CueUsageSummary>;
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
  readonly scenes: ReadonlyArray<SceneSummary>;
};

export type FixtureValue = {
  readonly __typename?: 'FixtureValue';
  readonly channelValues: ReadonlyArray<Scalars['Int']['output']>;
  readonly fixture: FixtureInstance;
  readonly id: Scalars['ID']['output'];
  readonly sceneOrder?: Maybe<Scalars['Int']['output']>;
};

export type FixtureValueInput = {
  readonly channelValues: ReadonlyArray<Scalars['Int']['input']>;
  readonly fixtureId: Scalars['ID']['input'];
  readonly sceneOrder?: InputMaybe<Scalars['Int']['input']>;
};

export enum ImportMode {
  Create = 'CREATE',
  Merge = 'MERGE'
}

export type ImportOflFixtureInput = {
  readonly manufacturer: Scalars['String']['input'];
  readonly oflFixtureJson: Scalars['String']['input'];
  readonly replace?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ImportOptionsInput = {
  readonly fixtureConflictStrategy?: InputMaybe<FixtureConflictStrategy>;
  readonly importBuiltInFixtures?: InputMaybe<Scalars['Boolean']['input']>;
  readonly mode: ImportMode;
  readonly projectName?: InputMaybe<Scalars['String']['input']>;
  readonly targetProjectId?: InputMaybe<Scalars['ID']['input']>;
};

export type ImportResult = {
  readonly __typename?: 'ImportResult';
  readonly projectId: Scalars['String']['output'];
  readonly stats: ImportStats;
  readonly warnings: ReadonlyArray<Scalars['String']['output']>;
};

export type ImportStats = {
  readonly __typename?: 'ImportStats';
  readonly cueListsCreated: Scalars['Int']['output'];
  readonly cuesCreated: Scalars['Int']['output'];
  readonly fixtureDefinitionsCreated: Scalars['Int']['output'];
  readonly fixtureInstancesCreated: Scalars['Int']['output'];
  readonly scenesCreated: Scalars['Int']['output'];
};

export type InstanceChannel = {
  readonly __typename?: 'InstanceChannel';
  readonly defaultValue: Scalars['Int']['output'];
  readonly fadeBehavior: FadeBehavior;
  readonly id: Scalars['ID']['output'];
  readonly isDiscrete: Scalars['Boolean']['output'];
  readonly maxValue: Scalars['Int']['output'];
  readonly minValue: Scalars['Int']['output'];
  readonly name: Scalars['String']['output'];
  readonly offset: Scalars['Int']['output'];
  readonly type: ChannelType;
};

export type LacyLightsFixture = {
  readonly __typename?: 'LacyLightsFixture';
  readonly manufacturer: Scalars['String']['output'];
  readonly model: Scalars['String']['output'];
};

export type ModeChannel = {
  readonly __typename?: 'ModeChannel';
  readonly channel: ChannelDefinition;
  readonly id: Scalars['ID']['output'];
  readonly offset: Scalars['Int']['output'];
};

export type Mutation = {
  readonly __typename?: 'Mutation';
  readonly activateSceneFromBoard: Scalars['Boolean']['output'];
  readonly addFixturesToScene: Scene;
  readonly addSceneToBoard: SceneBoardButton;
  readonly bulkCreateCueLists: ReadonlyArray<CueList>;
  readonly bulkCreateCues: ReadonlyArray<Cue>;
  readonly bulkCreateFixtureDefinitions: ReadonlyArray<FixtureDefinition>;
  readonly bulkCreateFixtures: ReadonlyArray<FixtureInstance>;
  readonly bulkCreateProjects: ReadonlyArray<Project>;
  readonly bulkCreateSceneBoardButtons: ReadonlyArray<SceneBoardButton>;
  readonly bulkCreateSceneBoards: ReadonlyArray<SceneBoard>;
  readonly bulkCreateScenes: ReadonlyArray<Scene>;
  readonly bulkDeleteCueLists: BulkDeleteResult;
  readonly bulkDeleteCues: BulkDeleteResult;
  readonly bulkDeleteFixtureDefinitions: BulkDeleteResult;
  readonly bulkDeleteFixtures: BulkDeleteResult;
  readonly bulkDeleteProjects: BulkDeleteResult;
  readonly bulkDeleteSceneBoardButtons: BulkDeleteResult;
  readonly bulkDeleteSceneBoards: BulkDeleteResult;
  readonly bulkDeleteScenes: BulkDeleteResult;
  readonly bulkUpdateCueLists: ReadonlyArray<CueList>;
  readonly bulkUpdateCues: ReadonlyArray<Cue>;
  readonly bulkUpdateFixtureDefinitions: ReadonlyArray<FixtureDefinition>;
  readonly bulkUpdateFixtures: ReadonlyArray<FixtureInstance>;
  readonly bulkUpdateInstanceChannelsFadeBehavior: ReadonlyArray<InstanceChannel>;
  readonly bulkUpdateProjects: ReadonlyArray<Project>;
  readonly bulkUpdateSceneBoardButtons: ReadonlyArray<SceneBoardButton>;
  readonly bulkUpdateSceneBoards: ReadonlyArray<SceneBoard>;
  readonly bulkUpdateScenes: ReadonlyArray<Scene>;
  /** Cancel an ongoing OFL import */
  readonly cancelOFLImport: Scalars['Boolean']['output'];
  readonly cancelPreviewSession: Scalars['Boolean']['output'];
  readonly cloneScene: Scene;
  readonly commitPreviewSession: Scalars['Boolean']['output'];
  readonly connectWiFi: WiFiConnectionResult;
  readonly createCue: Cue;
  readonly createCueList: CueList;
  readonly createFixtureDefinition: FixtureDefinition;
  readonly createFixtureInstance: FixtureInstance;
  readonly createProject: Project;
  readonly createScene: Scene;
  readonly createSceneBoard: SceneBoard;
  readonly deleteCue: Scalars['Boolean']['output'];
  readonly deleteCueList: Scalars['Boolean']['output'];
  readonly deleteFixtureDefinition: Scalars['Boolean']['output'];
  readonly deleteFixtureInstance: Scalars['Boolean']['output'];
  readonly deleteProject: Scalars['Boolean']['output'];
  readonly deleteScene: Scalars['Boolean']['output'];
  readonly deleteSceneBoard: Scalars['Boolean']['output'];
  readonly disconnectWiFi: WiFiConnectionResult;
  readonly duplicateScene: Scene;
  readonly exportProject: ExportResult;
  readonly exportProjectToQLC: QlcExportResult;
  readonly fadeToBlack: Scalars['Boolean']['output'];
  readonly forgetWiFiNetwork: Scalars['Boolean']['output'];
  readonly goToCue: Scalars['Boolean']['output'];
  readonly importOFLFixture: FixtureDefinition;
  readonly importProject: ImportResult;
  readonly importProjectFromQLC: QlcImportResult;
  readonly initializePreviewWithScene: Scalars['Boolean']['output'];
  readonly nextCue: Scalars['Boolean']['output'];
  readonly playCue: Scalars['Boolean']['output'];
  readonly previousCue: Scalars['Boolean']['output'];
  readonly removeFixturesFromScene: Scene;
  readonly removeSceneFromBoard: Scalars['Boolean']['output'];
  readonly reorderCues: Scalars['Boolean']['output'];
  readonly reorderProjectFixtures: Scalars['Boolean']['output'];
  readonly reorderSceneFixtures: Scalars['Boolean']['output'];
  readonly setChannelValue: Scalars['Boolean']['output'];
  readonly setSceneLive: Scalars['Boolean']['output'];
  readonly setWiFiEnabled: WiFiStatus;
  readonly startCueList: Scalars['Boolean']['output'];
  readonly startPreviewSession: PreviewSession;
  readonly stopCueList: Scalars['Boolean']['output'];
  /** Trigger an OFL import/update operation */
  readonly triggerOFLImport: OflImportResult;
  readonly updateAllRepositories: ReadonlyArray<UpdateResult>;
  readonly updateCue: Cue;
  readonly updateCueList: CueList;
  readonly updateFixtureDefinition: FixtureDefinition;
  readonly updateFixtureInstance: FixtureInstance;
  readonly updateFixturePositions: Scalars['Boolean']['output'];
  readonly updateInstanceChannelFadeBehavior: InstanceChannel;
  readonly updatePreviewChannel: Scalars['Boolean']['output'];
  readonly updateProject: Project;
  readonly updateRepository: UpdateResult;
  readonly updateScene: Scene;
  readonly updateSceneBoard: SceneBoard;
  readonly updateSceneBoardButton: SceneBoardButton;
  readonly updateSceneBoardButtonPositions: Scalars['Boolean']['output'];
  readonly updateScenePartial: Scene;
  readonly updateSetting: Setting;
};


export type MutationActivateSceneFromBoardArgs = {
  fadeTimeOverride?: InputMaybe<Scalars['Float']['input']>;
  sceneBoardId: Scalars['ID']['input'];
  sceneId: Scalars['ID']['input'];
};


export type MutationAddFixturesToSceneArgs = {
  fixtureValues: ReadonlyArray<FixtureValueInput>;
  overwriteExisting?: InputMaybe<Scalars['Boolean']['input']>;
  sceneId: Scalars['ID']['input'];
};


export type MutationAddSceneToBoardArgs = {
  input: CreateSceneBoardButtonInput;
};


export type MutationBulkCreateCueListsArgs = {
  input: BulkCueListCreateInput;
};


export type MutationBulkCreateCuesArgs = {
  input: BulkCueCreateInput;
};


export type MutationBulkCreateFixtureDefinitionsArgs = {
  input: BulkFixtureDefinitionCreateInput;
};


export type MutationBulkCreateFixturesArgs = {
  input: BulkFixtureCreateInput;
};


export type MutationBulkCreateProjectsArgs = {
  input: BulkProjectCreateInput;
};


export type MutationBulkCreateSceneBoardButtonsArgs = {
  input: BulkSceneBoardButtonCreateInput;
};


export type MutationBulkCreateSceneBoardsArgs = {
  input: BulkSceneBoardCreateInput;
};


export type MutationBulkCreateScenesArgs = {
  input: BulkSceneCreateInput;
};


export type MutationBulkDeleteCueListsArgs = {
  cueListIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteCuesArgs = {
  cueIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteFixtureDefinitionsArgs = {
  definitionIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteFixturesArgs = {
  fixtureIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteProjectsArgs = {
  projectIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteSceneBoardButtonsArgs = {
  buttonIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteSceneBoardsArgs = {
  sceneBoardIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteScenesArgs = {
  sceneIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkUpdateCueListsArgs = {
  input: BulkCueListUpdateInput;
};


export type MutationBulkUpdateCuesArgs = {
  input: BulkCueUpdateInput;
};


export type MutationBulkUpdateFixtureDefinitionsArgs = {
  input: BulkFixtureDefinitionUpdateInput;
};


export type MutationBulkUpdateFixturesArgs = {
  input: BulkFixtureUpdateInput;
};


export type MutationBulkUpdateInstanceChannelsFadeBehaviorArgs = {
  updates: ReadonlyArray<ChannelFadeBehaviorInput>;
};


export type MutationBulkUpdateProjectsArgs = {
  input: BulkProjectUpdateInput;
};


export type MutationBulkUpdateSceneBoardButtonsArgs = {
  input: BulkSceneBoardButtonUpdateInput;
};


export type MutationBulkUpdateSceneBoardsArgs = {
  input: BulkSceneBoardUpdateInput;
};


export type MutationBulkUpdateScenesArgs = {
  input: BulkSceneUpdateInput;
};


export type MutationCancelPreviewSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationCloneSceneArgs = {
  newName: Scalars['String']['input'];
  sceneId: Scalars['ID']['input'];
};


export type MutationCommitPreviewSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationConnectWiFiArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  ssid: Scalars['String']['input'];
};


export type MutationCreateCueArgs = {
  input: CreateCueInput;
};


export type MutationCreateCueListArgs = {
  input: CreateCueListInput;
};


export type MutationCreateFixtureDefinitionArgs = {
  input: CreateFixtureDefinitionInput;
};


export type MutationCreateFixtureInstanceArgs = {
  input: CreateFixtureInstanceInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateSceneArgs = {
  input: CreateSceneInput;
};


export type MutationCreateSceneBoardArgs = {
  input: CreateSceneBoardInput;
};


export type MutationDeleteCueArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCueListArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFixtureDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFixtureInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSceneArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSceneBoardArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDuplicateSceneArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExportProjectArgs = {
  options?: InputMaybe<ExportOptionsInput>;
  projectId: Scalars['ID']['input'];
};


export type MutationExportProjectToQlcArgs = {
  fixtureMappings?: InputMaybe<ReadonlyArray<FixtureMappingInput>>;
  projectId: Scalars['ID']['input'];
};


export type MutationFadeToBlackArgs = {
  fadeOutTime: Scalars['Float']['input'];
};


export type MutationForgetWiFiNetworkArgs = {
  ssid: Scalars['String']['input'];
};


export type MutationGoToCueArgs = {
  cueIndex: Scalars['Int']['input'];
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationImportOflFixtureArgs = {
  input: ImportOflFixtureInput;
};


export type MutationImportProjectArgs = {
  jsonContent: Scalars['String']['input'];
  options: ImportOptionsInput;
};


export type MutationImportProjectFromQlcArgs = {
  originalFileName: Scalars['String']['input'];
  xmlContent: Scalars['String']['input'];
};


export type MutationInitializePreviewWithSceneArgs = {
  sceneId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationNextCueArgs = {
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationPlayCueArgs = {
  cueId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationPreviousCueArgs = {
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationRemoveFixturesFromSceneArgs = {
  fixtureIds: ReadonlyArray<Scalars['ID']['input']>;
  sceneId: Scalars['ID']['input'];
};


export type MutationRemoveSceneFromBoardArgs = {
  buttonId: Scalars['ID']['input'];
};


export type MutationReorderCuesArgs = {
  cueListId: Scalars['ID']['input'];
  cueOrders: ReadonlyArray<CueOrderInput>;
};


export type MutationReorderProjectFixturesArgs = {
  fixtureOrders: ReadonlyArray<FixtureOrderInput>;
  projectId: Scalars['ID']['input'];
};


export type MutationReorderSceneFixturesArgs = {
  fixtureOrders: ReadonlyArray<FixtureOrderInput>;
  sceneId: Scalars['ID']['input'];
};


export type MutationSetChannelValueArgs = {
  channel: Scalars['Int']['input'];
  universe: Scalars['Int']['input'];
  value: Scalars['Int']['input'];
};


export type MutationSetSceneLiveArgs = {
  sceneId: Scalars['ID']['input'];
};


export type MutationSetWiFiEnabledArgs = {
  enabled: Scalars['Boolean']['input'];
};


export type MutationStartCueListArgs = {
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
  startFromCue?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationStartPreviewSessionArgs = {
  projectId: Scalars['ID']['input'];
};


export type MutationStopCueListArgs = {
  cueListId: Scalars['ID']['input'];
};


export type MutationTriggerOflImportArgs = {
  options?: InputMaybe<OflImportOptionsInput>;
};


export type MutationUpdateCueArgs = {
  id: Scalars['ID']['input'];
  input: CreateCueInput;
};


export type MutationUpdateCueListArgs = {
  id: Scalars['ID']['input'];
  input: CreateCueListInput;
};


export type MutationUpdateFixtureDefinitionArgs = {
  id: Scalars['ID']['input'];
  input: CreateFixtureDefinitionInput;
};


export type MutationUpdateFixtureInstanceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFixtureInstanceInput;
};


export type MutationUpdateFixturePositionsArgs = {
  positions: ReadonlyArray<FixturePositionInput>;
};


export type MutationUpdateInstanceChannelFadeBehaviorArgs = {
  channelId: Scalars['ID']['input'];
  fadeBehavior: FadeBehavior;
};


export type MutationUpdatePreviewChannelArgs = {
  channelIndex: Scalars['Int']['input'];
  fixtureId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
  value: Scalars['Int']['input'];
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  input: CreateProjectInput;
};


export type MutationUpdateRepositoryArgs = {
  repository: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateSceneArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
};


export type MutationUpdateSceneBoardArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSceneBoardInput;
};


export type MutationUpdateSceneBoardButtonArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSceneBoardButtonInput;
};


export type MutationUpdateSceneBoardButtonPositionsArgs = {
  positions: ReadonlyArray<SceneBoardButtonPositionInput>;
};


export type MutationUpdateScenePartialArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  fixtureValues?: InputMaybe<ReadonlyArray<FixtureValueInput>>;
  mergeFixtures?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  sceneId: Scalars['ID']['input'];
};


export type MutationUpdateSettingArgs = {
  input: UpdateSettingInput;
};

export type NetworkInterfaceOption = {
  readonly __typename?: 'NetworkInterfaceOption';
  readonly address: Scalars['String']['output'];
  readonly broadcast: Scalars['String']['output'];
  readonly description: Scalars['String']['output'];
  readonly interfaceType: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
};

/** Type of fixture change detected during OFL update check */
export enum OflFixtureChangeType {
  New = 'NEW',
  Unchanged = 'UNCHANGED',
  Updated = 'UPDATED'
}

/** Information about a fixture that may need updating */
export type OflFixtureUpdate = {
  readonly __typename?: 'OFLFixtureUpdate';
  /** Type of change */
  readonly changeType: OflFixtureChangeType;
  /** Current hash (null if new) */
  readonly currentHash?: Maybe<Scalars['String']['output']>;
  /** Unique key (manufacturer/model) */
  readonly fixtureKey: Scalars['String']['output'];
  /** Number of instances using this definition */
  readonly instanceCount: Scalars['Int']['output'];
  /** Whether this fixture is currently in use by any project */
  readonly isInUse: Scalars['Boolean']['output'];
  /** Manufacturer name */
  readonly manufacturer: Scalars['String']['output'];
  /** Model name */
  readonly model: Scalars['String']['output'];
  /** New hash from OFL */
  readonly newHash: Scalars['String']['output'];
};

/** Options for triggering an OFL import */
export type OflImportOptionsInput = {
  /** Force reimport of all fixtures, even if unchanged */
  readonly forceReimport?: InputMaybe<Scalars['Boolean']['input']>;
  /** Only import specific manufacturers (empty = all) */
  readonly manufacturers?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  /** Prefer bundled data over fetching from GitHub */
  readonly preferBundled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Update fixtures that are currently in use by projects */
  readonly updateInUseFixtures?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Phases of the OFL import process */
export enum OflImportPhase {
  Cancelled = 'CANCELLED',
  Complete = 'COMPLETE',
  Downloading = 'DOWNLOADING',
  Extracting = 'EXTRACTING',
  Failed = 'FAILED',
  Idle = 'IDLE',
  Importing = 'IMPORTING',
  Parsing = 'PARSING'
}

/** Final result of an OFL import operation */
export type OflImportResult = {
  readonly __typename?: 'OFLImportResult';
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  readonly oflVersion: Scalars['String']['output'];
  readonly stats: OflImportStats;
  readonly success: Scalars['Boolean']['output'];
};

/** Statistics about an OFL import */
export type OflImportStats = {
  readonly __typename?: 'OFLImportStats';
  readonly durationSeconds: Scalars['Float']['output'];
  readonly failedImports: Scalars['Int']['output'];
  readonly skippedDuplicates: Scalars['Int']['output'];
  readonly successfulImports: Scalars['Int']['output'];
  readonly totalProcessed: Scalars['Int']['output'];
  readonly updatedFixtures: Scalars['Int']['output'];
};

/** Real-time status of an OFL import operation */
export type OflImportStatus = {
  readonly __typename?: 'OFLImportStatus';
  /** When the import completed (if done) */
  readonly completedAt?: Maybe<Scalars['String']['output']>;
  /** Name of the current fixture being imported */
  readonly currentFixture?: Maybe<Scalars['String']['output']>;
  /** Current manufacturer being processed */
  readonly currentManufacturer?: Maybe<Scalars['String']['output']>;
  /** Error message if phase is FAILED */
  readonly errorMessage?: Maybe<Scalars['String']['output']>;
  /** Estimated seconds remaining (null if unknown) */
  readonly estimatedSecondsRemaining?: Maybe<Scalars['Int']['output']>;
  /** Number of fixtures that failed to import */
  readonly failedCount: Scalars['Int']['output'];
  /** Number of fixtures successfully imported */
  readonly importedCount: Scalars['Int']['output'];
  /** Whether an import is currently in progress */
  readonly isImporting: Scalars['Boolean']['output'];
  /** OFL version/commit being imported */
  readonly oflVersion?: Maybe<Scalars['String']['output']>;
  /** Percentage complete (0-100) */
  readonly percentComplete: Scalars['Float']['output'];
  /** Current phase of the import */
  readonly phase: OflImportPhase;
  /** Number of fixtures skipped (already exist) */
  readonly skippedCount: Scalars['Int']['output'];
  /** When the import started */
  readonly startedAt?: Maybe<Scalars['String']['output']>;
  /** Total number of fixtures to import */
  readonly totalFixtures: Scalars['Int']['output'];
  /** Whether using bundled data (offline) or fetched from GitHub */
  readonly usingBundledData: Scalars['Boolean']['output'];
};

/** Result of checking for OFL updates */
export type OflUpdateCheckResult = {
  readonly __typename?: 'OFLUpdateCheckResult';
  /** Number of changed fixtures */
  readonly changedFixtureCount: Scalars['Int']['output'];
  /** Number of changed fixtures that are in use */
  readonly changedInUseCount: Scalars['Int']['output'];
  /** When this check was performed */
  readonly checkedAt: Scalars['String']['output'];
  /** Total fixtures in current database */
  readonly currentFixtureCount: Scalars['Int']['output'];
  /** Detailed list of fixture changes (limited) */
  readonly fixtureUpdates: ReadonlyArray<OflFixtureUpdate>;
  /** Number of new fixtures available */
  readonly newFixtureCount: Scalars['Int']['output'];
  /** Total fixtures in OFL source */
  readonly oflFixtureCount: Scalars['Int']['output'];
  /** OFL version/commit being checked */
  readonly oflVersion: Scalars['String']['output'];
};

export type PaginationInfo = {
  readonly __typename?: 'PaginationInfo';
  readonly hasMore: Scalars['Boolean']['output'];
  readonly page: Scalars['Int']['output'];
  readonly perPage: Scalars['Int']['output'];
  readonly total: Scalars['Int']['output'];
  readonly totalPages: Scalars['Int']['output'];
};

export type PreviewSession = {
  readonly __typename?: 'PreviewSession';
  readonly createdAt: Scalars['String']['output'];
  readonly dmxOutput: ReadonlyArray<UniverseOutput>;
  readonly id: Scalars['ID']['output'];
  readonly isActive: Scalars['Boolean']['output'];
  readonly project: Project;
  readonly user: User;
};

export type Project = {
  readonly __typename?: 'Project';
  readonly createdAt: Scalars['String']['output'];
  readonly cueListCount: Scalars['Int']['output'];
  readonly cueLists: ReadonlyArray<CueList>;
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly fixtureCount: Scalars['Int']['output'];
  readonly fixtures: ReadonlyArray<FixtureInstance>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly sceneBoards: ReadonlyArray<SceneBoard>;
  readonly sceneCount: Scalars['Int']['output'];
  readonly scenes: ReadonlyArray<Scene>;
  readonly updatedAt: Scalars['String']['output'];
  readonly users: ReadonlyArray<ProjectUser>;
};

export enum ProjectRole {
  Editor = 'EDITOR',
  Owner = 'OWNER',
  Viewer = 'VIEWER'
}

export type ProjectUpdateItem = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly projectId: Scalars['ID']['input'];
};

export type ProjectUser = {
  readonly __typename?: 'ProjectUser';
  readonly id: Scalars['ID']['output'];
  readonly joinedAt: Scalars['String']['output'];
  readonly project: Project;
  readonly role: ProjectRole;
  readonly user: User;
};

export type QlcExportResult = {
  readonly __typename?: 'QLCExportResult';
  readonly cueListCount: Scalars['Int']['output'];
  readonly fixtureCount: Scalars['Int']['output'];
  readonly projectName: Scalars['String']['output'];
  readonly sceneCount: Scalars['Int']['output'];
  readonly xmlContent: Scalars['String']['output'];
};

export type QlcFixtureDefinition = {
  readonly __typename?: 'QLCFixtureDefinition';
  readonly manufacturer: Scalars['String']['output'];
  readonly model: Scalars['String']['output'];
  readonly modes: ReadonlyArray<QlcFixtureMode>;
  readonly type: Scalars['String']['output'];
};

export type QlcFixtureMappingResult = {
  readonly __typename?: 'QLCFixtureMappingResult';
  readonly defaultMappings: ReadonlyArray<FixtureMapping>;
  readonly lacyLightsFixtures: ReadonlyArray<LacyLightsFixture>;
  readonly projectId: Scalars['String']['output'];
  readonly suggestions: ReadonlyArray<FixtureMappingSuggestion>;
};

export type QlcFixtureMode = {
  readonly __typename?: 'QLCFixtureMode';
  readonly channelCount: Scalars['Int']['output'];
  readonly name: Scalars['String']['output'];
};

export type QlcImportResult = {
  readonly __typename?: 'QLCImportResult';
  readonly cueListCount: Scalars['Int']['output'];
  readonly fixtureCount: Scalars['Int']['output'];
  readonly originalFileName: Scalars['String']['output'];
  readonly project: Project;
  readonly sceneCount: Scalars['Int']['output'];
  readonly warnings: ReadonlyArray<Scalars['String']['output']>;
};

export type Query = {
  readonly __typename?: 'Query';
  readonly allDmxOutput: ReadonlyArray<UniverseOutput>;
  readonly availableVersions: ReadonlyArray<Scalars['String']['output']>;
  readonly channelMap: ChannelMapResult;
  /** Check for available OFL updates without importing */
  readonly checkOFLUpdates: OflUpdateCheckResult;
  readonly compareScenes: SceneComparison;
  readonly cue?: Maybe<Cue>;
  readonly cueList?: Maybe<CueList>;
  readonly cueListPlaybackStatus?: Maybe<CueListPlaybackStatus>;
  readonly cueLists: ReadonlyArray<CueListSummary>;
  readonly cueListsByIds: ReadonlyArray<CueList>;
  readonly cuesByIds: ReadonlyArray<Cue>;
  readonly currentActiveScene?: Maybe<Scene>;
  readonly dmxOutput: ReadonlyArray<Scalars['Int']['output']>;
  readonly fixtureDefinition?: Maybe<FixtureDefinition>;
  readonly fixtureDefinitions: ReadonlyArray<FixtureDefinition>;
  readonly fixtureDefinitionsByIds: ReadonlyArray<FixtureDefinition>;
  readonly fixtureInstance?: Maybe<FixtureInstance>;
  readonly fixtureInstances: FixtureInstancePage;
  readonly fixtureUsage: FixtureUsage;
  readonly fixturesByIds: ReadonlyArray<FixtureInstance>;
  readonly getQLCFixtureMappingSuggestions: QlcFixtureMappingResult;
  readonly networkInterfaceOptions: ReadonlyArray<NetworkInterfaceOption>;
  /** Get the current status of any ongoing OFL import */
  readonly oflImportStatus: OflImportStatus;
  readonly previewSession?: Maybe<PreviewSession>;
  readonly project?: Maybe<Project>;
  readonly projects: ReadonlyArray<Project>;
  readonly projectsByIds: ReadonlyArray<Project>;
  readonly savedWifiNetworks: ReadonlyArray<WiFiNetwork>;
  readonly scene?: Maybe<Scene>;
  readonly sceneBoard?: Maybe<SceneBoard>;
  readonly sceneBoardButton?: Maybe<SceneBoardButton>;
  readonly sceneBoards: ReadonlyArray<SceneBoard>;
  readonly sceneBoardsByIds: ReadonlyArray<SceneBoard>;
  readonly sceneFixtures: ReadonlyArray<SceneFixtureSummary>;
  readonly sceneUsage: SceneUsage;
  readonly scenes: ScenePage;
  readonly scenesByIds: ReadonlyArray<Scene>;
  readonly searchCues: CuePage;
  readonly searchFixtures: FixtureInstancePage;
  readonly searchScenes: ScenePage;
  readonly setting?: Maybe<Setting>;
  readonly settings: ReadonlyArray<Setting>;
  readonly suggestChannelAssignment: ChannelAssignmentSuggestion;
  readonly systemInfo: SystemInfo;
  readonly systemVersions: SystemVersionInfo;
  readonly wifiNetworks: ReadonlyArray<WiFiNetwork>;
  readonly wifiStatus: WiFiStatus;
};


export type QueryAvailableVersionsArgs = {
  repository: Scalars['String']['input'];
};


export type QueryChannelMapArgs = {
  projectId: Scalars['ID']['input'];
  universe?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCompareScenesArgs = {
  sceneId1: Scalars['ID']['input'];
  sceneId2: Scalars['ID']['input'];
};


export type QueryCueArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCueListArgs = {
  id: Scalars['ID']['input'];
  includeSceneDetails?: InputMaybe<Scalars['Boolean']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCueListPlaybackStatusArgs = {
  cueListId: Scalars['ID']['input'];
};


export type QueryCueListsArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryCueListsByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QueryCuesByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QueryDmxOutputArgs = {
  universe: Scalars['Int']['input'];
};


export type QueryFixtureDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFixtureDefinitionsArgs = {
  filter?: InputMaybe<FixtureDefinitionFilter>;
};


export type QueryFixtureDefinitionsByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QueryFixtureInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFixtureInstancesArgs = {
  filter?: InputMaybe<FixtureFilterInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['ID']['input'];
};


export type QueryFixtureUsageArgs = {
  fixtureId: Scalars['ID']['input'];
};


export type QueryFixturesByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QueryGetQlcFixtureMappingSuggestionsArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryPreviewSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectsByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QuerySceneArgs = {
  id: Scalars['ID']['input'];
  includeFixtureValues?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySceneBoardArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySceneBoardButtonArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySceneBoardsArgs = {
  projectId: Scalars['ID']['input'];
};


export type QuerySceneBoardsByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QuerySceneFixturesArgs = {
  sceneId: Scalars['ID']['input'];
};


export type QuerySceneUsageArgs = {
  sceneId: Scalars['ID']['input'];
};


export type QueryScenesArgs = {
  filter?: InputMaybe<SceneFilterInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['ID']['input'];
  sortBy?: InputMaybe<SceneSortField>;
};


export type QueryScenesByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QuerySearchCuesArgs = {
  cueListId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchFixturesArgs = {
  filter?: InputMaybe<FixtureFilterInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
};


export type QuerySearchScenesArgs = {
  filter?: InputMaybe<SceneFilterInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
};


export type QuerySettingArgs = {
  key: Scalars['String']['input'];
};


export type QuerySuggestChannelAssignmentArgs = {
  input: ChannelAssignmentInput;
};


export type QueryWifiNetworksArgs = {
  deduplicate?: InputMaybe<Scalars['Boolean']['input']>;
  rescan?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RepositoryVersion = {
  readonly __typename?: 'RepositoryVersion';
  readonly installed: Scalars['String']['output'];
  readonly latest: Scalars['String']['output'];
  readonly repository: Scalars['String']['output'];
  readonly updateAvailable: Scalars['Boolean']['output'];
};

export type Scene = {
  readonly __typename?: 'Scene';
  readonly createdAt: Scalars['String']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly fixtureValues: ReadonlyArray<FixtureValue>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly project: Project;
  readonly updatedAt: Scalars['String']['output'];
};

export type SceneBoard = {
  readonly __typename?: 'SceneBoard';
  readonly buttons: ReadonlyArray<SceneBoardButton>;
  readonly canvasHeight: Scalars['Int']['output'];
  readonly canvasWidth: Scalars['Int']['output'];
  readonly createdAt: Scalars['String']['output'];
  readonly defaultFadeTime: Scalars['Float']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly gridSize?: Maybe<Scalars['Int']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly project: Project;
  readonly updatedAt: Scalars['String']['output'];
};

export type SceneBoardButton = {
  readonly __typename?: 'SceneBoardButton';
  readonly color?: Maybe<Scalars['String']['output']>;
  readonly createdAt: Scalars['String']['output'];
  readonly height?: Maybe<Scalars['Int']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly label?: Maybe<Scalars['String']['output']>;
  readonly layoutX: Scalars['Int']['output'];
  readonly layoutY: Scalars['Int']['output'];
  readonly scene: Scene;
  readonly sceneBoard: SceneBoard;
  readonly updatedAt: Scalars['String']['output'];
  readonly width?: Maybe<Scalars['Int']['output']>;
};

export type SceneBoardButtonPositionInput = {
  readonly buttonId: Scalars['ID']['input'];
  readonly layoutX: Scalars['Int']['input'];
  readonly layoutY: Scalars['Int']['input'];
};

export type SceneBoardButtonUpdateItem = {
  readonly buttonId: Scalars['ID']['input'];
  readonly color?: InputMaybe<Scalars['String']['input']>;
  readonly height?: InputMaybe<Scalars['Int']['input']>;
  readonly label?: InputMaybe<Scalars['String']['input']>;
  readonly layoutX?: InputMaybe<Scalars['Int']['input']>;
  readonly layoutY?: InputMaybe<Scalars['Int']['input']>;
  readonly width?: InputMaybe<Scalars['Int']['input']>;
};

export type SceneBoardUpdateItem = {
  readonly canvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly canvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly defaultFadeTime?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly gridSize?: InputMaybe<Scalars['Int']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly sceneBoardId: Scalars['ID']['input'];
};

export type SceneComparison = {
  readonly __typename?: 'SceneComparison';
  readonly differences: ReadonlyArray<SceneDifference>;
  readonly differentFixtureCount: Scalars['Int']['output'];
  readonly identicalFixtureCount: Scalars['Int']['output'];
  readonly scene1: SceneSummary;
  readonly scene2: SceneSummary;
};

export type SceneDifference = {
  readonly __typename?: 'SceneDifference';
  readonly differenceType: DifferenceType;
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
  readonly scene1Values?: Maybe<ReadonlyArray<Scalars['Int']['output']>>;
  readonly scene2Values?: Maybe<ReadonlyArray<Scalars['Int']['output']>>;
};

export type SceneFilterInput = {
  readonly nameContains?: InputMaybe<Scalars['String']['input']>;
  readonly usesFixture?: InputMaybe<Scalars['ID']['input']>;
};

export type SceneFixtureSummary = {
  readonly __typename?: 'SceneFixtureSummary';
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
  readonly fixtureType: FixtureType;
};

export type ScenePage = {
  readonly __typename?: 'ScenePage';
  readonly pagination: PaginationInfo;
  readonly scenes: ReadonlyArray<SceneSummary>;
};

export enum SceneSortField {
  CreatedAt = 'CREATED_AT',
  Name = 'NAME',
  UpdatedAt = 'UPDATED_AT'
}

export type SceneSummary = {
  readonly __typename?: 'SceneSummary';
  readonly createdAt: Scalars['String']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly fixtureCount: Scalars['Int']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly updatedAt: Scalars['String']['output'];
};

export type SceneUpdateItem = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly sceneId: Scalars['ID']['input'];
};

export type SceneUsage = {
  readonly __typename?: 'SceneUsage';
  readonly cues: ReadonlyArray<CueUsageSummary>;
  readonly sceneId: Scalars['ID']['output'];
  readonly sceneName: Scalars['String']['output'];
};

export type Setting = {
  readonly __typename?: 'Setting';
  readonly createdAt: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly key: Scalars['String']['output'];
  readonly updatedAt: Scalars['String']['output'];
  readonly value: Scalars['String']['output'];
};

export type Subscription = {
  readonly __typename?: 'Subscription';
  readonly cueListPlaybackUpdated: CueListPlaybackStatus;
  readonly dmxOutputChanged: UniverseOutput;
  /** Real-time updates during OFL import */
  readonly oflImportProgress: OflImportStatus;
  readonly previewSessionUpdated: PreviewSession;
  readonly projectUpdated: Project;
  readonly systemInfoUpdated: SystemInfo;
  readonly wifiStatusUpdated: WiFiStatus;
};


export type SubscriptionCueListPlaybackUpdatedArgs = {
  cueListId: Scalars['ID']['input'];
};


export type SubscriptionDmxOutputChangedArgs = {
  universe?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionPreviewSessionUpdatedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionProjectUpdatedArgs = {
  projectId: Scalars['ID']['input'];
};

export type SystemInfo = {
  readonly __typename?: 'SystemInfo';
  readonly artnetBroadcastAddress: Scalars['String']['output'];
  readonly artnetEnabled: Scalars['Boolean']['output'];
};

export type SystemVersionInfo = {
  readonly __typename?: 'SystemVersionInfo';
  readonly lastChecked: Scalars['String']['output'];
  readonly repositories: ReadonlyArray<RepositoryVersion>;
  readonly versionManagementSupported: Scalars['Boolean']['output'];
};

export type UniverseChannelMap = {
  readonly __typename?: 'UniverseChannelMap';
  readonly availableChannels: Scalars['Int']['output'];
  readonly channelUsage: ReadonlyArray<Maybe<ChannelUsage>>;
  readonly fixtures: ReadonlyArray<ChannelMapFixture>;
  readonly universe: Scalars['Int']['output'];
  readonly usedChannels: Scalars['Int']['output'];
};

export type UniverseOutput = {
  readonly __typename?: 'UniverseOutput';
  readonly channels: ReadonlyArray<Scalars['Int']['output']>;
  readonly universe: Scalars['Int']['output'];
};

export type UpdateFixtureInstanceInput = {
  readonly definitionId?: InputMaybe<Scalars['ID']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly layoutRotation?: InputMaybe<Scalars['Float']['input']>;
  readonly layoutX?: InputMaybe<Scalars['Float']['input']>;
  readonly layoutY?: InputMaybe<Scalars['Float']['input']>;
  readonly modeId?: InputMaybe<Scalars['ID']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly projectOrder?: InputMaybe<Scalars['Int']['input']>;
  readonly startChannel?: InputMaybe<Scalars['Int']['input']>;
  readonly tags?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly universe?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateResult = {
  readonly __typename?: 'UpdateResult';
  readonly error?: Maybe<Scalars['String']['output']>;
  readonly message?: Maybe<Scalars['String']['output']>;
  readonly newVersion: Scalars['String']['output'];
  readonly previousVersion: Scalars['String']['output'];
  readonly repository: Scalars['String']['output'];
  readonly success: Scalars['Boolean']['output'];
};

export type UpdateSceneBoardButtonInput = {
  readonly color?: InputMaybe<Scalars['String']['input']>;
  readonly height?: InputMaybe<Scalars['Int']['input']>;
  readonly label?: InputMaybe<Scalars['String']['input']>;
  readonly layoutX?: InputMaybe<Scalars['Int']['input']>;
  readonly layoutY?: InputMaybe<Scalars['Int']['input']>;
  readonly width?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSceneBoardInput = {
  readonly canvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly canvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly defaultFadeTime?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly gridSize?: InputMaybe<Scalars['Int']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSceneInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly fixtureValues?: InputMaybe<ReadonlyArray<FixtureValueInput>>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSettingInput = {
  readonly key: Scalars['String']['input'];
  readonly value: Scalars['String']['input'];
};

export type User = {
  readonly __typename?: 'User';
  readonly createdAt: Scalars['String']['output'];
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name?: Maybe<Scalars['String']['output']>;
  readonly role: UserRole;
};

export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER'
}

export type WiFiConnectionResult = {
  readonly __typename?: 'WiFiConnectionResult';
  readonly connected: Scalars['Boolean']['output'];
  readonly message?: Maybe<Scalars['String']['output']>;
  readonly success: Scalars['Boolean']['output'];
};

export type WiFiNetwork = {
  readonly __typename?: 'WiFiNetwork';
  readonly frequency: Scalars['String']['output'];
  readonly inUse: Scalars['Boolean']['output'];
  readonly saved: Scalars['Boolean']['output'];
  readonly security: WiFiSecurityType;
  readonly signalStrength: Scalars['Int']['output'];
  readonly ssid: Scalars['String']['output'];
};

export enum WiFiSecurityType {
  Open = 'OPEN',
  Owe = 'OWE',
  Wep = 'WEP',
  Wpa3Eap = 'WPA3_EAP',
  Wpa3Psk = 'WPA3_PSK',
  WpaEap = 'WPA_EAP',
  WpaPsk = 'WPA_PSK'
}

export type WiFiStatus = {
  readonly __typename?: 'WiFiStatus';
  readonly available: Scalars['Boolean']['output'];
  readonly connected: Scalars['Boolean']['output'];
  readonly enabled: Scalars['Boolean']['output'];
  readonly frequency?: Maybe<Scalars['String']['output']>;
  readonly ipAddress?: Maybe<Scalars['String']['output']>;
  readonly macAddress?: Maybe<Scalars['String']['output']>;
  readonly signalStrength?: Maybe<Scalars['Int']['output']>;
  readonly ssid?: Maybe<Scalars['String']['output']>;
};

export type TestConnectionQueryVariables = Exact<{ [key: string]: never; }>;


export type TestConnectionQuery = { readonly __typename: 'Query' };

export type GetProjectCueListsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectCueListsQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly cueLists: ReadonlyArray<{ readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly description?: string | null, readonly loop: boolean, readonly createdAt: string, readonly updatedAt: string, readonly cues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string } }> }> } | null };

export type GetCueListQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCueListQuery = { readonly __typename?: 'Query', readonly cueList?: { readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly description?: string | null, readonly loop: boolean, readonly createdAt: string, readonly updatedAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly cues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null } }> } | null };

export type CreateCueListMutationVariables = Exact<{
  input: CreateCueListInput;
}>;


export type CreateCueListMutation = { readonly __typename?: 'Mutation', readonly createCueList: { readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly description?: string | null, readonly loop: boolean, readonly createdAt: string, readonly cues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number }> } };

export type UpdateCueListMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CreateCueListInput;
}>;


export type UpdateCueListMutation = { readonly __typename?: 'Mutation', readonly updateCueList: { readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly description?: string | null, readonly loop: boolean, readonly updatedAt: string, readonly cues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number }> } };

export type DeleteCueListMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCueListMutation = { readonly __typename?: 'Mutation', readonly deleteCueList: boolean };

export type CreateCueMutationVariables = Exact<{
  input: CreateCueInput;
}>;


export type CreateCueMutation = { readonly __typename?: 'Mutation', readonly createCue: { readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string } } };

export type UpdateCueMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CreateCueInput;
}>;


export type UpdateCueMutation = { readonly __typename?: 'Mutation', readonly updateCue: { readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string } } };

export type DeleteCueMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCueMutation = { readonly __typename?: 'Mutation', readonly deleteCue: boolean };

export type PlayCueMutationVariables = Exact<{
  cueId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type PlayCueMutation = { readonly __typename?: 'Mutation', readonly playCue: boolean };

export type FadeToBlackMutationVariables = Exact<{
  fadeOutTime: Scalars['Float']['input'];
}>;


export type FadeToBlackMutation = { readonly __typename?: 'Mutation', readonly fadeToBlack: boolean };

export type ReorderCuesMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
  cueOrders: ReadonlyArray<CueOrderInput> | CueOrderInput;
}>;


export type ReorderCuesMutation = { readonly __typename?: 'Mutation', readonly reorderCues: boolean };

export type BulkUpdateCuesMutationVariables = Exact<{
  input: BulkCueUpdateInput;
}>;


export type BulkUpdateCuesMutation = { readonly __typename?: 'Mutation', readonly bulkUpdateCues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string } }> };

export type GetCueListPlaybackStatusQueryVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type GetCueListPlaybackStatusQuery = { readonly __typename?: 'Query', readonly cueListPlaybackStatus?: { readonly __typename?: 'CueListPlaybackStatus', readonly cueListId: string, readonly currentCueIndex?: number | null, readonly isPlaying: boolean, readonly isFading: boolean, readonly fadeProgress?: number | null, readonly lastUpdated: string } | null };

export type StartCueListMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
  startFromCue?: InputMaybe<Scalars['Int']['input']>;
}>;


export type StartCueListMutation = { readonly __typename?: 'Mutation', readonly startCueList: boolean };

export type NextCueMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type NextCueMutation = { readonly __typename?: 'Mutation', readonly nextCue: boolean };

export type PreviousCueMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type PreviousCueMutation = { readonly __typename?: 'Mutation', readonly previousCue: boolean };

export type GoToCueMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
  cueIndex: Scalars['Int']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type GoToCueMutation = { readonly __typename?: 'Mutation', readonly goToCue: boolean };

export type StopCueListMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type StopCueListMutation = { readonly __typename?: 'Mutation', readonly stopCueList: boolean };

export type CueListPlaybackUpdatedSubscriptionVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type CueListPlaybackUpdatedSubscription = { readonly __typename?: 'Subscription', readonly cueListPlaybackUpdated: { readonly __typename?: 'CueListPlaybackStatus', readonly cueListId: string, readonly currentCueIndex?: number | null, readonly isPlaying: boolean, readonly isFading: boolean, readonly fadeProgress?: number | null, readonly lastUpdated: string } };

export type GetFixtureDefinitionsQueryVariables = Exact<{
  filter?: InputMaybe<FixtureDefinitionFilter>;
}>;


export type GetFixtureDefinitionsQuery = { readonly __typename?: 'Query', readonly fixtureDefinitions: ReadonlyArray<{ readonly __typename?: 'FixtureDefinition', readonly id: string, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modes: ReadonlyArray<{ readonly __typename?: 'FixtureMode', readonly id: string, readonly name: string, readonly channelCount: number }> }> };

export type GetManufacturersQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetManufacturersQuery = { readonly __typename?: 'Query', readonly fixtureDefinitions: ReadonlyArray<{ readonly __typename?: 'FixtureDefinition', readonly manufacturer: string }> };

export type GetModelsQueryVariables = Exact<{
  manufacturer: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetModelsQuery = { readonly __typename?: 'Query', readonly fixtureDefinitions: ReadonlyArray<{ readonly __typename?: 'FixtureDefinition', readonly id: string, readonly model: string, readonly modes: ReadonlyArray<{ readonly __typename?: 'FixtureMode', readonly id: string, readonly name: string, readonly channelCount: number }> }> };

export type CreateFixtureInstanceMutationVariables = Exact<{
  input: CreateFixtureInstanceInput;
}>;


export type CreateFixtureInstanceMutation = { readonly __typename?: 'Mutation', readonly createFixtureInstance: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly description?: string | null, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly modeName: string, readonly channelCount: number } };

export type UpdateFixtureInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateFixtureInstanceInput;
}>;


export type UpdateFixtureInstanceMutation = { readonly __typename?: 'Mutation', readonly updateFixtureInstance: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly description?: string | null, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly modeName: string, readonly channelCount: number } };

export type DeleteFixtureInstanceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteFixtureInstanceMutation = { readonly __typename?: 'Mutation', readonly deleteFixtureInstance: boolean };

export type ImportOflFixtureMutationVariables = Exact<{
  input: ImportOflFixtureInput;
}>;


export type ImportOflFixtureMutation = { readonly __typename?: 'Mutation', readonly importOFLFixture: { readonly __typename?: 'FixtureDefinition', readonly id: string, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelDefinition', readonly id: string, readonly name: string, readonly type: ChannelType, readonly offset: number, readonly fadeBehavior: FadeBehavior, readonly isDiscrete: boolean }>, readonly modes: ReadonlyArray<{ readonly __typename?: 'FixtureMode', readonly id: string, readonly name: string, readonly shortName?: string | null, readonly channelCount: number }> } };

export type GetProjectFixturesQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectFixturesQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly fixtures: ReadonlyArray<{ readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly description?: string | null, readonly universe: number, readonly startChannel: number, readonly tags: ReadonlyArray<string>, readonly projectOrder?: number | null, readonly createdAt: string, readonly definitionId: string, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number, readonly fadeBehavior: FadeBehavior, readonly isDiscrete: boolean }> }> } | null };

export type ReorderProjectFixturesMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  fixtureOrders: ReadonlyArray<FixtureOrderInput> | FixtureOrderInput;
}>;


export type ReorderProjectFixturesMutation = { readonly __typename?: 'Mutation', readonly reorderProjectFixtures: boolean };

export type ReorderSceneFixturesMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
  fixtureOrders: ReadonlyArray<FixtureOrderInput> | FixtureOrderInput;
}>;


export type ReorderSceneFixturesMutation = { readonly __typename?: 'Mutation', readonly reorderSceneFixtures: boolean };

export type UpdateFixturePositionsMutationVariables = Exact<{
  positions: ReadonlyArray<FixturePositionInput> | FixturePositionInput;
}>;


export type UpdateFixturePositionsMutation = { readonly __typename?: 'Mutation', readonly updateFixturePositions: boolean };

export type SuggestChannelAssignmentQueryVariables = Exact<{
  input: ChannelAssignmentInput;
}>;


export type SuggestChannelAssignmentQuery = { readonly __typename?: 'Query', readonly suggestChannelAssignment: { readonly __typename?: 'ChannelAssignmentSuggestion', readonly universe: number, readonly totalChannelsNeeded: number, readonly availableChannelsRemaining: number, readonly assignments: ReadonlyArray<{ readonly __typename?: 'FixtureChannelAssignment', readonly fixtureName: string, readonly manufacturer: string, readonly model: string, readonly mode?: string | null, readonly startChannel: number, readonly endChannel: number, readonly channelCount: number, readonly channelRange: string }> } };

export type GetChannelMapQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
  universe?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetChannelMapQuery = { readonly __typename?: 'Query', readonly channelMap: { readonly __typename?: 'ChannelMapResult', readonly projectId: string, readonly universes: ReadonlyArray<{ readonly __typename?: 'UniverseChannelMap', readonly universe: number, readonly availableChannels: number, readonly usedChannels: number, readonly fixtures: ReadonlyArray<{ readonly __typename?: 'ChannelMapFixture', readonly id: string, readonly name: string, readonly type: FixtureType, readonly startChannel: number, readonly endChannel: number, readonly channelCount: number }> }> } };

export type BulkCreateFixturesMutationVariables = Exact<{
  input: BulkFixtureCreateInput;
}>;


export type BulkCreateFixturesMutation = { readonly __typename?: 'Mutation', readonly bulkCreateFixtures: ReadonlyArray<{ readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly description?: string | null, readonly universe: number, readonly startChannel: number, readonly tags: ReadonlyArray<string>, readonly projectOrder?: number | null, readonly createdAt: string, readonly definitionId: string, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly layoutX?: number | null, readonly layoutY?: number | null, readonly layoutRotation?: number | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number, readonly fadeBehavior: FadeBehavior, readonly isDiscrete: boolean }> }> };

export type BulkUpdateFixturesMutationVariables = Exact<{
  input: BulkFixtureUpdateInput;
}>;


export type BulkUpdateFixturesMutation = { readonly __typename?: 'Mutation', readonly bulkUpdateFixtures: ReadonlyArray<{ readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly description?: string | null, readonly universe: number, readonly startChannel: number, readonly tags: ReadonlyArray<string>, readonly projectOrder?: number | null, readonly definitionId: string, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly layoutX?: number | null, readonly layoutY?: number | null, readonly layoutRotation?: number | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number, readonly fadeBehavior: FadeBehavior, readonly isDiscrete: boolean }> }> };

export type UpdateInstanceChannelFadeBehaviorMutationVariables = Exact<{
  channelId: Scalars['ID']['input'];
  fadeBehavior: FadeBehavior;
}>;


export type UpdateInstanceChannelFadeBehaviorMutation = { readonly __typename?: 'Mutation', readonly updateInstanceChannelFadeBehavior: { readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number, readonly fadeBehavior: FadeBehavior, readonly isDiscrete: boolean } };

export type BulkUpdateInstanceChannelsFadeBehaviorMutationVariables = Exact<{
  updates: ReadonlyArray<ChannelFadeBehaviorInput> | ChannelFadeBehaviorInput;
}>;


export type BulkUpdateInstanceChannelsFadeBehaviorMutation = { readonly __typename?: 'Mutation', readonly bulkUpdateInstanceChannelsFadeBehavior: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number, readonly fadeBehavior: FadeBehavior, readonly isDiscrete: boolean }> };

export type OflImportStatsFieldsFragment = { readonly __typename?: 'OFLImportStats', readonly totalProcessed: number, readonly successfulImports: number, readonly failedImports: number, readonly skippedDuplicates: number, readonly updatedFixtures: number, readonly durationSeconds: number };

export type OflImportStatusFieldsFragment = { readonly __typename?: 'OFLImportStatus', readonly isImporting: boolean, readonly phase: OflImportPhase, readonly currentManufacturer?: string | null, readonly currentFixture?: string | null, readonly totalFixtures: number, readonly importedCount: number, readonly failedCount: number, readonly skippedCount: number, readonly percentComplete: number, readonly startedAt?: string | null, readonly completedAt?: string | null, readonly estimatedSecondsRemaining?: number | null, readonly errorMessage?: string | null, readonly oflVersion?: string | null, readonly usingBundledData: boolean };

export type OflFixtureUpdateFieldsFragment = { readonly __typename?: 'OFLFixtureUpdate', readonly fixtureKey: string, readonly manufacturer: string, readonly model: string, readonly changeType: OflFixtureChangeType, readonly isInUse: boolean, readonly instanceCount: number, readonly currentHash?: string | null, readonly newHash: string };

export type GetOflImportStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOflImportStatusQuery = { readonly __typename?: 'Query', readonly oflImportStatus: { readonly __typename?: 'OFLImportStatus', readonly isImporting: boolean, readonly phase: OflImportPhase, readonly currentManufacturer?: string | null, readonly currentFixture?: string | null, readonly totalFixtures: number, readonly importedCount: number, readonly failedCount: number, readonly skippedCount: number, readonly percentComplete: number, readonly startedAt?: string | null, readonly completedAt?: string | null, readonly estimatedSecondsRemaining?: number | null, readonly errorMessage?: string | null, readonly oflVersion?: string | null, readonly usingBundledData: boolean } };

export type CheckOflUpdatesQueryVariables = Exact<{ [key: string]: never; }>;


export type CheckOflUpdatesQuery = { readonly __typename?: 'Query', readonly checkOFLUpdates: { readonly __typename?: 'OFLUpdateCheckResult', readonly currentFixtureCount: number, readonly oflFixtureCount: number, readonly newFixtureCount: number, readonly changedFixtureCount: number, readonly changedInUseCount: number, readonly oflVersion: string, readonly checkedAt: string, readonly fixtureUpdates: ReadonlyArray<{ readonly __typename?: 'OFLFixtureUpdate', readonly fixtureKey: string, readonly manufacturer: string, readonly model: string, readonly changeType: OflFixtureChangeType, readonly isInUse: boolean, readonly instanceCount: number, readonly currentHash?: string | null, readonly newHash: string }> } };

export type TriggerOflImportMutationVariables = Exact<{
  options?: InputMaybe<OflImportOptionsInput>;
}>;


export type TriggerOflImportMutation = { readonly __typename?: 'Mutation', readonly triggerOFLImport: { readonly __typename?: 'OFLImportResult', readonly success: boolean, readonly errorMessage?: string | null, readonly oflVersion: string, readonly stats: { readonly __typename?: 'OFLImportStats', readonly totalProcessed: number, readonly successfulImports: number, readonly failedImports: number, readonly skippedDuplicates: number, readonly updatedFixtures: number, readonly durationSeconds: number } } };

export type CancelOflImportMutationVariables = Exact<{ [key: string]: never; }>;


export type CancelOflImportMutation = { readonly __typename?: 'Mutation', readonly cancelOFLImport: boolean };

export type OflImportProgressSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OflImportProgressSubscription = { readonly __typename?: 'Subscription', readonly oflImportProgress: { readonly __typename?: 'OFLImportStatus', readonly isImporting: boolean, readonly phase: OflImportPhase, readonly currentManufacturer?: string | null, readonly currentFixture?: string | null, readonly totalFixtures: number, readonly importedCount: number, readonly failedCount: number, readonly skippedCount: number, readonly percentComplete: number, readonly startedAt?: string | null, readonly completedAt?: string | null, readonly estimatedSecondsRemaining?: number | null, readonly errorMessage?: string | null, readonly oflVersion?: string | null, readonly usingBundledData: boolean } };

export type GetProjectsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProjectsQuery = { readonly __typename?: 'Query', readonly projects: ReadonlyArray<{ readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string }> };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProjectQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly fixtures: ReadonlyArray<{ readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string }>, readonly scenes: ReadonlyArray<{ readonly __typename?: 'Scene', readonly id: string, readonly name: string }>, readonly cueLists: ReadonlyArray<{ readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly loop: boolean }> } | null };

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { readonly __typename?: 'Mutation', readonly createProject: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string } };

export type UpdateProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CreateProjectInput;
}>;


export type UpdateProjectMutation = { readonly __typename?: 'Mutation', readonly updateProject: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly updatedAt: string } };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProjectMutation = { readonly __typename?: 'Mutation', readonly deleteProject: boolean };

export type ImportProjectFromQlcMutationVariables = Exact<{
  xmlContent: Scalars['String']['input'];
  originalFileName: Scalars['String']['input'];
}>;


export type ImportProjectFromQlcMutation = { readonly __typename?: 'Mutation', readonly importProjectFromQLC: { readonly __typename?: 'QLCImportResult', readonly originalFileName: string, readonly fixtureCount: number, readonly sceneCount: number, readonly cueListCount: number, readonly warnings: ReadonlyArray<string>, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string } } };

export type GetQlcFixtureMappingSuggestionsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetQlcFixtureMappingSuggestionsQuery = { readonly __typename?: 'Query', readonly getQLCFixtureMappingSuggestions: { readonly __typename?: 'QLCFixtureMappingResult', readonly projectId: string, readonly lacyLightsFixtures: ReadonlyArray<{ readonly __typename?: 'LacyLightsFixture', readonly manufacturer: string, readonly model: string }>, readonly suggestions: ReadonlyArray<{ readonly __typename?: 'FixtureMappingSuggestion', readonly fixture: { readonly __typename?: 'LacyLightsFixture', readonly manufacturer: string, readonly model: string }, readonly suggestions: ReadonlyArray<{ readonly __typename?: 'QLCFixtureDefinition', readonly manufacturer: string, readonly model: string, readonly type: string, readonly modes: ReadonlyArray<{ readonly __typename?: 'QLCFixtureMode', readonly name: string, readonly channelCount: number }> }> }>, readonly defaultMappings: ReadonlyArray<{ readonly __typename?: 'FixtureMapping', readonly lacyLightsKey: string, readonly qlcManufacturer: string, readonly qlcModel: string, readonly qlcMode: string }> } };

export type ExportProjectToQlcMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  fixtureMappings: ReadonlyArray<FixtureMappingInput> | FixtureMappingInput;
}>;


export type ExportProjectToQlcMutation = { readonly __typename?: 'Mutation', readonly exportProjectToQLC: { readonly __typename?: 'QLCExportResult', readonly projectName: string, readonly xmlContent: string, readonly fixtureCount: number, readonly sceneCount: number, readonly cueListCount: number } };

export type ExportProjectMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  options?: InputMaybe<ExportOptionsInput>;
}>;


export type ExportProjectMutation = { readonly __typename?: 'Mutation', readonly exportProject: { readonly __typename?: 'ExportResult', readonly projectId: string, readonly projectName: string, readonly jsonContent: string, readonly stats: { readonly __typename?: 'ExportStats', readonly fixtureDefinitionsCount: number, readonly fixtureInstancesCount: number, readonly scenesCount: number, readonly cueListsCount: number, readonly cuesCount: number } } };

export type ImportProjectMutationVariables = Exact<{
  jsonContent: Scalars['String']['input'];
  options: ImportOptionsInput;
}>;


export type ImportProjectMutation = { readonly __typename?: 'Mutation', readonly importProject: { readonly __typename?: 'ImportResult', readonly projectId: string, readonly warnings: ReadonlyArray<string>, readonly stats: { readonly __typename?: 'ImportStats', readonly fixtureDefinitionsCreated: number, readonly fixtureInstancesCreated: number, readonly scenesCreated: number, readonly cueListsCreated: number, readonly cuesCreated: number } } };

export type GetProjectSceneBoardsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectSceneBoardsQuery = { readonly __typename?: 'Query', readonly sceneBoards: ReadonlyArray<{ readonly __typename?: 'SceneBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly createdAt: string, readonly updatedAt: string, readonly buttons: ReadonlyArray<{ readonly __typename?: 'SceneBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null } }> }> };

export type GetSceneBoardQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSceneBoardQuery = { readonly __typename?: 'Query', readonly sceneBoard?: { readonly __typename?: 'SceneBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly createdAt: string, readonly updatedAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly buttons: ReadonlyArray<{ readonly __typename?: 'SceneBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null, readonly createdAt: string, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null } }> } | null };

export type CreateSceneBoardMutationVariables = Exact<{
  input: CreateSceneBoardInput;
}>;


export type CreateSceneBoardMutation = { readonly __typename?: 'Mutation', readonly createSceneBoard: { readonly __typename?: 'SceneBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly createdAt: string, readonly buttons: ReadonlyArray<{ readonly __typename?: 'SceneBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string } }> } };

export type UpdateSceneBoardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneBoardInput;
}>;


export type UpdateSceneBoardMutation = { readonly __typename?: 'Mutation', readonly updateSceneBoard: { readonly __typename?: 'SceneBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly updatedAt: string } };

export type DeleteSceneBoardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSceneBoardMutation = { readonly __typename?: 'Mutation', readonly deleteSceneBoard: boolean };

export type AddSceneToBoardMutationVariables = Exact<{
  input: CreateSceneBoardButtonInput;
}>;


export type AddSceneToBoardMutation = { readonly __typename?: 'Mutation', readonly addSceneToBoard: { readonly __typename?: 'SceneBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null, readonly scene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null }, readonly sceneBoard: { readonly __typename?: 'SceneBoard', readonly id: string } } };

export type UpdateSceneBoardButtonMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneBoardButtonInput;
}>;


export type UpdateSceneBoardButtonMutation = { readonly __typename?: 'Mutation', readonly updateSceneBoardButton: { readonly __typename?: 'SceneBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null } };

export type RemoveSceneFromBoardMutationVariables = Exact<{
  buttonId: Scalars['ID']['input'];
}>;


export type RemoveSceneFromBoardMutation = { readonly __typename?: 'Mutation', readonly removeSceneFromBoard: boolean };

export type UpdateSceneBoardButtonPositionsMutationVariables = Exact<{
  positions: ReadonlyArray<SceneBoardButtonPositionInput> | SceneBoardButtonPositionInput;
}>;


export type UpdateSceneBoardButtonPositionsMutation = { readonly __typename?: 'Mutation', readonly updateSceneBoardButtonPositions: boolean };

export type ActivateSceneFromBoardMutationVariables = Exact<{
  sceneBoardId: Scalars['ID']['input'];
  sceneId: Scalars['ID']['input'];
  fadeTimeOverride?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ActivateSceneFromBoardMutation = { readonly __typename?: 'Mutation', readonly activateSceneFromBoard: boolean };

export type GetProjectScenesQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectScenesQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly scenes: ReadonlyArray<{ readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly id: string, readonly channelValues: ReadonlyArray<number>, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } }> }> } | null };

export type GetSceneQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSceneQuery = { readonly __typename?: 'Query', readonly scene?: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly id: string, readonly channelValues: ReadonlyArray<number>, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly layoutX?: number | null, readonly layoutY?: number | null, readonly layoutRotation?: number | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } }> } | null };

export type CreateSceneMutationVariables = Exact<{
  input: CreateSceneInput;
}>;


export type CreateSceneMutation = { readonly __typename?: 'Mutation', readonly createScene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly channelValues: ReadonlyArray<number>, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string } }> } };

export type UpdateSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateSceneInput;
}>;


export type UpdateSceneMutation = { readonly __typename?: 'Mutation', readonly updateScene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null, readonly updatedAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly channelValues: ReadonlyArray<number>, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string } }> } };

export type DeleteSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSceneMutation = { readonly __typename?: 'Mutation', readonly deleteScene: boolean };

export type DuplicateSceneMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DuplicateSceneMutation = { readonly __typename?: 'Mutation', readonly duplicateScene: { readonly __typename?: 'Scene', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly channelValues: ReadonlyArray<number>, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string } }> } };

export type GetCurrentActiveSceneQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentActiveSceneQuery = { readonly __typename?: 'Query', readonly currentActiveScene?: { readonly __typename?: 'Scene', readonly id: string } | null };

export type ActivateSceneMutationVariables = Exact<{
  sceneId: Scalars['ID']['input'];
}>;


export type ActivateSceneMutation = { readonly __typename?: 'Mutation', readonly setSceneLive: boolean };

export type StartPreviewSessionMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type StartPreviewSessionMutation = { readonly __typename?: 'Mutation', readonly startPreviewSession: { readonly __typename?: 'PreviewSession', readonly id: string, readonly isActive: boolean, readonly createdAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly dmxOutput: ReadonlyArray<{ readonly __typename?: 'UniverseOutput', readonly universe: number, readonly channels: ReadonlyArray<number> }> } };

export type CancelPreviewSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type CancelPreviewSessionMutation = { readonly __typename?: 'Mutation', readonly cancelPreviewSession: boolean };

export type CommitPreviewSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type CommitPreviewSessionMutation = { readonly __typename?: 'Mutation', readonly commitPreviewSession: boolean };

export type UpdatePreviewChannelMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  fixtureId: Scalars['ID']['input'];
  channelIndex: Scalars['Int']['input'];
  value: Scalars['Int']['input'];
}>;


export type UpdatePreviewChannelMutation = { readonly __typename?: 'Mutation', readonly updatePreviewChannel: boolean };

export type InitializePreviewWithSceneMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  sceneId: Scalars['ID']['input'];
}>;


export type InitializePreviewWithSceneMutation = { readonly __typename?: 'Mutation', readonly initializePreviewWithScene: boolean };

export type GetPreviewSessionQueryVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type GetPreviewSessionQuery = { readonly __typename?: 'Query', readonly previewSession?: { readonly __typename?: 'PreviewSession', readonly id: string, readonly isActive: boolean, readonly createdAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly dmxOutput: ReadonlyArray<{ readonly __typename?: 'UniverseOutput', readonly universe: number, readonly channels: ReadonlyArray<number> }> } | null };

export type PreviewSessionUpdatedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type PreviewSessionUpdatedSubscription = { readonly __typename?: 'Subscription', readonly previewSessionUpdated: { readonly __typename?: 'PreviewSession', readonly id: string, readonly isActive: boolean, readonly createdAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly dmxOutput: ReadonlyArray<{ readonly __typename?: 'UniverseOutput', readonly universe: number, readonly channels: ReadonlyArray<number> }> } };

export type DmxOutputChangedSubscriptionVariables = Exact<{
  universe?: InputMaybe<Scalars['Int']['input']>;
}>;


export type DmxOutputChangedSubscription = { readonly __typename?: 'Subscription', readonly dmxOutputChanged: { readonly __typename?: 'UniverseOutput', readonly universe: number, readonly channels: ReadonlyArray<number> } };

export type GetSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSettingsQuery = { readonly __typename?: 'Query', readonly settings: ReadonlyArray<{ readonly __typename?: 'Setting', readonly id: string, readonly key: string, readonly value: string, readonly createdAt: string, readonly updatedAt: string }> };

export type GetSettingQueryVariables = Exact<{
  key: Scalars['String']['input'];
}>;


export type GetSettingQuery = { readonly __typename?: 'Query', readonly setting?: { readonly __typename?: 'Setting', readonly id: string, readonly key: string, readonly value: string, readonly createdAt: string, readonly updatedAt: string } | null };

export type UpdateSettingMutationVariables = Exact<{
  input: UpdateSettingInput;
}>;


export type UpdateSettingMutation = { readonly __typename?: 'Mutation', readonly updateSetting: { readonly __typename?: 'Setting', readonly id: string, readonly key: string, readonly value: string, readonly createdAt: string, readonly updatedAt: string } };

export type GetSystemInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSystemInfoQuery = { readonly __typename?: 'Query', readonly systemInfo: { readonly __typename?: 'SystemInfo', readonly artnetBroadcastAddress: string, readonly artnetEnabled: boolean } };

export type GetNetworkInterfaceOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNetworkInterfaceOptionsQuery = { readonly __typename?: 'Query', readonly networkInterfaceOptions: ReadonlyArray<{ readonly __typename?: 'NetworkInterfaceOption', readonly name: string, readonly address: string, readonly broadcast: string, readonly description: string, readonly interfaceType: string }> };

export type SystemInfoUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SystemInfoUpdatedSubscription = { readonly __typename?: 'Subscription', readonly systemInfoUpdated: { readonly __typename?: 'SystemInfo', readonly artnetBroadcastAddress: string, readonly artnetEnabled: boolean } };

export type GetSystemVersionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSystemVersionsQuery = { readonly __typename?: 'Query', readonly systemVersions: { readonly __typename?: 'SystemVersionInfo', readonly versionManagementSupported: boolean, readonly lastChecked: string, readonly repositories: ReadonlyArray<{ readonly __typename?: 'RepositoryVersion', readonly repository: string, readonly installed: string, readonly latest: string, readonly updateAvailable: boolean }> } };

export type GetAvailableVersionsQueryVariables = Exact<{
  repository: Scalars['String']['input'];
}>;


export type GetAvailableVersionsQuery = { readonly __typename?: 'Query', readonly availableVersions: ReadonlyArray<string> };

export type UpdateRepositoryMutationVariables = Exact<{
  repository: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateRepositoryMutation = { readonly __typename?: 'Mutation', readonly updateRepository: { readonly __typename?: 'UpdateResult', readonly success: boolean, readonly repository: string, readonly previousVersion: string, readonly newVersion: string, readonly message?: string | null, readonly error?: string | null } };

export type UpdateAllRepositoriesMutationVariables = Exact<{ [key: string]: never; }>;


export type UpdateAllRepositoriesMutation = { readonly __typename?: 'Mutation', readonly updateAllRepositories: ReadonlyArray<{ readonly __typename?: 'UpdateResult', readonly success: boolean, readonly repository: string, readonly previousVersion: string, readonly newVersion: string, readonly message?: string | null, readonly error?: string | null }> };

export type WiFiNetworksQueryVariables = Exact<{
  rescan?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type WiFiNetworksQuery = { readonly __typename?: 'Query', readonly wifiNetworks: ReadonlyArray<{ readonly __typename?: 'WiFiNetwork', readonly ssid: string, readonly signalStrength: number, readonly frequency: string, readonly security: WiFiSecurityType, readonly inUse: boolean, readonly saved: boolean }> };

export type WiFiStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type WiFiStatusQuery = { readonly __typename?: 'Query', readonly wifiStatus: { readonly __typename?: 'WiFiStatus', readonly available: boolean, readonly enabled: boolean, readonly connected: boolean, readonly ssid?: string | null, readonly signalStrength?: number | null, readonly ipAddress?: string | null, readonly macAddress?: string | null, readonly frequency?: string | null } };

export type SavedWiFiNetworksQueryVariables = Exact<{ [key: string]: never; }>;


export type SavedWiFiNetworksQuery = { readonly __typename?: 'Query', readonly savedWifiNetworks: ReadonlyArray<{ readonly __typename?: 'WiFiNetwork', readonly ssid: string, readonly signalStrength: number, readonly frequency: string, readonly security: WiFiSecurityType, readonly inUse: boolean, readonly saved: boolean }> };

export type ConnectWiFiMutationVariables = Exact<{
  ssid: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
}>;


export type ConnectWiFiMutation = { readonly __typename?: 'Mutation', readonly connectWiFi: { readonly __typename?: 'WiFiConnectionResult', readonly success: boolean, readonly message?: string | null, readonly connected: boolean } };

export type DisconnectWiFiMutationVariables = Exact<{ [key: string]: never; }>;


export type DisconnectWiFiMutation = { readonly __typename?: 'Mutation', readonly disconnectWiFi: { readonly __typename?: 'WiFiConnectionResult', readonly success: boolean, readonly message?: string | null, readonly connected: boolean } };

export type SetWiFiEnabledMutationVariables = Exact<{
  enabled: Scalars['Boolean']['input'];
}>;


export type SetWiFiEnabledMutation = { readonly __typename?: 'Mutation', readonly setWiFiEnabled: { readonly __typename?: 'WiFiStatus', readonly available: boolean, readonly enabled: boolean, readonly connected: boolean, readonly ssid?: string | null, readonly signalStrength?: number | null, readonly ipAddress?: string | null, readonly macAddress?: string | null, readonly frequency?: string | null } };

export type ForgetWiFiNetworkMutationVariables = Exact<{
  ssid: Scalars['String']['input'];
}>;


export type ForgetWiFiNetworkMutation = { readonly __typename?: 'Mutation', readonly forgetWiFiNetwork: boolean };

export type WiFiStatusUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type WiFiStatusUpdatedSubscription = { readonly __typename?: 'Subscription', readonly wifiStatusUpdated: { readonly __typename?: 'WiFiStatus', readonly available: boolean, readonly enabled: boolean, readonly connected: boolean, readonly ssid?: string | null, readonly signalStrength?: number | null, readonly ipAddress?: string | null, readonly macAddress?: string | null, readonly frequency?: string | null } };

export const OflImportStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"successfulImports"}},{"kind":"Field","name":{"kind":"Name","value":"failedImports"}},{"kind":"Field","name":{"kind":"Name","value":"skippedDuplicates"}},{"kind":"Field","name":{"kind":"Name","value":"updatedFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}}]} as unknown as DocumentNode<OflImportStatsFieldsFragment, unknown>;
export const OflImportStatusFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isImporting"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"currentManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"currentFixture"}},{"kind":"Field","name":{"kind":"Name","value":"totalFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"importedCount"}},{"kind":"Field","name":{"kind":"Name","value":"failedCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedSecondsRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"usingBundledData"}}]}}]} as unknown as DocumentNode<OflImportStatusFieldsFragment, unknown>;
export const OflFixtureUpdateFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLFixtureUpdateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLFixtureUpdate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureKey"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"isInUse"}},{"kind":"Field","name":{"kind":"Name","value":"instanceCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentHash"}},{"kind":"Field","name":{"kind":"Name","value":"newHash"}}]}}]} as unknown as DocumentNode<OflFixtureUpdateFieldsFragment, unknown>;
export const TestConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestConnection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]} as unknown as DocumentNode<TestConnectionQuery, TestConnectionQueryVariables>;
export const GetProjectCueListsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectCueLists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cueLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectCueListsQuery, GetProjectCueListsQueryVariables>;
export const GetCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}}]}}]}}]}}]} as unknown as DocumentNode<GetCueListQuery, GetCueListQueryVariables>;
export const CreateCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCueListMutation, CreateCueListMutationVariables>;
export const UpdateCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCueListMutation, UpdateCueListMutationVariables>;
export const DeleteCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCueListMutation, DeleteCueListMutationVariables>;
export const CreateCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}}]}}]}}]} as unknown as DocumentNode<CreateCueMutation, CreateCueMutationVariables>;
export const UpdateCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}}]}}]}}]} as unknown as DocumentNode<UpdateCueMutation, UpdateCueMutationVariables>;
export const DeleteCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCueMutation, DeleteCueMutationVariables>;
export const PlayCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PlayCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"playCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<PlayCueMutation, PlayCueMutationVariables>;
export const FadeToBlackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FadeToBlack"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeOutTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fadeToBlack"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fadeOutTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeOutTime"}}}]}]}}]} as unknown as DocumentNode<FadeToBlackMutation, FadeToBlackMutationVariables>;
export const ReorderCuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderCues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueOrders"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CueOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderCues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"cueOrders"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueOrders"}}}]}]}}]} as unknown as DocumentNode<ReorderCuesMutation, ReorderCuesMutationVariables>;
export const BulkUpdateCuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateCues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkCueUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateCues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateCuesMutation, BulkUpdateCuesMutationVariables>;
export const GetCueListPlaybackStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCueListPlaybackStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListPlaybackStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueIndex"}},{"kind":"Field","name":{"kind":"Name","value":"isPlaying"}},{"kind":"Field","name":{"kind":"Name","value":"isFading"}},{"kind":"Field","name":{"kind":"Name","value":"fadeProgress"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<GetCueListPlaybackStatusQuery, GetCueListPlaybackStatusQueryVariables>;
export const StartCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startFromCue"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"startFromCue"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startFromCue"}}}]}]}}]} as unknown as DocumentNode<StartCueListMutation, StartCueListMutationVariables>;
export const NextCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NextCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<NextCueMutation, NextCueMutationVariables>;
export const PreviousCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PreviousCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previousCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<PreviousCueMutation, PreviousCueMutationVariables>;
export const GoToCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GoToCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueIndex"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"goToCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"cueIndex"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueIndex"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<GoToCueMutation, GoToCueMutationVariables>;
export const StopCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}]}]}}]} as unknown as DocumentNode<StopCueListMutation, StopCueListMutationVariables>;
export const CueListPlaybackUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CueListPlaybackUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListPlaybackUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueIndex"}},{"kind":"Field","name":{"kind":"Name","value":"isPlaying"}},{"kind":"Field","name":{"kind":"Name","value":"isFading"}},{"kind":"Field","name":{"kind":"Name","value":"fadeProgress"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<CueListPlaybackUpdatedSubscription, CueListPlaybackUpdatedSubscriptionVariables>;
export const GetFixtureDefinitionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFixtureDefinitions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureDefinitionFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}}]} as unknown as DocumentNode<GetFixtureDefinitionsQuery, GetFixtureDefinitionsQueryVariables>;
export const GetManufacturersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetManufacturers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"manufacturer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}}]}}]}}]} as unknown as DocumentNode<GetManufacturersQuery, GetManufacturersQueryVariables>;
export const GetModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"manufacturer"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"manufacturer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"manufacturer"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"model"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}}]} as unknown as DocumentNode<GetModelsQuery, GetModelsQueryVariables>;
export const CreateFixtureInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFixtureInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFixtureInstanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFixtureInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]} as unknown as DocumentNode<CreateFixtureInstanceMutation, CreateFixtureInstanceMutationVariables>;
export const UpdateFixtureInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFixtureInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFixtureInstanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFixtureInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]} as unknown as DocumentNode<UpdateFixtureInstanceMutation, UpdateFixtureInstanceMutationVariables>;
export const DeleteFixtureInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFixtureInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFixtureInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteFixtureInstanceMutation, DeleteFixtureInstanceMutationVariables>;
export const ImportOflFixtureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportOFLFixture"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImportOFLFixtureInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importOFLFixture"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}}]} as unknown as DocumentNode<ImportOflFixtureMutation, ImportOflFixtureMutationVariables>;
export const GetProjectFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"projectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectFixturesQuery, GetProjectFixturesQueryVariables>;
export const ReorderProjectFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderProjectFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderProjectFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureOrders"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}}}]}]}}]} as unknown as DocumentNode<ReorderProjectFixturesMutation, ReorderProjectFixturesMutationVariables>;
export const ReorderSceneFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderSceneFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderSceneFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureOrders"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}}}]}]}}]} as unknown as DocumentNode<ReorderSceneFixturesMutation, ReorderSceneFixturesMutationVariables>;
export const UpdateFixturePositionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFixturePositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"positions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixturePositionInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFixturePositions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"positions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"positions"}}}]}]}}]} as unknown as DocumentNode<UpdateFixturePositionsMutation, UpdateFixturePositionsMutationVariables>;
export const SuggestChannelAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SuggestChannelAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelAssignmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suggestChannelAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"assignments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureName"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"endChannel"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channelRange"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalChannelsNeeded"}},{"kind":"Field","name":{"kind":"Name","value":"availableChannelsRemaining"}}]}}]}}]} as unknown as DocumentNode<SuggestChannelAssignmentQuery, SuggestChannelAssignmentQueryVariables>;
export const GetChannelMapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChannelMap"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"universe"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"channelMap"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"universe"},"value":{"kind":"Variable","name":{"kind":"Name","value":"universe"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"universes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"endChannel"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"availableChannels"}},{"kind":"Field","name":{"kind":"Name","value":"usedChannels"}}]}}]}}]}}]} as unknown as DocumentNode<GetChannelMapQuery, GetChannelMapQueryVariables>;
export const BulkCreateFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkCreateFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkFixtureCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkCreateFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"projectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"layoutRotation"}}]}}]}}]} as unknown as DocumentNode<BulkCreateFixturesMutation, BulkCreateFixturesMutationVariables>;
export const BulkUpdateFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkFixtureUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"projectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"layoutRotation"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateFixturesMutation, BulkUpdateFixturesMutationVariables>;
export const UpdateInstanceChannelFadeBehaviorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateInstanceChannelFadeBehavior"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"channelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeBehavior"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FadeBehavior"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateInstanceChannelFadeBehavior"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"channelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"channelId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeBehavior"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeBehavior"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}}]}}]} as unknown as DocumentNode<UpdateInstanceChannelFadeBehaviorMutation, UpdateInstanceChannelFadeBehaviorMutationVariables>;
export const BulkUpdateInstanceChannelsFadeBehaviorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateInstanceChannelsFadeBehavior"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updates"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelFadeBehaviorInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateInstanceChannelsFadeBehavior"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updates"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updates"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateInstanceChannelsFadeBehaviorMutation, BulkUpdateInstanceChannelsFadeBehaviorMutationVariables>;
export const GetOflImportStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOFLImportStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oflImportStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLImportStatusFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isImporting"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"currentManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"currentFixture"}},{"kind":"Field","name":{"kind":"Name","value":"totalFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"importedCount"}},{"kind":"Field","name":{"kind":"Name","value":"failedCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedSecondsRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"usingBundledData"}}]}}]} as unknown as DocumentNode<GetOflImportStatusQuery, GetOflImportStatusQueryVariables>;
export const CheckOflUpdatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CheckOFLUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkOFLUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"oflFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"newFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"changedFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"changedInUseCount"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLFixtureUpdateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"checkedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLFixtureUpdateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLFixtureUpdate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureKey"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"isInUse"}},{"kind":"Field","name":{"kind":"Name","value":"instanceCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentHash"}},{"kind":"Field","name":{"kind":"Name","value":"newHash"}}]}}]} as unknown as DocumentNode<CheckOflUpdatesQuery, CheckOflUpdatesQueryVariables>;
export const TriggerOflImportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerOFLImport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportOptionsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerOFLImport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLImportStatsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"successfulImports"}},{"kind":"Field","name":{"kind":"Name","value":"failedImports"}},{"kind":"Field","name":{"kind":"Name","value":"skippedDuplicates"}},{"kind":"Field","name":{"kind":"Name","value":"updatedFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}}]} as unknown as DocumentNode<TriggerOflImportMutation, TriggerOflImportMutationVariables>;
export const CancelOflImportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelOFLImport"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelOFLImport"}}]}}]} as unknown as DocumentNode<CancelOflImportMutation, CancelOflImportMutationVariables>;
export const OflImportProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OFLImportProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oflImportProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLImportStatusFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isImporting"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"currentManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"currentFixture"}},{"kind":"Field","name":{"kind":"Name","value":"totalFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"importedCount"}},{"kind":"Field","name":{"kind":"Name","value":"failedCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedSecondsRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"usingBundledData"}}]}}]} as unknown as DocumentNode<OflImportProgressSubscription, OflImportProgressSubscriptionVariables>;
export const GetProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetProjectsQuery, GetProjectsQueryVariables>;
export const GetProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cueLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectQuery, GetProjectQueryVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const ImportProjectFromQlcDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportProjectFromQLC"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"xmlContent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"originalFileName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importProjectFromQLC"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"xmlContent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"xmlContent"}}},{"kind":"Argument","name":{"kind":"Name","value":"originalFileName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"originalFileName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"originalFileName"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"sceneCount"}},{"kind":"Field","name":{"kind":"Name","value":"cueListCount"}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<ImportProjectFromQlcMutation, ImportProjectFromQlcMutationVariables>;
export const GetQlcFixtureMappingSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetQLCFixtureMappingSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getQLCFixtureMappingSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"lacyLightsFixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}}]}},{"kind":"Field","name":{"kind":"Name","value":"suggestions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}}]}},{"kind":"Field","name":{"kind":"Name","value":"suggestions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultMappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lacyLightsKey"}},{"kind":"Field","name":{"kind":"Name","value":"qlcManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"qlcModel"}},{"kind":"Field","name":{"kind":"Name","value":"qlcMode"}}]}}]}}]}}]} as unknown as DocumentNode<GetQlcFixtureMappingSuggestionsQuery, GetQlcFixtureMappingSuggestionsQueryVariables>;
export const ExportProjectToQlcDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExportProjectToQLC"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureMappings"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureMappingInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportProjectToQLC"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureMappings"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureMappings"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"xmlContent"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"sceneCount"}},{"kind":"Field","name":{"kind":"Name","value":"cueListCount"}}]}}]}}]} as unknown as DocumentNode<ExportProjectToQlcMutation, ExportProjectToQlcMutationVariables>;
export const ExportProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExportProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExportOptionsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"jsonContent"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitionsCount"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureInstancesCount"}},{"kind":"Field","name":{"kind":"Name","value":"scenesCount"}},{"kind":"Field","name":{"kind":"Name","value":"cueListsCount"}},{"kind":"Field","name":{"kind":"Name","value":"cuesCount"}}]}}]}}]}}]} as unknown as DocumentNode<ExportProjectMutation, ExportProjectMutationVariables>;
export const ImportProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jsonContent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImportOptionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"jsonContent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jsonContent"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitionsCreated"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureInstancesCreated"}},{"kind":"Field","name":{"kind":"Name","value":"scenesCreated"}},{"kind":"Field","name":{"kind":"Name","value":"cueListsCreated"}},{"kind":"Field","name":{"kind":"Name","value":"cuesCreated"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<ImportProjectMutation, ImportProjectMutationVariables>;
export const GetProjectSceneBoardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectSceneBoards"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneBoards"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"buttons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectSceneBoardsQuery, GetProjectSceneBoardsQueryVariables>;
export const GetSceneBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSceneBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sceneBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buttons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSceneBoardQuery, GetSceneBoardQueryVariables>;
export const CreateSceneBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSceneBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneBoardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSceneBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"buttons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateSceneBoardMutation, CreateSceneBoardMutationVariables>;
export const UpdateSceneBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSceneBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneBoardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSceneBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateSceneBoardMutation, UpdateSceneBoardMutationVariables>;
export const DeleteSceneBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSceneBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSceneBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSceneBoardMutation, DeleteSceneBoardMutationVariables>;
export const AddSceneToBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddSceneToBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneBoardButtonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSceneToBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"scene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sceneBoard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddSceneToBoardMutation, AddSceneToBoardMutationVariables>;
export const UpdateSceneBoardButtonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSceneBoardButton"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneBoardButtonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSceneBoardButton"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]} as unknown as DocumentNode<UpdateSceneBoardButtonMutation, UpdateSceneBoardButtonMutationVariables>;
export const RemoveSceneFromBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveSceneFromBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buttonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSceneFromBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"buttonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buttonId"}}}]}]}}]} as unknown as DocumentNode<RemoveSceneFromBoardMutation, RemoveSceneFromBoardMutationVariables>;
export const UpdateSceneBoardButtonPositionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSceneBoardButtonPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"positions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SceneBoardButtonPositionInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSceneBoardButtonPositions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"positions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"positions"}}}]}]}}]} as unknown as DocumentNode<UpdateSceneBoardButtonPositionsMutation, UpdateSceneBoardButtonPositionsMutationVariables>;
export const ActivateSceneFromBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateSceneFromBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneBoardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTimeOverride"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateSceneFromBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneBoardId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneBoardId"}}},{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeTimeOverride"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTimeOverride"}}}]}]}}]} as unknown as DocumentNode<ActivateSceneFromBoardMutation, ActivateSceneFromBoardMutationVariables>;
export const GetProjectScenesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectScenes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scenes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"channelValues"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectScenesQuery, GetProjectScenesQueryVariables>;
export const GetSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"layoutRotation"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channelValues"}}]}}]}}]}}]} as unknown as DocumentNode<GetSceneQuery, GetSceneQueryVariables>;
export const CreateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channelValues"}}]}}]}}]}}]} as unknown as DocumentNode<CreateSceneMutation, CreateSceneMutationVariables>;
export const UpdateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSceneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channelValues"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSceneMutation, UpdateSceneMutationVariables>;
export const DeleteSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSceneMutation, DeleteSceneMutationVariables>;
export const DuplicateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DuplicateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duplicateScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channelValues"}}]}}]}}]}}]} as unknown as DocumentNode<DuplicateSceneMutation, DuplicateSceneMutationVariables>;
export const GetCurrentActiveSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentActiveScene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentActiveScene"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GetCurrentActiveSceneQuery, GetCurrentActiveSceneQueryVariables>;
export const ActivateSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSceneLive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}]}]}}]} as unknown as DocumentNode<ActivateSceneMutation, ActivateSceneMutationVariables>;
export const StartPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startPreviewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"dmxOutput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]}}]} as unknown as DocumentNode<StartPreviewSessionMutation, StartPreviewSessionMutationVariables>;
export const CancelPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelPreviewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}]}]}}]} as unknown as DocumentNode<CancelPreviewSessionMutation, CancelPreviewSessionMutationVariables>;
export const CommitPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CommitPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitPreviewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}]}]}}]} as unknown as DocumentNode<CommitPreviewSessionMutation, CommitPreviewSessionMutationVariables>;
export const UpdatePreviewChannelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePreviewChannel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"channelIndex"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePreviewChannel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureId"}}},{"kind":"Argument","name":{"kind":"Name","value":"channelIndex"},"value":{"kind":"Variable","name":{"kind":"Name","value":"channelIndex"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}]}]}}]} as unknown as DocumentNode<UpdatePreviewChannelMutation, UpdatePreviewChannelMutationVariables>;
export const InitializePreviewWithSceneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitializePreviewWithScene"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initializePreviewWithScene"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"sceneId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sceneId"}}}]}]}}]} as unknown as DocumentNode<InitializePreviewWithSceneMutation, InitializePreviewWithSceneMutationVariables>;
export const GetPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"dmxOutput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]}}]} as unknown as DocumentNode<GetPreviewSessionQuery, GetPreviewSessionQueryVariables>;
export const PreviewSessionUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PreviewSessionUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewSessionUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"dmxOutput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]}}]} as unknown as DocumentNode<PreviewSessionUpdatedSubscription, PreviewSessionUpdatedSubscriptionVariables>;
export const DmxOutputChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DmxOutputChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"universe"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dmxOutputChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"universe"},"value":{"kind":"Variable","name":{"kind":"Name","value":"universe"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]} as unknown as DocumentNode<DmxOutputChangedSubscription, DmxOutputChangedSubscriptionVariables>;
export const GetSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetSettingsQuery, GetSettingsQueryVariables>;
export const GetSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetSettingQuery, GetSettingQueryVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const GetSystemInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSystemInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"artnetBroadcastAddress"}},{"kind":"Field","name":{"kind":"Name","value":"artnetEnabled"}}]}}]}}]} as unknown as DocumentNode<GetSystemInfoQuery, GetSystemInfoQueryVariables>;
export const GetNetworkInterfaceOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNetworkInterfaceOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkInterfaceOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"broadcast"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"interfaceType"}}]}}]}}]} as unknown as DocumentNode<GetNetworkInterfaceOptionsQuery, GetNetworkInterfaceOptionsQueryVariables>;
export const SystemInfoUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SystemInfoUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemInfoUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"artnetBroadcastAddress"}},{"kind":"Field","name":{"kind":"Name","value":"artnetEnabled"}}]}}]}}]} as unknown as DocumentNode<SystemInfoUpdatedSubscription, SystemInfoUpdatedSubscriptionVariables>;
export const GetSystemVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSystemVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionManagementSupported"}},{"kind":"Field","name":{"kind":"Name","value":"repositories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repository"}},{"kind":"Field","name":{"kind":"Name","value":"installed"}},{"kind":"Field","name":{"kind":"Name","value":"latest"}},{"kind":"Field","name":{"kind":"Name","value":"updateAvailable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastChecked"}}]}}]}}]} as unknown as DocumentNode<GetSystemVersionsQuery, GetSystemVersionsQueryVariables>;
export const GetAvailableVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repository"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"repository"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repository"}}}]}]}}]} as unknown as DocumentNode<GetAvailableVersionsQuery, GetAvailableVersionsQueryVariables>;
export const UpdateRepositoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRepository"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repository"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRepository"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"repository"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repository"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"repository"}},{"kind":"Field","name":{"kind":"Name","value":"previousVersion"}},{"kind":"Field","name":{"kind":"Name","value":"newVersion"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<UpdateRepositoryMutation, UpdateRepositoryMutationVariables>;
export const UpdateAllRepositoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAllRepositories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAllRepositories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"repository"}},{"kind":"Field","name":{"kind":"Name","value":"previousVersion"}},{"kind":"Field","name":{"kind":"Name","value":"newVersion"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<UpdateAllRepositoriesMutation, UpdateAllRepositoriesMutationVariables>;
export const WiFiNetworksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WiFiNetworks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rescan"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiNetworks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rescan"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rescan"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"security"}},{"kind":"Field","name":{"kind":"Name","value":"inUse"}},{"kind":"Field","name":{"kind":"Name","value":"saved"}}]}}]}}]} as unknown as DocumentNode<WiFiNetworksQuery, WiFiNetworksQueryVariables>;
export const WiFiStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WiFiStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]} as unknown as DocumentNode<WiFiStatusQuery, WiFiStatusQueryVariables>;
export const SavedWiFiNetworksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SavedWiFiNetworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedWifiNetworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"security"}},{"kind":"Field","name":{"kind":"Name","value":"inUse"}},{"kind":"Field","name":{"kind":"Name","value":"saved"}}]}}]}}]} as unknown as DocumentNode<SavedWiFiNetworksQuery, SavedWiFiNetworksQueryVariables>;
export const ConnectWiFiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConnectWiFi"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectWiFi"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ssid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<ConnectWiFiMutation, ConnectWiFiMutationVariables>;
export const DisconnectWiFiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisconnectWiFi"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnectWiFi"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<DisconnectWiFiMutation, DisconnectWiFiMutationVariables>;
export const SetWiFiEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetWiFiEnabled"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setWiFiEnabled"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]} as unknown as DocumentNode<SetWiFiEnabledMutation, SetWiFiEnabledMutationVariables>;
export const ForgetWiFiNetworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ForgetWiFiNetwork"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forgetWiFiNetwork"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ssid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}}}]}]}}]} as unknown as DocumentNode<ForgetWiFiNetworkMutation, ForgetWiFiNetworkMutationVariables>;
export const WiFiStatusUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WiFiStatusUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiStatusUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]} as unknown as DocumentNode<WiFiStatusUpdatedSubscription, WiFiStatusUpdatedSubscriptionVariables>;