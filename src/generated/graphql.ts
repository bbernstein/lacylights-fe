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

export type ApClient = {
  readonly __typename?: 'APClient';
  readonly connectedAt: Scalars['String']['output'];
  readonly hostname?: Maybe<Scalars['String']['output']>;
  readonly ipAddress?: Maybe<Scalars['String']['output']>;
  readonly macAddress: Scalars['String']['output'];
};

export type ApConfig = {
  readonly __typename?: 'APConfig';
  readonly channel: Scalars['Int']['output'];
  readonly clientCount: Scalars['Int']['output'];
  readonly ipAddress: Scalars['String']['output'];
  readonly minutesRemaining?: Maybe<Scalars['Int']['output']>;
  readonly ssid: Scalars['String']['output'];
  readonly timeoutMinutes: Scalars['Int']['output'];
};

/** Status of an active effect at runtime. */
export type ActiveEffectStatus = {
  readonly __typename?: 'ActiveEffectStatus';
  readonly effectId: Scalars['ID']['output'];
  readonly effectName: Scalars['String']['output'];
  readonly effectType: EffectType;
  /** Current intensity (0-100) */
  readonly intensity: Scalars['Float']['output'];
  /** Whether the effect has completed */
  readonly isComplete: Scalars['Boolean']['output'];
  /** Current phase for waveforms (0-360) */
  readonly phase: Scalars['Float']['output'];
  readonly startTime: Scalars['String']['output'];
};

export type AddEffectToCueInput = {
  readonly cueId: Scalars['ID']['input'];
  readonly effectId: Scalars['ID']['input'];
  readonly intensity?: InputMaybe<Scalars['Float']['input']>;
  readonly onCueChange?: InputMaybe<TransitionBehavior>;
  readonly speed?: InputMaybe<Scalars['Float']['input']>;
};

export type AddFixtureToEffectInput = {
  readonly amplitudeScale?: InputMaybe<Scalars['Float']['input']>;
  readonly effectId: Scalars['ID']['input'];
  readonly effectOrder?: InputMaybe<Scalars['Int']['input']>;
  readonly fixtureId: Scalars['ID']['input'];
  readonly phaseOffset?: InputMaybe<Scalars['Float']['input']>;
};

export type ArtNetStatus = {
  readonly __typename?: 'ArtNetStatus';
  readonly broadcastAddress: Scalars['String']['output'];
  readonly enabled: Scalars['Boolean']['output'];
};

/** Authentication result returned after login or registration. */
export type AuthPayload = {
  readonly __typename?: 'AuthPayload';
  /** JWT access token for API requests */
  readonly accessToken: Scalars['String']['output'];
  /** When the access token expires */
  readonly expiresAt: Scalars['String']['output'];
  /** JWT refresh token for obtaining new access tokens */
  readonly refreshToken: Scalars['String']['output'];
  /** The authenticated user */
  readonly user: User;
};

/** Global authentication settings. */
export type AuthSettings = {
  readonly __typename?: 'AuthSettings';
  /** Allowed authentication methods */
  readonly allowedMethods: ReadonlyArray<Scalars['String']['output']>;
  /** Whether authentication is enabled */
  readonly authEnabled: Scalars['Boolean']['output'];
  /** Whether device authentication is enabled */
  readonly deviceAuthEnabled: Scalars['Boolean']['output'];
  /** Minimum password length */
  readonly passwordMinLength: Scalars['Int']['output'];
  /** Whether email verification is required */
  readonly requireEmailVerification: Scalars['Boolean']['output'];
  /** Session duration in hours */
  readonly sessionDurationHours: Scalars['Int']['output'];
};

/** Extended user information for authenticated context. */
export type AuthUser = {
  readonly __typename?: 'AuthUser';
  readonly createdAt: Scalars['String']['output'];
  readonly email: Scalars['String']['output'];
  readonly emailVerified: Scalars['Boolean']['output'];
  /** User's permission groups */
  readonly groups: ReadonlyArray<UserGroup>;
  readonly id: Scalars['ID']['output'];
  readonly isActive: Scalars['Boolean']['output'];
  readonly lastLoginAt?: Maybe<Scalars['String']['output']>;
  readonly name?: Maybe<Scalars['String']['output']>;
  /** Effective permissions from role and groups */
  readonly permissions: ReadonlyArray<Scalars['String']['output']>;
  readonly phone?: Maybe<Scalars['String']['output']>;
  readonly phoneVerified: Scalars['Boolean']['output'];
  readonly role: UserRole;
  readonly updatedAt: Scalars['String']['output'];
};

/** Server build information for version verification */
export type BuildInfo = {
  readonly __typename?: 'BuildInfo';
  /** UTC timestamp when this build was created */
  readonly buildTime: Scalars['String']['output'];
  /** Git commit hash from which this build was made */
  readonly gitCommit: Scalars['String']['output'];
  /** Semantic version (e.g., v0.8.10) */
  readonly version: Scalars['String']['output'];
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
  /** When set, updates the skip status of all selected cues */
  readonly skip?: InputMaybe<Scalars['Boolean']['input']>;
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

export type BulkLookBoardButtonCreateInput = {
  readonly buttons: ReadonlyArray<CreateLookBoardButtonInput>;
};

export type BulkLookBoardButtonUpdateInput = {
  readonly buttons: ReadonlyArray<LookBoardButtonUpdateItem>;
};

export type BulkLookBoardCreateInput = {
  readonly lookBoards: ReadonlyArray<CreateLookBoardInput>;
};

export type BulkLookBoardUpdateInput = {
  readonly lookBoards: ReadonlyArray<LookBoardUpdateItem>;
};

export type BulkLookCreateInput = {
  readonly looks: ReadonlyArray<CreateLookInput>;
};

/**
 * Updates multiple looks with partial fixture value merging support.
 * Each look can independently specify name, description, fixtureValues, and mergeFixtures.
 * Operations are applied in order and fail on first error.
 */
export type BulkLookPartialUpdateInput = {
  readonly looks: ReadonlyArray<LookPartialUpdateItem>;
};

export type BulkLookUpdateInput = {
  readonly looks: ReadonlyArray<LookUpdateItem>;
};

export type BulkProjectCreateInput = {
  readonly projects: ReadonlyArray<CreateProjectInput>;
};

export type BulkProjectUpdateInput = {
  readonly projects: ReadonlyArray<ProjectUpdateItem>;
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
  ColdWhite = 'COLD_WHITE',
  ColorWheel = 'COLOR_WHEEL',
  Cyan = 'CYAN',
  Effect = 'EFFECT',
  Focus = 'FOCUS',
  Gobo = 'GOBO',
  Green = 'GREEN',
  Indigo = 'INDIGO',
  Intensity = 'INTENSITY',
  Iris = 'IRIS',
  Lime = 'LIME',
  Macro = 'MACRO',
  Magenta = 'MAGENTA',
  Other = 'OTHER',
  Pan = 'PAN',
  Red = 'RED',
  Strobe = 'STROBE',
  Tilt = 'TILT',
  Uv = 'UV',
  WarmWhite = 'WARM_WHITE',
  White = 'WHITE',
  Yellow = 'YELLOW',
  Zoom = 'ZOOM'
}

export type ChannelUsage = {
  readonly __typename?: 'ChannelUsage';
  readonly channelType: ChannelType;
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
};

export type ChannelValue = {
  readonly __typename?: 'ChannelValue';
  readonly offset: Scalars['Int']['output'];
  readonly value: Scalars['Int']['output'];
};

export type ChannelValueInput = {
  readonly offset: Scalars['Int']['input'];
  readonly value: Scalars['Int']['input'];
};

/**
 * How multiple effects combine their values.
 * OVERRIDE - Higher priority effect completely replaces lower
 * ADDITIVE - Effects add their values together
 * MULTIPLY - Effects multiply their values together
 */
export enum CompositionMode {
  Additive = 'ADDITIVE',
  Multiply = 'MULTIPLY',
  Override = 'OVERRIDE'
}

/** Input for copying fixtures from one look to multiple target looks. */
export type CopyFixturesToLooksInput = {
  /** IDs of fixtures to copy */
  readonly fixtureIds: ReadonlyArray<Scalars['ID']['input']>;
  /** ID of the look to copy fixtures from */
  readonly sourceLookId: Scalars['ID']['input'];
  /** IDs of looks to copy fixtures to */
  readonly targetLookIds: ReadonlyArray<Scalars['ID']['input']>;
};

/** Result of the copy fixtures operation. */
export type CopyFixturesToLooksResult = {
  readonly __typename?: 'CopyFixturesToLooksResult';
  /** Number of cues affected (for UI feedback) */
  readonly affectedCueCount: Scalars['Int']['output'];
  /** Operation ID for undo (single atomic operation). Null if undo capture failed. */
  readonly operationId?: Maybe<Scalars['ID']['output']>;
  /** Number of looks updated */
  readonly updatedLookCount: Scalars['Int']['output'];
  /** The updated looks */
  readonly updatedLooks: ReadonlyArray<Look>;
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
  readonly lookId: Scalars['ID']['input'];
  readonly name: Scalars['String']['input'];
  readonly notes?: InputMaybe<Scalars['String']['input']>;
  /** When true, this cue is skipped during playback (default: false) */
  readonly skip?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateCueListInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly loop?: InputMaybe<Scalars['Boolean']['input']>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
};

export type CreateEffectInput = {
  readonly amplitude?: InputMaybe<Scalars['Float']['input']>;
  readonly compositionMode?: InputMaybe<CompositionMode>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly effectType: EffectType;
  readonly fadeDuration?: InputMaybe<Scalars['Float']['input']>;
  readonly frequency?: InputMaybe<Scalars['Float']['input']>;
  readonly masterValue?: InputMaybe<Scalars['Float']['input']>;
  readonly name: Scalars['String']['input'];
  readonly offset?: InputMaybe<Scalars['Float']['input']>;
  readonly onCueChange?: InputMaybe<TransitionBehavior>;
  readonly phaseOffset?: InputMaybe<Scalars['Float']['input']>;
  readonly priorityBand?: InputMaybe<PriorityBand>;
  readonly prioritySub?: InputMaybe<Scalars['Int']['input']>;
  readonly projectId: Scalars['ID']['input'];
  readonly waveform?: InputMaybe<WaveformType>;
};

export type CreateFixtureDefinitionInput = {
  readonly channels: ReadonlyArray<CreateChannelDefinitionInput>;
  readonly manufacturer: Scalars['String']['input'];
  readonly model: Scalars['String']['input'];
  readonly modes?: InputMaybe<ReadonlyArray<CreateModeInput>>;
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

export type CreateLookBoardButtonInput = {
  readonly color?: InputMaybe<Scalars['String']['input']>;
  readonly height?: InputMaybe<Scalars['Int']['input']>;
  readonly label?: InputMaybe<Scalars['String']['input']>;
  readonly layoutX: Scalars['Int']['input'];
  readonly layoutY: Scalars['Int']['input'];
  readonly lookBoardId: Scalars['ID']['input'];
  readonly lookId: Scalars['ID']['input'];
  readonly width?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateLookBoardInput = {
  readonly canvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly canvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly defaultFadeTime?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly gridSize?: InputMaybe<Scalars['Int']['input']>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
};

export type CreateLookInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly fixtureValues: ReadonlyArray<FixtureValueInput>;
  readonly name: Scalars['String']['input'];
  readonly projectId: Scalars['ID']['input'];
};

export type CreateModeInput = {
  readonly channels: ReadonlyArray<Scalars['String']['input']>;
  readonly name: Scalars['String']['input'];
  readonly shortName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProjectInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  /** Group to own this project (defaults to user's only group if they have exactly one) */
  readonly groupId?: InputMaybe<Scalars['ID']['input']>;
  readonly layoutCanvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly layoutCanvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly name: Scalars['String']['input'];
};

export type CreateUserGroupInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly name: Scalars['String']['input'];
  readonly permissions?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
};

export type CreateUserInput = {
  readonly email: Scalars['String']['input'];
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly password: Scalars['String']['input'];
  readonly role?: InputMaybe<UserRole>;
};

export type Cue = {
  readonly __typename?: 'Cue';
  readonly cueList: CueList;
  readonly cueNumber: Scalars['Float']['output'];
  readonly easingType?: Maybe<EasingType>;
  /** Effects associated with this cue */
  readonly effects: ReadonlyArray<CueEffect>;
  readonly fadeInTime: Scalars['Float']['output'];
  readonly fadeOutTime: Scalars['Float']['output'];
  readonly followTime?: Maybe<Scalars['Float']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly look: Look;
  readonly name: Scalars['String']['output'];
  readonly notes?: Maybe<Scalars['String']['output']>;
  /** When true, this cue is skipped during playback but remains visible in the UI */
  readonly skip: Scalars['Boolean']['output'];
};

/** Links an effect to a cue with runtime parameters. */
export type CueEffect = {
  readonly __typename?: 'CueEffect';
  readonly cueId: Scalars['ID']['output'];
  readonly effect?: Maybe<Effect>;
  readonly effectId: Scalars['ID']['output'];
  readonly id: Scalars['ID']['output'];
  /** Intensity override (0-100) */
  readonly intensity: Scalars['Float']['output'];
  /** Override effect's default cue change behavior */
  readonly onCueChange?: Maybe<TransitionBehavior>;
  /** Speed/frequency multiplier */
  readonly speed: Scalars['Float']['output'];
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

export enum CueListDataChangeType {
  CueAdded = 'CUE_ADDED',
  CueListMetadataChanged = 'CUE_LIST_METADATA_CHANGED',
  CueRemoved = 'CUE_REMOVED',
  CueReordered = 'CUE_REORDERED',
  CueUpdated = 'CUE_UPDATED',
  LookNameChanged = 'LOOK_NAME_CHANGED'
}

/** Payload for cue list data change notifications */
export type CueListDataChangedPayload = {
  readonly __typename?: 'CueListDataChangedPayload';
  /** Affected cue IDs (for cue changes) */
  readonly affectedCueIds?: Maybe<ReadonlyArray<Scalars['ID']['output']>>;
  /** Affected look ID (for look name changes) */
  readonly affectedLookId?: Maybe<Scalars['ID']['output']>;
  readonly changeType: CueListDataChangeType;
  readonly cueListId: Scalars['ID']['output'];
  /** New look name if this is a LOOK_NAME_CHANGED event */
  readonly newLookName?: Maybe<Scalars['String']['output']>;
  /** Timestamp of the change */
  readonly timestamp: Scalars['String']['output'];
};

export type CueListPlaybackStatus = {
  readonly __typename?: 'CueListPlaybackStatus';
  readonly cueListId: Scalars['ID']['output'];
  readonly currentCue?: Maybe<Cue>;
  readonly currentCueIndex?: Maybe<Scalars['Int']['output']>;
  readonly fadeProgress?: Maybe<Scalars['Float']['output']>;
  /** True when a fade-in transition is in progress */
  readonly isFading: Scalars['Boolean']['output'];
  /** True when the cue list is paused (look activated outside cue context, cue index preserved) */
  readonly isPaused: Scalars['Boolean']['output'];
  /** True when a look's values are currently active on DMX fixtures (stays true after fade completes until stopped) */
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

/** A cue with its associated look information for the copy modal. */
export type CueWithLookInfo = {
  readonly __typename?: 'CueWithLookInfo';
  readonly cueId: Scalars['ID']['output'];
  readonly cueName: Scalars['String']['output'];
  readonly cueNumber: Scalars['Float']['output'];
  readonly lookId: Scalars['ID']['output'];
  readonly lookName: Scalars['String']['output'];
  /** Other cue numbers that use the same look (excluding this cue) */
  readonly otherCueNumbers: ReadonlyArray<Scalars['Float']['output']>;
};

/** Response for the cuesWithLookInfo query. */
export type CuesWithLookInfoResponse = {
  readonly __typename?: 'CuesWithLookInfoResponse';
  /** Cues sorted by cue number */
  readonly cues: ReadonlyArray<CueWithLookInfo>;
  /** Looks in the project that are not used by any cue in this cue list */
  readonly orphanLooks: ReadonlyArray<LookSummary>;
};

/** Pre-authorized device for device-based authentication. */
export type Device = {
  readonly __typename?: 'Device';
  /** When the device was approved */
  readonly approvedAt?: Maybe<Scalars['String']['output']>;
  /** User who approved this device */
  readonly approvedBy?: Maybe<User>;
  readonly createdAt: Scalars['String']['output'];
  /** Default role when no user is specified */
  readonly defaultRole: DeviceRole;
  /** Default user to authenticate as when device connects */
  readonly defaultUser?: Maybe<User>;
  /** Unique device fingerprint */
  readonly fingerprint: Scalars['String']['output'];
  /** Groups this device belongs to */
  readonly groups: ReadonlyArray<UserGroup>;
  readonly id: Scalars['ID']['output'];
  /** Whether this device is authorized (convenience field, equivalent to status == APPROVED) */
  readonly isAuthorized: Scalars['Boolean']['output'];
  readonly lastIPAddress?: Maybe<Scalars['String']['output']>;
  readonly lastSeenAt?: Maybe<Scalars['String']['output']>;
  readonly name: Scalars['String']['output'];
  /** Permission level for this device */
  readonly permissions: DevicePermissions;
  /** Current status of the device */
  readonly status: DeviceStatus;
  readonly updatedAt: Scalars['String']['output'];
};

/** Device authorization code for pre-authorizing devices. */
export type DeviceAuthCode = {
  readonly __typename?: 'DeviceAuthCode';
  /** The authorization code (6 digits) */
  readonly code: Scalars['String']['output'];
  /** Device ID this code is for */
  readonly deviceId: Scalars['ID']['output'];
  /** When the code expires */
  readonly expiresAt: Scalars['String']['output'];
};

/** Result of checking device authorization status. */
export type DeviceAuthStatus = {
  readonly __typename?: 'DeviceAuthStatus';
  /** Default user for auto-login (if authorized) */
  readonly defaultUser?: Maybe<User>;
  /** The device record if it exists */
  readonly device?: Maybe<Device>;
  /** Whether the device is known and authorized */
  readonly isAuthorized: Scalars['Boolean']['output'];
  /** Whether the device is known but not yet authorized */
  readonly isPending: Scalars['Boolean']['output'];
};

/**
 * Result of checking a device's status by fingerprint.
 * Used by clients to determine if they need to register.
 */
export type DeviceCheckResult = {
  readonly __typename?: 'DeviceCheckResult';
  /** The device record if it exists */
  readonly device?: Maybe<Device>;
  /** Human-readable message about the device status */
  readonly message?: Maybe<Scalars['String']['output']>;
  /** Current status of the device (PENDING, APPROVED, or REVOKED). Unregistered devices return PENDING status. */
  readonly status: DeviceStatus;
};

/** Permission level for device-based authentication. */
export enum DevicePermissions {
  /** Full access including device management */
  Admin = 'ADMIN',
  /** Can control lights and make operational changes */
  Operator = 'OPERATOR',
  /** Can only view data, no modifications */
  ReadOnly = 'READ_ONLY'
}

/** Result of registering a new device. */
export type DeviceRegistrationResult = {
  readonly __typename?: 'DeviceRegistrationResult';
  /** The registered device (null if registration failed) */
  readonly device?: Maybe<Device>;
  /** Human-readable message about the result */
  readonly message: Scalars['String']['output'];
  /** Whether the registration was successful */
  readonly success: Scalars['Boolean']['output'];
};

/** Default role for device-authenticated users. */
export enum DeviceRole {
  Designer = 'DESIGNER',
  Operator = 'OPERATOR',
  Player = 'PLAYER'
}

/** Status of a device in the authentication system. */
export enum DeviceStatus {
  /** Device is approved and can access the system */
  Approved = 'APPROVED',
  /** Device is registered but not yet approved */
  Pending = 'PENDING',
  /** Device access has been revoked */
  Revoked = 'REVOKED'
}

export enum DifferenceType {
  OnlyInLook1 = 'ONLY_IN_LOOK1',
  OnlyInLook2 = 'ONLY_IN_LOOK2',
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

/**
 * Effect definition for DMX modulation.
 * Effects can be waveform-based (LFO), crossfades, static values, or master faders.
 */
export type Effect = {
  readonly __typename?: 'Effect';
  /** Amplitude as percentage (0-100) */
  readonly amplitude: Scalars['Float']['output'];
  readonly compositionMode: CompositionMode;
  readonly createdAt: Scalars['String']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly effectType: EffectType;
  readonly fadeDuration?: Maybe<Scalars['Float']['output']>;
  readonly fixtures: ReadonlyArray<EffectFixture>;
  /** Frequency in Hz */
  readonly frequency: Scalars['Float']['output'];
  readonly id: Scalars['ID']['output'];
  /** Master value for MASTER effects (0.0-1.0) */
  readonly masterValue?: Maybe<Scalars['Float']['output']>;
  readonly name: Scalars['String']['output'];
  /** Offset/baseline as percentage (0-100) */
  readonly offset: Scalars['Float']['output'];
  readonly onCueChange: TransitionBehavior;
  /** Phase offset in degrees (0-360) */
  readonly phaseOffset: Scalars['Float']['output'];
  readonly priorityBand: PriorityBand;
  readonly prioritySub: Scalars['Int']['output'];
  readonly projectId: Scalars['ID']['output'];
  readonly updatedAt: Scalars['String']['output'];
  /** Waveform type for WAVEFORM effects */
  readonly waveform?: Maybe<WaveformType>;
};

/** Per-channel overrides within an EffectFixture. */
export type EffectChannel = {
  readonly __typename?: 'EffectChannel';
  /** Per-channel amplitude multiplier (used when minValue/maxValue not set) */
  readonly amplitudeScale?: Maybe<Scalars['Float']['output']>;
  /** Channel offset from fixture start address */
  readonly channelOffset?: Maybe<Scalars['Int']['output']>;
  /** Channel type (INTENSITY, RED, etc.) */
  readonly channelType?: Maybe<Scalars['String']['output']>;
  readonly effectFixtureId: Scalars['ID']['output'];
  /** Per-channel frequency multiplier */
  readonly frequencyScale?: Maybe<Scalars['Float']['output']>;
  readonly id: Scalars['ID']['output'];
  /** Maximum value for oscillation (0-100%). When set with minValue, defines oscillation range. */
  readonly maxValue?: Maybe<Scalars['Float']['output']>;
  /** Minimum value for oscillation (0-100%). When set with maxValue, defines oscillation range. */
  readonly minValue?: Maybe<Scalars['Float']['output']>;
};

/**
 * Input for adding or updating a channel within an effect fixture.
 * Target by offset OR type (not both).
 */
export type EffectChannelInput = {
  /** Amplitude scale for this channel (0-200%). Ignored if minValue/maxValue are set. */
  readonly amplitudeScale?: InputMaybe<Scalars['Float']['input']>;
  /** Target by DMX offset (0-based). Null if targeting by type. */
  readonly channelOffset?: InputMaybe<Scalars['Int']['input']>;
  /** Target by channel type. Null if targeting by offset. */
  readonly channelType?: InputMaybe<ChannelType>;
  /** Frequency scale for this channel. Null uses effect's frequency. */
  readonly frequencyScale?: InputMaybe<Scalars['Float']['input']>;
  /** Maximum value for oscillation (0-100%). Use with minValue to define range. */
  readonly maxValue?: InputMaybe<Scalars['Float']['input']>;
  /** Minimum value for oscillation (0-100%). Use with maxValue to define range. */
  readonly minValue?: InputMaybe<Scalars['Float']['input']>;
};

/** Links an effect to a fixture with per-fixture settings. */
export type EffectFixture = {
  readonly __typename?: 'EffectFixture';
  /** Per-fixture amplitude multiplier */
  readonly amplitudeScale?: Maybe<Scalars['Float']['output']>;
  readonly channels: ReadonlyArray<EffectChannel>;
  readonly effectId: Scalars['ID']['output'];
  /** Order of this fixture in the effect */
  readonly effectOrder?: Maybe<Scalars['Int']['output']>;
  readonly fixture?: Maybe<FixtureInstance>;
  readonly fixtureId: Scalars['ID']['output'];
  readonly id: Scalars['ID']['output'];
  /** Per-fixture phase offset in degrees */
  readonly phaseOffset?: Maybe<Scalars['Float']['output']>;
};

/**
 * Type of effect, determining its calculation behavior.
 * WAVEFORM - LFO-based continuous modulation using waveforms
 * CROSSFADE - Interpolates between channel states over time
 * STATIC - Sets channels to fixed values without modulation
 * MASTER - Multiplier effect for intensity scaling (grand master)
 */
export enum EffectType {
  Crossfade = 'CROSSFADE',
  Master = 'MASTER',
  Static = 'STATIC',
  Waveform = 'WAVEFORM'
}

/**
 * Type of entity change for real-time updates.
 * CREATED - Entity was created
 * UPDATED - Entity was modified
 * DELETED - Entity was deleted
 */
export enum EntityDataChangeType {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Updated = 'UPDATED'
}

export type ExportOptionsInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly includeCueLists?: InputMaybe<Scalars['Boolean']['input']>;
  readonly includeFixtures?: InputMaybe<Scalars['Boolean']['input']>;
  readonly includeLooks?: InputMaybe<Scalars['Boolean']['input']>;
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
  readonly lookBoardsCount: Scalars['Int']['output'];
  readonly looksCount: Scalars['Int']['output'];
};

/**
 * Determines how a channel behaves during look transitions.
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

/** Payload for fixture data change notifications (used for undo/redo real-time updates) */
export type FixtureDataChangedPayload = {
  readonly __typename?: 'FixtureDataChangedPayload';
  /** Type of change that occurred */
  readonly changeType: EntityDataChangeType;
  /** The affected fixture IDs */
  readonly fixtureIds: ReadonlyArray<Scalars['ID']['output']>;
  /** The project containing the fixtures */
  readonly projectId: Scalars['ID']['output'];
  /** Timestamp of the change */
  readonly timestamp: Scalars['String']['output'];
};

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
  readonly looks: ReadonlyArray<LookSummary>;
};

export type FixtureValue = {
  readonly __typename?: 'FixtureValue';
  readonly channels: ReadonlyArray<ChannelValue>;
  readonly fixture: FixtureInstance;
  readonly id: Scalars['ID']['output'];
  readonly lookOrder?: Maybe<Scalars['Int']['output']>;
};

export type FixtureValueInput = {
  readonly channels: ReadonlyArray<ChannelValueInput>;
  readonly fixtureId: Scalars['ID']['input'];
  readonly lookOrder?: InputMaybe<Scalars['Int']['input']>;
};

/** Global playback status - returns which cue list is currently playing or paused (if any) */
export type GlobalPlaybackStatus = {
  readonly __typename?: 'GlobalPlaybackStatus';
  /** Total number of cues in the playing cue list (null if not playing) */
  readonly cueCount?: Maybe<Scalars['Int']['output']>;
  /** ID of the currently playing cue list (null if not playing) */
  readonly cueListId?: Maybe<Scalars['ID']['output']>;
  /** Name of the currently playing cue list (null if not playing) */
  readonly cueListName?: Maybe<Scalars['String']['output']>;
  /** Current cue index in the playing cue list (null if not playing) */
  readonly currentCueIndex?: Maybe<Scalars['Int']['output']>;
  /** Name of the currently playing cue (null if not playing) */
  readonly currentCueName?: Maybe<Scalars['String']['output']>;
  /** Fade progress percentage (0-100) */
  readonly fadeProgress?: Maybe<Scalars['Float']['output']>;
  /** True if a fade transition is in progress */
  readonly isFading: Scalars['Boolean']['output'];
  /** True if a cue list is paused (look activated outside cue context) */
  readonly isPaused: Scalars['Boolean']['output'];
  /** True if any cue list is currently playing */
  readonly isPlaying: Scalars['Boolean']['output'];
  readonly lastUpdated: Scalars['String']['output'];
};

/** An invitation to join a group. */
export type GroupInvitation = {
  readonly __typename?: 'GroupInvitation';
  readonly createdAt: Scalars['String']['output'];
  readonly email: Scalars['String']['output'];
  readonly expiresAt: Scalars['String']['output'];
  readonly group: UserGroup;
  readonly id: Scalars['ID']['output'];
  readonly invitedBy: User;
  readonly role: GroupMemberRole;
  readonly status: InvitationStatus;
};

/** A member of a group with their role. */
export type GroupMember = {
  readonly __typename?: 'GroupMember';
  readonly id: Scalars['ID']['output'];
  readonly joinedAt: Scalars['String']['output'];
  readonly role: GroupMemberRole;
  readonly user: User;
};

export enum GroupMemberRole {
  GroupAdmin = 'GROUP_ADMIN',
  Member = 'MEMBER'
}

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
  readonly lookBoardsCreated: Scalars['Int']['output'];
  readonly looksCreated: Scalars['Int']['output'];
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

export enum InvitationStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Expired = 'EXPIRED',
  Pending = 'PENDING'
}

export type LacyLightsFixture = {
  readonly __typename?: 'LacyLightsFixture';
  readonly manufacturer: Scalars['String']['output'];
  readonly model: Scalars['String']['output'];
};

export type Look = {
  readonly __typename?: 'Look';
  readonly createdAt: Scalars['String']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly fixtureValues: ReadonlyArray<FixtureValue>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly project: Project;
  readonly updatedAt: Scalars['String']['output'];
};

export type LookBoard = {
  readonly __typename?: 'LookBoard';
  readonly buttons: ReadonlyArray<LookBoardButton>;
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

export type LookBoardButton = {
  readonly __typename?: 'LookBoardButton';
  readonly color?: Maybe<Scalars['String']['output']>;
  readonly createdAt: Scalars['String']['output'];
  readonly height?: Maybe<Scalars['Int']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly label?: Maybe<Scalars['String']['output']>;
  readonly layoutX: Scalars['Int']['output'];
  readonly layoutY: Scalars['Int']['output'];
  readonly look: Look;
  readonly lookBoard: LookBoard;
  readonly updatedAt: Scalars['String']['output'];
  readonly width?: Maybe<Scalars['Int']['output']>;
};

export type LookBoardButtonPositionInput = {
  readonly buttonId: Scalars['ID']['input'];
  readonly layoutX: Scalars['Int']['input'];
  readonly layoutY: Scalars['Int']['input'];
};

export type LookBoardButtonUpdateItem = {
  readonly buttonId: Scalars['ID']['input'];
  readonly color?: InputMaybe<Scalars['String']['input']>;
  readonly height?: InputMaybe<Scalars['Int']['input']>;
  readonly label?: InputMaybe<Scalars['String']['input']>;
  readonly layoutX?: InputMaybe<Scalars['Int']['input']>;
  readonly layoutY?: InputMaybe<Scalars['Int']['input']>;
  readonly width?: InputMaybe<Scalars['Int']['input']>;
};

/** Payload for look board data change notifications (used for undo/redo real-time updates) */
export type LookBoardDataChangedPayload = {
  readonly __typename?: 'LookBoardDataChangedPayload';
  /** Affected button IDs (for button-specific changes) */
  readonly affectedButtonIds?: Maybe<ReadonlyArray<Scalars['ID']['output']>>;
  readonly changeType: EntityDataChangeType;
  readonly lookBoardId: Scalars['ID']['output'];
  readonly projectId: Scalars['ID']['output'];
  /** Timestamp of the change */
  readonly timestamp: Scalars['String']['output'];
};

export type LookBoardUpdateItem = {
  readonly canvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly canvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly defaultFadeTime?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly gridSize?: InputMaybe<Scalars['Int']['input']>;
  readonly lookBoardId: Scalars['ID']['input'];
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type LookComparison = {
  readonly __typename?: 'LookComparison';
  readonly differences: ReadonlyArray<LookDifference>;
  readonly differentFixtureCount: Scalars['Int']['output'];
  readonly identicalFixtureCount: Scalars['Int']['output'];
  readonly look1: LookSummary;
  readonly look2: LookSummary;
};

/** Payload for look data change notifications (used for undo/redo real-time updates) */
export type LookDataChangedPayload = {
  readonly __typename?: 'LookDataChangedPayload';
  readonly changeType: EntityDataChangeType;
  readonly lookId: Scalars['ID']['output'];
  readonly projectId: Scalars['ID']['output'];
  /** Timestamp of the change */
  readonly timestamp: Scalars['String']['output'];
};

export type LookDifference = {
  readonly __typename?: 'LookDifference';
  readonly differenceType: DifferenceType;
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
  readonly look1Values?: Maybe<ReadonlyArray<Scalars['Int']['output']>>;
  readonly look2Values?: Maybe<ReadonlyArray<Scalars['Int']['output']>>;
};

export type LookFilterInput = {
  readonly nameContains?: InputMaybe<Scalars['String']['input']>;
  readonly usesFixture?: InputMaybe<Scalars['ID']['input']>;
};

export type LookFixtureSummary = {
  readonly __typename?: 'LookFixtureSummary';
  readonly fixtureId: Scalars['ID']['output'];
  readonly fixtureName: Scalars['String']['output'];
  readonly fixtureType: FixtureType;
};

export type LookPage = {
  readonly __typename?: 'LookPage';
  readonly looks: ReadonlyArray<LookSummary>;
  readonly pagination: PaginationInfo;
};

/**
 * Partial update for a single look in a bulk operation.
 * When mergeFixtures is true (default), only specified fixtures are updated.
 * When false, all existing fixtures are replaced with the provided list.
 */
export type LookPartialUpdateItem = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly fixtureValues?: InputMaybe<ReadonlyArray<FixtureValueInput>>;
  readonly lookId: Scalars['ID']['input'];
  /** When true (default), only specified fixtures are updated. When false, replaces all fixtures. */
  readonly mergeFixtures?: InputMaybe<Scalars['Boolean']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export enum LookSortField {
  CreatedAt = 'CREATED_AT',
  Name = 'NAME',
  UpdatedAt = 'UPDATED_AT'
}

export type LookSummary = {
  readonly __typename?: 'LookSummary';
  readonly createdAt: Scalars['String']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly fixtureCount: Scalars['Int']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly updatedAt: Scalars['String']['output'];
};

export type LookUpdateItem = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly lookId: Scalars['ID']['input'];
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type LookUsage = {
  readonly __typename?: 'LookUsage';
  readonly cues: ReadonlyArray<CueUsageSummary>;
  readonly lookId: Scalars['ID']['output'];
  readonly lookName: Scalars['String']['output'];
};

export type ModeChannel = {
  readonly __typename?: 'ModeChannel';
  readonly channel: ChannelDefinition;
  readonly id: Scalars['ID']['output'];
  readonly offset: Scalars['Int']['output'];
};

/** Status of the modulator engine. */
export type ModulatorStatus = {
  readonly __typename?: 'ModulatorStatus';
  readonly activeEffectCount: Scalars['Int']['output'];
  readonly activeEffects: ReadonlyArray<ActiveEffectStatus>;
  readonly blackoutIntensity: Scalars['Float']['output'];
  readonly grandMasterValue: Scalars['Float']['output'];
  /** Whether there's an active crossfade transition */
  readonly hasActiveTransition: Scalars['Boolean']['output'];
  readonly isBlackoutActive: Scalars['Boolean']['output'];
  readonly isRunning: Scalars['Boolean']['output'];
  /** Progress of the active transition (0-100) */
  readonly transitionProgress: Scalars['Float']['output'];
  readonly updateRateHz: Scalars['Int']['output'];
};

export type Mutation = {
  readonly __typename?: 'Mutation';
  /** Accept a group invitation */
  readonly acceptInvitation: Scalars['Boolean']['output'];
  /** Activate the system blackout with optional fade time */
  readonly activateBlackout: Scalars['Boolean']['output'];
  /** Activate an effect with optional fade time */
  readonly activateEffect: Scalars['Boolean']['output'];
  readonly activateLookFromBoard: Scalars['Boolean']['output'];
  /** Add a channel to an effect fixture */
  readonly addChannelToEffectFixture: EffectChannel;
  /** Add a device to a group (group admin or system admin) */
  readonly addDeviceToGroup: Scalars['Boolean']['output'];
  /** Add an effect to a cue with runtime parameters */
  readonly addEffectToCue: CueEffect;
  /** Add a fixture to an effect with optional per-fixture settings */
  readonly addFixtureToEffect: EffectFixture;
  readonly addFixturesToLook: Look;
  readonly addLookToBoard: LookBoardButton;
  /** Add a user to a group (group admin or system admin) */
  readonly addUserToGroup: Scalars['Boolean']['output'];
  /** Sign in with Apple */
  readonly appleSignIn: AuthPayload;
  /** Approve a pending device (admin only). Optionally assign to a group. */
  readonly approveDevice: Device;
  /** Authorize a device using an authorization code */
  readonly authorizeDevice: AuthPayload;
  readonly bulkCreateCueLists: ReadonlyArray<CueList>;
  readonly bulkCreateCues: ReadonlyArray<Cue>;
  readonly bulkCreateFixtureDefinitions: ReadonlyArray<FixtureDefinition>;
  readonly bulkCreateFixtures: ReadonlyArray<FixtureInstance>;
  readonly bulkCreateLookBoardButtons: ReadonlyArray<LookBoardButton>;
  readonly bulkCreateLookBoards: ReadonlyArray<LookBoard>;
  readonly bulkCreateLooks: ReadonlyArray<Look>;
  readonly bulkCreateProjects: ReadonlyArray<Project>;
  readonly bulkDeleteCueLists: BulkDeleteResult;
  readonly bulkDeleteCues: BulkDeleteResult;
  readonly bulkDeleteFixtureDefinitions: BulkDeleteResult;
  readonly bulkDeleteFixtures: BulkDeleteResult;
  readonly bulkDeleteLookBoardButtons: BulkDeleteResult;
  readonly bulkDeleteLookBoards: BulkDeleteResult;
  readonly bulkDeleteLooks: BulkDeleteResult;
  readonly bulkDeleteProjects: BulkDeleteResult;
  readonly bulkUpdateCueLists: ReadonlyArray<CueList>;
  readonly bulkUpdateCues: ReadonlyArray<Cue>;
  readonly bulkUpdateFixtureDefinitions: ReadonlyArray<FixtureDefinition>;
  readonly bulkUpdateFixtures: ReadonlyArray<FixtureInstance>;
  readonly bulkUpdateInstanceChannelsFadeBehavior: ReadonlyArray<InstanceChannel>;
  readonly bulkUpdateLookBoardButtons: ReadonlyArray<LookBoardButton>;
  readonly bulkUpdateLookBoards: ReadonlyArray<LookBoard>;
  readonly bulkUpdateLooks: ReadonlyArray<Look>;
  readonly bulkUpdateLooksPartial: ReadonlyArray<Look>;
  readonly bulkUpdateProjects: ReadonlyArray<Project>;
  /** Cancel a pending group invitation (group admin or system admin) */
  readonly cancelInvitation: Scalars['Boolean']['output'];
  /** Cancel an ongoing OFL import */
  readonly cancelOFLImport: Scalars['Boolean']['output'];
  readonly cancelPreviewSession: Scalars['Boolean']['output'];
  /** Change the current user's password */
  readonly changePassword: Scalars['Boolean']['output'];
  /** Clear all operation history for a project */
  readonly clearOperationHistory: Scalars['Boolean']['output'];
  readonly cloneLook: Look;
  readonly commitPreviewSession: Scalars['Boolean']['output'];
  readonly connectWiFi: WiFiConnectionResult;
  /**
   * Copy fixture values from one look to multiple target looks.
   * This is an atomic operation - a single undo reverses all changes.
   */
  readonly copyFixturesToLooks: CopyFixturesToLooksResult;
  readonly createCue: Cue;
  readonly createCueList: CueList;
  /** Create a device authorization code (admin only) */
  readonly createDeviceAuthCode: DeviceAuthCode;
  /** Create a new effect */
  readonly createEffect: Effect;
  readonly createFixtureDefinition: FixtureDefinition;
  readonly createFixtureInstance: FixtureInstance;
  readonly createLook: Look;
  readonly createLookBoard: LookBoard;
  readonly createProject: Project;
  /** Create a new user (admin only) */
  readonly createUser: User;
  /** Create a user group (admin only) */
  readonly createUserGroup: UserGroup;
  /** Decline a group invitation */
  readonly declineInvitation: Scalars['Boolean']['output'];
  readonly deleteCue: Scalars['Boolean']['output'];
  readonly deleteCueList: Scalars['Boolean']['output'];
  /** Delete an effect */
  readonly deleteEffect: Scalars['Boolean']['output'];
  readonly deleteFixtureDefinition: Scalars['Boolean']['output'];
  readonly deleteFixtureInstance: Scalars['Boolean']['output'];
  readonly deleteLook: Scalars['Boolean']['output'];
  readonly deleteLookBoard: Scalars['Boolean']['output'];
  readonly deleteProject: Scalars['Boolean']['output'];
  /** Delete a user (admin only) */
  readonly deleteUser: Scalars['Boolean']['output'];
  /** Delete a user group (admin only) */
  readonly deleteUserGroup: Scalars['Boolean']['output'];
  readonly disconnectWiFi: WiFiConnectionResult;
  readonly duplicateLook: Look;
  readonly exportProject: ExportResult;
  readonly exportProjectToQLC: QlcExportResult;
  readonly fadeToBlack: Scalars['Boolean']['output'];
  readonly forgetWiFiNetwork: Scalars['Boolean']['output'];
  readonly goToCue: Scalars['Boolean']['output'];
  readonly importOFLFixture: FixtureDefinition;
  readonly importProject: ImportResult;
  readonly importProjectFromQLC: QlcImportResult;
  readonly initializePreviewWithLook: Scalars['Boolean']['output'];
  /** Invite a user by email to join a group */
  readonly inviteToGroup: GroupInvitation;
  /** Jump to a specific operation in history */
  readonly jumpToOperation: UndoRedoResult;
  /** Login with email and password */
  readonly login: AuthPayload;
  /** Logout the current session */
  readonly logout: Scalars['Boolean']['output'];
  /** Logout all sessions for the current user */
  readonly logoutAll: Scalars['Boolean']['output'];
  readonly nextCue: Scalars['Boolean']['output'];
  readonly permanentlyDeleteProject: Scalars['Boolean']['output'];
  readonly playCue: Scalars['Boolean']['output'];
  readonly previousCue: Scalars['Boolean']['output'];
  /** Redo the last undone operation for a project */
  readonly redo: UndoRedoResult;
  /** Refresh the access token using a refresh token */
  readonly refreshToken: AuthPayload;
  /** Register a new user with email and password */
  readonly register: AuthPayload;
  /** Register a device for device-based auth (unauthenticated) */
  readonly registerDevice: DeviceRegistrationResult;
  /** Release the system blackout with optional fade time */
  readonly releaseBlackout: Scalars['Boolean']['output'];
  /** Remove a channel from an effect fixture */
  readonly removeChannelFromEffectFixture: Scalars['Boolean']['output'];
  /** Remove a device from a group (group admin or system admin) */
  readonly removeDeviceFromGroup: Scalars['Boolean']['output'];
  /** Remove an effect from a cue */
  readonly removeEffectFromCue: Scalars['Boolean']['output'];
  /** Remove a fixture from an effect */
  readonly removeFixtureFromEffect: Scalars['Boolean']['output'];
  readonly removeFixturesFromLook: Look;
  readonly removeLookFromBoard: Scalars['Boolean']['output'];
  /** Remove a user from a group (group admin or system admin) */
  readonly removeUserFromGroup: Scalars['Boolean']['output'];
  readonly reorderCues: Scalars['Boolean']['output'];
  readonly reorderLookFixtures: Scalars['Boolean']['output'];
  readonly reorderProjectFixtures: Scalars['Boolean']['output'];
  /** Request email verification */
  readonly requestEmailVerification: Scalars['Boolean']['output'];
  /** Request a password reset email */
  readonly requestPasswordReset: Scalars['Boolean']['output'];
  readonly resetAPTimeout: Scalars['Boolean']['output'];
  /** Reset password using a reset token */
  readonly resetPassword: Scalars['Boolean']['output'];
  readonly restoreProject: Project;
  /** Resume a paused cue list by snapping to the current cue's look values instantly */
  readonly resumeCueList: Scalars['Boolean']['output'];
  /** Revoke all sessions for a user (admin only) */
  readonly revokeAllUserSessions: Scalars['Boolean']['output'];
  /** Revoke a device's authorization (admin only) */
  readonly revokeDevice: Device;
  /** Revoke a specific session (admin only) */
  readonly revokeSession: Scalars['Boolean']['output'];
  readonly setArtNetEnabled: ArtNetStatus;
  readonly setChannelValue: Scalars['Boolean']['output'];
  /** Set the grand master level (0.0-1.0) */
  readonly setGrandMaster: Scalars['Boolean']['output'];
  readonly setLookLive: Scalars['Boolean']['output'];
  readonly setWiFiEnabled: WiFiStatus;
  readonly startAPMode: WiFiModeResult;
  readonly startCueList: Scalars['Boolean']['output'];
  readonly startPreviewSession: PreviewSession;
  readonly stopAPMode: WiFiModeResult;
  readonly stopCueList: Scalars['Boolean']['output'];
  /** Stop an active effect with optional fade time */
  readonly stopEffect: Scalars['Boolean']['output'];
  /** Toggle the skip status of a cue (skip=true means the cue is bypassed during playback) */
  readonly toggleCueSkip: Cue;
  /** Trigger an OFL import/update operation */
  readonly triggerOFLImport: OflImportResult;
  /** Undo the last operation for a project */
  readonly undo: UndoRedoResult;
  readonly updateAllRepositories: ReadonlyArray<UpdateResult>;
  /** Update authentication settings (admin only) */
  readonly updateAuthSettings: AuthSettings;
  readonly updateCue: Cue;
  readonly updateCueList: CueList;
  /** Update a device (admin only) */
  readonly updateDevice: Device;
  /** Update device permissions (admin only) */
  readonly updateDevicePermissions: Device;
  /** Update an existing effect */
  readonly updateEffect: Effect;
  /** Update an effect channel */
  readonly updateEffectChannel: EffectChannel;
  /** Update fixture-specific settings in an effect */
  readonly updateEffectFixture: EffectFixture;
  readonly updateFadeUpdateRate: Scalars['Boolean']['output'];
  readonly updateFixtureDefinition: FixtureDefinition;
  readonly updateFixtureInstance: FixtureInstance;
  readonly updateFixturePositions: Scalars['Boolean']['output'];
  /** Update a group member's role (group admin or system admin) */
  readonly updateGroupMemberRole: Scalars['Boolean']['output'];
  readonly updateInstanceChannelFadeBehavior: InstanceChannel;
  readonly updateLook: Look;
  readonly updateLookBoard: LookBoard;
  readonly updateLookBoardButton: LookBoardButton;
  readonly updateLookBoardButtonPositions: Scalars['Boolean']['output'];
  readonly updateLookPartial: Look;
  readonly updatePreviewChannel: Scalars['Boolean']['output'];
  readonly updateProject: Project;
  readonly updateRepository: UpdateResult;
  readonly updateSetting: Setting;
  /** Update a user (admin only) */
  readonly updateUser: User;
  /** Update a user group (admin only) */
  readonly updateUserGroup: UserGroup;
  /** Verify email with token */
  readonly verifyEmail: Scalars['Boolean']['output'];
};


export type MutationAcceptInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationActivateBlackoutArgs = {
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationActivateEffectArgs = {
  effectId: Scalars['ID']['input'];
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationActivateLookFromBoardArgs = {
  fadeTimeOverride?: InputMaybe<Scalars['Float']['input']>;
  lookBoardId: Scalars['ID']['input'];
  lookId: Scalars['ID']['input'];
};


export type MutationAddChannelToEffectFixtureArgs = {
  effectFixtureId: Scalars['ID']['input'];
  input: EffectChannelInput;
};


export type MutationAddDeviceToGroupArgs = {
  deviceId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
};


export type MutationAddEffectToCueArgs = {
  input: AddEffectToCueInput;
};


export type MutationAddFixtureToEffectArgs = {
  input: AddFixtureToEffectInput;
};


export type MutationAddFixturesToLookArgs = {
  fixtureValues: ReadonlyArray<FixtureValueInput>;
  lookId: Scalars['ID']['input'];
  overwriteExisting?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationAddLookToBoardArgs = {
  input: CreateLookBoardButtonInput;
};


export type MutationAddUserToGroupArgs = {
  groupId: Scalars['ID']['input'];
  role?: InputMaybe<GroupMemberRole>;
  userId: Scalars['ID']['input'];
};


export type MutationAppleSignInArgs = {
  authorizationCode: Scalars['String']['input'];
  identityToken: Scalars['String']['input'];
};


export type MutationApproveDeviceArgs = {
  deviceId: Scalars['ID']['input'];
  groupId?: InputMaybe<Scalars['ID']['input']>;
  permissions: DevicePermissions;
};


export type MutationAuthorizeDeviceArgs = {
  authorizationCode: Scalars['String']['input'];
  fingerprint: Scalars['String']['input'];
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


export type MutationBulkCreateLookBoardButtonsArgs = {
  input: BulkLookBoardButtonCreateInput;
};


export type MutationBulkCreateLookBoardsArgs = {
  input: BulkLookBoardCreateInput;
};


export type MutationBulkCreateLooksArgs = {
  input: BulkLookCreateInput;
};


export type MutationBulkCreateProjectsArgs = {
  input: BulkProjectCreateInput;
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


export type MutationBulkDeleteLookBoardButtonsArgs = {
  buttonIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteLookBoardsArgs = {
  lookBoardIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteLooksArgs = {
  lookIds: ReadonlyArray<Scalars['ID']['input']>;
};


export type MutationBulkDeleteProjectsArgs = {
  projectIds: ReadonlyArray<Scalars['ID']['input']>;
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


export type MutationBulkUpdateLookBoardButtonsArgs = {
  input: BulkLookBoardButtonUpdateInput;
};


export type MutationBulkUpdateLookBoardsArgs = {
  input: BulkLookBoardUpdateInput;
};


export type MutationBulkUpdateLooksArgs = {
  input: BulkLookUpdateInput;
};


export type MutationBulkUpdateLooksPartialArgs = {
  input: BulkLookPartialUpdateInput;
};


export type MutationBulkUpdateProjectsArgs = {
  input: BulkProjectUpdateInput;
};


export type MutationCancelInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationCancelPreviewSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  newPassword: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
};


export type MutationClearOperationHistoryArgs = {
  confirmClear: Scalars['Boolean']['input'];
  projectId: Scalars['ID']['input'];
};


export type MutationCloneLookArgs = {
  lookId: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type MutationCommitPreviewSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationConnectWiFiArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  ssid: Scalars['String']['input'];
};


export type MutationCopyFixturesToLooksArgs = {
  input: CopyFixturesToLooksInput;
};


export type MutationCreateCueArgs = {
  input: CreateCueInput;
};


export type MutationCreateCueListArgs = {
  input: CreateCueListInput;
};


export type MutationCreateDeviceAuthCodeArgs = {
  deviceId: Scalars['ID']['input'];
};


export type MutationCreateEffectArgs = {
  input: CreateEffectInput;
};


export type MutationCreateFixtureDefinitionArgs = {
  input: CreateFixtureDefinitionInput;
};


export type MutationCreateFixtureInstanceArgs = {
  input: CreateFixtureInstanceInput;
};


export type MutationCreateLookArgs = {
  input: CreateLookInput;
};


export type MutationCreateLookBoardArgs = {
  input: CreateLookBoardInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationCreateUserGroupArgs = {
  input: CreateUserGroupInput;
};


export type MutationDeclineInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationDeleteCueArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCueListArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteEffectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFixtureDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFixtureInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLookBoardArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserGroupArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDuplicateLookArgs = {
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


export type MutationInitializePreviewWithLookArgs = {
  lookId: Scalars['ID']['input'];
  sessionId: Scalars['ID']['input'];
};


export type MutationInviteToGroupArgs = {
  email: Scalars['String']['input'];
  groupId: Scalars['ID']['input'];
  role?: InputMaybe<GroupMemberRole>;
};


export type MutationJumpToOperationArgs = {
  operationId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationNextCueArgs = {
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationPermanentlyDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationPlayCueArgs = {
  cueId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationPreviousCueArgs = {
  cueListId: Scalars['ID']['input'];
  fadeInTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationRedoArgs = {
  projectId: Scalars['ID']['input'];
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRegisterDeviceArgs = {
  fingerprint: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationReleaseBlackoutArgs = {
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationRemoveChannelFromEffectFixtureArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveDeviceFromGroupArgs = {
  deviceId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
};


export type MutationRemoveEffectFromCueArgs = {
  cueId: Scalars['ID']['input'];
  effectId: Scalars['ID']['input'];
};


export type MutationRemoveFixtureFromEffectArgs = {
  effectId: Scalars['ID']['input'];
  fixtureId: Scalars['ID']['input'];
};


export type MutationRemoveFixturesFromLookArgs = {
  fixtureIds: ReadonlyArray<Scalars['ID']['input']>;
  lookId: Scalars['ID']['input'];
};


export type MutationRemoveLookFromBoardArgs = {
  buttonId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromGroupArgs = {
  groupId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationReorderCuesArgs = {
  cueListId: Scalars['ID']['input'];
  cueOrders: ReadonlyArray<CueOrderInput>;
};


export type MutationReorderLookFixturesArgs = {
  fixtureOrders: ReadonlyArray<FixtureOrderInput>;
  lookId: Scalars['ID']['input'];
};


export type MutationReorderProjectFixturesArgs = {
  fixtureOrders: ReadonlyArray<FixtureOrderInput>;
  projectId: Scalars['ID']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationRestoreProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationResumeCueListArgs = {
  cueListId: Scalars['ID']['input'];
};


export type MutationRevokeAllUserSessionsArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRevokeDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationSetArtNetEnabledArgs = {
  enabled: Scalars['Boolean']['input'];
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationSetChannelValueArgs = {
  channel: Scalars['Int']['input'];
  universe: Scalars['Int']['input'];
  value: Scalars['Int']['input'];
};


export type MutationSetGrandMasterArgs = {
  value: Scalars['Float']['input'];
};


export type MutationSetLookLiveArgs = {
  lookId: Scalars['ID']['input'];
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


export type MutationStopApModeArgs = {
  connectToSSID?: InputMaybe<Scalars['String']['input']>;
};


export type MutationStopCueListArgs = {
  cueListId: Scalars['ID']['input'];
};


export type MutationStopEffectArgs = {
  effectId: Scalars['ID']['input'];
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
};


export type MutationToggleCueSkipArgs = {
  cueId: Scalars['ID']['input'];
};


export type MutationTriggerOflImportArgs = {
  options?: InputMaybe<OflImportOptionsInput>;
};


export type MutationUndoArgs = {
  projectId: Scalars['ID']['input'];
};


export type MutationUpdateAuthSettingsArgs = {
  input: UpdateAuthSettingsInput;
};


export type MutationUpdateCueArgs = {
  id: Scalars['ID']['input'];
  input: CreateCueInput;
};


export type MutationUpdateCueListArgs = {
  id: Scalars['ID']['input'];
  input: CreateCueListInput;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
};


export type MutationUpdateDevicePermissionsArgs = {
  deviceId: Scalars['ID']['input'];
  permissions: DevicePermissions;
};


export type MutationUpdateEffectArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEffectInput;
};


export type MutationUpdateEffectChannelArgs = {
  id: Scalars['ID']['input'];
  input: EffectChannelInput;
};


export type MutationUpdateEffectFixtureArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEffectFixtureInput;
};


export type MutationUpdateFadeUpdateRateArgs = {
  rateHz: Scalars['Int']['input'];
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


export type MutationUpdateGroupMemberRoleArgs = {
  groupId: Scalars['ID']['input'];
  role: GroupMemberRole;
  userId: Scalars['ID']['input'];
};


export type MutationUpdateInstanceChannelFadeBehaviorArgs = {
  channelId: Scalars['ID']['input'];
  fadeBehavior: FadeBehavior;
};


export type MutationUpdateLookArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLookInput;
};


export type MutationUpdateLookBoardArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLookBoardInput;
};


export type MutationUpdateLookBoardButtonArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLookBoardButtonInput;
};


export type MutationUpdateLookBoardButtonPositionsArgs = {
  positions: ReadonlyArray<LookBoardButtonPositionInput>;
};


export type MutationUpdateLookPartialArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  fixtureValues?: InputMaybe<ReadonlyArray<FixtureValueInput>>;
  lookId: Scalars['ID']['input'];
  mergeFixtures?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
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


export type MutationUpdateSettingArgs = {
  input: UpdateSettingInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};


export type MutationUpdateUserGroupArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserGroupInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};

export type NetworkInterfaceOption = {
  readonly __typename?: 'NetworkInterfaceOption';
  readonly address: Scalars['String']['output'];
  readonly broadcast: Scalars['String']['output'];
  readonly description: Scalars['String']['output'];
  readonly interfaceType: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
};

/** OAuth provider type for authentication. */
export enum OAuthProvider {
  Apple = 'APPLE'
}

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

/** Represents a recorded operation in the undo/redo history. */
export type Operation = {
  readonly __typename?: 'Operation';
  readonly createdAt: Scalars['String']['output'];
  readonly description: Scalars['String']['output'];
  readonly entityId: Scalars['ID']['output'];
  readonly entityType: UndoEntityType;
  readonly id: Scalars['ID']['output'];
  readonly operationType: OperationType;
  readonly projectId: Scalars['ID']['output'];
  /** JSON array of related entity IDs for bulk operations */
  readonly relatedIds?: Maybe<ReadonlyArray<Scalars['ID']['output']>>;
  readonly sequence: Scalars['Int']['output'];
};

/** Paginated operation history for a project. */
export type OperationHistoryPage = {
  readonly __typename?: 'OperationHistoryPage';
  readonly currentSequence: Scalars['Int']['output'];
  readonly operations: ReadonlyArray<OperationSummary>;
  readonly pagination: PaginationInfo;
};

/** Summary view of an operation for history display. */
export type OperationSummary = {
  readonly __typename?: 'OperationSummary';
  readonly createdAt: Scalars['String']['output'];
  readonly description: Scalars['String']['output'];
  readonly entityType: UndoEntityType;
  readonly id: Scalars['ID']['output'];
  /** True if this operation is at the current position in history */
  readonly isCurrent: Scalars['Boolean']['output'];
  readonly operationType: OperationType;
  readonly sequence: Scalars['Int']['output'];
};

/** Type of operation recorded for undo/redo. */
export enum OperationType {
  Bulk = 'BULK',
  Create = 'CREATE',
  Delete = 'DELETE',
  Update = 'UPDATE'
}

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

/**
 * Priority band determines effect processing order.
 * Effects in higher bands (SYSTEM) override effects in lower bands (BASE).
 */
export enum PriorityBand {
  Base = 'BASE',
  Cue = 'CUE',
  System = 'SYSTEM',
  User = 'USER'
}

export type Project = {
  readonly __typename?: 'Project';
  readonly createdAt: Scalars['String']['output'];
  readonly cueListCount: Scalars['Int']['output'];
  readonly cueLists: ReadonlyArray<CueList>;
  readonly deletedAt?: Maybe<Scalars['String']['output']>;
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly fixtureCount: Scalars['Int']['output'];
  readonly fixtures: ReadonlyArray<FixtureInstance>;
  /** The group that owns this project (null for auth-off legacy projects) */
  readonly group?: Maybe<UserGroup>;
  /** The group ID that owns this project */
  readonly groupId?: Maybe<Scalars['ID']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly layoutCanvasHeight: Scalars['Int']['output'];
  readonly layoutCanvasWidth: Scalars['Int']['output'];
  readonly lookBoards: ReadonlyArray<LookBoard>;
  readonly lookCount: Scalars['Int']['output'];
  readonly looks: ReadonlyArray<Look>;
  readonly name: Scalars['String']['output'];
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
  readonly layoutCanvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly layoutCanvasWidth?: InputMaybe<Scalars['Int']['input']>;
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
  readonly lookCount: Scalars['Int']['output'];
  readonly projectName: Scalars['String']['output'];
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
  readonly lookCount: Scalars['Int']['output'];
  readonly originalFileName: Scalars['String']['output'];
  readonly project: Project;
  readonly warnings: ReadonlyArray<Scalars['String']['output']>;
};

export type Query = {
  readonly __typename?: 'Query';
  readonly allDmxOutput: ReadonlyArray<UniverseOutput>;
  readonly apClients: ReadonlyArray<ApClient>;
  readonly apConfig?: Maybe<ApConfig>;
  readonly artNetStatus: ArtNetStatus;
  /** Check if authentication is enabled */
  readonly authEnabled: Scalars['Boolean']['output'];
  /** Get global authentication settings (admin only when auth enabled) */
  readonly authSettings: AuthSettings;
  readonly availableVersions: ReadonlyArray<Scalars['String']['output']>;
  /** Get server build information for version verification */
  readonly buildInfo: BuildInfo;
  readonly channelMap: ChannelMapResult;
  /** Check device status by fingerprint (unauthenticated, for registration flow) */
  readonly checkDevice: DeviceCheckResult;
  /** Check if a device is authorized by fingerprint */
  readonly checkDeviceAuthorization: DeviceAuthStatus;
  /** Check for available OFL updates without importing */
  readonly checkOFLUpdates: OflUpdateCheckResult;
  readonly compareLooks: LookComparison;
  readonly cue?: Maybe<Cue>;
  readonly cueList?: Maybe<CueList>;
  readonly cueListPlaybackStatus?: Maybe<CueListPlaybackStatus>;
  readonly cueLists: ReadonlyArray<CueListSummary>;
  readonly cueListsByIds: ReadonlyArray<CueList>;
  readonly cuesByIds: ReadonlyArray<Cue>;
  /**
   * Get all cues in a cue list with their look info, plus orphan looks.
   * Used for the "Copy Fixtures to Other Looks" modal.
   */
  readonly cuesWithLookInfo: CuesWithLookInfoResponse;
  readonly currentActiveLook?: Maybe<Look>;
  readonly deletedProjects: ReadonlyArray<Project>;
  /** Get a device by ID (admin only) */
  readonly device?: Maybe<Device>;
  /** List all devices, optionally filtered by status (admin only) */
  readonly devices: ReadonlyArray<Device>;
  readonly dmxOutput: ReadonlyArray<Scalars['Int']['output']>;
  /** Get a single effect by ID */
  readonly effect?: Maybe<Effect>;
  /** List all effects in a project */
  readonly effects: ReadonlyArray<Effect>;
  readonly fixtureDefinition?: Maybe<FixtureDefinition>;
  readonly fixtureDefinitions: ReadonlyArray<FixtureDefinition>;
  readonly fixtureDefinitionsByIds: ReadonlyArray<FixtureDefinition>;
  readonly fixtureInstance?: Maybe<FixtureInstance>;
  readonly fixtureInstances: FixtureInstancePage;
  readonly fixtureUsage: FixtureUsage;
  readonly fixturesByIds: ReadonlyArray<FixtureInstance>;
  readonly getQLCFixtureMappingSuggestions: QlcFixtureMappingResult;
  /** Get global playback status - which cue list is currently playing (if any) */
  readonly globalPlaybackStatus: GlobalPlaybackStatus;
  /** Get invitations for a group (group admin or system admin) */
  readonly groupInvitations: ReadonlyArray<GroupInvitation>;
  readonly look?: Maybe<Look>;
  readonly lookBoard?: Maybe<LookBoard>;
  readonly lookBoardButton?: Maybe<LookBoardButton>;
  readonly lookBoards: ReadonlyArray<LookBoard>;
  readonly lookBoardsByIds: ReadonlyArray<LookBoard>;
  readonly lookFixtures: ReadonlyArray<LookFixtureSummary>;
  readonly lookUsage: LookUsage;
  readonly looks: LookPage;
  readonly looksByIds: ReadonlyArray<Look>;
  /** Get the currently authenticated user (null if not authenticated) */
  readonly me?: Maybe<AuthUser>;
  /** Get the current status of the modulator engine */
  readonly modulatorStatus: ModulatorStatus;
  /** Get groups the current user belongs to */
  readonly myGroups: ReadonlyArray<UserGroup>;
  /** Get pending invitations for the current user */
  readonly myInvitations: ReadonlyArray<GroupInvitation>;
  /** Get the current user's active sessions */
  readonly mySessions: ReadonlyArray<Session>;
  readonly networkInterfaceOptions: ReadonlyArray<NetworkInterfaceOption>;
  /** Get the current status of any ongoing OFL import */
  readonly oflImportStatus: OflImportStatus;
  /** Get a specific operation by ID */
  readonly operation?: Maybe<Operation>;
  /** Get paginated operation history for a project */
  readonly operationHistory: OperationHistoryPage;
  /** Get devices pending approval (admin only) */
  readonly pendingDevices: ReadonlyArray<Device>;
  readonly previewSession?: Maybe<PreviewSession>;
  readonly project?: Maybe<Project>;
  readonly projects: ReadonlyArray<Project>;
  readonly projectsByIds: ReadonlyArray<Project>;
  readonly savedWifiNetworks: ReadonlyArray<WiFiNetwork>;
  readonly searchCues: CuePage;
  readonly searchFixtures: FixtureInstancePage;
  readonly searchLooks: LookPage;
  readonly setting?: Maybe<Setting>;
  readonly settings: ReadonlyArray<Setting>;
  readonly suggestChannelAssignment: ChannelAssignmentSuggestion;
  readonly systemInfo: SystemInfo;
  readonly systemVersions: SystemVersionInfo;
  /** Get current undo/redo status for a project */
  readonly undoRedoStatus: UndoRedoStatus;
  /** Get a user by ID (admin only) */
  readonly user?: Maybe<User>;
  /** Get a user group by ID (admin only) */
  readonly userGroup?: Maybe<UserGroup>;
  /** List all user groups (admin only) */
  readonly userGroups: ReadonlyArray<UserGroup>;
  /** List all users (admin only) */
  readonly users: ReadonlyArray<User>;
  readonly wifiMode: WiFiMode;
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


export type QueryCheckDeviceArgs = {
  fingerprint: Scalars['String']['input'];
};


export type QueryCheckDeviceAuthorizationArgs = {
  fingerprint: Scalars['String']['input'];
};


export type QueryCompareLooksArgs = {
  lookId1: Scalars['ID']['input'];
  lookId2: Scalars['ID']['input'];
};


export type QueryCueArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCueListArgs = {
  id: Scalars['ID']['input'];
  includeLookDetails?: InputMaybe<Scalars['Boolean']['input']>;
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


export type QueryCuesWithLookInfoArgs = {
  cueListId: Scalars['ID']['input'];
};


export type QueryDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDevicesArgs = {
  status?: InputMaybe<DeviceStatus>;
};


export type QueryDmxOutputArgs = {
  universe: Scalars['Int']['input'];
};


export type QueryEffectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEffectsArgs = {
  projectId: Scalars['ID']['input'];
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


export type QueryGroupInvitationsArgs = {
  groupId: Scalars['ID']['input'];
};


export type QueryLookArgs = {
  id: Scalars['ID']['input'];
  includeFixtureValues?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryLookBoardArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLookBoardButtonArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLookBoardsArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryLookBoardsByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QueryLookFixturesArgs = {
  lookId: Scalars['ID']['input'];
};


export type QueryLookUsageArgs = {
  lookId: Scalars['ID']['input'];
};


export type QueryLooksArgs = {
  filter?: InputMaybe<LookFilterInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  projectId: Scalars['ID']['input'];
  sortBy?: InputMaybe<LookSortField>;
};


export type QueryLooksByIdsArgs = {
  ids: ReadonlyArray<Scalars['ID']['input']>;
};


export type QueryOperationArgs = {
  operationId: Scalars['ID']['input'];
};


export type QueryOperationHistoryArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
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


export type QuerySearchLooksArgs = {
  filter?: InputMaybe<LookFilterInput>;
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


export type QueryUndoRedoStatusArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserGroupArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWifiNetworksArgs = {
  deduplicate?: InputMaybe<Scalars['Boolean']['input']>;
  rescan?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RegisterInput = {
  readonly email: Scalars['String']['input'];
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly password: Scalars['String']['input'];
};

export type RepositoryVersion = {
  readonly __typename?: 'RepositoryVersion';
  readonly installed: Scalars['String']['output'];
  readonly latest: Scalars['String']['output'];
  readonly repository: Scalars['String']['output'];
  readonly updateAvailable: Scalars['Boolean']['output'];
};

/** User session information. */
export type Session = {
  readonly __typename?: 'Session';
  readonly createdAt: Scalars['String']['output'];
  readonly device?: Maybe<Device>;
  /** Device associated with this session (if device auth) */
  readonly deviceId?: Maybe<Scalars['ID']['output']>;
  readonly expiresAt: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly ipAddress?: Maybe<Scalars['String']['output']>;
  readonly lastActivityAt: Scalars['String']['output'];
  readonly userAgent?: Maybe<Scalars['String']['output']>;
  readonly userId: Scalars['ID']['output'];
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
  /** Real-time updates when cue list data changes (cue added/updated/removed, reordering, metadata changes, look name changes) */
  readonly cueListDataChanged: CueListDataChangedPayload;
  readonly cueListPlaybackUpdated: CueListPlaybackStatus;
  readonly dmxOutputChanged: UniverseOutput;
  /** Real-time updates when fixture data changes (positions updated via undo/redo) */
  readonly fixtureDataChanged: FixtureDataChangedPayload;
  /** Global playback status updates - triggered when any cue list starts/stops/changes cue */
  readonly globalPlaybackStatusUpdated: GlobalPlaybackStatus;
  /** Real-time updates when look board data changes (created, updated, deleted via undo/redo) */
  readonly lookBoardDataChanged: LookBoardDataChangedPayload;
  /** Real-time updates when look data changes (created, updated, deleted via undo/redo) */
  readonly lookDataChanged: LookDataChangedPayload;
  /** Real-time updates during OFL import */
  readonly oflImportProgress: OflImportStatus;
  /** Real-time updates when operation history changes (after undo/redo or new operations) */
  readonly operationHistoryChanged: UndoRedoStatus;
  readonly previewSessionUpdated: PreviewSession;
  readonly projectUpdated: Project;
  readonly systemInfoUpdated: SystemInfo;
  readonly wifiModeChanged: WiFiMode;
  readonly wifiStatusUpdated: WiFiStatus;
};


export type SubscriptionCueListDataChangedArgs = {
  cueListId: Scalars['ID']['input'];
};


export type SubscriptionCueListPlaybackUpdatedArgs = {
  cueListId: Scalars['ID']['input'];
};


export type SubscriptionDmxOutputChangedArgs = {
  universe?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionFixtureDataChangedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionLookBoardDataChangedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionLookDataChangedArgs = {
  projectId: Scalars['ID']['input'];
};


export type SubscriptionOperationHistoryChangedArgs = {
  projectId: Scalars['ID']['input'];
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
  readonly fadeUpdateRateHz: Scalars['Int']['output'];
};

export type SystemVersionInfo = {
  readonly __typename?: 'SystemVersionInfo';
  readonly lastChecked: Scalars['String']['output'];
  readonly repositories: ReadonlyArray<RepositoryVersion>;
  readonly versionManagementSupported: Scalars['Boolean']['output'];
};

/**
 * How an effect behaves when a cue change occurs.
 * FADE_OUT - Effect fades out when cue changes
 * PERSIST - Effect persists across cue changes
 * SNAP_OFF - Effect immediately stops when cue changes
 * CROSSFADE_PARAMS - Effect parameters crossfade to new values
 */
export enum TransitionBehavior {
  CrossfadeParams = 'CROSSFADE_PARAMS',
  FadeOut = 'FADE_OUT',
  Persist = 'PERSIST',
  SnapOff = 'SNAP_OFF'
}

/** Type of entity being operated on. */
export enum UndoEntityType {
  Cue = 'Cue',
  CueList = 'CueList',
  CuePlayback = 'CuePlayback',
  Effect = 'Effect',
  FixtureInstance = 'FixtureInstance',
  Look = 'Look',
  LookBoard = 'LookBoard',
  LookBoardButton = 'LookBoardButton',
  Project = 'Project'
}

/** Result of an undo or redo operation. */
export type UndoRedoResult = {
  readonly __typename?: 'UndoRedoResult';
  readonly message?: Maybe<Scalars['String']['output']>;
  readonly operation?: Maybe<Operation>;
  /** ID of the entity that was restored */
  readonly restoredEntityId?: Maybe<Scalars['ID']['output']>;
  readonly success: Scalars['Boolean']['output'];
};

/** Current status of undo/redo for a project. */
export type UndoRedoStatus = {
  readonly __typename?: 'UndoRedoStatus';
  readonly canRedo: Scalars['Boolean']['output'];
  readonly canUndo: Scalars['Boolean']['output'];
  readonly currentSequence: Scalars['Int']['output'];
  readonly projectId: Scalars['ID']['output'];
  /** Description of what would be redone */
  readonly redoDescription?: Maybe<Scalars['String']['output']>;
  readonly totalOperations: Scalars['Int']['output'];
  /** Description of what would be undone */
  readonly undoDescription?: Maybe<Scalars['String']['output']>;
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

export type UpdateAuthSettingsInput = {
  readonly allowedMethods?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
  readonly authEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  readonly deviceAuthEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  readonly passwordMinLength?: InputMaybe<Scalars['Int']['input']>;
  readonly requireEmailVerification?: InputMaybe<Scalars['Boolean']['input']>;
  readonly sessionDurationHours?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateDeviceInput = {
  readonly defaultRole?: InputMaybe<DeviceRole>;
  readonly defaultUserId?: InputMaybe<Scalars['ID']['input']>;
  readonly isAuthorized?: InputMaybe<Scalars['Boolean']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly permissions?: InputMaybe<DevicePermissions>;
};

/** Input for updating an effect fixture's settings. */
export type UpdateEffectFixtureInput = {
  /** Amplitude scale for this fixture (0-200%). */
  readonly amplitudeScale?: InputMaybe<Scalars['Float']['input']>;
  /** Order for auto-phase distribution. */
  readonly effectOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Phase offset override for this fixture (degrees). */
  readonly phaseOffset?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateEffectInput = {
  readonly amplitude?: InputMaybe<Scalars['Float']['input']>;
  readonly compositionMode?: InputMaybe<CompositionMode>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly effectType?: InputMaybe<EffectType>;
  readonly fadeDuration?: InputMaybe<Scalars['Float']['input']>;
  readonly frequency?: InputMaybe<Scalars['Float']['input']>;
  readonly masterValue?: InputMaybe<Scalars['Float']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly offset?: InputMaybe<Scalars['Float']['input']>;
  readonly onCueChange?: InputMaybe<TransitionBehavior>;
  readonly phaseOffset?: InputMaybe<Scalars['Float']['input']>;
  readonly priorityBand?: InputMaybe<PriorityBand>;
  readonly prioritySub?: InputMaybe<Scalars['Int']['input']>;
  readonly waveform?: InputMaybe<WaveformType>;
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

export type UpdateLookBoardButtonInput = {
  readonly color?: InputMaybe<Scalars['String']['input']>;
  readonly height?: InputMaybe<Scalars['Int']['input']>;
  readonly label?: InputMaybe<Scalars['String']['input']>;
  readonly layoutX?: InputMaybe<Scalars['Int']['input']>;
  readonly layoutY?: InputMaybe<Scalars['Int']['input']>;
  readonly width?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateLookBoardInput = {
  readonly canvasHeight?: InputMaybe<Scalars['Int']['input']>;
  readonly canvasWidth?: InputMaybe<Scalars['Int']['input']>;
  readonly defaultFadeTime?: InputMaybe<Scalars['Float']['input']>;
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly gridSize?: InputMaybe<Scalars['Int']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLookInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly fixtureValues?: InputMaybe<ReadonlyArray<FixtureValueInput>>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
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

export type UpdateSettingInput = {
  readonly key: Scalars['String']['input'];
  readonly value: Scalars['String']['input'];
};

export type UpdateUserGroupInput = {
  readonly description?: InputMaybe<Scalars['String']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly permissions?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>;
};

export type UpdateUserInput = {
  readonly email?: InputMaybe<Scalars['String']['input']>;
  readonly isActive?: InputMaybe<Scalars['Boolean']['input']>;
  readonly name?: InputMaybe<Scalars['String']['input']>;
  readonly phone?: InputMaybe<Scalars['String']['input']>;
  readonly role?: InputMaybe<UserRole>;
};

export type User = {
  readonly __typename?: 'User';
  readonly createdAt: Scalars['String']['output'];
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name?: Maybe<Scalars['String']['output']>;
  readonly role: UserRole;
};

/** User group for permission management and multi-tenant project ownership. */
export type UserGroup = {
  readonly __typename?: 'UserGroup';
  readonly createdAt: Scalars['String']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Devices assigned to this group */
  readonly devices: ReadonlyArray<Device>;
  readonly id: Scalars['ID']['output'];
  /** Whether this is a personal group auto-created for a user */
  readonly isPersonal: Scalars['Boolean']['output'];
  /** Number of members in this group */
  readonly memberCount: Scalars['Int']['output'];
  /** Members of this group */
  readonly members: ReadonlyArray<GroupMember>;
  readonly name: Scalars['String']['output'];
  /** JSON array of permission strings */
  readonly permissions: ReadonlyArray<Scalars['String']['output']>;
  /** Projects owned by this group */
  readonly projects: ReadonlyArray<Project>;
  readonly updatedAt: Scalars['String']['output'];
};

export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER'
}

/** Type of verification token. */
export enum VerificationTokenType {
  EmailVerify = 'EMAIL_VERIFY',
  PasswordReset = 'PASSWORD_RESET',
  PhoneVerify = 'PHONE_VERIFY'
}

/** Waveform type for LFO-based effects. */
export enum WaveformType {
  Cosine = 'COSINE',
  Random = 'RANDOM',
  Sawtooth = 'SAWTOOTH',
  Sine = 'SINE',
  Square = 'SQUARE',
  Triangle = 'TRIANGLE'
}

export type WiFiConnectionResult = {
  readonly __typename?: 'WiFiConnectionResult';
  readonly connected: Scalars['Boolean']['output'];
  readonly message?: Maybe<Scalars['String']['output']>;
  readonly success: Scalars['Boolean']['output'];
};

export enum WiFiMode {
  Ap = 'AP',
  Client = 'CLIENT',
  Connecting = 'CONNECTING',
  Disabled = 'DISABLED',
  StartingAp = 'STARTING_AP'
}

export type WiFiModeResult = {
  readonly __typename?: 'WiFiModeResult';
  readonly message?: Maybe<Scalars['String']['output']>;
  readonly mode: WiFiMode;
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
  readonly apConfig?: Maybe<ApConfig>;
  readonly available: Scalars['Boolean']['output'];
  readonly connected: Scalars['Boolean']['output'];
  readonly connectedClients?: Maybe<ReadonlyArray<ApClient>>;
  readonly enabled: Scalars['Boolean']['output'];
  readonly frequency?: Maybe<Scalars['String']['output']>;
  readonly ipAddress?: Maybe<Scalars['String']['output']>;
  readonly macAddress?: Maybe<Scalars['String']['output']>;
  readonly mode: WiFiMode;
  readonly signalStrength?: Maybe<Scalars['Int']['output']>;
  readonly ssid?: Maybe<Scalars['String']['output']>;
};

export type TestConnectionQueryVariables = Exact<{ [key: string]: never; }>;


export type TestConnectionQuery = { readonly __typename: 'Query' };

export type AuthUserFieldsFragment = { readonly __typename?: 'AuthUser', readonly id: string, readonly email: string, readonly name?: string | null, readonly phone?: string | null, readonly role: UserRole, readonly emailVerified: boolean, readonly phoneVerified: boolean, readonly isActive: boolean, readonly lastLoginAt?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly permissions: ReadonlyArray<string>, readonly groups: ReadonlyArray<{ readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly permissions: ReadonlyArray<string> }> };

export type UserFieldsFragment = { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string };

export type SessionFieldsFragment = { readonly __typename?: 'Session', readonly id: string, readonly userId: string, readonly deviceId?: string | null, readonly ipAddress?: string | null, readonly userAgent?: string | null, readonly expiresAt: string, readonly lastActivityAt: string, readonly createdAt: string };

export type DeviceFieldsFragment = { readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null };

export type UserGroupFieldsFragment = { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly description?: string | null, readonly permissions: ReadonlyArray<string>, readonly memberCount: number, readonly isPersonal: boolean, readonly createdAt: string, readonly updatedAt: string };

export type GroupMemberFieldsFragment = { readonly __typename?: 'GroupMember', readonly id: string, readonly role: GroupMemberRole, readonly joinedAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole } };

export type GroupInvitationFieldsFragment = { readonly __typename?: 'GroupInvitation', readonly id: string, readonly email: string, readonly role: GroupMemberRole, readonly status: InvitationStatus, readonly expiresAt: string, readonly createdAt: string, readonly group: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean }, readonly invitedBy: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } };

export type AuthSettingsFieldsFragment = { readonly __typename?: 'AuthSettings', readonly authEnabled: boolean, readonly allowedMethods: ReadonlyArray<string>, readonly deviceAuthEnabled: boolean, readonly sessionDurationHours: number, readonly passwordMinLength: number, readonly requireEmailVerification: boolean };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { readonly __typename?: 'Query', readonly me?: { readonly __typename?: 'AuthUser', readonly id: string, readonly email: string, readonly name?: string | null, readonly phone?: string | null, readonly role: UserRole, readonly emailVerified: boolean, readonly phoneVerified: boolean, readonly isActive: boolean, readonly lastLoginAt?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly permissions: ReadonlyArray<string>, readonly groups: ReadonlyArray<{ readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly permissions: ReadonlyArray<string> }> } | null };

export type GetAuthEnabledQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthEnabledQuery = { readonly __typename?: 'Query', readonly authEnabled: boolean };

export type GetAuthSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthSettingsQuery = { readonly __typename?: 'Query', readonly authSettings: { readonly __typename?: 'AuthSettings', readonly authEnabled: boolean, readonly allowedMethods: ReadonlyArray<string>, readonly deviceAuthEnabled: boolean, readonly sessionDurationHours: number, readonly passwordMinLength: number, readonly requireEmailVerification: boolean } };

export type GetMySessionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMySessionsQuery = { readonly __typename?: 'Query', readonly mySessions: ReadonlyArray<{ readonly __typename?: 'Session', readonly id: string, readonly userId: string, readonly deviceId?: string | null, readonly ipAddress?: string | null, readonly userAgent?: string | null, readonly expiresAt: string, readonly lastActivityAt: string, readonly createdAt: string }> };

export type CheckDeviceAuthorizationQueryVariables = Exact<{
  fingerprint: Scalars['String']['input'];
}>;


export type CheckDeviceAuthorizationQuery = { readonly __typename?: 'Query', readonly checkDeviceAuthorization: { readonly __typename?: 'DeviceAuthStatus', readonly isAuthorized: boolean, readonly isPending: boolean, readonly device?: { readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null } | null, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } | null } };

export type GetUsersQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { readonly __typename?: 'Query', readonly users: ReadonlyArray<{ readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string }> };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { readonly __typename?: 'Query', readonly user?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } | null };

export type GetUserGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserGroupsQuery = { readonly __typename?: 'Query', readonly userGroups: ReadonlyArray<{ readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly description?: string | null, readonly permissions: ReadonlyArray<string>, readonly memberCount: number, readonly isPersonal: boolean, readonly createdAt: string, readonly updatedAt: string }> };

export type GetUserGroupQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserGroupQuery = { readonly __typename?: 'Query', readonly userGroup?: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly description?: string | null, readonly permissions: ReadonlyArray<string>, readonly memberCount: number, readonly isPersonal: boolean, readonly createdAt: string, readonly updatedAt: string } | null };

export type GetDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDevicesQuery = { readonly __typename?: 'Query', readonly devices: ReadonlyArray<{ readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null }> };

export type GetDeviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetDeviceQuery = { readonly __typename?: 'Query', readonly device?: { readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null } | null };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { readonly __typename?: 'Mutation', readonly register: { readonly __typename?: 'AuthPayload', readonly accessToken: string, readonly refreshToken: string, readonly expiresAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } } };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { readonly __typename?: 'Mutation', readonly login: { readonly __typename?: 'AuthPayload', readonly accessToken: string, readonly refreshToken: string, readonly expiresAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { readonly __typename?: 'Mutation', readonly logout: boolean };

export type LogoutAllMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutAllMutation = { readonly __typename?: 'Mutation', readonly logoutAll: boolean };

export type RefreshTokenMutationVariables = Exact<{
  refreshToken: Scalars['String']['input'];
}>;


export type RefreshTokenMutation = { readonly __typename?: 'Mutation', readonly refreshToken: { readonly __typename?: 'AuthPayload', readonly accessToken: string, readonly refreshToken: string, readonly expiresAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } } };

export type ChangePasswordMutationVariables = Exact<{
  oldPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ChangePasswordMutation = { readonly __typename?: 'Mutation', readonly changePassword: boolean };

export type RequestPasswordResetMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestPasswordResetMutation = { readonly __typename?: 'Mutation', readonly requestPasswordReset: boolean };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { readonly __typename?: 'Mutation', readonly resetPassword: boolean };

export type RequestEmailVerificationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestEmailVerificationMutation = { readonly __typename?: 'Mutation', readonly requestEmailVerification: boolean };

export type VerifyEmailMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type VerifyEmailMutation = { readonly __typename?: 'Mutation', readonly verifyEmail: boolean };

export type AppleSignInMutationVariables = Exact<{
  identityToken: Scalars['String']['input'];
  authorizationCode: Scalars['String']['input'];
}>;


export type AppleSignInMutation = { readonly __typename?: 'Mutation', readonly appleSignIn: { readonly __typename?: 'AuthPayload', readonly accessToken: string, readonly refreshToken: string, readonly expiresAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } } };

export type RegisterDeviceMutationVariables = Exact<{
  fingerprint: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type RegisterDeviceMutation = { readonly __typename?: 'Mutation', readonly registerDevice: { readonly __typename?: 'DeviceRegistrationResult', readonly success: boolean, readonly message: string, readonly device?: { readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null } | null } };

export type AuthorizeDeviceMutationVariables = Exact<{
  fingerprint: Scalars['String']['input'];
  authorizationCode: Scalars['String']['input'];
}>;


export type AuthorizeDeviceMutation = { readonly __typename?: 'Mutation', readonly authorizeDevice: { readonly __typename?: 'AuthPayload', readonly accessToken: string, readonly refreshToken: string, readonly expiresAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { readonly __typename?: 'Mutation', readonly createUser: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { readonly __typename?: 'Mutation', readonly updateUser: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole, readonly createdAt: string } };

export type DeleteUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteUserMutation = { readonly __typename?: 'Mutation', readonly deleteUser: boolean };

export type CreateUserGroupMutationVariables = Exact<{
  input: CreateUserGroupInput;
}>;


export type CreateUserGroupMutation = { readonly __typename?: 'Mutation', readonly createUserGroup: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly description?: string | null, readonly permissions: ReadonlyArray<string>, readonly memberCount: number, readonly isPersonal: boolean, readonly createdAt: string, readonly updatedAt: string } };

export type UpdateUserGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserGroupInput;
}>;


export type UpdateUserGroupMutation = { readonly __typename?: 'Mutation', readonly updateUserGroup: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly description?: string | null, readonly permissions: ReadonlyArray<string>, readonly memberCount: number, readonly isPersonal: boolean, readonly createdAt: string, readonly updatedAt: string } };

export type DeleteUserGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteUserGroupMutation = { readonly __typename?: 'Mutation', readonly deleteUserGroup: boolean };

export type AddUserToGroupMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
  role?: InputMaybe<GroupMemberRole>;
}>;


export type AddUserToGroupMutation = { readonly __typename?: 'Mutation', readonly addUserToGroup: boolean };

export type RemoveUserFromGroupMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
}>;


export type RemoveUserFromGroupMutation = { readonly __typename?: 'Mutation', readonly removeUserFromGroup: boolean };

export type UpdateGroupMemberRoleMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
  role: GroupMemberRole;
}>;


export type UpdateGroupMemberRoleMutation = { readonly __typename?: 'Mutation', readonly updateGroupMemberRole: boolean };

export type CreateDeviceAuthCodeMutationVariables = Exact<{
  deviceId: Scalars['ID']['input'];
}>;


export type CreateDeviceAuthCodeMutation = { readonly __typename?: 'Mutation', readonly createDeviceAuthCode: { readonly __typename?: 'DeviceAuthCode', readonly code: string, readonly expiresAt: string, readonly deviceId: string } };

export type UpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type UpdateDeviceMutation = { readonly __typename?: 'Mutation', readonly updateDevice: { readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null } };

export type RevokeDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RevokeDeviceMutation = { readonly __typename?: 'Mutation', readonly revokeDevice: { readonly __typename?: 'Device', readonly id: string, readonly name: string, readonly fingerprint: string, readonly isAuthorized: boolean, readonly defaultRole: DeviceRole, readonly lastSeenAt?: string | null, readonly lastIPAddress?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly defaultUser?: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } | null } };

export type RevokeSessionMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
}>;


export type RevokeSessionMutation = { readonly __typename?: 'Mutation', readonly revokeSession: boolean };

export type RevokeAllUserSessionsMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type RevokeAllUserSessionsMutation = { readonly __typename?: 'Mutation', readonly revokeAllUserSessions: boolean };

export type UpdateAuthSettingsMutationVariables = Exact<{
  input: UpdateAuthSettingsInput;
}>;


export type UpdateAuthSettingsMutation = { readonly __typename?: 'Mutation', readonly updateAuthSettings: { readonly __typename?: 'AuthSettings', readonly authEnabled: boolean, readonly allowedMethods: ReadonlyArray<string>, readonly deviceAuthEnabled: boolean, readonly sessionDurationHours: number, readonly passwordMinLength: number, readonly requireEmailVerification: boolean } };

export type GetMyGroupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyGroupsQuery = { readonly __typename?: 'Query', readonly myGroups: ReadonlyArray<{ readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly description?: string | null, readonly permissions: ReadonlyArray<string>, readonly memberCount: number, readonly isPersonal: boolean, readonly createdAt: string, readonly updatedAt: string, readonly members: ReadonlyArray<{ readonly __typename?: 'GroupMember', readonly id: string, readonly role: GroupMemberRole, readonly joinedAt: string, readonly user: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null, readonly role: UserRole } }> }> };

export type GetMyInvitationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyInvitationsQuery = { readonly __typename?: 'Query', readonly myInvitations: ReadonlyArray<{ readonly __typename?: 'GroupInvitation', readonly id: string, readonly email: string, readonly role: GroupMemberRole, readonly status: InvitationStatus, readonly expiresAt: string, readonly createdAt: string, readonly group: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean }, readonly invitedBy: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } }> };

export type GetGroupInvitationsQueryVariables = Exact<{
  groupId: Scalars['ID']['input'];
}>;


export type GetGroupInvitationsQuery = { readonly __typename?: 'Query', readonly groupInvitations: ReadonlyArray<{ readonly __typename?: 'GroupInvitation', readonly id: string, readonly email: string, readonly role: GroupMemberRole, readonly status: InvitationStatus, readonly expiresAt: string, readonly createdAt: string, readonly group: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean }, readonly invitedBy: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } }> };

export type InviteToGroupMutationVariables = Exact<{
  groupId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
  role?: InputMaybe<GroupMemberRole>;
}>;


export type InviteToGroupMutation = { readonly __typename?: 'Mutation', readonly inviteToGroup: { readonly __typename?: 'GroupInvitation', readonly id: string, readonly email: string, readonly role: GroupMemberRole, readonly status: InvitationStatus, readonly expiresAt: string, readonly createdAt: string, readonly group: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean }, readonly invitedBy: { readonly __typename?: 'User', readonly id: string, readonly email: string, readonly name?: string | null } } };

export type AcceptInvitationMutationVariables = Exact<{
  invitationId: Scalars['ID']['input'];
}>;


export type AcceptInvitationMutation = { readonly __typename?: 'Mutation', readonly acceptInvitation: boolean };

export type DeclineInvitationMutationVariables = Exact<{
  invitationId: Scalars['ID']['input'];
}>;


export type DeclineInvitationMutation = { readonly __typename?: 'Mutation', readonly declineInvitation: boolean };

export type CancelInvitationMutationVariables = Exact<{
  invitationId: Scalars['ID']['input'];
}>;


export type CancelInvitationMutation = { readonly __typename?: 'Mutation', readonly cancelInvitation: boolean };

export type GetProjectCueListsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectCueListsQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly cueLists: ReadonlyArray<{ readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly description?: string | null, readonly loop: boolean, readonly createdAt: string, readonly updatedAt: string, readonly cues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly skip: boolean, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string }, readonly effects: ReadonlyArray<{ readonly __typename?: 'CueEffect', readonly id: string, readonly effectId: string, readonly intensity: number, readonly speed: number, readonly effect?: { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly effectType: EffectType, readonly waveform?: WaveformType | null } | null }> }> }> } | null };

export type GetCueListQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCueListQuery = { readonly __typename?: 'Query', readonly cueList?: { readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly description?: string | null, readonly loop: boolean, readonly createdAt: string, readonly updatedAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly cues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly skip: boolean, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null }, readonly effects: ReadonlyArray<{ readonly __typename?: 'CueEffect', readonly id: string, readonly effectId: string, readonly intensity: number, readonly speed: number, readonly effect?: { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly effectType: EffectType, readonly waveform?: WaveformType | null } | null }> }> } | null };

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


export type CreateCueMutation = { readonly __typename?: 'Mutation', readonly createCue: { readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly skip: boolean, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string } } };

export type UpdateCueMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CreateCueInput;
}>;


export type UpdateCueMutation = { readonly __typename?: 'Mutation', readonly updateCue: { readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly skip: boolean, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string } } };

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


export type BulkUpdateCuesMutation = { readonly __typename?: 'Mutation', readonly bulkUpdateCues: ReadonlyArray<{ readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly skip: boolean, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string } }> };

export type ToggleCueSkipMutationVariables = Exact<{
  cueId: Scalars['ID']['input'];
}>;


export type ToggleCueSkipMutation = { readonly __typename?: 'Mutation', readonly toggleCueSkip: { readonly __typename?: 'Cue', readonly id: string, readonly name: string, readonly cueNumber: number, readonly fadeInTime: number, readonly fadeOutTime: number, readonly followTime?: number | null, readonly notes?: string | null, readonly easingType?: EasingType | null, readonly skip: boolean, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string } } };

export type GetCueListPlaybackStatusQueryVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type GetCueListPlaybackStatusQuery = { readonly __typename?: 'Query', readonly cueListPlaybackStatus?: { readonly __typename?: 'CueListPlaybackStatus', readonly cueListId: string, readonly currentCueIndex?: number | null, readonly isPlaying: boolean, readonly isPaused: boolean, readonly isFading: boolean, readonly fadeProgress?: number | null, readonly lastUpdated: string } | null };

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


export type CueListPlaybackUpdatedSubscription = { readonly __typename?: 'Subscription', readonly cueListPlaybackUpdated: { readonly __typename?: 'CueListPlaybackStatus', readonly cueListId: string, readonly currentCueIndex?: number | null, readonly isPlaying: boolean, readonly isPaused: boolean, readonly isFading: boolean, readonly fadeProgress?: number | null, readonly lastUpdated: string } };

export type GetGlobalPlaybackStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGlobalPlaybackStatusQuery = { readonly __typename?: 'Query', readonly globalPlaybackStatus: { readonly __typename?: 'GlobalPlaybackStatus', readonly isPlaying: boolean, readonly isPaused: boolean, readonly isFading: boolean, readonly cueListId?: string | null, readonly cueListName?: string | null, readonly currentCueIndex?: number | null, readonly cueCount?: number | null, readonly currentCueName?: string | null, readonly fadeProgress?: number | null, readonly lastUpdated: string } };

export type GlobalPlaybackStatusUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GlobalPlaybackStatusUpdatedSubscription = { readonly __typename?: 'Subscription', readonly globalPlaybackStatusUpdated: { readonly __typename?: 'GlobalPlaybackStatus', readonly isPlaying: boolean, readonly isPaused: boolean, readonly isFading: boolean, readonly cueListId?: string | null, readonly cueListName?: string | null, readonly currentCueIndex?: number | null, readonly cueCount?: number | null, readonly currentCueName?: string | null, readonly fadeProgress?: number | null, readonly lastUpdated: string } };

export type ResumeCueListMutationVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type ResumeCueListMutation = { readonly __typename?: 'Mutation', readonly resumeCueList: boolean };

export type CueListDataChangedSubscriptionVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type CueListDataChangedSubscription = { readonly __typename?: 'Subscription', readonly cueListDataChanged: { readonly __typename?: 'CueListDataChangedPayload', readonly cueListId: string, readonly changeType: CueListDataChangeType, readonly affectedCueIds?: ReadonlyArray<string> | null, readonly affectedLookId?: string | null, readonly newLookName?: string | null, readonly timestamp: string } };

export type GetCuesWithLookInfoQueryVariables = Exact<{
  cueListId: Scalars['ID']['input'];
}>;


export type GetCuesWithLookInfoQuery = { readonly __typename?: 'Query', readonly cuesWithLookInfo: { readonly __typename?: 'CuesWithLookInfoResponse', readonly cues: ReadonlyArray<{ readonly __typename?: 'CueWithLookInfo', readonly cueId: string, readonly cueNumber: number, readonly cueName: string, readonly lookId: string, readonly lookName: string, readonly otherCueNumbers: ReadonlyArray<number> }>, readonly orphanLooks: ReadonlyArray<{ readonly __typename?: 'LookSummary', readonly id: string, readonly name: string, readonly description?: string | null }> } };

export type EffectFixtureFieldsFragment = { readonly __typename?: 'EffectFixture', readonly id: string, readonly effectId: string, readonly fixtureId: string, readonly phaseOffset?: number | null, readonly amplitudeScale?: number | null, readonly effectOrder?: number | null, readonly fixture?: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null }> };

export type EffectFieldsFragment = { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly description?: string | null, readonly projectId: string, readonly effectType: EffectType, readonly priorityBand: PriorityBand, readonly prioritySub: number, readonly compositionMode: CompositionMode, readonly onCueChange: TransitionBehavior, readonly fadeDuration?: number | null, readonly waveform?: WaveformType | null, readonly frequency: number, readonly amplitude: number, readonly offset: number, readonly phaseOffset: number, readonly masterValue?: number | null, readonly createdAt: string, readonly updatedAt: string };

export type EffectWithFixturesFieldsFragment = { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly description?: string | null, readonly projectId: string, readonly effectType: EffectType, readonly priorityBand: PriorityBand, readonly prioritySub: number, readonly compositionMode: CompositionMode, readonly onCueChange: TransitionBehavior, readonly fadeDuration?: number | null, readonly waveform?: WaveformType | null, readonly frequency: number, readonly amplitude: number, readonly offset: number, readonly phaseOffset: number, readonly masterValue?: number | null, readonly createdAt: string, readonly updatedAt: string, readonly fixtures: ReadonlyArray<{ readonly __typename?: 'EffectFixture', readonly id: string, readonly effectId: string, readonly fixtureId: string, readonly phaseOffset?: number | null, readonly amplitudeScale?: number | null, readonly effectOrder?: number | null, readonly fixture?: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null }> }> };

export type GetEffectsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetEffectsQuery = { readonly __typename?: 'Query', readonly effects: ReadonlyArray<{ readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly description?: string | null, readonly projectId: string, readonly effectType: EffectType, readonly priorityBand: PriorityBand, readonly prioritySub: number, readonly compositionMode: CompositionMode, readonly onCueChange: TransitionBehavior, readonly fadeDuration?: number | null, readonly waveform?: WaveformType | null, readonly frequency: number, readonly amplitude: number, readonly offset: number, readonly phaseOffset: number, readonly masterValue?: number | null, readonly createdAt: string, readonly updatedAt: string }> };

export type GetEffectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetEffectQuery = { readonly __typename?: 'Query', readonly effect?: { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly description?: string | null, readonly projectId: string, readonly effectType: EffectType, readonly priorityBand: PriorityBand, readonly prioritySub: number, readonly compositionMode: CompositionMode, readonly onCueChange: TransitionBehavior, readonly fadeDuration?: number | null, readonly waveform?: WaveformType | null, readonly frequency: number, readonly amplitude: number, readonly offset: number, readonly phaseOffset: number, readonly masterValue?: number | null, readonly createdAt: string, readonly updatedAt: string, readonly fixtures: ReadonlyArray<{ readonly __typename?: 'EffectFixture', readonly id: string, readonly effectId: string, readonly fixtureId: string, readonly phaseOffset?: number | null, readonly amplitudeScale?: number | null, readonly effectOrder?: number | null, readonly fixture?: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null }> }> } | null };

export type GetModulatorStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetModulatorStatusQuery = { readonly __typename?: 'Query', readonly modulatorStatus: { readonly __typename?: 'ModulatorStatus', readonly isRunning: boolean, readonly updateRateHz: number, readonly activeEffectCount: number, readonly isBlackoutActive: boolean, readonly blackoutIntensity: number, readonly grandMasterValue: number, readonly hasActiveTransition: boolean, readonly transitionProgress: number, readonly activeEffects: ReadonlyArray<{ readonly __typename?: 'ActiveEffectStatus', readonly effectId: string, readonly effectName: string, readonly effectType: EffectType, readonly intensity: number, readonly phase: number, readonly isComplete: boolean, readonly startTime: string }> } };

export type CreateEffectMutationVariables = Exact<{
  input: CreateEffectInput;
}>;


export type CreateEffectMutation = { readonly __typename?: 'Mutation', readonly createEffect: { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly description?: string | null, readonly projectId: string, readonly effectType: EffectType, readonly priorityBand: PriorityBand, readonly prioritySub: number, readonly compositionMode: CompositionMode, readonly onCueChange: TransitionBehavior, readonly fadeDuration?: number | null, readonly waveform?: WaveformType | null, readonly frequency: number, readonly amplitude: number, readonly offset: number, readonly phaseOffset: number, readonly masterValue?: number | null, readonly createdAt: string, readonly updatedAt: string } };

export type UpdateEffectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEffectInput;
}>;


export type UpdateEffectMutation = { readonly __typename?: 'Mutation', readonly updateEffect: { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly description?: string | null, readonly projectId: string, readonly effectType: EffectType, readonly priorityBand: PriorityBand, readonly prioritySub: number, readonly compositionMode: CompositionMode, readonly onCueChange: TransitionBehavior, readonly fadeDuration?: number | null, readonly waveform?: WaveformType | null, readonly frequency: number, readonly amplitude: number, readonly offset: number, readonly phaseOffset: number, readonly masterValue?: number | null, readonly createdAt: string, readonly updatedAt: string } };

export type DeleteEffectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteEffectMutation = { readonly __typename?: 'Mutation', readonly deleteEffect: boolean };

export type AddFixtureToEffectMutationVariables = Exact<{
  input: AddFixtureToEffectInput;
}>;


export type AddFixtureToEffectMutation = { readonly __typename?: 'Mutation', readonly addFixtureToEffect: { readonly __typename?: 'EffectFixture', readonly id: string, readonly effectId: string, readonly fixtureId: string, readonly phaseOffset?: number | null, readonly amplitudeScale?: number | null, readonly effectOrder?: number | null, readonly fixture?: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null }> } };

export type RemoveFixtureFromEffectMutationVariables = Exact<{
  effectId: Scalars['ID']['input'];
  fixtureId: Scalars['ID']['input'];
}>;


export type RemoveFixtureFromEffectMutation = { readonly __typename?: 'Mutation', readonly removeFixtureFromEffect: boolean };

export type UpdateEffectFixtureMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEffectFixtureInput;
}>;


export type UpdateEffectFixtureMutation = { readonly __typename?: 'Mutation', readonly updateEffectFixture: { readonly __typename?: 'EffectFixture', readonly id: string, readonly effectId: string, readonly fixtureId: string, readonly phaseOffset?: number | null, readonly amplitudeScale?: number | null, readonly effectOrder?: number | null, readonly fixture?: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> } | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null }> } };

export type EffectChannelFieldsFragment = { readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null };

export type AddChannelToEffectFixtureMutationVariables = Exact<{
  effectFixtureId: Scalars['ID']['input'];
  input: EffectChannelInput;
}>;


export type AddChannelToEffectFixtureMutation = { readonly __typename?: 'Mutation', readonly addChannelToEffectFixture: { readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null } };

export type UpdateEffectChannelMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: EffectChannelInput;
}>;


export type UpdateEffectChannelMutation = { readonly __typename?: 'Mutation', readonly updateEffectChannel: { readonly __typename?: 'EffectChannel', readonly id: string, readonly effectFixtureId: string, readonly channelOffset?: number | null, readonly channelType?: string | null, readonly amplitudeScale?: number | null, readonly frequencyScale?: number | null, readonly minValue?: number | null, readonly maxValue?: number | null } };

export type RemoveChannelFromEffectFixtureMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveChannelFromEffectFixtureMutation = { readonly __typename?: 'Mutation', readonly removeChannelFromEffectFixture: boolean };

export type AddEffectToCueMutationVariables = Exact<{
  input: AddEffectToCueInput;
}>;


export type AddEffectToCueMutation = { readonly __typename?: 'Mutation', readonly addEffectToCue: { readonly __typename?: 'CueEffect', readonly id: string, readonly cueId: string, readonly effectId: string, readonly intensity: number, readonly speed: number, readonly onCueChange?: TransitionBehavior | null, readonly effect?: { readonly __typename?: 'Effect', readonly id: string, readonly name: string, readonly effectType: EffectType, readonly waveform?: WaveformType | null, readonly frequency: number } | null } };

export type RemoveEffectFromCueMutationVariables = Exact<{
  cueId: Scalars['ID']['input'];
  effectId: Scalars['ID']['input'];
}>;


export type RemoveEffectFromCueMutation = { readonly __typename?: 'Mutation', readonly removeEffectFromCue: boolean };

export type ActivateEffectMutationVariables = Exact<{
  effectId: Scalars['ID']['input'];
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ActivateEffectMutation = { readonly __typename?: 'Mutation', readonly activateEffect: boolean };

export type StopEffectMutationVariables = Exact<{
  effectId: Scalars['ID']['input'];
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type StopEffectMutation = { readonly __typename?: 'Mutation', readonly stopEffect: boolean };

export type ActivateBlackoutMutationVariables = Exact<{
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ActivateBlackoutMutation = { readonly __typename?: 'Mutation', readonly activateBlackout: boolean };

export type ReleaseBlackoutMutationVariables = Exact<{
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ReleaseBlackoutMutation = { readonly __typename?: 'Mutation', readonly releaseBlackout: boolean };

export type SetGrandMasterMutationVariables = Exact<{
  value: Scalars['Float']['input'];
}>;


export type SetGrandMasterMutation = { readonly __typename?: 'Mutation', readonly setGrandMaster: boolean };

export type LookDataChangedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type LookDataChangedSubscription = { readonly __typename?: 'Subscription', readonly lookDataChanged: { readonly __typename?: 'LookDataChangedPayload', readonly lookId: string, readonly projectId: string, readonly changeType: EntityDataChangeType, readonly timestamp: string } };

export type LookBoardDataChangedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type LookBoardDataChangedSubscription = { readonly __typename?: 'Subscription', readonly lookBoardDataChanged: { readonly __typename?: 'LookBoardDataChangedPayload', readonly lookBoardId: string, readonly projectId: string, readonly changeType: EntityDataChangeType, readonly affectedButtonIds?: ReadonlyArray<string> | null, readonly timestamp: string } };

export type FixtureDataChangedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type FixtureDataChangedSubscription = { readonly __typename?: 'Subscription', readonly fixtureDataChanged: { readonly __typename?: 'FixtureDataChangedPayload', readonly fixtureIds: ReadonlyArray<string>, readonly projectId: string, readonly changeType: EntityDataChangeType, readonly timestamp: string } };

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

export type ReorderLookFixturesMutationVariables = Exact<{
  lookId: Scalars['ID']['input'];
  fixtureOrders: ReadonlyArray<FixtureOrderInput> | FixtureOrderInput;
}>;


export type ReorderLookFixturesMutation = { readonly __typename?: 'Mutation', readonly reorderLookFixtures: boolean };

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

export type GetProjectLookBoardsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectLookBoardsQuery = { readonly __typename?: 'Query', readonly lookBoards: ReadonlyArray<{ readonly __typename?: 'LookBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly createdAt: string, readonly updatedAt: string, readonly buttons: ReadonlyArray<{ readonly __typename?: 'LookBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null } }> }> };

export type GetLookBoardQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetLookBoardQuery = { readonly __typename?: 'Query', readonly lookBoard?: { readonly __typename?: 'LookBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly createdAt: string, readonly updatedAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string }, readonly buttons: ReadonlyArray<{ readonly __typename?: 'LookBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null, readonly createdAt: string, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null } }> } | null };

export type CreateLookBoardMutationVariables = Exact<{
  input: CreateLookBoardInput;
}>;


export type CreateLookBoardMutation = { readonly __typename?: 'Mutation', readonly createLookBoard: { readonly __typename?: 'LookBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly createdAt: string, readonly buttons: ReadonlyArray<{ readonly __typename?: 'LookBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string } }> } };

export type UpdateLookBoardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateLookBoardInput;
}>;


export type UpdateLookBoardMutation = { readonly __typename?: 'Mutation', readonly updateLookBoard: { readonly __typename?: 'LookBoard', readonly id: string, readonly name: string, readonly description?: string | null, readonly defaultFadeTime: number, readonly gridSize?: number | null, readonly canvasWidth: number, readonly canvasHeight: number, readonly updatedAt: string } };

export type DeleteLookBoardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLookBoardMutation = { readonly __typename?: 'Mutation', readonly deleteLookBoard: boolean };

export type AddLookToBoardMutationVariables = Exact<{
  input: CreateLookBoardButtonInput;
}>;


export type AddLookToBoardMutation = { readonly __typename?: 'Mutation', readonly addLookToBoard: { readonly __typename?: 'LookBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null, readonly look: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null }, readonly lookBoard: { readonly __typename?: 'LookBoard', readonly id: string } } };

export type UpdateLookBoardButtonMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateLookBoardButtonInput;
}>;


export type UpdateLookBoardButtonMutation = { readonly __typename?: 'Mutation', readonly updateLookBoardButton: { readonly __typename?: 'LookBoardButton', readonly id: string, readonly layoutX: number, readonly layoutY: number, readonly width?: number | null, readonly height?: number | null, readonly color?: string | null, readonly label?: string | null } };

export type RemoveLookFromBoardMutationVariables = Exact<{
  buttonId: Scalars['ID']['input'];
}>;


export type RemoveLookFromBoardMutation = { readonly __typename?: 'Mutation', readonly removeLookFromBoard: boolean };

export type UpdateLookBoardButtonPositionsMutationVariables = Exact<{
  positions: ReadonlyArray<LookBoardButtonPositionInput> | LookBoardButtonPositionInput;
}>;


export type UpdateLookBoardButtonPositionsMutation = { readonly __typename?: 'Mutation', readonly updateLookBoardButtonPositions: boolean };

export type ActivateLookFromBoardMutationVariables = Exact<{
  lookBoardId: Scalars['ID']['input'];
  lookId: Scalars['ID']['input'];
  fadeTimeOverride?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ActivateLookFromBoardMutation = { readonly __typename?: 'Mutation', readonly activateLookFromBoard: boolean };

export type GetProjectLooksQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetProjectLooksQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly looks: ReadonlyArray<{ readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly id: string, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> }, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelValue', readonly offset: number, readonly value: number }> }> }> } | null };

export type GetLookQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetLookQuery = { readonly __typename?: 'Query', readonly look?: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly layoutCanvasWidth: number, readonly layoutCanvasHeight: number }, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly id: string, readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string, readonly universe: number, readonly startChannel: number, readonly manufacturer: string, readonly model: string, readonly type: FixtureType, readonly modeName: string, readonly channelCount: number, readonly layoutX?: number | null, readonly layoutY?: number | null, readonly layoutRotation?: number | null, readonly channels: ReadonlyArray<{ readonly __typename?: 'InstanceChannel', readonly id: string, readonly offset: number, readonly name: string, readonly type: ChannelType, readonly minValue: number, readonly maxValue: number, readonly defaultValue: number }> }, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelValue', readonly offset: number, readonly value: number }> }> } | null };

export type CreateLookMutationVariables = Exact<{
  input: CreateLookInput;
}>;


export type CreateLookMutation = { readonly __typename?: 'Mutation', readonly createLook: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string }, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelValue', readonly offset: number, readonly value: number }> }> } };

export type UpdateLookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateLookInput;
}>;


export type UpdateLookMutation = { readonly __typename?: 'Mutation', readonly updateLook: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null, readonly updatedAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string }, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelValue', readonly offset: number, readonly value: number }> }> } };

export type DeleteLookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLookMutation = { readonly __typename?: 'Mutation', readonly deleteLook: boolean };

export type DuplicateLookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DuplicateLookMutation = { readonly __typename?: 'Mutation', readonly duplicateLook: { readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string }, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelValue', readonly offset: number, readonly value: number }> }> } };

export type GetCurrentActiveLookQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentActiveLookQuery = { readonly __typename?: 'Query', readonly currentActiveLook?: { readonly __typename?: 'Look', readonly id: string } | null };

export type ActivateLookMutationVariables = Exact<{
  lookId: Scalars['ID']['input'];
}>;


export type ActivateLookMutation = { readonly __typename?: 'Mutation', readonly setLookLive: boolean };

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

export type InitializePreviewWithLookMutationVariables = Exact<{
  sessionId: Scalars['ID']['input'];
  lookId: Scalars['ID']['input'];
}>;


export type InitializePreviewWithLookMutation = { readonly __typename?: 'Mutation', readonly initializePreviewWithLook: boolean };

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

export type CopyFixturesToLooksMutationVariables = Exact<{
  input: CopyFixturesToLooksInput;
}>;


export type CopyFixturesToLooksMutation = { readonly __typename?: 'Mutation', readonly copyFixturesToLooks: { readonly __typename?: 'CopyFixturesToLooksResult', readonly updatedLookCount: number, readonly affectedCueCount: number, readonly operationId?: string | null, readonly updatedLooks: ReadonlyArray<{ readonly __typename?: 'Look', readonly id: string, readonly name: string, readonly updatedAt: string, readonly fixtureValues: ReadonlyArray<{ readonly __typename?: 'FixtureValue', readonly fixture: { readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string }, readonly channels: ReadonlyArray<{ readonly __typename?: 'ChannelValue', readonly offset: number, readonly value: number }> }> }> } };

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


export type GetProjectsQuery = { readonly __typename?: 'Query', readonly projects: ReadonlyArray<{ readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly layoutCanvasWidth: number, readonly layoutCanvasHeight: number, readonly groupId?: string | null, readonly group?: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean } | null }> };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProjectQuery = { readonly __typename?: 'Query', readonly project?: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly layoutCanvasWidth: number, readonly layoutCanvasHeight: number, readonly groupId?: string | null, readonly group?: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean } | null, readonly fixtures: ReadonlyArray<{ readonly __typename?: 'FixtureInstance', readonly id: string, readonly name: string }>, readonly looks: ReadonlyArray<{ readonly __typename?: 'Look', readonly id: string, readonly name: string }>, readonly cueLists: ReadonlyArray<{ readonly __typename?: 'CueList', readonly id: string, readonly name: string, readonly loop: boolean }> } | null };

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { readonly __typename?: 'Mutation', readonly createProject: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string, readonly groupId?: string | null, readonly group?: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean } | null } };

export type UpdateProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: CreateProjectInput;
}>;


export type UpdateProjectMutation = { readonly __typename?: 'Mutation', readonly updateProject: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly updatedAt: string, readonly groupId?: string | null, readonly group?: { readonly __typename?: 'UserGroup', readonly id: string, readonly name: string, readonly isPersonal: boolean } | null } };

export type DeleteProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProjectMutation = { readonly __typename?: 'Mutation', readonly deleteProject: boolean };

export type ImportProjectFromQlcMutationVariables = Exact<{
  xmlContent: Scalars['String']['input'];
  originalFileName: Scalars['String']['input'];
}>;


export type ImportProjectFromQlcMutation = { readonly __typename?: 'Mutation', readonly importProjectFromQLC: { readonly __typename?: 'QLCImportResult', readonly originalFileName: string, readonly fixtureCount: number, readonly lookCount: number, readonly cueListCount: number, readonly warnings: ReadonlyArray<string>, readonly project: { readonly __typename?: 'Project', readonly id: string, readonly name: string, readonly description?: string | null, readonly createdAt: string, readonly updatedAt: string } } };

export type GetQlcFixtureMappingSuggestionsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetQlcFixtureMappingSuggestionsQuery = { readonly __typename?: 'Query', readonly getQLCFixtureMappingSuggestions: { readonly __typename?: 'QLCFixtureMappingResult', readonly projectId: string, readonly lacyLightsFixtures: ReadonlyArray<{ readonly __typename?: 'LacyLightsFixture', readonly manufacturer: string, readonly model: string }>, readonly suggestions: ReadonlyArray<{ readonly __typename?: 'FixtureMappingSuggestion', readonly fixture: { readonly __typename?: 'LacyLightsFixture', readonly manufacturer: string, readonly model: string }, readonly suggestions: ReadonlyArray<{ readonly __typename?: 'QLCFixtureDefinition', readonly manufacturer: string, readonly model: string, readonly type: string, readonly modes: ReadonlyArray<{ readonly __typename?: 'QLCFixtureMode', readonly name: string, readonly channelCount: number }> }> }>, readonly defaultMappings: ReadonlyArray<{ readonly __typename?: 'FixtureMapping', readonly lacyLightsKey: string, readonly qlcManufacturer: string, readonly qlcModel: string, readonly qlcMode: string }> } };

export type ExportProjectToQlcMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  fixtureMappings: ReadonlyArray<FixtureMappingInput> | FixtureMappingInput;
}>;


export type ExportProjectToQlcMutation = { readonly __typename?: 'Mutation', readonly exportProjectToQLC: { readonly __typename?: 'QLCExportResult', readonly projectName: string, readonly xmlContent: string, readonly fixtureCount: number, readonly lookCount: number, readonly cueListCount: number } };

export type ExportProjectMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  options?: InputMaybe<ExportOptionsInput>;
}>;


export type ExportProjectMutation = { readonly __typename?: 'Mutation', readonly exportProject: { readonly __typename?: 'ExportResult', readonly projectId: string, readonly projectName: string, readonly jsonContent: string, readonly stats: { readonly __typename?: 'ExportStats', readonly fixtureDefinitionsCount: number, readonly fixtureInstancesCount: number, readonly looksCount: number, readonly cueListsCount: number, readonly cuesCount: number } } };

export type ImportProjectMutationVariables = Exact<{
  jsonContent: Scalars['String']['input'];
  options: ImportOptionsInput;
}>;


export type ImportProjectMutation = { readonly __typename?: 'Mutation', readonly importProject: { readonly __typename?: 'ImportResult', readonly projectId: string, readonly warnings: ReadonlyArray<string>, readonly stats: { readonly __typename?: 'ImportStats', readonly fixtureDefinitionsCreated: number, readonly fixtureInstancesCreated: number, readonly looksCreated: number, readonly cueListsCreated: number, readonly cuesCreated: number } } };

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


export type GetSystemInfoQuery = { readonly __typename?: 'Query', readonly systemInfo: { readonly __typename?: 'SystemInfo', readonly artnetBroadcastAddress: string, readonly artnetEnabled: boolean, readonly fadeUpdateRateHz: number } };

export type GetNetworkInterfaceOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNetworkInterfaceOptionsQuery = { readonly __typename?: 'Query', readonly networkInterfaceOptions: ReadonlyArray<{ readonly __typename?: 'NetworkInterfaceOption', readonly name: string, readonly address: string, readonly broadcast: string, readonly description: string, readonly interfaceType: string }> };

export type SystemInfoUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SystemInfoUpdatedSubscription = { readonly __typename?: 'Subscription', readonly systemInfoUpdated: { readonly __typename?: 'SystemInfo', readonly artnetBroadcastAddress: string, readonly artnetEnabled: boolean, readonly fadeUpdateRateHz: number } };

export type SetArtNetEnabledMutationVariables = Exact<{
  enabled: Scalars['Boolean']['input'];
  fadeTime?: InputMaybe<Scalars['Float']['input']>;
}>;


export type SetArtNetEnabledMutation = { readonly __typename?: 'Mutation', readonly setArtNetEnabled: { readonly __typename?: 'ArtNetStatus', readonly enabled: boolean, readonly broadcastAddress: string } };

export type GetUndoRedoStatusQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type GetUndoRedoStatusQuery = { readonly __typename?: 'Query', readonly undoRedoStatus: { readonly __typename?: 'UndoRedoStatus', readonly projectId: string, readonly canUndo: boolean, readonly canRedo: boolean, readonly currentSequence: number, readonly totalOperations: number, readonly undoDescription?: string | null, readonly redoDescription?: string | null } };

export type GetOperationHistoryQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOperationHistoryQuery = { readonly __typename?: 'Query', readonly operationHistory: { readonly __typename?: 'OperationHistoryPage', readonly currentSequence: number, readonly operations: ReadonlyArray<{ readonly __typename?: 'OperationSummary', readonly id: string, readonly description: string, readonly operationType: OperationType, readonly entityType: UndoEntityType, readonly sequence: number, readonly createdAt: string, readonly isCurrent: boolean }>, readonly pagination: { readonly __typename?: 'PaginationInfo', readonly total: number, readonly page: number, readonly perPage: number, readonly totalPages: number, readonly hasMore: boolean } } };

export type GetOperationQueryVariables = Exact<{
  operationId: Scalars['ID']['input'];
}>;


export type GetOperationQuery = { readonly __typename?: 'Query', readonly operation?: { readonly __typename?: 'Operation', readonly id: string, readonly projectId: string, readonly operationType: OperationType, readonly entityType: UndoEntityType, readonly entityId: string, readonly description: string, readonly sequence: number, readonly createdAt: string, readonly relatedIds?: ReadonlyArray<string> | null } | null };

export type UndoMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type UndoMutation = { readonly __typename?: 'Mutation', readonly undo: { readonly __typename?: 'UndoRedoResult', readonly success: boolean, readonly message?: string | null, readonly restoredEntityId?: string | null, readonly operation?: { readonly __typename?: 'Operation', readonly id: string, readonly description: string, readonly operationType: OperationType, readonly entityType: UndoEntityType, readonly sequence: number } | null } };

export type RedoMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type RedoMutation = { readonly __typename?: 'Mutation', readonly redo: { readonly __typename?: 'UndoRedoResult', readonly success: boolean, readonly message?: string | null, readonly restoredEntityId?: string | null, readonly operation?: { readonly __typename?: 'Operation', readonly id: string, readonly description: string, readonly operationType: OperationType, readonly entityType: UndoEntityType, readonly sequence: number } | null } };

export type JumpToOperationMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  operationId: Scalars['ID']['input'];
}>;


export type JumpToOperationMutation = { readonly __typename?: 'Mutation', readonly jumpToOperation: { readonly __typename?: 'UndoRedoResult', readonly success: boolean, readonly message?: string | null, readonly restoredEntityId?: string | null, readonly operation?: { readonly __typename?: 'Operation', readonly id: string, readonly description: string, readonly operationType: OperationType, readonly entityType: UndoEntityType, readonly sequence: number } | null } };

export type ClearOperationHistoryMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
  confirmClear: Scalars['Boolean']['input'];
}>;


export type ClearOperationHistoryMutation = { readonly __typename?: 'Mutation', readonly clearOperationHistory: boolean };

export type OperationHistoryChangedSubscriptionVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;


export type OperationHistoryChangedSubscription = { readonly __typename?: 'Subscription', readonly operationHistoryChanged: { readonly __typename?: 'UndoRedoStatus', readonly projectId: string, readonly canUndo: boolean, readonly canRedo: boolean, readonly currentSequence: number, readonly totalOperations: number, readonly undoDescription?: string | null, readonly redoDescription?: string | null } };

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

export type GetBuildInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBuildInfoQuery = { readonly __typename?: 'Query', readonly buildInfo: { readonly __typename?: 'BuildInfo', readonly version: string, readonly gitCommit: string, readonly buildTime: string } };

export type WiFiNetworksQueryVariables = Exact<{
  rescan?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type WiFiNetworksQuery = { readonly __typename?: 'Query', readonly wifiNetworks: ReadonlyArray<{ readonly __typename?: 'WiFiNetwork', readonly ssid: string, readonly signalStrength: number, readonly frequency: string, readonly security: WiFiSecurityType, readonly inUse: boolean, readonly saved: boolean }> };

export type WiFiStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type WiFiStatusQuery = { readonly __typename?: 'Query', readonly wifiStatus: { readonly __typename?: 'WiFiStatus', readonly available: boolean, readonly enabled: boolean, readonly connected: boolean, readonly ssid?: string | null, readonly signalStrength?: number | null, readonly ipAddress?: string | null, readonly macAddress?: string | null, readonly frequency?: string | null, readonly mode: WiFiMode, readonly apConfig?: { readonly __typename?: 'APConfig', readonly ssid: string, readonly ipAddress: string, readonly channel: number, readonly clientCount: number, readonly timeoutMinutes: number, readonly minutesRemaining?: number | null } | null, readonly connectedClients?: ReadonlyArray<{ readonly __typename?: 'APClient', readonly macAddress: string, readonly ipAddress?: string | null, readonly hostname?: string | null, readonly connectedAt: string }> | null } };

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


export type WiFiStatusUpdatedSubscription = { readonly __typename?: 'Subscription', readonly wifiStatusUpdated: { readonly __typename?: 'WiFiStatus', readonly available: boolean, readonly enabled: boolean, readonly connected: boolean, readonly ssid?: string | null, readonly signalStrength?: number | null, readonly ipAddress?: string | null, readonly macAddress?: string | null, readonly frequency?: string | null, readonly mode: WiFiMode, readonly apConfig?: { readonly __typename?: 'APConfig', readonly ssid: string, readonly ipAddress: string, readonly channel: number, readonly clientCount: number, readonly timeoutMinutes: number, readonly minutesRemaining?: number | null } | null, readonly connectedClients?: ReadonlyArray<{ readonly __typename?: 'APClient', readonly macAddress: string, readonly ipAddress?: string | null, readonly hostname?: string | null, readonly connectedAt: string }> | null } };

export type WiFiModeQueryVariables = Exact<{ [key: string]: never; }>;


export type WiFiModeQuery = { readonly __typename?: 'Query', readonly wifiMode: WiFiMode };

export type ApConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type ApConfigQuery = { readonly __typename?: 'Query', readonly apConfig?: { readonly __typename?: 'APConfig', readonly ssid: string, readonly ipAddress: string, readonly channel: number, readonly clientCount: number, readonly timeoutMinutes: number, readonly minutesRemaining?: number | null } | null };

export type ApClientsQueryVariables = Exact<{ [key: string]: never; }>;


export type ApClientsQuery = { readonly __typename?: 'Query', readonly apClients: ReadonlyArray<{ readonly __typename?: 'APClient', readonly macAddress: string, readonly ipAddress?: string | null, readonly hostname?: string | null, readonly connectedAt: string }> };

export type StartApModeMutationVariables = Exact<{ [key: string]: never; }>;


export type StartApModeMutation = { readonly __typename?: 'Mutation', readonly startAPMode: { readonly __typename?: 'WiFiModeResult', readonly success: boolean, readonly message?: string | null, readonly mode: WiFiMode } };

export type StopApModeMutationVariables = Exact<{
  connectToSSID?: InputMaybe<Scalars['String']['input']>;
}>;


export type StopApModeMutation = { readonly __typename?: 'Mutation', readonly stopAPMode: { readonly __typename?: 'WiFiModeResult', readonly success: boolean, readonly message?: string | null, readonly mode: WiFiMode } };

export type ResetApTimeoutMutationVariables = Exact<{ [key: string]: never; }>;


export type ResetApTimeoutMutation = { readonly __typename?: 'Mutation', readonly resetAPTimeout: boolean };

export type WiFiModeChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type WiFiModeChangedSubscription = { readonly __typename?: 'Subscription', readonly wifiModeChanged: WiFiMode };

export const AuthUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]} as unknown as DocumentNode<AuthUserFieldsFragment, unknown>;
export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
export const SessionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivityAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<SessionFieldsFragment, unknown>;
export const DeviceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DeviceFieldsFragment, unknown>;
export const UserGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserGroupFieldsFragment, unknown>;
export const GroupMemberFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupMemberFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}}]}}]} as unknown as DocumentNode<GroupMemberFieldsFragment, unknown>;
export const GroupInvitationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupInvitationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupInvitation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GroupInvitationFieldsFragment, unknown>;
export const AuthSettingsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"allowedMethods"}},{"kind":"Field","name":{"kind":"Name","value":"deviceAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"sessionDurationHours"}},{"kind":"Field","name":{"kind":"Name","value":"passwordMinLength"}},{"kind":"Field","name":{"kind":"Name","value":"requireEmailVerification"}}]}}]} as unknown as DocumentNode<AuthSettingsFieldsFragment, unknown>;
export const EffectFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"priorityBand"}},{"kind":"Field","name":{"kind":"Name","value":"prioritySub"}},{"kind":"Field","name":{"kind":"Name","value":"compositionMode"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}},{"kind":"Field","name":{"kind":"Name","value":"fadeDuration"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"amplitude"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"masterValue"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<EffectFieldsFragment, unknown>;
export const EffectFixtureFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFixtureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectFixture"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"effectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]}}]} as unknown as DocumentNode<EffectFixtureFieldsFragment, unknown>;
export const EffectWithFixturesFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectWithFixturesFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"priorityBand"}},{"kind":"Field","name":{"kind":"Name","value":"prioritySub"}},{"kind":"Field","name":{"kind":"Name","value":"compositionMode"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}},{"kind":"Field","name":{"kind":"Name","value":"fadeDuration"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"amplitude"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"masterValue"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFixtureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFixtureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectFixture"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"effectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]}}]} as unknown as DocumentNode<EffectWithFixturesFieldsFragment, unknown>;
export const EffectChannelFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectChannelFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectChannel"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]} as unknown as DocumentNode<EffectChannelFieldsFragment, unknown>;
export const OflImportStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"successfulImports"}},{"kind":"Field","name":{"kind":"Name","value":"failedImports"}},{"kind":"Field","name":{"kind":"Name","value":"skippedDuplicates"}},{"kind":"Field","name":{"kind":"Name","value":"updatedFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}}]} as unknown as DocumentNode<OflImportStatsFieldsFragment, unknown>;
export const OflImportStatusFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isImporting"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"currentManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"currentFixture"}},{"kind":"Field","name":{"kind":"Name","value":"totalFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"importedCount"}},{"kind":"Field","name":{"kind":"Name","value":"failedCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedSecondsRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"usingBundledData"}}]}}]} as unknown as DocumentNode<OflImportStatusFieldsFragment, unknown>;
export const OflFixtureUpdateFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLFixtureUpdateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLFixtureUpdate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureKey"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"isInUse"}},{"kind":"Field","name":{"kind":"Name","value":"instanceCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentHash"}},{"kind":"Field","name":{"kind":"Name","value":"newHash"}}]}}]} as unknown as DocumentNode<OflFixtureUpdateFieldsFragment, unknown>;
export const TestConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestConnection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]} as unknown as DocumentNode<TestConnectionQuery, TestConnectionQueryVariables>;
export const GetMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthUserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]} as unknown as DocumentNode<GetMeQuery, GetMeQueryVariables>;
export const GetAuthEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthEnabled"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authEnabled"}}]}}]} as unknown as DocumentNode<GetAuthEnabledQuery, GetAuthEnabledQueryVariables>;
export const GetAuthSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthSettingsFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"allowedMethods"}},{"kind":"Field","name":{"kind":"Name","value":"deviceAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"sessionDurationHours"}},{"kind":"Field","name":{"kind":"Name","value":"passwordMinLength"}},{"kind":"Field","name":{"kind":"Name","value":"requireEmailVerification"}}]}}]} as unknown as DocumentNode<GetAuthSettingsQuery, GetAuthSettingsQueryVariables>;
export const GetMySessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMySessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SessionFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SessionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Session"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivityAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMySessionsQuery, GetMySessionsQueryVariables>;
export const CheckDeviceAuthorizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CheckDeviceAuthorization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fingerprint"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkDeviceAuthorization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fingerprint"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fingerprint"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"isPending"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeviceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CheckDeviceAuthorizationQuery, CheckDeviceAuthorizationQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"perPage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetUserQuery, GetUserQueryVariables>;
export const GetUserGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserGroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetUserGroupsQuery, GetUserGroupsQueryVariables>;
export const GetUserGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserGroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetUserGroupQuery, GetUserGroupQueryVariables>;
export const GetDevicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDevices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"devices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeviceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetDevicesQuery, GetDevicesQueryVariables>;
export const GetDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"device"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeviceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GetDeviceQuery, GetDeviceQueryVariables>;
export const RegisterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"register"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const LogoutAllDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LogoutAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logoutAll"}}]}}]} as unknown as DocumentNode<LogoutAllMutation, LogoutAllMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const ChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"oldPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"oldPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"oldPassword"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const RequestPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const RequestEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestEmailVerification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestEmailVerification"}}]}}]} as unknown as DocumentNode<RequestEmailVerificationMutation, RequestEmailVerificationMutationVariables>;
export const VerifyEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<VerifyEmailMutation, VerifyEmailMutationVariables>;
export const AppleSignInDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AppleSignIn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identityToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"authorizationCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appleSignIn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identityToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identityToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"authorizationCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"authorizationCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AppleSignInMutation, AppleSignInMutationVariables>;
export const RegisterDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fingerprint"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fingerprint"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fingerprint"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"device"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeviceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RegisterDeviceMutation, RegisterDeviceMutationVariables>;
export const AuthorizeDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthorizeDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fingerprint"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"authorizationCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authorizeDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fingerprint"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fingerprint"}}},{"kind":"Argument","name":{"kind":"Name","value":"authorizationCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"authorizationCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AuthorizeDeviceMutation, AuthorizeDeviceMutationVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const CreateUserGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUserGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUserGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserGroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateUserGroupMutation, CreateUserGroupMutationVariables>;
export const UpdateUserGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserGroupFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateUserGroupMutation, UpdateUserGroupMutationVariables>;
export const DeleteUserGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUserGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUserGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserGroupMutation, DeleteUserGroupMutationVariables>;
export const AddUserToGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserToGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMemberRole"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}]}]}}]} as unknown as DocumentNode<AddUserToGroupMutation, AddUserToGroupMutationVariables>;
export const RemoveUserFromGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserFromGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserFromGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}]}]}}]} as unknown as DocumentNode<RemoveUserFromGroupMutation, RemoveUserFromGroupMutationVariables>;
export const UpdateGroupMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGroupMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMemberRole"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroupMemberRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}]}]}}]} as unknown as DocumentNode<UpdateGroupMemberRoleMutation, UpdateGroupMemberRoleMutationVariables>;
export const CreateDeviceAuthCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDeviceAuthCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDeviceAuthCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}}]}}]}}]} as unknown as DocumentNode<CreateDeviceAuthCodeMutation, CreateDeviceAuthCodeMutationVariables>;
export const UpdateDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeviceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeviceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<UpdateDeviceMutation, UpdateDeviceMutationVariables>;
export const RevokeDeviceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeDevice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeDevice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeviceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeviceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Device"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"isAuthorized"}},{"kind":"Field","name":{"kind":"Name","value":"defaultRole"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastIPAddress"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RevokeDeviceMutation, RevokeDeviceMutationVariables>;
export const RevokeSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}]}]}}]} as unknown as DocumentNode<RevokeSessionMutation, RevokeSessionMutationVariables>;
export const RevokeAllUserSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeAllUserSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeAllUserSessions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}]}}]} as unknown as DocumentNode<RevokeAllUserSessionsMutation, RevokeAllUserSessionsMutationVariables>;
export const UpdateAuthSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAuthSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAuthSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAuthSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthSettingsFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"allowedMethods"}},{"kind":"Field","name":{"kind":"Name","value":"deviceAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"sessionDurationHours"}},{"kind":"Field","name":{"kind":"Name","value":"passwordMinLength"}},{"kind":"Field","name":{"kind":"Name","value":"requireEmailVerification"}}]}}]} as unknown as DocumentNode<UpdateAuthSettingsMutation, UpdateAuthSettingsMutationVariables>;
export const GetMyGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserGroupFields"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupMemberFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupMemberFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMember"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}}]}}]} as unknown as DocumentNode<GetMyGroupsQuery, GetMyGroupsQueryVariables>;
export const GetMyInvitationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupInvitationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupInvitationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupInvitation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMyInvitationsQuery, GetMyInvitationsQueryVariables>;
export const GetGroupInvitationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroupInvitations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupInvitations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupInvitationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupInvitationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupInvitation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetGroupInvitationsQuery, GetGroupInvitationsQueryVariables>;
export const InviteToGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteToGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GroupMemberRole"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupInvitationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GroupInvitationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupInvitation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<InviteToGroupMutation, InviteToGroupMutationVariables>;
export const AcceptInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<AcceptInvitationMutation, AcceptInvitationMutationVariables>;
export const DeclineInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<DeclineInvitationMutation, DeclineInvitationMutationVariables>;
export const CancelInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<CancelInvitationMutation, CancelInvitationMutationVariables>;
export const GetProjectCueListsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectCueLists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cueLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}},{"kind":"Field","name":{"kind":"Name","value":"skip"}},{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"effect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}}]}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectCueListsQuery, GetProjectCueListsQueryVariables>;
export const GetCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}},{"kind":"Field","name":{"kind":"Name","value":"skip"}},{"kind":"Field","name":{"kind":"Name","value":"effects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"effect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}}]}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCueListQuery, GetCueListQueryVariables>;
export const CreateCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCueListMutation, CreateCueListMutationVariables>;
export const UpdateCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueListInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCueListMutation, UpdateCueListMutationVariables>;
export const DeleteCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCueListMutation, DeleteCueListMutationVariables>;
export const CreateCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}},{"kind":"Field","name":{"kind":"Name","value":"skip"}}]}}]}}]} as unknown as DocumentNode<CreateCueMutation, CreateCueMutationVariables>;
export const UpdateCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}},{"kind":"Field","name":{"kind":"Name","value":"skip"}}]}}]}}]} as unknown as DocumentNode<UpdateCueMutation, UpdateCueMutationVariables>;
export const DeleteCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteCueMutation, DeleteCueMutationVariables>;
export const PlayCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PlayCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"playCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<PlayCueMutation, PlayCueMutationVariables>;
export const FadeToBlackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FadeToBlack"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeOutTime"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fadeToBlack"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fadeOutTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeOutTime"}}}]}]}}]} as unknown as DocumentNode<FadeToBlackMutation, FadeToBlackMutationVariables>;
export const ReorderCuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderCues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueOrders"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CueOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderCues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"cueOrders"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueOrders"}}}]}]}}]} as unknown as DocumentNode<ReorderCuesMutation, ReorderCuesMutationVariables>;
export const BulkUpdateCuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateCues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkCueUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateCues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}},{"kind":"Field","name":{"kind":"Name","value":"skip"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateCuesMutation, BulkUpdateCuesMutationVariables>;
export const ToggleCueSkipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleCueSkip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleCueSkip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fadeInTime"}},{"kind":"Field","name":{"kind":"Name","value":"fadeOutTime"}},{"kind":"Field","name":{"kind":"Name","value":"followTime"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"easingType"}},{"kind":"Field","name":{"kind":"Name","value":"skip"}}]}}]}}]} as unknown as DocumentNode<ToggleCueSkipMutation, ToggleCueSkipMutationVariables>;
export const GetCueListPlaybackStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCueListPlaybackStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListPlaybackStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueIndex"}},{"kind":"Field","name":{"kind":"Name","value":"isPlaying"}},{"kind":"Field","name":{"kind":"Name","value":"isPaused"}},{"kind":"Field","name":{"kind":"Name","value":"isFading"}},{"kind":"Field","name":{"kind":"Name","value":"fadeProgress"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<GetCueListPlaybackStatusQuery, GetCueListPlaybackStatusQueryVariables>;
export const StartCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startFromCue"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"startFromCue"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startFromCue"}}}]}]}}]} as unknown as DocumentNode<StartCueListMutation, StartCueListMutationVariables>;
export const NextCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NextCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nextCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<NextCueMutation, NextCueMutationVariables>;
export const PreviousCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PreviousCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previousCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<PreviousCueMutation, PreviousCueMutationVariables>;
export const GoToCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GoToCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueIndex"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"goToCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}},{"kind":"Argument","name":{"kind":"Name","value":"cueIndex"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueIndex"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeInTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeInTime"}}}]}]}}]} as unknown as DocumentNode<GoToCueMutation, GoToCueMutationVariables>;
export const StopCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}]}]}}]} as unknown as DocumentNode<StopCueListMutation, StopCueListMutationVariables>;
export const CueListPlaybackUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CueListPlaybackUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListPlaybackUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueIndex"}},{"kind":"Field","name":{"kind":"Name","value":"isPlaying"}},{"kind":"Field","name":{"kind":"Name","value":"isPaused"}},{"kind":"Field","name":{"kind":"Name","value":"isFading"}},{"kind":"Field","name":{"kind":"Name","value":"fadeProgress"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<CueListPlaybackUpdatedSubscription, CueListPlaybackUpdatedSubscriptionVariables>;
export const GetGlobalPlaybackStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGlobalPlaybackStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"globalPlaybackStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isPlaying"}},{"kind":"Field","name":{"kind":"Name","value":"isPaused"}},{"kind":"Field","name":{"kind":"Name","value":"isFading"}},{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"cueListName"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueIndex"}},{"kind":"Field","name":{"kind":"Name","value":"cueCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueName"}},{"kind":"Field","name":{"kind":"Name","value":"fadeProgress"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<GetGlobalPlaybackStatusQuery, GetGlobalPlaybackStatusQueryVariables>;
export const GlobalPlaybackStatusUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"GlobalPlaybackStatusUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"globalPlaybackStatusUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isPlaying"}},{"kind":"Field","name":{"kind":"Name","value":"isPaused"}},{"kind":"Field","name":{"kind":"Name","value":"isFading"}},{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"cueListName"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueIndex"}},{"kind":"Field","name":{"kind":"Name","value":"cueCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentCueName"}},{"kind":"Field","name":{"kind":"Name","value":"fadeProgress"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<GlobalPlaybackStatusUpdatedSubscription, GlobalPlaybackStatusUpdatedSubscriptionVariables>;
export const ResumeCueListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResumeCueList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resumeCueList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}]}]}}]} as unknown as DocumentNode<ResumeCueListMutation, ResumeCueListMutationVariables>;
export const CueListDataChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"CueListDataChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListDataChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueListId"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"affectedCueIds"}},{"kind":"Field","name":{"kind":"Name","value":"affectedLookId"}},{"kind":"Field","name":{"kind":"Name","value":"newLookName"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<CueListDataChangedSubscription, CueListDataChangedSubscriptionVariables>;
export const GetCuesWithLookInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCuesWithLookInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cuesWithLookInfo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueListId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueListId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cueId"}},{"kind":"Field","name":{"kind":"Name","value":"cueNumber"}},{"kind":"Field","name":{"kind":"Name","value":"cueName"}},{"kind":"Field","name":{"kind":"Name","value":"lookId"}},{"kind":"Field","name":{"kind":"Name","value":"lookName"}},{"kind":"Field","name":{"kind":"Name","value":"otherCueNumbers"}}]}},{"kind":"Field","name":{"kind":"Name","value":"orphanLooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<GetCuesWithLookInfoQuery, GetCuesWithLookInfoQueryVariables>;
export const GetEffectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEffects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"priorityBand"}},{"kind":"Field","name":{"kind":"Name","value":"prioritySub"}},{"kind":"Field","name":{"kind":"Name","value":"compositionMode"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}},{"kind":"Field","name":{"kind":"Name","value":"fadeDuration"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"amplitude"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"masterValue"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetEffectsQuery, GetEffectsQueryVariables>;
export const GetEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectWithFixturesFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFixtureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectFixture"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"effectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectWithFixturesFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"priorityBand"}},{"kind":"Field","name":{"kind":"Name","value":"prioritySub"}},{"kind":"Field","name":{"kind":"Name","value":"compositionMode"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}},{"kind":"Field","name":{"kind":"Name","value":"fadeDuration"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"amplitude"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"masterValue"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFixtureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetEffectQuery, GetEffectQueryVariables>;
export const GetModulatorStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetModulatorStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modulatorStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isRunning"}},{"kind":"Field","name":{"kind":"Name","value":"updateRateHz"}},{"kind":"Field","name":{"kind":"Name","value":"activeEffectCount"}},{"kind":"Field","name":{"kind":"Name","value":"activeEffects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectName"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isBlackoutActive"}},{"kind":"Field","name":{"kind":"Name","value":"blackoutIntensity"}},{"kind":"Field","name":{"kind":"Name","value":"grandMasterValue"}},{"kind":"Field","name":{"kind":"Name","value":"hasActiveTransition"}},{"kind":"Field","name":{"kind":"Name","value":"transitionProgress"}}]}}]}}]} as unknown as DocumentNode<GetModulatorStatusQuery, GetModulatorStatusQueryVariables>;
export const CreateEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"priorityBand"}},{"kind":"Field","name":{"kind":"Name","value":"prioritySub"}},{"kind":"Field","name":{"kind":"Name","value":"compositionMode"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}},{"kind":"Field","name":{"kind":"Name","value":"fadeDuration"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"amplitude"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"masterValue"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateEffectMutation, CreateEffectMutationVariables>;
export const UpdateEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Effect"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"priorityBand"}},{"kind":"Field","name":{"kind":"Name","value":"prioritySub"}},{"kind":"Field","name":{"kind":"Name","value":"compositionMode"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}},{"kind":"Field","name":{"kind":"Name","value":"fadeDuration"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"amplitude"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"masterValue"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateEffectMutation, UpdateEffectMutationVariables>;
export const DeleteEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEffectMutation, DeleteEffectMutationVariables>;
export const AddFixtureToEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddFixtureToEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddFixtureToEffectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addFixtureToEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFixtureFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFixtureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectFixture"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"effectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]}}]} as unknown as DocumentNode<AddFixtureToEffectMutation, AddFixtureToEffectMutationVariables>;
export const RemoveFixtureFromEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveFixtureFromEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeFixtureFromEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"effectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureId"}}}]}]}}]} as unknown as DocumentNode<RemoveFixtureFromEffectMutation, RemoveFixtureFromEffectMutationVariables>;
export const UpdateEffectFixtureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEffectFixture"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEffectFixtureInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffectFixture"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectFixtureFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectFixtureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectFixture"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"phaseOffset"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"effectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]}}]} as unknown as DocumentNode<UpdateEffectFixtureMutation, UpdateEffectFixtureMutationVariables>;
export const AddChannelToEffectFixtureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddChannelToEffectFixture"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectFixtureId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EffectChannelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addChannelToEffectFixture"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"effectFixtureId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectFixtureId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectChannelFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectChannelFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectChannel"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]} as unknown as DocumentNode<AddChannelToEffectFixtureMutation, AddChannelToEffectFixtureMutationVariables>;
export const UpdateEffectChannelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEffectChannel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EffectChannelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEffectChannel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"EffectChannelFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"EffectChannelFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EffectChannel"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"effectFixtureId"}},{"kind":"Field","name":{"kind":"Name","value":"channelOffset"}},{"kind":"Field","name":{"kind":"Name","value":"channelType"}},{"kind":"Field","name":{"kind":"Name","value":"amplitudeScale"}},{"kind":"Field","name":{"kind":"Name","value":"frequencyScale"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}}]}}]} as unknown as DocumentNode<UpdateEffectChannelMutation, UpdateEffectChannelMutationVariables>;
export const RemoveChannelFromEffectFixtureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveChannelFromEffectFixture"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeChannelFromEffectFixture"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveChannelFromEffectFixtureMutation, RemoveChannelFromEffectFixtureMutationVariables>;
export const AddEffectToCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddEffectToCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddEffectToCueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addEffectToCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"cueId"}},{"kind":"Field","name":{"kind":"Name","value":"effectId"}},{"kind":"Field","name":{"kind":"Name","value":"effect"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"effectType"}},{"kind":"Field","name":{"kind":"Name","value":"waveform"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"onCueChange"}}]}}]}}]} as unknown as DocumentNode<AddEffectToCueMutation, AddEffectToCueMutationVariables>;
export const RemoveEffectFromCueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveEffectFromCue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeEffectFromCue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cueId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cueId"}}},{"kind":"Argument","name":{"kind":"Name","value":"effectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}}]}]}}]} as unknown as DocumentNode<RemoveEffectFromCueMutation, RemoveEffectFromCueMutationVariables>;
export const ActivateEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"effectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}}}]}]}}]} as unknown as DocumentNode<ActivateEffectMutation, ActivateEffectMutationVariables>;
export const StopEffectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopEffect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopEffect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"effectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"effectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}}}]}]}}]} as unknown as DocumentNode<StopEffectMutation, StopEffectMutationVariables>;
export const ActivateBlackoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateBlackout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateBlackout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fadeTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}}}]}]}}]} as unknown as DocumentNode<ActivateBlackoutMutation, ActivateBlackoutMutationVariables>;
export const ReleaseBlackoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReleaseBlackout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"releaseBlackout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fadeTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}}}]}]}}]} as unknown as DocumentNode<ReleaseBlackoutMutation, ReleaseBlackoutMutationVariables>;
export const SetGrandMasterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetGrandMaster"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setGrandMaster"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}]}]}}]} as unknown as DocumentNode<SetGrandMasterMutation, SetGrandMasterMutationVariables>;
export const LookDataChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LookDataChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookDataChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<LookDataChangedSubscription, LookDataChangedSubscriptionVariables>;
export const LookBoardDataChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LookBoardDataChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookBoardDataChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookBoardId"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"affectedButtonIds"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<LookBoardDataChangedSubscription, LookBoardDataChangedSubscriptionVariables>;
export const FixtureDataChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"FixtureDataChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDataChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureIds"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<FixtureDataChangedSubscription, FixtureDataChangedSubscriptionVariables>;
export const GetFixtureDefinitionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFixtureDefinitions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureDefinitionFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}}]} as unknown as DocumentNode<GetFixtureDefinitionsQuery, GetFixtureDefinitionsQueryVariables>;
export const GetManufacturersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetManufacturers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"manufacturer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}}]}}]}}]} as unknown as DocumentNode<GetManufacturersQuery, GetManufacturersQueryVariables>;
export const GetModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetModels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"manufacturer"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"manufacturer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"manufacturer"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"model"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}}]} as unknown as DocumentNode<GetModelsQuery, GetModelsQueryVariables>;
export const CreateFixtureInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFixtureInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFixtureInstanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFixtureInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]} as unknown as DocumentNode<CreateFixtureInstanceMutation, CreateFixtureInstanceMutationVariables>;
export const UpdateFixtureInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFixtureInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFixtureInstanceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFixtureInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]} as unknown as DocumentNode<UpdateFixtureInstanceMutation, UpdateFixtureInstanceMutationVariables>;
export const DeleteFixtureInstanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFixtureInstance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFixtureInstance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteFixtureInstanceMutation, DeleteFixtureInstanceMutationVariables>;
export const ImportOflFixtureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportOFLFixture"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImportOFLFixtureInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importOFLFixture"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}}]} as unknown as DocumentNode<ImportOflFixtureMutation, ImportOflFixtureMutationVariables>;
export const GetProjectFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"projectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectFixturesQuery, GetProjectFixturesQueryVariables>;
export const ReorderProjectFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderProjectFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderProjectFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureOrders"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}}}]}]}}]} as unknown as DocumentNode<ReorderProjectFixturesMutation, ReorderProjectFixturesMutationVariables>;
export const ReorderLookFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReorderLookFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureOrderInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderLookFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lookId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureOrders"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureOrders"}}}]}]}}]} as unknown as DocumentNode<ReorderLookFixturesMutation, ReorderLookFixturesMutationVariables>;
export const UpdateFixturePositionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFixturePositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"positions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixturePositionInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFixturePositions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"positions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"positions"}}}]}]}}]} as unknown as DocumentNode<UpdateFixturePositionsMutation, UpdateFixturePositionsMutationVariables>;
export const SuggestChannelAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SuggestChannelAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelAssignmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suggestChannelAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"assignments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureName"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"endChannel"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channelRange"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalChannelsNeeded"}},{"kind":"Field","name":{"kind":"Name","value":"availableChannelsRemaining"}}]}}]}}]} as unknown as DocumentNode<SuggestChannelAssignmentQuery, SuggestChannelAssignmentQueryVariables>;
export const GetChannelMapDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChannelMap"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"universe"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"channelMap"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"universe"},"value":{"kind":"Variable","name":{"kind":"Name","value":"universe"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"universes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"endChannel"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"availableChannels"}},{"kind":"Field","name":{"kind":"Name","value":"usedChannels"}}]}}]}}]}}]} as unknown as DocumentNode<GetChannelMapQuery, GetChannelMapQueryVariables>;
export const BulkCreateFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkCreateFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkFixtureCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkCreateFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"projectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"layoutRotation"}}]}}]}}]} as unknown as DocumentNode<BulkCreateFixturesMutation, BulkCreateFixturesMutationVariables>;
export const BulkUpdateFixturesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateFixtures"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkFixtureUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateFixtures"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"projectOrder"}},{"kind":"Field","name":{"kind":"Name","value":"definitionId"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"layoutRotation"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateFixturesMutation, BulkUpdateFixturesMutationVariables>;
export const UpdateInstanceChannelFadeBehaviorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateInstanceChannelFadeBehavior"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"channelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeBehavior"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FadeBehavior"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateInstanceChannelFadeBehavior"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"channelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"channelId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeBehavior"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeBehavior"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}}]}}]} as unknown as DocumentNode<UpdateInstanceChannelFadeBehaviorMutation, UpdateInstanceChannelFadeBehaviorMutationVariables>;
export const BulkUpdateInstanceChannelsFadeBehaviorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateInstanceChannelsFadeBehavior"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updates"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelFadeBehaviorInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateInstanceChannelsFadeBehavior"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updates"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updates"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"fadeBehavior"}},{"kind":"Field","name":{"kind":"Name","value":"isDiscrete"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateInstanceChannelsFadeBehaviorMutation, BulkUpdateInstanceChannelsFadeBehaviorMutationVariables>;
export const GetProjectLookBoardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectLookBoards"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookBoards"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"buttons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectLookBoardsQuery, GetProjectLookBoardsQueryVariables>;
export const GetLookBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLookBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buttons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLookBoardQuery, GetLookBoardQueryVariables>;
export const CreateLookBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLookBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLookBoardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLookBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"buttons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateLookBoardMutation, CreateLookBoardMutationVariables>;
export const UpdateLookBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLookBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLookBoardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLookBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultFadeTime"}},{"kind":"Field","name":{"kind":"Name","value":"gridSize"}},{"kind":"Field","name":{"kind":"Name","value":"canvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"canvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateLookBoardMutation, UpdateLookBoardMutationVariables>;
export const DeleteLookBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLookBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLookBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLookBoardMutation, DeleteLookBoardMutationVariables>;
export const AddLookToBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddLookToBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLookBoardButtonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addLookToBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"look"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lookBoard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddLookToBoardMutation, AddLookToBoardMutationVariables>;
export const UpdateLookBoardButtonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLookBoardButton"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLookBoardButtonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLookBoardButton"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]} as unknown as DocumentNode<UpdateLookBoardButtonMutation, UpdateLookBoardButtonMutationVariables>;
export const RemoveLookFromBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveLookFromBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buttonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeLookFromBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"buttonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buttonId"}}}]}]}}]} as unknown as DocumentNode<RemoveLookFromBoardMutation, RemoveLookFromBoardMutationVariables>;
export const UpdateLookBoardButtonPositionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLookBoardButtonPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"positions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LookBoardButtonPositionInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLookBoardButtonPositions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"positions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"positions"}}}]}]}}]} as unknown as DocumentNode<UpdateLookBoardButtonPositionsMutation, UpdateLookBoardButtonPositionsMutationVariables>;
export const ActivateLookFromBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateLookFromBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lookBoardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTimeOverride"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateLookFromBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lookBoardId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lookBoardId"}}},{"kind":"Argument","name":{"kind":"Name","value":"lookId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeTimeOverride"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTimeOverride"}}}]}]}}]} as unknown as DocumentNode<ActivateLookFromBoardMutation, ActivateLookFromBoardMutationVariables>;
export const GetProjectLooksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjectLooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"looks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectLooksQuery, GetProjectLooksQueryVariables>;
export const GetLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"look"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"layoutCanvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"layoutCanvasHeight"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"startChannel"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modeName"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"minValue"}},{"kind":"Field","name":{"kind":"Name","value":"maxValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultValue"}}]}},{"kind":"Field","name":{"kind":"Name","value":"layoutX"}},{"kind":"Field","name":{"kind":"Name","value":"layoutY"}},{"kind":"Field","name":{"kind":"Name","value":"layoutRotation"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLookQuery, GetLookQueryVariables>;
export const CreateLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateLookInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateLookMutation, CreateLookMutationVariables>;
export const UpdateLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLookInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateLookMutation, UpdateLookMutationVariables>;
export const DeleteLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteLookMutation, DeleteLookMutationVariables>;
export const DuplicateLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DuplicateLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duplicateLook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DuplicateLookMutation, DuplicateLookMutationVariables>;
export const GetCurrentActiveLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentActiveLook"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentActiveLook"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GetCurrentActiveLookQuery, GetCurrentActiveLookQueryVariables>;
export const ActivateLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setLookLive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"lookId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}}}]}]}}]} as unknown as DocumentNode<ActivateLookMutation, ActivateLookMutationVariables>;
export const StartPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startPreviewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"dmxOutput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]}}]} as unknown as DocumentNode<StartPreviewSessionMutation, StartPreviewSessionMutationVariables>;
export const CancelPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelPreviewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}]}]}}]} as unknown as DocumentNode<CancelPreviewSessionMutation, CancelPreviewSessionMutationVariables>;
export const CommitPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CommitPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commitPreviewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}]}]}}]} as unknown as DocumentNode<CommitPreviewSessionMutation, CommitPreviewSessionMutationVariables>;
export const UpdatePreviewChannelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePreviewChannel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"channelIndex"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePreviewChannel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureId"}}},{"kind":"Argument","name":{"kind":"Name","value":"channelIndex"},"value":{"kind":"Variable","name":{"kind":"Name","value":"channelIndex"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}}]}]}}]} as unknown as DocumentNode<UpdatePreviewChannelMutation, UpdatePreviewChannelMutationVariables>;
export const InitializePreviewWithLookDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitializePreviewWithLook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initializePreviewWithLook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}},{"kind":"Argument","name":{"kind":"Name","value":"lookId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lookId"}}}]}]}}]} as unknown as DocumentNode<InitializePreviewWithLookMutation, InitializePreviewWithLookMutationVariables>;
export const GetPreviewSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPreviewSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"dmxOutput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]}}]} as unknown as DocumentNode<GetPreviewSessionQuery, GetPreviewSessionQueryVariables>;
export const PreviewSessionUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PreviewSessionUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewSessionUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"dmxOutput"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]}}]} as unknown as DocumentNode<PreviewSessionUpdatedSubscription, PreviewSessionUpdatedSubscriptionVariables>;
export const DmxOutputChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"DmxOutputChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"universe"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dmxOutputChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"universe"},"value":{"kind":"Variable","name":{"kind":"Name","value":"universe"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"universe"}},{"kind":"Field","name":{"kind":"Name","value":"channels"}}]}}]}}]} as unknown as DocumentNode<DmxOutputChangedSubscription, DmxOutputChangedSubscriptionVariables>;
export const CopyFixturesToLooksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CopyFixturesToLooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CopyFixturesToLooksInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"copyFixturesToLooks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatedLookCount"}},{"kind":"Field","name":{"kind":"Name","value":"affectedCueCount"}},{"kind":"Field","name":{"kind":"Name","value":"operationId"}},{"kind":"Field","name":{"kind":"Name","value":"updatedLooks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureValues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"channels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CopyFixturesToLooksMutation, CopyFixturesToLooksMutationVariables>;
export const GetOflImportStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOFLImportStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oflImportStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLImportStatusFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isImporting"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"currentManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"currentFixture"}},{"kind":"Field","name":{"kind":"Name","value":"totalFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"importedCount"}},{"kind":"Field","name":{"kind":"Name","value":"failedCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedSecondsRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"usingBundledData"}}]}}]} as unknown as DocumentNode<GetOflImportStatusQuery, GetOflImportStatusQueryVariables>;
export const CheckOflUpdatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CheckOFLUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkOFLUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"oflFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"newFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"changedFixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"changedInUseCount"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLFixtureUpdateFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"checkedAt"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLFixtureUpdateFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLFixtureUpdate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureKey"}},{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"changeType"}},{"kind":"Field","name":{"kind":"Name","value":"isInUse"}},{"kind":"Field","name":{"kind":"Name","value":"instanceCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentHash"}},{"kind":"Field","name":{"kind":"Name","value":"newHash"}}]}}]} as unknown as DocumentNode<CheckOflUpdatesQuery, CheckOflUpdatesQueryVariables>;
export const TriggerOflImportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerOFLImport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportOptionsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerOFLImport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLImportStatsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalProcessed"}},{"kind":"Field","name":{"kind":"Name","value":"successfulImports"}},{"kind":"Field","name":{"kind":"Name","value":"failedImports"}},{"kind":"Field","name":{"kind":"Name","value":"skippedDuplicates"}},{"kind":"Field","name":{"kind":"Name","value":"updatedFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"durationSeconds"}}]}}]} as unknown as DocumentNode<TriggerOflImportMutation, TriggerOflImportMutationVariables>;
export const CancelOflImportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelOFLImport"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelOFLImport"}}]}}]} as unknown as DocumentNode<CancelOflImportMutation, CancelOflImportMutationVariables>;
export const OflImportProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OFLImportProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oflImportProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OFLImportStatusFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OFLImportStatusFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OFLImportStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isImporting"}},{"kind":"Field","name":{"kind":"Name","value":"phase"}},{"kind":"Field","name":{"kind":"Name","value":"currentManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"currentFixture"}},{"kind":"Field","name":{"kind":"Name","value":"totalFixtures"}},{"kind":"Field","name":{"kind":"Name","value":"importedCount"}},{"kind":"Field","name":{"kind":"Name","value":"failedCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"percentComplete"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedSecondsRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"oflVersion"}},{"kind":"Field","name":{"kind":"Name","value":"usingBundledData"}}]}}]} as unknown as DocumentNode<OflImportProgressSubscription, OflImportProgressSubscriptionVariables>;
export const GetProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"layoutCanvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"layoutCanvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectsQuery, GetProjectsQueryVariables>;
export const GetProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"layoutCanvasWidth"}},{"kind":"Field","name":{"kind":"Name","value":"layoutCanvasHeight"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"looks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cueLists"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"loop"}}]}}]}}]}}]} as unknown as DocumentNode<GetProjectQuery, GetProjectQueryVariables>;
export const CreateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}}]}}]}}]} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPersonal"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const DeleteProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const ImportProjectFromQlcDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportProjectFromQLC"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"xmlContent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"originalFileName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importProjectFromQLC"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"xmlContent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"xmlContent"}}},{"kind":"Argument","name":{"kind":"Name","value":"originalFileName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"originalFileName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"originalFileName"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"lookCount"}},{"kind":"Field","name":{"kind":"Name","value":"cueListCount"}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<ImportProjectFromQlcMutation, ImportProjectFromQlcMutationVariables>;
export const GetQlcFixtureMappingSuggestionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetQLCFixtureMappingSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getQLCFixtureMappingSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"lacyLightsFixtures"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}}]}},{"kind":"Field","name":{"kind":"Name","value":"suggestions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixture"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}}]}},{"kind":"Field","name":{"kind":"Name","value":"suggestions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"modes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"channelCount"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"defaultMappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lacyLightsKey"}},{"kind":"Field","name":{"kind":"Name","value":"qlcManufacturer"}},{"kind":"Field","name":{"kind":"Name","value":"qlcModel"}},{"kind":"Field","name":{"kind":"Name","value":"qlcMode"}}]}}]}}]}}]} as unknown as DocumentNode<GetQlcFixtureMappingSuggestionsQuery, GetQlcFixtureMappingSuggestionsQueryVariables>;
export const ExportProjectToQlcDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExportProjectToQLC"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fixtureMappings"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FixtureMappingInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportProjectToQLC"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"fixtureMappings"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fixtureMappings"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"xmlContent"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureCount"}},{"kind":"Field","name":{"kind":"Name","value":"lookCount"}},{"kind":"Field","name":{"kind":"Name","value":"cueListCount"}}]}}]}}]} as unknown as DocumentNode<ExportProjectToQlcMutation, ExportProjectToQlcMutationVariables>;
export const ExportProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ExportProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExportOptionsInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exportProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"projectName"}},{"kind":"Field","name":{"kind":"Name","value":"jsonContent"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitionsCount"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureInstancesCount"}},{"kind":"Field","name":{"kind":"Name","value":"looksCount"}},{"kind":"Field","name":{"kind":"Name","value":"cueListsCount"}},{"kind":"Field","name":{"kind":"Name","value":"cuesCount"}}]}}]}}]}}]} as unknown as DocumentNode<ExportProjectMutation, ExportProjectMutationVariables>;
export const ImportProjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ImportProject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jsonContent"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"options"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImportOptionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"importProject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"jsonContent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jsonContent"}}},{"kind":"Argument","name":{"kind":"Name","value":"options"},"value":{"kind":"Variable","name":{"kind":"Name","value":"options"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fixtureDefinitionsCreated"}},{"kind":"Field","name":{"kind":"Name","value":"fixtureInstancesCreated"}},{"kind":"Field","name":{"kind":"Name","value":"looksCreated"}},{"kind":"Field","name":{"kind":"Name","value":"cueListsCreated"}},{"kind":"Field","name":{"kind":"Name","value":"cuesCreated"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warnings"}}]}}]}}]} as unknown as DocumentNode<ImportProjectMutation, ImportProjectMutationVariables>;
export const GetSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetSettingsQuery, GetSettingsQueryVariables>;
export const GetSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetSettingQuery, GetSettingQueryVariables>;
export const UpdateSettingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSettingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateSettingMutation, UpdateSettingMutationVariables>;
export const GetSystemInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSystemInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"artnetBroadcastAddress"}},{"kind":"Field","name":{"kind":"Name","value":"artnetEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"fadeUpdateRateHz"}}]}}]}}]} as unknown as DocumentNode<GetSystemInfoQuery, GetSystemInfoQueryVariables>;
export const GetNetworkInterfaceOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNetworkInterfaceOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"networkInterfaceOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"broadcast"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"interfaceType"}}]}}]}}]} as unknown as DocumentNode<GetNetworkInterfaceOptionsQuery, GetNetworkInterfaceOptionsQueryVariables>;
export const SystemInfoUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SystemInfoUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemInfoUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"artnetBroadcastAddress"}},{"kind":"Field","name":{"kind":"Name","value":"artnetEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"fadeUpdateRateHz"}}]}}]}}]} as unknown as DocumentNode<SystemInfoUpdatedSubscription, SystemInfoUpdatedSubscriptionVariables>;
export const SetArtNetEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetArtNetEnabled"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setArtNetEnabled"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"fadeTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fadeTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"broadcastAddress"}}]}}]}}]} as unknown as DocumentNode<SetArtNetEnabledMutation, SetArtNetEnabledMutationVariables>;
export const GetUndoRedoStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUndoRedoStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"undoRedoStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"canUndo"}},{"kind":"Field","name":{"kind":"Name","value":"canRedo"}},{"kind":"Field","name":{"kind":"Name","value":"currentSequence"}},{"kind":"Field","name":{"kind":"Name","value":"totalOperations"}},{"kind":"Field","name":{"kind":"Name","value":"undoDescription"}},{"kind":"Field","name":{"kind":"Name","value":"redoDescription"}}]}}]}}]} as unknown as DocumentNode<GetUndoRedoStatusQuery, GetUndoRedoStatusQueryVariables>;
export const GetOperationHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOperationHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operationHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"perPage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"sequence"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"perPage"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentSequence"}}]}}]}}]} as unknown as DocumentNode<GetOperationHistoryQuery, GetOperationHistoryQueryVariables>;
export const GetOperationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOperation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"operationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sequence"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"relatedIds"}}]}}]}}]} as unknown as DocumentNode<GetOperationQuery, GetOperationQueryVariables>;
export const UndoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Undo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"undo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"restoredEntityId"}},{"kind":"Field","name":{"kind":"Name","value":"operation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"sequence"}}]}}]}}]}}]} as unknown as DocumentNode<UndoMutation, UndoMutationVariables>;
export const RedoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Redo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"redo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"restoredEntityId"}},{"kind":"Field","name":{"kind":"Name","value":"operation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"sequence"}}]}}]}}]}}]} as unknown as DocumentNode<RedoMutation, RedoMutationVariables>;
export const JumpToOperationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"JumpToOperation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"operationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jumpToOperation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"operationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"operationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"restoredEntityId"}},{"kind":"Field","name":{"kind":"Name","value":"operation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"operationType"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"sequence"}}]}}]}}]}}]} as unknown as DocumentNode<JumpToOperationMutation, JumpToOperationMutationVariables>;
export const ClearOperationHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearOperationHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"confirmClear"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearOperationHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"confirmClear"},"value":{"kind":"Variable","name":{"kind":"Name","value":"confirmClear"}}}]}]}}]} as unknown as DocumentNode<ClearOperationHistoryMutation, ClearOperationHistoryMutationVariables>;
export const OperationHistoryChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OperationHistoryChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"operationHistoryChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"projectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"projectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projectId"}},{"kind":"Field","name":{"kind":"Name","value":"canUndo"}},{"kind":"Field","name":{"kind":"Name","value":"canRedo"}},{"kind":"Field","name":{"kind":"Name","value":"currentSequence"}},{"kind":"Field","name":{"kind":"Name","value":"totalOperations"}},{"kind":"Field","name":{"kind":"Name","value":"undoDescription"}},{"kind":"Field","name":{"kind":"Name","value":"redoDescription"}}]}}]}}]} as unknown as DocumentNode<OperationHistoryChangedSubscription, OperationHistoryChangedSubscriptionVariables>;
export const GetSystemVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSystemVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemVersions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versionManagementSupported"}},{"kind":"Field","name":{"kind":"Name","value":"repositories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"repository"}},{"kind":"Field","name":{"kind":"Name","value":"installed"}},{"kind":"Field","name":{"kind":"Name","value":"latest"}},{"kind":"Field","name":{"kind":"Name","value":"updateAvailable"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastChecked"}}]}}]}}]} as unknown as DocumentNode<GetSystemVersionsQuery, GetSystemVersionsQueryVariables>;
export const GetAvailableVersionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAvailableVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repository"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"repository"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repository"}}}]}]}}]} as unknown as DocumentNode<GetAvailableVersionsQuery, GetAvailableVersionsQueryVariables>;
export const UpdateRepositoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRepository"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repository"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRepository"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"repository"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repository"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"repository"}},{"kind":"Field","name":{"kind":"Name","value":"previousVersion"}},{"kind":"Field","name":{"kind":"Name","value":"newVersion"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<UpdateRepositoryMutation, UpdateRepositoryMutationVariables>;
export const UpdateAllRepositoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAllRepositories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAllRepositories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"repository"}},{"kind":"Field","name":{"kind":"Name","value":"previousVersion"}},{"kind":"Field","name":{"kind":"Name","value":"newVersion"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<UpdateAllRepositoriesMutation, UpdateAllRepositoriesMutationVariables>;
export const GetBuildInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBuildInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buildInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"gitCommit"}},{"kind":"Field","name":{"kind":"Name","value":"buildTime"}}]}}]}}]} as unknown as DocumentNode<GetBuildInfoQuery, GetBuildInfoQueryVariables>;
export const WiFiNetworksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WiFiNetworks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rescan"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiNetworks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rescan"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rescan"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"security"}},{"kind":"Field","name":{"kind":"Name","value":"inUse"}},{"kind":"Field","name":{"kind":"Name","value":"saved"}}]}}]}}]} as unknown as DocumentNode<WiFiNetworksQuery, WiFiNetworksQueryVariables>;
export const WiFiStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WiFiStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"apConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"clientCount"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minutesRemaining"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectedClients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}}]}}]}}]}}]} as unknown as DocumentNode<WiFiStatusQuery, WiFiStatusQueryVariables>;
export const SavedWiFiNetworksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SavedWiFiNetworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedWifiNetworks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"security"}},{"kind":"Field","name":{"kind":"Name","value":"inUse"}},{"kind":"Field","name":{"kind":"Name","value":"saved"}}]}}]}}]} as unknown as DocumentNode<SavedWiFiNetworksQuery, SavedWiFiNetworksQueryVariables>;
export const ConnectWiFiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConnectWiFi"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"connectWiFi"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ssid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<ConnectWiFiMutation, ConnectWiFiMutationVariables>;
export const DisconnectWiFiDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisconnectWiFi"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disconnectWiFi"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}}]}}]}}]} as unknown as DocumentNode<DisconnectWiFiMutation, DisconnectWiFiMutationVariables>;
export const SetWiFiEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetWiFiEnabled"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setWiFiEnabled"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]} as unknown as DocumentNode<SetWiFiEnabledMutation, SetWiFiEnabledMutationVariables>;
export const ForgetWiFiNetworkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ForgetWiFiNetwork"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forgetWiFiNetwork"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ssid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ssid"}}}]}]}}]} as unknown as DocumentNode<ForgetWiFiNetworkMutation, ForgetWiFiNetworkMutationVariables>;
export const WiFiStatusUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WiFiStatusUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiStatusUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"connected"}},{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"signalStrength"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"apConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"clientCount"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minutesRemaining"}}]}},{"kind":"Field","name":{"kind":"Name","value":"connectedClients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}}]}}]}}]}}]} as unknown as DocumentNode<WiFiStatusUpdatedSubscription, WiFiStatusUpdatedSubscriptionVariables>;
export const WiFiModeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WiFiMode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiMode"}}]}}]} as unknown as DocumentNode<WiFiModeQuery, WiFiModeQueryVariables>;
export const ApConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"APConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ssid"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"clientCount"}},{"kind":"Field","name":{"kind":"Name","value":"timeoutMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minutesRemaining"}}]}}]}}]} as unknown as DocumentNode<ApConfigQuery, ApConfigQueryVariables>;
export const ApClientsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"APClients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"apClients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"macAddress"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"connectedAt"}}]}}]}}]} as unknown as DocumentNode<ApClientsQuery, ApClientsQueryVariables>;
export const StartApModeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartAPMode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startAPMode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]} as unknown as DocumentNode<StartApModeMutation, StartApModeMutationVariables>;
export const StopApModeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopAPMode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"connectToSSID"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopAPMode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"connectToSSID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"connectToSSID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]} as unknown as DocumentNode<StopApModeMutation, StopApModeMutationVariables>;
export const ResetApTimeoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetAPTimeout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetAPTimeout"}}]}}]} as unknown as DocumentNode<ResetApTimeoutMutation, ResetApTimeoutMutationVariables>;
export const WiFiModeChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"WiFiModeChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wifiModeChanged"}}]}}]} as unknown as DocumentNode<WiFiModeChangedSubscription, WiFiModeChangedSubscriptionVariables>;