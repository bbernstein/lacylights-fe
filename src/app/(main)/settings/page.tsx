'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SETTINGS, UPDATE_SETTING } from '@/graphql/settings';
import { Setting, UpdateSettingInput } from '@/types';

export default function SettingsPage() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_SETTINGS);
  const [updateSetting, { loading: updating }] = useMutation(UPDATE_SETTING);

  const handleEdit = (setting: Setting) => {
    setEditingKey(setting.key);
    setEditingValue(setting.value);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const handleSave = async (key: string) => {
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
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  };

  const handleAddSetting = async () => {
    if (!newKey || !newValue) {
      return;
    }

    try {
      await updateSetting({
        variables: {
          input: {
            key: newKey,
            value: newValue,
          } as UpdateSettingInput,
        },
      });
      await refetch();
      setShowAddForm(false);
      setNewKey('');
      setNewValue('');
    } catch (err) {
      console.error('Error adding setting:', err);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewKey('');
    setNewValue('');
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

  const settings: Setting[] = data?.settings || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Setting
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Setting</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key
              </label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., artnet_broadcast_address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Value
              </label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g., 192.168.1.255"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelAdd}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSetting}
                disabled={!newKey || !newValue || updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Setting
              </button>
            </div>
          </div>
        </div>
      )}

      {settings.length === 0 && !showAddForm ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No settings configured yet. Click &quot;Add Setting&quot; to create one.
          </p>
        </div>
      ) : settings.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Key
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
                    {setting.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {editingKey === setting.key ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
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
                        onClick={() => handleEdit(setting)}
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
      ) : null}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Available Settings
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>
            <strong>artnet_broadcast_address:</strong> The IP address to broadcast DMX data via Art-Net (e.g., 192.168.1.255)
          </li>
        </ul>
      </div>
    </div>
  );
}
