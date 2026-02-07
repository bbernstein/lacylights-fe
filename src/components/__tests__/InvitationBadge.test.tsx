import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import InvitationBadge from '../InvitationBadge';
import { GET_MY_INVITATIONS, ACCEPT_INVITATION, DECLINE_INVITATION } from '@/graphql/auth';
import { GraphQLError } from 'graphql';

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  EnvelopeIcon: ({ className }: { className?: string }) => <div className={className} data-testid="envelope-icon">E</div>,
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthEnabled: true,
    isAuthenticated: true,
  })),
}));

// Mock GroupContext
jest.mock('@/contexts/GroupContext', () => ({
  useGroup: jest.fn(() => ({
    refetchGroups: jest.fn(),
  })),
}));

const mockInvitations = [
  {
    __typename: 'GroupInvitation',
    id: 'inv-1',
    group: { __typename: 'UserGroup', id: 'group-2', name: 'Team Alpha', isPersonal: false },
    email: 'user@example.com',
    invitedBy: { __typename: 'User', id: 'admin-1', email: 'admin@example.com', name: 'Admin User' },
    role: 'MEMBER',
    status: 'PENDING',
    expiresAt: '2025-12-31T00:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    __typename: 'GroupInvitation',
    id: 'inv-2',
    group: { __typename: 'UserGroup', id: 'group-3', name: 'Team Beta', isPersonal: false },
    email: 'user@example.com',
    invitedBy: { __typename: 'User', id: 'admin-2', email: 'admin2@example.com', name: null },
    role: 'GROUP_ADMIN',
    status: 'PENDING',
    expiresAt: '2025-12-31T00:00:00Z',
    createdAt: '2025-01-02T00:00:00Z',
  },
];

describe('InvitationBadge', () => {
  it('renders nothing when no invitations', async () => {
    const mocks = [
      {
        request: { query: GET_MY_INVITATIONS },
        result: { data: { myInvitations: [] } },
      },
    ];

    const { container } = render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('renders nothing when auth is disabled', () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ isAuthEnabled: false, isAuthenticated: false });

    const { container } = render(
      <MockedProvider mocks={[]} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('shows badge count when there are invitations', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });

    const mocks = [
      {
        request: { query: GET_MY_INVITATIONS },
        result: { data: { myInvitations: mockInvitations } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('opens dropdown showing invitation details', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });

    const mocks = [
      {
        request: { query: GET_MY_INVITATIONS },
        result: { data: { myInvitations: mockInvitations } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Group invitations'));

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText(/Admin User/)).toBeInTheDocument();
    expect(screen.getByText(/admin2@example.com/)).toBeInTheDocument();
  });

  it('shows Accept and Decline buttons for each invitation', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });

    const mocks = [
      {
        request: { query: GET_MY_INVITATIONS },
        result: { data: { myInvitations: mockInvitations } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Group invitations'));

    const acceptButtons = screen.getAllByText('Accept');
    const declineButtons = screen.getAllByText('Decline');

    expect(acceptButtons).toHaveLength(2);
    expect(declineButtons).toHaveLength(2);
  });

  it('handles accept invitation error gracefully', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mocks = [
      {
        request: { query: GET_MY_INVITATIONS },
        result: { data: { myInvitations: [mockInvitations[0]] } },
      },
      {
        request: { query: ACCEPT_INVITATION, variables: { invitationId: 'inv-1' } },
        result: { errors: [new GraphQLError('Failed to accept')] },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Group invitations'));
    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to accept invitation:', expect.anything());
    });

    consoleSpy.mockRestore();
  });

  it('handles decline invitation error gracefully', async () => {
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mocks = [
      {
        request: { query: GET_MY_INVITATIONS },
        result: { data: { myInvitations: [mockInvitations[0]] } },
      },
      {
        request: { query: DECLINE_INVITATION, variables: { invitationId: 'inv-1' } },
        result: { errors: [new GraphQLError('Failed to decline')] },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <InvitationBadge />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Group invitations'));
    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to decline invitation:', expect.anything());
    });

    consoleSpy.mockRestore();
  });

  describe('accessibility', () => {
    it('has aria-haspopup and aria-expanded attributes', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });

      const mocks = [
        {
          request: { query: GET_MY_INVITATIONS },
          result: { data: { myInvitations: mockInvitations } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={true}>
          <InvitationBadge />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      const button = screen.getByLabelText('Group invitations');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', 'invitation-dropdown');
    });

    it('closes dropdown on Escape key', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ isAuthEnabled: true, isAuthenticated: true });

      const mocks = [
        {
          request: { query: GET_MY_INVITATIONS },
          result: { data: { myInvitations: mockInvitations } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={true}>
          <InvitationBadge />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Group invitations'));
      expect(screen.getByText('Group Invitations')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText('Group Invitations')).not.toBeInTheDocument();
    });
  });
});
