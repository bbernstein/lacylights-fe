import { render, screen } from '@testing-library/react';
import { WiFiModeIndicator } from '../WiFiModeIndicator';
import { WiFiMode } from '@/types';

describe('WiFiModeIndicator', () => {
  describe('CLIENT mode', () => {
    it('renders client mode correctly', () => {
      render(<WiFiModeIndicator mode={WiFiMode.CLIENT} />);

      expect(screen.getByText('Client Mode')).toBeInTheDocument();
    });

    it('shows connected SSID when provided', () => {
      render(<WiFiModeIndicator mode={WiFiMode.CLIENT} ssid="MyNetwork" />);

      expect(screen.getByText('Connected to MyNetwork')).toBeInTheDocument();
    });

    it('has green styling for client mode', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.CLIENT} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('bg-green-100');
    });

    it('has proper accessibility attributes', () => {
      render(<WiFiModeIndicator mode={WiFiMode.CLIENT} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Client Mode');
    });
  });

  describe('AP mode', () => {
    it('renders AP mode correctly', () => {
      render(<WiFiModeIndicator mode={WiFiMode.AP} />);

      expect(screen.getByText('Hotspot Mode (0 connected)')).toBeInTheDocument();
    });

    it('shows client count when provided', () => {
      render(<WiFiModeIndicator mode={WiFiMode.AP} clientCount={3} />);

      expect(screen.getByText('Hotspot Mode (3 connected)')).toBeInTheDocument();
    });

    it('has amber styling for AP mode', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.AP} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('bg-amber-100');
    });
  });

  describe('STARTING_AP mode', () => {
    it('renders starting AP mode correctly', () => {
      render(<WiFiModeIndicator mode={WiFiMode.STARTING_AP} />);

      expect(screen.getByText('Starting Hotspot...')).toBeInTheDocument();
    });

    it('has amber styling with pulse animation', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.STARTING_AP} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('bg-amber-100');

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-pulse');
    });
  });

  describe('CONNECTING mode', () => {
    it('renders connecting mode correctly', () => {
      render(<WiFiModeIndicator mode={WiFiMode.CONNECTING} />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('has blue styling with pulse animation', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.CONNECTING} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('bg-blue-100');

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-pulse');
    });
  });

  describe('DISABLED mode', () => {
    it('renders disabled mode correctly', () => {
      render(<WiFiModeIndicator mode={WiFiMode.DISABLED} />);

      expect(screen.getByText('WiFi Disabled')).toBeInTheDocument();
    });

    it('has gray styling for disabled mode', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.DISABLED} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('bg-gray-100');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <WiFiModeIndicator mode={WiFiMode.CLIENT} className="custom-class" />
      );

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('custom-class');
    });

    it('has rounded-full styling', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.CLIENT} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('rounded-full');
    });

    it('has correct flex styling', () => {
      const { container } = render(<WiFiModeIndicator mode={WiFiMode.CLIENT} />);

      const indicator = container.firstChild;
      expect(indicator).toHaveClass('inline-flex');
      expect(indicator).toHaveClass('items-center');
    });
  });
});
