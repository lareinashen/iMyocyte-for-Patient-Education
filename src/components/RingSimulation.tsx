/**
 * SVG renderer for the ring of cardiac cells. Cell fill colour encodes
 * the cell's state; a thin outline distinguishes damaged from healthy
 * cells. An optional `animation` prop renders a one-shot treatment
 * overlay (pill → centre for a drug, lightning bolt → target cell for
 * an ablation) that flies in from the right and fades out.
 */

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Cell, SimulationState } from '../simulation/types';
import type { TreatmentAnimation } from '../hooks/useRingSimulation';
import { useI18n } from '../i18n/useI18n';

interface Props {
  state: SimulationState;
  size?: number;
  animation?: TreatmentAnimation | null;
  /** When true, a stylised heart silhouette is rendered behind the ring. */
  showHeart?: boolean;
}

/**
 * URL of the anatomical heart cutaway served from /public. The image
 * should have a transparent (or light) background and be portrait-
 * oriented so the cutaway of the ventricles is visible.
 */
const HEART_IMG = '/heart-cutaway.png';

/**
 * Layout of the ring when the heart overlay is shown. Coordinates are in
 * the SVG viewBox and are calibrated so that the ring sits inside the
 * right-ventricle cavity of the heart illustration (viewer-left side of
 * the image, patient's anatomical right). Adjust these if the artwork
 * changes.
 */
const HEART_LAYOUT = {
  ringCx: 172,
  ringCy: 255,
  ringRadius: 40,
};

const COLOURS = {
  resting: '#e9eef5',
  excited: '#e53935',
  refractory: '#90a4ae',
  ablated: '#212121',
  damagedOutline: '#c2185b',
  healthyOutline: '#78909c',
  background: 'transparent',
};

function cellFill(cell: Cell): string {
  return COLOURS[cell.state];
}

export function RingSimulation({
  state,
  size = 360,
  animation,
  showHeart = false,
}: Props) {
  const { t } = useI18n();
  const { cells, config } = state;
  const cx = showHeart ? HEART_LAYOUT.ringCx : size / 2;
  const cy = showHeart ? HEART_LAYOUT.ringCy : size / 2;
  const radius = showHeart ? HEART_LAYOUT.ringRadius : size * 0.4;
  const cellRadius = (Math.PI * 2 * radius) / (config.cellCount * 2.4);

  const positions = useMemo(() => {
    const result: { x: number; y: number }[] = [];
    for (let i = 0; i < config.cellCount; i += 1) {
      const angle = (i / config.cellCount) * Math.PI * 2 - Math.PI / 2;
      result.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }
    return result;
  }, [config.cellCount, cx, cy, radius]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={t.a11yRingLabel}
      style={{
        width: '100%',
        maxWidth: size,
        height: 'auto',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <defs>
        <pattern
          id="damaged-hatch"
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={5}
            stroke={COLOURS.damagedOutline}
            strokeWidth={1.4}
            strokeOpacity={0.7}
          />
        </pattern>
      </defs>
      {showHeart ? (
        <image
          href={HEART_IMG}
          x={0}
          y={0}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
          style={{ mixBlendMode: 'multiply' }}
          aria-hidden="true"
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#cfd8dc"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
      )}
      {cells.map((cell, i) => {
        const { x, y } = positions[i];
        const outline = cell.damaged
          ? COLOURS.damagedOutline
          : COLOURS.healthyOutline;
        const label = t.a11yCell.replace('{index}', String(i + 1));
        const isAblationTarget =
          animation?.kind === 'ablation' && animation.targetIndex === i;
        const className = isAblationTarget
          ? 'cell-ablation-impact'
          : cell.state === 'ablated'
            ? 'cell-scarred'
            : undefined;
        return (
          <circle
            key={isAblationTarget ? `impact-${animation!.id}` : `cell-${i}`}
            cx={x}
            cy={y}
            r={cellRadius}
            fill={cellFill(cell)}
            stroke={outline}
            strokeWidth={cell.state === 'ablated' ? 2 : cell.damaged ? 2 : 1}
            className={className}
            style={{ transition: 'fill 80ms linear' }}
          >
            <title>{label}</title>
          </circle>
        );
      })}
      {cells.map((cell, i) => {
        if (!cell.damaged || cell.state === 'ablated') return null;
        const { x, y } = positions[i];
        return (
          <circle
            key={`hatch-${i}`}
            cx={x}
            cy={y}
            r={cellRadius}
            fill="url(#damaged-hatch)"
            stroke="none"
            pointerEvents="none"
            aria-hidden="true"
          />
        );
      })}
      {animation ? (
        <TreatmentOverlay
          animation={animation}
          cx={cx}
          cy={cy}
          targetPos={
            animation.targetIndex !== undefined
              ? positions[animation.targetIndex]
              : undefined
          }
        />
      ) : null}
    </svg>
  );
}

interface OverlayProps {
  animation: TreatmentAnimation;
  cx: number;
  cy: number;
  targetPos?: { x: number; y: number };
}

function TreatmentOverlay({ animation, cx, cy, targetPos }: OverlayProps) {
  if (animation.kind === 'ablation' && targetPos) {
    const style = {
      '--tx': `${targetPos.x}px`,
      '--ty': `${targetPos.y}px`,
    } as CSSProperties;
    return (
      <g
        key={animation.id}
        className="treatment-bolt"
        style={style}
        aria-hidden="true"
      >
        <path
          d="M 3 -16 L -8 2 L -1 2 L -4 16 L 9 -3 L 2 -3 Z"
          fill="#ffd600"
          stroke="#f57f17"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (animation.kind === 'drug') {
    const style = {
      '--tx': `${cx}px`,
      '--ty': `${cy}px`,
    } as CSSProperties;
    const clipId = `pill-clip-${animation.id}`;
    return (
      <g key={animation.id} aria-hidden="true">
        <circle
          className="treatment-pulse"
          cx={cx}
          cy={cy}
          r={1}
          fill="none"
          stroke="#1565c0"
          strokeWidth={2}
        />
        <g className="treatment-pill" style={style}>
          <defs>
            <clipPath id={clipId}>
              <rect x={-18} y={-8} width={36} height={16} rx={8} ry={8} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect x={-18} y={-8} width={18} height={16} fill="#c2185b" />
            <rect x={0} y={-8} width={18} height={16} fill="#ffffff" />
          </g>
          <rect
            x={-18}
            y={-8}
            width={36}
            height={16}
            rx={8}
            ry={8}
            fill="none"
            stroke="#455a64"
            strokeWidth={1}
          />
        </g>
      </g>
    );
  }
  return null;
}
