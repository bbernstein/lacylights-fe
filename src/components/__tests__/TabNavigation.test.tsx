import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import TabNavigation from '../TabNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: unknown) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('TabNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all navigation tabs', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Fixtures')).toBeInTheDocument();
      expect(screen.getByText('Looks')).toBeInTheDocument();
      expect(screen.getByText('Look Board')).toBeInTheDocument();
      expect(screen.getByText('Cue Lists')).toBeInTheDocument();
    });

    it('renders correct href attributes', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });
      const lookBoardLink = screen.getByRole('link', { name: 'Look Board' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(dashboardLink).toHaveAttribute('href', '/');
      expect(fixturesLink).toHaveAttribute('href', '/fixtures');
      expect(looksLink).toHaveAttribute('href', '/looks');
      expect(lookBoardLink).toHaveAttribute('href', '/look-board');
      expect(cueListsLink).toHaveAttribute('href', '/cue-lists');
    });

    it('renders with proper navigation structure', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      // Check the div inside nav has the aria-label, not the nav itself
      const tabsDiv = nav.querySelector('[aria-label="Tabs"]');
      expect(tabsDiv).toBeInTheDocument();
    });
  });

  describe('active state handling', () => {
    it('applies active styles to current path', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });

      expect(fixturesLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(looksLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('applies active styles to sub-paths', () => {
      mockUsePathname.mockReturnValue('/fixtures/edit/123');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });

      expect(fixturesLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(looksLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles looks path correctly', () => {
      mockUsePathname.mockReturnValue('/looks');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(looksLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(cueListsLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles look-board path correctly', () => {
      mockUsePathname.mockReturnValue('/look-board');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });
      const lookBoardLink = screen.getByRole('link', { name: 'Look Board' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(lookBoardLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(looksLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(cueListsLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles cue-lists path correctly', () => {
      mockUsePathname.mockReturnValue('/cue-lists');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(cueListsLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(looksLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles unknown paths correctly', () => {
      mockUsePathname.mockReturnValue('/unknown');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(looksLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(cueListsLink).toHaveClass('border-transparent', 'text-gray-500');
    });
  });

  describe('responsive behavior', () => {
    it('is hidden on mobile screens', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('hidden', 'md:block');
    });
  });

  describe('styling classes', () => {
    it('applies correct base classes to all links', () => {
      mockUsePathname.mockReturnValue('/unknown');

      render(<TabNavigation />);

      const links = screen.getAllByRole('link');

      links.forEach((link) => {
        expect(link).toHaveClass('py-4', 'px-1', 'border-b-2', 'font-medium', 'text-sm', 'transition-colors');
      });
    });

    it('applies hover classes to inactive links', () => {
      mockUsePathname.mockReturnValue('/unknown');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });

      expect(fixturesLink).toHaveClass('hover:text-gray-700', 'hover:border-gray-300');
    });

    it('applies dark mode classes', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const looksLink = screen.getByRole('link', { name: 'Looks' });

      expect(fixturesLink).toHaveClass('dark:text-blue-400');
      expect(looksLink).toHaveClass('dark:text-gray-400', 'dark:hover:text-gray-300');
    });
  });

  describe('accessibility', () => {
    it('provides proper ARIA label for navigation', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const nav = screen.getByRole('navigation');
      const tabsDiv = nav.querySelector('[aria-label="Tabs"]');
      expect(tabsDiv).toHaveAttribute('aria-label', 'Tabs');
    });

    it('renders all links as accessible links', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(6); // Dashboard, Fixtures, Looks, Look Board, Cue Lists, Settings

      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('tab configuration', () => {
    it('contains expected tab names and paths', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const expectedTabs = [
        { name: 'Dashboard', href: '/' },
        { name: 'Fixtures', href: '/fixtures' },
        { name: 'Looks', href: '/looks' },
        { name: 'Look Board', href: '/look-board' },
        { name: 'Cue Lists', href: '/cue-lists' },
        { name: 'Settings', href: '/settings' },
      ];

      expectedTabs.forEach((tab) => {
        const link = screen.getByRole('link', { name: tab.name });
        expect(link).toHaveAttribute('href', tab.href);
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty pathname', () => {
      mockUsePathname.mockReturnValue('');

      render(<TabNavigation />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('border-transparent', 'text-gray-500');
      });
    });

    it('handles root path', () => {
      mockUsePathname.mockReturnValue('/');

      render(<TabNavigation />);

      // Dashboard should be active at root path
      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveClass('border-blue-500', 'text-blue-600');

      // Other links should be inactive
      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles case sensitivity', () => {
      mockUsePathname.mockReturnValue('/FIXTURES');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
    });
  });
});