import { render, screen } from '@testing-library/react';
import { APClientList } from '../APClientList';
import { APClient } from '@/types';

describe('APClientList', () => {
  const mockClients: APClient[] = [
    {
      macAddress: 'AA:BB:CC:DD:EE:01',
      ipAddress: '10.42.0.100',
      hostname: 'iPhone',
      connectedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    },
    {
      macAddress: 'AA:BB:CC:DD:EE:02',
      ipAddress: '10.42.0.101',
      hostname: 'MacBook',
      connectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    },
  ];

  describe('empty state', () => {
    it('renders empty state when no clients', () => {
      render(<APClientList clients={[]} />);

      expect(screen.getByText('No devices connected yet')).toBeInTheDocument();
    });

    it('renders helpful message in empty state', () => {
      render(<APClientList clients={[]} />);

      expect(
        screen.getByText(/Connect your phone or laptop to the hotspot/)
      ).toBeInTheDocument();
    });

    it('renders users icon in empty state', () => {
      const { container } = render(<APClientList clients={[]} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-12');
    });
  });

  describe('with clients', () => {
    it('renders client count in header', () => {
      render(<APClientList clients={mockClients} />);

      expect(screen.getByText('Connected Devices (2)')).toBeInTheDocument();
    });

    it('renders client hostnames', () => {
      render(<APClientList clients={mockClients} />);

      expect(screen.getByText('iPhone')).toBeInTheDocument();
      expect(screen.getByText('MacBook')).toBeInTheDocument();
    });

    it('renders client IP addresses', () => {
      render(<APClientList clients={mockClients} />);

      expect(screen.getByText('10.42.0.100')).toBeInTheDocument();
      expect(screen.getByText('10.42.0.101')).toBeInTheDocument();
    });

    it('renders client MAC addresses', () => {
      render(<APClientList clients={mockClients} />);

      expect(screen.getByText('AA:BB:CC:DD:EE:01')).toBeInTheDocument();
      expect(screen.getByText('AA:BB:CC:DD:EE:02')).toBeInTheDocument();
    });

    it('shows relative connection time', () => {
      render(<APClientList clients={mockClients} />);

      expect(screen.getByText('2m ago')).toBeInTheDocument();
    });

    it('shows "Unknown Device" for missing hostname', () => {
      const clientWithNoHostname: APClient[] = [
        {
          macAddress: 'AA:BB:CC:DD:EE:03',
          ipAddress: '10.42.0.102',
          hostname: '',
          connectedAt: new Date().toISOString(),
        },
      ];
      render(<APClientList clients={clientWithNoHostname} />);

      expect(screen.getByText('Unknown Device')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('shows "Just now" for very recent connections', () => {
      const recentClient: APClient[] = [
        {
          macAddress: 'AA:BB:CC:DD:EE:04',
          ipAddress: '10.42.0.103',
          hostname: 'RecentDevice',
          connectedAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
        },
      ];
      render(<APClientList clients={recentClient} />);

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('shows minutes for connections less than an hour ago', () => {
      render(<APClientList clients={mockClients} />);

      expect(screen.getByText('2m ago')).toBeInTheDocument();
    });

    it('shows hours for connections less than a day ago', () => {
      const hourAgoClient: APClient[] = [
        {
          macAddress: 'AA:BB:CC:DD:EE:05',
          ipAddress: '10.42.0.104',
          hostname: 'HourDevice',
          connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
      ];
      render(<APClientList clients={hourAgoClient} />);

      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });

    it('shows date for connections more than a day ago', () => {
      const oldClient: APClient[] = [
        {
          macAddress: 'AA:BB:CC:DD:EE:06',
          ipAddress: '10.42.0.105',
          hostname: 'OldDevice',
          connectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
      ];
      render(<APClientList clients={oldClient} />);

      // Should show a date format instead of relative time
      expect(screen.queryByText(/ago$/)).not.toBeInTheDocument();
    });

    it('handles invalid date gracefully', () => {
      const invalidClient: APClient[] = [
        {
          macAddress: 'AA:BB:CC:DD:EE:07',
          ipAddress: '10.42.0.106',
          hostname: 'InvalidDevice',
          connectedAt: 'not-a-date',
        },
      ];
      render(<APClientList clients={invalidClient} />);

      // Invalid Date objects result in NaN from getTime(), which causes
      // the catch block to return "Unknown" or the date calculation to fail
      // Either "Unknown" or "Invalid Date" is acceptable behavior
      const timeDisplay = screen.getByText(/Invalid Date|Unknown/);
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <APClientList clients={mockClients} className="custom-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('applies custom className to empty state', () => {
      const { container } = render(
        <APClientList clients={[]} className="custom-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('has correct item styling', () => {
      const { container } = render(<APClientList clients={mockClients} />);

      const items = container.querySelectorAll('.rounded-lg');
      expect(items.length).toBeGreaterThan(0);
    });

    it('has green indicator for connected clients', () => {
      const { container } = render(<APClientList clients={mockClients} />);

      const indicators = container.querySelectorAll('.bg-green-100');
      expect(indicators.length).toBe(mockClients.length);
    });
  });

  describe('single client', () => {
    it('renders header correctly for single client', () => {
      const singleClient: APClient[] = [mockClients[0]];
      render(<APClientList clients={singleClient} />);

      expect(screen.getByText('Connected Devices (1)')).toBeInTheDocument();
    });
  });

  describe('missing optional fields', () => {
    it('handles missing IP address gracefully', () => {
      const noIPClient: APClient[] = [
        {
          macAddress: 'AA:BB:CC:DD:EE:08',
          ipAddress: '',
          hostname: 'NoIPDevice',
          connectedAt: new Date().toISOString(),
        },
      ];
      render(<APClientList clients={noIPClient} />);

      expect(screen.getByText('NoIPDevice')).toBeInTheDocument();
      expect(screen.getByText('AA:BB:CC:DD:EE:08')).toBeInTheDocument();
    });
  });
});
