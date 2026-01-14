import { use } from 'react';
import LookBoardClient from './LookBoardClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and the real ID is extracted client-side
export async function generateStaticParams() {
  return [{ id: '__dynamic__' }];
}

// Server component that extracts params and passes to client component
export default function LookBoardDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <LookBoardClient id={id} />;
}
