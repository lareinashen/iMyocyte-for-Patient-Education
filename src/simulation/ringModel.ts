/**
 * Pure-TypeScript cardiac ring simulation.
 *
 * At each tick:
 *   1. Resting cells adjacent to a cell that was Excited in the previous
 *      tick become Excited. Ablated cells never conduct or excite.
 *   2. Excited / Refractory cells decrement their timers and transition:
 *        excited (timer -> 0)    -> refractory (timer = rp)
 *        refractory (timer -> 0) -> resting
 *
 * Refractory duration is taken from state.currentHealthyRp or
 * state.currentDamagedRp so that the "drug" treatment can prolong the
 * refractory period uniformly: with a long enough RP, the wavelength
 * (excitedDuration + rp) exceeds the ring circumference and a circulating
 * wave catches its own refractory tail and terminates.
 */

import type { Cell, RingConfig, SimulationState } from './types';

export function createInitialState(config: RingConfig): SimulationState {
  const cells: Cell[] = [];
  for (let i = 0; i < config.cellCount; i += 1) {
    const damaged = isInDamagedZone(i, config);
    cells.push({ state: 'resting', timer: 0, damaged });
  }
  return {
    config,
    cells,
    tick: 0,
    currentHealthyRp: config.healthyRp,
    currentDamagedRp: config.damagedRp,
  };
}

export function isInDamagedZone(index: number, config: RingConfig): boolean {
  const { damagedStart, damagedLength, cellCount } = config;
  if (damagedLength <= 0) return false;
  for (let k = 0; k < damagedLength; k += 1) {
    if ((damagedStart + k) % cellCount === index) return true;
  }
  return false;
}

/** Refractory duration for a given cell at the current simulation state. */
function rpFor(cell: Cell, state: SimulationState): number {
  return cell.damaged ? state.currentDamagedRp : state.currentHealthyRp;
}

/** Apply an external stimulus to a cell (e.g. a pacing pulse). */
export function stimulate(state: SimulationState, siteIndex: number): void {
  const cell = state.cells[siteIndex];
  if (!cell || cell.state !== 'resting') return;
  cell.state = 'excited';
  cell.timer = state.config.excitedDuration;
}

/** Advance the simulation by one tick (mutates in place for perf). */
export function step(state: SimulationState): void {
  const { cells, config } = state;
  const n = config.cellCount;

  // Snapshot of who was excited at the start of this tick — propagation
  // decisions must all reference the same snapshot so that the wave does
  // not "jump" more than one cell per tick.
  const wasExcited = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    if (cells[i].state === 'excited') wasExcited[i] = 1;
  }

  for (let i = 0; i < n; i += 1) {
    const cell = cells[i];
    if (cell.state === 'ablated') continue;

    if (cell.state === 'resting') {
      const left = (i - 1 + n) % n;
      const right = (i + 1) % n;
      const leftAlive = cells[left].state !== 'ablated';
      const rightAlive = cells[right].state !== 'ablated';
      if ((leftAlive && wasExcited[left]) || (rightAlive && wasExcited[right])) {
        cell.state = 'excited';
        cell.timer = config.excitedDuration;
      }
      continue;
    }

    // excited or refractory: decrement and transition
    cell.timer -= 1;
    if (cell.timer > 0) continue;

    if (cell.state === 'excited') {
      cell.state = 'refractory';
      cell.timer = rpFor(cell, state);
    } else {
      cell.state = 'resting';
      cell.timer = 0;
    }
  }

  state.tick += 1;
}

/** Treatment: permanently block one cell. */
export function ablateCell(state: SimulationState, index: number): void {
  const cell = state.cells[index];
  if (!cell) return;
  cell.state = 'ablated';
  cell.timer = 0;
}

/**
 * Treatment: prolong every cell's refractory period to
 * config.drugProlongedRp. With RP chosen so that
 *   excitedDuration + drugProlongedRp >= cellCount
 * the circulating wave's head catches its own tail and the reentry dies.
 */
export function applyDrug(state: SimulationState): void {
  state.currentHealthyRp = state.config.drugProlongedRp;
  state.currentDamagedRp = state.config.drugProlongedRp;
  // Cells currently in the refractory phase keep their existing shorter
  // timer — they finish their current recovery on the old schedule, and
  // the next refractory entry uses the new prolonged value. That is the
  // behaviour we want: tissue immediately ahead of the wave front is the
  // first to become "newly long-refractory" as the wave passes through.
}

/** Return a stable snapshot useful for React rendering (shallow clone). */
export function snapshot(state: SimulationState): SimulationState {
  return {
    config: state.config,
    cells: state.cells.map((c) => ({ ...c })),
    tick: state.tick,
    currentHealthyRp: state.currentHealthyRp,
    currentDamagedRp: state.currentDamagedRp,
  };
}

/** True if any cell is currently excited — i.e. a wave is present. */
export function hasActivity(state: SimulationState): boolean {
  for (const c of state.cells) {
    if (c.state === 'excited') return true;
  }
  return false;
}
