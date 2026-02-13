'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GET_EFFECT,
  UPDATE_EFFECT,
  ADD_FIXTURE_TO_EFFECT,
  REMOVE_FIXTURE_FROM_EFFECT,
  UPDATE_EFFECT_FIXTURE,
  ADD_CHANNEL_TO_EFFECT_FIXTURE,
  UPDATE_EFFECT_CHANNEL,
  REMOVE_CHANNEL_FROM_EFFECT_FIXTURE,
  ACTIVATE_EFFECT,
  STOP_EFFECT,
  GET_EFFECTS,
} from '@/graphql/effects';
import { GET_PROJECT_FIXTURES } from '@/graphql/fixtures';
import { useProject } from '@/contexts/ProjectContext';
import { useStreamDock } from '@/contexts/StreamDockContext';
import {
  EffectType,
  PriorityBand,
  WaveformType,
  CompositionMode,
  TransitionBehavior,
  ChannelType,
} from '@/generated/graphql';
import { FixtureInstance } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
import WaveformPreview from './WaveformPreview';
// Helper function to get CSS colors for channel types
function getChannelTypeColor(type: ChannelType): string {
  switch (type) {
    case ChannelType.Red:
      return '#ef4444';
    case ChannelType.Green:
      return '#22c55e';
    case ChannelType.Blue:
      return '#3b82f6';
    case ChannelType.White:
    case ChannelType.WarmWhite:
    case ChannelType.ColdWhite:
      return '#f5f5f5';
    case ChannelType.Amber:
      return '#f59e0b';
    case ChannelType.Uv:
      return '#a855f7';
    case ChannelType.Cyan:
      return '#06b6d4';
    case ChannelType.Magenta:
      return '#ec4899';
    case ChannelType.Yellow:
      return '#eab308';
    case ChannelType.Intensity:
      return '#9ca3af';
    default:
      return '#6b7280';
  }
}

// Helper function to get abbreviation for channel types
function getChannelTypeAbbreviation(type: ChannelType): string {
  const map: Record<ChannelType, string> = {
    [ChannelType.Red]: 'R',
    [ChannelType.Green]: 'G',
    [ChannelType.Blue]: 'B',
    [ChannelType.White]: 'W',
    [ChannelType.Amber]: 'A',
    [ChannelType.Uv]: 'UV',
    [ChannelType.Cyan]: 'C',
    [ChannelType.Magenta]: 'M',
    [ChannelType.Yellow]: 'Y',
    [ChannelType.Lime]: 'L',
    [ChannelType.Indigo]: 'In',
    [ChannelType.ColdWhite]: 'CW',
    [ChannelType.WarmWhite]: 'WW',
    [ChannelType.Intensity]: 'Dim',
    [ChannelType.Pan]: 'Pan',
    [ChannelType.Tilt]: 'Tilt',
    [ChannelType.Zoom]: 'Z',
    [ChannelType.Focus]: 'F',
    [ChannelType.Iris]: 'Ir',
    [ChannelType.Gobo]: 'Gobo',
    [ChannelType.ColorWheel]: 'Whl',
    [ChannelType.Effect]: 'Fx',
    [ChannelType.Strobe]: 'Str',
    [ChannelType.Macro]: 'Macro',
    [ChannelType.Other]: 'Other',
  };
  return map[type] || type;
}

interface EffectEditorLayoutProps {
  effectId: string;
  onClose: () => void;
}

interface EffectChannel {
  id: string;
  effectFixtureId: string;
  channelOffset?: number | null;
  channelType?: ChannelType | null;
  amplitudeScale?: number | null;
  frequencyScale?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
}

interface FixtureChannelDef {
  id: string;
  offset: number;
  name: string;
  type: ChannelType;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

interface EffectFixture {
  id: string;
  effectId: string;
  fixtureId: string;
  fixture: {
    id: string;
    name: string;
    universe: number;
    startChannel: number;
    manufacturer: string;
    model: string;
    type: string;
    channels: FixtureChannelDef[];
  };
  phaseOffset?: number | null;
  amplitudeScale?: number | null;
  effectOrder?: number | null;
  channels: EffectChannel[];
}

interface Effect {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  effectType: EffectType;
  priorityBand: PriorityBand;
  prioritySub: number;
  compositionMode: CompositionMode;
  onCueChange: TransitionBehavior;
  fadeDuration: number;
  waveform?: WaveformType;
  frequency?: number;
  amplitude?: number;
  offset?: number;
  phaseOffset?: number;
  masterValue?: number;
  fixtures: EffectFixture[];
}

export default function EffectEditorLayout({ effectId, onClose }: EffectEditorLayoutProps) {
  const isMobile = useIsMobile();
  const { selectedProjectId } = useProject();
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showAddFixture, setShowAddFixture] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWaveform, setFormWaveform] = useState<WaveformType>(WaveformType.Sine);
  const [formFrequency, setFormFrequency] = useState(1.0);
  const [formAmplitude, setFormAmplitude] = useState(100.0); // Percentage 0-100
  const [formOffset, setFormOffset] = useState(50.0); // Percentage 0-100 (50 = center)
  const [formFadeDuration, setFormFadeDuration] = useState(1.0);
  const [formCompositionMode, setFormCompositionMode] = useState<CompositionMode>(
    CompositionMode.Override,
  );
  const [formOnCueChange, setFormOnCueChange] = useState<TransitionBehavior>(
    TransitionBehavior.FadeOut,
  );
  const [formMasterValue, setFormMasterValue] = useState(1.0);

  // Expanded fixture state for channel management
  const [expandedFixtures, setExpandedFixtures] = useState<Set<string>>(new Set());
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);

  // Expanded channel type for bulk editing
  const [expandedChannelType, setExpandedChannelType] = useState<ChannelType | null>(null);

  // Drag and drop sensors for fixture reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Query effect data
  const { data, loading, error, refetch } = useQuery(GET_EFFECT, {
    variables: { id: effectId },
    onCompleted: (data) => {
      const effect = data?.effect as Effect;
      if (effect) {
        setFormName(effect.name);
        setFormDescription(effect.description || '');
        setFormWaveform(effect.waveform || WaveformType.Sine);
        setFormFrequency(effect.frequency || 1.0);
        setFormAmplitude(effect.amplitude || 100.0);
        setFormOffset(effect.offset || 50.0);
        setFormFadeDuration(effect.fadeDuration || 1.0);
        setFormCompositionMode(effect.compositionMode || CompositionMode.Override);
        setFormOnCueChange(effect.onCueChange || TransitionBehavior.FadeOut);
        setFormMasterValue(effect.masterValue || 1.0);
      }
    },
  });

  // Query available fixtures for the project
  const { data: fixturesData } = useQuery(GET_PROJECT_FIXTURES, {
    variables: { projectId: selectedProjectId },
    skip: !selectedProjectId,
  });

  const effect = data?.effect as Effect | undefined;
  const projectFixtures = fixturesData?.project?.fixtures as FixtureInstance[] | undefined;

  // Get fixtures not yet added to this effect
  const availableFixtures = useMemo(() => {
    if (!projectFixtures || !effect?.fixtures) return [];
    const assignedIds = new Set(effect.fixtures.map((ef) => ef.fixtureId));
    return projectFixtures.filter((f) => !assignedIds.has(f.id));
  }, [projectFixtures, effect?.fixtures]);

  // Sort fixtures by effectOrder for display and drag-and-drop
  const sortedFixtures = useMemo(() => {
    if (!effect?.fixtures) return [];
    return [...effect.fixtures].sort((a, b) => (a.effectOrder ?? 0) - (b.effectOrder ?? 0));
  }, [effect?.fixtures]);

  // Collect all available channel types across all effect fixtures
  // Returns a map of channel type -> { fixtures that have this channel type, and which are currently active }
  const channelTypeInfo = useMemo(() => {
    if (!effect?.fixtures) return new Map<ChannelType, {
      fixtureChannels: Array<{
        effectFixtureId: string;
        fixtureName: string;
        channelOffset: number;
        channelName: string;
        isActive: boolean;
        effectChannelId?: string;
        // Include effect channel data for initializing bulk editor
        amplitudeScale?: number | null;
        frequencyScale?: number | null;
        minValue?: number | null;
        maxValue?: number | null;
      }>;
    }>();

    const typeMap = new Map<ChannelType, {
      fixtureChannels: Array<{
        effectFixtureId: string;
        fixtureName: string;
        channelOffset: number;
        channelName: string;
        isActive: boolean;
        effectChannelId?: string;
        amplitudeScale?: number | null;
        frequencyScale?: number | null;
        minValue?: number | null;
        maxValue?: number | null;
      }>;
    }>();

    for (const ef of effect.fixtures) {
      if (!ef.fixture.channels) continue;

      for (const ch of ef.fixture.channels) {
        if (!typeMap.has(ch.type)) {
          typeMap.set(ch.type, { fixtureChannels: [] });
        }

        // Check if this channel is already active in the effect
        const activeEffectChannel = ef.channels?.find(
          (ec) => ec.channelOffset === ch.offset || ec.channelType === ch.type
        );

        typeMap.get(ch.type)!.fixtureChannels.push({
          effectFixtureId: ef.id,
          fixtureName: ef.fixture.name,
          channelOffset: ch.offset,
          channelName: ch.name,
          isActive: !!activeEffectChannel,
          effectChannelId: activeEffectChannel?.id,
          amplitudeScale: activeEffectChannel?.amplitudeScale,
          frequencyScale: activeEffectChannel?.frequencyScale,
          minValue: activeEffectChannel?.minValue,
          maxValue: activeEffectChannel?.maxValue,
        });
      }
    }

    return typeMap;
  }, [effect?.fixtures]);

  // Get sorted list of channel types for display
  const sortedChannelTypes = useMemo(() => {
    const colorOrder: ChannelType[] = [
      ChannelType.Intensity,
      ChannelType.Red,
      ChannelType.Green,
      ChannelType.Blue,
      ChannelType.White,
      ChannelType.Amber,
      ChannelType.Uv,
      ChannelType.Cyan,
      ChannelType.Magenta,
      ChannelType.Yellow,
      ChannelType.WarmWhite,
      ChannelType.ColdWhite,
    ];

    const types = Array.from(channelTypeInfo.keys());
    return types.sort((a, b) => {
      const aIndex = colorOrder.indexOf(a);
      const bIndex = colorOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [channelTypeInfo]);

  // Mutations
  const [updateEffect, { loading: updating }] = useMutation(UPDATE_EFFECT, {
    onCompleted: () => {
      setIsEditing(false);
      refetch();
    },
  });

  const [addFixture] = useMutation(ADD_FIXTURE_TO_EFFECT, {
    onCompleted: () => {
      setShowAddFixture(false);
      refetch();
    },
  });

  const [removeFixture] = useMutation(REMOVE_FIXTURE_FROM_EFFECT, {
    onCompleted: () => refetch(),
  });

  const [activateEffect] = useMutation(ACTIVATE_EFFECT, {
    onCompleted: () => setIsActive(true),
  });

  const [stopEffect] = useMutation(STOP_EFFECT, {
    onCompleted: () => setIsActive(false),
    refetchQueries: selectedProjectId
      ? [{ query: GET_EFFECTS, variables: { projectId: selectedProjectId } }]
      : [],
  });

  // Effect fixture and channel mutations
  const [updateEffectFixture] = useMutation(UPDATE_EFFECT_FIXTURE, {
    onCompleted: () => {
      setEditingFixtureId(null);
      refetch();
    },
  });

  const [addChannelToEffectFixture] = useMutation(ADD_CHANNEL_TO_EFFECT_FIXTURE, {
    onCompleted: () => refetch(),
  });

  const [updateEffectChannel] = useMutation(UPDATE_EFFECT_CHANNEL, {
    onCompleted: () => refetch(),
  });

  const [removeChannelFromEffectFixture] = useMutation(REMOVE_CHANNEL_FROM_EFFECT_FIXTURE, {
    onCompleted: () => refetch(),
  });

  // Stream Dock integration
  const streamDock = useStreamDock();

  // Publish Effect Editor state to Stream Dock
  useEffect(() => {
    if (!effect) {
      streamDock.publishEffectEditorState(null);
      return;
    }

    // Build parameters list based on effect type
    const parameters = [];
    if (effect.effectType === EffectType.Waveform) {
      parameters.push(
        { name: 'frequency', value: formFrequency, min: 0.1, max: 10.0 },
        { name: 'amplitude', value: formAmplitude, min: 0, max: 100 },
        { name: 'offset', value: formOffset, min: 0, max: 100 }
      );
    } else if (effect.effectType === EffectType.Master) {
      parameters.push({ name: 'masterValue', value: formMasterValue * 100, min: 0, max: 100 });
    }

    const state = {
      effectId: effect.id,
      effectName: effect.name,
      effectType: effect.effectType || 'WAVEFORM',
      isRunning: isActive,
      parameters,
      selectedParamIndex: 0, // Default to first parameter
      // Note: canUndo/canRedo removed until strategy is clarified (see handler TODOs)
      isDirty: isEditing,
    };

    streamDock.publishEffectEditorState(state);
  }, [effect, formFrequency, formAmplitude, formOffset, formMasterValue, isActive, isEditing, streamDock]);

  // Register Stream Dock handlers
  useEffect(() => {
    if (!effect) {
      streamDock.registerEffectEditorHandlers(null);
      return;
    }

    const handlers = {
      handleSave: () => {
        if (!effect) return;

        const input: Record<string, unknown> = {
          name: formName,
          description: formDescription || undefined,
          fadeDuration: formFadeDuration,
          compositionMode: formCompositionMode,
          onCueChange: formOnCueChange,
        };

        if (effect.effectType === EffectType.Waveform) {
          input.waveform = formWaveform;
          input.frequency = formFrequency;
          input.amplitude = formAmplitude;
          input.offset = formOffset;
        } else if (effect.effectType === EffectType.Master) {
          input.masterValue = formMasterValue;
        }

        updateEffect({
          variables: { id: effectId, input },
        });
      },
      handleUndo: () => {
        // TODO: Effect Editor undo/redo strategy needs clarification
        // Options:
        // 1. Integrate with global UndoRedoContext if backend tracks effect mutations
        // 2. Implement effect-specific local undo/redo for draft changes
        // 3. Disable Stream Deck undo/redo buttons in Effect Editor mode
        // Decision deferred pending backend operation history scope review
      },
      handleRedo: () => {
        // TODO: See handleUndo comment above
      },
      handleStartStop: () => {
        if (isActive) {
          stopEffect({ variables: { id: effectId } });
        } else {
          activateEffect({ variables: { id: effectId } });
        }
      },
      handleCycleType: () => {
        // Toggle waveform type for waveform effects
        if (effect.effectType === EffectType.Waveform) {
          const waveforms = [
            WaveformType.Sine,
            WaveformType.Cosine,
            WaveformType.Square,
            WaveformType.Triangle,
            WaveformType.Sawtooth,
            WaveformType.Random,
          ];
          const currentIndex = waveforms.indexOf(formWaveform);
          const nextIndex = (currentIndex + 1) % waveforms.length;
          setFormWaveform(waveforms[nextIndex]);
        }
      },
      handleTogglePreview: () => {
        // Toggle editing mode to preview changes
        // "Preview" in Stream Deck context means entering edit mode to preview parameter changes
        // isEditing=true: Can edit parameters and preview changes
        // isEditing=false: View-only mode
        setIsEditing(prev => !prev);
      },
      handleSetParam: (paramName: string, value: number) => {
        switch (paramName) {
          case 'frequency':
            setFormFrequency(value);
            break;
          case 'amplitude':
            setFormAmplitude(value);
            break;
          case 'offset':
            setFormOffset(value);
            break;
          case 'masterValue':
            // Clamp value to 0-100 range before converting to 0-1
            setFormMasterValue(Math.max(0, Math.min(100, value)) / 100);
            break;
          default:
            // Unknown parameters indicate protocol mismatch - log as error in all environments
            console.error(`Unknown effect parameter name: ${paramName}`);
        }
      },
    };

    streamDock.registerEffectEditorHandlers(handlers);

    return () => {
      streamDock.registerEffectEditorHandlers(null);
    };
    // Note: updateEffect, activateEffect, stopEffect are intentionally omitted from deps
    // GraphQL mutations are not stable and handlers capture latest via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effect,
    effectId,
    formName,
    formDescription,
    formFadeDuration,
    formCompositionMode,
    formOnCueChange,
    formWaveform,
    formFrequency,
    formAmplitude,
    formOffset,
    formMasterValue,
    isActive,
    isEditing,
    streamDock,
  ]);

  // Handlers
  const handleSave = useCallback(() => {
    if (!effect) return;

    const input: Record<string, unknown> = {
      name: formName,
      description: formDescription || undefined,
      fadeDuration: formFadeDuration,
      compositionMode: formCompositionMode,
      onCueChange: formOnCueChange,
    };

    if (effect.effectType === EffectType.Waveform) {
      input.waveform = formWaveform;
      input.frequency = formFrequency;
      input.amplitude = formAmplitude;
      input.offset = formOffset;
    } else if (effect.effectType === EffectType.Master) {
      input.masterValue = formMasterValue;
    }

    updateEffect({
      variables: { id: effectId, input },
    });
  }, [
    effect,
    effectId,
    formName,
    formDescription,
    formWaveform,
    formFrequency,
    formAmplitude,
    formOffset,
    formFadeDuration,
    formCompositionMode,
    formOnCueChange,
    formMasterValue,
    updateEffect,
  ]);

  const handleAddFixture = useCallback(
    (fixtureId: string) => {
      addFixture({
        variables: {
          input: {
            effectId,
            fixtureId,
            phaseOffset: 0,
            amplitudeScale: 1.0,
          },
        },
      });
    },
    [effectId, addFixture],
  );

  const handleRemoveFixture = useCallback(
    (fixtureId: string) => {
      removeFixture({
        variables: { effectId, fixtureId },
      });
    },
    [effectId, removeFixture],
  );

  const handleToggleActive = useCallback(() => {
    if (isActive) {
      stopEffect({ variables: { effectId, fadeTime: 1.0 } });
    } else {
      activateEffect({ variables: { effectId, fadeTime: 1.0 } });
    }
  }, [isActive, effectId, activateEffect, stopEffect]);

  const handleToggleFixtureExpand = useCallback((fixtureId: string) => {
    setExpandedFixtures((prev) => {
      const next = new Set(prev);
      if (next.has(fixtureId)) {
        next.delete(fixtureId);
      } else {
        next.add(fixtureId);
      }
      return next;
    });
  }, []);

  const handleUpdateEffectFixture = useCallback(
    (effectFixtureId: string, phaseOffset: number, amplitudeScale: number, effectOrder: number) => {
      updateEffectFixture({
        variables: {
          id: effectFixtureId,
          input: { phaseOffset, amplitudeScale, effectOrder },
        },
      });
    },
    [updateEffectFixture],
  );

  const handleUpdateChannel = useCallback(
    (channelId: string, amplitudeScale: number, frequencyScale: number, minValue?: number | null, maxValue?: number | null) => {
      updateEffectChannel({
        variables: {
          id: channelId,
          input: {
            amplitudeScale,
            frequencyScale,
            minValue: minValue ?? null,
            maxValue: maxValue ?? null,
          },
        },
      });
    },
    [updateEffectChannel],
  );

  const handleRemoveChannel = useCallback(
    (channelId: string) => {
      removeChannelFromEffectFixture({
        variables: { id: channelId },
      });
    },
    [removeChannelFromEffectFixture],
  );

  // Handle fixture reorder via drag and drop
  const handleFixtureDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !sortedFixtures.length) return;

      const oldIndex = sortedFixtures.findIndex((f) => f.id === active.id);
      const newIndex = sortedFixtures.findIndex((f) => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Get the reordered list
      const reorderedFixtures = arrayMove(sortedFixtures, oldIndex, newIndex);

      // Update each fixture's effectOrder to match its new position
      try {
        for (let i = 0; i < reorderedFixtures.length; i++) {
          const fixture = reorderedFixtures[i];
          if (fixture.effectOrder !== i) {
            await updateEffectFixture({
              variables: {
                id: fixture.id,
                input: {
                  phaseOffset: fixture.phaseOffset ?? 0,
                  amplitudeScale: fixture.amplitudeScale ?? 1,
                  effectOrder: i,
                },
              },
            });
          }
        }
        refetch();
      } catch (error) {
        console.error('Error reordering fixtures:', error);
      }
    },
    [sortedFixtures, updateEffectFixture, refetch],
  );

  // Distribute phase evenly across all fixtures based on their order
  const handleDistributePhase = useCallback(
    async () => {
      if (!sortedFixtures.length) return;

      const phaseIncrement = 360 / sortedFixtures.length;

      try {
        for (let i = 0; i < sortedFixtures.length; i++) {
          const fixture = sortedFixtures[i];
          const newPhase = i * phaseIncrement;
          // Only update if phase is different
          if ((fixture.phaseOffset ?? 0) !== newPhase) {
            await updateEffectFixture({
              variables: {
                id: fixture.id,
                input: {
                  phaseOffset: newPhase,
                  amplitudeScale: fixture.amplitudeScale ?? 1,
                  effectOrder: fixture.effectOrder ?? i,
                },
              },
            });
          }
        }
        refetch();
      } catch (error) {
        console.error('Error distributing phase:', error);
      }
    },
    [sortedFixtures, updateEffectFixture, refetch],
  );

  // Toggle all channels of a given type across all fixtures
  const handleToggleChannelType = useCallback(
    async (channelType: ChannelType, enable: boolean) => {
      const info = channelTypeInfo.get(channelType);
      if (!info) return;

      try {
        if (enable) {
          // Add channels for fixtures that don't have this type active
          const toAdd = info.fixtureChannels.filter((fc) => !fc.isActive);
          for (const fc of toAdd) {
            await addChannelToEffectFixture({
              variables: {
                effectFixtureId: fc.effectFixtureId,
                input: {
                  channelOffset: fc.channelOffset,
                  channelType,
                  amplitudeScale: 1.0,
                  frequencyScale: 1.0,
                },
              },
            });
          }
        } else {
          // Remove channels for fixtures that have this type active
          const toRemove = info.fixtureChannels.filter((fc) => fc.isActive && fc.effectChannelId);
          for (const fc of toRemove) {
            await removeChannelFromEffectFixture({
              variables: { id: fc.effectChannelId! },
            });
          }
        }
        refetch();
      } catch (error) {
        console.error('Error toggling channel type:', error);
      }
    },
    [channelTypeInfo, addChannelToEffectFixture, removeChannelFromEffectFixture, refetch],
  );

  // Toggle a single fixture's channel of a given type
  const handleToggleSingleFixtureChannel = useCallback(
    async (channelType: ChannelType, effectFixtureId: string, channelOffset: number, isActive: boolean, effectChannelId?: string) => {
      try {
        if (isActive && effectChannelId) {
          // Remove the channel
          await removeChannelFromEffectFixture({
            variables: { id: effectChannelId },
          });
        } else {
          // Add the channel
          await addChannelToEffectFixture({
            variables: {
              effectFixtureId,
              input: {
                channelOffset,
                channelType,
                amplitudeScale: 1.0,
                frequencyScale: 1.0,
              },
            },
          });
        }
        refetch();
      } catch (error) {
        console.error('Error toggling single channel:', error);
      }
    },
    [addChannelToEffectFixture, removeChannelFromEffectFixture, refetch],
  );

  // Bulk update all channels of a type with new amp/freq values and optional min/max
  const handleBulkUpdateChannelType = useCallback(
    async (channelType: ChannelType, amplitudeScale: number, frequencyScale: number, minValue?: number | null, maxValue?: number | null) => {
      const info = channelTypeInfo.get(channelType);
      if (!info) return;

      try {
        // Update all active channels of this type
        const activeChannels = info.fixtureChannels.filter((fc) => fc.isActive && fc.effectChannelId);
        for (const fc of activeChannels) {
          await updateEffectChannel({
            variables: {
              id: fc.effectChannelId!,
              input: {
                amplitudeScale,
                frequencyScale,
                minValue: minValue ?? null,
                maxValue: maxValue ?? null,
              },
            },
          });
        }
        refetch();
      } catch (error) {
        console.error('Error bulk updating channel type:', error);
      }
    },
    [channelTypeInfo, updateEffectChannel, refetch],
  );

  // Labels for enums
  const effectTypeLabels: Record<EffectType, string> = {
    [EffectType.Waveform]: 'Waveform (LFO)',
    [EffectType.Crossfade]: 'Crossfade',
    [EffectType.Static]: 'Static',
    [EffectType.Master]: 'Master',
  };

  const priorityBandLabels: Record<PriorityBand, string> = {
    [PriorityBand.Base]: 'Base (0)',
    [PriorityBand.User]: 'User (1)',
    [PriorityBand.Cue]: 'Cue (2)',
    [PriorityBand.System]: 'System (3)',
  };

  const waveformLabels: Record<WaveformType, string> = {
    [WaveformType.Sine]: 'Sine',
    [WaveformType.Cosine]: 'Cosine',
    [WaveformType.Square]: 'Square',
    [WaveformType.Sawtooth]: 'Sawtooth',
    [WaveformType.Triangle]: 'Triangle',
    [WaveformType.Random]: 'Random',
  };

  const compositionModeLabels: Record<CompositionMode, string> = {
    [CompositionMode.Override]: 'Override',
    [CompositionMode.Additive]: 'Additive',
    [CompositionMode.Multiply]: 'Multiply',
  };

  const transitionBehaviorLabels: Record<TransitionBehavior, string> = {
    [TransitionBehavior.FadeOut]: 'Fade Out',
    [TransitionBehavior.Persist]: 'Persist',
    [TransitionBehavior.SnapOff]: 'Snap Off',
    [TransitionBehavior.CrossfadeParams]: 'Crossfade Params',
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading effect...</div>
      </div>
    );
  }

  if (error || !effect) {
    return (
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error?.message || 'Effect not found'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close editor"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{effect.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  effect.effectType === EffectType.Waveform
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : effect.effectType === EffectType.Master
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : effect.effectType === EffectType.Crossfade
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {effectTypeLabels[effect.effectType]}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded">
                {priorityBandLabels[effect.priorityBand]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Activate/Stop button */}
          <button
            onClick={handleToggleActive}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isActive ? 'Stop' : 'Activate'}
          </button>
          {/* Edit/Save button */}
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={updating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm"
            >
              Edit
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-auto p-4 ${isMobile ? '' : 'grid grid-cols-2 gap-6 max-w-6xl mx-auto w-full'}`}
      >
        {/* Left Column - Effect Properties */}
        <div className="space-y-6">
          {/* Basic Info */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">{effect.name}</span>
                </div>
                {effect.description && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {effect.description}
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Waveform Parameters (only for WAVEFORM type) */}
          {effect.effectType === EffectType.Waveform && (
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Waveform Parameters
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Waveform Type
                    </label>
                    <select
                      value={formWaveform}
                      onChange={(e) => setFormWaveform(e.target.value as WaveformType)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      {Object.entries(waveformLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequency (Hz)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.01"
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amplitude (%)
                      </label>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="100"
                        value={formAmplitude}
                        onChange={(e) => setFormAmplitude(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Offset (%)
                      </label>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="100"
                        value={formOffset}
                        onChange={(e) => setFormOffset(parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  {/* Waveform Preview */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Preview
                    </label>
                    <WaveformPreview
                      waveform={formWaveform}
                      frequency={formFrequency}
                      amplitude={formAmplitude / 100} // Convert percentage to 0-1
                      offset={formOffset / 100} // Convert percentage to 0-1
                      width={300}
                      height={100}
                      animated={true}
                      color="#8b5cf6"
                      className="rounded border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Waveform:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {effect.waveform ? waveformLabels[effect.waveform] : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {effect.frequency?.toFixed(2) || 'N/A'} Hz
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Amplitude:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {effect.amplitude?.toFixed(0) || 'N/A'}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Offset:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {effect.offset?.toFixed(0) || 'N/A'}%
                      </span>
                    </div>
                  </div>
                  {/* Waveform Preview */}
                  {effect.waveform && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <WaveformPreview
                        waveform={effect.waveform}
                        frequency={effect.frequency || 1}
                        amplitude={(effect.amplitude || 100) / 100} // Convert percentage to 0-1
                        offset={(effect.offset || 50) / 100} // Convert percentage to 0-1
                        width={280}
                        height={80}
                        animated={isActive}
                        color="#8b5cf6"
                        className="rounded border border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Master Value (only for MASTER type) */}
          {effect.effectType === EffectType.Master && (
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Master Value
              </h2>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formMasterValue}
                    onChange={(e) => setFormMasterValue(parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              ) : (
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Master Value:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {effect.masterValue?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Transition Settings */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Transition Settings
            </h2>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Composition Mode
                  </label>
                  <select
                    value={formCompositionMode}
                    onChange={(e) => setFormCompositionMode(e.target.value as CompositionMode)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.entries(compositionModeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    On Cue Change
                  </label>
                  <select
                    value={formOnCueChange}
                    onChange={(e) => setFormOnCueChange(e.target.value as TransitionBehavior)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.entries(transitionBehaviorLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fade Duration (s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formFadeDuration}
                    onChange={(e) => setFormFadeDuration(parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Composition:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {compositionModeLabels[effect.compositionMode]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">On Cue Change:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {transitionBehaviorLabels[effect.onCueChange]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Fade Duration:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {effect.fadeDuration}s
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Fixtures */}
        <div className={isMobile ? 'mt-6' : ''}>
          {/* Channel Type Selector - Quick toggle channels by type */}
          {effect.fixtures.length > 0 && sortedChannelTypes.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Quick Channel Selection
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Click to toggle, expand to edit Amp/Freq for all fixtures
              </p>
              <div className="space-y-2">
                {sortedChannelTypes.map((channelType) => {
                  const info = channelTypeInfo.get(channelType);
                  if (!info) return null;

                  const activeCount = info.fixtureChannels.filter((fc) => fc.isActive).length;
                  const totalCount = info.fixtureChannels.length;
                  const isFullyActive = activeCount === totalCount;
                  const isPartiallyActive = activeCount > 0 && activeCount < totalCount;
                  const hasActiveChannels = activeCount > 0;
                  const color = getChannelTypeColor(channelType);
                  const abbrev = getChannelTypeAbbreviation(channelType);
                  const isExpanded = expandedChannelType === channelType;

                  return (
                    <div
                      key={channelType}
                      className={`
                        rounded-lg border-2 transition-all
                        ${
                          isFullyActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : isPartiallyActive
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        }
                      `}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-3 py-2">
                        {/* Toggle checkbox */}
                        <button
                          onClick={() => handleToggleChannelType(channelType, !isFullyActive)}
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                            ${
                              isFullyActive
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : isPartiallyActive
                                  ? 'bg-yellow-400 border-yellow-400 text-white'
                                  : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                            }
                          `}
                          title={isFullyActive ? 'Disable all' : 'Enable all'}
                        >
                          {isFullyActive && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isPartiallyActive && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>

                        {/* Color indicator */}
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />

                        {/* Label */}
                        <span className={`text-sm font-medium flex-1 ${
                          isFullyActive
                            ? 'text-blue-700 dark:text-blue-300'
                            : isPartiallyActive
                              ? 'text-yellow-700 dark:text-yellow-300'
                              : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {abbrev}
                        </span>

                        {/* Count */}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activeCount}/{totalCount}
                        </span>

                        {/* Expand button (only if has active channels) */}
                        {hasActiveChannels && (
                          <button
                            onClick={() => setExpandedChannelType(isExpanded ? null : channelType)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title={isExpanded ? 'Collapse' : 'Edit Amp/Freq'}
                          >
                            <svg
                              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Expanded editing panel */}
                      {isExpanded && (
                        <ChannelTypeBulkEditor
                          fixtureChannels={info.fixtureChannels}
                          onApply={(ampScale, freqScale, minValue, maxValue) => handleBulkUpdateChannelType(channelType, ampScale, freqScale, minValue, maxValue)}
                          onToggleFixture={(effectFixtureId, channelOffset, isActive, effectChannelId) =>
                            handleToggleSingleFixtureChannel(channelType, effectFixtureId, channelOffset, isActive, effectChannelId)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Bulk actions */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  onClick={() => {
                    sortedChannelTypes.forEach((ct) => handleToggleChannelType(ct, true));
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => {
                    sortedChannelTypes.forEach((ct) => handleToggleChannelType(ct, false));
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Disable All
                </button>
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Assigned Fixtures ({effect.fixtures.length})
              </h2>
              <div className="flex items-center gap-2">
                {sortedFixtures.length >= 2 && (
                  <button
                    onClick={handleDistributePhase}
                    className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    title={`Distribute phases evenly: ${sortedFixtures.map((_, i) => `${Math.round(i * 360 / sortedFixtures.length)}°`).join(', ')}`}
                  >
                    Distribute Phase
                  </button>
                )}
                <button
                  onClick={() => setShowAddFixture(!showAddFixture)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {showAddFixture ? 'Cancel' : 'Add Fixture'}
                </button>
              </div>
            </div>

            {/* Add Fixture Panel */}
            {showAddFixture && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Fixtures
                </h3>
                {availableFixtures.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {fixture.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {fixture.manufacturer} {fixture.model}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddFixture(fixture.id)}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    All fixtures are already assigned to this effect.
                  </p>
                )}
              </div>
            )}

            {/* Assigned Fixtures List */}
            {sortedFixtures.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFixtureDragEnd}
              >
                <SortableContext
                  items={sortedFixtures.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedFixtures.map((ef) => {
                      const isExpanded = expandedFixtures.has(ef.id);
                      const isEditingThis = editingFixtureId === ef.id;
                      return (
                        <SortableFixtureItem key={ef.id} id={ef.id}>
                          {({ dragHandleProps, isDragging }) => (
                            <div
                              className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden ${
                                isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
                              }`}
                            >
                              {/* Fixture Header */}
                              <div className="flex items-center justify-between p-3">
                                {/* Drag Handle */}
                                <div
                                  {...dragHandleProps}
                                  className="p-1.5 mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                  title="Drag to reorder"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                                <button
                                  onClick={() => handleToggleFixtureExpand(ef.id)}
                                  className="flex-1 flex items-center gap-2 text-left"
                                >
                                  <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {ef.fixture.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {ef.fixture.manufacturer} {ef.fixture.model} | U{ef.fixture.universe} Ch{ef.fixture.startChannel}
                                    </div>
                                  </div>
                                </button>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {ef.channels?.length || 0} ch
                                  </span>
                                  <button
                                    onClick={() => handleRemoveFixture(ef.fixtureId)}
                                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    aria-label={`Remove ${ef.fixture.name}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 pt-3 space-y-4">
                          {/* Fixture Settings */}
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                Fixture Settings
                              </h4>
                              {!isEditingThis && (
                                <button
                                  onClick={() => setEditingFixtureId(ef.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            {isEditingThis ? (
                              <FixtureSettingsEditor
                                effectFixture={ef}
                                onSave={(phaseOffset, amplitudeScale, effectOrder) => {
                                  handleUpdateEffectFixture(ef.id, phaseOffset, amplitudeScale, effectOrder);
                                }}
                                onCancel={() => setEditingFixtureId(null)}
                              />
                            ) : (
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Phase:</span>
                                  <span className="ml-1 text-gray-900 dark:text-white">
                                    {(ef.phaseOffset ?? 0).toFixed(0)}°
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Amp:</span>
                                  <span className="ml-1 text-gray-900 dark:text-white">
                                    {((ef.amplitudeScale ?? 1) * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Order:</span>
                                  <span className="ml-1 text-gray-900 dark:text-white">
                                    {ef.effectOrder ?? 0}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Channels Section */}
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">
                              Channels
                            </h4>
                            {/* Channel type grid for this fixture */}
                            {ef.fixture.channels && ef.fixture.channels.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {ef.fixture.channels.map((fixtureCh) => {
                                  // Check if this channel is active in the effect
                                  const activeEffectChannel = ef.channels?.find(
                                    (ec) => ec.channelOffset === fixtureCh.offset || ec.channelType === fixtureCh.type
                                  );
                                  const isActive = !!activeEffectChannel;
                                  const color = getChannelTypeColor(fixtureCh.type);
                                  const abbrev = getChannelTypeAbbreviation(fixtureCh.type);

                                  return (
                                    <button
                                      key={fixtureCh.id}
                                      onClick={() =>
                                        handleToggleSingleFixtureChannel(
                                          fixtureCh.type,
                                          ef.id,
                                          fixtureCh.offset,
                                          isActive,
                                          activeEffectChannel?.id
                                        )
                                      }
                                      className={`
                                        flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all
                                        ${
                                          isActive
                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }
                                      `}
                                      title={`${fixtureCh.name} (offset ${fixtureCh.offset})`}
                                    >
                                      <span
                                        className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                      />
                                      <span>{abbrev}</span>
                                      {isActive && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                Fixture has no channel definitions.
                              </p>
                            )}
                            {/* Show active channels with advanced settings */}
                            {ef.channels && ef.channels.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                  Active Channel Settings
                                </h5>
                                <div className="space-y-2">
                                  {ef.channels.map((ch) => {
                                    // Find the matching fixture channel for the name
                                    const fixtureCh = ef.fixture.channels?.find(
                                      (fc) => fc.offset === ch.channelOffset || fc.type === ch.channelType
                                    );
                                    return (
                                      <ChannelEditor
                                        key={ch.id}
                                        channel={ch}
                                        channelName={fixtureCh?.name}
                                        channelColor={fixtureCh ? getChannelTypeColor(fixtureCh.type) : undefined}
                                        onUpdate={(amplitudeScale, frequencyScale, minValue, maxValue) => {
                                          handleUpdateChannel(ch.id, amplitudeScale, frequencyScale, minValue, maxValue);
                                        }}
                                        onRemove={() => handleRemoveChannel(ch.id)}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                            </div>
                          )}
                        </SortableFixtureItem>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <p className="text-sm">No fixtures assigned</p>
                <p className="text-xs mt-1">Click &quot;Add Fixture&quot; to assign fixtures to this effect</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Cancel edit button */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-end gap-2">
          <button
            onClick={() => {
              setIsEditing(false);
              // Reset form to original values
              setFormName(effect.name);
              setFormDescription(effect.description || '');
              setFormWaveform(effect.waveform || WaveformType.Sine);
              setFormFrequency(effect.frequency || 1.0);
              setFormAmplitude(effect.amplitude || 100.0);
              setFormOffset(effect.offset || 50.0);
              setFormFadeDuration(effect.fadeDuration || 1.0);
              setFormCompositionMode(effect.compositionMode || CompositionMode.Override);
              setFormOnCueChange(effect.onCueChange || TransitionBehavior.FadeOut);
              setFormMasterValue(effect.masterValue || 1.0);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-component for editing fixture settings
function FixtureSettingsEditor({
  effectFixture,
  onSave,
  onCancel,
}: {
  effectFixture: EffectFixture;
  onSave: (phaseOffset: number, amplitudeScale: number, effectOrder: number) => void;
  onCancel: () => void;
}) {
  const [phaseOffset, setPhaseOffset] = useState(effectFixture.phaseOffset ?? 0);
  const [amplitudeScale, setAmplitudeScale] = useState((effectFixture.amplitudeScale ?? 1) * 100);
  const [effectOrder, setEffectOrder] = useState(effectFixture.effectOrder ?? 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phase (°)</label>
          <input
            type="number"
            value={phaseOffset}
            onChange={(e) => setPhaseOffset(parseFloat(e.target.value) || 0)}
            min={0}
            max={360}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amp (%)</label>
          <input
            type="number"
            value={amplitudeScale}
            onChange={(e) => setAmplitudeScale(parseFloat(e.target.value) || 0)}
            min={0}
            max={200}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Order</label>
          <input
            type="number"
            value={effectOrder}
            onChange={(e) => setEffectOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(phaseOffset, amplitudeScale / 100, effectOrder)}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Sub-component for editing channel settings
function ChannelEditor({
  channel,
  channelName,
  channelColor,
  onUpdate,
  onRemove,
}: {
  channel: EffectChannel;
  channelName?: string;
  channelColor?: string;
  onUpdate: (amplitudeScale: number, frequencyScale: number, minValue?: number | null, maxValue?: number | null) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Determine if channel has stored min/max values
  const hasStoredMinMax = channel.minValue != null && channel.maxValue != null;

  // Initialize state from channel data, computing min/max from ampScale if not stored
  const getInitialMinMax = () => {
    if (hasStoredMinMax) {
      return { min: channel.minValue!, max: channel.maxValue! };
    }
    // Compute from amplitude scale: assume base effect has offset=50, amplitude=50
    // With ampScale, effective amplitude = 50 * ampScale
    // So min = 50 - (50 * ampScale), max = 50 + (50 * ampScale)
    const ampScale = channel.amplitudeScale ?? 1;
    const effectiveAmplitude = 50 * ampScale;
    return {
      min: Math.max(0, 50 - effectiveAmplitude),
      max: Math.min(100, 50 + effectiveAmplitude)
    };
  };

  const initialMinMax = getInitialMinMax();
  const [amplitudeScale, setAmplitudeScale] = useState((channel.amplitudeScale ?? 1) * 100);
  const [frequencyScale, setFrequencyScale] = useState((channel.frequencyScale ?? 1) * 100);
  const [useMinMax, setUseMinMax] = useState(hasStoredMinMax);
  const [minValue, setMinValue] = useState(initialMinMax.min);
  const [maxValue, setMaxValue] = useState(initialMinMax.max);

  // Calculate offset/amplitude from min/max for display
  const calculatedOffset = (minValue + maxValue) / 2;
  const calculatedAmplitude = (maxValue - minValue) / 2;

  const channelLabel = channelName
    ? channelName
    : channel.channelType
      ? channel.channelType
      : channel.channelOffset !== null && channel.channelOffset !== undefined
        ? `Offset ${channel.channelOffset}`
        : 'All';

  // Determine if this channel uses min/max mode
  const hasMinMax = channel.minValue != null && channel.maxValue != null;

  if (isEditing) {
    return (
      <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            {channelColor && (
              <span
                className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
                style={{ backgroundColor: channelColor }}
              />
            )}
            {channelLabel}
          </div>
          {/* Mode toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-xs text-gray-500 dark:text-gray-400">Use Min/Max</span>
            <input
              type="checkbox"
              checked={useMinMax}
              onChange={(e) => setUseMinMax(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </label>
        </div>

        {useMinMax ? (
          <>
            {/* Min/Max inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min (%)</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max (%)</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            {/* Calculated offset/amplitude display */}
            <div className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
              <span className="font-medium">Calculated:</span>{' '}
              Offset {calculatedOffset.toFixed(1)}%, Amplitude {calculatedAmplitude.toFixed(1)}%
            </div>
            {/* Freq scale in min/max mode */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Freq Scale (%)</label>
              <input
                type="number"
                value={frequencyScale}
                onChange={(e) => setFrequencyScale(parseFloat(e.target.value) || 0)}
                min={0}
                max={500}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </>
        ) : (
          /* Traditional amp/freq scale mode */
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amp Scale (%)</label>
              <input
                type="number"
                value={amplitudeScale}
                onChange={(e) => setAmplitudeScale(parseFloat(e.target.value) || 0)}
                min={0}
                max={200}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Freq Scale (%)</label>
              <input
                type="number"
                value={frequencyScale}
                onChange={(e) => setFrequencyScale(parseFloat(e.target.value) || 0)}
                min={0}
                max={500}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (useMinMax) {
                // When using min/max, pass them along (ampScale is ignored since backend calculates from min/max)
                onUpdate(amplitudeScale / 100, frequencyScale / 100, minValue, maxValue);
              } else {
                // When not using min/max, clear them
                onUpdate(amplitudeScale / 100, frequencyScale / 100, null, null);
              }
              setIsEditing(false);
            }}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
      <div className="flex items-center gap-3">
        {channelColor && (
          <span
            className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"
            style={{ backgroundColor: channelColor }}
          />
        )}
        <span className="font-medium text-gray-700 dark:text-gray-300">{channelLabel}</span>
        {hasMinMax ? (
          <>
            <span className="text-blue-600 dark:text-blue-400">
              {channel.minValue?.toFixed(0)}-{channel.maxValue?.toFixed(0)}%
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              (Off: {((channel.minValue! + channel.maxValue!) / 2).toFixed(0)}%, Amp: {((channel.maxValue! - channel.minValue!) / 2).toFixed(0)}%)
            </span>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
            Amp: {((channel.amplitudeScale ?? 1) * 100).toFixed(0)}%
          </span>
        )}
        <span className="text-gray-500 dark:text-gray-400">
          Freq: {((channel.frequencyScale ?? 1) * 100).toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          aria-label="Edit channel"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          aria-label="Remove channel"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Sub-component for bulk editing channel type amp/freq across all fixtures
function ChannelTypeBulkEditor({
  fixtureChannels,
  onApply,
  onToggleFixture,
}: {
  fixtureChannels: Array<{
    effectFixtureId: string;
    fixtureName: string;
    channelOffset: number;
    channelName: string;
    isActive: boolean;
    effectChannelId?: string;
    amplitudeScale?: number | null;
    frequencyScale?: number | null;
    minValue?: number | null;
    maxValue?: number | null;
  }>;
  onApply: (amplitudeScale: number, frequencyScale: number, minValue?: number | null, maxValue?: number | null) => void;
  onToggleFixture: (effectFixtureId: string, channelOffset: number, isActive: boolean, effectChannelId?: string) => void;
}) {
  const activeChannels = fixtureChannels.filter((fc) => fc.isActive);
  const inactiveChannels = fixtureChannels.filter((fc) => !fc.isActive);

  // Get first active channel's values for initialization
  const firstActiveChannel = activeChannels[0];
  const hasStoredMinMax = firstActiveChannel?.minValue != null && firstActiveChannel?.maxValue != null;

  // Compute initial min/max from amplitude scale if not stored
  const getInitialMinMax = () => {
    if (hasStoredMinMax) {
      return { min: firstActiveChannel!.minValue!, max: firstActiveChannel!.maxValue! };
    }
    // Compute from amplitude scale: assume base effect has offset=50, amplitude=50
    // With ampScale, effective amplitude = 50 * ampScale
    // So min = 50 - (50 * ampScale), max = 50 + (50 * ampScale)
    const ampScale = firstActiveChannel?.amplitudeScale ?? 1;
    const effectiveAmplitude = 50 * ampScale;
    return {
      min: Math.max(0, 50 - effectiveAmplitude),
      max: Math.min(100, 50 + effectiveAmplitude)
    };
  };

  const initialMinMax = getInitialMinMax();
  const initialAmpScale = (firstActiveChannel?.amplitudeScale ?? 1) * 100;
  const initialFreqScale = (firstActiveChannel?.frequencyScale ?? 1) * 100;

  const [useMinMax, setUseMinMax] = useState(hasStoredMinMax);
  const [ampScale, setAmpScale] = useState(initialAmpScale);
  const [freqScale, setFreqScale] = useState(initialFreqScale);
  const [minValue, setMinValue] = useState(initialMinMax.min);
  const [maxValue, setMaxValue] = useState(initialMinMax.max);

  // Calculate offset/amplitude from min/max for display
  const calculatedOffset = (minValue + maxValue) / 2;
  const calculatedAmplitude = (maxValue - minValue) / 2;

  return (
    <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
      {/* Fixture toggles - show all fixtures with checkboxes */}
      <div className="mt-2 mb-3">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Fixtures ({activeChannels.length}/{fixtureChannels.length} active):
        </p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {/* Active fixtures first */}
          {activeChannels.map((fc) => (
            <label
              key={fc.effectFixtureId}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={true}
                onChange={() => onToggleFixture(fc.effectFixtureId, fc.channelOffset, true, fc.effectChannelId)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                {fc.fixtureName}
              </span>
              {/* Show if fixture has custom values different from group */}
              {(fc.minValue != null || fc.maxValue != null || (fc.amplitudeScale != null && fc.amplitudeScale !== 1)) && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400" title="Has custom settings">
                  *
                </span>
              )}
            </label>
          ))}
          {/* Inactive fixtures */}
          {inactiveChannels.map((fc) => (
            <label
              key={fc.effectFixtureId}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer opacity-60"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => onToggleFixture(fc.effectFixtureId, fc.channelOffset, false, undefined)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                {fc.fixtureName}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useMinMax}
            onChange={(e) => setUseMinMax(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Use Min/Max Range</span>
        </label>
      </div>

      {useMinMax ? (
        <>
          {/* Min/Max inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Min (%)
              </label>
              <input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={5}
                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Max (%)
              </label>
              <input
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={5}
                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          {/* Calculated offset/amplitude display */}
          <div className="mt-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
            <span className="font-medium">Calculated:</span>{' '}
            Offset {calculatedOffset.toFixed(1)}%, Amplitude {calculatedAmplitude.toFixed(1)}%
          </div>
          {/* Freq scale in min/max mode */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Freq Scale (%)
            </label>
            <input
              type="number"
              value={freqScale}
              onChange={(e) => setFreqScale(parseFloat(e.target.value) || 0)}
              min={0}
              max={500}
              step={10}
              className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </>
      ) : (
        /* Amp/Freq inputs */
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Amp Scale (%)
            </label>
            <input
              type="number"
              value={ampScale}
              onChange={(e) => setAmpScale(parseFloat(e.target.value) || 0)}
              min={0}
              max={200}
              step={10}
              className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Freq Scale (%)
            </label>
            <input
              type="number"
              value={freqScale}
              onChange={(e) => setFreqScale(parseFloat(e.target.value) || 0)}
              min={0}
              max={500}
              step={10}
              className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Apply button */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => {
            if (useMinMax) {
              onApply(ampScale / 100, freqScale / 100, minValue, maxValue);
            } else {
              onApply(ampScale / 100, freqScale / 100, null, null);
            }
          }}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Apply to All {activeChannels.length} Fixture{activeChannels.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

// Wrapper component for sortable fixture items
function SortableFixtureItem({
  id,
  children,
}: {
  id: string;
  children: (props: {
    dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
    isDragging: boolean;
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}
