import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import VersionManagement from '../VersionManagement';
import {
  GET_SYSTEM_VERSIONS,
  GET_AVAILABLE_VERSIONS,
  UPDATE_REPOSITORY,
  UPDATE_ALL_REPOSITORIES,
} from '@/graphql/versionManagement';

const mockSystemVersionsSupported = {
  versionManagementSupported: true,
  lastChecked: '2025-11-12T12:00:00Z',
  repositories: [
    {
      repository: 'lacylights-fe',
      installed: 'v1.0.0',
      latest: 'v1.1.0',
      updateAvailable: true,
    },
    {
      repository: 'lacylights-node',
      installed: 'v2.0.0',
      latest: 'v2.0.0',
      updateAvailable: false,
    },
    {
      repository: 'lacylights-mcp',
      installed: 'v0.5.0',
      latest: 'v0.6.0',
      updateAvailable: true,
    },
  ],
};

const mockSystemVersionsNotSupported = {
  versionManagementSupported: false,
  lastChecked: '',
  repositories: [],
};

const mockAvailableVersions = ['v1.2.0', 'v1.1.0', 'v1.0.0'];

const mockUpdateRepositorySuccess = {
  repository: 'lacylights-fe',
  success: true,
  message: 'Updated successfully',
  error: '',
  previousVersion: 'v1.0.0',
  newVersion: 'v1.1.0',
};

const mockUpdateRepositoryError = {
  repository: 'lacylights-fe',
  success: false,
  message: '',
  error: 'Update failed',
  previousVersion: 'v1.0.0',
  newVersion: 'v1.0.0',
};

const mockUpdateAllSuccess = [
  {
    repository: 'lacylights-fe',
    success: true,
    message: 'Updated successfully',
    error: '',
    previousVersion: 'v1.0.0',
    newVersion: 'v1.1.0',
  },
  {
    repository: 'lacylights-mcp',
    success: true,
    message: 'Updated successfully',
    error: '',
    previousVersion: 'v0.5.0',
    newVersion: 'v0.6.0',
  },
];

const createMocks = (systemVersions = mockSystemVersionsSupported) => [
  {
    request: {
      query: GET_SYSTEM_VERSIONS,
    },
    result: {
      data: {
        systemVersions,
      },
    },
  },
];

describe('VersionManagement', () => {
  describe('Version management not supported', () => {
    it('shows not available message when version management is not supported', async () => {
      const mocks = createMocks(mockSystemVersionsNotSupported);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Version Management Not Available')).toBeInTheDocument();
      });

      expect(screen.getByText(/This system does not support automated version management/)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading state while fetching data', () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      expect(screen.getByText('Checking for updates...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when query fails', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Error loading version information/)).toBeInTheDocument();
      });
    });
  });

  describe('Repository list', () => {
    it('displays repository versions when supported', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('System Versions')).toBeInTheDocument();
      });

      expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      expect(screen.getByText('lacylights-node')).toBeInTheDocument();
      expect(screen.getByText('lacylights-mcp')).toBeInTheDocument();
    });

    it('shows update available badges for outdated repositories', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('System Versions')).toBeInTheDocument();
      });

      const updateBadges = screen.getAllByText('Update Available');
      expect(updateBadges).toHaveLength(2); // lacylights-fe and lacylights-mcp
    });

    it('displays installed and latest versions', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      });

      expect(screen.getByText('v1.1.0')).toBeInTheDocument();
      expect(screen.getAllByText('v2.0.0')).toHaveLength(2); // Installed and latest are same
    });

    it('displays last checked timestamp', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
      });
    });
  });

  describe('Update All button', () => {
    it('shows "Update All" button when updates are available', async () => {
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update All')).toBeInTheDocument();
      });
    });

    it('does not show "Update All" button when no updates available', async () => {
      const noUpdatesVersions = {
        ...mockSystemVersionsSupported,
        repositories: mockSystemVersionsSupported.repositories.map((repo) => ({
          ...repo,
          updateAvailable: false,
        })),
      };
      const mocks = createMocks(noUpdatesVersions);

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('System Versions')).toBeInTheDocument();
      });

      expect(screen.queryByText('Update All')).not.toBeInTheDocument();
    });

    it('calls updateAllRepositories mutation when clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: UPDATE_ALL_REPOSITORIES,
          },
          result: {
            data: {
              updateAllRepositories: mockUpdateAllSuccess,
            },
          },
        },
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          result: {
            data: {
              systemVersions: mockSystemVersionsSupported,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Update All'));

      await waitFor(() => {
        expect(screen.getByText('Update Results')).toBeInTheDocument();
      });
    });

    it('displays update results after updating all', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: UPDATE_ALL_REPOSITORIES,
          },
          result: {
            data: {
              updateAllRepositories: mockUpdateAllSuccess,
            },
          },
        },
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          result: {
            data: {
              systemVersions: mockSystemVersionsSupported,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Update All'));

      await waitFor(() => {
        expect(screen.getByText('v1.0.0 → v1.1.0')).toBeInTheDocument();
      });

      expect(screen.getByText('v0.5.0 → v0.6.0')).toBeInTheDocument();
    });
  });

  describe('Individual repository update', () => {
    it('shows version selector when Update button clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-fe' },
          },
          result: {
            data: {
              availableVersions: mockAvailableVersions,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      });

      // Find the Update button for lacylights-fe (first Update button)
      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Latest')).toBeInTheDocument();
      });

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('loads available versions when showing selector', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-fe' },
          },
          result: {
            data: {
              availableVersions: mockAvailableVersions,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      });

      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('v1.2.0')).toBeInTheDocument();
      });

      // Check that all versions are available in dropdown (v1.1.0 and v1.0.0 may appear in table too)
      expect(screen.getAllByText('v1.2.0')).toHaveLength(1);
      expect(screen.getAllByText('v1.0.0').length).toBeGreaterThanOrEqual(1);
    });

    it('cancels version selection when Cancel clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-fe' },
          },
          result: {
            data: {
              availableVersions: mockAvailableVersions,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      });

      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });
    });

    it('updates repository to latest when Update clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-fe' },
          },
          result: {
            data: {
              availableVersions: mockAvailableVersions,
            },
          },
        },
        {
          request: {
            query: UPDATE_REPOSITORY,
            variables: { repository: 'lacylights-fe', version: undefined },
          },
          result: {
            data: {
              updateRepository: mockUpdateRepositorySuccess,
            },
          },
        },
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          result: {
            data: {
              systemVersions: mockSystemVersionsSupported,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      });

      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        const updateButton = screen.getAllByText('Update').find(
          (button) => button.tagName === 'BUTTON' && button.textContent === 'Update'
        );
        expect(updateButton).toBeInTheDocument();
        if (updateButton) {
          fireEvent.click(updateButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Update Results')).toBeInTheDocument();
      });

      expect(screen.getByText('Updated successfully')).toBeInTheDocument();
    });

    it('allows selecting specific version from dropdown', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-fe' },
          },
          result: {
            data: {
              availableVersions: mockAvailableVersions,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      });

      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Latest');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('Latest');
      fireEvent.change(select, { target: { value: 'v1.2.0' } });

      await waitFor(() => {
        expect(select).toHaveValue('v1.2.0');
      });
    });
  });

  describe('Update results', () => {
    it('displays success results with version changes', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: UPDATE_ALL_REPOSITORIES,
          },
          result: {
            data: {
              updateAllRepositories: mockUpdateAllSuccess,
            },
          },
        },
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          result: {
            data: {
              systemVersions: mockSystemVersionsSupported,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Update All'));

      await waitFor(() => {
        expect(screen.getByText('Update Results')).toBeInTheDocument();
      });

      expect(screen.getAllByText('Updated successfully')).toHaveLength(2);
      expect(screen.getByText('v1.0.0 → v1.1.0')).toBeInTheDocument();
    });

    it('clears results when Clear button clicked', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: UPDATE_ALL_REPOSITORIES,
          },
          result: {
            data: {
              updateAllRepositories: mockUpdateAllSuccess,
            },
          },
        },
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          result: {
            data: {
              systemVersions: mockSystemVersionsSupported,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Update All'));

      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear'));

      await waitFor(() => {
        expect(screen.queryByText('Update Results')).not.toBeInTheDocument();
      });
    });

    it('displays error results when update fails', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-fe' },
          },
          result: {
            data: {
              availableVersions: mockAvailableVersions,
            },
          },
        },
        {
          request: {
            query: UPDATE_REPOSITORY,
            variables: { repository: 'lacylights-fe', version: undefined },
          },
          result: {
            data: {
              updateRepository: mockUpdateRepositoryError,
            },
          },
        },
        {
          request: {
            query: GET_SYSTEM_VERSIONS,
          },
          result: {
            data: {
              systemVersions: mockSystemVersionsSupported,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-fe')).toBeInTheDocument();
      });

      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);

      await waitFor(() => {
        const updateButtons = screen.getAllByText('Update');
        const updateButton = updateButtons.find(
          (button) => button.tagName === 'BUTTON'
        );
        if (updateButton) {
          fireEvent.click(updateButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    it('handles mutation errors with onError handler', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: UPDATE_ALL_REPOSITORIES,
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Update All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Update All'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error updating all repositories:',
          expect.any(Error)
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Change Version button', () => {
    it('shows "Change Version" for repositories without updates', async () => {
      const mocks = [
        ...createMocks(),
        {
          request: {
            query: GET_AVAILABLE_VERSIONS,
            variables: { repository: 'lacylights-node' },
          },
          result: {
            data: {
              availableVersions: ['v2.1.0', 'v2.0.0', 'v1.9.0'],
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <VersionManagement />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('lacylights-node')).toBeInTheDocument();
      });

      expect(screen.getByText('Change Version')).toBeInTheDocument();
    });
  });
});
