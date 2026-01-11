import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import UserModeSelector from '../UserModeSelector';
import { UserModeProvider, useUserMode } from '@/contexts/UserModeContext';
import { AVAILABLE_MODES, USER_MODE_LABELS } from '@/types/userMode';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn<string | null, [string]>(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test helper to display current mode
function ModeDisplay() {
  const { mode } = useUserMode();
  return <div data-testid="current-mode">{mode}</div>;
}

// Render helper
function renderWithProvider(ui: React.ReactElement) {
  return render(<UserModeProvider>{ui}</UserModeProvider>);
}

describe('UserModeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('compact variant', () => {
    it('renders a select element', () => {
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('renders all available modes as options', () => {
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');

      expect(options).toHaveLength(AVAILABLE_MODES.length);
      AVAILABLE_MODES.forEach((mode) => {
        expect(
          within(select).getByRole('option', { name: USER_MODE_LABELS[mode] })
        ).toBeInTheDocument();
      });
    });

    it('has correct accessibility attributes', () => {
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Select user mode');
    });

    it('changes mode when a new option is selected', () => {
      renderWithProvider(
        <>
          <UserModeSelector variant="compact" />
          <ModeDisplay />
        </>
      );

      const select = screen.getByRole('combobox');
      expect(screen.getByTestId('current-mode')).toHaveTextContent('editor');

      fireEvent.change(select, { target: { value: 'watcher' } });

      expect(screen.getByTestId('current-mode')).toHaveTextContent('watcher');
    });

    it('displays current mode correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('watcher');
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('watcher');
    });

    it('applies custom className', () => {
      const { container } = renderWithProvider(
        <UserModeSelector variant="compact" className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders with mode-specific styling', () => {
      mockLocalStorage.getItem.mockReturnValue('editor');
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');
      // Editor mode has blue styling
      expect(select.className).toContain('border-blue');
    });
  });

  describe('expanded variant', () => {
    it('renders buttons for each available mode', () => {
      renderWithProvider(<UserModeSelector variant="expanded" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(AVAILABLE_MODES.length);
    });

    it('shows mode labels and descriptions', () => {
      renderWithProvider(<UserModeSelector variant="expanded" />);

      AVAILABLE_MODES.forEach((mode) => {
        expect(screen.getByText(USER_MODE_LABELS[mode])).toBeInTheDocument();
      });
    });

    it('indicates selected mode with aria-pressed', () => {
      renderWithProvider(<UserModeSelector variant="expanded" />);

      const buttons = screen.getAllByRole('button');
      const editorButton = buttons.find((btn) =>
        btn.textContent?.includes('Editor')
      );
      const watcherButton = buttons.find((btn) =>
        btn.textContent?.includes('Watcher')
      );

      expect(editorButton).toHaveAttribute('aria-pressed', 'true');
      expect(watcherButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('changes mode when a button is clicked', () => {
      renderWithProvider(
        <>
          <UserModeSelector variant="expanded" />
          <ModeDisplay />
        </>
      );

      expect(screen.getByTestId('current-mode')).toHaveTextContent('editor');

      const buttons = screen.getAllByRole('button');
      const watcherButton = buttons.find((btn) =>
        btn.textContent?.includes('Watcher')
      );

      fireEvent.click(watcherButton!);

      expect(screen.getByTestId('current-mode')).toHaveTextContent('watcher');
    });

    it('shows persistence message', () => {
      renderWithProvider(<UserModeSelector variant="expanded" />);

      expect(
        screen.getByText(/Mode is stored locally and persists across sessions/i)
      ).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderWithProvider(
        <UserModeSelector variant="expanded" className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('shows checkmark icon for selected mode', () => {
      renderWithProvider(<UserModeSelector variant="expanded" />);

      const buttons = screen.getAllByRole('button');
      const editorButton = buttons.find((btn) =>
        btn.textContent?.includes('Editor')
      );

      // The selected button should contain an SVG checkmark
      const svg = editorButton?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('default variant', () => {
    it('defaults to compact variant', () => {
      renderWithProvider(<UserModeSelector />);

      // Compact variant renders a select, expanded renders buttons
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });

  describe('mode switching integration', () => {
    it('persists mode change to localStorage', () => {
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'watcher' } });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lacylights-user-mode',
        'watcher'
      );
    });

    it('updates visual styling when mode changes', () => {
      renderWithProvider(<UserModeSelector variant="compact" />);

      const select = screen.getByRole('combobox');

      // Initially editor (blue)
      expect(select.className).toContain('border-blue');

      // Change to watcher
      fireEvent.change(select, { target: { value: 'watcher' } });

      // Now watcher (gray)
      expect(select.className).toContain('border-gray');
    });
  });
});
