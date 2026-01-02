'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  name: string;
  href: string;
}

const tabs: Tab[] = [
  { name: "Dashboard", href: "/" },
  { name: "Fixtures", href: "/fixtures" },
  { name: "Scenes", href: "/scenes" },
  { name: "Scene Board", href: "/scene-board" },
  { name: "Cue Lists", href: "/cue-lists" },
  { name: "Settings", href: "/settings" },
];

export default function TabNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 hidden md:block">
      <div className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
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
