import { FadeBehavior } from '@/types';

interface FadeBehaviorBadgeProps {
  fadeBehavior: FadeBehavior;
  isDiscrete?: boolean;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Badge component that displays the fade behavior of a channel.
 * Shows a visual indicator and optional label for FADE, SNAP, or SNAP_END behavior.
 */
export default function FadeBehaviorBadge({
  fadeBehavior,
  isDiscrete,
  size = 'sm',
  showLabel = false,
  onClick,
  className = ''
}: FadeBehaviorBadgeProps) {
  const getConfig = () => {
    switch (fadeBehavior) {
      case FadeBehavior.FADE:
        return {
          icon: '~', // Wave symbol for smooth fade
          label: 'Fade',
          title: 'Smooth fade - interpolates between values',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700'
        };
      case FadeBehavior.SNAP:
        return {
          icon: '⚡', // Lightning for instant snap
          label: 'Snap',
          title: 'Instant snap - jumps to target at start of transition',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-400',
          borderColor: 'border-amber-300 dark:border-amber-700'
        };
      case FadeBehavior.SNAP_END:
        return {
          icon: '⏹', // Stop symbol for snap at end
          label: 'Snap End',
          title: 'Snap at end - jumps to target at end of transition',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-700 dark:text-purple-400',
          borderColor: 'border-purple-300 dark:border-purple-700'
        };
      default:
        return {
          icon: '?',
          label: 'Unknown',
          title: 'Unknown fade behavior',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-500 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-600'
        };
    }
  };

  const config = getConfig();
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1 py-0'
    : 'text-xs px-1.5 py-0.5';

  const cursorClass = onClick ? 'cursor-pointer hover:opacity-80' : '';
  const discreteIndicator = isDiscrete ? ' •' : '';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses} ${cursorClass} ${className}`}
      title={`${config.title}${isDiscrete ? ' (discrete channel)' : ''}`}
      onClick={onClick}
    >
      <span className="font-mono">{config.icon}</span>
      {showLabel && <span className="font-medium">{config.label}{discreteIndicator}</span>}
    </span>
  );
}
