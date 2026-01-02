// Core Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  fixtures: FixtureInstance[];
  scenes: Scene[];
  cueLists: CueList[];
  users: ProjectUser[];
}

export interface FixtureDefinition {
  id: string;
  manufacturer: string;
  model: string;
  type: FixtureType;
  channels: ChannelDefinition[];
  modes: FixtureMode[];
  isBuiltIn: boolean;
  createdAt: string;
}

export interface FixtureMode {
  id: string;
  name: string;
  shortName?: string;
  channelCount: number;
  channels: ModeChannel[];
}

export interface ModeChannel {
  id: string;
  offset: number;
  channel: ChannelDefinition;
}

export interface ChannelDefinition {
  id: string;
  name: string;
  type: ChannelType;
  offset: number;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  fadeBehavior: FadeBehavior;
  isDiscrete: boolean;
}

export interface FixtureInstance {
  id: string;
  name: string;
  description?: string;
  
  // Flattened fixture definition info
  definitionId: string;
  manufacturer: string;
  model: string;
  type: FixtureType;
  
  // Flattened mode info
  modeName: string;
  channelCount: number;
  channels: InstanceChannel[];
  
  // DMX configuration
  project: Project;
  universe: number;
  startChannel: number;
  tags: string[];
  createdAt: string;

  // Ordering
  projectOrder?: number;

  // 2D Layout Position (normalized 0-1 coordinates)
  layoutX?: number;
  layoutY?: number;
  layoutRotation?: number;
}

export interface InstanceChannel {
  id: string;
  offset: number;
  name: string;
  type: ChannelType;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  fadeBehavior: FadeBehavior;
  isDiscrete: boolean;
}

export interface ChannelValue {
  offset: number;
  value: number;
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  project: Project;
  fixtureValues: FixtureValue[];
  createdAt: string;
  updatedAt: string;
}

export interface FixtureValue {
  id: string;
  fixture: FixtureInstance;
  channels: ChannelValue[]; // Sparse array of channel values
}

export interface SceneBoard {
  id: string;
  name: string;
  description?: string;
  project: Project;
  defaultFadeTime: number;
  gridSize?: number;
  canvasWidth: number; // Canvas width in pixels
  canvasHeight: number; // Canvas height in pixels
  buttons: SceneBoardButton[];
  createdAt: string;
  updatedAt: string;
}

export interface SceneBoardButton {
  id: string;
  sceneBoard: SceneBoard;
  scene: Scene;
  layoutX: number; // X position in pixels (0 to canvasWidth-1)
  layoutY: number; // Y position in pixels (0 to canvasHeight-1)
  width?: number; // Button width in pixels (default: 200)
  height?: number; // Button height in pixels (default: 120)
  color?: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CueList {
  id: string;
  name: string;
  description?: string;
  project: Project;
  cues: Cue[];
  createdAt: string;
  updatedAt: string;
}

export interface Cue {
  id: string;
  name: string;
  cueNumber: number;
  scene: Scene;
  fadeInTime: number;
  fadeOutTime: number;
  followTime?: number;
  notes?: string;
  easingType?: string;
}

export interface BulkCueUpdateInput {
  cueIds: string[];
  fadeInTime?: number;
  fadeOutTime?: number;
  followTime?: number;
  easingType?: string;
}

// Bulk Fixture Operations
export interface BulkFixtureCreateInput {
  fixtures: CreateFixtureInstanceInput[];
}

export interface FixtureUpdateItem {
  fixtureId: string;
  name?: string;
  description?: string;
  universe?: number;
  startChannel?: number;
  tags?: string[];
  layoutX?: number;
  layoutY?: number;
  layoutRotation?: number;
}

export interface BulkFixtureUpdateInput {
  fixtures: FixtureUpdateItem[];
}

export interface CueListPlaybackStatus {
  cueListId: string;
  currentCueIndex: number | null;
  /** True when scene values are currently active on DMX fixtures (stays true after fade until stopped) */
  isPlaying: boolean;
  /** True when the cue list is paused (scene activated outside cue context, cue index preserved) */
  isPaused: boolean;
  /** True when a fade transition is in progress (fade-in, fade-out, or crossfade) */
  isFading: boolean;
  currentCue?: Cue;
  fadeProgress?: number;
  lastUpdated: string;
}

/** Global playback status - which cue list is currently playing or paused (if any) */
export interface GlobalPlaybackStatus {
  /** True if any cue list is currently playing */
  isPlaying: boolean;
  /** True if a cue list is paused (scene activated outside cue context) */
  isPaused: boolean;
  /** True if a fade transition is in progress */
  isFading: boolean;
  /** ID of the currently playing cue list (null if not playing) */
  cueListId: string | null;
  /** Name of the currently playing cue list (null if not playing) */
  cueListName: string | null;
  /** Current cue index in the playing cue list (null if not playing) */
  currentCueIndex: number | null;
  /** Total number of cues in the playing cue list (null if not playing) */
  cueCount: number | null;
  /** Name of the currently playing cue (null if not playing) */
  currentCueName: string | null;
  /** Fade progress percentage (0-100) */
  fadeProgress: number | null;
  lastUpdated: string;
}

export interface UniverseOutput {
  universe: number;
  channels: number[];
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemInfo {
  artnetBroadcastAddress: string;
  artnetEnabled: boolean;
  fadeUpdateRateHz: number;
}

export interface ArtNetStatus {
  enabled: boolean;
  broadcastAddress: string;
}

export interface NetworkInterfaceOption {
  name: string;
  address: string;
  broadcast: string;
  description: string;
  interfaceType: string;
}

// WiFi Configuration Types
export interface WiFiNetwork {
  ssid: string;
  signalStrength: number;
  frequency: string;
  security: WiFiSecurityType;
  inUse: boolean;
  saved: boolean;
}

export enum WiFiSecurityType {
  OPEN = 'OPEN',
  WEP = 'WEP',
  WPA_PSK = 'WPA_PSK',
  WPA_EAP = 'WPA_EAP',
  WPA3_PSK = 'WPA3_PSK',
  WPA3_EAP = 'WPA3_EAP',
  OWE = 'OWE',
}

export enum WiFiMode {
  CLIENT = 'CLIENT',
  AP = 'AP',
  DISABLED = 'DISABLED',
  CONNECTING = 'CONNECTING',
  STARTING_AP = 'STARTING_AP',
}

export interface APConfig {
  ssid: string;
  ipAddress: string;
  channel: number;
  clientCount: number;
  timeoutMinutes: number;
  minutesRemaining?: number;
}

export interface APClient {
  macAddress: string;
  ipAddress?: string;
  hostname?: string;
  connectedAt: string;
}

export interface WiFiStatus {
  available: boolean;
  enabled: boolean;
  connected: boolean;
  ssid?: string;
  signalStrength?: number;
  ipAddress?: string;
  macAddress?: string;
  frequency?: string;
  mode: WiFiMode;
  apConfig?: APConfig;
  connectedClients?: APClient[];
}

export interface WiFiConnectionResult {
  success: boolean;
  message?: string;
  connected: boolean;
}

export interface WiFiModeResult {
  success: boolean;
  message?: string;
  mode: WiFiMode;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface ProjectUser {
  user: User;
  role: ProjectRole;
}

// Enums
export enum FixtureType {
  LED_PAR = 'LED_PAR',
  MOVING_HEAD = 'MOVING_HEAD',
  STROBE = 'STROBE',
  DIMMER = 'DIMMER',
  OTHER = 'OTHER'
}

export enum ChannelType {
  INTENSITY = 'INTENSITY',
  RED = 'RED',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  WHITE = 'WHITE',
  AMBER = 'AMBER',
  UV = 'UV',
  CYAN = 'CYAN',
  MAGENTA = 'MAGENTA',
  YELLOW = 'YELLOW',
  LIME = 'LIME',
  INDIGO = 'INDIGO',
  COLD_WHITE = 'COLD_WHITE',
  WARM_WHITE = 'WARM_WHITE',
  PAN = 'PAN',
  TILT = 'TILT',
  ZOOM = 'ZOOM',
  FOCUS = 'FOCUS',
  IRIS = 'IRIS',
  GOBO = 'GOBO',
  COLOR_WHEEL = 'COLOR_WHEEL',
  EFFECT = 'EFFECT',
  STROBE = 'STROBE',
  MACRO = 'MACRO',
  OTHER = 'OTHER'
}

/**
 * Determines how a channel behaves during scene transitions.
 *
 * @example
 * // FADE: Good for smooth transitions
 * dimmer.fadeBehavior = FadeBehavior.FADE;
 *
 * // SNAP: Good for discrete values like gobo slots
 * gobo.fadeBehavior = FadeBehavior.SNAP;
 *
 * // SNAP_END: Good for maintaining current value until fade completes
 * colorWheel.fadeBehavior = FadeBehavior.SNAP_END;
 */
export enum FadeBehavior {
  /** Smoothly interpolate between values during the transition. Best for intensity, colors, pan/tilt, zoom. */
  FADE = 'FADE',
  /** Jump instantly to target value at the START of the transition. Best for gobos, color wheels, macros, effects. */
  SNAP = 'SNAP',
  /** Hold the current value until the fade completes, then jump to target. Useful for discrete channels where you want the old value to remain visible throughout the crossfade. */
  SNAP_END = 'SNAP_END'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum ProjectRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

// Input Types
export interface ChannelFadeBehaviorInput {
  channelId: string;
  fadeBehavior: FadeBehavior;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface CreateFixtureInstanceInput {
  name: string;
  description?: string;
  definitionId: string;
  modeId?: string;
  projectId: string;
  universe: number;
  startChannel: number;
  tags?: string[];
}

export interface UpdateFixtureInstanceInput {
  name?: string;
  description?: string;
  definitionId?: string;
  modeId?: string;
  universe?: number;
  startChannel?: number;
  tags?: string[];
}

export interface CreateSceneInput {
  name: string;
  description?: string;
  projectId: string;
  fixtureValues: FixtureValueInput[];
}

export interface UpdateSceneInput {
  name?: string;
  description?: string;
  fixtureValues?: FixtureValueInput[];
}

export interface ChannelValueInput {
  offset: number;
  value: number;
}

export interface FixtureValueInput {
  fixtureId: string;
  channels: ChannelValueInput[]; // Sparse array of channel values
}

export interface FixtureDefinitionFilter {
  manufacturer?: string;
  model?: string;
  type?: FixtureType;
  isBuiltIn?: boolean;
  channelTypes?: ChannelType[];
}

export interface UpdateSettingInput {
  key: string;
  value: string;
}

// OFL (Open Fixture Library) Types
export enum OFLImportPhase {
  IDLE = 'IDLE',
  DOWNLOADING = 'DOWNLOADING',
  EXTRACTING = 'EXTRACTING',
  PARSING = 'PARSING',
  IMPORTING = 'IMPORTING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum OFLFixtureChangeType {
  NEW = 'NEW',
  UPDATED = 'UPDATED',
  UNCHANGED = 'UNCHANGED',
}

export interface OFLImportStats {
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  skippedDuplicates: number;
  updatedFixtures: number;
  durationSeconds: number;
}

export interface OFLImportStatus {
  isImporting: boolean;
  phase: OFLImportPhase;
  currentManufacturer?: string;
  currentFixture?: string;
  totalFixtures: number;
  importedCount: number;
  failedCount: number;
  skippedCount: number;
  percentComplete: number;
  startedAt?: string;
  completedAt?: string;
  estimatedSecondsRemaining?: number;
  errorMessage?: string;
  oflVersion?: string;
  usingBundledData: boolean;
}

export interface OFLFixtureUpdate {
  fixtureKey: string;
  manufacturer: string;
  model: string;
  changeType: OFLFixtureChangeType;
  isInUse: boolean;
  instanceCount: number;
  currentHash?: string;
  newHash: string;
}

export interface OFLUpdateCheckResult {
  currentFixtureCount: number;
  oflFixtureCount: number;
  newFixtureCount: number;
  changedFixtureCount: number;
  changedInUseCount: number;
  fixtureUpdates: OFLFixtureUpdate[];
  oflVersion: string;
  checkedAt: string;
}

export interface OFLImportResult {
  success: boolean;
  stats: OFLImportStats;
  errorMessage?: string;
  oflVersion: string;
}

export interface OFLImportOptionsInput {
  forceReimport?: boolean;
  updateInUseFixtures?: boolean;
  manufacturers?: string[];
  preferBundled?: boolean;
}