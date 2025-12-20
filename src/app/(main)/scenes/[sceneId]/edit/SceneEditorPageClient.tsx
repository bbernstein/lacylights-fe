"use client";

import { useRouter, useSearchParams } from "next/navigation";
import SceneEditorLayout from "@/components/SceneEditorLayout";
import { extractSceneId } from "@/utils/routeUtils";

interface SceneEditorPageClientProps {
  sceneId: string;
}

export default function SceneEditorPageClient({
  sceneId: sceneIdProp,
}: SceneEditorPageClientProps) {
  const sceneId = extractSceneId(sceneIdProp);
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
      router.push("/scenes");
    }
  };

  const handleToggleMode = () => {
    if (isLayoutMode) {
      router.push(`/scenes/${sceneId}/edit`);
    } else {
      router.push(`/scenes/${sceneId}/edit?mode=layout`);
    }
  };

  return (
    <SceneEditorLayout
      sceneId={sceneId}
      mode={mode}
      onClose={handleClose}
      onToggleMode={handleToggleMode}
      fromPlayer={fromPlayer}
      cueListId={cueListId || undefined}
      returnCueNumber={returnCueNumber || undefined}
    />
  );
}
