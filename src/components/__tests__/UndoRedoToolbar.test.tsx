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

// Note: Testing disabled states with different canUndo/canRedo values requires either:
// 1. Dynamic module imports with jest.isolateModules (complex)
// 2. Refactoring the component to accept these values as props
// The disabled state styling is applied via the component's className logic
// based on canUndo/canRedo values from the context (see UndoRedoToolbar.tsx).
// The actual calls are gated by the context state before reaching the mutation.
