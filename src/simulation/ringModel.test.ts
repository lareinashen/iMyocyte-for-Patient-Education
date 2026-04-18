import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  step,
  stimulate,
  hasActivity,
  ablateCell,
  applyDrug,
} from './ringModel';
import {
  NORMAL_CONFIG,
  REENTRY_CONFIG,
  PACING_SITE,
  getScenario,
} from './scenarios';
import type { ScenarioId, SimulationState } from './types';

function runScenario(scenarioId: ScenarioId, ticks: number): SimulationState {
  const scenario = getScenario(scenarioId);
  const state = createInitialState(scenario.config);
  const events = [...scenario.events];
  const treatments = [...(scenario.treatments ?? [])];
  for (let t = 0; t < ticks; t += 1) {
    while (events.length > 0 && events[0].atTick === state.tick) {
      const ev = events.shift()!;
      stimulate(state, ev.siteIndex);
    }
    while (treatments.length > 0 && treatments[0].atTick === state.tick) {
      const tr = treatments.shift()!;
      if (tr.kind === 'ablation' && tr.targetIndex !== undefined) {
        ablateCell(state, tr.targetIndex);
      } else if (tr.kind === 'drug') {
        applyDrug(state);
      }
    }
    step(state);
  }
  return state;
}

function countExcited(state: SimulationState): number {
  return state.cells.filter((c) => c.state === 'excited').length;
}

describe('ringModel — normal conduction', () => {
  it('uses no damaged cells', () => {
    const state = createInitialState(NORMAL_CONFIG);
    expect(state.cells.every((c) => !c.damaged)).toBe(true);
    expect(state.cells.length).toBe(12);
  });

  it('single pace propagates bidirectionally and quiesces after collision', () => {
    const state = runScenario('normal', 40);
    expect(hasActivity(state)).toBe(false);
    for (const c of state.cells) expect(c.state).toBe('resting');
  });

  it('at most one cell is excited per propagation direction at any tick', () => {
    const scenario = getScenario('normal');
    const state = createInitialState(scenario.config);
    const events = [...scenario.events];
    // During propagation (before collision) there are exactly two excited
    // cells — one travelling each way — except at the tick of collision,
    // when the single collision cell is excited.
    for (let t = 0; t < 15; t += 1) {
      while (events.length > 0 && events[0].atTick === state.tick) {
        stimulate(state, events.shift()!.siteIndex);
      }
      step(state);
      expect(countExcited(state)).toBeLessThanOrEqual(2);
    }
  });
});

describe('ringModel — reentry', () => {
  it('places exactly one damaged cell adjacent to the pacing site', () => {
    const state = createInitialState(REENTRY_CONFIG);
    expect(state.cells.filter((c) => c.damaged).length).toBe(1);
    expect(state.cells[(PACING_SITE + 1) % REENTRY_CONFIG.cellCount].damaged).toBe(true);
  });

  it('S1+S2 protocol induces a sustained circulating wave', () => {
    const state = runScenario('reentry', 120);
    expect(hasActivity(state)).toBe(true);
  });

  it('ablation of the damaged cell terminates reentry', () => {
    const state = runScenario('reentry', 40);
    expect(hasActivity(state)).toBe(true);
    ablateCell(state, REENTRY_CONFIG.damagedStart);
    for (let t = 0; t < 120; t += 1) step(state);
    expect(hasActivity(state)).toBe(false);
  });
});

describe('ringModel — drug treatment', () => {
  it('prolongs both healthy and damaged RP to config.drugProlongedRp', () => {
    const state = createInitialState(REENTRY_CONFIG);
    expect(state.currentHealthyRp).toBe(REENTRY_CONFIG.healthyRp);
    expect(state.currentDamagedRp).toBe(REENTRY_CONFIG.damagedRp);
    applyDrug(state);
    expect(state.currentHealthyRp).toBe(REENTRY_CONFIG.drugProlongedRp);
    expect(state.currentDamagedRp).toBe(REENTRY_CONFIG.drugProlongedRp);
  });

  it('terminates an established reentry (wave meets refractory tissue)', () => {
    const state = runScenario('reentry', 40);
    expect(hasActivity(state)).toBe(true);
    applyDrug(state);
    for (let t = 0; t < 120; t += 1) step(state);
    expect(hasActivity(state)).toBe(false);
  });

  it('prevents reentry induction when applied before pacing', () => {
    const scenario = getScenario('reentry');
    const state = createInitialState(scenario.config);
    applyDrug(state);
    const events = [...scenario.events];
    for (let t = 0; t < 200; t += 1) {
      while (events.length > 0 && events[0].atTick === state.tick) {
        stimulate(state, events.shift()!.siteIndex);
      }
      step(state);
    }
    expect(hasActivity(state)).toBe(false);
  });
});

describe('ringModel — bundled treatment scenarios', () => {
  it('reentry-ablation schedules ablation on the damaged cell', () => {
    const scenario = getScenario('reentry-ablation');
    expect(scenario.treatments).toBeDefined();
    expect(scenario.treatments).toHaveLength(1);
    expect(scenario.treatments![0].kind).toBe('ablation');
    expect(scenario.treatments![0].targetIndex).toBe(
      REENTRY_CONFIG.damagedStart,
    );
  });

  it('reentry-drug schedules a drug event', () => {
    const scenario = getScenario('reentry-drug');
    expect(scenario.treatments).toBeDefined();
    expect(scenario.treatments).toHaveLength(1);
    expect(scenario.treatments![0].kind).toBe('drug');
  });

  it('reentry-ablation has active reentry before treatment', () => {
    const state = runScenario('reentry-ablation', 15);
    expect(hasActivity(state)).toBe(true);
  });

  it('reentry-ablation terminates reentry after the scheduled treatment', () => {
    const state = runScenario('reentry-ablation', 200);
    expect(hasActivity(state)).toBe(false);
  });

  it('reentry-drug has active reentry before treatment', () => {
    const state = runScenario('reentry-drug', 15);
    expect(hasActivity(state)).toBe(true);
  });

  it('reentry-drug terminates reentry after the scheduled treatment', () => {
    const state = runScenario('reentry-drug', 200);
    expect(hasActivity(state)).toBe(false);
  });
});

describe('ringModel — misc', () => {
  it('stimulate is a no-op on a non-resting cell', () => {
    const state = createInitialState(NORMAL_CONFIG);
    stimulate(state, PACING_SITE);
    step(state);
    stimulate(state, PACING_SITE);
    expect(state.cells[PACING_SITE].state).not.toBe('resting');
  });
});
