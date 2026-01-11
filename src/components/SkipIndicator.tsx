/**
 * Skip indicator icon for displaying skipped cues.
 * Shows a double-arrow forward icon indicating the cue will be skipped during playback.
 *
 * @module SkipIndicator
 */

/**
 * Props for the SkipIndicator component.
 */
interface SkipIndicatorProps {
  /** Size variant of the icon. 'sm' = 12px (w-3), 'md' = 16px (w-4) */
  size?: "sm" | "md";
  /** Additional CSS classes to apply to the wrapper span */
  className?: string;
}

/**
 * Renders a skip indicator icon (double forward arrows) used to visually indicate
 * that a cue will be skipped during playback but remains visible in the UI.
 *
 * @param props - The component props
 * @returns A span element containing the skip indicator SVG icon
 *
 * @example
 * ```tsx
 * // Small size (12px) - used in CueRow and CueCard
 * <SkipIndicator size="sm" />
 *
 * // Medium size (16px) - used in CueListPlayer
 * <SkipIndicator size="md" />
 *
 * // With custom className
 * <SkipIndicator size="sm" className="ml-2" />
 * ```
 */
export function SkipIndicator({
  size = "sm",
  className = "",
}: SkipIndicatorProps) {
  const sizeClasses = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const displayStyle = size === "sm" ? "inline" : "";

  return (
    <span
      className={`text-gray-400 dark:text-gray-500 ${className}`}
      title="Skipped during playback"
      role="img"
      aria-label="Skip indicator"
    >
      <svg
        className={`${sizeClasses} ${displayStyle}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 5l7 7-7 7M5 5l7 7-7 7"
        />
      </svg>
    </span>
  );
}

export default SkipIndicator;
