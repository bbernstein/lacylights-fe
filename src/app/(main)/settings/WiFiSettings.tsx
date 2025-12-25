'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  WIFI_NETWORKS,
  WIFI_STATUS,
  CONNECT_WIFI,
  DISCONNECT_WIFI,
  SET_WIFI_ENABLED,
  FORGET_WIFI_NETWORK,
  WIFI_STATUS_UPDATED,
  START_AP_MODE,
  STOP_AP_MODE,
  RESET_AP_TIMEOUT,
  WIFI_MODE_CHANGED,
} from '@/graphql/wifi';
import { WiFiNetwork, WiFiStatus, WiFiConnectionResult, WiFiMode, WiFiModeResult } from '@/types';
import { WiFiNetworkItem } from '@/components/WiFiNetworkItem';
import { WiFiConnectionDialog } from '@/components/WiFiConnectionDialog';
import { WiFiModeIndicator } from '@/components/WiFiModeIndicator';
import { APModeInstructions } from '@/components/APModeInstructions';
import { APClientList } from '@/components/APClientList';

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
  const hasScannedOnMount = useRef(false);

  // AP mode manual WiFi configuration state
  const [apModeSSID, setApModeSSID] = useState('');
  const [apModePassword, setApModePassword] = useState('');
  const [apModeShowPassword, setApModeShowPassword] = useState(false);
  const [apModeConnecting, setApModeConnecting] = useState(false);
  const [apModeError, setApModeError] = useState<string | undefined>();

  // Connection initiated state - shown when connecting from AP mode
  // Network will be unreachable after AP shuts down, so we show success immediately
  const [connectionInitiated, setConnectionInitiated] = useState<{
    ssid: string;
    inProgress: boolean;
  } | null>(null);

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
  const [startAPMode, { loading: startingAP }] = useMutation(START_AP_MODE);
  const [stopAPMode, { loading: stoppingAP }] = useMutation(STOP_AP_MODE);
  const [resetAPTimeout, { loading: resettingTimeout }] = useMutation(RESET_AP_TIMEOUT);

  // Subscribe to WiFi mode changes
  useSubscription(WIFI_MODE_CHANGED, {
    onData: ({ data }) => {
      if (data.data?.wifiModeChanged) {
        // Mode changed, refetch full status
        refetchStatus();
      }
    },
  });

  const status: WiFiStatus | undefined = statusData?.wifiStatus;
  const isInAPMode = status?.mode === WiFiMode.AP || status?.mode === WiFiMode.STARTING_AP;

  /**
   * Sort networks: remembered networks first, then by signal strength
   * Memoized to avoid unnecessary sorting on every render
   */
  const sortedNetworks = useMemo(() => {
    const networks = networksData?.wifiNetworks || [];
    return [...networks].sort((a, b) => {
      // Remembered networks go first
      if (a.saved && !b.saved) return -1;
      if (!a.saved && b.saved) return 1;
      // Within each group, sort by signal strength
      return b.signalStrength - a.signalStrength;
    });
  }, [networksData?.wifiNetworks]);

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
   * Triggers a scan which will also show the network list
   */
  const handleShowNetworks = () => {
    // handleScan() already calls setShowNetworkList(true)
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
   * When in AP mode, we show success immediately since the network will drop
   */
  const handleConnect = async (ssid: string, password?: string) => {
    // Special handling for AP mode - network will be unreachable after connect
    if (isInAPMode) {
      // Close the dialog and show connection initiated screen
      setShowConnectionDialog(false);
      setSelectedNetwork(null);
      setConnectionInitiated({ ssid, inProgress: true });

      // Fire off the connect mutation - don't wait for response
      // The AP will shut down and we'll lose connectivity, which is expected
      connectWiFi({
        variables: { ssid, password },
      })
        .then(() => {
          // If we somehow get a success response, update the state
          setConnectionInitiated((prev) => (prev ? { ...prev, inProgress: false } : null));
        })
        .catch((error) => {
          // Network errors are expected when AP shuts down - don't treat as error
          console.log('Expected network interruption during AP mode connect:', error);
          setConnectionInitiated((prev) => (prev ? { ...prev, inProgress: false } : null));
        });

      return;
    }

    // Normal (non-AP mode) connection flow
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

  /**
   * Handle starting AP mode
   */
  const handleStartAPMode = async () => {
    try {
      const result = await startAPMode();
      const modeResult: WiFiModeResult = result.data?.startAPMode;

      if (modeResult.success) {
        await refetchStatus();
      } else {
        console.error('Failed to start AP mode:', modeResult.message);
      }
    } catch (error) {
      console.error('Error starting AP mode:', error);
    }
  };

  /**
   * Handle stopping AP mode
   */
  const handleStopAPMode = async (connectToSSID?: string) => {
    try {
      const result = await stopAPMode({
        variables: { connectToSSID },
      });
      const modeResult: WiFiModeResult = result.data?.stopAPMode;

      if (modeResult.success) {
        await refetchStatus();
        if (!connectToSSID) {
          // If not connecting to a network, show network list
          setShowNetworkList(true);
        }
      } else {
        console.error('Failed to stop AP mode:', modeResult.message);
      }
    } catch (error) {
      console.error('Error stopping AP mode:', error);
    }
  };

  /**
   * Handle resetting AP timeout
   */
  const handleResetAPTimeout = async () => {
    try {
      await resetAPTimeout();
      await refetchStatus();
    } catch (error) {
      console.error('Error resetting AP timeout:', error);
    }
  };

  /**
   * Handle connecting to WiFi from AP mode
   * Stops AP mode first, then connects to the specified network
   */
  const handleAPModeConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apModeSSID.trim()) {
      setApModeError('Please enter a network name');
      return;
    }

    setApModeConnecting(true);
    setApModeError(undefined);

    try {
      // First stop AP mode
      const stopResult = await stopAPMode();
      const stopModeResult: WiFiModeResult = stopResult.data?.stopAPMode;

      if (!stopModeResult.success) {
        setApModeError(stopModeResult.message || 'Failed to exit hotspot mode');
        setApModeConnecting(false);
        return;
      }

      // Then connect to the network
      const connectResult = await connectWiFi({
        variables: { ssid: apModeSSID.trim(), password: apModePassword || undefined },
      });

      const connectionResult: WiFiConnectionResult = connectResult.data?.connectWiFi;

      if (connectionResult.success) {
        // Clear form and refresh status
        setApModeSSID('');
        setApModePassword('');
        await refetchStatus();
      } else {
        setApModeError(connectionResult.message || 'Failed to connect to network');
      }
    } catch (error) {
      console.error('Error connecting from AP mode:', error);
      setApModeError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setApModeConnecting(false);
    }
  };

  // Auto-scan when component mounts if WiFi is enabled and not connected
  // Only runs once on mount to avoid unnecessary rescans
  useEffect(() => {
    if (!hasScannedOnMount.current && status?.enabled && !status?.connected && (networksData?.wifiNetworks?.length || 0) === 0) {
      // Silently fetch networks without showing the list
      refetchNetworks({ rescan: true });
      hasScannedOnMount.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.enabled, status?.connected, networksData?.wifiNetworks?.length]);

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">WiFi Configuration</h2>
        {status?.mode && (
          <WiFiModeIndicator
            mode={status.mode}
            clientCount={status.apConfig?.clientCount}
            ssid={status.connected ? status.ssid : undefined}
          />
        )}
      </div>
      <div className="space-y-6">
      {/* Connection Initiated from AP Mode - Show success with instructions */}
      {connectionInitiated && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {connectionInitiated.inProgress ? (
                <svg className="w-8 h-8 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                {connectionInitiated.inProgress ? 'Connecting to WiFi...' : 'Connection Initiated!'}
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p className="font-medium">LacyLights is connecting to &quot;{connectionInitiated.ssid}&quot;</p>
                <p className="mt-2">The hotspot has been turned off. To continue using LacyLights:</p>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Connect your device to <strong>&quot;{connectionInitiated.ssid}&quot;</strong></li>
                  <li>Open LacyLights again (same address: <code className="bg-green-100 dark:bg-green-800 px-1 rounded">lacylights.local</code>)</li>
                </ol>
              </div>
              <p className="mt-4 text-xs text-green-600 dark:text-green-400">
                If the connection fails, you can start the hotspot again from the Settings page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AP Mode Section */}
      {isInAPMode && status?.apConfig && !connectionInitiated && (
        <>
          <APModeInstructions
            apConfig={status.apConfig}
            onResetTimeout={handleResetAPTimeout}
            resettingTimeout={resettingTimeout}
          />

          {/* Available Networks Section - shown in AP mode */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Your Home WiFi Network</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a network from the list below, or enter details manually.
              </p>
            </div>

            {/* Scan controls */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {scanning ? 'Scanning for networks...' : `${sortedNetworks.length} network${sortedNetworks.length !== 1 ? 's' : ''} found`}
                </span>
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
              </div>
            </div>

            {/* Network list */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
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

            {/* Manual entry section */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>Enter network details manually</span>
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <form onSubmit={handleAPModeConnect} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="ap-ssid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      id="ap-ssid"
                      value={apModeSSID}
                      onChange={(e) => setApModeSSID(e.target.value)}
                      placeholder="Enter your WiFi network name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      disabled={apModeConnecting}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ap-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={apModeShowPassword ? 'text' : 'password'}
                        id="ap-password"
                        value={apModePassword}
                        onChange={(e) => setApModePassword(e.target.value)}
                        placeholder="Enter network password"
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        disabled={apModeConnecting}
                      />
                      <button
                        type="button"
                        onClick={() => setApModeShowPassword(!apModeShowPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {apModeShowPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {apModeError && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                      <p className="text-sm text-red-800 dark:text-red-200">{apModeError}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={apModeConnecting || !apModeSSID.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {apModeConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </form>
              </details>
            </div>
          </div>

          {/* Connected Clients */}
          {status.connectedClients && status.connectedClients.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <APClientList clients={status.connectedClients} />
            </div>
          )}

          {/* Exit AP Mode Button */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleStopAPMode()}
                disabled={stoppingAP}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stoppingAP ? 'Exiting Hotspot Mode...' : 'Exit Hotspot Mode'}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Exit hotspot mode to connect to your regular WiFi network.
            </p>
          </div>
        </>
      )}

      {/* WiFi Enable/Disable Section - Only show when not in AP mode */}
      {!isInAPMode && (
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
      )}

      {/* WiFi Network Connection Section - Only show when not in AP mode */}
      {status?.enabled && !isInAPMode && (
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

      {/* Switch to Hotspot Mode - Only show when in client mode and enabled */}
      {status?.enabled && !isInAPMode && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0"
                />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hotspot Mode</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a WiFi hotspot so other devices can connect directly to LacyLights for initial setup or when no WiFi network is available.
              </p>
              <button
                onClick={handleStartAPMode}
                disabled={startingAP}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startingAP ? 'Starting Hotspot...' : 'Switch to Hotspot Mode'}
              </button>
            </div>
          </div>
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
