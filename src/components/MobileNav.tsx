'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  Squares2X2Icon,
  QueueListIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  SparklesIcon as SparklesIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  QueueListIcon as QueueListIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";

/**
 * Navigation item configuration
 */
interface NavItem {
  /** Display name of the navigation item */
  name: string;
  /** Abbreviated name for smaller screens */
  shortName: string;
  /** Route path */
  href: string;
  /** Outline icon component (inactive state) */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Solid icon component (active state) */
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Navigation items for the mobile bottom navigation bar
 */
const navItems: NavItem[] = [
  {
    name: "Dashboard",
    shortName: "Home",
    href: "/",
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: "Fixtures",
    shortName: "Fixtures",
    href: "/fixtures",
    icon: WrenchScrewdriverIcon,
    activeIcon: WrenchScrewdriverIconSolid,
  },
  {
    name: "Looks",
    shortName: "Looks",
    href: "/looks",
    icon: SparklesIcon,
    activeIcon: SparklesIconSolid,
  },
  {
    name: "Look Board",
    shortName: "Board",
    href: "/look-board",
    icon: Squares2X2Icon,
    activeIcon: Squares2X2IconSolid,
  },
  {
    name: "Cue Lists",
    shortName: "Cues",
    href: "/cue-lists",
    icon: QueueListIcon,
    activeIcon: QueueListIconSolid,
  },
  {
    name: "Settings",
    shortName: "Settings",
    href: "/settings",
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
  },
];

/**
 * Props for the MobileNav component
 */
interface MobileNavProps {
  /** Test ID for the component */
  testId?: string;
}

/**
 * Mobile bottom navigation bar component
 *
 * Renders a fixed bottom navigation bar with icons and labels for the main app sections.
 * Only visible on mobile devices (md:hidden).
 *
 * Features:
 * - Fixed to bottom of viewport
 * - Icons with labels
 * - Active state indicator with filled icons
 * - Auto-scrolls active item into view on mount
 * - Safe area padding for devices with home indicators
 *
 * @example
 * ```tsx
 * // In your layout component
 * <MobileNav />
 * ```
 */
export default function MobileNav({ testId = "mobile-nav" }: MobileNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  // Scroll active item into view on mount
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-50 pb-safe"
      data-testid={testId}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              ref={isActive ? activeItemRef : null}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                min-w-[64px] h-full px-2 py-1
                transition-colors duration-200
                touch-manipulation
                ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }
              `}
              data-testid={`${testId}-item-${item.href.replace("/", "")}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-xs mt-1 font-medium truncate max-w-[64px]">
                {item.shortName}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Export nav items for testing and other components that may need them
 */
export { navItems };
export type { NavItem };
