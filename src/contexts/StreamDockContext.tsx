'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Stream Dock connection state */
export type StreamDockConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Mode that the Stream Dock is operating in, determined by the current page */
export type StreamDockMode = 'cue_player' | 'look_editor' | 'color_picker' | 'navigation';

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
}

/** Color picker state published to the Stream Dock plugin */
export interface ColorPickerState {
  isOpen: boolean;
  hue: number;
  saturation: number;
  brightness: number;
  rgb: { r: number; g: number; b: number };
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
}

/** Handlers that can be registered by ColorPickerModal */
export interface ColorPickerHandlers {
  handleSetHSB: (hue: number, saturation: number, brightness: number) => void;
  handleSetRGB: (r: number, g: number, b: number) => void;
  handleApply: () => void;
  handleCancel: () => void;
  handleOpen: () => void;
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

  /** Publish cue list state (called by CueListPlayer when state changes) */
  publishCueListState: (state: CueListState | null) => void;
  /** Publish look editor state (called by LookEditorLayout when state changes) */
  publishLookEditorState: (state: LookEditorState | null) => void;
  /** Publish color picker state (called by ColorPickerModal when state changes) */
  publishColorPickerState: (state: ColorPickerState | null) => void;
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

  // State refs (set by components via publish, read for state updates)
  const cueListStateRef = useRef<CueListState | null>(null);
  const lookEditorStateRef = useRef<LookEditorState | null>(null);
  const colorPickerStateRef = useRef<ColorPickerState | null>(null);

  // ─── Mode detection ───────────────────────────────────────────────────────

  const detectMode = useCallback((route: string): StreamDockMode => {
    // Color picker overrides if open
    if (colorPickerStateRef.current?.isOpen) {
      return 'color_picker';
    }
    if (route.match(/\/cue-lists\//) || route.match(/\/player\//)) {
      return 'cue_player';
    }
    if (route.match(/\/looks\/.*\/edit/)) {
      return 'look_editor';
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
      }
    }

    // Navigation commands - validated to only allow internal routes
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
              dispatchCommand(
                (message as StreamDockCommand).command,
                (message as StreamDockCommand).payload,
              );
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

  // ─── State publishing (callbacks for components) ──────────────────────────

  const publishCueListState = useCallback((state: CueListState | null) => {
    cueListStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  const publishLookEditorState = useCallback((state: LookEditorState | null) => {
    lookEditorStateRef.current = state;
    sendStateUpdate();
  }, [sendStateUpdate]);

  const publishColorPickerState = useCallback((state: ColorPickerState | null) => {
    colorPickerStateRef.current = state;
    // Color picker may change the mode
    setMode(detectMode(pathname));
    sendStateUpdate();
  }, [sendStateUpdate, detectMode, pathname]);

  // ─── Context value ────────────────────────────────────────────────────────

  const contextValue: StreamDockContextType = {
    connectionState,
    isConnected: connectionState === 'connected',
    mode,
    registerCuePlayerHandlers,
    registerLookEditorHandlers,
    registerColorPickerHandlers,
    publishCueListState,
    publishLookEditorState,
    publishColorPickerState,
  };

  return (
    <StreamDockContext.Provider value={contextValue}>
      {children}
    </StreamDockContext.Provider>
  );
}
