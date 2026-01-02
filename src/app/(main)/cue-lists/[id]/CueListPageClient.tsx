"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CueListPlayer from "@/components/CueListPlayer";
import CueListUnifiedView from "@/components/CueListUnifiedView";
import { extractCueListId } from "@/utils/routeUtils";

interface CueListPageClientProps {
  cueListId: string;
}

export default function CueListPageClient({
  cueListId: cueListIdProp,
}: CueListPageClientProps) {
  const cueListId = extractCueListId(cueListIdProp);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cue list name is provided by child components via callback to avoid duplicate queries
  const [cueListName, setCueListName] = useState("");

  const handleCueListLoaded = useCallback((name: string) => {
    setCueListName(name);
  }, []);

  const mode = searchParams.get("mode") || "player";
  const isEditMode = mode === "edit";

  const handleClose = () => {
    router.push("/cue-lists");
  };

  const handleToggleMode = () => {
    if (isEditMode) {
      router.push(`/cue-lists/${cueListId}`);
    } else {
      router.push(`/cue-lists/${cueListId}?mode=edit`);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-gray-900">
      {/* Mode Toggle Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 px-2 py-2 flex items-center justify-between z-50">
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 flex items-center space-x-1 min-w-0 flex-shrink-0"
          title="Back to cue lists"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm hidden sm:inline">Back</span>
        </button>

        {/* Cue List Name - centered */}
        <h1 className="text-white font-semibold text-sm sm:text-base truncate px-2 flex-1 text-center min-w-0">
          {cueListName}
        </h1>

        <button
          onClick={handleToggleMode}
          className={`px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
            isEditMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
        >
          {isEditMode ? "Player" : "Edit"}
        </button>
      </div>

      {/* Content */}
      <div className="absolute inset-0 top-14">
        {isEditMode ? (
          <CueListUnifiedView
            cueListId={cueListId}
            onClose={handleClose}
            onCueListLoaded={handleCueListLoaded}
          />
        ) : (
          <CueListPlayer
            cueListId={cueListId}
            onCueListLoaded={handleCueListLoaded}
          />
        )}
      </div>
    </div>
  );
}
