import { render, screen, fireEvent } from '@testing-library/react';
import LookEditorMobileToolbar from '../LookEditorMobileToolbar';

describe('LookEditorMobileToolbar', () => {
  const defaultProps = {
    lookName: 'Test Look',
    mode: 'channels' as const,
    onClose: jest.fn(),
    onToggleMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with look name', () => {
    render(<LookEditorMobileToolbar {...defaultProps} />);

    expect(screen.getByTestId('look-editor-mobile-toolbar-look-name')).toHaveTextContent(
      'Test Look'
    );
  });

  it('renders with custom testId', () => {
    render(<LookEditorMobileToolbar {...defaultProps} testId="custom-toolbar" />);

    expect(screen.getByTestId('custom-toolbar')).toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', () => {
    const onClose = jest.fn();
    render(<LookEditorMobileToolbar {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-back-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Player Mode badge when fromPlayer is true', () => {
    render(<LookEditorMobileToolbar {...defaultProps} fromPlayer={true} />);

    expect(
      screen.getByTestId('look-editor-mobile-toolbar-player-mode-badge')
    ).toBeInTheDocument();
  });

  it('does not show Player Mode badge when fromPlayer is false', () => {
    render(<LookEditorMobileToolbar {...defaultProps} fromPlayer={false} />);

    expect(
      screen.queryByTestId('look-editor-mobile-toolbar-player-mode-badge')
    ).not.toBeInTheDocument();
  });

  it('displays current mode in button', () => {
    render(<LookEditorMobileToolbar {...defaultProps} mode="channels" />);

    expect(screen.getByTestId('look-editor-mobile-toolbar-mode-button')).toHaveTextContent(
      'Channels'
    );
  });

  it('displays Layout mode in button when in layout mode', () => {
    render(<LookEditorMobileToolbar {...defaultProps} mode="layout" />);

    expect(screen.getByTestId('look-editor-mobile-toolbar-mode-button')).toHaveTextContent(
      'Layout'
    );
  });

  it('opens mode dropdown when mode button is clicked', () => {
    render(<LookEditorMobileToolbar {...defaultProps} />);

    const modeButton = screen.getByTestId('look-editor-mobile-toolbar-mode-button');
    fireEvent.click(modeButton);

    expect(screen.getByTestId('look-editor-mobile-toolbar-mode-dropdown')).toBeInTheDocument();
  });

  it('calls onToggleMode when different mode is selected', () => {
    const onToggleMode = jest.fn();
    render(
      <LookEditorMobileToolbar {...defaultProps} mode="channels" onToggleMode={onToggleMode} />
    );

    // Open dropdown
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-button'));

    // Select layout mode
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-option-layout'));

    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggleMode when same mode is selected', () => {
    const onToggleMode = jest.fn();
    render(
      <LookEditorMobileToolbar {...defaultProps} mode="channels" onToggleMode={onToggleMode} />
    );

    // Open dropdown
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-button'));

    // Select same mode
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-option-channels'));

    expect(onToggleMode).not.toHaveBeenCalled();
  });

  it('closes dropdown when mode is selected', () => {
    render(<LookEditorMobileToolbar {...defaultProps} />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-button'));
    expect(screen.getByTestId('look-editor-mobile-toolbar-mode-dropdown')).toBeInTheDocument();

    // Select an option
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-option-layout'));

    // Dropdown should close
    expect(
      screen.queryByTestId('look-editor-mobile-toolbar-mode-dropdown')
    ).not.toBeInTheDocument();
  });

  it('closes dropdown when backdrop is clicked', () => {
    render(<LookEditorMobileToolbar {...defaultProps} />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-button'));
    expect(screen.getByTestId('look-editor-mobile-toolbar-mode-dropdown')).toBeInTheDocument();

    // Click backdrop (the fixed inset-0 div)
    const backdrop = document.querySelector('.fixed.inset-0.z-10');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);

    // Dropdown should close
    expect(
      screen.queryByTestId('look-editor-mobile-toolbar-mode-dropdown')
    ).not.toBeInTheDocument();
  });

  it('has correct aria attributes on mode button', () => {
    render(<LookEditorMobileToolbar {...defaultProps} />);

    const modeButton = screen.getByTestId('look-editor-mobile-toolbar-mode-button');
    expect(modeButton).toHaveAttribute('aria-haspopup', 'listbox');
    expect(modeButton).toHaveAttribute('aria-expanded', 'false');

    // Open dropdown
    fireEvent.click(modeButton);
    expect(modeButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks current mode as selected in dropdown', () => {
    render(<LookEditorMobileToolbar {...defaultProps} mode="layout" />);

    // Open dropdown
    fireEvent.click(screen.getByTestId('look-editor-mobile-toolbar-mode-button'));

    const channelsOption = screen.getByTestId('look-editor-mobile-toolbar-mode-option-channels');
    const layoutOption = screen.getByTestId('look-editor-mobile-toolbar-mode-option-layout');

    expect(channelsOption).toHaveAttribute('aria-selected', 'false');
    expect(layoutOption).toHaveAttribute('aria-selected', 'true');
  });

  it('truncates long look names', () => {
    const longName = 'This is a very long look name that should be truncated';
    render(<LookEditorMobileToolbar {...defaultProps} lookName={longName} />);

    const nameElement = screen.getByTestId('look-editor-mobile-toolbar-look-name');
    expect(nameElement).toHaveClass('truncate');
    expect(nameElement).toHaveAttribute('title', longName);
  });

  it('is hidden on desktop (md:hidden class)', () => {
    render(<LookEditorMobileToolbar {...defaultProps} />);

    const toolbar = screen.getByTestId('look-editor-mobile-toolbar');
    expect(toolbar).toHaveClass('md:hidden');
  });
});
