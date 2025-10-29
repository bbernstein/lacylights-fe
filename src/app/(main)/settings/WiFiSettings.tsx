'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  WIFI_NETWORKS,
  WIFI_STATUS,
  CONNECT_WIFI,
  DISCONNECT_WIFI,
  SET_WIFI_ENABLED,
  FORGET_WIFI_NETWORK,
  WIFI_STATUS_UPDATED,
} from '@/graphql/wifi';
import { WiFiNetwork, WiFiStatus, WiFiConnectionResult } from '@/types';
import { WiFiNetworkItem } from '@/components/WiFiNetworkItem';
import { WiFiConnectionDialog } from '@/components/WiFiConnectionDialog';

/**
 * WiFi Settings Component
 * Complete WiFi configuration interface with:
 * - Enable/disable WiFi radio
 * - Current connection status
 * - Network scanning and list
 * - Connect/disconnect/forget operations
 */
export default function WiFiSettings() {
  const [scanning, setScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [connectingSSID, setConnectingSSID] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [forgettingSSID, setForgettingSSID] = useState<string | null>(null);
  const [showNetworkList, setShowNetworkList] = useState(false);

  // Queries
  const {
    data: networksData,
    loading: networksLoading,
    refetch: refetchNetworks,
  } = useQuery(WIFI_NETWORKS, {
    variables: { rescan: false },
    pollInterval: 10000, // Poll every 10 seconds
  });

  const {
    data: statusData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery(WIFI_STATUS, {
    pollInterval: 5000, // Poll every 5 seconds
  });

  // Subscribe to status updates
  useSubscription(WIFI_STATUS_UPDATED, {
    onData: ({ data }) => {
      if (data.data?.wifiStatusUpdated) {
        // Status updated via subscription, refetch networks to update list
        refetchNetworks();
      }
    },
  });

  // Mutations
  const [connectWiFi, { loading: connecting }] = useMutation(CONNECT_WIFI);
  const [disconnectWiFi] = useMutation(DISCONNECT_WIFI);
  const [setWiFiEnabled, { loading: togglingWiFi }] = useMutation(SET_WIFI_ENABLED);
  const [forgetWiFiNetwork] = useMutation(FORGET_WIFI_NETWORK);

  const networks: WiFiNetwork[] = networksData?.wifiNetworks || [];
  const status: WiFiStatus | undefined = statusData?.wifiStatus;

  /**
   * Sort networks: remembered networks first, then by signal strength
   */
  const sortedNetworks = [...networks].sort((a, b) => {
    // Remembered networks go first
    if (a.saved && !b.saved) return -1;
    if (!a.saved && b.saved) return 1;
    // Within each group, sort by signal strength
    return b.signalStrength - a.signalStrength;
  });

  /**
   * Handle WiFi radio enable/disable toggle
   */
  const handleToggleWiFi = async () => {
    if (!status) return;

    try {
      await setWiFiEnabled({
        variables: { enabled: !status.enabled },
      });
      await refetchStatus();
      if (!status.enabled) {
        // If enabling, scan for networks
        await handleScan();
      }
    } catch (error) {
      console.error('Error toggling WiFi:', error);
    }
  };

  /**
   * Handle network scan
   */
  const handleScan = async () => {
    setScanning(true);
    setShowNetworkList(true); // Show network list when scanning
    try {
      await refetchNetworks({ rescan: true });
    } catch (error) {
      console.error('Error scanning networks:', error);
    } finally {
      setScanning(false);
    }
  };

  /**
   * Handle "Connect to a network" button click
   */
  const handleShowNetworks = () => {
    setShowNetworkList(true);
    // Trigger a scan to get fresh network list
    handleScan();
  };

  /**
   * Handle connect button click
   */
  const handleConnectClick = (network: WiFiNetwork) => {
    setSelectedNetwork(network);
    setConnectionError(undefined);
    setShowConnectionDialog(true);
  };

  /**
   * Handle connect with password
   */
  const handleConnect = async (ssid: string, password?: string) => {
    setConnectingSSID(ssid);
    setConnectionError(undefined);

    try {
      const result = await connectWiFi({
        variables: { ssid, password },
      });

      const connectionResult: WiFiConnectionResult = result.data?.connectWiFi;

      if (connectionResult.success) {
        setShowConnectionDialog(false);
        setSelectedNetwork(null);
        setShowNetworkList(false); // Hide network list after successful connection
        await refetchStatus();
        await refetchNetworks();
      } else {
        setConnectionError(connectionResult.message || 'Connection failed');
      }
    } catch (error) {
      console.error('Error connecting to WiFi:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setConnectingSSID(null);
    }
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectWiFi();
      await refetchStatus();
      await refetchNetworks();
      setShowNetworkList(true); // Show network list after disconnecting
    } catch (error) {
      console.error('Error disconnecting from WiFi:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  /**
   * Handle forget network
   */
  const handleForget = async (ssid: string) => {
    setForgettingSSID(ssid);
    try {
      await forgetWiFiNetwork({
        variables: { ssid },
      });
      await refetchNetworks();
    } catch (error) {
      console.error('Error forgetting WiFi network:', error);
    } finally {
      setForgettingSSID(null);
    }
  };

  // Auto-scan when component mounts if WiFi is enabled and not connected
  useEffect(() => {
    if (status?.enabled && !status?.connected && networks.length === 0) {
      // Silently fetch networks without showing the list
      refetchNetworks({ rescan: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.enabled, status?.connected]);

  const isLoading = statusLoading || networksLoading;

  if (isLoading && !status) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading WiFi settings...</div>
      </div>
    );
  }

  // Don't render WiFi section if WiFi is not available on this system
  // This hides the WiFi configuration on macOS development machines
  // and only shows it on systems with WiFi support (e.g., Raspberry Pi)
  if (!status?.available) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">WiFi Configuration</h2>
      <div className="space-y-6">
      {/* WiFi Enable/Disable Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">WiFi Radio</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enable or disable the WiFi adapter for wireless connectivity
            </p>
          </div>
          <button
            onClick={handleToggleWiFi}
            disabled={togglingWiFi}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              status?.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            } ${togglingWiFi ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={status?.enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                status?.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* WiFi Network Connection Section */}
      {status?.enabled && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Network Connection</h3>
          </div>

          {/* Connected Network - Compact View */}
          {status.connected && !showNetworkList && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Connected to {status.ssid}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {status.ipAddress && <span>IP: {status.ipAddress}</span>}
                      {status.signalStrength && (
                        <span className="ml-3">Signal: {status.signalStrength}%</span>
                      )}
                      {status.frequency && <span className="ml-3">{status.frequency}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Disconnect from network"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Not Connected - Show Connect Button */}
          {!status.connected && !showNetworkList && (
            <div className="px-6 py-4">
              <button
                onClick={handleShowNetworks}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
                <span>Connect to a network</span>
              </button>
            </div>
          )}

          {/* Network List - Expanded View */}
          {showNetworkList && (
            <>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {scanning ? 'Scanning for networks...' : `${sortedNetworks.length} network${sortedNetworks.length !== 1 ? 's' : ''} found`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Scan for networks"
                    >
                      <svg
                        className={`w-4 h-4 mr-1.5 ${scanning ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Scan
                    </button>
                    <button
                      onClick={() => setShowNetworkList(false)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Hide network list"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Hide
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedNetworks.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {scanning ? 'Scanning for networks...' : 'No networks found. Try scanning again.'}
                  </div>
                ) : (
                  sortedNetworks.map((network) => (
                    <WiFiNetworkItem
                      key={network.ssid}
                      network={network}
                      onConnect={() => handleConnectClick(network)}
                      onDisconnect={handleDisconnect}
                      onForget={() => handleForget(network.ssid)}
                      connecting={connectingSSID === network.ssid}
                      disconnecting={disconnecting && network.inUse}
                      forgetting={forgettingSSID === network.ssid}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Connection Dialog */}
      <WiFiConnectionDialog
        network={selectedNetwork}
        isOpen={showConnectionDialog}
        connecting={connecting}
        errorMessage={connectionError}
        onConnect={handleConnect}
        onCancel={() => {
          setShowConnectionDialog(false);
          setSelectedNetwork(null);
          setConnectionError(undefined);
        }}
      />
      </div>
    </div>
  );
}
