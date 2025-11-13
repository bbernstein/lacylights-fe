import { use } from 'react';
import SceneBoardClient from './SceneBoardClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and the real ID is extracted client-side
export async function generateStaticParams() {
  return [{ id: '__dynamic__' }];
}

// Server component that extracts params and passes to client component
export default function SceneBoardDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <SceneBoardClient id={id} />;
}
