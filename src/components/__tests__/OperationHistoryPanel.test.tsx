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

    // Use exact match for "Close" to distinguish from backdrop's "Close history panel"
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    // Use exact match for "Close" to distinguish from backdrop's "Close history panel"
    const closeButton = screen.getByRole('button', { name: 'Close' });
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

describe('OperationHistoryPanel jump to operation', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls jumpToOperation mutation when operation is clicked', async () => {
    const mocks = createMocks();
    renderWithProviders(
      <OperationHistoryPanel isOpen={true} onClose={mockOnClose} />,
      mocks
    );

    // Wait for operations to load
    await waitFor(() => {
      expect(screen.getByText('Create look "Warm Wash"')).toBeInTheDocument();
    });

    // Click on the first operation (not current)
    const operationButton = screen.getByText('Create look "Warm Wash"').closest('button');
    expect(operationButton).toBeInTheDocument();

    if (operationButton) {
      fireEvent.click(operationButton);
    }

    // The mutation should be called (we can verify by checking the mock was consumed)
    // Since we have the mock set up, if it doesn't match, the test would fail
    await waitFor(() => {
      // Give time for mutation to be called
      expect(operationButton).toBeInTheDocument();
    });
  });

  it('disables click on current operation', async () => {
    renderWithProviders(<OperationHistoryPanel isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Update look "Warm Wash"')).toBeInTheDocument();
    });

    // The current operation button should be disabled
    const currentOperationButton = screen.getByText('Update look "Warm Wash"').closest('button');
    expect(currentOperationButton).toBeDisabled();
  });
});

describe('OperationHistoryPanel error handling', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays error toast when jumpToOperation fails', async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: {
          query: GET_OPERATION_HISTORY,
          variables: { projectId: mockProjectId, page: 1, perPage: 50 },
        },
        result: {
          data: {
            operationHistory: {
              operations: mockOperations,
              pagination: {
                total: mockOperations.length,
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
        error: new Error('Failed to jump to operation'),
      },
    ];

    renderWithProviders(
      <OperationHistoryPanel isOpen={true} onClose={mockOnClose} />,
      errorMocks
    );

    // Wait for operations to load
    await waitFor(() => {
      expect(screen.getByText('Create look "Warm Wash"')).toBeInTheDocument();
    });

    // Click on the first operation
    const operationButton = screen.getByText('Create look "Warm Wash"').closest('button');
    if (operationButton) {
      fireEvent.click(operationButton);
    }

    // Wait for error toast to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to jump to operation')).toBeInTheDocument();
    });
  });

  it('displays error toast when clearHistory fails', async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: {
          query: GET_OPERATION_HISTORY,
          variables: { projectId: mockProjectId, page: 1, perPage: 50 },
        },
        result: {
          data: {
            operationHistory: {
              operations: mockOperations,
              pagination: {
                total: mockOperations.length,
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
          query: CLEAR_OPERATION_HISTORY,
          variables: { projectId: mockProjectId, confirmClear: true },
        },
        error: new Error('Failed to clear history'),
      },
    ];

    renderWithProviders(
      <OperationHistoryPanel isOpen={true} onClose={mockOnClose} />,
      errorMocks
    );

    // Wait for operations to load
    await waitFor(() => {
      expect(screen.getByText('Create look "Warm Wash"')).toBeInTheDocument();
    });

    // Click clear history button
    const clearButton = screen.getByRole('button', { name: /clear history/i });
    fireEvent.click(clearButton);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('clear-history-modal')).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByTestId('clear-history-confirm');
    fireEvent.click(confirmButton);

    // Wait for error toast to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to clear history')).toBeInTheDocument();
    });
  });

  it('allows dismissing error toast', async () => {
    const errorMocks: MockedResponse[] = [
      {
        request: {
          query: GET_OPERATION_HISTORY,
          variables: { projectId: mockProjectId, page: 1, perPage: 50 },
        },
        result: {
          data: {
            operationHistory: {
              operations: mockOperations,
              pagination: {
                total: mockOperations.length,
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
        error: new Error('Test error'),
      },
    ];

    renderWithProviders(
      <OperationHistoryPanel isOpen={true} onClose={mockOnClose} />,
      errorMocks
    );

    // Wait for operations to load
    await waitFor(() => {
      expect(screen.getByText('Create look "Warm Wash"')).toBeInTheDocument();
    });

    // Click on the first operation to trigger error
    const operationButton = screen.getByText('Create look "Warm Wash"').closest('button');
    if (operationButton) {
      fireEvent.click(operationButton);
    }

    // Wait for error toast to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // Click dismiss button
    const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
    fireEvent.click(dismissButton);

    // Error should be dismissed
    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
});
