import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import UserManagementModal from '../UserManagementModal';
import { GET_USERS, CREATE_USER, UPDATE_USER, DELETE_USER } from '../../graphql/auth';
import { UserRole } from '../../types';

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => <div className={className} data-testid="x-mark-icon">X</div>,
  TrashIcon: ({ className }: { className?: string }) => <div className={className} data-testid="trash-icon">Trash</div>,
  PlusIcon: ({ className }: { className?: string }) => <div className={className} data-testid="plus-icon">+</div>,
  PencilIcon: ({ className }: { className?: string }) => <div className={className} data-testid="pencil-icon">Edit</div>,
}));

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false),
}));

// Mock the useAuth hook
const mockCurrentUser = {
  id: 'current-user-id',
  email: 'admin@test.com',
  name: 'Current Admin',
  role: UserRole.ADMIN,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: mockCurrentUser,
    isAuthenticated: true,
    isAuthEnabled: true,
    isLoading: false,
  })),
}));

const mockUsers = [
  {
    id: 'user-1',
    email: 'user1@test.com',
    name: 'Test User 1',
    role: UserRole.USER,
    createdAt: '2023-01-01T12:00:00Z',
    __typename: 'User',
  },
  {
    id: 'user-2',
    email: 'admin@test.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    createdAt: '2023-01-02T12:00:00Z',
    __typename: 'User',
  },
  {
    id: 'current-user-id',
    email: 'current@test.com',
    name: 'Current Admin',
    role: UserRole.ADMIN,
    createdAt: '2023-01-03T12:00:00Z',
    __typename: 'User',
  },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

const createMocks = () => [
  {
    request: {
      query: GET_USERS,
      variables: {},
    },
    result: {
      data: {
        users: mockUsers,
      },
    },
  },
  {
    request: {
      query: CREATE_USER,
      variables: {
        input: {
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          role: UserRole.USER,
        },
      },
    },
    result: {
      data: {
        createUser: {
          id: 'new-user-1',
          email: 'newuser@test.com',
          name: 'New User',
          role: UserRole.USER,
          createdAt: '2023-01-04T12:00:00Z',
          __typename: 'User',
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_USER,
      variables: {
        id: 'user-1',
        input: {
          email: 'updated@test.com',
          name: 'Updated Name',
          role: UserRole.ADMIN,
        },
      },
    },
    result: {
      data: {
        updateUser: {
          id: 'user-1',
          email: 'updated@test.com',
          name: 'Updated Name',
          role: UserRole.ADMIN,
          createdAt: '2023-01-01T12:00:00Z',
          __typename: 'User',
        },
      },
    },
  },
  {
    request: {
      query: DELETE_USER,
      variables: { id: 'user-1' },
    },
    result: {
      data: {
        deleteUser: true,
      },
    },
  },
];

const renderWithProvider = (mocks = createMocks(), props = {}) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <UserManagementModal {...defaultProps} {...props} />
    </MockedProvider>
  );
};

describe('UserManagementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when closed', () => {
      renderWithProvider(createMocks(), { isOpen: false });
      expect(screen.queryByText('Manage Users')).not.toBeInTheDocument();
    });

    it('renders modal when open', () => {
      renderWithProvider();
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
      expect(screen.getByText('Add User')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      const loadingMocks = [
        {
          request: { query: GET_USERS, variables: {} },
          delay: 1000,
          result: { data: { users: [] } },
        },
      ];
      renderWithProvider(loadingMocks);
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('displays users when loaded', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });
    });

    it('displays role badges for users', async () => {
      renderWithProvider();

      await waitFor(() => {
        const userBadges = screen.getAllByText('USER');
        const adminBadges = screen.getAllByText('ADMIN');
        expect(userBadges.length).toBeGreaterThan(0);
        expect(adminBadges.length).toBeGreaterThan(0);
      });
    });

    it('shows "You" badge for current user', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('You')).toBeInTheDocument();
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

      const backdrop = screen.getByTestId('user-management-modal-backdrop');
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('user creation', () => {
    it('shows create form when Add User is clicked', async () => {
      renderWithProvider();

      const addButton = screen.getByText('Add User');
      await userEvent.click(addButton);

      expect(screen.getByPlaceholderText('Email (required)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password (min 8 characters)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name (optional)')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('allows entering user details', async () => {
      renderWithProvider();

      const addButton = screen.getByText('Add User');
      await userEvent.click(addButton);

      const emailInput = screen.getByPlaceholderText('Email (required)');
      const passwordInput = screen.getByPlaceholderText('Password (min 8 characters)');
      const nameInput = screen.getByPlaceholderText('Name (optional)');

      await userEvent.type(emailInput, 'newuser@test.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(nameInput, 'New User');

      expect(emailInput).toHaveValue('newuser@test.com');
      expect(passwordInput).toHaveValue('password123');
      expect(nameInput).toHaveValue('New User');
    });

    it('cancels user creation', async () => {
      renderWithProvider();

      const addButton = screen.getByText('Add User');
      await userEvent.click(addButton);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('Email (required)')).not.toBeInTheDocument();
    });

    it('shows role selector in create form', async () => {
      renderWithProvider();

      const addButton = screen.getByText('Add User');
      await userEvent.click(addButton);

      const roleSelector = screen.getByRole('combobox');
      expect(roleSelector).toBeInTheDocument();
      expect(roleSelector).toHaveValue('USER');
    });
  });

  describe('user editing', () => {
    it('shows edit form when edit button is clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit user');
      await userEvent.click(editButtons[0]);

      // Should show input fields
      const emailInputs = screen.getAllByPlaceholderText('Email');
      expect(emailInputs.length).toBeGreaterThan(0);
    });

    it('cancels editing', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit user');
      await userEvent.click(editButtons[0]);

      // Find the cancel button in the edit form
      const cancelButtons = screen.getAllByText('Cancel');
      await userEvent.click(cancelButtons[0]);

      // Should show original user info again
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
    });
  });

  describe('user deletion', () => {
    it('shows delete button for each user', async () => {
      renderWithProvider();

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Delete user');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it('disables delete button for current user', async () => {
      renderWithProvider();

      await waitFor(() => {
        const disabledButton = screen.getByTitle('Cannot delete yourself');
        expect(disabledButton).toBeDisabled();
      });
    });

    it('confirms before deleting user', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete user');
      await userEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('handles user loading errors gracefully', async () => {
      const errorMocks = [
        {
          request: { query: GET_USERS, variables: {} },
          error: new Error('Network error'),
        },
      ];

      renderWithProvider(errorMocks as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Component should still render the modal structure
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper button roles', async () => {
      renderWithProvider();

      expect(screen.getByRole('button', { name: /Add User/ })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderWithProvider();

      expect(screen.getByRole('heading', { name: 'Manage Users' })).toBeInTheDocument();
    });

    it('renders as BottomSheet modal', () => {
      renderWithProvider();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('edge cases', () => {
    it('handles empty user list', async () => {
      const emptyMocks = [
        {
          request: { query: GET_USERS, variables: {} },
          result: { data: { users: [] } },
        },
      ];

      renderWithProvider(emptyMocks);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });
});
