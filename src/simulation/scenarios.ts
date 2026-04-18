/**
 * Scenario definitions: 12-cell ring, one pacing site.
 *
 * Normal conduction: no damaged cells. A single S1 pulse propagates both
 * ways and dies by collision on the opposite side of the ring.
 *
 * Reentry: exactly one damaged cell immediately clockwise of the pacing
 * site (index 1 when the pacing site is index 0). The damaged cell has a
 * longer refractory period than the healthy cells, which creates
 * asymmetric recovery after S1. An S2 pulse delivered while the damaged
 * cell is still refractory is blocked on the short-path arm but conducts
 * freely on the long-path arm; by the time that long-path arm reaches
 * the damaged cell from the far side, the damaged cell has recovered,
 * so it conducts. The wave emerges back at the pacing site and the loop
 * sustains — this is reentry.
 *
 * The drug treatment prolongs every cell's refractory period so that the
 * wavelength (excitedDuration + rp) exceeds the ring circumference. The
 * circulating wave's head then catches its own tail and dies.
 */

import type { RingConfig, Scenario, ScenarioId } from './types';

/** Pacing site used for every scenario. */
export const PACING_SITE = 0;

/** S1–S2 coupling interval for reentry induction, in ticks. */
export const REENTRY_S1_S2_INTERVAL = 5;

/**
 * Tick at which a bundled scenario auto-applies its treatment. Chosen so
 * that the viewer sees the reentry loop establish (S1+S2) and circulate
 * for roughly one to one-and-a-half laps before the intervention fires.
 */
export const TREATMENT_TICK = 20;

const BASE_CONFIG: Omit<RingConfig, 'damagedStart' | 'damagedLength'> = {
  cellCount: 12,
  excitedDuration: 1,
  healthyRp: 2,
  damagedRp: 10,
  // Wavelength after drug = 1 + 12 = 13 cells > 12-cell ring ⇒ reentry
  // cannot be sustained on a drug-prolonged substrate.
  drugProlongedRp: 12,
};

export const NORMAL_CONFIG: RingConfig = {
  ...BASE_CONFIG,
  damagedStart: 0,
  damagedLength: 0,
};

export const REENTRY_CONFIG: RingConfig = {
  ...BASE_CONFIG,
  // One damaged cell immediately adjacent to (clockwise of) the pacing site.
  damagedStart: (PACING_SITE + 1) % BASE_CONFIG.cellCount,
  damagedLength: 1,
};

/** Kept for compatibility with the rest of the app; matches the active scenario's config. */
export const DEFAULT_CONFIG: RingConfig = NORMAL_CONFIG;

const REENTRY_EVENTS = [
  { atTick: 0, siteIndex: PACING_SITE },
  { atTick: REENTRY_S1_S2_INTERVAL, siteIndex: PACING_SITE },
];

export function getScenario(id: ScenarioId): Scenario {
  switch (id) {
    case 'normal':
      return {
        id,
        config: NORMAL_CONFIG,
        events: [{ atTick: 0, siteIndex: PACING_SITE }],
      };
    case 'reentry':
      return {
        id,
        config: REENTRY_CONFIG,
        events: REENTRY_EVENTS.map((e) => ({ ...e })),
      };
    case 'reentry-ablation':
      return {
        id,
        config: REENTRY_CONFIG,
        events: REENTRY_EVENTS.map((e) => ({ ...e })),
        treatments: [
          {
            atTick: TREATMENT_TICK,
            kind: 'ablation',
            targetIndex: REENTRY_CONFIG.damagedStart,
          },
        ],
      };
    case 'reentry-drug':
      return {
        id,
        config: REENTRY_CONFIG,
        events: REENTRY_EVENTS.map((e) => ({ ...e })),
        treatments: [{ atTick: TREATMENT_TICK, kind: 'drug' }],
      };
  }
}
