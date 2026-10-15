import { render, screen } from '@testing-library/react';
import FixtureSourceBadge from '../FixtureSourceBadge';
import { FixtureSource } from '@/types';

describe('FixtureSourceBadge', () => {
  it.each([
    [FixtureSource.BUILTIN, 'Built-in'],
    [FixtureSource.OFL, 'OFL'],
    [FixtureSource.GDTF, 'GDTF'],
    [FixtureSource.EOS, 'Eos library'],
    [FixtureSource.USER, 'Custom'],
    [FixtureSource.SYNTHESIZED, 'Eos ASCII'],
  ])('renders %s as the text "%s"', (source, label) => {
    render(<FixtureSourceBadge source={source} />);
    const badge = screen.getByTestId('fixture-source-badge');
    expect(badge).toHaveTextContent(`Source: ${label}`);
    expect(badge).toHaveAttribute('data-source', source);
  });

  it('has a visually hidden "Source:" prefix for screen readers', () => {
    render(<FixtureSourceBadge source={FixtureSource.OFL} />);
    expect(screen.getByText('Source:')).toHaveClass('sr-only');
  });

  it('can omit the screen-reader prefix', () => {
    render(<FixtureSourceBadge source={FixtureSource.OFL} srPrefix={false} />);
    expect(screen.getByTestId('fixture-source-badge')).toHaveTextContent(/^OFL$/);
  });

  it('describes the source in the tooltip, with the version when known', () => {
    const { rerender } = render(<FixtureSourceBadge source={FixtureSource.OFL} />);
    expect(screen.getByTestId('fixture-source-badge')).toHaveAttribute(
      'title',
      'Imported from the Open Fixture Library',
    );
    rerender(<FixtureSourceBadge source={FixtureSource.OFL} sourceVersion="2024-05" />);
    expect(screen.getByTestId('fixture-source-badge')).toHaveAttribute(
      'title',
      'Imported from the Open Fixture Library (version 2024-05)',
    );
  });

  it('includes dark-mode classes', () => {
    render(<FixtureSourceBadge source={FixtureSource.USER} className="extra" />);
    const badge = screen.getByTestId('fixture-source-badge');
    expect(badge.className).toMatch(/dark:bg-/);
    expect(badge).toHaveClass('extra');
  });

  it('renders nothing without a source (older backends)', () => {
    const { container } = render(<FixtureSourceBadge source={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows unknown sources as text', () => {
    render(<FixtureSourceBadge source="MVR" />);
    expect(screen.getByTestId('fixture-source-badge')).toHaveTextContent('Source: MVR');
  });
});
