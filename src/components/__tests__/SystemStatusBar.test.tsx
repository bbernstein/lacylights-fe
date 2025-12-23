import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import SystemStatusBar from '../SystemStatusBar';
import { GET_SYSTEM_INFO, SYSTEM_INFO_UPDATED } from '@/graphql/settings';
import { GET_GLOBAL_PLAYBACK_STATUS, GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION } from '@/graphql/cueLists';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

// Mock next/navigation with a mock push function we can test
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the WebSocket context dependencies
jest.mock('@/lib/apollo-client', () => ({
  wsClient: {
    dispose: jest.fn(),
  },
}));

jest.mock('@/hooks/usePageVisibility', () => ({
  usePageVisibility: jest.fn(() => true),
}));

const mockSystemInfoEnabled = {
  artnetEnabled: true,
  artnetBroadcastAddress: '192.168.1.255',
};

const mockSystemInfoDisabled = {
  artnetEnabled: false,
  artnetBroadcastAddress: '10.0.0.255',
};

type GlobalPlaybackMock = {
  isPlaying: boolean;
  isFading: boolean;
  cueListId: string | null;
  cueListName: string | null;
  currentCueIndex: number | null;
  cueCount: number | null;
  currentCueName: string | null;
  fadeProgress: number | null;
  lastUpdated: string;
};

const mockGlobalPlaybackNotPlaying: GlobalPlaybackMock = {
  isPlaying: false,
  isFading: false,
  cueListId: null,
  cueListName: null,
  currentCueIndex: null,
  cueCount: null,
  currentCueName: null,
  fadeProgress: null,
  lastUpdated: '2023-01-01T12:00:00Z',
};

const mockGlobalPlaybackPlaying: GlobalPlaybackMock = {
  isPlaying: true,
  isFading: false,
  cueListId: 'test-list-123',
  cueListName: 'Main Show',
  currentCueIndex: 2,
  cueCount: 10,
  currentCueName: 'Scene 3',
  fadeProgress: 100,
  lastUpdated: '2023-01-01T12:00:00Z',
};

const createMocks = (systemInfo = mockSystemInfoEnabled, globalPlayback: GlobalPlaybackMock = mockGlobalPlaybackNotPlaying) => [
  {
    request: {
      query: GET_SYSTEM_INFO,
    },
    result: {
      data: {
        systemInfo,
      },
    },
  },
  {
    request: {
      query: SYSTEM_INFO_UPDATED,
    },
    result: {
      data: {},
    },
  },
  {
    request: {
      query: GET_GLOBAL_PLAYBACK_STATUS,
    },
    result: {
      data: {
        globalPlaybackStatus: globalPlayback,
      },
    },
  },
  {
    request: {
      query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
    },
    result: {
      data: {
        globalPlaybackStatusUpdated: globalPlayback,
      },
    },
  },
];

const renderWithProviders = (component: React.ReactElement, mocks: readonly MockedResponse[]) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <WebSocketProvider>
        {component}
      </WebSocketProvider>
    </MockedProvider>
  );
};

describe('SystemStatusBar', () => {
  describe('Loading state', () => {
    it('shows loading message while fetching data', () => {
      const mocks = createMocks();

      renderWithProviders(<SystemStatusBar />, mocks);

      expect(screen.getByText('Loading system status...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when query fails', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_SYSTEM_INFO,
          },
          error: new Error('Network error'),
        },
        {
          request: {
            query: SYSTEM_INFO_UPDATED,
          },
          result: {
            data: {},
          },
        },
        {
          request: {
            query: GET_GLOBAL_PLAYBACK_STATUS,
          },
          result: {
            data: {
              globalPlaybackStatus: mockGlobalPlaybackNotPlaying,
            },
          },
        },
        {
          request: {
            query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
          },
          result: {
            data: {},
          },
        },
      ];

      renderWithProviders(<SystemStatusBar />, errorMocks);

      await screen.findByText('Failed to load system status');
      expect(screen.getByText('Failed to load system status')).toBeInTheDocument();
    });
  });

  describe('System info display', () => {
    it('displays Art-Net compact label when enabled', async () => {
      const mocks = createMocks(mockSystemInfoEnabled);

      renderWithProviders(<SystemStatusBar />, mocks);

      // Now shows compact "Art-Net" label instead of "Art-Net:"
      await screen.findByText('Art-Net');
      expect(screen.getByText('Art-Net')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.255')).toBeInTheDocument();
    });

    it('displays Art-Net compact label when disabled', async () => {
      const mocks = createMocks(mockSystemInfoDisabled);

      renderWithProviders(<SystemStatusBar />, mocks);

      // Now shows compact "Art-Net" label instead of "Art-Net:"
      await screen.findByText('Art-Net');
      expect(screen.getByText('Art-Net')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.255')).toBeInTheDocument();
    });

    it('displays broadcast address with icon', async () => {
      const mocks = createMocks();

      renderWithProviders(<SystemStatusBar />, mocks);

      // Address is displayed directly without "Broadcast Address:" label
      await screen.findByText('192.168.1.255');
      expect(screen.getByText('192.168.1.255')).toBeInTheDocument();
      // Icon is present via aria-label
      expect(screen.getByLabelText('Broadcast')).toBeInTheDocument();
    });
  });

  describe('Now Playing button', () => {
    it('does not show Now Playing button when nothing is playing', async () => {
      const mocks = createMocks(mockSystemInfoEnabled, mockGlobalPlaybackNotPlaying);

      renderWithProviders(<SystemStatusBar />, mocks);

      await screen.findByText('Art-Net');
      // Should not find any playing button/text
      expect(screen.queryByText('Main Show')).not.toBeInTheDocument();
    });

    it('shows Now Playing button when a cue list is playing', async () => {
      const mocks = createMocks(mockSystemInfoEnabled, mockGlobalPlaybackPlaying);

      renderWithProviders(<SystemStatusBar />, mocks);

      await screen.findByText('Art-Net');
      // Wait for global playback status to load
      await screen.findByText('Main Show');
      expect(screen.getByText('Main Show')).toBeInTheDocument();
      // Should show cue position
      expect(screen.getByText('3/10')).toBeInTheDocument();
    });

    it('navigates to cue list when Now Playing button is clicked', async () => {
      // Clear any previous calls to mockPush
      mockPush.mockClear();

      const mocks = createMocks(mockSystemInfoEnabled, mockGlobalPlaybackPlaying);

      renderWithProviders(<SystemStatusBar />, mocks);

      // Wait for the button to appear
      const button = await screen.findByLabelText(/Now playing/);
      expect(button).toBeInTheDocument();

      // Click the button
      fireEvent.click(button);

      // Verify router.push was called with correct URL
      expect(mockPush).toHaveBeenCalledWith('/cue-lists/test-list-123?highlightCue=2');
    });
  });

  describe('Subscription updates', () => {
    it('renders without errors when subscription is active', async () => {
      const mocks = [
        {
          request: {
            query: GET_SYSTEM_INFO,
          },
          result: {
            data: {
              systemInfo: mockSystemInfoEnabled,
            },
          },
        },
        {
          request: {
            query: SYSTEM_INFO_UPDATED,
          },
          result: {
            data: {
              systemInfoUpdated: mockSystemInfoDisabled,
            },
          },
        },
        {
          request: {
            query: GET_GLOBAL_PLAYBACK_STATUS,
          },
          result: {
            data: {
              globalPlaybackStatus: mockGlobalPlaybackNotPlaying,
            },
          },
        },
        {
          request: {
            query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
          },
          result: {
            data: {},
          },
        },
      ];

      renderWithProviders(<SystemStatusBar />, mocks);

      // Should eventually show the Art-Net label
      await screen.findByText('Art-Net');
      expect(screen.getByText('Art-Net')).toBeInTheDocument();
    });
  });

  describe('Null system info', () => {
    it('returns null when systemInfo is undefined', async () => {
      const mocks = [
        {
          request: {
            query: GET_SYSTEM_INFO,
          },
          result: {
            data: {
              systemInfo: null,
            },
          },
        },
        {
          request: {
            query: SYSTEM_INFO_UPDATED,
          },
          result: {
            data: {},
          },
        },
        {
          request: {
            query: GET_GLOBAL_PLAYBACK_STATUS,
          },
          result: {
            data: {
              globalPlaybackStatus: mockGlobalPlaybackNotPlaying,
            },
          },
        },
        {
          request: {
            query: GLOBAL_PLAYBACK_STATUS_SUBSCRIPTION,
          },
          result: {
            data: {},
          },
        },
      ];

      const { container } = renderWithProviders(<SystemStatusBar />, mocks);

      // Wait a bit for the component to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When systemInfo is null, component should render nothing
      expect(container.firstChild).toBeNull();
    });
  });
});
