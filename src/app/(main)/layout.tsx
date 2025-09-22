import { ReactNode } from 'react';
import { Providers } from '../providers';
import TabNavigation from '@/components/TabNavigation';
import ProjectSelector from '@/components/ProjectSelector';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                LacyLights
              </h1>
              <ProjectSelector />
            </div>
          </div>
        </header>
        <TabNavigation />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </Providers>
  );
}