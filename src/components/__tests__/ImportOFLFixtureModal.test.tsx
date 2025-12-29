import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ImportOFLFixtureModal from '../ImportOFLFixtureModal';
import { IMPORT_OFL_FIXTURE } from '@/graphql/fixtures';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockOnClose = jest.fn();
const mockOnFixtureImported = jest.fn();
const validOFLJson = JSON.stringify({
  name: 'Test Fixture',
  categories: ['LED_PAR'],
  availableChannels: {
    Dimmer: {
      capability: {
        type: 'Intensity',
        dmxRange: [0, 255],
      },
    },
  },
  modes: [
    {
      name: '1-Channel',
      channels: ['Dimmer'],
    },
  ],
});

describe('ImportOFLFixtureModal (Full)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={false}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render the import dialog when isOpen is true', () => {
    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Import OFL Fixture Definition')).toBeInTheDocument();
    expect(screen.getByLabelText('Manufacturer Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('OFL Fixture JSON *')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes on main dialog', () => {
    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'import-ofl-modal-title');
  });

  it('should have aria-hidden on decorative SVGs', () => {
    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    // Find the close button's SVG (BottomSheet renders via portal)
    const closeButton = screen.getByLabelText('Close');
    const svg = closeButton.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('should have aria-label on close button', () => {
    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show error for invalid JSON format', async () => {
    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: 'invalid json {' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid JSON format. Please check your input.')).toBeInTheDocument();
    });
  });

  it('should show error for missing required field: name', async () => {
    const invalidJson = JSON.stringify({
      categories: ['LED_PAR'],
      availableChannels: { Dimmer: {} },
      modes: [{ name: 'Test', channels: [] }],
    });

    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: invalidJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Missing required field: "name"/)).toBeInTheDocument();
    });
  });

  it('should show error for missing categories', async () => {
    const invalidJson = JSON.stringify({
      name: 'Test',
      availableChannels: { Dimmer: {} },
      modes: [{ name: 'Test', channels: [] }],
    });

    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: invalidJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Missing or empty required field: "categories"/)).toBeInTheDocument();
    });
  });

  it('should show error for missing availableChannels', async () => {
    const invalidJson = JSON.stringify({
      name: 'Test',
      categories: ['LED_PAR'],
      modes: [{ name: 'Test', channels: [] }],
    });

    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: invalidJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Missing or empty required field: "availableChannels"/)).toBeInTheDocument();
    });
  });

  it('should show error for missing modes', async () => {
    const invalidJson = JSON.stringify({
      name: 'Test',
      categories: ['LED_PAR'],
      availableChannels: { Dimmer: {} },
    });

    render(
      <MockedProvider mocks={[]}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: invalidJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Missing or empty required field: "modes"/)).toBeInTheDocument();
    });
  });

  it('should successfully import a valid fixture', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        result: {
          data: {
            importOFLFixture: {
              id: 'fixture-123',
              manufacturer: 'Test Manufacturer',
              model: 'Test Fixture',
              type: 'LED_PAR',
              channels: [
                {
                  id: 'channel-1',
                  name: 'Dimmer',
                  type: 'INTENSITY',
                  offset: 0,
                  fadeBehavior: 'FADE',
                  isDiscrete: false,
                },
              ],
              modes: [
                {
                  id: 'mode-1',
                  name: '1-Channel',
                  shortName: null,
                  channelCount: 1,
                },
              ],
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnFixtureImported).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should show replace confirmation dialog when fixture exists', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Manufacturer Test Fixture:3'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Fixture Already Exists')).toBeInTheDocument();
      expect(screen.getByText(/Test Manufacturer Test Fixture/)).toBeInTheDocument();
      expect(screen.getByText(/currently used by/)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  it('should have proper ARIA attributes on replace confirmation dialog', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Manufacturer Test Fixture:3'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'import-ofl-replace-modal-title');
    });
  });

  it('should not have backdrop click handler on replace confirmation dialog', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Manufacturer Test Fixture:3'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Fixture Already Exists')).toBeInTheDocument();
    });

    // Find the backdrop using testId
    const backdrop = screen.getByTestId('import-ofl-replace-modal-backdrop');

    // Click the backdrop - it should not close the dialog
    fireEvent.click(backdrop);

    // The dialog should still be open (not closed)
    expect(screen.getByText('Fixture Already Exists')).toBeInTheDocument();
  });

  it('should have cancel button with disabled attribute in replace confirmation', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Manufacturer Test Fixture:3'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Fixture Already Exists')).toBeInTheDocument();
    });

    // Verify that the cancel button exists and has the disabled class
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton.className).toContain('disabled:opacity-50');
    expect(cancelButton.className).toContain('disabled:cursor-not-allowed');
  });

  it('should show error message when replace is cancelled', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Manufacturer Test Fixture:3'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Fixture Already Exists')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Fixture import cancelled. The existing fixture was not replaced.')).toBeInTheDocument();
    });
  });

  it('should handle malformed FIXTURE_EXISTS error gracefully', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:incomplete'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error parsing fixture existence check. Please try again.')).toBeInTheDocument();
    });
  });

  it('should handle FIXTURE_EXISTS error with NaN instance count', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Fixture:notanumber'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error parsing fixture existence check. Please try again.')).toBeInTheDocument();
    });
  });

  it('should successfully replace fixture when confirmed', async () => {
    const mocks = [
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: false,
            },
          },
        },
        error: new Error('FIXTURE_EXISTS:Test Manufacturer Test Fixture:3'),
      },
      {
        request: {
          query: IMPORT_OFL_FIXTURE,
          variables: {
            input: {
              manufacturer: 'Test Manufacturer',
              oflFixtureJson: validOFLJson,
              replace: true,
            },
          },
        },
        result: {
          data: {
            importOFLFixture: {
              id: 'fixture-123',
              manufacturer: 'Test Manufacturer',
              model: 'Test Fixture',
              type: 'LED_PAR',
              channels: [
                {
                  id: 'channel-1',
                  name: 'Dimmer',
                  type: 'INTENSITY',
                  offset: 0,
                  fadeBehavior: 'FADE',
                  isDiscrete: false,
                },
              ],
              modes: [
                {
                  id: 'mode-1',
                  name: '1-Channel',
                  shortName: null,
                  channelCount: 1,
                },
              ],
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ImportOFLFixtureModal
          isOpen={true}
          onClose={mockOnClose}
          onFixtureImported={mockOnFixtureImported}
        />
      </MockedProvider>
    );

    const manufacturerInput = screen.getByLabelText('Manufacturer Name *');
    const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
    const submitButton = screen.getByRole('button', { name: /import fixture/i });

    fireEvent.change(manufacturerInput, { target: { value: 'Test Manufacturer' } });
    fireEvent.change(jsonInput, { target: { value: validOFLJson } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Fixture Already Exists')).toBeInTheDocument();
    });

    const replaceButton = screen.getByRole('button', { name: /replace fixture/i });
    fireEvent.click(replaceButton);

    await waitFor(() => {
      expect(mockOnFixtureImported).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <ImportOFLFixtureModal
            isOpen={true}
            onClose={mockOnClose}
            onFixtureImported={mockOnFixtureImported}
          />
        </MockedProvider>
      );

      const importButton = screen.getByRole('button', { name: /import fixture/i });
      const buttonContainer = importButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
    });

    it('shows Import Fixture button first on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <ImportOFLFixtureModal
            isOpen={true}
            onClose={mockOnClose}
            onFixtureImported={mockOnFixtureImported}
          />
        </MockedProvider>
      );

      const buttons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === 'Import Fixture' || btn.textContent === 'Cancel'
      );
      const buttonLabels = buttons.map(b => b.textContent);
      const importIndex = buttonLabels.indexOf('Import Fixture');
      const cancelIndex = buttonLabels.indexOf('Cancel');
      expect(importIndex).toBeLessThan(cancelIndex);
    });

    it('has larger touch targets on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <ImportOFLFixtureModal
            isOpen={true}
            onClose={mockOnClose}
            onFixtureImported={mockOnFixtureImported}
          />
        </MockedProvider>
      );

      const importButton = screen.getByRole('button', { name: /import fixture/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(importButton).toHaveClass('min-h-[44px]');
      expect(cancelButton).toHaveClass('min-h-[44px]');
    });

    it('has touch-manipulation class on mobile buttons', () => {
      render(
        <MockedProvider mocks={[]}>
          <ImportOFLFixtureModal
            isOpen={true}
            onClose={mockOnClose}
            onFixtureImported={mockOnFixtureImported}
          />
        </MockedProvider>
      );

      const importButton = screen.getByRole('button', { name: /import fixture/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(importButton).toHaveClass('touch-manipulation');
      expect(cancelButton).toHaveClass('touch-manipulation');
    });

    it('renders as BottomSheet dialog', () => {
      render(
        <MockedProvider mocks={[]}>
          <ImportOFLFixtureModal
            isOpen={true}
            onClose={mockOnClose}
            onFixtureImported={mockOnFixtureImported}
          />
        </MockedProvider>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has shorter textarea on mobile', () => {
      render(
        <MockedProvider mocks={[]}>
          <ImportOFLFixtureModal
            isOpen={true}
            onClose={mockOnClose}
            onFixtureImported={mockOnFixtureImported}
          />
        </MockedProvider>
      );

      const jsonInput = screen.getByLabelText('OFL Fixture JSON *');
      expect(jsonInput).toHaveAttribute('rows', '10');
    });
  });
});
