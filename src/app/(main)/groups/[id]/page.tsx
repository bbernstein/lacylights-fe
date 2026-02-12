import { use } from 'react';
import GroupDetailPageClient from './GroupDetailPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and client-side code extracts the real ID from the URL
// via extractGroupId() in routeUtils.ts
export async function generateStaticParams() {
  return [{ id: '__dynamic__' }];
}

// Server component that extracts params and passes to client component
export default function GroupDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <GroupDetailPageClient groupId={id} />;
}
