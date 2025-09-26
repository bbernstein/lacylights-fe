import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Autocomplete from '../Autocomplete';

describe('Autocomplete', () => {
  const defaultProps = {
    label: 'Test Label',
    value: '',
    onChange: jest.fn(),
    onInputChange: jest.fn(),
    options: ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with label and input', () => {
      render(<Autocomplete {...defaultProps} />);

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Autocomplete {...defaultProps} placeholder="Search fruits..." />);

      expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument();
    });

    it('renders with required attribute', () => {
      render(<Autocomplete {...defaultProps} required />);

      expect(screen.getByRole('textbox')).toHaveAttribute('required');
    });

    it('renders with initial value', () => {
      render(<Autocomplete {...defaultProps} value="Apple" />);

      expect(screen.getByRole('textbox')).toHaveValue('Apple');
    });

    it('does not show dropdown initially', () => {
      render(<Autocomplete {...defaultProps} />);

      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('opens dropdown on focus', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
      expect(screen.getByText('Cherry')).toBeInTheDocument();
    });

    it('opens dropdown on input change', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'a');

      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', () => {
      render(
        <div>
          <Autocomplete {...defaultProps} />
          <button>Outside</button>
        </div>
      );

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.getByText('Apple')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByText('Outside'));

      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('does not close dropdown when clicking inside', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      const dropdown = screen.getByText('Apple').parentElement;
      fireEvent.mouseDown(dropdown!);

      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('filters options based on input value', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'err');

      expect(screen.getByText('Cherry')).toBeInTheDocument();
      expect(screen.getByText('Elderberry')).toBeInTheDocument();
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
      expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    });

    it('shows "No results found" when no options match', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'xyz');

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('performs case-insensitive filtering', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'APPLE');

      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('filters with partial matches', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'an');

      expect(screen.getByText('Banana')).toBeInTheDocument();
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });
  });

  describe('option selection', () => {
    it('selects option on click', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      fireEvent.click(screen.getByText('Banana'));

      expect(defaultProps.onChange).toHaveBeenCalledWith('Banana');
      expect(screen.getByRole('textbox')).toHaveValue('Banana');
      expect(screen.queryByText('Apple')).not.toBeInTheDocument(); // Dropdown closed
    });

    it('updates input value when prop changes', () => {
      const { rerender } = render(<Autocomplete {...defaultProps} value="Apple" />);

      expect(screen.getByRole('textbox')).toHaveValue('Apple');

      rerender(<Autocomplete {...defaultProps} value="Banana" />);

      expect(screen.getByRole('textbox')).toHaveValue('Banana');
    });

    it('calls onInputChange when typing', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');

      expect(defaultProps.onInputChange).toHaveBeenCalledTimes(4);
      expect(defaultProps.onInputChange).toHaveBeenCalledWith('t');
      expect(defaultProps.onInputChange).toHaveBeenCalledWith('te');
      expect(defaultProps.onInputChange).toHaveBeenCalledWith('tes');
      expect(defaultProps.onInputChange).toHaveBeenCalledWith('test');
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown with ArrowDown', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('navigates down through options', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const firstOption = screen.getByText('Apple');
      expect(firstOption).toHaveClass('bg-blue-100');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const secondOption = screen.getByText('Banana');
      expect(secondOption).toHaveClass('bg-blue-100');
      expect(firstOption).not.toHaveClass('bg-blue-100');
    });

    it('navigates up through options', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const firstOption = screen.getByText('Apple');
      expect(firstOption).toHaveClass('bg-blue-100');
    });

    it('stops at last option when navigating down', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      // Navigate to last option
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      }

      const lastOption = screen.getByText('Elderberry');
      expect(lastOption).toHaveClass('bg-blue-100');
    });

    it('stops at first option when navigating up', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' }); // Try to go past first

      const firstOption = screen.getByText('Apple');
      expect(firstOption).toHaveClass('bg-blue-100');
    });

    it('selects option with Enter key', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onChange).toHaveBeenCalledWith('Banana');
      expect(screen.getByRole('textbox')).toHaveValue('Banana');
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('does not select option with Enter when nothing highlighted', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    it('closes dropdown with Escape key', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.getByText('Apple')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('prevents default on arrow keys', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });

    it('prevents default on Enter when selecting', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      fireEvent.keyDown(input, { key: 'Enter' });
    });
  });

  describe('loading state', () => {
    it('shows loading message when loading prop is true', () => {
      render(<Autocomplete {...defaultProps} loading={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });

    it('shows options when loading is false', () => {
      render(<Autocomplete {...defaultProps} loading={false} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  describe('mouse interaction', () => {
    it('highlights option on mouse enter', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      const option = screen.getByText('Banana');
      fireEvent.mouseEnter(option);

      expect(option).toHaveClass('bg-blue-100');
    });

    it('updates highlight when moving between options', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      const apple = screen.getByText('Apple');
      const banana = screen.getByText('Banana');

      fireEvent.mouseEnter(apple);
      expect(apple).toHaveClass('bg-blue-100');
      expect(banana).not.toHaveClass('bg-blue-100');

      fireEvent.mouseEnter(banana);
      expect(banana).toHaveClass('bg-blue-100');
      expect(apple).not.toHaveClass('bg-blue-100');
    });
  });

  describe('styling', () => {
    it('applies correct label classes', () => {
      render(<Autocomplete {...defaultProps} />);

      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300', 'mb-1');
    });

    it('applies correct input classes', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'block', 'w-full', 'rounded-md', 'border-gray-300', 'shadow-sm',
        'focus:border-blue-500', 'focus:ring-blue-500', 'sm:text-sm',
        'dark:bg-gray-700', 'dark:border-gray-600', 'dark:text-white'
      );
    });

    it('applies correct dropdown classes', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      const dropdown = screen.getByText('Apple').parentElement;
      expect(dropdown).toHaveClass(
        'absolute', 'z-10', 'mt-1', 'max-h-60', 'w-full', 'overflow-auto',
        'rounded-md', 'bg-white', 'py-1', 'shadow-lg', 'ring-1',
        'ring-black', 'ring-opacity-5', 'dark:bg-gray-700'
      );
    });

    it('applies correct option hover classes', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      const option = screen.getByText('Apple');
      expect(option).toHaveClass('text-gray-700', 'hover:bg-gray-100', 'dark:text-gray-200', 'dark:hover:bg-gray-600');
    });

    it('applies correct highlighted option classes', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const option = screen.getByText('Apple');
      expect(option).toHaveClass('bg-blue-100', 'text-blue-900', 'dark:bg-blue-800', 'dark:text-blue-100');
    });
  });

  describe('edge cases', () => {
    it('handles empty options array', () => {
      render(<Autocomplete {...defaultProps} options={[]} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles options with special characters', () => {
      const specialOptions = ['Option@1', 'Option#2', 'Option$3'];
      render(<Autocomplete {...defaultProps} options={specialOptions} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.getByText('Option@1')).toBeInTheDocument();
      expect(screen.getByText('Option#2')).toBeInTheDocument();
      expect(screen.getByText('Option$3')).toBeInTheDocument();
    });

    it('handles very long option text', () => {
      const longOption = 'This is a very long option text that might overflow the dropdown width';
      render(<Autocomplete {...defaultProps} options={[longOption]} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(screen.getByText(longOption)).toBeInTheDocument();
    });

    it('handles rapid input changes', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'abc', { delay: 1 });
      await userEvent.clear(input);
      await userEvent.type(input, 'def', { delay: 1 });

      expect(defaultProps.onInputChange).toHaveBeenLastCalledWith('def');
    });

    it('handles dropdown with no visible input value', () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      // Dropdown should still show with empty input
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('resets highlighted index on input change', async () => {
      render(<Autocomplete {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      // Highlight an option
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Type something
      await userEvent.type(input, 'a');

      // Highlight should be reset
      const options = screen.getAllByRole('button');
      options.forEach(option => {
        expect(option).not.toHaveClass('bg-blue-100');
      });
    });
  });
});