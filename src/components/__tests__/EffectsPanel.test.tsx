import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import EffectsPanel from '../EffectsPanel';
import { GET_EFFECTS, ACTIVATE_EFFECT, STOP_EFFECT } from '@/graphql/effects';
import { EffectType, WaveformType, PriorityBand, CompositionMode, TransitionBehavior } from '@/generated/graphql';

// Simple mock effects matching the Effect interface in the component
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for reference
const _mockEffects = [
  {
    __typename: 'Effect',
    id: 'effect-1',
    name: 'Rainbow Chase',
    effectType: EffectType.Waveform,
    waveform: WaveformType.Sine,
    frequency: 1.0,
  },
  {
    __typename: 'Effect',
    id: 'effect-2',
    name: 'Pulse Master',
    effectType: EffectType.Master,
    waveform: null,
    frequency: 0.5,
  },
  {
    __typename: 'Effect',
    id: 'effect-3',
    name: 'Static Fill',
    effectType: EffectType.Static,
    waveform: null,
    frequency: 0,
  },
];

// Full effect with all fields for fragment matching
const mockFullEffects = [
  {
    __typename: 'Effect',
    id: 'effect-1',
    name: 'Rainbow Chase',
    description: 'Color chasing effect',
    projectId: 'project-1',
    effectType: EffectType.Waveform,
    waveform: WaveformType.Sine,
    frequency: 1.0,
    amplitude: 1.0,
    offset: 0.5,
    phaseOffset: 0,
    priorityBand: PriorityBand.User,
    prioritySub: 50,
    compositionMode: CompositionMode.Override,
    onCueChange: TransitionBehavior.FadeOut,
    fadeDuration: 1,
    masterValue: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    __typename: 'Effect',
    id: 'effect-2',
    name: 'Pulse Master',
    description: 'Master dimmer effect',
    projectId: 'project-1',
    effectType: EffectType.Master,
    waveform: null,
    frequency: 0.5,
    amplitude: 0.5,
    offset: 0.75,
    phaseOffset: 0,
    priorityBand: PriorityBand.System,
    prioritySub: 100,
    compositionMode: CompositionMode.Multiply,
    onCueChange: TransitionBehavior.Persist,
    fadeDuration: 2,
    masterValue: 0.8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    __typename: 'Effect',
    id: 'effect-3',
    name: 'Static Fill',
    description: 'Static color fill',
    projectId: 'project-1',
    effectType: EffectType.Static,
    waveform: null,
    frequency: 0,
    amplitude: 1.0,
    offset: 1.0,
    phaseOffset: 0,
    priorityBand: PriorityBand.Base,
    prioritySub: 0,
    compositionMode: CompositionMode.Override,
    onCueChange: TransitionBehavior.SnapOff,
    fadeDuration: 0,
    masterValue: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const getEffectsMock: MockedResponse = {
  request: {
    query: GET_EFFECTS,
    variables: { projectId: 'project-1' },
  },
  result: {
    data: {
      effects: mockFullEffects,
    },
  },
};

const getEffectsEmptyMock: MockedResponse = {
  request: {
    query: GET_EFFECTS,
    variables: { projectId: 'project-empty' },
  },
  result: {
    data: {
      effects: [],
    },
  },
};

const activateEffectMock: MockedResponse = {
  request: {
    query: ACTIVATE_EFFECT,
    variables: { effectId: 'effect-1', fadeTime: 1.0 },
  },
  result: {
    data: {
      activateEffect: true,
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future stop effect tests
const _stopEffectMock: MockedResponse = {
  request: {
    query: STOP_EFFECT,
    variables: { effectId: 'effect-1', fadeTime: 1.0 },
  },
  result: {
    data: {
      stopEffect: true,
    },
  },
};

describe('EffectsPanel', () => {
  describe('collapsed state', () => {
    it('renders collapsed by default', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" />
        </MockedProvider>,
      );

      expect(screen.getByTitle('Show Effects Panel')).toBeInTheDocument();
    });

    it('expands when collapsed button is clicked', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={true} />
        </MockedProvider>,
      );

      const expandButton = screen.getByTitle('Show Effects Panel');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Effects')).toBeInTheDocument();
      });
    });

    it('calls onCollapseChange when toggling', async () => {
      const onCollapseChange = jest.fn();

      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel
            projectId="project-1"
            defaultCollapsed={true}
            onCollapseChange={onCollapseChange}
          />
        </MockedProvider>,
      );

      const expandButton = screen.getByTitle('Show Effects Panel');
      fireEvent.click(expandButton);

      expect(onCollapseChange).toHaveBeenCalledWith(false);
    });
  });

  describe('expanded state', () => {
    it('renders expanded when defaultCollapsed is false', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={false} />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Effects')).toBeInTheDocument();
      });
    });

    it('shows loading state', () => {
      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={false} />
        </MockedProvider>,
      );

      expect(screen.getByText('Loading effects...')).toBeInTheDocument();
    });

    it('displays effects list after loading', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={false} />
        </MockedProvider>,
      );

      await waitFor(
        () => {
          expect(screen.getByText('Rainbow Chase')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(screen.getByText('Pulse Master')).toBeInTheDocument();
      expect(screen.getByText('Static Fill')).toBeInTheDocument();
    });

    it('shows empty state when no effects', async () => {
      render(
        <MockedProvider mocks={[getEffectsEmptyMock]} addTypename={false}>
          <EffectsPanel projectId="project-empty" defaultCollapsed={false} />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('No effects available')).toBeInTheDocument();
      });
    });

    it('collapses when close button is clicked', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={false} />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Effects')).toBeInTheDocument();
      });

      const collapseButton = screen.getByTitle('Collapse panel');
      fireEvent.click(collapseButton);

      expect(screen.getByTitle('Show Effects Panel')).toBeInTheDocument();
    });
  });

  describe('position', () => {
    it('positions on the right by default', async () => {
      const { container } = render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={true} />
        </MockedProvider>,
      );

      const button = container.querySelector('.right-4');
      expect(button).toBeInTheDocument();
    });

    it('positions on the left when specified', async () => {
      const { container } = render(
        <MockedProvider mocks={[getEffectsMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={true} position="left" />
        </MockedProvider>,
      );

      const button = container.querySelector('.left-4');
      expect(button).toBeInTheDocument();
    });
  });

  describe('effect activation', () => {
    it('activates an effect when clicked', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock, activateEffectMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={false} />
        </MockedProvider>,
      );

      await waitFor(
        () => {
          expect(screen.getByText('Rainbow Chase')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      fireEvent.click(screen.getByText('Rainbow Chase'));

      await waitFor(() => {
        expect(screen.getByText('1 active')).toBeInTheDocument();
      });
    });

    it('shows Stop All button when effects are active', async () => {
      render(
        <MockedProvider mocks={[getEffectsMock, activateEffectMock]} addTypename={false}>
          <EffectsPanel projectId="project-1" defaultCollapsed={false} />
        </MockedProvider>,
      );

      await waitFor(
        () => {
          expect(screen.getByText('Rainbow Chase')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Before activation - no Stop All button
      expect(screen.queryByText('Stop All Effects')).not.toBeInTheDocument();

      // Activate an effect
      fireEvent.click(screen.getByText('Rainbow Chase'));

      await waitFor(() => {
        expect(screen.getByText('Stop All Effects')).toBeInTheDocument();
      });
    });
  });

  describe('skips query without projectId', () => {
    it('does not fetch when projectId is empty', async () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <EffectsPanel projectId="" defaultCollapsed={false} />
        </MockedProvider>,
      );

      // Should not crash and show empty state without making query
      await waitFor(() => {
        expect(screen.getByText('No effects available')).toBeInTheDocument();
      });
    });
  });
});
