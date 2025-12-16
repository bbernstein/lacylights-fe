'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SETTINGS, UPDATE_SETTING, GET_NETWORK_INTERFACE_OPTIONS, GET_SYSTEM_INFO } from '@/graphql/settings';
import { Setting, UpdateSettingInput, NetworkInterfaceOption, SystemInfo } from '@/types';
import WiFiSettings from './WiFiSettings';
import VersionManagement from './VersionManagement';
import OFLManagement from './OFLManagement';

interface SettingDefinition {
  key: string;
  displayName: string;
  description: string;
  getCurrentValue: (systemInfo: SystemInfo | undefined) => string;
}

const KNOWN_SETTINGS: SettingDefinition[] = [
  {
    key: 'artnet_broadcast_address',
    displayName: 'Artnet Broadcast Address',
    description: 'The IP address to broadcast DMX data via Art-Net protocol. Select from available network interfaces or enter manually.',
    getCurrentValue: (systemInfo) => systemInfo?.artnetBroadcastAddress || '',
  },
  {
    key: 'fade_update_rate',
    displayName: 'Fade Update Rate (Hz)',
    description: 'The frequency at which fade transitions are updated, in Hertz (Hz). Higher values provide smoother transitions but use more CPU. Valid range: 10-120 Hz. Default: 60 Hz.',
    getCurrentValue: (systemInfo) => systemInfo?.fadeUpdateRateHz?.toString() || '60',
  },
];

export default function SettingsPage() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_SETTINGS);
  const { data: systemInfoData } = useQuery(GET_SYSTEM_INFO);
  const { data: interfaceData } = useQuery(GET_NETWORK_INTERFACE_OPTIONS);
  const [updateSetting, { loading: updating }] = useMutation(UPDATE_SETTING);

  const networkInterfaces: NetworkInterfaceOption[] = interfaceData?.networkInterfaceOptions || [];

  // Merge known settings with saved settings to show current values
  const allSettings = useMemo(() => {
    const savedSettings: Setting[] = data?.settings || [];
    return KNOWN_SETTINGS.map((definition) => {
      const savedSetting = savedSettings.find((s) => s.key === definition.key);
      return {
        key: definition.key,
        displayName: definition.displayName,
        description: definition.description,
        value: savedSetting?.value || definition.getCurrentValue(systemInfoData?.systemInfo),
        id: savedSetting?.id || definition.key,
        isFromDatabase: !!savedSetting,
      };
    });
  }, [data, systemInfoData]);

  // Separate settings by category
  const artnetSettings = useMemo(() =>
    allSettings.filter(s => s.key === 'artnet_broadcast_address'),
    [allSettings]
  );

  const fadeEngineSettings = useMemo(() =>
    allSettings.filter(s => s.key === 'fade_update_rate'),
    [allSettings]
  );

  const validateFadeUpdateRate = (value: string): string | null => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }
    if (num < 10 || num > 120) {
      return 'Fade update rate must be between 10 and 120 Hz';
    }
    return null;
  };

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditingValue(value);
    setManualEntry(false);
    setValidationError(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditingValue('');
    setManualEntry(false);
    setValidationError(null);
  };

  const handleSave = async (key: string) => {
    // Validate fade_update_rate before saving
    if (key === 'fade_update_rate') {
      const error = validateFadeUpdateRate(editingValue);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    try {
      await updateSetting({
        variables: {
          input: {
            key,
            value: editingValue,
          } as UpdateSettingInput,
        },
      });
      await refetch();
      setEditingKey(null);
      setEditingValue('');
      setValidationError(null);
    } catch (err) {
      console.error('Error updating setting:', err);
      setValidationError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  };

  const renderSettingsTable = (settings: typeof allSettings) => {
    if (settings.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Setting
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {settings.map((setting) => (
              <tr key={setting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <span>{setting.displayName}</span>
                    <div className="group relative">
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="invisible group-hover:visible absolute left-0 top-6 z-50 w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg pointer-events-none">
                        {setting.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {editingKey === setting.key ? (
                    setting.key === 'artnet_broadcast_address' ? (
                      <div className="space-y-2">
                        {!manualEntry ? (
                          <>
                            <select
                              value={editingValue}
                              onChange={(e) => {
                                if (e.target.value === '__manual__') {
                                  setManualEntry(true);
                                } else {
                                  setEditingValue(e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            >
                              <option value="">Select network interface...</option>
                              {networkInterfaces.map((iface) => (
                                <option key={iface.name} value={iface.broadcast}>
                                  {iface.description}
                                </option>
                              ))}
                              <option value="__manual__">Enter manually...</option>
                            </select>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              placeholder="e.g., 192.168.1.255"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => setManualEntry(false)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              ← Back to dropdown
                            </button>
                          </div>
                        )}
                      </div>
                    ) : setting.key === 'fade_update_rate' ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => {
                            setEditingValue(e.target.value);
                            setValidationError(null);
                          }}
                          min="10"
                          max="120"
                          placeholder="60"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                            validationError
                              ? 'border-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          autoFocus
                        />
                        {validationError && (
                          <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valid range: 10-120 Hz</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                    )
                  ) : (
                    setting.value
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingKey === setting.key ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleSave(setting.key)}
                        disabled={updating}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={updating}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(setting.key, setting.value)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error loading settings: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* WiFi Configuration Section - Only show on systems with WiFi support */}
      <WiFiSettings />

      {/* Fixture Library Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Fixture Library</h2>
        <OFLManagement />
      </div>

      {/* Version Management Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Version Management</h2>
        <VersionManagement />
      </div>

      {/* Fade Engine Configuration Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Fade Engine Configuration</h2>
        {renderSettingsTable(fadeEngineSettings)}
      </div>

      {/* Art-Net Configuration Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Art-Net Configuration</h2>
        {renderSettingsTable(artnetSettings)}
      </div>
    </div>
  );
}
