import { gql } from '@apollo/client';

export const GET_SETTINGS = gql`
  query GetSettings {
    settings {
      id
      key
      value
      createdAt
      updatedAt
    }
  }
`;

export const GET_SETTING = gql`
  query GetSetting($key: String!) {
    setting(key: $key) {
      id
      key
      value
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SETTING = gql`
  mutation UpdateSetting($input: UpdateSettingInput!) {
    updateSetting(input: $input) {
      id
      key
      value
      createdAt
      updatedAt
    }
  }
`;

export const GET_SYSTEM_INFO = gql`
  query GetSystemInfo {
    systemInfo {
      artnetBroadcastAddress
      artnetEnabled
    }
  }
`;

export const GET_NETWORK_INTERFACE_OPTIONS = gql`
  query GetNetworkInterfaceOptions {
    networkInterfaceOptions {
      name
      address
      broadcast
      description
      interfaceType
    }
  }
`;

export const SYSTEM_INFO_UPDATED = gql`
  subscription SystemInfoUpdated {
    systemInfoUpdated {
      artnetBroadcastAddress
      artnetEnabled
    }
  }
`;
