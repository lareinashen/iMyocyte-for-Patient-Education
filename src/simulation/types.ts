/**
 * Types for the cardiac ring simulation.
 *
 * The model represents a 1D ring of myocytes that each cycle through
 * Resting → Excited → Refractory → Resting. A small contiguous arc is
 * flagged as "damaged" and has a longer refractory period; this is the
 * substrate that allows reentry to be induced by an appropriately timed
 * premature beat.
 */

export type CellState = 'resting' | 'excited' | 'refractory' | 'ablated';

export interface Cell {
  state: CellState;
  /** Ticks remaining in the current non-resting state. */
  timer: number;
  /** Whether this cell belongs to the damaged zone. */
  damaged: boolean;
}

export interface RingConfig {
  /** Number of cells in the ring. */
  cellCount: number;
  /** Duration of the excited phase, in ticks. */
  excitedDuration: number;
  /** Baseline refractory duration for healthy cells, in ticks. */
  healthyRp: number;
  /** Baseline refractory duration for damaged cells, in ticks. */
  damagedRp: number;
  /**
   * Refractory duration applied to every cell after the "drug" treatment.
   * Chosen so that the resulting wavelength exceeds the ring circumference,
   * which causes any circulating wave to collide with its own refractory
   * tail and die.
   */
  drugProlongedRp: number;
  /** Index of the first damaged cell. */
  damagedStart: number;
  /** Length of the damaged arc, in cells (0 = no damaged cells). */
  damagedLength: number;
}

export interface SimulationState {
  config: RingConfig;
  cells: Cell[];
  tick: number;
  /** Current healthy-cell RP (may be prolonged by the drug). */
  currentHealthyRp: number;
  /** Current damaged-cell RP (may be prolonged by the drug). */
  currentDamagedRp: number;
}

export type ScenarioId =
  | 'normal'
  | 'reentry'
  | 'reentry-ablation'
  | 'reentry-drug';

export interface PacingEvent {
  /** Tick at which to deliver the stimulus. */
  atTick: number;
  /** Index of the cell receiving the stimulus. */
  siteIndex: number;
}

export type TreatmentKind = 'ablation' | 'drug';

export interface TreatmentEvent {
  /** Tick at which to apply the treatment. */
  atTick: number;
  kind: TreatmentKind;
  /** For ablation: index of the cell to ablate. Ignored for drug. */
  targetIndex?: number;
}

export interface Scenario {
  id: ScenarioId;
  config: RingConfig;
  events: PacingEvent[];
  /** Scheduled treatments applied automatically while the scenario runs. */
  treatments?: TreatmentEvent[];
}
