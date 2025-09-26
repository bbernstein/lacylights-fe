import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoscoluxSwatchPicker from '../RoscoluxSwatchPicker';

jest.mock('@/data/roscoluxFilters', () => ({
  ROSCOLUX_FILTERS: [
    { filter: '01 Light Red', rgbHex: '#ff0000', applications: 'General lighting, stage wash', keywords: 'red primary color' },
    { filter: '02 Bastard Amber', rgbHex: '#ffbf00', applications: 'Warm lighting, sunset effects', keywords: 'amber warm' },
    { filter: '03 Dark Blue', rgbHex: '#0000ff', applications: 'Night scenes, cool wash', keywords: 'blue primary color' },
    { filter: '04 Medium Green', rgbHex: '#00ff00', applications: 'Nature scenes, forest effects', keywords: 'green primary color' },
    { filter: '05 Rose Pink', rgbHex: '#ff69b4', applications: 'Romantic scenes, soft lighting', keywords: 'pink rose romantic' },
  ],
}));

jest.mock('@/utils/colorHelpers', () => ({
  hexToRgb: jest.fn((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }),
}));

const mockBoundingClientRect = {
  x: 100,
  y: 200,
  width: 50,
  height: 50,
  top: 200,
  left: 100,
  bottom: 250,
  right: 150,
  toJSON: jest.fn(),
};

describe('RoscoluxSwatchPicker', () => {
  const defaultProps = {
    currentColor: { r: 128, g: 128, b: 128 },
    onColorSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document.body for portal testing
    document.body.innerHTML = '';

    Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: jest.fn(() => mockBoundingClientRect),
    });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    Object.defineProperty(window, 'pageXOffset', { value: 0, writable: true });
  });

  describe('rendering', () => {
    it('renders search input', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search filters by name, application, or keywords...')).toBeInTheDocument();
    });

    it('renders all filter swatches', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      expect(screen.getByLabelText('01 Light Red')).toBeInTheDocument();
      expect(screen.getByLabelText('02 Bastard Amber')).toBeInTheDocument();
      expect(screen.getByLabelText('03 Dark Blue')).toBeInTheDocument();
      expect(screen.getByLabelText('04 Medium Green')).toBeInTheDocument();
      expect(screen.getByLabelText('05 Rose Pink')).toBeInTheDocument();
    });

    it('displays filter count', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      expect(screen.getByText('Showing 5 of 5 Roscolux filters')).toBeInTheDocument();
    });

    it('renders with custom maxHeight', () => {
      const { container } = render(<RoscoluxSwatchPicker {...defaultProps} maxHeight="500px" />);

      const mainContainer = container.querySelector('.p-6.h-full.flex.flex-col');
      expect(mainContainer).toHaveStyle('max-height: 500px');
    });

    it('renders with default maxHeight when not provided', () => {
      const { container } = render(<RoscoluxSwatchPicker {...defaultProps} />);

      const mainContainer = container.querySelector('.p-6.h-full.flex.flex-col');
      expect(mainContainer).toHaveStyle('max-height: calc(90vh - 200px)');
    });
  });

  describe('search functionality', () => {
    it('filters by filter name', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'red');

      expect(screen.getByLabelText('01 Light Red')).toBeInTheDocument();
      expect(screen.queryByLabelText('02 Bastard Amber')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('03 Dark Blue')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 5 Roscolux filters')).toBeInTheDocument();
    });

    it('filters by applications', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'sunset');

      expect(screen.getByLabelText('02 Bastard Amber')).toBeInTheDocument();
      expect(screen.queryByLabelText('01 Light Red')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 5 Roscolux filters')).toBeInTheDocument();
    });

    it('filters by keywords', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'primary');

      expect(screen.getByLabelText('01 Light Red')).toBeInTheDocument();
      expect(screen.getByLabelText('03 Dark Blue')).toBeInTheDocument();
      expect(screen.getByLabelText('04 Medium Green')).toBeInTheDocument();
      expect(screen.queryByLabelText('02 Bastard Amber')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 3 of 5 Roscolux filters')).toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'RED');

      expect(screen.getByLabelText('01 Light Red')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 5 Roscolux filters')).toBeInTheDocument();
    });

    it('shows no results message when no filters match', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('No filters match your search')).toBeInTheDocument();
      expect(screen.getByText('Try searching for color names, applications, or keywords')).toBeInTheDocument();
      expect(screen.getByText('Showing 0 of 5 Roscolux filters')).toBeInTheDocument();
    });

    it('clears search when input is cleared', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'red');
      expect(screen.getByText('Showing 1 of 5 Roscolux filters')).toBeInTheDocument();

      await userEvent.clear(searchInput);
      expect(screen.getByText('Showing 5 of 5 Roscolux filters')).toBeInTheDocument();
    });
  });

  describe('swatch interaction', () => {
    it('calls onColorSelect when swatch is clicked', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      await userEvent.click(redSwatch);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
    });

    it('calls onColorSelect with correct color for different swatches', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const blueSwatch = screen.getByLabelText('03 Dark Blue');
      await userEvent.click(blueSwatch);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({ r: 0, g: 0, b: 255 });
    });

    it('applies correct background color to swatches', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      expect(redSwatch).toHaveStyle('background-color: #ff0000');

      const blueSwatch = screen.getByLabelText('03 Dark Blue');
      expect(blueSwatch).toHaveStyle('background-color: #0000ff');
    });

    it('displays filter number overlay on swatches', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      expect(redSwatch.querySelector('span')).toHaveTextContent('01');

      const blueSwatch = screen.getByLabelText('03 Dark Blue');
      expect(blueSwatch.querySelector('span')).toHaveTextContent('03');
    });
  });

  describe('tooltip functionality', () => {
    it('shows tooltip on mouse enter', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
        expect(screen.getByText('General lighting, stage wash')).toBeInTheDocument();
        expect(screen.getByText('RGB: #FF0000')).toBeInTheDocument();
        expect(screen.getByText('Keywords: red primary color')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(redSwatch);

      await waitFor(() => {
        expect(screen.queryByText('General lighting, stage wash')).not.toBeInTheDocument();
      });
    });

    it('shows different tooltip for different swatches', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const amberSwatch = screen.getByLabelText('02 Bastard Amber');
      fireEvent.mouseEnter(amberSwatch);

      await waitFor(() => {
        expect(screen.getByText('02 Bastard Amber')).toBeInTheDocument();
        expect(screen.getByText('Warm lighting, sunset effects')).toBeInTheDocument();
        expect(screen.getByText('RGB: #FFBF00')).toBeInTheDocument();
        expect(screen.getByText('Keywords: amber warm')).toBeInTheDocument();
      });
    });

    it('handles tooltip positioning', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
        expect(screen.getByText('General lighting, stage wash')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('accessibility', () => {
    it('has proper aria labels for swatches', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      expect(screen.getByLabelText('01 Light Red')).toHaveAttribute('aria-label', '01 Light Red');
      expect(screen.getByLabelText('02 Bastard Amber')).toHaveAttribute('aria-label', '02 Bastard Amber');
    });

    it('has proper button roles for swatches', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const swatches = screen.getAllByRole('button');
      expect(swatches.length).toBeGreaterThanOrEqual(5);
    });

    it('has proper input field for search', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });

  describe('styling', () => {
    it('applies correct container classes', () => {
      const { container } = render(<RoscoluxSwatchPicker {...defaultProps} />);

      const mainContainer = container.querySelector('.p-6.h-full.flex.flex-col');
      expect(mainContainer).toBeInTheDocument();
    });

    it('applies correct search input classes', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      expect(searchInput).toHaveClass('w-full', 'pl-10', 'pr-4', 'py-2', 'border');
    });

    it('applies correct swatch button classes', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      expect(redSwatch).toHaveClass('w-full', 'aspect-square', 'rounded-md', 'border-2');
    });

    it('applies correct grid classes', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const grid = screen.getByLabelText('01 Light Red').parentElement?.parentElement;
      expect(grid).toHaveClass('grid', 'grid-cols-6', 'gap-2');
    });
  });

  describe('responsive design', () => {
    it('applies responsive grid classes', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const grid = screen.getByLabelText('01 Light Red').parentElement?.parentElement;
      expect(grid).toHaveClass('sm:grid-cols-8', 'md:grid-cols-10');
    });

    it('has minimum dimensions for swatches', () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      expect(redSwatch).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });
  });

  describe('tooltip positioning', () => {

    it('calculates tooltip position correctly', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles window resize events for tooltip positioning', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.resize(window);

      // Should still be visible after resize
      expect(screen.getByText('01 Light Red')).toBeInTheDocument();
    });

    it('handles scroll events for tooltip positioning', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.scroll(window);

      // Should still be visible after scroll
      expect(screen.getByText('01 Light Red')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty search results gracefully', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');
      await userEvent.type(searchInput, 'xyz123');

      expect(screen.getByText('No filters match your search')).toBeInTheDocument();
      expect(screen.queryByLabelText('01 Light Red')).not.toBeInTheDocument();
    });

    it('handles multiple rapid search changes', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search filters by name, application, or keywords...');

      await userEvent.type(searchInput, 'red');
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'blue');

      expect(screen.getByLabelText('03 Dark Blue')).toBeInTheDocument();
      expect(screen.queryByLabelText('01 Light Red')).not.toBeInTheDocument();
    });

    it('handles tooltip with missing keywords gracefully', async () => {
      const mockFiltersWithoutKeywords = [
        { filter: '01 Light Red', rgbHex: '#ff0000', applications: 'General lighting', keywords: '' },
      ];

      jest.doMock('@/data/roscoluxFilters', () => ({
        ROSCOLUX_FILTERS: mockFiltersWithoutKeywords,
      }));

      const { rerender } = render(<RoscoluxSwatchPicker {...defaultProps} />);
      rerender(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      // Should still work even without keywords
      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
        expect(screen.getByText('General lighting, stage wash')).toBeInTheDocument();
      });
    });

    it('handles window without pageYOffset property', async () => {
      Object.defineProperty(window, 'pageYOffset', { value: undefined, writable: true });
      Object.defineProperty(document.documentElement, 'scrollTop', { value: 10, writable: true });

      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      });
    });
  });

  describe('performance and cleanup', () => {
    it('cleans up event listeners when tooltip is hidden', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(redSwatch);

      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      });

      removeEventListenerSpy.mockRestore();
    });

    it('handles rapid hover events without breaking', async () => {
      render(<RoscoluxSwatchPicker {...defaultProps} />);

      const redSwatch = screen.getByLabelText('01 Light Red');
      const blueSwatch = screen.getByLabelText('03 Dark Blue');

      // Rapid hover changes
      fireEvent.mouseEnter(redSwatch);
      fireEvent.mouseLeave(redSwatch);
      fireEvent.mouseEnter(blueSwatch);
      fireEvent.mouseLeave(blueSwatch);
      fireEvent.mouseEnter(redSwatch);

      await waitFor(() => {
        expect(screen.getByText('01 Light Red')).toBeInTheDocument();
      });
    });
  });
});