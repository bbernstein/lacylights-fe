import { render, screen, fireEvent } from '@testing-library/react';
import MobileFixtureToolbar from '../MobileFixtureToolbar';

describe('MobileFixtureToolbar', () => {
  const defaultProps = {
    selectedCount: 2,
    color: { r: 255, g: 0, b: 0 },
    onColorClick: jest.fn(),
    onExpand: jest.fn(),
    onDeselectAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with correct fixture count (singular)', () => {
      render(<MobileFixtureToolbar {...defaultProps} selectedCount={1} />);
      expect(screen.getByText('1 fixture selected')).toBeInTheDocument();
    });

    it('renders with correct fixture count (plural)', () => {
      render(<MobileFixtureToolbar {...defaultProps} selectedCount={3} />);
      expect(screen.getByText('3 fixtures selected')).toBeInTheDocument();
    });

    it('renders color swatch with correct color', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      const colorSwatch = screen.getByTestId('mobile-fixture-toolbar-color');
      expect(colorSwatch).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('does not render color swatch when color is null', () => {
      render(<MobileFixtureToolbar {...defaultProps} color={null} />);
      expect(screen.queryByTestId('mobile-fixture-toolbar-color')).not.toBeInTheDocument();
    });

    it('applies custom testId', () => {
      render(<MobileFixtureToolbar {...defaultProps} testId="custom-toolbar" />);
      expect(screen.getByTestId('custom-toolbar')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onColorClick when color swatch is clicked', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      fireEvent.click(screen.getByTestId('mobile-fixture-toolbar-color'));
      expect(defaultProps.onColorClick).toHaveBeenCalledTimes(1);
    });

    it('calls onExpand when expand button is clicked', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      fireEvent.click(screen.getByTestId('mobile-fixture-toolbar-expand'));
      expect(defaultProps.onExpand).toHaveBeenCalledTimes(1);
    });

    it('calls onDeselectAll when deselect button is clicked', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      fireEvent.click(screen.getByTestId('mobile-fixture-toolbar-deselect'));
      expect(defaultProps.onDeselectAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has accessible label for deselect button', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      expect(screen.getByLabelText('Deselect all fixtures')).toBeInTheDocument();
    });

    it('has accessible label for color swatch', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      expect(screen.getByLabelText('Open color picker')).toBeInTheDocument();
    });

    it('has accessible label for expand button', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      expect(screen.getByLabelText('Expand controls')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('is positioned fixed at bottom-32 (above SceneEditorBottomActions)', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      const toolbar = screen.getByTestId('mobile-fixture-toolbar');
      expect(toolbar).toHaveClass('fixed', 'bottom-32', 'z-40');
    });

    it('is hidden on desktop (md:hidden)', () => {
      render(<MobileFixtureToolbar {...defaultProps} />);
      const toolbar = screen.getByTestId('mobile-fixture-toolbar');
      expect(toolbar).toHaveClass('md:hidden');
    });
  });
});
