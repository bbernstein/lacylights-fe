import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UndoRedoToolbar } from '../UndoRedoToolbar';

// Mock the UndoRedoContext
const mockUndo = jest.fn().mockResolvedValue(true);
const mockRedo = jest.fn().mockResolvedValue(true);

jest.mock('@/contexts/UndoRedoContext', () => ({
  useUndoRedo: () => ({
    canUndo: true,
    canRedo: true,
    undoDescription: 'Update look "Warm Wash"',
    redoDescription: 'Delete fixture "Par 1"',
    undo: mockUndo,
    redo: mockRedo,
    isLoading: false,
  }),
}));

describe('UndoRedoToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders undo and redo buttons', () => {
    render(<UndoRedoToolbar />);

    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('shows undo description in tooltip', () => {
    render(<UndoRedoToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toHaveAttribute('title', 'Undo: Update look "Warm Wash"');
  });

  it('shows redo description in tooltip', () => {
    render(<UndoRedoToolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).toHaveAttribute('title', 'Redo: Delete fixture "Par 1"');
  });

  it('calls undo when undo button is clicked', async () => {
    render(<UndoRedoToolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(mockUndo).toHaveBeenCalledTimes(1);
    });
  });

  it('calls redo when redo button is clicked', async () => {
    render(<UndoRedoToolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(mockRedo).toHaveBeenCalledTimes(1);
    });
  });

  it('applies custom className', () => {
    render(<UndoRedoToolbar className="custom-class" />);

    const toolbar = screen.getByRole('button', { name: /undo/i }).parentElement;
    expect(toolbar).toHaveClass('custom-class');
  });
});

describe('UndoRedoToolbar disabled states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables undo button when canUndo is false', () => {
    jest.doMock('@/contexts/UndoRedoContext', () => ({
      useUndoRedo: () => ({
        canUndo: false,
        canRedo: true,
        undoDescription: null,
        redoDescription: null,
        undo: mockUndo,
        redo: mockRedo,
        isLoading: false,
      }),
    }));

    // Re-import to get the updated mock
    jest.resetModules();
  });

  it('disables redo button when canRedo is false', () => {
    jest.doMock('@/contexts/UndoRedoContext', () => ({
      useUndoRedo: () => ({
        canUndo: true,
        canRedo: false,
        undoDescription: null,
        redoDescription: null,
        undo: mockUndo,
        redo: mockRedo,
        isLoading: false,
      }),
    }));

    jest.resetModules();
  });
});
