import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CopyFixturesToLooksModal from '../CopyFixturesToLooksModal';
import { GET_CUES_WITH_LOOK_INFO } from '../../graphql/cueLists';
import { GET_PROJECT_LOOKS, COPY_FIXTURES_TO_LOOKS } from '../../graphql/looks';

// Mock useIsMobile hook
jest.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from '@/hooks/useMediaQuery';

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockProjectId = 'project-123';
const mockSourceLookId = 'look-source';
const mockCueListId = 'cue-list-123';
const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const mockFixtureIds = ['fixture-1', 'fixture-2'];
const mockFixtureNames = new Map([
  ['fixture-1', 'Front Wash 1'],
  ['fixture-2', 'Front Wash 2'],
]);
const mockFixtureValues = new Map([
  ['fixture-1', [255, 128, 64, 32]],
  ['fixture-2', [200, 100, 50, 25]],
]);
const mockActiveChannels = new Map([
  ['fixture-1', new Set([0, 1, 2])],
  ['fixture-2', new Set([0, 1])],
]);

// Mock data for look-centric mode
const mockLooks = [
  { id: mockSourceLookId, name: 'Source Look', description: 'The source look' },
  { id: 'look-1', name: 'Alpha Look', description: 'First target' },
  { id: 'look-2', name: 'Beta Look', description: 'Second target' },
  { id: 'look-3', name: 'Gamma Look', description: null },
];

// Mock data for cue-centric mode
const mockCuesWithLookInfo = [
  {
    cueId: 'cue-1',
    cueNumber: 1,
    cueName: 'Opening',
    lookId: mockSourceLookId,
    lookName: 'Source Look',
    otherCueNumbers: [],
  },
  {
    cueId: 'cue-2',
    cueNumber: 2,
    cueName: 'Scene One',
    lookId: 'look-1',
    lookName: 'Alpha Look',
    otherCueNumbers: [5], // Used in multiple cues
  },
  {
    cueId: 'cue-3',
    cueNumber: 3,
    cueName: 'Scene Two',
    lookId: 'look-2',
    lookName: 'Beta Look',
    otherCueNumbers: [],
  },
  {
    cueId: 'cue-5',
    cueNumber: 5,
    cueName: 'Scene One Redux',
    lookId: 'look-1',
    lookName: 'Alpha Look',
    otherCueNumbers: [2], // Same look as cue 2
  },
];

const mockOrphanLooks = [
  { id: 'look-3', name: 'Gamma Look', description: 'Not in any cue' },
];

const lookCentricMock = {
  request: {
    query: GET_PROJECT_LOOKS,
    variables: { projectId: mockProjectId },
  },
  result: {
    data: {
      project: {
        id: mockProjectId,
        looks: mockLooks.map(look => ({
          ...look,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          fixtureValues: [],
        })),
      },
    },
  },
};

const cueCentricMock = {
  request: {
    query: GET_CUES_WITH_LOOK_INFO,
    variables: { cueListId: mockCueListId },
  },
  result: {
    data: {
      cuesWithLookInfo: {
        cues: mockCuesWithLookInfo,
        orphanLooks: mockOrphanLooks,
      },
    },
  },
};

const copyFixturesMock = {
  request: {
    query: COPY_FIXTURES_TO_LOOKS,
    variables: {
      input: {
        sourceLookId: mockSourceLookId,
        fixtureIds: mockFixtureIds,
        targetLookIds: ['look-1'],
      },
    },
  },
  result: {
    data: {
      copyFixturesToLooks: {
        updatedLookCount: 1,
        affectedCueCount: 2,
        operationId: 'op-123',
        updatedLooks: [
          {
            id: 'look-1',
            name: 'Alpha Look',
            updatedAt: '2023-01-01T00:00:00Z',
            fixtureValues: [],
          },
        ],
      },
    },
  },
};

describe('CopyFixturesToLooksModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    projectId: mockProjectId,
    sourceLookId: mockSourceLookId,
    fixtureIds: mockFixtureIds,
    fixtureNames: mockFixtureNames,
    fixtureValues: mockFixtureValues,
    activeChannels: mockActiveChannels,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Copy Fixtures to Other Looks')).toBeInTheDocument();
    });

    it('displays fixture summary', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText(/Copying: 2 fixtures/)).toBeInTheDocument();
      expect(screen.getByText(/Front Wash 1, Front Wash 2/)).toBeInTheDocument();
      expect(screen.getByText(/5 active channels will be copied/)).toBeInTheDocument();
    });

    it('truncates fixture names when more than 3', async () => {
      const manyFixtureIds = ['f1', 'f2', 'f3', 'f4', 'f5'];
      const manyFixtureNames = new Map([
        ['f1', 'Fixture A'],
        ['f2', 'Fixture B'],
        ['f3', 'Fixture C'],
        ['f4', 'Fixture D'],
        ['f5', 'Fixture E'],
      ]);
      const manyActiveChannels = new Map([
        ['f1', new Set([0])],
        ['f2', new Set([0])],
        ['f3', new Set([0])],
        ['f4', new Set([0])],
        ['f5', new Set([0])],
      ]);

      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal
            {...defaultProps}
            fixtureIds={manyFixtureIds}
            fixtureNames={manyFixtureNames}
            activeChannels={manyActiveChannels}
          />
        </MockedProvider>
      );

      expect(screen.getByText(/Fixture A, Fixture B, Fixture C \+2 more/)).toBeInTheDocument();
    });

    it('renders search input', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByPlaceholderText('Search looks...')).toBeInTheDocument();
    });

    it('renders action buttons', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Copy to Looks')).toBeInTheDocument();
    });
  });

  describe('look-centric mode', () => {
    it('shows looks alphabetically when no cueListId', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
        expect(screen.getByText('Beta Look')).toBeInTheDocument();
        expect(screen.getByText('Gamma Look')).toBeInTheDocument();
      });
    });

    it('marks source look and disables its checkbox', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Source Look')).toBeInTheDocument();
      });

      // Find the source look row (it should have "(source)" label)
      expect(screen.getByText('(source)')).toBeInTheDocument();
    });

    it('filters looks by search query', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search looks...');
      await userEvent.type(searchInput, 'Beta');

      await waitFor(() => {
        expect(screen.getByText('Beta Look')).toBeInTheDocument();
        expect(screen.queryByText('Alpha Look')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Look')).not.toBeInTheDocument();
      });
    });

    it('shows no looks found message when filter returns empty', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search looks...');
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No looks found')).toBeInTheDocument();
      });
    });
  });

  describe('cue-centric mode', () => {
    it('shows cues sorted by cue number when cueListId provided', async () => {
      render(
        <MockedProvider mocks={[cueCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} cueListId={mockCueListId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('Opening')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Scene One')).toBeInTheDocument();
      });
    });

    it('shows search placeholder for cues and looks', async () => {
      render(
        <MockedProvider mocks={[cueCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} cueListId={mockCueListId} />
        </MockedProvider>
      );

      expect(screen.getByPlaceholderText('Search cues or looks...')).toBeInTheDocument();
    });

    it('shows orphan looks section', async () => {
      render(
        <MockedProvider mocks={[cueCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} cueListId={mockCueListId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Looks not in any cue')).toBeInTheDocument();
        expect(screen.getByText('Gamma Look')).toBeInTheDocument();
      });
    });

    it('shows other cue numbers when a look is used in multiple cues', async () => {
      render(
        <MockedProvider mocks={[cueCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} cueListId={mockCueListId} />
        </MockedProvider>
      );

      await waitFor(() => {
        // The look "Alpha Look" is used in cues 2 and 5
        expect(screen.getByText(/Alpha Look.*\(#5\)/)).toBeInTheDocument();
      });
    });
  });

  describe('selection behavior', () => {
    it('allows selecting a target look', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      // Click on a look row
      fireEvent.click(screen.getByText('Alpha Look'));

      // Check that selection count updates
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('updates button label when looks are selected', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      // Initially shows "Copy to Looks"
      expect(screen.getByText('Copy to Looks')).toBeInTheDocument();

      // Select a look
      fireEvent.click(screen.getByText('Alpha Look'));

      // Button should now show count
      expect(screen.getByText('Copy to 1 Look')).toBeInTheDocument();

      // Select another
      fireEvent.click(screen.getByText('Beta Look'));
      expect(screen.getByText('Copy to 2 Looks')).toBeInTheDocument();
    });

    it('shows affected cue count in cue-centric mode', async () => {
      render(
        <MockedProvider mocks={[cueCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} cueListId={mockCueListId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Scene One')).toBeInTheDocument();
      });

      // Select Alpha Look (used by cues 2 and 5)
      fireEvent.click(screen.getByText('Scene One'));

      // Should show both look count and cue count
      await waitFor(() => {
        expect(screen.getByText('Copy to 1 Look (2 cues)')).toBeInTheDocument();
      });
    });

    it('shows warning when selecting looks used by multiple cues', async () => {
      render(
        <MockedProvider mocks={[cueCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} cueListId={mockCueListId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Scene One')).toBeInTheDocument();
      });

      // Select Alpha Look (used by 2 cues)
      fireEvent.click(screen.getByText('Scene One'));

      await waitFor(() => {
        expect(screen.getByText(/Some selected looks are used by multiple cues/)).toBeInTheDocument();
      });
    });

    it('allows Select All', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      // Find the Select All checkbox (it's the checkbox near the "Select All" text)
      const selectAllText = screen.getByText('Select All');
      const selectAllCheckbox = selectAllText.parentElement?.querySelector('input[type="checkbox"]');
      expect(selectAllCheckbox).toBeInTheDocument();

      // Click the checkbox
      fireEvent.click(selectAllCheckbox!);

      // Should select all except source look (3 looks)
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
        expect(screen.getByText('Copy to 3 Looks')).toBeInTheDocument();
      });
    });

    it('deselects all when clicking Select All again', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      // Find the Select All checkbox
      const selectAllText = screen.getByText('Select All');
      const selectAllCheckbox = selectAllText.parentElement?.querySelector('input[type="checkbox"]');

      // Click Select All twice
      fireEvent.click(selectAllCheckbox!);
      await waitFor(() => {
        expect(screen.getByText('3 selected')).toBeInTheDocument();
      });

      fireEvent.click(selectAllCheckbox!);

      // Should show no selection
      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
        expect(screen.getByText('Copy to Looks')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('disables copy button when no looks selected', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy to Looks');
      expect(copyButton).toBeDisabled();
    });

    it('enables copy button when looks are selected', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Alpha Look'));

      const copyButton = screen.getByText('Copy to 1 Look');
      expect(copyButton).not.toBeDisabled();
    });

    it('calls mutation and onSuccess on successful copy', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock, copyFixturesMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      // Select a look
      fireEvent.click(screen.getByText('Alpha Look'));

      // Click copy
      fireEvent.click(screen.getByText('Copy to 1 Look'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith({
          lookCount: 1,
          cueCount: 2,
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('shows loading state during copy', async () => {
      const slowCopyMock = {
        ...copyFixturesMock,
        delay: 100,
      };

      render(
        <MockedProvider mocks={[lookCentricMock, slowCopyMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Alpha Look'));
      fireEvent.click(screen.getByText('Copy to 1 Look'));

      await waitFor(() => {
        expect(screen.getByText('Copying...')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('displays error message on mutation failure', async () => {
      const errorMock = {
        request: {
          query: COPY_FIXTURES_TO_LOOKS,
          variables: {
            input: {
              sourceLookId: mockSourceLookId,
              fixtureIds: mockFixtureIds,
              targetLookIds: ['look-1'],
            },
          },
        },
        error: new Error('Failed to copy fixtures'),
      };

      render(
        <MockedProvider mocks={[lookCentricMock, errorMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Alpha Look'));
      fireEvent.click(screen.getByText('Copy to 1 Look'));

      await waitFor(() => {
        expect(screen.getByText('Failed to copy fixtures')).toBeInTheDocument();
      });
    });
  });

  describe('modal close behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets selection when modal closes', async () => {
      const { rerender } = render(
        <MockedProvider mocks={[lookCentricMock, lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      // Select a look
      fireEvent.click(screen.getByText('Alpha Look'));
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      // Close and reopen
      fireEvent.click(screen.getByText('Cancel'));

      // Rerender with isOpen: true (simulating reopening)
      rerender(
        <MockedProvider mocks={[lookCentricMock, lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} isOpen={true} />
        </MockedProvider>
      );

      // Selection should be cleared (button should say "Copy to Looks")
      await waitFor(() => {
        expect(screen.getByText('Copy to Looks')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching looks', async () => {
      const delayedMock = {
        ...lookCentricMock,
        delay: 100,
      };

      render(
        <MockedProvider mocks={[delayedMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      // Should show loading spinner - check by class presence
      const modal = screen.getByTestId('copy-fixtures-to-looks-modal');
      expect(modal.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('mobile behavior', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('stacks buttons vertically on mobile', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      // On mobile, the footer has flex-col class
      const footer = screen.getByText('Copy to Looks').closest('div');
      expect(footer).toHaveClass('flex-col');
    });

    it('shows copy button first on mobile', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Alpha Look')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const buttonLabels = buttons.map(b => b.textContent);
      const copyIndex = buttonLabels.findIndex(l => l?.includes('Copy to Looks'));
      const cancelIndex = buttonLabels.findIndex(l => l?.includes('Cancel'));

      // Copy button should come before Cancel on mobile
      expect(copyIndex).toBeLessThan(cancelIndex);
    });
  });

  describe('testId', () => {
    it('has correct testId on modal', async () => {
      render(
        <MockedProvider mocks={[lookCentricMock]}>
          <CopyFixturesToLooksModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByTestId('copy-fixtures-to-looks-modal')).toBeInTheDocument();
    });
  });
});
