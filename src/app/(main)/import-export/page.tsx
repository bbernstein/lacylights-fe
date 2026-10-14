import { Suspense } from 'react';
import ImportExportPage from '@/components/import-export/ImportExportPage';

// useSearchParams() in ImportExportPage requires a Suspense boundary for
// static export (`npm run build:static`).
export default function ImportExportRoute() {
  return (
    <Suspense
      fallback={<div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>}
    >
      <ImportExportPage />
    </Suspense>
  );
}
