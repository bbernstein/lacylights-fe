import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import TabNavigation from '../TabNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
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

      expect(screen.getByText('Fixtures')).toBeInTheDocument();
      expect(screen.getByText('Scenes')).toBeInTheDocument();
      expect(screen.getByText('Cue Lists')).toBeInTheDocument();
    });

    it('renders correct href attributes', () => {
      mockUsePathname.mockReturnValue('/fixtures');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(fixturesLink).toHaveAttribute('href', '/fixtures');
      expect(scenesLink).toHaveAttribute('href', '/scenes');
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
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });

      expect(fixturesLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(scenesLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('applies active styles to sub-paths', () => {
      mockUsePathname.mockReturnValue('/fixtures/edit/123');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });

      expect(fixturesLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(scenesLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles scenes path correctly', () => {
      mockUsePathname.mockReturnValue('/scenes');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(scenesLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(cueListsLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles cue-lists path correctly', () => {
      mockUsePathname.mockReturnValue('/cue-lists');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(cueListsLink).toHaveClass('border-blue-500', 'text-blue-600');
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(scenesLink).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('handles unknown paths correctly', () => {
      mockUsePathname.mockReturnValue('/unknown');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });
      const cueListsLink = screen.getByRole('link', { name: 'Cue Lists' });

      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(scenesLink).toHaveClass('border-transparent', 'text-gray-500');
      expect(cueListsLink).toHaveClass('border-transparent', 'text-gray-500');
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
      const scenesLink = screen.getByRole('link', { name: 'Scenes' });

      expect(fixturesLink).toHaveClass('dark:text-blue-400');
      expect(scenesLink).toHaveClass('dark:text-gray-400', 'dark:hover:text-gray-300');
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
      expect(links).toHaveLength(3);

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
        { name: 'Fixtures', href: '/fixtures' },
        { name: 'Scenes', href: '/scenes' },
        { name: 'Cue Lists', href: '/cue-lists' },
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

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('border-transparent', 'text-gray-500');
      });
    });

    it('handles case sensitivity', () => {
      mockUsePathname.mockReturnValue('/FIXTURES');

      render(<TabNavigation />);

      const fixturesLink = screen.getByRole('link', { name: 'Fixtures' });
      expect(fixturesLink).toHaveClass('border-transparent', 'text-gray-500');
    });
  });
});