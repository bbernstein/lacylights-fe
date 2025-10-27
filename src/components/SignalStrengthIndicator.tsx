/**
 * Signal strength indicator component for WiFi networks
 * Displays 0-4 bars based on signal strength percentage
 */

interface SignalStrengthIndicatorProps {
  strength: number; // 0-100 percentage
  className?: string;
}

/**
 * Displays a visual signal strength indicator with 1-4 bars
 *
 * Signal strength mapping:
 * - 0-25%: 1 bar
 * - 26-50%: 2 bars
 * - 51-75%: 3 bars
 * - 76-100%: 4 bars
 */
export function SignalStrengthIndicator({ strength, className = '' }: SignalStrengthIndicatorProps) {
  // Calculate number of active bars (1-4)
  const bars = Math.max(1, Math.min(4, Math.ceil(strength / 25)));

  // Determine color based on signal strength
  const getBarColor = (barIndex: number) => {
    if (barIndex > bars) return 'bg-gray-300 dark:bg-gray-600'; // Inactive

    // Active bars - color based on strength
    if (strength >= 75) return 'bg-green-500 dark:bg-green-400';
    if (strength >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
    if (strength >= 25) return 'bg-orange-500 dark:bg-orange-400';
    return 'bg-red-500 dark:bg-red-400';
  };

  return (
    <div
      className={`flex items-end gap-0.5 h-5 ${className}`}
      title={`Signal strength: ${strength}%`}
      aria-label={`Signal strength: ${strength}%`}
    >
      {[1, 2, 3, 4].map((barIndex) => (
        <div
          key={barIndex}
          className={`w-1 rounded-t transition-colors ${getBarColor(barIndex)}`}
          style={{ height: `${barIndex * 25}%` }}
        />
      ))}
    </div>
  );
}
