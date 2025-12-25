import { render, screen, fireEvent } from '@testing-library/react';
import { APModeInstructions } from '../APModeInstructions';
import { APConfig } from '@/types';

describe('APModeInstructions', () => {
  const mockAPConfig: APConfig = {
    ssid: 'lacylights-1234',
    ipAddress: '10.42.0.1',
    channel: 6,
    clientCount: 2,
    timeoutMinutes: 30,
    minutesRemaining: 25,
  };

  describe('rendering', () => {
    it('renders setup mode title', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(screen.getByText('Setup Mode Active')).toBeInTheDocument();
    });

    it('renders setup description', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(
        screen.getByText(/Your LacyLights device is running in hotspot mode/)
      ).toBeInTheDocument();
    });

    it('renders SSID in instructions', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(screen.getByText('lacylights-1234')).toBeInTheDocument();
    });

    it('renders IP address', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(screen.getByText('10.42.0.1')).toBeInTheDocument();
    });

    it('renders channel', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('renders minutes remaining when available', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(screen.getByText('25 minutes')).toBeInTheDocument();
    });

    it('renders step numbers', () => {
      render(<APModeInstructions apConfig={mockAPConfig} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('timeout warning', () => {
    it('does not show extend time when minutes remaining > 10', () => {
      render(
        <APModeInstructions apConfig={mockAPConfig} onResetTimeout={jest.fn()} />
      );

      expect(screen.queryByText('Extend Time')).not.toBeInTheDocument();
    });

    it('shows extend time button when minutes remaining < 10', () => {
      const lowTimeConfig = { ...mockAPConfig, minutesRemaining: 5 };
      render(
        <APModeInstructions apConfig={lowTimeConfig} onResetTimeout={jest.fn()} />
      );

      expect(screen.getByText('Extend Time')).toBeInTheDocument();
    });

    it('shows warning message when minutes remaining < 10', () => {
      const lowTimeConfig = { ...mockAPConfig, minutesRemaining: 5 };
      render(
        <APModeInstructions apConfig={lowTimeConfig} onResetTimeout={jest.fn()} />
      );

      expect(
        screen.getByText('Hotspot will turn off in 5 minutes')
      ).toBeInTheDocument();
    });

    it('does not show extend button without onResetTimeout callback', () => {
      const lowTimeConfig = { ...mockAPConfig, minutesRemaining: 5 };
      render(<APModeInstructions apConfig={lowTimeConfig} />);

      expect(screen.queryByText('Extend Time')).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onResetTimeout when extend time is clicked', () => {
      const onResetTimeout = jest.fn();
      const lowTimeConfig = { ...mockAPConfig, minutesRemaining: 5 };
      render(
        <APModeInstructions apConfig={lowTimeConfig} onResetTimeout={onResetTimeout} />
      );

      fireEvent.click(screen.getByText('Extend Time'));

      expect(onResetTimeout).toHaveBeenCalledTimes(1);
    });

    it('disables button while resetting', () => {
      const lowTimeConfig = { ...mockAPConfig, minutesRemaining: 5 };
      render(
        <APModeInstructions
          apConfig={lowTimeConfig}
          onResetTimeout={jest.fn()}
          resettingTimeout={true}
        />
      );

      expect(screen.getByText('Resetting...')).toBeDisabled();
    });

    it('shows "Resetting..." while resetting', () => {
      const lowTimeConfig = { ...mockAPConfig, minutesRemaining: 5 };
      render(
        <APModeInstructions
          apConfig={lowTimeConfig}
          onResetTimeout={jest.fn()}
          resettingTimeout={true}
        />
      );

      expect(screen.getByText('Resetting...')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has amber warning styling', () => {
      const { container } = render(<APModeInstructions apConfig={mockAPConfig} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-amber-50');
      expect(wrapper).toHaveClass('border-amber-200');
    });

    it('has rounded border', () => {
      const { container } = render(<APModeInstructions apConfig={mockAPConfig} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('rounded-lg');
    });
  });

  describe('edge cases', () => {
    it('handles undefined minutesRemaining', () => {
      const noTimeConfig = { ...mockAPConfig, minutesRemaining: undefined };
      render(<APModeInstructions apConfig={noTimeConfig} />);

      expect(screen.queryByText(/minutes$/)).not.toBeInTheDocument();
    });

    it('handles zero minutesRemaining', () => {
      const zeroTimeConfig = { ...mockAPConfig, minutesRemaining: 0 };
      render(
        <APModeInstructions apConfig={zeroTimeConfig} onResetTimeout={jest.fn()} />
      );

      expect(screen.getByText('Extend Time')).toBeInTheDocument();
    });
  });
});
