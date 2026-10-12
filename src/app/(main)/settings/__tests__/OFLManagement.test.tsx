import { render, screen } from '@testing-library/react';
import OFLManagement from '../OFLManagement';

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: () => ({ data: undefined, loading: false, refetch: jest.fn() }),
    useSubscription: () => ({ data: undefined }),
    useMutation: () => [jest.fn(), { loading: false }],
  };
});

describe('OFLManagement', () => {
  it('links to the Import / Export page', () => {
    render(<OFLManagement />);
    expect(screen.getByText('Open Fixture Library')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export',
    );
  });
});
