import { WiFiSecurityType } from '@/types';

/**
 * Security badge component for WiFi networks
 * Displays security type with appropriate icon and color
 */

interface SecurityBadgeProps {
  type: WiFiSecurityType;
  className?: string;
}

interface SecurityBadgeConfig {
  label: string;
  color: string;
  icon: JSX.Element;
}

/**
 * Get security badge configuration based on security type
 */
function getSecurityConfig(type: WiFiSecurityType): SecurityBadgeConfig {
  const configs: Record<WiFiSecurityType, SecurityBadgeConfig> = {
    [WiFiSecurityType.OPEN]: {
      label: 'Open',
      color: 'text-yellow-600 dark:text-yellow-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    [WiFiSecurityType.WEP]: {
      label: 'WEP',
      color: 'text-orange-600 dark:text-orange-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    [WiFiSecurityType.WPA_PSK]: {
      label: 'WPA2',
      color: 'text-green-600 dark:text-green-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    [WiFiSecurityType.WPA_EAP]: {
      label: 'WPA2 Enterprise',
      color: 'text-blue-600 dark:text-blue-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    [WiFiSecurityType.WPA3_PSK]: {
      label: 'WPA3',
      color: 'text-blue-600 dark:text-blue-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    [WiFiSecurityType.WPA3_EAP]: {
      label: 'WPA3 Enterprise',
      color: 'text-blue-600 dark:text-blue-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    [WiFiSecurityType.OWE]: {
      label: 'OWE',
      color: 'text-purple-600 dark:text-purple-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  };

  return configs[type];
}

/**
 * Displays a badge with the WiFi security type
 */
export function SecurityBadge({ type, className = '' }: SecurityBadgeProps) {
  const config = getSecurityConfig(type);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${className}`}
      title={`Security: ${config.label}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
