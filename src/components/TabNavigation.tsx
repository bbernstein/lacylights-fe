'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStreamDock, BrowseHandlers } from "@/contexts/StreamDockContext";

interface Tab {
  name: string;
  href: string;
}

const tabs: Tab[] = [
  { name: "Dashboard", href: "/" },
  { name: "Fixtures", href: "/fixtures" },
  { name: "Looks", href: "/looks" },
  { name: "Effects", href: "/effects" },
  { name: "Look Board", href: "/look-board" },
  { name: "Cue Lists", href: "/cue-lists" },
  { name: "Groups", href: "/groups" },
  { name: "Settings", href: "/settings" },
];

/** Map a plugin tab ID (e.g. 'fixtures') to its route (e.g. '/fixtures') */
export function tabIdToRoute(tabId: string): string | undefined {
  if (tabId === 'dashboard') return '/';
  return tabs.find(t => t.href === `/${tabId}`)?.href;
}

export default function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const streamDock = useStreamDock();
  const [highlightedTabHref, setHighlightedTabHref] = useState<string | null>(null);

  // Clear highlight when pathname changes (user navigated away)
  useEffect(() => {
    setHighlightedTabHref(null);
  }, [pathname]);

  // Register browse handlers for Stream Deck tab navigation
  useEffect(() => {
    const handlers: BrowseHandlers = {
      handleHighlight: (tabId: string) => {
        const route = tabIdToRoute(tabId);
        if (route) {
          setHighlightedTabHref(route);
        }
      },
      handleSelect: (tabId: string) => {
        const route = tabIdToRoute(tabId);
        if (route) {
          setHighlightedTabHref(null);
          router.push(route);
        }
      },
    };
    streamDock.registerBrowseHandlers('tab', handlers);
    return () => {
      streamDock.registerBrowseHandlers('tab', null);
    };
  }, [streamDock, router]);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 hidden md:block">
      <div className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const isHighlighted = highlightedTabHref === tab.href;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isHighlighted
                    ? "border-yellow-400 text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                    : isActive
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
