import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Autocomplete from '../Autocomplete';

describe('Autocomplete renderOption / onOptionSelect', () => {
  const options = ['Aura', 'Aura', 'Par'];
  const tags = ['Custom', 'OFL', 'Built-in'];

  const setup = (overrides = {}) => {
    const props = {
      label: 'Model',
      value: '',
      onChange: jest.fn(),
      onInputChange: jest.fn(),
      onOptionSelect: jest.fn(),
      options,
      renderOption: (option: string, index: number) => (
        <span>
          {option} [{tags[index]}]
        </span>
      ),
      ...overrides,
    };
    render(<Autocomplete {...props} />);
    return props;
  };

  it('renders custom option content', async () => {
    setup();
    await userEvent.click(screen.getByRole('textbox'));
    expect(screen.getByRole('button', { name: 'Aura [Custom]' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aura [OFL]' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Par [Built-in]' })).toBeInTheDocument();
  });

  it('reports the picked option index instead of calling onChange', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Aura [OFL]' }));
    expect(props.onOptionSelect).toHaveBeenCalledWith('Aura', 1);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('Aura');
  });

  it('maps filtered options back to their original index', async () => {
    const props = setup();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'par');
    expect(screen.queryByRole('button', { name: /Aura/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Par [Built-in]' }));
    expect(props.onOptionSelect).toHaveBeenCalledWith('Par', 2);
  });

  it('selects the highlighted option with the keyboard', () => {
    const props = setup();
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onOptionSelect).toHaveBeenCalledWith('Aura', 1);
  });

  it('still calls onChange when onOptionSelect is not given', async () => {
    const props = setup({ onOptionSelect: undefined });
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Par [Built-in]' }));
    expect(props.onChange).toHaveBeenCalledWith('Par');
  });
});
