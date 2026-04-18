/**
 * SVG renderer for the ring of cardiac cells. Cell fill colour encodes
 * the cell's state; a thin outline distinguishes damaged from healthy
 * cells. Cells can be clicked to ablate them (the click handler is
 * optional so the component is reusable in future contexts).
 */

import { useMemo } from 'react';
import type { Cell, SimulationState } from '../simulation/types';
import { useI18n } from '../i18n/useI18n';

interface Props {
  state: SimulationState;
  onCellClick?: (index: number) => void;
  interactive?: boolean;
  size?: number;
}

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
  onCellClick,
  interactive = false,
  size = 360,
}: Props) {
  const { t } = useI18n();
  const { cells, config } = state;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.4;
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
      style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#cfd8dc"
        strokeWidth={1}
        strokeDasharray="2 4"
      />
      {cells.map((cell, i) => {
        const { x, y } = positions[i];
        const outline = cell.damaged
          ? COLOURS.damagedOutline
          : COLOURS.healthyOutline;
        const label = t.a11yCell.replace('{index}', String(i + 1));
        const clickable = interactive && cell.state !== 'ablated';
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={cellRadius}
            fill={cellFill(cell)}
            stroke={outline}
            strokeWidth={cell.damaged ? 2 : 1}
            style={{
              cursor: clickable ? 'pointer' : 'default',
              transition: 'fill 80ms linear',
            }}
            onClick={clickable ? () => onCellClick?.(i) : undefined}
          >
            <title>{label}</title>
          </circle>
        );
      })}
    </svg>
  );
}
