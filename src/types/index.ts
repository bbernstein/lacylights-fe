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
}

export interface InstanceChannel {
  id: string;
  offset: number;
  name: string;
  type: ChannelType;
  minValue: number;
  maxValue: number;
  defaultValue: number;
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
  channelValues: number[]; // Array of 0-255 values, index = channel offset
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
}

export interface BulkCueUpdateInput {
  cueIds: string[];
  fadeInTime?: number;
  fadeOutTime?: number;
  followTime?: number;
  easingType?: string;
}

export interface UniverseOutput {
  universe: number;
  channels: number[];
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

export interface FixtureValueInput {
  fixtureId: string;
  channelValues: number[]; // Array of 0-255 values, index = channel offset
}

export interface FixtureDefinitionFilter {
  manufacturer?: string;
  model?: string;
  type?: FixtureType;
  isBuiltIn?: boolean;
  channelTypes?: ChannelType[];
}