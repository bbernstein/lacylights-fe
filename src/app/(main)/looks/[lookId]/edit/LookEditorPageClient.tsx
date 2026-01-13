"use client";

import { useRouter, useSearchParams } from "next/navigation";
import LookEditorLayout from "@/components/LookEditorLayout";
import { extractLookId } from "@/utils/routeUtils";

interface LookEditorPageClientProps {
  lookId: string;
}

export default function LookEditorPageClient({
  lookId: lookIdProp,
}: LookEditorPageClientProps) {
  const lookId = extractLookId(lookIdProp);
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get("mode");
  const mode = modeParam === "layout" ? "layout" : "channels";
  const isLayoutMode = mode === "layout";

  // Extract Player Mode context from URL params
  const fromPlayer = searchParams.get("fromPlayer") === "true";
  const cueListId = searchParams.get("cueListId");
  const returnCueNumber = searchParams.get("returnCueNumber");

  const handleClose = () => {
    // If coming from Player Mode, return to the cue list with highlight
    if (fromPlayer && cueListId) {
      const highlightParam = returnCueNumber
        ? `?highlightCue=${returnCueNumber}`
        : "";
      router.push(`/cue-lists/${cueListId}${highlightParam}`);
    } else {
      router.push("/looks");
    }
  };

  const handleToggleMode = () => {
    if (isLayoutMode) {
      router.push(`/looks/${lookId}/edit`);
    } else {
      router.push(`/looks/${lookId}/edit?mode=layout`);
    }
  };

  return (
    <LookEditorLayout
      lookId={lookId}
      mode={mode}
      onClose={handleClose}
      onToggleMode={handleToggleMode}
      fromPlayer={fromPlayer}
      cueListId={cueListId || undefined}
      returnCueNumber={returnCueNumber || undefined}
    />
  );
}
