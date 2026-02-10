'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { PencilIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { GET_DEVICES, GET_USERS, UPDATE_DEVICE, REVOKE_DEVICE, APPROVE_DEVICE, ADD_DEVICE_TO_GROUP, REMOVE_DEVICE_FROM_GROUP } from '@/graphql/auth';
import BottomSheet from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useGroup } from '@/contexts/GroupContext';
import { DeviceRole } from '@/types/auth';

interface Device {
  id: string;
  name: string;
  fingerprint: string;
  isAuthorized: boolean;
  defaultRole: DeviceRole;
  lastSeenAt?: string;
  lastIPAddress?: string;
  createdAt: string;
  updatedAt: string;
  defaultUser?: {
    id: string;
    email: string;
    name?: string;
  };
  groups?: {
    id: string;
    name: string;
    isPersonal: boolean;
  }[];
}

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceManagementModal({ isOpen, onClose }: DeviceManagementModalProps) {
  const isMobile = useIsMobile();
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing device
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<DeviceRole>(DeviceRole.PLAYER);
  const [editDefaultUserId, setEditDefaultUserId] = useState<string>('');

  const { data, loading, refetch } = useQuery(GET_DEVICES, {
    skip: !isOpen,
  });

  const { data: usersData } = useQuery(GET_USERS, {
    skip: !isOpen,
  });

  const [updateDevice, { loading: updating }] = useMutation(UPDATE_DEVICE, {
    onError: (err) => setError(`Failed to update device: ${err.message}`),
    onCompleted: () => {
      refetch();
      setEditingDevice(null);
    },
  });

  const [revokeDevice, { loading: revoking }] = useMutation(REVOKE_DEVICE, {
    onError: (err) => setError(`Failed to revoke device: ${err.message}`),
    onCompleted: () => refetch(),
  });

  const [approveDevice, { loading: approving }] = useMutation(APPROVE_DEVICE, {
    onError: (err) => setError(`Failed to approve device: ${err.message}`),
    onCompleted: () => refetch(),
  });

  const { groups: allGroups } = useGroup();
  const [addDeviceToGroup] = useMutation(ADD_DEVICE_TO_GROUP, {
    onError: (err) => setError(`Failed to add device to group: ${err.message}`),
    onCompleted: () => refetch(),
  });
  const [removeDeviceFromGroup] = useMutation(REMOVE_DEVICE_FROM_GROUP, {
    onError: (err) => setError(`Failed to remove device from group: ${err.message}`),
    onCompleted: () => refetch(),
  });

  const devices: Device[] = data?.devices || [];
  const users: { id: string; email: string; name?: string }[] = usersData?.users || [];

  const handleStartEdit = (device: Device) => {
    setEditingDevice(device);
    setEditName(device.name);
    setEditRole(device.defaultRole);
    setEditDefaultUserId(device.defaultUser?.id || '');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setError(null);
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    if (!editName.trim()) {
      setError('Device name is required');
      return;
    }

    setError(null);
    await updateDevice({
      variables: {
        id: editingDevice.id,
        input: {
          name: editName.trim(),
          defaultRole: editRole,
          defaultUserId: editDefaultUserId || null,
        },
      },
    });
  };

  const handleApproveDevice = async (device: Device) => {
    if (!confirm(`Approve "${device.name}" for system access?`)) {
      return;
    }

    setError(null);
    await approveDevice({
      variables: { deviceId: device.id, permissions: 'OPERATOR' },
    });
  };

  const handleRevokeDevice = async (device: Device) => {
    if (!confirm(`Are you sure you want to revoke authorization for "${device.name}"? The device will need to be re-authorized to connect.`)) {
      return;
    }

    setError(null);
    await revokeDevice({ variables: { id: device.id } });
  };

  const getStatusBadgeClasses = (device: Device) => {
    if (device.isAuthorized) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const getStatusText = (device: Device) => {
    return device.isAuthorized ? 'Authorized' : 'Pending';
  };

  const getRoleBadgeClasses = (role: DeviceRole) => {
    switch (role) {
      case DeviceRole.DESIGNER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case DeviceRole.OPERATOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const truncateFingerprint = (fingerprint: string) => {
    if (fingerprint.length <= 12) return fingerprint;
    return `${fingerprint.substring(0, 6)}...${fingerprint.substring(fingerprint.length - 4)}`;
  };

  const formContent = (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500 rounded text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Devices List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No devices registered yet. Devices will appear here when they first connect.
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="flex items-start gap-3 p-3 rounded bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {editingDevice?.id === device.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Device name"
                      autoFocus
                    />
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as DeviceRole)}
                      className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={DeviceRole.PLAYER}>Player</option>
                      <option value={DeviceRole.OPERATOR}>Operator</option>
                      <option value={DeviceRole.DESIGNER}>Designer</option>
                    </select>
                    <div>
                      <label htmlFor={`default-user-${device.id}`} className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Default user (for device-only access)</label>
                      <select
                        id={`default-user-${device.id}`}
                        value={editDefaultUserId}
                        onChange={(e) => setEditDefaultUserId(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`add-group-${device.id}`} className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Add to group</label>
                      <select
                        id={`add-group-${device.id}`}
                        aria-label="Add to group"
                        onChange={(e) => {
                          if (e.target.value) {
                            addDeviceToGroup({ variables: { deviceId: device.id, groupId: e.target.value } });
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Select a group...</option>
                        {allGroups
                          .filter(g => !device.groups?.some(dg => dg.id === g.id))
                          .map(g => (
                            <option key={g.id} value={g.id}>{g.name}{g.isPersonal ? ' (Personal)' : ''}</option>
                          ))}
                      </select>
                    </div>
                    <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                      <button
                        onClick={handleUpdateDevice}
                        disabled={updating || !editName.trim()}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation`}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`${isMobile ? 'w-full' : ''} px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {device.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadgeClasses(device)}`}>
                        {getStatusText(device)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getRoleBadgeClasses(device.defaultRole)}`}>
                        {device.defaultRole}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-mono">
                      {truncateFingerprint(device.fingerprint)}
                    </div>
                    {device.lastSeenAt && (
                      <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        Last seen: {new Date(device.lastSeenAt).toLocaleString()}
                        {device.lastIPAddress && ` (${device.lastIPAddress})`}
                      </div>
                    )}
                    {device.defaultUser && (
                      <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        Default user: {device.defaultUser.name || device.defaultUser.email}
                      </div>
                    )}
                    {device.groups && device.groups.length > 0 && (
                      <div className="text-gray-500 dark:text-gray-500 text-xs mt-1 flex flex-wrap gap-1 items-center">
                        Groups:
                        {device.groups.map(g => (
                          <span key={g.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                            {g.name}{g.isPersonal && ' (Personal)'}
                            <button
                              onClick={() => removeDeviceFromGroup({ variables: { deviceId: device.id, groupId: g.id } })}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title={`Remove from ${g.name}`}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {editingDevice?.id !== device.id && (
                <div className="flex gap-1 items-center shrink-0">
                  <button
                    onClick={() => handleStartEdit(device)}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    title="Edit device"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  {!device.isAuthorized && (
                    <button
                      onClick={() => handleApproveDevice(device)}
                      disabled={approving}
                      className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation disabled:opacity-50"
                      title="Approve device"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  {device.isAuthorized && (
                    <button
                      onClick={() => handleRevokeDevice(device)}
                      disabled={revoking}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation disabled:opacity-50"
                      title="Revoke authorization"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const footerContent = (
    <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'}`}>
      <button
        onClick={onClose}
        className={`${isMobile ? 'w-full' : ''} px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] touch-manipulation`}
      >
        Close
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Devices"
      footer={footerContent}
      maxWidth="max-w-2xl"
      testId="device-management-modal"
    >
      {formContent}
    </BottomSheet>
  );
}
