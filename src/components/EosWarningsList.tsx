"use client";

import { useMemo } from "react";
import { EosWarning } from "@/generated/graphql";

interface Props {
  warnings: ReadonlyArray<EosWarning>;
}

const FRIENDLY_NAMES: Record<string, string> = {
  SYNTHESIZED_FIXTURE: "Synthesized fixtures",
  EFFECT_SKIPPED: "Effects skipped",
  SUBMASTER_SKIPPED: "Submasters skipped",
  MAGIC_SHEET_SKIPPED: "Magic sheets skipped",
  PARTITION_SKIPPED: "Partitions skipped",
  ACTION_SKIPPED: "Action triggers skipped",
  CURVE_SKIPPED: "Curves skipped",
  UNKNOWN_DIRECTIVE: "Unknown directives",
  FADE_BEHAVIOR_LOST: "Fade behavior lost",
  UTEXT_DECODE: "Unicode label decode failures",
  SIDECAR_INVALID: "Sidecar parse issues",
  SIDECAR_UNRESOLVED: "Sidecar references unresolved",
  UNPATCHED_CHANNEL: "Unpatched channels",
  UNPATCHED_INSTANCE: "Unpatched fixture instances",
  LOOK_VALUES_INVALID: "Invalid look values",
  GROUPS_SKIPPED: "Groups skipped",
  ADDRESS_CONFLICT: "Address conflicts",
  GROUP_AUTO_ASSIGNED: "Groups auto-assigned",
  PERSONALITY_ID_IN_SYNTH_RANGE: "Personality IDs in synthesized range",
  PATCH_EXTENDED_FIELDS: "Patch lines with extended fields",
  PATCH_AMBIGUOUS_FIELDS: "Patch lines with ambiguous fields",
};

export default function EosWarningsList({ warnings }: Props) {
  const groups = useMemo(() => {
    const m = new Map<string, EosWarning[]>();
    warnings.forEach((w) => {
      const list = m.get(w.code) ?? [];
      list.push(w);
      m.set(w.code, list);
    });
    return m;
  }, [warnings]);

  if (warnings.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Eos notices"
      className="rounded border border-amber-200 bg-amber-50 p-4"
    >
      <h3 className="mb-2 text-sm font-semibold text-amber-900">
        Eos notices
      </h3>
      <ul className="space-y-3" aria-label="Eos warnings grouped by code">
        {Array.from(groups.entries()).map(([code, ws]) => (
          <li key={code}>
            <details>
              <summary className="cursor-pointer font-medium text-amber-800">
                {FRIENDLY_NAMES[code] ?? code} ({ws.length})
              </summary>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-amber-700">
                {ws.slice(0, 50).map((w, i) => (
                  <li key={`${code}-${i}`}>{w.message}</li>
                ))}
                {ws.length > 50 && <li>… and {ws.length - 50} more</li>}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
