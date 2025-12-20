import { use, Suspense } from "react";
import CueListPlayer from "@/components/CueListPlayer";

interface PageProps {
  params: Promise<{ cueListId: string }>;
}

// Generate static params for static export
// The '__dynamic__' placeholder is used, and client-side code extracts the real ID from the URL
// via extractCueListId() in routeUtils.ts
export async function generateStaticParams() {
  return [{ cueListId: "__dynamic__" }];
}

// This is a server component that extracts params and passes to client component
export default function PlayerPage({ params }: PageProps) {
  const { cueListId } = use(params);

  return (
    <Suspense fallback={<div>Loading player...</div>}>
      <CueListPlayer cueListId={cueListId} />
    </Suspense>
  );
}
