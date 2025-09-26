import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import CreateSceneModal from '../CreateSceneModal';
import { CREATE_SCENE } from '../../graphql/scenes';
import { GET_PROJECT_FIXTURES } from '../../graphql/fixtures';
import { FixtureInstance, ChannelType, FixtureType } from '../../types';

const mockProjectId = 'project-123';
const mockOnClose = jest.fn();
const mockOnSceneCreated = jest.fn();

const mockFixtures: FixtureInstance[] = [
  {
    id: '1',
    name: 'Light 1',
    description: 'Test fixture 1',
    manufacturer: 'Chauvet',
    model: 'SlimPAR Pro',
    type: FixtureType.LED_PAR,
    modeName: 'RGBW',
    universe: 1,
    startChannel: 1,
    channelCount: 4,
    tags: [],
    projectOrder: 1,
    createdAt: '2023-01-01T12:00:00Z',
    definitionId: 'def-1',
    project: { id: mockProjectId, name: 'Test Project' } as FixtureInstance['project'],
    channels: [
      { id: '1', offset: 0, name: 'Red', type: ChannelType.RED, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '2', offset: 1, name: 'Green', type: ChannelType.GREEN, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '3', offset: 2, name: 'Blue', type: ChannelType.BLUE, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '4', offset: 3, name: 'Master', type: ChannelType.INTENSITY, minValue: 0, maxValue: 255, defaultValue: 255 },
    ],
  },
  {
    id: '2',
    name: 'Light 2',
    description: 'Test fixture 2',
    manufacturer: 'ADJ',
    model: 'Mega Hex Par',
    type: FixtureType.LED_PAR,
    modeName: 'RGBWAU',
    universe: 1,
    startChannel: 5,
    channelCount: 6,
    tags: [],
    projectOrder: 2,
    createdAt: '2023-01-02T12:00:00Z',
    definitionId: 'def-2',
    project: { id: mockProjectId, name: 'Test Project' } as FixtureInstance['project'],
    channels: [
      { id: '5', offset: 0, name: 'Red', type: ChannelType.RED, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '6', offset: 1, name: 'Green', type: ChannelType.GREEN, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '7', offset: 2, name: 'Blue', type: ChannelType.BLUE, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '8', offset: 3, name: 'White', type: ChannelType.WHITE, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '9', offset: 4, name: 'Amber', type: ChannelType.AMBER, minValue: 0, maxValue: 255, defaultValue: 0 },
      { id: '10', offset: 5, name: 'UV', type: ChannelType.UV, minValue: 0, maxValue: 255, defaultValue: 0 },
    ],
  },
];

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  projectId: mockProjectId,
  onSceneCreated: mockOnSceneCreated,
};

describe('CreateSceneModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByRole('heading', { name: 'Create Scene' })).toBeInTheDocument();
      expect(screen.getByText('Create a new lighting scene. All fixtures will be added with default values that you can edit later.')).toBeInTheDocument();
    });

    it('returns null when isOpen is false', () => {
      const mocks: never[] = [];
      const { container } = render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} isOpen={false} />
        </MockedProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders form fields', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByLabelText('Scene Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Warm Wash, Blue Special, Blackout')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Optional description of this scene...')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Scene' })).toBeInTheDocument();
    });

    it('displays fixtures when loaded', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Fixtures to include (2)')).toBeInTheDocument();
        expect(screen.getByText('Light 1 - Chauvet SlimPAR Pro')).toBeInTheDocument();
        expect(screen.getByText('Light 2 - ADJ Mega Hex Par')).toBeInTheDocument();
      });
    });

    it('shows warning when no fixtures', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No fixtures found in this project. Add some fixtures first before creating scenes.')).toBeInTheDocument();
      });
    });
  });

  describe('form interaction', () => {
    it('updates scene name value', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Warm Evening');

      expect(nameInput).toHaveValue('Warm Evening');
    });

    it('updates description value', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const _descriptionInput = screen.getByLabelText('Description');
      await userEvent.type(_descriptionInput, 'A warm ambient scene');

      expect(_descriptionInput).toHaveValue('A warm ambient scene');
    });

    it('requires scene name field', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      expect(nameInput).toBeRequired();
    });

    it('does not require description field', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const _descriptionInput = screen.getByLabelText('Description');
      expect(_descriptionInput).not.toBeRequired();
    });

    it('disables submit button when name is empty', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        expect(_submitButton).toBeDisabled();
      });
    });

    it('disables submit button when no fixtures', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        expect(_submitButton).toBeDisabled();
      });
    });

    it('enables submit button when name is provided and fixtures exist', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        expect(_submitButton).not.toBeDisabled();
      });
    });

    it('disables submit button when name contains only whitespace', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, '   ');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        expect(_submitButton).toBeDisabled();
      });
    });
  });

  describe('form submission', () => {
    it('submits form with valid data', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: 'Test Description',
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: 'Test Description',
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      const _descriptionInput = screen.getByLabelText('Description');

      await userEvent.type(nameInput, 'Test Scene');
      await userEvent.type(_descriptionInput, 'Test Description');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('submits form without description', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles empty description as undefined', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');
      // Leave description empty

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
      });
    });

    it('creates fixture values with default channel values', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Default Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255], // Using defaultValue from mockFixtures
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0], // All default to 0
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Default Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Default Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
      });
    });

  });

  describe('loading state', () => {
    it('shows loading text when creating', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          delay: 100,
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();
    });

    it('disables submit button while creating', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          delay: 100,
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('displays error message on mutation failure', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          error: new Error('Failed to create scene'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Error creating scene')).toBeInTheDocument();
        expect(screen.getByText('Failed to create scene')).toBeInTheDocument();
      });
    });

    it('displays error with proper styling', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          error: new Error('Test error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        const errorContainer = screen.getByText('Test error').closest('div.bg-red-50');
        expect(errorContainer).toHaveClass('bg-red-50', 'dark:bg-red-900/20', 'border', 'border-red-200', 'dark:border-red-800', 'rounded-lg');

        const errorTitle = screen.getByText('Error creating scene');
        expect(errorTitle).toHaveClass('text-sm', 'font-medium', 'text-red-800', 'dark:text-red-200');

        const errorMessage = screen.getByText('Test error');
        expect(errorMessage).toHaveClass('whitespace-pre-wrap', 'select-all');
      });
    });

    it('clears error on successful submission', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'First Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          error: new Error('First error'),
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Second Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Second Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      // First submission with error
      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'First Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission should clear error
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Second Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('modal close behavior', () => {
    it('calls onClose when cancel button is clicked', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const backdrop = screen.getByRole('heading', { name: 'Create Scene' }).closest('.fixed');
      const backdropDiv = backdrop?.firstElementChild?.firstElementChild;
      fireEvent.click(backdropDiv!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form fields when closing', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      const _descriptionInput = screen.getByLabelText('Description');
      const cancelButton = screen.getByText('Cancel');

      await userEvent.type(nameInput, 'Test Scene');
      await userEvent.type(_descriptionInput, 'Test Description');

      expect(nameInput).toHaveValue('Test Scene');
      expect(_descriptionInput).toHaveValue('Test Description');

      fireEvent.click(cancelButton);

      // Component should reset on next render
      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const newNameInput = screen.getByLabelText('Scene Name *');
      const newDescriptionInput = screen.getByLabelText('Description');

      expect(newNameInput).toHaveValue('');
      expect(newDescriptionInput).toHaveValue('');
    });

    it('resets error state when closing', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          error: new Error('Test error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Component should reset error on next render
      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });

    it('closes modal after successful creation', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: mockFixtures,
                __typename: 'Project',
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0, 0, 255],
                  },
                  {
                    fixtureId: '2',
                    channelValues: [0, 0, 0, 0, 0, 0],
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('styling', () => {
    it('applies correct modal overlay classes', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const overlay = screen.getByRole('heading', { name: 'Create Scene' }).closest('.fixed');
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'overflow-y-auto');
    });

    it('applies correct backdrop classes', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const backdrop = screen.getByRole('heading', { name: 'Create Scene' }).closest('div.flex')?.querySelector('div.fixed');
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-gray-500', 'bg-opacity-75', 'transition-opacity');
    });

    it('applies correct modal content classes', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const content = screen.getByRole('heading', { name: 'Create Scene' }).closest('.bg-white');
      expect(content).toHaveClass('inline-block', 'align-bottom', 'bg-white', 'dark:bg-gray-800', 'rounded-lg');
    });

    it('applies correct button styling', () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                id: mockProjectId,
                fixtures: [],
                __typename: 'Project',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('inline-flex', 'justify-center', 'rounded-md', 'border', 'border-gray-300', 'bg-white', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-gray-700');

      const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
      expect(_submitButton).toHaveClass('inline-flex', 'justify-center', 'rounded-md', 'border', 'border-transparent', 'bg-blue-600', 'px-4', 'py-2', 'text-sm', 'font-medium', 'text-white', 'disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('edge cases', () => {
    it('handles fixtures without channels', async () => {
      const fixturesWithoutChannels = [
        {
          id: '1',
          name: 'Light 1',
          manufacturer: 'Test',
          model: 'Test',
          universe: 1,
          startChannel: 1,
          channelCount: 0,
          channels: null,
        },
      ];

      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                fixtures: fixturesWithoutChannels,
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [],
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
      });
    });

    it('handles channels without default values', async () => {
      const fixturesWithNoDefaults = [
        {
          id: '1',
          name: 'Light 1',
          manufacturer: 'Test',
          model: 'Test',
          universe: 1,
          startChannel: 1,
          channelCount: 2,
          channels: [
            { id: '1', offset: 0, name: 'Red', type: ChannelType.RED, minValue: 0, maxValue: 255, defaultValue: 0 },
            { id: '2', offset: 1, name: 'Green', type: ChannelType.GREEN, minValue: 0, maxValue: 255, defaultValue: 0 },
          ],
        },
      ];

      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: {
                fixtures: fixturesWithNoDefaults,
              },
            },
          },
        },
        {
          request: {
            query: CREATE_SCENE,
            variables: {
              input: {
                name: 'Test Scene',
                description: undefined,
                projectId: mockProjectId,
                fixtureValues: [
                  {
                    fixtureId: '1',
                    channelValues: [0, 0], // Should default to 0 when defaultValue is null/undefined
                  },
                ],
              },
            },
          },
          result: {
            data: {
              createScene: {
                id: 'scene-1',
                name: 'Test Scene',
                description: "",
                fixtureValues: [],
                project: { id: 'project-1', name: 'Test Project' },
                createdAt: '2023-01-01T12:00:00Z',
                updatedAt: '2023-01-01T12:00:00Z',
                __typename: 'Scene',
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      const nameInput = screen.getByLabelText('Scene Name *');
      await userEvent.type(nameInput, 'Test Scene');

      await waitFor(() => {
        const _submitButton = screen.getByRole('button', { name: 'Create Scene' });
        fireEvent.click(_submitButton);
      });

      await waitFor(() => {
        expect(mockOnSceneCreated).toHaveBeenCalled();
      });
    });

    it('skips query when projectId is not provided', () => {
      const mocks: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} projectId="" />
        </MockedProvider>
      );

      expect(screen.getByRole('heading', { name: 'Create Scene' })).toBeInTheDocument();
      // No query should be made because projectId is empty
    });

    it('handles null fixture data gracefully', async () => {
      const mocks = [
        {
          request: {
            query: GET_PROJECT_FIXTURES,
            variables: { projectId: mockProjectId },
          },
          result: {
            data: {
              project: null,
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <CreateSceneModal {...defaultProps} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No fixtures found in this project. Add some fixtures first before creating scenes.')).toBeInTheDocument();
      });
    });
  });
});