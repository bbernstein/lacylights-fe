import { render, screen } from '@testing-library/react';
import ConnectionStatusIndicator from '../ConnectionStatusIndicator';
import * as WebSocketContext from '@/contexts/WebSocketContext';

// Mock the WebSocket context
jest.mock('@/contexts/WebSocketContext', () => ({
  useWebSocket: jest.fn(),
}));

describe('ConnectionStatusIndicator', () => {
  const mockUseWebSocket = WebSocketContext.useWebSocket as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Connection states', () => {
    it('should display "Live" when connected and healthy', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 1000,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: Live')).toBeInTheDocument();
    });

    it('should display "Stale" when connected but stale', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 25000,
        isStale: true,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('Stale')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: Stale')).toBeInTheDocument();
    });

    it('should display "Reconnecting" when reconnecting', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'reconnecting',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: Reconnecting')).toBeInTheDocument();
    });

    it('should display "Offline" when disconnected', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'disconnected',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: Offline')).toBeInTheDocument();
    });

    it('should display "Error" when in error state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'error',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: Error')).toBeInTheDocument();
    });

    it('should display "Idle" when connecting', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connecting',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('Idle')).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status: Idle')).toBeInTheDocument();
    });
  });

  describe('Relative time display', () => {
    it('should display "just now" for very recent messages', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 500,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should display seconds for recent messages', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 5000,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('5s ago')).toBeInTheDocument();
    });

    it('should display minutes for messages within an hour', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 120000, // 2 minutes
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('2m ago')).toBeInTheDocument();
    });

    it('should display hours for messages within a day', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 7200000, // 2 hours
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });

    it('should display days for old messages', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 172800000, // 2 days
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });

    it('should not display relative time when no messages received', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'disconnected',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
      expect(screen.queryByText('Never')).not.toBeInTheDocument();
    });
  });

  describe('Visual styling', () => {
    it('should have green styling for connected state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 1000,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      const dot = screen.getByLabelText('Connection status: Live');
      expect(dot).toHaveClass('bg-green-500');
    });

    it('should have yellow styling for stale state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 25000,
        isStale: true,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      const dot = screen.getByLabelText('Connection status: Stale');
      expect(dot).toHaveClass('bg-yellow-500');
    });

    it('should have orange styling for reconnecting state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'reconnecting',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      const dot = screen.getByLabelText('Connection status: Reconnecting');
      expect(dot).toHaveClass('bg-orange-500');
    });

    it('should have red styling for disconnected state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'disconnected',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      const dot = screen.getByLabelText('Connection status: Offline');
      expect(dot).toHaveClass('bg-red-500');
    });

    it('should have gray styling for idle state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connecting',
        lastMessageTime: null,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<ConnectionStatusIndicator />);

      const dot = screen.getByLabelText('Connection status: Idle');
      expect(dot).toHaveClass('bg-gray-500');
    });
  });

  describe('Tooltips', () => {
    it('should show tooltip for connected state', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 1000,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      const { container } = render(<ConnectionStatusIndicator />);
      const indicatorDiv = container.querySelector('[title*="Real-time updates active"]');

      expect(indicatorDiv).toBeInTheDocument();
    });

    it('should include last update time in tooltip when available', () => {
      mockUseWebSocket.mockReturnValue({
        connectionState: 'connected',
        lastMessageTime: Date.now() - 5000,
        isStale: false,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      });

      const { container } = render(<ConnectionStatusIndicator />);
      const indicatorDiv = container.querySelector('[title*="Last update:"]');

      expect(indicatorDiv).toBeInTheDocument();
    });
  });
});
