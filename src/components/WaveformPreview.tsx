'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { WaveformType } from '@/generated/graphql';

interface WaveformPreviewProps {
  /** The waveform type to display */
  waveform: WaveformType;
  /** Frequency in Hz (affects how many cycles are shown) */
  frequency?: number;
  /** Amplitude (0-1, affects height of wave) */
  amplitude?: number;
  /** Offset (0-1, shifts baseline up) */
  offset?: number;
  /** Width of the preview in pixels */
  width?: number;
  /** Height of the preview in pixels */
  height?: number;
  /** Whether to animate the waveform */
  animated?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Primary color for the waveform line */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show grid lines */
  showGrid?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * Generates waveform sample values based on waveform type
 */
function generateWaveformValue(
  waveform: WaveformType,
  phase: number, // 0-1 representing position in cycle
  amplitude: number,
  offset: number,
): number {
  let value: number;

  switch (waveform) {
    case WaveformType.Sine:
      value = Math.sin(phase * 2 * Math.PI);
      break;
    case WaveformType.Cosine:
      value = Math.cos(phase * 2 * Math.PI);
      break;
    case WaveformType.Square:
      value = phase < 0.5 ? 1 : -1;
      break;
    case WaveformType.Sawtooth:
      value = 2 * (phase - Math.floor(phase + 0.5));
      break;
    case WaveformType.Triangle:
      value = 1 - 4 * Math.abs(Math.round(phase) - phase);
      break;
    case WaveformType.Random:
      // Use a deterministic random based on phase for consistent rendering
      const seed = Math.floor(phase * 100);
      value = Math.sin(seed * 12.9898) * 43758.5453;
      value = (value - Math.floor(value)) * 2 - 1;
      break;
    default:
      value = 0;
  }

  // Apply amplitude and offset
  return offset + amplitude * value * 0.5;
}

/**
 * WaveformPreview component displays a visual representation of different waveform types.
 * Can be static or animated to show the oscillating effect.
 */
export default function WaveformPreview({
  waveform,
  frequency = 1,
  amplitude = 1,
  offset = 0.5,
  width = 200,
  height = 80,
  animated = false,
  animationSpeed = 1,
  color = '#8b5cf6', // purple-500
  backgroundColor = 'transparent',
  showGrid = true,
  className = '',
}: WaveformPreviewProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    if (!animated) {
      setAnimationPhase(0);
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setAnimationPhase((prev) => (prev + deltaTime * frequency * animationSpeed) % 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [animated, frequency, animationSpeed]);

  // Generate path data for the waveform
  const pathData = useMemo(() => {
    const samples = 100;
    const cyclesShown = Math.max(1, Math.min(frequency * 2, 4)); // Show 1-4 cycles based on frequency
    const points: string[] = [];
    const padding = 4;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    for (let i = 0; i <= samples; i++) {
      const x = padding + (i / samples) * effectiveWidth;
      const phase = (i / samples) * cyclesShown + animationPhase;
      const value = generateWaveformValue(waveform, phase, amplitude, offset);
      // Invert y because SVG y increases downward
      const y = padding + effectiveHeight * (1 - value);

      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    return points.join(' ');
  }, [waveform, frequency, amplitude, offset, width, height, animationPhase]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return null;

    const padding = 4;
    const effectiveWidth = width - padding * 2;
    const lines: JSX.Element[] = [];

    // Horizontal center line (baseline)
    lines.push(
      <line
        key="h-center"
        x1={padding}
        y1={height / 2}
        x2={width - padding}
        y2={height / 2}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={1}
        strokeDasharray="4 4"
      />,
    );

    // Vertical lines at quarter points
    for (let i = 0; i <= 4; i++) {
      const x = padding + (i / 4) * effectiveWidth;
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding}
          x2={x}
          y2={height - padding}
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />,
      );
    }

    // Top and bottom boundary lines
    lines.push(
      <line
        key="h-top"
        x1={padding}
        y1={padding}
        x2={width - padding}
        y2={padding}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={1}
      />,
    );
    lines.push(
      <line
        key="h-bottom"
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={1}
      />,
    );

    return lines;
  }, [showGrid, width, height]);

  // Waveform type label
  const waveformLabel = useMemo(() => {
    switch (waveform) {
      case WaveformType.Sine:
        return '~';
      case WaveformType.Cosine:
        return '∿';
      case WaveformType.Square:
        return '⊏⊐';
      case WaveformType.Sawtooth:
        return '/|';
      case WaveformType.Triangle:
        return '/\\';
      case WaveformType.Random:
        return '~?';
      default:
        return '-';
    }
  }, [waveform]);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width, height, backgroundColor }}
      role="img"
      aria-label={`${waveform} waveform preview`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-gray-400 dark:text-gray-600"
      >
        {/* Grid lines */}
        {gridLines}

        {/* Waveform path */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Offset indicator line if offset is not 0.5 */}
        {Math.abs(offset - 0.5) > 0.01 && (
          <line
            x1={4}
            y1={height - 4 - (height - 8) * offset}
            x2={width - 4}
            y2={height - 4 - (height - 8) * offset}
            stroke={color}
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {/* Waveform type indicator */}
      <div
        className="absolute bottom-1 right-1 text-xs font-mono text-gray-400 dark:text-gray-500 opacity-50"
        aria-hidden="true"
      >
        {waveformLabel}
      </div>
    </div>
  );
}

/**
 * Compact inline waveform icon for use in lists and badges
 */
export function WaveformIcon({
  waveform,
  size = 24,
  color = 'currentColor',
  className = '',
}: {
  waveform: WaveformType;
  size?: number;
  color?: string;
  className?: string;
}) {
  const pathData = useMemo(() => {
    const padding = 2;
    const effectiveSize = size - padding * 2;
    const samples = 32;
    const points: string[] = [];

    for (let i = 0; i <= samples; i++) {
      const x = padding + (i / samples) * effectiveSize;
      const phase = i / samples;
      const value = generateWaveformValue(waveform, phase, 1, 0.5);
      const y = padding + effectiveSize * (1 - value);

      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    return points.join(' ');
  }, [waveform, size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`${waveform} waveform`}
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
