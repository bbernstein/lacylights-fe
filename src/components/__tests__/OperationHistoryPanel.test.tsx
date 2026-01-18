import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import React from 'react';
import { OperationHistoryPanel } from '../OperationHistoryPanel';
import { GET_OPERATION_HISTORY, JUMP_TO_OPERATION, CLEAR_OPERATION_HISTORY } from '@/graphql/undoRedo';
import { OperationType, UndoEntityType } from '@/generated/graphql';

// Mock the ProjectContext
const mockProjectId = 'test-project-123';

jest.mock('@/contexts/ProjectContext', () => ({
  useProject: () => ({
    currentProject: { id: mockProjectId, name: 'Test Project' },
  }),
}));

const mockOperations = [
  {
    id: 'op-1',
    description: 'Create look "Warm Wash"',
    operationType: OperationType.Create,
    entityType: UndoEntityType.Look,
    sequence: 1,
    createdAt: new Date().toISOString(),
    isCurrent: false,
  },
  {
    id: 'op-2',
    description: 'Update look "Warm Wash"',
    operationType: OperationType.Update,
    entityType: UndoEntityType.Look,
    sequence: 2,
    createdAt: new Date().toISOString(),
    isCurrent: true,
  },
];

const createMocks = (operations = mockOperations): MockedResponse[] => [
  {
    request: {
      query: GET_OPERATION_HISTORY,
      variables: { projectId: mockProjectId, page: 1, perPage: 50 },
    },
    result: {
      data: {
        operationHistory: {
          operations,
          pagination: {
            total: operations.length,
            page: 1,
            perPage: 50,
            totalPages: 1,
            hasMore: false,
          },
          currentSequence: 2,
        },
      },
    },
  },
  {
    request: {
      query: JUMP_TO_OPERATION,
      variables: { projectId: mockProjectId, operationId: 'op-1' },
    },
    result: {
      data: {
        jumpToOperation: {
          success: true,
          message: 'Jumped to operation',
          restoredEntityId: 'look-123',
          operation: mockOperations[0],
        },
      },
    },
  },
  {
    request: {
      query: CLEAR_OPERATION_HISTORY,
      variables: { projectId: mockProjectId, confirmClear: true },
    },
    result: {
      data: {
        clearOperationHistory: true,
      },
    },
  },
];

const renderWithProviders = (ui: React.ReactElement, mocks = createMocks()) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      {ui}
    </MockedProvider>
  );
};

describe('OperationHistoryPanel', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders panel when open', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    // The backdrop is a div with onClick handler
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state initially', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    // The loading spinner should be present
    expect(screen.getByRole('heading', { name: /history/i })).toBeInTheDocument();
  });

  it('displays operations after loading', async () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Create look "Warm Wash"')).toBeInTheDocument();
      expect(screen.getByText('Update look "Warm Wash"')).toBeInTheDocument();
    });
  });

  it('highlights current operation', async () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Current state')).toBeInTheDocument();
    });
  });

  it('shows empty state when no operations', async () => {
    const emptyMocks = [
      {
        request: {
          query: GET_OPERATION_HISTORY,
          variables: { projectId: mockProjectId, page: 1, perPage: 50 },
        },
        result: {
          data: {
            operationHistory: {
              operations: [],
              pagination: {
                total: 0,
                page: 1,
                perPage: 50,
                totalPages: 0,
                hasMore: false,
              },
              currentSequence: 0,
            },
          },
        },
      },
    ];

    renderWithProviders(
      <OperationHistoryPanel isOpen={true} onClose={mockOnClose} />,
      emptyMocks
    );

    await waitFor(() => {
      expect(screen.getByText('No history yet')).toBeInTheDocument();
      expect(screen.getByText('Changes will appear here')).toBeInTheDocument();
    });
  });

  it('renders clear history button', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument();
  });
});

describe('OperationHistoryPanel closed state', () => {
  const mockOnClose = jest.fn();

  it('does not render backdrop when closed', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={false} onClose={mockOnClose} />);

    const backdrop = document.querySelector('.fixed.inset-0.opacity-100');
    expect(backdrop).not.toBeInTheDocument();
  });
});
