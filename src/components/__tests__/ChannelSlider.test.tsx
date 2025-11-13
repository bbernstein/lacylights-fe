import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChannelSlider, { SliderChannel } from '../ChannelSlider';
import { ChannelType } from '@/types';

const mockRedChannel: SliderChannel = {
  name: 'Red',
  type: ChannelType.RED,
  minValue: 0,
  maxValue: 255,
};

const mockDimmerChannel: SliderChannel = {
  name: 'Dimmer',
  type: ChannelType.DIMMER,
  minValue: 0,
  maxValue: 255,
};

const mockPanChannel: SliderChannel = {
  name: 'Pan',
  type: ChannelType.PAN,
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

  it('handles dimmer channel type', () => {
    const handleChange = jest.fn();

    render(
      <ChannelSlider
        channel={mockDimmerChannel}
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
});
