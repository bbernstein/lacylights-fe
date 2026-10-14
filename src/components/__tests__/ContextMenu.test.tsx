import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContextMenu, { ContextMenuOption } from '../ContextMenu';

describe('ContextMenu', () => {
  const mockOnDismiss = jest.fn();
  const defaultOptions: ContextMenuOption[] = [
    { label: 'Option 1', onClick: jest.fn() },
    { label: 'Option 2', onClick: jest.fn() },
    { label: 'Option 3', onClick: jest.fn() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders all menu options', () => {
      render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders at specified position', () => {
      const { container } = render(
        <ContextMenu
          x={150}
          y={250}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = container.querySelector('[role="menu"]');
      expect(menu).toHaveStyle({ left: '150px', top: '250px' });
    });

    it('renders menu with correct role', () => {
      render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('renders options with menuitem role', () => {
      render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });
  });

  describe('option interactions', () => {
    it('calls onClick handler when option is clicked', () => {
      const mockOnClick = jest.fn();
      const options: ContextMenuOption[] = [
        { label: 'Test Option', onClick: mockOnClick },
      ];

      render(
        <ContextMenu
          x={100}
          y={100}
          options={options}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.click(screen.getByText('Test Option'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('dismisses menu after option click', () => {
      render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.click(screen.getByText('Option 1'));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick for disabled option', () => {
      const mockOnClick = jest.fn();
      const options: ContextMenuOption[] = [
        { label: 'Disabled Option', onClick: mockOnClick, disabled: true },
      ];

      render(
        <ContextMenu
          x={100}
          y={100}
          options={options}
          onDismiss={mockOnDismiss}
        />
      );

      const button = screen.getByText('Disabled Option').closest('button');
      fireEvent.click(button!);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('does not dismiss menu when disabled option is clicked', () => {
      const options: ContextMenuOption[] = [
        { label: 'Disabled Option', onClick: jest.fn(), disabled: true },
      ];

      render(
        <ContextMenu
          x={100}
          y={100}
          options={options}
          onDismiss={mockOnDismiss}
        />
      );

      const button = screen.getByText('Disabled Option').closest('button');
      fireEvent.click(button!);
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('renders option with icon', () => {
      const options: ContextMenuOption[] = [
        { label: 'With Icon', onClick: jest.fn(), icon: <span>🔥</span> },
      ];

      render(
        <ContextMenu
          x={100}
          y={100}
          options={options}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('applies custom className to option', () => {
      const options: ContextMenuOption[] = [
        {
          label: 'Custom Class',
          onClick: jest.fn(),
          className: 'text-red-500',
        },
      ];

      render(
        <ContextMenu
          x={100}
          y={100}
          options={options}
          onDismiss={mockOnDismiss}
        />
      );

      const button = screen.getByText('Custom Class').closest('button');
      expect(button).toHaveClass('text-red-500');
    });
  });

  describe('dismissal behavior', () => {
    it('dismisses on Escape key', async () => {
      render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      // Wait for RAF to attach listeners
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismisses when clicking outside menu', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <ContextMenu
            x={100}
            y={100}
            options={defaultOptions}
            onDismiss={mockOnDismiss}
          />
        </div>
      );

      // Wait for RAF to attach listeners
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));

      // First click will be ignored due to justOpenedRef
      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Second click should dismiss
      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not dismiss when clicking inside menu', async () => {
      render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = screen.getByRole('menu');

      // Wait for RAF to attach listeners
      await waitFor(() => {
        fireEvent.mouseDown(menu);
      });

      // Should not dismiss when clicking the menu itself
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('viewport positioning', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    afterEach(() => {
      // Restore original dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalInnerHeight,
      });
    });

    it('adjusts position when menu would go off right edge', () => {
      const { container } = render(
        <ContextMenu
          x={1000} // Near right edge
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = container.querySelector('[role="menu"]') as HTMLElement;
      const leftValue = parseInt(menu.style.left);

      // Should be adjusted to fit within viewport (initialPosition estimate)
      // With estimated width of 200px, position should be adjusted from 1000
      expect(leftValue).toBeLessThanOrEqual(1000);
      // Should be at least the minimum margin from right edge (1024 - 200 - 10 = 814)
      expect(leftValue).toBeGreaterThanOrEqual(800);
    });

    it('adjusts position when menu would go off bottom edge', () => {
      const { container } = render(
        <ContextMenu
          x={100}
          y={750} // Near bottom edge
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = container.querySelector('[role="menu"]') as HTMLElement;
      const topValue = parseInt(menu.style.top);

      // Should be adjusted to fit within viewport (initialPosition estimate)
      // With estimated height based on 3 options, position should be adjusted
      expect(topValue).toBeLessThanOrEqual(750);
      // Should fit within viewport
      expect(topValue).toBeGreaterThanOrEqual(10);
    });

    it('ensures menu does not go off left edge', () => {
      const { container } = render(
        <ContextMenu
          x={-50} // Off left edge
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = container.querySelector('[role="menu"]') as HTMLElement;
      const leftValue = parseInt(menu.style.left);

      // Should be at least 10px from edge
      expect(leftValue).toBeGreaterThanOrEqual(10);
    });

    it('ensures menu does not go off top edge', () => {
      const { container } = render(
        <ContextMenu
          x={100}
          y={-50} // Off top edge
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = container.querySelector('[role="menu"]') as HTMLElement;
      const topValue = parseInt(menu.style.top);

      // Should be at least 10px from edge
      expect(topValue).toBeGreaterThanOrEqual(10);
    });
  });

  describe('position updates', () => {
    it('updates position when x/y change', () => {
      const { container, rerender } = render(
        <ContextMenu
          x={100}
          y={100}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const menu = container.querySelector('[role="menu"]') as HTMLElement;
      const initialLeft = parseInt(menu.style.left);
      const initialTop = parseInt(menu.style.top);

      // Position should be at or near requested position (may be adjusted for viewport)
      expect(initialLeft).toBeGreaterThanOrEqual(10); // At least minimum margin
      expect(initialTop).toBeGreaterThanOrEqual(10);

      rerender(
        <ContextMenu
          x={200}
          y={300}
          options={defaultOptions}
          onDismiss={mockOnDismiss}
        />
      );

      const newLeft = parseInt(menu.style.left);
      const newTop = parseInt(menu.style.top);

      // Position should have changed when x/y changed
      expect(newLeft).not.toBe(initialLeft);
      expect(newTop).not.toBe(initialTop);
      // New position should be at or near new requested position
      expect(newLeft).toBeGreaterThanOrEqual(10);
      expect(newTop).toBeGreaterThanOrEqual(10);
    });
  });
  describe('keyboard accessibility', () => {
    const options: ContextMenuOption[] = [
      { label: 'Disabled first', onClick: jest.fn(), disabled: true },
      { label: 'Alpha', onClick: jest.fn() },
      { label: 'Beta', onClick: jest.fn() },
      { label: 'Gamma', onClick: jest.fn() },
    ];

    it('does not move focus by default', () => {
      render(<ContextMenu x={0} y={0} options={options} onDismiss={mockOnDismiss} />);
      expect(document.body).toHaveFocus();
    });

    it('focuses the first enabled item when autoFocus is set', () => {
      render(<ContextMenu x={0} y={0} options={options} onDismiss={mockOnDismiss} autoFocus />);
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    });

    it('moves focus between enabled items with arrow, Home and End keys', () => {
      render(<ContextMenu x={0} y={0} options={options} onDismiss={mockOnDismiss} autoFocus />);
      const alpha = screen.getByRole('menuitem', { name: 'Alpha' });
      const beta = screen.getByRole('menuitem', { name: 'Beta' });
      const gamma = screen.getByRole('menuitem', { name: 'Gamma' });

      fireEvent.keyDown(alpha, { key: 'ArrowDown' });
      expect(beta).toHaveFocus();
      fireEvent.keyDown(beta, { key: 'End' });
      expect(gamma).toHaveFocus();
      fireEvent.keyDown(gamma, { key: 'ArrowDown' });
      expect(alpha).toHaveFocus(); // wraps, skipping the disabled item
      fireEvent.keyDown(alpha, { key: 'ArrowUp' });
      expect(gamma).toHaveFocus(); // wraps backwards
      fireEvent.keyDown(gamma, { key: 'Home' });
      expect(alpha).toHaveFocus();
    });

    it('ignores navigation keys when no item is enabled', () => {
      render(
        <ContextMenu
          x={0}
          y={0}
          options={[{ label: 'Only', onClick: jest.fn(), disabled: true }]}
          onDismiss={mockOnDismiss}
          autoFocus
        />,
      );
      const menu = screen.getByRole('menu');
      expect(() => fireEvent.keyDown(menu, { key: 'ArrowDown' })).not.toThrow();
      expect(() => fireEvent.keyDown(menu, { key: 'End' })).not.toThrow();
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('handles Escape inside the menu without letting it reach document listeners', async () => {
      const documentListener = jest.fn();
      document.addEventListener('keydown', documentListener);
      try {
        render(<ContextMenu x={0} y={0} options={options} onDismiss={mockOnDismiss} autoFocus />);
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));

        fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Alpha' }), { key: 'Escape' });

        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        expect(documentListener).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', documentListener);
      }
    });

    it('dismisses on Tab instead of letting focus leave the menu', () => {
      render(<ContextMenu x={0} y={0} options={options} onDismiss={mockOnDismiss} autoFocus />);
      const notPrevented = fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Alpha' }), { key: 'Tab' });
      expect(notPrevented).toBe(false);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('restores focus to the previously focused element on close when autoFocus is set', () => {
      const { rerender } = render(
        <>
          <button>Trigger</button>
        </>,
      );
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      trigger.focus();

      rerender(
        <>
          <button>Trigger</button>
          <ContextMenu x={0} y={0} options={options} onDismiss={mockOnDismiss} autoFocus />
        </>,
      );
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();

      rerender(
        <>
          <button>Trigger</button>
        </>,
      );
      expect(trigger).toHaveFocus();
    });
  });
});
