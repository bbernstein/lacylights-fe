import { render, screen } from '@testing-library/react';
import { SecurityBadge } from '../SecurityBadge';
import { WiFiSecurityType } from '@/types';

describe('SecurityBadge', () => {
  describe('rendering different security types', () => {
    it('renders OPEN security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.OPEN} />);

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByTitle('Security: Open')).toBeInTheDocument();
    });

    it('renders WEP security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.WEP} />);

      expect(screen.getByText('WEP')).toBeInTheDocument();
      expect(screen.getByTitle('Security: WEP')).toBeInTheDocument();
    });

    it('renders WPA_PSK security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} />);

      expect(screen.getByText('WPA2')).toBeInTheDocument();
      expect(screen.getByTitle('Security: WPA2')).toBeInTheDocument();
    });

    it('renders WPA_EAP security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.WPA_EAP} />);

      expect(screen.getByText('WPA2 Enterprise')).toBeInTheDocument();
      expect(screen.getByTitle('Security: WPA2 Enterprise')).toBeInTheDocument();
    });

    it('renders WPA3_PSK security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.WPA3_PSK} />);

      expect(screen.getByText('WPA3')).toBeInTheDocument();
      expect(screen.getByTitle('Security: WPA3')).toBeInTheDocument();
    });

    it('renders WPA3_EAP security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.WPA3_EAP} />);

      expect(screen.getByText('WPA3 Enterprise')).toBeInTheDocument();
      expect(screen.getByTitle('Security: WPA3 Enterprise')).toBeInTheDocument();
    });

    it('renders OWE security type correctly', () => {
      render(<SecurityBadge type={WiFiSecurityType.OWE} />);

      expect(screen.getByText('OWE')).toBeInTheDocument();
      expect(screen.getByTitle('Security: OWE')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies yellow color classes for OPEN security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.OPEN} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-yellow-600', 'dark:text-yellow-400');
    });

    it('applies orange color classes for WEP security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WEP} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-orange-600', 'dark:text-orange-400');
    });

    it('applies green color classes for WPA_PSK security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('applies blue color classes for WPA_EAP security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_EAP} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('applies blue color classes for WPA3_PSK security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA3_PSK} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('applies blue color classes for WPA3_EAP security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA3_EAP} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('applies purple color classes for OWE security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.OWE} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-purple-600', 'dark:text-purple-400');
    });

    it('applies custom className when provided', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} className="custom-class" />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-class');
    });

    it('applies base styling classes', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} />);

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1', 'px-2', 'py-0.5', 'rounded', 'text-xs', 'font-medium');
    });
  });

  describe('icon rendering', () => {
    it('renders an icon for OPEN security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.OPEN} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-3', 'h-3');
    });

    it('renders an icon for WEP security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WEP} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders an icon for WPA_PSK security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders an icon for WPA_EAP security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_EAP} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders an icon for WPA3_PSK security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA3_PSK} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders an icon for WPA3_EAP security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA3_EAP} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders an icon for OWE security', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.OWE} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('provides title attribute for screen readers', () => {
      render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} />);

      expect(screen.getByTitle('Security: WPA2')).toBeInTheDocument();
    });

    it('renders semantic HTML', () => {
      const { container } = render(<SecurityBadge type={WiFiSecurityType.WPA_PSK} />);

      const badge = container.querySelector('span');
      expect(badge?.tagName).toBe('SPAN');
    });
  });
});
