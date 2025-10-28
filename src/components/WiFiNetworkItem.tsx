import { WiFiNetwork } from '@/types';
import { SignalStrengthIndicator } from './SignalStrengthIndicator';
import { SecurityBadge } from './SecurityBadge';

/**
 * WiFi network item component
 * Displays a single WiFi network in the network list
 */

interface WiFiNetworkItemProps {
  network: WiFiNetwork;
  onConnect: () => void;
  onDisconnect: () => void;
  onForget: () => void;
  connecting: boolean;
  disconnecting: boolean;
  forgetting: boolean;
}

/**
 * Displays a single WiFi network with signal strength, security, and action buttons
 */
export function WiFiNetworkItem({
  network,
  onConnect,
  onDisconnect,
  onForget,
  connecting,
  disconnecting,
  forgetting,
}: WiFiNetworkItemProps) {
  const isLoading = connecting || disconnecting || forgetting;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* Left side: Signal, SSID, Security */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Signal strength indicator */}
        <SignalStrengthIndicator strength={network.signalStrength} />

        {/* Network info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* SSID */}
            <span className="font-medium text-gray-900 dark:text-white truncate">{network.ssid}</span>

            {/* Connected badge */}
            {network.inUse && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Connected
              </span>
            )}

            {/* Saved bookmark icon */}
            {network.saved && !network.inUse && (
              <svg
                className="w-4 h-4 text-blue-500 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Saved network"
              >
                <title>Saved network</title>
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            )}
          </div>

          {/* Frequency and security */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{network.frequency}</span>
            <SecurityBadge type={network.security} />
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2 ml-4">
        {network.inUse ? (
          /* Disconnect button */
          <button
            onClick={onDisconnect}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          /* Connect button */
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        )}

        {/* Forget button (only shown for saved networks) */}
        {network.saved && (
          <button
            onClick={onForget}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Forget this network"
          >
            {forgetting ? 'Forgetting...' : 'Forget'}
          </button>
        )}
      </div>
    </div>
  );
}
