'use client';

import { ReactNode, useState } from 'react';
import Image from 'next/image';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Providers } from '../providers';
import TabNavigation from '@/components/TabNavigation';
import MobileNav from '@/components/MobileNav';
import ProjectSelector from '@/components/ProjectSelector';
import SystemStatusBar from '@/components/SystemStatusBar';
import { UndoRedoToolbar } from '@/components/UndoRedoToolbar';
import { OperationHistoryPanel } from '@/components/OperationHistoryPanel';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useUndoRedoKeyboard } from '@/hooks/useUndoRedoKeyboard';

function MainLayoutContent({ children }: { children: ReactNode }) {
  const { isFocusMode } = useFocusMode();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Enable keyboard shortcuts for undo/redo
  useUndoRedoKeyboard();

  return (
    <div className="flex flex-col min-h-screen">
      {!isFocusMode && (
        <>
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo on mobile, text on desktop */}
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="LacyLights"
                    width={40}
                    height={40}
                    className="md:hidden"
                    priority
                  />
                  <h1 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">
                    LacyLights
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {/* Undo/Redo toolbar */}
                  <UndoRedoToolbar />
                  {/* History panel toggle */}
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    title="View history"
                    aria-label="View operation history"
                  >
                    <ClockIcon className="h-5 w-5" />
                  </button>
                  <ProjectSelector />
                </div>
              </div>
            </div>
          </header>
          <SystemStatusBar />
          <TabNavigation />
        </>
      )}
      <main className={isFocusMode ? 'flex-1' : 'flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8'}>
        {children}
      </main>
      {/* Mobile bottom navigation */}
      {!isFocusMode && <MobileNav />}
      {/* Operation history panel */}
      <OperationHistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Providers>
  );
}