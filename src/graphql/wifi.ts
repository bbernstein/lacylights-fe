import { gql } from '@apollo/client';

/**
 * Query to scan for available WiFi networks
 */
export const WIFI_NETWORKS = gql`
  query WiFiNetworks($rescan: Boolean) {
    wifiNetworks(rescan: $rescan) {
      ssid
      signalStrength
      frequency
      security
      inUse
      saved
    }
  }
`;

/**
 * Query to get current WiFi connection status
 */
export const WIFI_STATUS = gql`
  query WiFiStatus {
    wifiStatus {
      available
      enabled
      connected
      ssid
      signalStrength
      ipAddress
      macAddress
      frequency
      mode
      apConfig {
        ssid
        ipAddress
        channel
        clientCount
        timeoutMinutes
        minutesRemaining
      }
      connectedClients {
        macAddress
        ipAddress
        hostname
        connectedAt
      }
    }
  }
`;

/**
 * Query to get saved WiFi networks
 */
export const SAVED_WIFI_NETWORKS = gql`
  query SavedWiFiNetworks {
    savedWifiNetworks {
      ssid
      signalStrength
      frequency
      security
      inUse
      saved
    }
  }
`;

/**
 * Mutation to connect to a WiFi network
 */
export const CONNECT_WIFI = gql`
  mutation ConnectWiFi($ssid: String!, $password: String) {
    connectWiFi(ssid: $ssid, password: $password) {
      success
      message
      connected
    }
  }
`;

/**
 * Mutation to disconnect from current WiFi network
 */
export const DISCONNECT_WIFI = gql`
  mutation DisconnectWiFi {
    disconnectWiFi {
      success
      message
      connected
    }
  }
`;

/**
 * Mutation to enable or disable WiFi radio
 */
export const SET_WIFI_ENABLED = gql`
  mutation SetWiFiEnabled($enabled: Boolean!) {
    setWiFiEnabled(enabled: $enabled) {
      available
      enabled
      connected
      ssid
      signalStrength
      ipAddress
      macAddress
      frequency
    }
  }
`;

/**
 * Mutation to forget a saved WiFi network
 */
export const FORGET_WIFI_NETWORK = gql`
  mutation ForgetWiFiNetwork($ssid: String!) {
    forgetWiFiNetwork(ssid: $ssid)
  }
`;

/**
 * Subscription to WiFi status updates
 */
export const WIFI_STATUS_UPDATED = gql`
  subscription WiFiStatusUpdated {
    wifiStatusUpdated {
      available
      enabled
      connected
      ssid
      signalStrength
      ipAddress
      macAddress
      frequency
      mode
      apConfig {
        ssid
        ipAddress
        channel
        clientCount
        timeoutMinutes
        minutesRemaining
      }
      connectedClients {
        macAddress
        ipAddress
        hostname
        connectedAt
      }
    }
  }
`;

/**
 * Query to get current WiFi mode
 */
export const WIFI_MODE = gql`
  query WiFiMode {
    wifiMode
  }
`;

/**
 * Query to get AP configuration
 */
export const AP_CONFIG = gql`
  query APConfig {
    apConfig {
      ssid
      ipAddress
      channel
      clientCount
      timeoutMinutes
      minutesRemaining
    }
  }
`;

/**
 * Query to get connected AP clients
 */
export const AP_CLIENTS = gql`
  query APClients {
    apClients {
      macAddress
      ipAddress
      hostname
      connectedAt
    }
  }
`;

/**
 * Mutation to start AP mode
 */
export const START_AP_MODE = gql`
  mutation StartAPMode {
    startAPMode {
      success
      message
      mode
    }
  }
`;

/**
 * Mutation to stop AP mode and optionally connect to a network
 */
export const STOP_AP_MODE = gql`
  mutation StopAPMode($connectToSSID: String) {
    stopAPMode(connectToSSID: $connectToSSID) {
      success
      message
      mode
    }
  }
`;

/**
 * Mutation to reset AP mode timeout
 */
export const RESET_AP_TIMEOUT = gql`
  mutation ResetAPTimeout {
    resetAPTimeout
  }
`;

/**
 * Subscription to WiFi mode changes
 */
export const WIFI_MODE_CHANGED = gql`
  subscription WiFiModeChanged {
    wifiModeChanged
  }
`;
