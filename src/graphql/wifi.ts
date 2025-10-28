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
    }
  }
`;
