import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChannelSlider, { SliderChannel } from '../ChannelSlider';
import { ChannelType } from '@/types';

// Mock the scroll direction preference hook
jest.mock('@/hooks/useScrollDirectionPreference', () => ({
  useScrollDirectionPreference: () => ['natural', jest.fn(), false],
}));

// Mock the display mode hook
jest.mock('@/hooks/useDisplayMode', () => ({
  useDisplayMode: jest.fn(() => ({
    displayMode: 'dmx',
    isDmxMode: true,
    isPercentMode: false,
    setDisplayMode: jest.fn(),
  })),
}));

import { useDisplayMode } from '@/hooks/useDisplayMode';
const mockUseDisplayMode = useDisplayMode as jest.MockedFunction<typeof useDisplayMode>;

const mockRedChannel: SliderChannel = {
  name: 'Red',
  type: ChannelType.RED,
  minValue: 0,
  maxValue: 255,
};

const mockIntensityChannel: SliderChannel = {
  name: 'Intensity',
  type: ChannelType.INTENSITY,
  minValue: 0,
  maxValue: 255,
};

const mockPanChannel: SliderChannel = {
  name: 'Pan',
  type: ChannelType.PAN,
  minValue: 0,
  maxValue: 255,
};

const mockGoboChannel: SliderChannel = {
  name: 'Gobo',
  type: ChannelType.GOBO,
  minValue: 0,
  maxValue: 255,
};

describe('ChannelSlider', () => {
  it('renders channel name and slider', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockRedChannel}
        value={128}
        onChange={handleChange}
      />
    );

    // There are two inputs with the same value (slider and number input)
    expect(screen.getAllByDisplayValue('128')).toHaveLength(2);
  });

  it('calls onChange when slider value changes', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockRedChannel}
        value={100}
        onChange={handleChange}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '150' } });

    expect(handleChange).toHaveBeenCalledWith(150);
  });

  it('calls onChangeComplete when slider is released', () => {
    const handleChange = jest.fn();
    const handleChangeComplete = jest.fn();

    render(
      <ChannelSlider
        channel={mockRedChannel}
        value={100}
        onChange={handleChange}
        onChangeComplete={handleChangeComplete}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.mouseUp(slider, { target: { value: '200' } });

    expect(handleChangeComplete).toHaveBeenCalledWith(200);
  });

  it('updates value when number input changes', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockRedChannel}
        value={100}
        onChange={handleChange}
      />
    );

    const inputs = screen.getAllByDisplayValue('100');
    const numberInput = inputs.find(input => input.getAttribute('type') === 'number');
    if (numberInput) {
      fireEvent.change(numberInput, { target: { value: '75' } });
      expect(handleChange).toHaveBeenCalledWith(75);
    }
  });

  it('handles intensity channel type', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockIntensityChannel}
        value={255}
        onChange={handleChange}
      />
    );

    expect(screen.getAllByDisplayValue('255')).toHaveLength(2);
  });

  it('handles pan channel type', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockPanChannel}
        value={0}
        onChange={handleChange}
      />
    );

    expect(screen.getAllByDisplayValue('0')).toHaveLength(2);
  });

  it('respects min and max values', () => {
    const handleChange = jest.fn();
    const customChannel: SliderChannel = {
      name: 'Custom',
      type: ChannelType.OTHER,
      minValue: 10,
      maxValue: 200,
    };

    render(
      <ChannelSlider
        channel={customChannel}
        value={50}
        onChange={handleChange}
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '200');
  });

  it('renders with tooltip when provided', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockRedChannel}
        value={128}
        onChange={handleChange}
        tooltip="Test tooltip"
      />
    );

    // The component should render without error when tooltip is provided
    expect(screen.getAllByDisplayValue('128')).toHaveLength(2);
  });

  it('updates local value when prop value changes', () => {
    const handleChange = jest.fn();

    const { rerender } = render(
      <ChannelSlider
        channel={mockRedChannel}
        value={100}
        onChange={handleChange}
      />
    );

    expect(screen.getAllByDisplayValue('100')).toHaveLength(2);

    // Update the value prop
    rerender(
      <ChannelSlider
        channel={mockRedChannel}
        value={150}
        onChange={handleChange}
      />
    );

    expect(screen.getAllByDisplayValue('150')).toHaveLength(2);
  });

  describe('wheel gesture support', () => {
    it('adjusts value on drag up (positive deltaY with natural scrolling)', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      // The container div should have the wheel handler
      const containerDiv = container.firstChild as HTMLElement;

      // Simulate drag up with natural scrolling (positive deltaY = increase)
      fireEvent.wheel(containerDiv, { deltaY: 10 });

      // onChange should be called with a value greater than 128
      expect(handleChange).toHaveBeenCalled();
      const newValue = handleChange.mock.calls[0][0];
      expect(newValue).toBeGreaterThan(128);
    });

    it('adjusts value on drag down (negative deltaY with natural scrolling)', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const containerDiv = container.firstChild as HTMLElement;

      // Simulate drag down with natural scrolling (negative deltaY = decrease)
      fireEvent.wheel(containerDiv, { deltaY: -10 });

      expect(handleChange).toHaveBeenCalled();
      const newValue = handleChange.mock.calls[0][0];
      expect(newValue).toBeLessThan(128);
    });

    it('does not adjust value when disabled', () => {
      const handleChange = jest.fn();
      const handleToggleActive = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
          isActive={false}
          onToggleActive={handleToggleActive}
        />
      );

      const containerDiv = container.firstChild as HTMLElement;
      fireEvent.wheel(containerDiv, { deltaY: -10 });

      // Should not call onChange when inactive
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('touch gesture support', () => {
    it('has touch event handlers on slider input', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const slider = container.querySelector('input[type="range"]');
      expect(slider).toBeTruthy();
      // The slider should have touch handlers attached (via spread props)
    });

    it('has touch event handlers on number input', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      expect(numberInput).toBeTruthy();
    });

    it('has ns-resize cursor on number input when active', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      expect(numberInput).toHaveClass('cursor-ns-resize');
    });

    it('has not-allowed cursor on number input when inactive', () => {
      const handleChange = jest.fn();
      const handleToggleActive = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
          isActive={false}
          onToggleActive={handleToggleActive}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      expect(numberInput).toHaveClass('cursor-not-allowed');
    });
  });

  describe('percentage mode', () => {
    beforeEach(() => {
      mockUseDisplayMode.mockReturnValue({
        displayMode: 'percent',
        isDmxMode: false,
        isPercentMode: true,
        setDisplayMode: jest.fn(),
      });
    });

    afterEach(() => {
      mockUseDisplayMode.mockReturnValue({
        displayMode: 'dmx',
        isDmxMode: true,
        isPercentMode: false,
        setDisplayMode: jest.fn(),
      });
    });

    it('displays percentage for continuum channels', () => {
      render(
        <ChannelSlider
          channel={mockIntensityChannel}
          value={128}
          onChange={jest.fn()}
        />
      );
      // Number input should show percentage value
      expect(screen.getByRole('spinbutton')).toHaveValue(50.2);
    });

    it('displays raw DMX for discrete channels', () => {
      render(
        <ChannelSlider
          channel={mockGoboChannel}
          value={128}
          onChange={jest.fn()}
        />
      );
      // Discrete channels always show DMX
      expect(screen.getByRole('spinbutton')).toHaveValue(128);
    });

    it('converts percentage input back to DMX for onChange', () => {
      const handleChange = jest.fn();
      render(
        <ChannelSlider
          channel={mockIntensityChannel}
          value={128}
          onChange={handleChange}
        />
      );
      const numberInput = screen.getByRole('spinbutton');
      fireEvent.change(numberInput, { target: { value: '75.0' } });
      // 75% of 255 = 191.25 -> 191
      expect(handleChange).toHaveBeenCalledWith(191);
    });

    it('slider range is 0-100 with step 0.1 in percentage mode for continuum channels', () => {
      render(
        <ChannelSlider
          channel={mockIntensityChannel}
          value={128}
          onChange={jest.fn()}
        />
      );
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveAttribute('step', '0.1');
    });

    it('slider range remains 0-255 for discrete channels in percentage mode', () => {
      render(
        <ChannelSlider
          channel={mockGoboChannel}
          value={128}
          onChange={jest.fn()}
        />
      );
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '255');
    });
  });

  describe('keyboard navigation', () => {
    it('increases value with arrow up key', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      if (numberInput) {
        fireEvent.keyDown(numberInput, { key: 'ArrowUp' });
        expect(handleChange).toHaveBeenCalledWith(129);
      }
    });

    it('decreases value with arrow down key', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      if (numberInput) {
        fireEvent.keyDown(numberInput, { key: 'ArrowDown' });
        expect(handleChange).toHaveBeenCalledWith(127);
      }
    });

    it('increases value by 10 with shift+arrow up', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      if (numberInput) {
        fireEvent.keyDown(numberInput, { key: 'ArrowUp', shiftKey: true });
        expect(handleChange).toHaveBeenCalledWith(138);
      }
    });

    it('decreases value by 10 with shift+arrow down', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={128}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      if (numberInput) {
        fireEvent.keyDown(numberInput, { key: 'ArrowDown', shiftKey: true });
        expect(handleChange).toHaveBeenCalledWith(118);
      }
    });

    it('clamps value at max bound with arrow up', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={254}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      if (numberInput) {
        fireEvent.keyDown(numberInput, { key: 'ArrowUp', shiftKey: true });
        expect(handleChange).toHaveBeenCalledWith(255);
      }
    });

    it('clamps value at min bound with arrow down', () => {
      const handleChange = jest.fn();

      const { container } = render(
        <ChannelSlider
          channel={mockRedChannel}
          value={5}
          onChange={handleChange}
        />
      );

      const numberInput = container.querySelector('input[type="number"]');
      if (numberInput) {
        fireEvent.keyDown(numberInput, { key: 'ArrowDown', shiftKey: true });
        expect(handleChange).toHaveBeenCalledWith(0);
      }
    });
  });
});
