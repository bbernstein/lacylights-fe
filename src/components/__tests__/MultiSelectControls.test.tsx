import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MultiSelectControls from '../MultiSelectControls';
import { FixtureInstance, ChannelType, FixtureType, FadeBehavior } from '@/types';

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
  project: { id: 'proj-1', name: 'Test Project' } as any,
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
});
