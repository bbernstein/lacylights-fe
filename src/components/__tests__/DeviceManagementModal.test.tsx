import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import DeviceManagementModal from '../DeviceManagementModal';
import { GET_DEVICES, UPDATE_DEVICE, REVOKE_DEVICE, ADD_DEVICE_TO_GROUP, REMOVE_DEVICE_FROM_GROUP } from '../../graphql/auth';
import { DeviceRole } from '../../types/auth';

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-mark-icon">X</div>,
  PencilIcon: ({ className }: { className?: string }) => <div className={className} data-testid="pencil-icon">Edit</div>,
  KeyIcon: ({ className }: { className?: string }) => <div className={className} data-testid="key-icon">Key</div>,
  XCircleIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-circle-icon">Revoke</div>,
  CheckCircleIcon: ({ className }: { className?: string }) => <div className={className} data-testid="check-circle-icon">Approve</div>,
}));

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false),
}));

// Mock useGroup
jest.mock('@/contexts/GroupContext', () => ({
  useGroup: jest.fn(() => ({
    activeGroup: { id: 'group-1', name: 'Personal', isPersonal: true },
    groups: [
      { id: 'group-1', name: 'Personal', isPersonal: true },
      { id: 'group-2', name: 'Team Alpha', isPersonal: false },
      { id: 'group-3', name: 'Team Beta', isPersonal: false },
    ],
    selectableGroups: [],
    loading: false,
    selectGroup: jest.fn(),
    selectGroupById: jest.fn(),
    refetchGroups: jest.fn(),
  })),
}));

const mockDevices = [
  {
    id: 'device-1',
    name: 'Front of House iPad',
    fingerprint: 'abc123def456ghi789jkl012',
    isAuthorized: true,
    defaultRole: DeviceRole.OPERATOR,
    lastSeenAt: '2023-01-01T12:00:00Z',
    lastIPAddress: '192.168.1.100',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    defaultUser: {
      id: 'user-1',
      email: 'operator@test.com',
      name: 'Stage Operator',
    },
    groups: [
      { id: 'group-1', name: 'Personal', isPersonal: true },
    ],
    __typename: 'Device',
  },
  {
    id: 'device-2',
    name: 'Backstage Tablet',
    fingerprint: 'xyz789abc123def456ghi',
    isAuthorized: false,
    defaultRole: DeviceRole.PLAYER,
    lastSeenAt: null,
    lastIPAddress: null,
    createdAt: '2023-01-02T10:00:00Z',
    updatedAt: '2023-01-02T10:00:00Z',
    defaultUser: null,
    groups: [],
    __typename: 'Device',
  },
  {
    id: 'device-3',
    name: 'Lighting Booth Computer',
    fingerprint: 'mno456pqr789stu123vwx',
    isAuthorized: true,
    defaultRole: DeviceRole.DESIGNER,
    lastSeenAt: '2023-01-03T14:00:00Z',
    lastIPAddress: '192.168.1.50',
    createdAt: '2023-01-03T10:00:00Z',
    updatedAt: '2023-01-03T14:00:00Z',
    defaultUser: null,
    groups: [
      { id: 'group-1', name: 'Personal', isPersonal: true },
      { id: 'group-2', name: 'Team Alpha', isPersonal: false },
    ],
    __typename: 'Device',
  },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_DEVICES,
    },
    result: {
      data: {
        devices: mockDevices,
      },
    },
  },
  {
    request: {
      query: UPDATE_DEVICE,
      variables: {
        id: 'device-1',
        input: {
          name: 'Updated Device Name',
          defaultRole: DeviceRole.DESIGNER,
        },
      },
    },
    result: {
      data: {
        updateDevice: {
          ...mockDevices[0],
          name: 'Updated Device Name',
          defaultRole: DeviceRole.DESIGNER,
        },
      },
    },
  },
  {
    request: {
      query: REVOKE_DEVICE,
      variables: { id: 'device-1' },
    },
    result: {
      data: {
        revokeDevice: {
          ...mockDevices[0],
          isAuthorized: false,
        },
      },
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderWithProvider = (mocks: any[] = createMocks(), props = {}) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <DeviceManagementModal {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('DeviceManagementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      renderWithProvider(createMocks(), { isOpen: false });
      expect(screen.queryByText('Manage Devices')).not.toBeInTheDocument();
    });

    it('renders modal when open', () => {
      renderWithProvider();
      expect(screen.getByText('Manage Devices')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      const loadingMocks = [
        {
          request: { query: GET_DEVICES },
          delay: 1000,
          result: { data: { devices: [] } },
        },
      ];
      renderWithProvider(loadingMocks);
      expect(screen.getByText('Loading devices...')).toBeInTheDocument();
    });

    it('displays devices when loaded', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
        expect(screen.getByText('Backstage Tablet')).toBeInTheDocument();
        expect(screen.getByText('Lighting Booth Computer')).toBeInTheDocument();
      });
    });

    it('displays authorization status badges', async () => {
      renderWithProvider();

      await waitFor(() => {
        const authorizedBadges = screen.getAllByText('Authorized');
        const pendingBadges = screen.getAllByText('Pending');
        expect(authorizedBadges).toHaveLength(2);
        expect(pendingBadges).toHaveLength(1);
      });
    });

    it('displays role badges for devices', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('OPERATOR')).toBeInTheDocument();
        expect(screen.getByText('PLAYER')).toBeInTheDocument();
        expect(screen.getByText('DESIGNER')).toBeInTheDocument();
      });
    });

    it('shows truncated fingerprint', async () => {
      renderWithProvider();

      await waitFor(() => {
        // Fingerprint should be truncated (first 6 chars + ... + last 4 chars)
        expect(screen.getByText('abc123...l012')).toBeInTheDocument();
      });
    });

    it('shows last seen info for devices', async () => {
      renderWithProvider();

      await waitFor(() => {
        // Multiple devices have last seen info, use getAllByText
        const lastSeenElements = screen.getAllByText(/Last seen:/);
        expect(lastSeenElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/192.168.1.100/)).toBeInTheDocument();
      });
    });

    it('shows default user when assigned', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText(/Default user: Stage Operator/)).toBeInTheDocument();
      });
    });
  });

  describe('modal interactions', () => {
    it('calls onClose when Close button is clicked', async () => {
      renderWithProvider();

      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      renderWithProvider();

      const backdrop = screen.getByTestId('device-management-modal-backdrop');
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('device editing', () => {
    it('shows edit form when edit button is clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit device');
      await userEvent.click(editButtons[0]);

      // Should show input field and role selector (plus add-to-group dropdown)
      expect(screen.getByPlaceholderText('Device name')).toBeInTheDocument();
      expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(1);
    });

    it('populates edit form with device data', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit device');
      await userEvent.click(editButtons[0]);

      const nameInput = screen.getByPlaceholderText('Device name');
      expect(nameInput).toHaveValue('Front of House iPad');
    });

    it('cancels editing', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit device');
      await userEvent.click(editButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Should show original device info again
      expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
    });
  });

  describe('authorization code generation', () => {
    it('shows generate code button for pending devices', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Backstage Tablet')).toBeInTheDocument();
      });

      const generateButtons = screen.getAllByTitle('Approve device');
      expect(generateButtons).toHaveLength(1);
    });

    it('does not show generate code button for authorized devices', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      // Authorized devices should not have the generate code button
      const revokeButtons = screen.getAllByTitle('Revoke authorization');
      expect(revokeButtons).toHaveLength(2);
    });
  });

  describe('device revocation', () => {
    it('shows revoke button for authorized devices', async () => {
      renderWithProvider();

      await waitFor(() => {
        const revokeButtons = screen.getAllByTitle('Revoke authorization');
        expect(revokeButtons).toHaveLength(2);
      });
    });

    it('confirms before revoking device', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      const revokeButtons = screen.getAllByTitle('Revoke authorization');
      await userEvent.click(revokeButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to revoke authorization')
      );
      confirmSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('handles device loading errors gracefully', async () => {
      const errorMocks = [
        {
          request: { query: GET_DEVICES },
          error: new Error('Network error'),
        },
      ];

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Component should still render the modal structure
      expect(screen.getByText('Manage Devices')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProvider();

      expect(screen.getByRole('heading', { name: 'Manage Devices' })).toBeInTheDocument();
    });

    it('renders as BottomSheet modal', () => {
      renderWithProvider();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has proper button titles for actions', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getAllByTitle('Edit device').length).toBeGreaterThan(0);
        expect(screen.getAllByTitle('Revoke authorization').length).toBeGreaterThan(0);
        expect(screen.getAllByTitle('Approve device').length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty device list', async () => {
      const emptyMocks = [
        {
          request: { query: GET_DEVICES },
          result: { data: { devices: [] } },
        },
      ];

      renderWithProvider(emptyMocks);

      await waitFor(() => {
        expect(screen.getByText(/No devices registered yet/)).toBeInTheDocument();
      });
    });

    it('handles devices without lastSeenAt', async () => {
      renderWithProvider();

      await waitFor(() => {
        // Backstage Tablet has no lastSeenAt, should still render
        expect(screen.getByText('Backstage Tablet')).toBeInTheDocument();
      });
    });
  });

  describe('device-group GraphQL operations', () => {
    it('exports ADD_DEVICE_TO_GROUP mutation', () => {
      expect(ADD_DEVICE_TO_GROUP).toBeDefined();
    });

    it('exports REMOVE_DEVICE_FROM_GROUP mutation', () => {
      expect(REMOVE_DEVICE_FROM_GROUP).toBeDefined();
    });
  });

  describe('device-group assignment display', () => {
    it('displays group badges for devices with groups', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      // Device 1 has group "Personal" (isPersonal)
      expect(screen.getAllByText(/Personal \(Personal\)/).length).toBeGreaterThan(0);
    });

    it('shows multiple group badges for a device in multiple groups', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Lighting Booth Computer')).toBeInTheDocument();
      });

      // Device 3 has Personal and Team Alpha groups
      expect(screen.getAllByText('Team Alpha').length).toBeGreaterThan(0);
    });

    it('does not show groups section for device with no groups', async () => {
      const singleDeviceMock = [
        {
          request: { query: GET_DEVICES },
          result: {
            data: {
              devices: [{
                ...mockDevices[1],
                groups: [],
              }],
            },
          },
        },
      ];

      renderWithProvider(singleDeviceMock);

      await waitFor(() => {
        expect(screen.getByText('Backstage Tablet')).toBeInTheDocument();
      });

      expect(screen.queryByText('Groups:')).not.toBeInTheDocument();
    });

    it('shows remove-from-group button for each group badge', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Lighting Booth Computer')).toBeInTheDocument();
      });

      // Device 3 has 2 groups, so there should be remove buttons for each
      const removeButtons = screen.getAllByTitle(/Remove from/);
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('calls removeDeviceFromGroup mutation when remove button is clicked', async () => {
      // Use a single device to avoid ambiguity with multiple "Remove from Personal" buttons
      const singleDevice = {
        ...mockDevices[0],
        groups: [{ id: 'group-1', name: 'Personal', isPersonal: true }],
      };
      const removeCalled = jest.fn();
      const mocks = [
        {
          request: { query: GET_DEVICES },
          result: { data: { devices: [singleDevice] } },
        },
        {
          request: {
            query: REMOVE_DEVICE_FROM_GROUP,
            variables: { deviceId: 'device-1', groupId: 'group-1' },
          },
          result: () => {
            removeCalled();
            return { data: { removeDeviceFromGroup: true } };
          },
        },
        {
          request: { query: GET_DEVICES },
          result: { data: { devices: [singleDevice] } },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      const removeButton = screen.getByTitle('Remove from Personal');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(removeCalled).toHaveBeenCalled();
      });
    });
  });

  describe('device-group assignment editing', () => {
    it('shows add-to-group dropdown in edit mode', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit device');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Select a group...')).toBeInTheDocument();
    });

    it('filters out already-assigned groups from dropdown', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      // Edit device 1 (has group-1 "Personal" assigned)
      const editButtons = screen.getAllByTitle('Edit device');
      fireEvent.click(editButtons[0]);

      // Get all options in the add-to-group select
      const addGroupSelect = screen.getByLabelText('Add to group');
      const options = addGroupSelect.querySelectorAll('option');
      const optionTexts = Array.from(options).map(o => o.textContent);

      // Should NOT include "Personal (Personal)" since it's already assigned
      expect(optionTexts).not.toContain('Personal (Personal)');
      // Should include unassigned groups
      expect(optionTexts).toContain('Team Alpha');
      expect(optionTexts).toContain('Team Beta');
    });

    it('calls addDeviceToGroup mutation when group is selected', async () => {
      const addCalled = jest.fn();
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: ADD_DEVICE_TO_GROUP,
            variables: { deviceId: 'device-1', groupId: 'group-2' },
          },
          result: () => {
            addCalled();
            return { data: { addDeviceToGroup: true } };
          },
        },
        {
          request: { query: GET_DEVICES },
          result: { data: { devices: mockDevices } },
        },
      ];

      renderWithProvider(mocks);

      await waitFor(() => {
        expect(screen.getByText('Front of House iPad')).toBeInTheDocument();
      });

      // Enter edit mode for device 1
      const editButtons = screen.getAllByTitle('Edit device');
      fireEvent.click(editButtons[0]);

      // Select "Team Alpha" from the dropdown
      const addGroupSelect = screen.getByLabelText('Add to group');
      fireEvent.change(addGroupSelect, { target: { value: 'group-2' } });

      await waitFor(() => {
        expect(addCalled).toHaveBeenCalled();
      });
    });
  });
});
