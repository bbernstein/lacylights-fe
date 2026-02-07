import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupSelector from '../GroupSelector';

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronDownIcon: ({ className }: { className?: string }) => <div className={className} data-testid="chevron-icon">v</div>,
}));

// Mock useGroup
const mockSelectGroup = jest.fn();
const mockUseGroup = {
  activeGroup: null as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  groups: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  loading: false,
  selectGroup: mockSelectGroup,
  selectGroupById: jest.fn(),
  refetchGroups: jest.fn(),
};

jest.mock('@/contexts/GroupContext', () => ({
  useGroup: jest.fn(() => mockUseGroup),
}));

const personalGroup = { id: 'group-1', name: 'My Personal', isPersonal: true, permissions: [], memberCount: 1, createdAt: '', updatedAt: '' };
const teamGroup = { id: 'group-2', name: 'Team Alpha', isPersonal: false, permissions: [], memberCount: 3, createdAt: '', updatedAt: '' };

describe('GroupSelector', () => {
  const { useGroup } = require('@/contexts/GroupContext');

  beforeEach(() => {
    jest.clearAllMocks();
    useGroup.mockReturnValue(mockUseGroup);
  });

  it('renders nothing when user has fewer than 2 groups', () => {
    useGroup.mockReturnValue({
      ...mockUseGroup,
      activeGroup: personalGroup,
      groups: [personalGroup],
    });

    const { container } = render(<GroupSelector />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no active group', () => {
    useGroup.mockReturnValue({
      ...mockUseGroup,
      activeGroup: null,
      groups: [personalGroup, teamGroup],
    });

    const { container } = render(<GroupSelector />);
    expect(container.innerHTML).toBe('');
  });

  it('renders group selector when user has 2+ groups', () => {
    useGroup.mockReturnValue({
      ...mockUseGroup,
      activeGroup: personalGroup,
      groups: [personalGroup, teamGroup],
    });

    render(<GroupSelector />);
    expect(screen.getByText('My Personal (Personal)')).toBeInTheDocument();
  });

  it('opens dropdown on click and shows all groups', () => {
    useGroup.mockReturnValue({
      ...mockUseGroup,
      activeGroup: personalGroup,
      groups: [personalGroup, teamGroup],
    });

    render(<GroupSelector />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('My Personal')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
  });

  it('calls selectGroup when a group is clicked', () => {
    useGroup.mockReturnValue({
      ...mockUseGroup,
      activeGroup: personalGroup,
      groups: [personalGroup, teamGroup],
    });

    render(<GroupSelector />);

    fireEvent.click(screen.getByRole('button'));

    // Click Team Alpha in the dropdown
    const buttons = screen.getAllByRole('button');
    const teamButton = buttons.find(b => b.textContent?.includes('Team Alpha'));
    expect(teamButton).toBeDefined();
    fireEvent.click(teamButton!);

    expect(mockSelectGroup).toHaveBeenCalledWith(teamGroup);
  });

  it('shows (Personal) label for personal groups in dropdown', () => {
    useGroup.mockReturnValue({
      ...mockUseGroup,
      activeGroup: teamGroup,
      groups: [personalGroup, teamGroup],
    });

    render(<GroupSelector />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('(Personal)')).toBeInTheDocument();
  });
});
