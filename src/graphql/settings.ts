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
