import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { GroupProvider, useGroup } from '../GroupContext';
import { GET_MY_GROUPS } from '../../graphql/auth';

// Mock AuthContext
const mockAuth = {
  isAuthEnabled: true,
  isAuthenticated: true,
  isAdmin: false,
  user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
  refresh: jest.fn(),
  register: jest.fn(),
  hasPermission: jest.fn(() => false),
};

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(() => mockAuth),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockGroups = [
  {
    __typename: 'UserGroup',
    id: 'group-1',
    name: 'Personal',
    description: null,
    permissions: [],
    memberCount: 1,
    isPersonal: true,
    members: [{ __typename: 'GroupMember', id: 'm1', user: { __typename: 'User', id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' }, role: 'GROUP_ADMIN', joinedAt: '2023-01-01T00:00:00Z' }],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    __typename: 'UserGroup',
    id: 'group-2',
    name: 'Team Alpha',
    description: 'A shared team',
    permissions: [],
    memberCount: 3,
    isPersonal: false,
    members: [],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

// Test component that uses the GroupContext
function TestComponent() {
  const { activeGroup, groups, loading, selectGroup, selectGroupById } = useGroup();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="active-group">{activeGroup ? activeGroup.name : 'No Group'}</div>
      <div data-testid="groups-count">{groups.length}</div>
      <button
        data-testid="select-group-2"
        onClick={() => selectGroupById('group-2')}
      >
        Select Group 2
      </button>
      <button
        data-testid="select-group-direct"
        onClick={() => selectGroup(mockGroups[1] as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
      >
        Select Group Direct
      </button>
    </div>
  );
}

const createMockProvider = (mocks: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const TestProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks }, children);
  TestProvider.displayName = 'TestProvider';
  return TestProvider;
};

describe('GroupContext', () => {
  const { useAuth } = require('../AuthContext');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    useAuth.mockReturnValue(mockAuth);
  });

  describe('GroupProvider', () => {
    it('provides initial loading state', () => {
      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    });

    it('loads groups and auto-selects first group', async () => {
      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      await act(async () => {
        render(
          React.createElement(
            createMockProvider(mocks),
            null,
            React.createElement(GroupProvider, null, React.createElement(TestComponent)),
          ),
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('groups-count')).toHaveTextContent('2');
      });

      // Auto-select needs another render cycle
      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('Personal');
      });
    });

    it('returns empty groups when auth is disabled', async () => {
      useAuth.mockReturnValue({ ...mockAuth, isAuthEnabled: false });

      const mocks: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('active-group')).toHaveTextContent('No Group');
        expect(screen.getByTestId('groups-count')).toHaveTextContent('0');
      });
    });

    it('returns empty groups when not authenticated', async () => {
      useAuth.mockReturnValue({ ...mockAuth, isAuthenticated: false });

      const mocks: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('No Group');
        expect(screen.getByTestId('groups-count')).toHaveTextContent('0');
      });
    });

    it('restores active group from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('group-2');

      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('Team Alpha');
      });
    });
  });

  describe('Group selection', () => {
    it('allows selection by ID', async () => {
      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('Personal');
      });

      act(() => {
        screen.getByTestId('select-group-2').click();
      });

      expect(screen.getByTestId('active-group')).toHaveTextContent('Team Alpha');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('activeGroupId', 'group-2');
    });

    it('allows direct group selection', async () => {
      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('Personal');
      });

      act(() => {
        screen.getByTestId('select-group-direct').click();
      });

      expect(screen.getByTestId('active-group')).toHaveTextContent('Team Alpha');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('activeGroupId', 'group-2');
    });
  });

  describe('localStorage error handling', () => {
    it('falls back to first group when localStorage.getItem throws', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('Personal');
      });
    });

    it('still selects group when localStorage.setItem throws', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const mocks = [
        {
          request: { query: GET_MY_GROUPS },
          result: { data: { myGroups: mockGroups } },
        },
      ];

      render(
        React.createElement(
          createMockProvider(mocks),
          null,
          React.createElement(GroupProvider, null, React.createElement(TestComponent)),
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-group')).toHaveTextContent('Personal');
      });

      act(() => {
        screen.getByTestId('select-group-2').click();
      });

      expect(screen.getByTestId('active-group')).toHaveTextContent('Team Alpha');
    });
  });

  describe('useGroup hook', () => {
    it('throws error when used outside GroupProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(React.createElement(TestComponent));
      }).toThrow('useGroup must be used within a GroupProvider');

      consoleSpy.mockRestore();
    });
  });
});
