import { render, screen } from '@testing-library/react';
import MobileNav, { navItems } from '../MobileNav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

const mockUsePathname = usePathname as jest.Mock;

describe('MobileNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/fixtures');

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders all navigation items', () => {
    render(<MobileNav />);

    expect(screen.getByTestId('mobile-nav-item-')).toBeInTheDocument(); // Dashboard at root
    expect(screen.getByTestId('mobile-nav-item-fixtures')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-item-looks')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-item-look-board')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-item-cue-lists')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-item-settings')).toBeInTheDocument();
  });

  it('renders with custom testId', () => {
    render(<MobileNav testId="custom-nav" />);

    expect(screen.getByTestId('custom-nav')).toBeInTheDocument();
  });

  it('has correct aria-label for navigation', () => {
    render(<MobileNav />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('marks active item with aria-current', () => {
    mockUsePathname.mockReturnValue('/looks');

    render(<MobileNav />);

    const looksLink = screen.getByTestId('mobile-nav-item-looks');
    expect(looksLink).toHaveAttribute('aria-current', 'page');

    const fixturesLink = screen.getByTestId('mobile-nav-item-fixtures');
    expect(fixturesLink).not.toHaveAttribute('aria-current');
  });

  it('applies active styles to current route', () => {
    mockUsePathname.mockReturnValue('/fixtures');

    render(<MobileNav />);

    const fixturesLink = screen.getByTestId('mobile-nav-item-fixtures');
    expect(fixturesLink).toHaveClass('text-blue-600');
  });

  it('applies inactive styles to non-current routes', () => {
    mockUsePathname.mockReturnValue('/fixtures');

    render(<MobileNav />);

    const looksLink = screen.getByTestId('mobile-nav-item-looks');
    expect(looksLink).toHaveClass('text-gray-500');
  });

  it('handles nested routes correctly', () => {
    mockUsePathname.mockReturnValue('/look-board/123');

    render(<MobileNav />);

    const lookBoardLink = screen.getByTestId('mobile-nav-item-look-board');
    expect(lookBoardLink).toHaveAttribute('aria-current', 'page');
  });

  it('displays abbreviated labels for items', () => {
    render(<MobileNav />);

    expect(screen.getByText('Home')).toBeInTheDocument(); // Dashboard shortName
    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(screen.getByText('Cues')).toBeInTheDocument();
  });

  it('renders links with correct href attributes', () => {
    render(<MobileNav />);

    expect(screen.getByTestId('mobile-nav-item-')).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByTestId('mobile-nav-item-fixtures')).toHaveAttribute(
      'href',
      '/fixtures'
    );
    expect(screen.getByTestId('mobile-nav-item-looks')).toHaveAttribute(
      'href',
      '/looks'
    );
    expect(screen.getByTestId('mobile-nav-item-look-board')).toHaveAttribute(
      'href',
      '/look-board'
    );
    expect(screen.getByTestId('mobile-nav-item-cue-lists')).toHaveAttribute(
      'href',
      '/cue-lists'
    );
    expect(screen.getByTestId('mobile-nav-item-settings')).toHaveAttribute(
      'href',
      '/settings'
    );
  });

  it('renders icons for each navigation item', () => {
    render(<MobileNav />);

    // Each nav item should have an SVG icon
    const navItems = screen.getAllByRole('link');
    navItems.forEach((item) => {
      const svg = item.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('has correct number of navigation items', () => {
    render(<MobileNav />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6); // Dashboard, Fixtures, Looks, Look Board, Cue Lists, Settings
  });

  it('is fixed to the bottom of the viewport', () => {
    render(<MobileNav />);

    const nav = screen.getByTestId('mobile-nav');
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
  });

  it('has z-index for proper stacking', () => {
    render(<MobileNav />);

    const nav = screen.getByTestId('mobile-nav');
    expect(nav).toHaveClass('z-50');
  });

  it('is hidden on desktop screens', () => {
    render(<MobileNav />);

    const nav = screen.getByTestId('mobile-nav');
    expect(nav).toHaveClass('md:hidden');
  });

  it('has touch-friendly sizing for tap targets', () => {
    render(<MobileNav />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('min-w-[64px]', 'h-full');
      expect(link).toHaveClass('touch-manipulation');
    });
  });

  it('scrolls active item into view on mount', () => {
    mockUsePathname.mockReturnValue('/settings');

    render(<MobileNav />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});

describe('navItems configuration', () => {
  it('exports navItems array', () => {
    expect(navItems).toBeDefined();
    expect(Array.isArray(navItems)).toBe(true);
  });

  it('has correct structure for each nav item', () => {
    navItems.forEach((item) => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('shortName');
      expect(item).toHaveProperty('href');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('activeIcon');
      expect(typeof item.name).toBe('string');
      expect(typeof item.shortName).toBe('string');
      expect(typeof item.href).toBe('string');
      // React components can be functions or objects (ForwardRef)
      expect(item.icon).toBeDefined();
      expect(item.activeIcon).toBeDefined();
    });
  });

  it('has all expected navigation destinations', () => {
    const hrefs = navItems.map((item) => item.href);
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/fixtures');
    expect(hrefs).toContain('/looks');
    expect(hrefs).toContain('/look-board');
    expect(hrefs).toContain('/cue-lists');
    expect(hrefs).toContain('/settings');
  });
});
