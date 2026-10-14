import { fireEvent, render, screen } from '@testing-library/react';
import OFLManagement from '../OFLManagement';

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: () => ({ data: undefined, loading: false, refetch: jest.fn() }),
    useSubscription: () => ({ data: undefined }),
    useMutation: () => [jest.fn(), { loading: false }],
    useApolloClient: () => ({ query: jest.fn() }),
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

  it('offers a fixture library export without a project', () => {
    render(<OFLManagement />);
    const button = screen.getByRole('button', { name: 'Export' });
    fireEvent.click(button);
    expect(screen.getByRole('menuitem', { name: 'More import/export options…' })).toHaveAttribute(
      'href',
      '/import-export?section=data&table=FIXTURE_LIBRARY',
    );
    expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeEnabled();
  });
});
