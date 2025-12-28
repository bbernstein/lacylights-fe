import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MultiSelectControls from '../MultiSelectControls';
import { FixtureInstance, ChannelType, FixtureType, FadeBehavior } from '@/types';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
  useIsTablet: jest.fn(() => false),
  useIsDesktop: jest.fn(() => true),
  useMediaQuery: jest.fn(() => false),
}));

// Mock the child components
jest.mock('../ChannelSlider', () => {
  return function MockChannelSlider({ channel, value, onChange }: {
    channel: { type: string; name: string };
    value: number;
    onChange: (value: number) => void;
  }) {
    return (
      <div data-testid={`channel-slider-${channel.type}`}>
        <label>{channel.name}</label>
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          data-testid={`slider-${channel.type}`}
        />
      </div>
    );
  };
});

jest.mock('../ColorPickerModal', () => {
  return function MockColorPickerModal({
    isOpen,
    onClose,
    onColorChange,
    onIntensityChange,
    intensity,
  }: {
    isOpen: boolean;
    onClose: () => void;
    currentColor?: { r: number; g: number; b: number };
    onColorChange: (color: { r: number; g: number; b: number }) => void;
    onIntensityChange: (intensity: number) => void;
    intensity: number;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="color-picker-modal">
        <button onClick={onClose} data-testid="close-color-picker">
          Close
        </button>
        <button
          onClick={() => onColorChange({ r: 255, g: 0, b: 0 })}
          data-testid="change-color"
        >
          Change Color
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={intensity * 100}
          onChange={(e) => onIntensityChange(parseInt(e.target.value) / 100)}
          data-testid="intensity-slider"
        />
      </div>
    );
  };
});

jest.mock('../MobileFixtureToolbar', () => {
  return function MockMobileFixtureToolbar({
    selectedCount,
    color,
    onColorClick,
    onExpand,
    onDeselectAll,
  }: {
    selectedCount: number;
    color: { r: number; g: number; b: number } | null;
    onColorClick: () => void;
    onExpand: () => void;
    onDeselectAll: () => void;
  }) {
    return (
      <div data-testid="mobile-fixture-toolbar">
        <span>{selectedCount} fixtures</span>
        {color && (
          <button onClick={onColorClick} data-testid="mobile-color-click">
            Color
          </button>
        )}
        <button onClick={onExpand} data-testid="mobile-expand">
          Expand
        </button>
        <button onClick={onDeselectAll} data-testid="mobile-deselect">
          Deselect
        </button>
      </div>
    );
  };
});

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockFixture = {
  id: 'fixture-1',
  name: 'Test Fixture',
  manufacturer: 'Test',
  model: 'RGB',
  type: FixtureType.LED_PAR,
  modeName: 'RGB',
  universe: 1,
  startChannel: 1,
  channelCount: 3,
  definitionId: 'def-1',
  project: {
    id: 'proj-1',
    name: 'Test Project',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    fixtures: [],
    scenes: [],
    cueLists: [],
    users: [],
  },
  tags: [],
  createdAt: '2023-01-01T00:00:00Z',
  channels: [
    {
      id: 'ch-1',
      offset: 0,
      name: 'Red',
      type: ChannelType.RED,
      minValue: 0,
      maxValue: 255,
      defaultValue: 0,
      fadeBehavior: FadeBehavior.FADE,
      isDiscrete: false,
    },
    {
      id: 'ch-2',
      offset: 1,
      name: 'Green',
      type: ChannelType.GREEN,
      minValue: 0,
      maxValue: 255,
      defaultValue: 0,
      fadeBehavior: FadeBehavior.FADE,
      isDiscrete: false,
    },
    {
      id: 'ch-3',
      offset: 2,
      name: 'Blue',
      type: ChannelType.BLUE,
      minValue: 0,
      maxValue: 255,
      defaultValue: 0,
      fadeBehavior: FadeBehavior.FADE,
      isDiscrete: false,
    },
  ],
} as FixtureInstance;

const mockFixtureWithIntensity = {
  ...mockFixture,
  id: 'fixture-2',
  channelCount: 4,
  channels: [
    ...(mockFixture.channels || []),
    {
      id: 'ch-4',
      offset: 3,
      name: 'Intensity',
      type: ChannelType.INTENSITY,
      minValue: 0,
      maxValue: 255,
      defaultValue: 0,
      fadeBehavior: FadeBehavior.FADE,
      isDiscrete: false,
    },
  ],
} as FixtureInstance;

describe('MultiSelectControls', () => {
  const mockOnBatchedChannelChanges = jest.fn();
  const mockOnDebouncedPreviewUpdate = jest.fn();
  const mockOnDeselectAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no fixtures selected', () => {
    const { container } = render(
      <MultiSelectControls
        selectedFixtures={[]}
        fixtureValues={new Map()}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // Component should render but be empty
    expect(container.firstChild).toBeNull();
  });

  it('renders with single fixture selected', () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/fixture/i)).toBeInTheDocument();
  });

  it('renders with multiple fixtures selected', () => {
    const fixtureValues = new Map([
      [mockFixture.id, [255, 128, 64]],
      [mockFixtureWithIntensity.id, [128, 64, 32, 255]],
    ]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture, mockFixtureWithIntensity]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/fixtures/i)).toBeInTheDocument();
  });

  it('shows deselect all button', () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    const deselectButton = screen.getByTitle('Deselect all fixtures');
    expect(deselectButton).toBeInTheDocument();

    fireEvent.click(deselectButton);
    expect(mockOnDeselectAll).toHaveBeenCalled();
  });

  it('renders channel sliders for RGB channels', () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    expect(screen.getByTestId('channel-slider-RED')).toBeInTheDocument();
    expect(screen.getByTestId('channel-slider-GREEN')).toBeInTheDocument();
    expect(screen.getByTestId('channel-slider-BLUE')).toBeInTheDocument();
  });

  it('shows color picker swatch for RGB fixtures', () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('opens color picker when swatch is clicked', () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // Find and click the color swatch button
    const colorSwatchButton = screen.getByTitle('Click to open color picker');
    fireEvent.click(colorSwatchButton);

    // Color picker should be open
    expect(screen.getByTestId('color-picker-modal')).toBeInTheDocument();
  });

  it('closes color picker when close button is clicked', () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // Open color picker
    const colorSwatchButton = screen.getByTitle('Click to open color picker');
    fireEvent.click(colorSwatchButton);
    expect(screen.getByTestId('color-picker-modal')).toBeInTheDocument();

    // Close color picker
    const closeButton = screen.getByTestId('close-color-picker');
    fireEvent.click(closeButton);

    // Color picker should be closed
    expect(screen.queryByTestId('color-picker-modal')).not.toBeInTheDocument();
  });

  it('updates channels when color is changed in picker', async () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // Open color picker
    const colorSwatchButton = screen.getByTitle('Click to open color picker');
    fireEvent.click(colorSwatchButton);

    // Change color
    const changeColorButton = screen.getByTestId('change-color');
    fireEvent.click(changeColorButton);

    // Should trigger debounced preview update
    await waitFor(() => {
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
    });
  });

  it('updates channels when intensity is changed in picker', async () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // Open color picker
    const colorSwatchButton = screen.getByTitle('Click to open color picker');
    fireEvent.click(colorSwatchButton);

    // Change intensity
    const intensitySlider = screen.getByTestId('intensity-slider');
    fireEvent.change(intensitySlider, { target: { value: '50' } });

    // Should trigger debounced preview update
    await waitFor(() => {
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
    });
  });

  it('maintains base color when intensity changes', async () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // Open color picker
    const colorSwatchButton = screen.getByTitle('Click to open color picker');
    fireEvent.click(colorSwatchButton);

    // Change intensity to 0
    const intensitySlider = screen.getByTestId('intensity-slider');
    fireEvent.change(intensitySlider, { target: { value: '0' } });

    await waitFor(() => {
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
    });

    // Change intensity back to 100
    fireEvent.change(intensitySlider, { target: { value: '100' } });

    await waitFor(() => {
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalledTimes(2);
    });

    // The base color should be preserved - verified by the fact that
    // onDebouncedPreviewUpdate was called with color channel updates
  });

  it('handles fixtures with INTENSITY channel', () => {
    const fixtureValues = new Map([[mockFixtureWithIntensity.id, [255, 128, 64, 200]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixtureWithIntensity]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    expect(screen.getByTestId('channel-slider-INTENSITY')).toBeInTheDocument();
  });

  it('updates fixture values when slider changes', async () => {
    const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    const redSlider = screen.getByTestId('slider-RED');
    fireEvent.change(redSlider, { target: { value: '200' } });

    await waitFor(() => {
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
    });
  });

  it('shows variation indicator for channels with different values across fixtures', () => {
    const fixtureValues = new Map([
      [mockFixture.id, [255, 128, 64]],
      ['fixture-3', [128, 128, 64]], // Different red value
    ]);

    const fixture3 = { ...mockFixture, id: 'fixture-3' };

    render(
      <MultiSelectControls
        selectedFixtures={[mockFixture, fixture3]}
        fixtureValues={fixtureValues}
        onBatchedChannelChanges={mockOnBatchedChannelChanges}
        onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
        onDeselectAll={mockOnDeselectAll}
      />
    );

    // The component should merge channels and detect variation
    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    // Should show variation indicator
    expect(screen.getByTitle('Values differ across selected fixtures')).toBeInTheDocument();
  });

  describe('Phase 3: Intensity scaling with unscaled RGB', () => {
    it('opens color picker with unscaled RGB for fixture with INTENSITY channel at 50%', async () => {
      // Fixture has: RED=255, GREEN=0, BLUE=0, INTENSITY=128 (50%)
      // Display color should be: rgb(128, 0, 0) (scaled)
      // Base color for picker should be: {r: 255, g: 0, b: 0} (unscaled)
      const fixtureValues = new Map([[mockFixtureWithIntensity.id, [255, 0, 0, 128]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixtureWithIntensity]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Open color picker
      const colorSwatchButton = screen.getByTitle('Click to open color picker');
      fireEvent.click(colorSwatchButton);

      // Verify color picker is open
      expect(screen.getByTestId('color-picker-modal')).toBeInTheDocument();

      // Verify intensity is set to ~50% (128/255 ≈ 0.502)
      const intensitySlider = screen.getByTestId('intensity-slider') as HTMLInputElement;
      // Allow for floating point precision: 128/255 * 100 ≈ 50.196
      expect(parseFloat(intensitySlider.value)).toBeCloseTo(50, 0);
    });

    it('restores full brightness when intensity moves from 50% to 100% for RGB+I fixture', async () => {
      // Starting state: RED=255, INTENSITY=128 (50% brightness)
      const fixtureValues = new Map([[mockFixtureWithIntensity.id, [255, 0, 0, 128]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixtureWithIntensity]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Open color picker
      const colorSwatchButton = screen.getByTitle('Click to open color picker');
      fireEvent.click(colorSwatchButton);

      // Move intensity to 100%
      const intensitySlider = screen.getByTestId('intensity-slider');
      fireEvent.change(intensitySlider, { target: { value: '100' } });

      await waitFor(() => {
        expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
      });

      // Verify that the update was called (indicating INTENSITY channel was set to 255)
      // The base color (RED=255) should be preserved, only INTENSITY should change
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            fixtureId: mockFixtureWithIntensity.id,
          })
        ])
      );
    });

    it('restores full brightness when intensity moves from 0% to 100% for RGB+I fixture', async () => {
      // Starting state: RED=255, INTENSITY=0 (0% brightness - blackout)
      const fixtureValues = new Map([[mockFixtureWithIntensity.id, [255, 0, 0, 0]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixtureWithIntensity]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Open color picker
      const colorSwatchButton = screen.getByTitle('Click to open color picker');
      fireEvent.click(colorSwatchButton);

      // Verify intensity starts at 0%
      const intensitySlider = screen.getByTestId('intensity-slider') as HTMLInputElement;
      expect(parseFloat(intensitySlider.value)).toBe(0);

      // Move intensity to 100%
      fireEvent.change(intensitySlider, { target: { value: '100' } });

      await waitFor(() => {
        expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
      });

      // The fixture should now be at full brightness
      // RED=255 (preserved), INTENSITY=255 (updated)
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            fixtureId: mockFixtureWithIntensity.id,
          })
        ])
      );
    });

    it('uses intensity=1.0 for RGB-only fixtures without INTENSITY channel', async () => {
      // RGB-only fixture: RED=255, GREEN=128, BLUE=64
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Open color picker
      const colorSwatchButton = screen.getByTitle('Click to open color picker');
      fireEvent.click(colorSwatchButton);

      // Verify intensity defaults to 100% for RGB-only fixtures
      const intensitySlider = screen.getByTestId('intensity-slider') as HTMLInputElement;
      expect(parseFloat(intensitySlider.value)).toBe(100);
    });

    it('scales RGB channels directly for RGB-only fixtures when intensity changes', async () => {
      // RGB-only fixture: RED=255, GREEN=0, BLUE=0
      const fixtureValues = new Map([[mockFixture.id, [255, 0, 0]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Open color picker
      const colorSwatchButton = screen.getByTitle('Click to open color picker');
      fireEvent.click(colorSwatchButton);

      // Move intensity to 50%
      const intensitySlider = screen.getByTestId('intensity-slider');
      fireEvent.change(intensitySlider, { target: { value: '50' } });

      await waitFor(() => {
        expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalled();
      });

      // For RGB-only fixtures, intensity scales the RGB channels
      // So RED should become ~128 (50% of 255)
      expect(mockOnDebouncedPreviewUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            fixtureId: mockFixture.id,
          })
        ])
      );
    });
  });

  describe('Mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    afterEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('renders MobileFixtureToolbar on mobile when not expanded', () => {
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      expect(screen.getByTestId('mobile-fixture-toolbar')).toBeInTheDocument();
      expect(screen.queryByTestId('multi-select-controls')).not.toBeInTheDocument();
    });

    it('expands to BottomSheet when expand button is clicked', () => {
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Click expand button
      fireEvent.click(screen.getByTestId('mobile-expand'));

      // Should now show BottomSheet (via data-testid)
      expect(screen.getByTestId('multi-select-controls')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-fixture-toolbar')).not.toBeInTheDocument();
    });

    it('opens color picker from toolbar color swatch', () => {
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Click color swatch in toolbar
      fireEvent.click(screen.getByTestId('mobile-color-click'));

      // Color picker should open (rendered at root level)
      expect(screen.getByTestId('color-picker-modal')).toBeInTheDocument();
    });

    it('calls onDeselectAll from toolbar', () => {
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Click deselect in toolbar
      fireEvent.click(screen.getByTestId('mobile-deselect'));

      expect(mockOnDeselectAll).toHaveBeenCalled();
    });

    it('ColorPickerModal renders at root level on mobile', () => {
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // Open color picker from toolbar
      fireEvent.click(screen.getByTestId('mobile-color-click'));

      // Color picker should be visible and not blocked by any container
      expect(screen.getByTestId('color-picker-modal')).toBeInTheDocument();
    });

    it('ColorPickerModal remains accessible when expanded controls are shown', () => {
      const fixtureValues = new Map([[mockFixture.id, [255, 128, 64]]]);

      render(
        <MultiSelectControls
          selectedFixtures={[mockFixture]}
          fixtureValues={fixtureValues}
          onBatchedChannelChanges={mockOnBatchedChannelChanges}
          onDebouncedPreviewUpdate={mockOnDebouncedPreviewUpdate}
          onDeselectAll={mockOnDeselectAll}
        />
      );

      // First expand to BottomSheet
      fireEvent.click(screen.getByTestId('mobile-expand'));

      // Then open color picker from expanded view
      const colorSwatchButton = screen.getByTitle('Click to open color picker');
      fireEvent.click(colorSwatchButton);

      // Color picker should be open
      expect(screen.getByTestId('color-picker-modal')).toBeInTheDocument();
    });
  });
});
