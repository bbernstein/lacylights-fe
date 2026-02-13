import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { StreamDockProvider, useStreamDock, navigateToRoute } from '../StreamDockContext';

// Mock next/navigation
const mockPathname = '/cue-lists/123';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

// Mock UndoRedoContext
const mockUndo = jest.fn();
const mockRedo = jest.fn();
jest.mock('../UndoRedoContext', () => ({
  useUndoRedo: () => ({
    canUndo: true,
    canRedo: false,
    undo: mockUndo,
    redo: mockRedo,
    undoDescription: null,
    redoDescription: null,
    currentSequence: 0,
    totalOperations: 0,
    isLoading: false,
    lastMessage: null,
  }),
}));

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: unknown) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  url: string;
  send = jest.fn();
  close = jest.fn();

  constructor(url: string) {
    this.url = url;
    // Store reference to this instance for test access
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestMockWs = this;
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({});
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({});
  }

  simulateError() {
    this.onerror?.({});
  }

  // Required by the WebSocket interface
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

let latestMockWs: MockWebSocket;

// Replace global WebSocket before imports can capture it
const OriginalWebSocket = global.WebSocket;

beforeAll(() => {
  Object.defineProperty(global, 'WebSocket', {
    value: MockWebSocket,
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(global, 'WebSocket', {
    value: OriginalWebSocket,
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  jest.useFakeTimers();
  mockUndo.mockClear();
  mockRedo.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** Test component that exposes context values */
function TestConsumer() {
  const ctx = useStreamDock();
  return (
    <div>
      <span data-testid="connection-state">{ctx.connectionState}</span>
      <span data-testid="is-connected">{String(ctx.isConnected)}</span>
      <span data-testid="mode">{ctx.mode}</span>
    </div>
  );
}

describe('StreamDockContext', () => {
  describe('useStreamDock', () => {
    it('throws when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useStreamDock must be used within a StreamDockProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('StreamDockProvider', () => {
    it('renders children', () => {
      render(
        <StreamDockProvider>
          <div data-testid="child">Hello</div>
        </StreamDockProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('starts with connecting state and transitions to connected on open', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      // After the useEffect fires, it should be 'connecting'
      expect(screen.getByTestId('connection-state')).toHaveTextContent('connecting');

      // Simulate WebSocket opening
      act(() => {
        latestMockWs.simulateOpen();
      });

      expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
      expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
    });

    it('transitions to disconnected when WebSocket closes', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateClose();
      });

      expect(screen.getByTestId('connection-state')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
    });

    it('detects cue_player mode from route', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('cue_player');
    });

    it('sends state update on connection', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      expect(latestMockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(latestMockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('STATE_UPDATE');
      expect(sentMessage.payload.route).toBe('/cue-lists/123');
      expect(sentMessage.payload.mode).toBe('cue_player');
    });

    it('dispatches CUE_GO command to registered handler', () => {
      const handleGo = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerCuePlayerHandlers({
            handleGo,
            handlePrevious: jest.fn(),
            handleStop: jest.fn(),
            handleHurryUp: jest.fn(),
            handleJumpToCue: jest.fn(),
            handleHighlightCue: jest.fn(),
            handleFadeToBlack: jest.fn(),
          });
          return () => ctx.registerCuePlayerHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'CUE_GO' });
      });

      expect(handleGo).toHaveBeenCalledTimes(1);
    });

    it('dispatches CUE_JUMP command with payload', () => {
      const handleJumpToCue = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerCuePlayerHandlers({
            handleGo: jest.fn(),
            handlePrevious: jest.fn(),
            handleStop: jest.fn(),
            handleHurryUp: jest.fn(),
            handleJumpToCue,
            handleHighlightCue: jest.fn(),
            handleFadeToBlack: jest.fn(),
          });
          return () => ctx.registerCuePlayerHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({
          type: 'COMMAND',
          command: 'CUE_JUMP',
          payload: { cueIndex: 3 },
        });
      });

      expect(handleJumpToCue).toHaveBeenCalledWith(3);
    });

    it('handles REQUEST_STATE by sending state update', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      latestMockWs.send.mockClear();

      act(() => {
        latestMockWs.simulateMessage({ type: 'REQUEST_STATE' });
      });

      expect(latestMockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(latestMockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('STATE_UPDATE');
    });

    it('responds to PING with PONG', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      latestMockWs.send.mockClear();

      act(() => {
        latestMockWs.simulateMessage({ type: 'PING' });
      });

      expect(latestMockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(latestMockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('PONG');
    });

    it('publishes cue list state and sends update', () => {
      function StatePublisher() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.publishCueListState({
            id: 'cl-1',
            name: 'Test Cue List',
            currentCueIndex: 0,
            totalCues: 5,
            currentCueName: 'Cue 1',
            isPlaying: true,
            isPaused: false,
            isFading: false,
            fadeProgress: 0,
            canGo: true,
            canPrev: false,
            canStop: true,
          });
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <StatePublisher />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      const sentMessages = latestMockWs.send.mock.calls.map(
        (call: unknown[]) => JSON.parse(call[0] as string)
      );
      const stateUpdate = sentMessages.find(
        (msg: { type: string; payload?: { cueList?: unknown } }) =>
          msg.type === 'STATE_UPDATE' && msg.payload?.cueList
      );

      expect(stateUpdate).toBeDefined();
      expect(stateUpdate.payload.cueList.id).toBe('cl-1');
      expect(stateUpdate.payload.cueList.isPlaying).toBe(true);
    });

    it('handles error and transitions to error state', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateError();
      });

      expect(screen.getByTestId('connection-state')).toHaveTextContent('error');
    });

    it('cleans up WebSocket on unmount', () => {
      const { unmount } = render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      const wsInstance = latestMockWs;

      act(() => {
        wsInstance.simulateOpen();
      });

      unmount();

      expect(wsInstance.close).toHaveBeenCalled();
    });

    describe('NAVIGATE command security', () => {
      it('dispatches NAVIGATE command for internal routes', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        render(
          <StreamDockProvider>
            <TestConsumer />
          </StreamDockProvider>
        );

        act(() => {
          latestMockWs.simulateOpen();
        });

        act(() => {
          latestMockWs.simulateMessage({
            type: 'COMMAND',
            command: 'NAVIGATE',
            payload: { route: '/looks/123/edit' },
          });
        });

        // Internal route should not trigger a warning (actual navigation is not testable in jsdom)
        expect(warnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('NAVIGATE blocked')
        );

        warnSpy.mockRestore();
        consoleSpy.mockRestore();
      });

      it('blocks NAVIGATE for external URLs and logs warning', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        render(
          <StreamDockProvider>
            <TestConsumer />
          </StreamDockProvider>
        );

        act(() => {
          latestMockWs.simulateOpen();
        });

        act(() => {
          latestMockWs.simulateMessage({
            type: 'COMMAND',
            command: 'NAVIGATE',
            payload: { route: 'https://evil.com/phish' },
          });
        });

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('NAVIGATE blocked')
        );

        warnSpy.mockRestore();
      });

      it('blocks NAVIGATE for protocol-relative URLs and logs warning', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        render(
          <StreamDockProvider>
            <TestConsumer />
          </StreamDockProvider>
        );

        act(() => {
          latestMockWs.simulateOpen();
        });

        act(() => {
          latestMockWs.simulateMessage({
            type: 'COMMAND',
            command: 'NAVIGATE',
            payload: { route: '//evil.com/phish' },
          });
        });

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('NAVIGATE blocked')
        );

        warnSpy.mockRestore();
      });
    });

    it('sends PING as keep-alive instead of PONG', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      latestMockWs.send.mockClear();

      // Advance past the ping interval (15s)
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      expect(latestMockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(latestMockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('PING');
    });

    it('ignores malformed messages gracefully', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      // Should not throw
      act(() => {
        latestMockWs.onmessage?.({ data: 'not json' });
      });

      // Should still be connected
      expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
    });
  });
});

describe('navigateToRoute', () => {
  // Note: Actual navigation cannot be tested in jsdom, we only test validation logic
  it('returns true for valid internal routes', () => {
    // Suppress jsdom navigation errors
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(navigateToRoute('/looks/123/edit')).toBe(true);
    expect(navigateToRoute('/cue-lists/456')).toBe(true);
    expect(navigateToRoute('/')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('returns false and warns for external URLs', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    expect(navigateToRoute('https://evil.com')).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NAVIGATE blocked')
    );

    warnSpy.mockRestore();
  });

  it('returns false and warns for protocol-relative URLs', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    expect(navigateToRoute('//evil.com/phish')).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NAVIGATE blocked')
    );

    warnSpy.mockRestore();
  });

  it('returns false and warns for javascript: URLs', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    expect(navigateToRoute('javascript:alert(1)')).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NAVIGATE blocked')
    );

    warnSpy.mockRestore();
  });

  it('returns false and warns for data: URLs', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    expect(navigateToRoute('data:text/html,<h1>test</h1>')).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NAVIGATE blocked')
    );

    warnSpy.mockRestore();
  });

  it('returns false and warns for relative paths without leading slash', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    expect(navigateToRoute('looks/123')).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NAVIGATE blocked')
    );

    warnSpy.mockRestore();
  });

  describe('Effect Editor Commands', () => {
    it('dispatches EFFECT_SAVE command to registered handler', () => {
      const handleSave = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerEffectEditorHandlers({
            handleSave,
            handleUndo: jest.fn(),
            handleRedo: jest.fn(),
            handleStartStop: jest.fn(),
            handleCycleType: jest.fn(),
            handleTogglePreview: jest.fn(),
            handleSetParam: jest.fn(),
          });
          return () => ctx.registerEffectEditorHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'EFFECT_SAVE' });
      });

      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    it('dispatches EFFECT_SET_PARAM command with payload', () => {
      const handleSetParam = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerEffectEditorHandlers({
            handleSave: jest.fn(),
            handleUndo: jest.fn(),
            handleRedo: jest.fn(),
            handleStartStop: jest.fn(),
            handleCycleType: jest.fn(),
            handleTogglePreview: jest.fn(),
            handleSetParam,
          });
          return () => ctx.registerEffectEditorHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({
          type: 'COMMAND',
          command: 'EFFECT_SET_PARAM',
          payload: { paramName: 'speed', value: 75 },
        });
      });

      expect(handleSetParam).toHaveBeenCalledWith('speed', 75);
    });
  });

  describe('Look Board Commands', () => {
    it('dispatches BOARD_ACTIVATE_LOOK command with payload', () => {
      const handleActivateLook = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerLookBoardHandlers({
            handleActivateLook,
            handlePageNext: jest.fn(),
            handlePagePrev: jest.fn(),
            handleSetFadeTime: jest.fn(),
          });
          return () => ctx.registerLookBoardHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({
          type: 'COMMAND',
          command: 'BOARD_ACTIVATE_LOOK',
          payload: { lookId: 'look123', slotIndex: 2 },
        });
      });

      expect(handleActivateLook).toHaveBeenCalledWith('look123', 2);
    });

    it('dispatches BOARD_PAGE_NEXT command', () => {
      const handlePageNext = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerLookBoardHandlers({
            handleActivateLook: jest.fn(),
            handlePageNext,
            handlePagePrev: jest.fn(),
            handleSetFadeTime: jest.fn(),
          });
          return () => ctx.registerLookBoardHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'BOARD_PAGE_NEXT' });
      });

      expect(handlePageNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Global Commands', () => {
    it('dispatches GLOBAL_FTB command', () => {
      const handleFadeToBlack = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerGlobalHandlers({
            handleUndo: jest.fn(),
            handleRedo: jest.fn(),
            handleFadeToBlack,
            handleSetMaster: jest.fn(),
          });
          return () => ctx.registerGlobalHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'GLOBAL_FTB' });
      });

      expect(handleFadeToBlack).toHaveBeenCalledTimes(1);
    });

    it('dispatches GLOBAL_SET_MASTER command with intensity', () => {
      const handleSetMaster = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerGlobalHandlers({
            handleUndo: jest.fn(),
            handleRedo: jest.fn(),
            handleFadeToBlack: jest.fn(),
            handleSetMaster,
          });
          return () => ctx.registerGlobalHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({
          type: 'COMMAND',
          command: 'GLOBAL_SET_MASTER',
          payload: { intensity: 80 },
        });
      });

      expect(handleSetMaster).toHaveBeenCalledWith(80);
    });

    it('dispatches GLOBAL_UNDO command and calls undo', () => {
      // Don't register custom handlers - use the internal ones that call UndoRedoContext.undo()
      render(
        <StreamDockProvider>
          <div>Test</div>
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'GLOBAL_UNDO' });
      });

      expect(mockUndo).toHaveBeenCalledTimes(1);
    });

    it('dispatches GLOBAL_REDO command and calls redo', () => {
      // Don't register custom handlers - use the internal ones that call UndoRedoContext.redo()
      render(
        <StreamDockProvider>
          <div>Test</div>
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'GLOBAL_REDO' });
      });

      expect(mockRedo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout Commands', () => {
    it('dispatches LAYOUT_ZOOM command with delta', () => {
      const handleZoom = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerLayoutHandlers({
            handleZoom,
            handlePan: jest.fn(),
            handleSelectAll: jest.fn(),
            handleDeselectAll: jest.fn(),
            handleToggleSnap: jest.fn(),
            handleAutoLayout: jest.fn(),
            handleFitToView: jest.fn(),
          });
          return () => ctx.registerLayoutHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({
          type: 'COMMAND',
          command: 'LAYOUT_ZOOM',
          payload: { delta: 0.1 },
        });
      });

      expect(handleZoom).toHaveBeenCalledWith(0.1);
    });

    it('dispatches LAYOUT_PAN command with deltaX and deltaY', () => {
      const handlePan = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerLayoutHandlers({
            handleZoom: jest.fn(),
            handlePan,
            handleSelectAll: jest.fn(),
            handleDeselectAll: jest.fn(),
            handleToggleSnap: jest.fn(),
            handleAutoLayout: jest.fn(),
            handleFitToView: jest.fn(),
          });
          return () => ctx.registerLayoutHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({
          type: 'COMMAND',
          command: 'LAYOUT_PAN',
          payload: { deltaX: 10, deltaY: -5 },
        });
      });

      expect(handlePan).toHaveBeenCalledWith(10, -5);
    });

    it('dispatches LAYOUT_SELECT_ALL command', () => {
      const handleSelectAll = jest.fn();

      function HandlerRegistrar() {
        const ctx = useStreamDock();
        React.useEffect(() => {
          ctx.registerLayoutHandlers({
            handleZoom: jest.fn(),
            handlePan: jest.fn(),
            handleSelectAll,
            handleDeselectAll: jest.fn(),
            handleToggleSnap: jest.fn(),
            handleAutoLayout: jest.fn(),
            handleFitToView: jest.fn(),
          });
          return () => ctx.registerLayoutHandlers(null);
        }, [ctx]);
        return null;
      }

      render(
        <StreamDockProvider>
          <HandlerRegistrar />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      act(() => {
        latestMockWs.simulateMessage({ type: 'COMMAND', command: 'LAYOUT_SELECT_ALL' });
      });

      expect(handleSelectAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Commands', () => {
    // Note: Actual navigation cannot be tested in jsdom, we only test commands dispatch without errors
    it('handles NAV_GO_TO command', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      // Verify command doesn't throw
      expect(() => {
        act(() => {
          latestMockWs.simulateMessage({
            type: 'COMMAND',
            command: 'NAV_GO_TO',
            payload: { route: '/looks/456' },
          });
        });
      }).not.toThrow();
    });

    it('handles NAV_BACK command', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      // window.history.back() works in jsdom
      expect(() => {
        act(() => {
          latestMockWs.simulateMessage({ type: 'COMMAND', command: 'NAV_BACK' });
        });
      }).not.toThrow();
    });
  });

  describe('Cue List Browser Commands', () => {
    // Note: Actual navigation cannot be tested in jsdom, we only test commands dispatch without errors
    it('handles CUE_LIST_OPEN command', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      // Verify command doesn't throw
      expect(() => {
        act(() => {
          latestMockWs.simulateMessage({
            type: 'COMMAND',
            command: 'CUE_LIST_OPEN',
            payload: { cueListId: 'cue789' },
          });
        });
      }).not.toThrow();
    });

    it('handles CUE_LIST_CREATE command', () => {
      render(
        <StreamDockProvider>
          <TestConsumer />
        </StreamDockProvider>
      );

      act(() => {
        latestMockWs.simulateOpen();
      });

      // Verify command doesn't throw
      expect(() => {
        act(() => {
          latestMockWs.simulateMessage({ type: 'COMMAND', command: 'CUE_LIST_CREATE' });
        });
      }).not.toThrow();
    });
  });
});
