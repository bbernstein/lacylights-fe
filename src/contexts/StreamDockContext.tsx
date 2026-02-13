'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useUndoRedo } from './UndoRedoContext';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Stream Dock connection state */
export type StreamDockConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Mode that the Stream Dock is operating in, determined by the current page */
export type StreamDockMode =
  | 'cue_player'
  | 'look_editor_channels'
  | 'look_editor_layout'
  | 'color_picker'
  | 'effect_editor'
  | 'look_board'
  | 'cue_list_browser'
  | 'navigation';

/** Cue list state published to the Stream Dock plugin */
export interface CueListState {
  id: string;
  name: string;
  currentCueIndex: number;
  totalCues: number;
  currentCueName: string;
  isPlaying: boolean;
  isPaused: boolean;
  isFading: boolean;
  fadeProgress: number;
  canGo: boolean;
  canPrev: boolean;
  canStop: boolean;
}

/** Fixture summary for the look editor */
export interface FixtureSummary {
  id: string;
  name: string;
  channelCount: number;
}

/** Channel info for the look editor */
export interface ChannelInfo {
  index: number;
  name: string;
  type: string;
  value: number;
  min: number;
  max: number;
  active: boolean;
}

/** Look editor state published to the Stream Dock plugin */
export interface LookEditorState {
  lookId: string;
  lookName: string;
  fixtures: FixtureSummary[];
  selectedFixtureIndex: number;
  channels: ChannelInfo[];
  currentChannelIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  previewActive: boolean;
  // Layout mode fixture navigation (when no fixture is selected)
  highlightedFixtureId: string | null;
  fixtureOrderingMode: 'vertical' | 'horizontal';
}

/** Color picker state published to the Stream Dock plugin */
export interface ColorPickerState {
  isOpen: boolean;
  hue: number;
  saturation: number;
  brightness: number;
  rgb: { r: number; g: number; b: number };
  activeTab: 'wheel' | 'roscolux';
  highlightedRoscoluxIndex: number;
  totalRoscoluxSwatches: number;
}

/** Effect parameter for effect editor state */
export interface EffectParameter {
  name: string;
  value: number;
  min: number;
  max: number;
}

/** Effect editor state published to the Stream Dock plugin */
export interface EffectEditorState {
  effectId: string;
  effectName: string;
  effectType: string;
  isRunning: boolean;
  parameters: EffectParameter[];
  selectedParamIndex: number;
  // Note: canUndo/canRedo removed until undo/redo strategy is clarified
  // See EffectEditorLayout.tsx handlers for TODO comments about strategy
  isDirty: boolean;
}

/** Look board button for look board state */
export interface LookBoardButton {
  id: string;
  lookId: string;
  lookName: string;
  color: string;
  position: number;
}

/** Look board state published to the Stream Dock plugin */
export interface LookBoardState {
  boardId: string;
  boardName: string;
  buttons: LookBoardButton[];
  activeLookId: string | null;
  totalButtons: number;
  pageSize: number;
  currentPage: number;
  fadeTime: number;
}

/** Cue list browser item for cue list browser state */
export interface CueListBrowserItem {
  id: string;
  name: string;
  cueCount: number;
}

/** Cue list browser state published to the Stream Dock plugin */
export interface CueListBrowserState {
  cueLists: CueListBrowserItem[];
  highlightedIndex: number;
}

/** Global state published to the Stream Dock plugin */
export interface GlobalState {
  canUndo: boolean;
  canRedo: boolean;
  masterIntensity: number;
  isBlackedOut: boolean;
}

/** Complete state message sent to the plugin */
export interface StreamDockStateUpdate {
  type: 'STATE_UPDATE';
  payload: {
    route: string;
    mode: StreamDockMode;
    cueList?: CueListState;
    lookEditor?: LookEditorState;
    colorPicker?: ColorPickerState;
    effectEditor?: EffectEditorState;
    lookBoard?: LookBoardState;
    cueListBrowser?: CueListBrowserState;
    global?: GlobalState;
  };
}

/** Command sent from the plugin to the frontend */
export interface StreamDockCommand {
  type: 'COMMAND';
  command: string;
  payload?: Record<string, unknown>;
}

/** All possible messages from the plugin */
export type StreamDockIncomingMessage =
  | StreamDockCommand
  | { type: 'REQUEST_STATE' }
  | { type: 'PING' };

// ─── Command handler types ────────────────────────────────────────────────────

/** Handlers that can be registered by CueListPlayer */
export interface CuePlayerHandlers {
  handleGo: () => void;
  handlePrevious: () => void;
  handleStop: () => void;
  handleHurryUp: () => void;
  handleJumpToCue: (index: number) => void;
  handleHighlightCue: (index: number) => void;
  handleFadeToBlack: () => void;
}

/** Handlers that can be registered by LookEditorLayout */
export interface LookEditorHandlers {
  handleSave: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleTogglePreview: () => void;
  handleSelectFixture: (fixtureIndex: number) => void;
  handleSelectChannel: (channelIndex: number) => void;
  handleSetChannelValue: (channelIndex: number, value: number) => void;
  handleNextChannel: () => void;
  handlePrevChannel: () => void;
  handleToggleChannelActive: (channelIndex: number) => void;
  handleOpenColorPicker: () => void;
  // Layout mode fixture navigation (when no fixture is selected)
  handleNavigateFixture: (delta: number) => void;
  handleSelectHighlightedFixture: () => void;
  handleToggleFixtureOrdering: () => void;
}

/** Handlers that can be registered by ColorPickerModal */
export interface ColorPickerHandlers {
  handleSetHSB: (hue: number, saturation: number, brightness: number) => void;
  handleSetRGB: (r: number, g: number, b: number) => void;
  handleApply: () => void;
  handleCancel: () => void;
  handleOpen: () => void;
  handleToggleTab: () => void;
  handleNavigateRoscolux: (delta: number) => void;
  handleSelectHighlightedRoscolux: () => void;
}

/** Handlers that can be registered by Effect Editor */
export interface EffectEditorHandlers {
  handleSave: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleStartStop: () => void;
  handleCycleType: () => void;
  handleTogglePreview: () => void;
  handleSetParam: (paramName: string, value: number) => void;
}

/** Handlers that can be registered by Look Board */
export interface LookBoardHandlers {
  handleActivateLook: (lookId: string, slotIndex: number) => void;
  handlePageNext: () => void;
  handlePagePrev: () => void;
  handleSetFadeTime: (seconds: number) => void;
}

/** Handlers that can be registered globally */
export interface GlobalHandlers {
  handleUndo: () => void;
  handleRedo: () => void;
  handleFadeToBlack: () => void;
  handleSetMaster: (intensity: number) => void;
}

/** Handlers that can be registered by Layout Editor */
export interface LayoutHandlers {
  handleZoom: (delta: number) => void;
  handlePan: (deltaX: number, deltaY: number) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleToggleSnap: () => void;
  handleAutoLayout: () => void;
  handleFitToView: () => void;
}

// ─── Context Interface ────────────────────────────────────────────────────────

interface StreamDockContextType {
  /** Current connection state of the Stream Dock WebSocket bridge */
  connectionState: StreamDockConnectionState;
  /** Whether a Stream Dock plugin is currently connected */
  isConnected: boolean;
  /** Current operating mode based on the browser page */
  mode: StreamDockMode;

  /** Register handlers from CueListPlayer */
  registerCuePlayerHandlers: (handlers: CuePlayerHandlers | null) => void;
  /** Register handlers from LookEditorLayout */
  registerLookEditorHandlers: (handlers: LookEditorHandlers | null) => void;
  /** Register handlers from ColorPickerModal */
  registerColorPickerHandlers: (handlers: ColorPickerHandlers | null) => void;
  /** Register handlers from Effect Editor */
  registerEffectEditorHandlers: (handlers: EffectEditorHandlers | null) => void;
  /** Register handlers from Look Board */
  registerLookBoardHandlers: (handlers: LookBoardHandlers | null) => void;
  /** Register handlers globally */
  registerGlobalHandlers: (handlers: GlobalHandlers | null) => void;
  /** Register handlers from Layout Editor */
  registerLayoutHandlers: (handlers: LayoutHandlers | null) => void;

  /** Publish cue list state (called by CueListPlayer when state changes) */
  publishCueListState: (state: CueListState | null) => void;
  /** Publish look editor state (called by LookEditorLayout when state changes) */
  publishLookEditorState: (state: LookEditorState | null) => void;
  /** Publish color picker state (called by ColorPickerModal when state changes) */
  publishColorPickerState: (state: ColorPickerState | null) => void;
  /** Publish effect editor state (called by Effect Editor when state changes) */
  publishEffectEditorState: (state: EffectEditorState | null) => void;
  /** Publish look board state (called by Look Board when state changes) */
  publishLookBoardState: (state: LookBoardState | null) => void;
  /** Publish cue list browser state (called by Cue List Browser when state changes) */
  publishCueListBrowserState: (state: CueListBrowserState | null) => void;
  /** Publish global state (called when global state changes) */
  publishGlobalState: (state: GlobalState | null) => void;
}

const StreamDockContext = createContext<StreamDockContextType | undefined>(undefined);

/**
 * Hook to access Stream Dock integration state and controls.
 *
 * @throws {Error} If used outside of StreamDockProvider
 */
export function useStreamDock(): StreamDockContextType {
  const context = useContext(StreamDockContext);
  if (!context) {
    throw new Error('useStreamDock must be used within a StreamDockProvider');
  }
  return context;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STREAM_DOCK_WS_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_STREAM_DOCK_WS_URL) ||
  'ws://127.0.0.1:4100';
const RECONNECT_INTERVAL_MS = 5000;
const PING_INTERVAL_MS = 15000;

// Stream Deck hardware constants
export const STREAM_DECK_LOOK_BUTTON_COUNT = 7; // Number of look buttons on Stream Deck Plus LCD
const DEFAULT_MASTER_INTENSITY = 100; // Default master intensity percentage

/**
 * Validate and perform navigation for Stream Dock NAVIGATE commands.
 * Only allows internal routes (paths starting with '/' but not '//').
 * Exported for testing.
 */
export function navigateToRoute(route: string): boolean {
  if (route.startsWith('/') && !route.startsWith('//')) {
    window.location.assign(route);
    return true;
  }
  console.warn(`Stream Dock NAVIGATE blocked: invalid route "${route}"`);
  return false;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface StreamDockProviderProps {
  children: ReactNode;
}

/**
 * Stream Dock Provider Component
 *
 * Manages the WebSocket connection to the Stream Dock plugin running on localhost:4100.
 * Publishes frontend state changes and dispatches incoming commands to registered handlers.
 *
 * Key behaviors:
 * - Connects to ws://127.0.0.1:4100 (local only, no remote access)
 * - Gracefully handles absent plugin (no errors if port 4100 not available)
 * - Auto-reconnects every 5 seconds when disconnected
 * - Sends state updates whenever published state changes
 * - Dispatches incoming commands to registered component handlers
 * - Automatically detects mode from current route
 */
export function StreamDockProvider({ children }: StreamDockProviderProps): JSX.Element {
  const pathname = usePathname();

  // Connection state
  const [connectionState, setConnectionState] = useState<StreamDockConnectionState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Handler refs (set by components, read by command dispatcher)
  const cuePlayerHandlersRef = useRef<CuePlayerHandlers | null>(null);
  const lookEditorHandlersRef = useRef<LookEditorHandlers | null>(null);
  const colorPickerHandlersRef = useRef<ColorPickerHandlers | null>(null);
  const effectEditorHandlersRef = useRef<EffectEditorHandlers | null>(null);
  const lookBoardHandlersRef = useRef<LookBoardHandlers | null>(null);
  const globalHandlersRef = useRef<GlobalHandlers | null>(null);
  const layoutHandlersRef = useRef<LayoutHandlers | null>(null);

  // State refs (set by components via publish, read for state updates)
  const cueListStateRef = useRef<CueListState | null>(null);
  const lookEditorStateRef = useRef<LookEditorState | null>(null);
  const colorPickerStateRef = useRef<ColorPickerState | null>(null);
  const effectEditorStateRef = useRef<EffectEditorState | null>(null);
  const lookBoardStateRef = useRef<LookBoardState | null>(null);
  const cueListBrowserStateRef = useRef<CueListBrowserState | null>(null);
  const globalStateRef = useRef<GlobalState | null>(null);

  // Get undo/redo state from UndoRedoContext
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  // ─── Mode detection ───────────────────────────────────────────────────────

  const detectMode = useCallback((route: string): StreamDockMode => {
    // Color picker overrides if open
    if (colorPickerStateRef.current?.isOpen) {
      return 'color_picker';
    }
    // Cue list player
    if (route.match(/\/cue-lists\//) || route.match(/\/player\//)) {
      return 'cue_player';
    }
    // Look editor - channels mode (default) or layout mode
    if (route.match(/\/looks\/.*\/edit/)) {
      // Check if a fixture is selected - if not, we're in layout mode
      const lookEditor = lookEditorStateRef.current;
      if (lookEditor && lookEditor.selectedFixtureIndex === -1) {
        return 'look_editor_layout';
      }
      return 'look_editor_channels';
    }
    // Effect editor
    if (route.match(/\/effects\/.*\/edit/)) {
      return 'effect_editor';
    }
    // Look board (handles both /look-board/{id} and /look-board?board={id} formats)
    if (route.startsWith('/look-board')) {
      return 'look_board';
    }
    // Cue list browser
    if (route === '/cue-lists' || route.startsWith('/cue-lists?')) {
      return 'cue_list_browser';
    }
    return 'navigation';
  }, []);

  const [mode, setMode] = useState<StreamDockMode>(() => detectMode(pathname));

  // Update mode when route changes
  useEffect(() => {
    setMode(detectMode(pathname));
  }, [pathname, detectMode]);

  // ─── Send state update to plugin ──────────────────────────────────────────

  const sendStateUpdate = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const currentMode = detectMode(pathname);
    const message: StreamDockStateUpdate = {
      type: 'STATE_UPDATE',
      payload: {
        route: pathname,
        mode: currentMode,
        ...(cueListStateRef.current && { cueList: cueListStateRef.current }),
        ...(lookEditorStateRef.current && { lookEditor: lookEditorStateRef.current }),
        ...(colorPickerStateRef.current && { colorPicker: colorPickerStateRef.current }),
        ...(effectEditorStateRef.current && { effectEditor: effectEditorStateRef.current }),
        ...(lookBoardStateRef.current && { lookBoard: lookBoardStateRef.current }),
        ...(cueListBrowserStateRef.current && { cueListBrowser: cueListBrowserStateRef.current }),
        ...(globalStateRef.current && { global: globalStateRef.current }),
      },
    };

    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Silently ignore send errors - connection will be cleaned up by onclose/onerror
    }
  }, [pathname, detectMode]);

  // ─── Command dispatcher ───────────────────────────────────────────────────

  const dispatchCommand = useCallback((command: string, payload?: Record<string, unknown>) => {
    // Cue Player commands
    const cueHandlers = cuePlayerHandlersRef.current;
    if (cueHandlers) {
      switch (command) {
        case 'CUE_GO': cueHandlers.handleGo(); return;
        case 'CUE_PREVIOUS': cueHandlers.handlePrevious(); return;
        case 'CUE_STOP': cueHandlers.handleStop(); return;
        case 'CUE_HURRY': cueHandlers.handleHurryUp(); return;
        case 'CUE_FADE_TO_BLACK': cueHandlers.handleFadeToBlack(); return;
        case 'CUE_JUMP':
          if (payload && typeof payload.cueIndex === 'number') {
            cueHandlers.handleJumpToCue(payload.cueIndex);
          }
          return;
        case 'CUE_HIGHLIGHT':
          if (payload && typeof payload.cueIndex === 'number') {
            cueHandlers.handleHighlightCue(payload.cueIndex);
          }
          return;
      }
    }

    // Look Editor commands
    const editorHandlers = lookEditorHandlersRef.current;
    if (editorHandlers) {
      switch (command) {
        case 'EDITOR_SAVE': editorHandlers.handleSave(); return;
        case 'EDITOR_UNDO': editorHandlers.handleUndo(); return;
        case 'EDITOR_REDO': editorHandlers.handleRedo(); return;
        case 'EDITOR_TOGGLE_PREVIEW': editorHandlers.handleTogglePreview(); return;
        case 'EDITOR_SELECT_FIXTURE':
          if (payload && typeof payload.fixtureIndex === 'number') {
            editorHandlers.handleSelectFixture(payload.fixtureIndex);
          }
          return;
        case 'EDITOR_SELECT_CHANNEL':
          if (payload && typeof payload.channelIndex === 'number') {
            editorHandlers.handleSelectChannel(payload.channelIndex);
          }
          return;
        case 'EDITOR_SET_CHANNEL_VALUE':
          if (payload && typeof payload.channelIndex === 'number' && typeof payload.value === 'number') {
            editorHandlers.handleSetChannelValue(payload.channelIndex, payload.value);
          }
          return;
        case 'EDITOR_NEXT_CHANNEL': editorHandlers.handleNextChannel(); return;
        case 'EDITOR_PREV_CHANNEL': editorHandlers.handlePrevChannel(); return;
        case 'EDITOR_TOGGLE_CHANNEL_ACTIVE':
          if (payload && typeof payload.channelIndex === 'number') {
            editorHandlers.handleToggleChannelActive(payload.channelIndex);
          }
          return;
        case 'COLOR_OPEN': editorHandlers.handleOpenColorPicker(); return;
        case 'EDITOR_NAVIGATE_FIXTURE':
          if (payload && typeof payload.delta === 'number') {
            editorHandlers.handleNavigateFixture(payload.delta);
          }
          return;
        case 'EDITOR_SELECT_HIGHLIGHTED_FIXTURE': editorHandlers.handleSelectHighlightedFixture(); return;
        case 'EDITOR_TOGGLE_FIXTURE_ORDERING': editorHandlers.handleToggleFixtureOrdering(); return;
      }
    }

    // Color Picker commands
    const colorHandlers = colorPickerHandlersRef.current;
    if (colorHandlers) {
      switch (command) {
        case 'COLOR_SET_HSB':
          if (payload && typeof payload.hue === 'number' && typeof payload.saturation === 'number' && typeof payload.brightness === 'number') {
            colorHandlers.handleSetHSB(payload.hue, payload.saturation, payload.brightness);
          }
          return;
        case 'COLOR_SET_RGB':
          if (payload && typeof payload.r === 'number' && typeof payload.g === 'number' && typeof payload.b === 'number') {
            colorHandlers.handleSetRGB(payload.r, payload.g, payload.b);
          }
          return;
        case 'COLOR_APPLY': colorHandlers.handleApply(); return;
        case 'COLOR_CANCEL': colorHandlers.handleCancel(); return;
        case 'COLOR_OPEN': colorHandlers.handleOpen(); return;
        case 'COLOR_TOGGLE_TAB': colorHandlers.handleToggleTab(); return;
        case 'COLOR_NAVIGATE_ROSCOLUX':
          if (payload && typeof payload.delta === 'number') {
            colorHandlers.handleNavigateRoscolux(payload.delta);
          }
          return;
        case 'COLOR_SELECT_ROSCOLUX': colorHandlers.handleSelectHighlightedRoscolux(); return;
      }
    }

    // Effect Editor commands
    const effectHandlers = effectEditorHandlersRef.current;
    if (effectHandlers) {
      switch (command) {
        case 'EFFECT_SAVE': effectHandlers.handleSave(); return;
        case 'EFFECT_UNDO': effectHandlers.handleUndo(); return;
        case 'EFFECT_REDO': effectHandlers.handleRedo(); return;
        case 'EFFECT_START_STOP': effectHandlers.handleStartStop(); return;
        case 'EFFECT_CYCLE_TYPE': effectHandlers.handleCycleType(); return;
        case 'EFFECT_TOGGLE_PREVIEW': effectHandlers.handleTogglePreview(); return;
        case 'EFFECT_SET_PARAM':
          if (payload && typeof payload.paramName === 'string' && typeof payload.value === 'number') {
            effectHandlers.handleSetParam(payload.paramName, payload.value);
          }
          return;
      }
    }

    // Look Board commands
    const boardHandlers = lookBoardHandlersRef.current;
    if (boardHandlers) {
      switch (command) {
        case 'BOARD_ACTIVATE_LOOK':
          if (payload && typeof payload.lookId === 'string' && typeof payload.slotIndex === 'number') {
            boardHandlers.handleActivateLook(payload.lookId, payload.slotIndex);
          }
          return;
        case 'BOARD_PAGE_NEXT': boardHandlers.handlePageNext(); return;
        case 'BOARD_PAGE_PREV': boardHandlers.handlePagePrev(); return;
        case 'BOARD_SET_FADE_TIME':
          if (
            payload &&
            typeof payload.seconds === 'number' &&
            Number.isFinite(payload.seconds) &&
            payload.seconds >= 0
          ) {
            boardHandlers.handleSetFadeTime(payload.seconds);
          }
          return;
      }
    }

    // Global commands
    const globalHandlers = globalHandlersRef.current;
    if (globalHandlers) {
      switch (command) {
        case 'GLOBAL_UNDO': globalHandlers.handleUndo(); return;
        case 'GLOBAL_REDO': globalHandlers.handleRedo(); return;
        case 'GLOBAL_FTB': globalHandlers.handleFadeToBlack(); return;
        case 'GLOBAL_SET_MASTER':
          if (payload && typeof payload.intensity === 'number') {
            globalHandlers.handleSetMaster(payload.intensity);
          }
          return;
      }
    }

    // Layout commands
    const layoutHandlers = layoutHandlersRef.current;
    if (layoutHandlers) {
      switch (command) {
        case 'LAYOUT_ZOOM':
          if (payload && typeof payload.delta === 'number') {
            layoutHandlers.handleZoom(payload.delta);
          }
          return;
        case 'LAYOUT_PAN':
          if (payload && typeof payload.deltaX === 'number' && typeof payload.deltaY === 'number') {
            layoutHandlers.handlePan(payload.deltaX, payload.deltaY);
          }
          return;
        case 'LAYOUT_SELECT_ALL': layoutHandlers.handleSelectAll(); return;
        case 'LAYOUT_DESELECT_ALL': layoutHandlers.handleDeselectAll(); return;
        case 'LAYOUT_TOGGLE_SNAP': layoutHandlers.handleToggleSnap(); return;
        case 'LAYOUT_AUTO_LAYOUT': layoutHandlers.handleAutoLayout(); return;
        case 'LAYOUT_FIT_TO_VIEW': layoutHandlers.handleFitToView(); return;
      }
    }

    // Cue List Browser commands
    if (command === 'CUE_LIST_OPEN' && payload && typeof payload.cueListId === 'string') {
      // Validate cueListId to prevent path injection - only allow alphanumeric, dash, underscore
      if (!/^[a-zA-Z0-9_-]+$/.test(payload.cueListId)) {
        console.warn(
          '[StreamDock] Ignoring CUE_LIST_OPEN with invalid cueListId',
          { cueListId: payload.cueListId }
        );
        return;
      }
      navigateToRoute(`/cue-lists/${payload.cueListId}`);
      return;
    }
    if (command === 'CUE_LIST_CREATE') {
      navigateToRoute('/cue-lists/new');
      return;
    }

    // Navigation commands - validated to only allow internal routes
    if (command === 'NAV_GO_TO' && payload && typeof payload.route === 'string') {
      navigateToRoute(payload.route);
      return;
    }
    if (command === 'NAV_BACK') {
      window.history.back();
      return;
    }
    // Legacy NAVIGATE command for backward compatibility
    if (command === 'NAVIGATE' && payload && typeof payload.route === 'string') {
      navigateToRoute(payload.route);
    }
  }, []);

  // ─── WebSocket connection management ──────────────────────────────────────

  // Use a ref for connect to break the circular dependency between connect and scheduleReconnect
  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connectRef.current();
      }
    }, RECONNECT_INTERVAL_MS);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState('connecting');

    try {
      const ws = new WebSocket(STREAM_DOCK_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionState('connected');

        // Send initial state
        sendStateUpdate();

        // Start keep-alive ping interval
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'PING' }));
            } catch {
              // ignore
            }
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const message = JSON.parse(event.data) as StreamDockIncomingMessage;

          switch (message.type) {
            case 'COMMAND':
              try {
                dispatchCommand(
                  (message as StreamDockCommand).command,
                  (message as StreamDockCommand).payload,
                );
              } catch (error) {
                console.error(
                  '[StreamDock] Command handler error:',
                  (message as StreamDockCommand).command,
                  error
                );
              }
              break;
            case 'REQUEST_STATE':
              sendStateUpdate();
              break;
            case 'PING':
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'PONG' }));
              }
              break;
          }
        } catch {
          // Silently ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setConnectionState('disconnected');
        wsRef.current = null;

        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }

        // Schedule reconnect
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after onerror, so we handle cleanup there
        // Just update state to show error briefly
        if (isMountedRef.current) {
          setConnectionState('error');
        }
      };
    } catch {
      // WebSocket constructor can throw if URL is invalid, but ours is hardcoded
      if (isMountedRef.current) {
        setConnectionState('error');
        scheduleReconnect();
      }
    }
  }, [sendStateUpdate, dispatchCommand, scheduleReconnect]);

  // Keep the ref in sync with the latest connect function
  connectRef.current = connect;

  // Initial connection and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // ─── Handler registration (callbacks for components) ──────────────────────

  const registerCuePlayerHandlers = useCallback((handlers: CuePlayerHandlers | null) => {
    cuePlayerHandlersRef.current = handlers;
  }, []);

  const registerLookEditorHandlers = useCallback((handlers: LookEditorHandlers | null) => {
    lookEditorHandlersRef.current = handlers;
  }, []);

  const registerColorPickerHandlers = useCallback((handlers: ColorPickerHandlers | null) => {
    colorPickerHandlersRef.current = handlers;
  }, []);

  const registerEffectEditorHandlers = useCallback((handlers: EffectEditorHandlers | null) => {
    effectEditorHandlersRef.current = handlers;
  }, []);

  const registerLookBoardHandlers = useCallback((handlers: LookBoardHandlers | null) => {
    lookBoardHandlersRef.current = handlers;
  }, []);

  const registerGlobalHandlers = useCallback((handlers: GlobalHandlers | null) => {
    globalHandlersRef.current = handlers;
  }, []);

  const registerLayoutHandlers = useCallback((handlers: LayoutHandlers | null) => {
    layoutHandlersRef.current = handlers;
  }, []);

  // ─── State publishing (callbacks for components) ──────────────────────────

  const publishCueListState = useCallback((state: CueListState | null) => {
    cueListStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  const publishLookEditorState = useCallback((state: LookEditorState | null) => {
    lookEditorStateRef.current = state;
    // Look editor may change mode between channels and layout
    setMode(detectMode(pathname));
    sendStateUpdate();
  }, [sendStateUpdate, detectMode, pathname]);

  const publishColorPickerState = useCallback((state: ColorPickerState | null) => {
    colorPickerStateRef.current = state;
    // Color picker may change the mode
    setMode(detectMode(pathname));
    sendStateUpdate();
  }, [sendStateUpdate, detectMode, pathname]);

  const publishEffectEditorState = useCallback((state: EffectEditorState | null) => {
    effectEditorStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  const publishLookBoardState = useCallback((state: LookBoardState | null) => {
    lookBoardStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  const publishCueListBrowserState = useCallback((state: CueListBrowserState | null) => {
    cueListBrowserStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  const publishGlobalState = useCallback((state: GlobalState | null) => {
    globalStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  // ─── Global state publishing ──────────────────────────────────────────────

  // Publish global state when undo/redo status changes
  useEffect(() => {
    const globalState: GlobalState = {
      canUndo,
      canRedo,
      masterIntensity: DEFAULT_MASTER_INTENSITY, // TODO: Track master intensity when implemented
      isBlackedOut: false,  // TODO: Track blackout status when implemented
    };

    globalStateRef.current = globalState;
    sendStateUpdate();
  }, [canUndo, canRedo, sendStateUpdate]);

  // Register global handlers
  useEffect(() => {
    const handlers: GlobalHandlers = {
      handleUndo: () => {
        undo();
      },
      handleRedo: () => {
        redo();
      },
      handleFadeToBlack: () => {
        // TODO: Implement fade to black when backend supports it
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Fade to black triggered from Stream Deck');
        }
      },
      handleSetMaster: (_intensity: number) => {
        // TODO: Implement master intensity control when backend supports it
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Set master intensity triggered from Stream Deck:', _intensity);
        }
      },
    };

    globalHandlersRef.current = handlers;

    return () => {
      globalHandlersRef.current = null;
    };
  }, [undo, redo]);

  // ─── Context value ────────────────────────────────────────────────────────

  const contextValue: StreamDockContextType = useMemo(
    () => ({
      connectionState,
      isConnected: connectionState === 'connected',
      mode,
      registerCuePlayerHandlers,
      registerLookEditorHandlers,
      registerColorPickerHandlers,
      registerEffectEditorHandlers,
      registerLookBoardHandlers,
      registerGlobalHandlers,
      registerLayoutHandlers,
      publishCueListState,
      publishLookEditorState,
      publishColorPickerState,
      publishEffectEditorState,
      publishLookBoardState,
      publishCueListBrowserState,
      publishGlobalState,
    }),
    [
      connectionState,
      mode,
      registerCuePlayerHandlers,
      registerLookEditorHandlers,
      registerColorPickerHandlers,
      registerEffectEditorHandlers,
      registerLookBoardHandlers,
      registerGlobalHandlers,
      registerLayoutHandlers,
      publishCueListState,
      publishLookEditorState,
      publishColorPickerState,
      publishEffectEditorState,
      publishLookBoardState,
      publishCueListBrowserState,
      publishGlobalState,
    ]
  );

  return (
    <StreamDockContext.Provider value={contextValue}>
      {children}
    </StreamDockContext.Provider>
  );
}
