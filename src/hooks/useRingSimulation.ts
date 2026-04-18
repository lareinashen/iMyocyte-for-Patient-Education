/**
 * React hook that drives the ring simulation.
 *
 * Owns the mutable SimulationState in a ref so the hot simulation loop
 * does not allocate per tick, and exposes a snapshot (plus a version
 * counter) via state so React renders when the simulation advances.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ablateCell,
  applyDrug,
  createInitialState,
  hasActivity,
  snapshot,
  step,
  stimulate,
} from '../simulation/ringModel';
import { NORMAL_CONFIG, getScenario } from '../simulation/scenarios';
import type {
  PacingEvent,
  ScenarioId,
  SimulationState,
  TreatmentEvent,
  TreatmentKind,
} from '../simulation/types';

/** Real-time milliseconds per simulation tick. Lower = faster animation. */
const MS_PER_TICK_DEFAULT = 400;

/** Approx. lifetime of the overlay SVG in the DOM (matches CSS keyframes). */
const ANIMATION_CLEAR_MS = 1500;

/**
 * Visual trigger emitted when a scheduled treatment fires. `id` is a
 * monotonically increasing counter so that re-triggering the same
 * treatment forces the overlay to remount and replay its animation.
 */
export interface TreatmentAnimation {
  id: number;
  kind: TreatmentKind;
  targetIndex?: number;
}

interface UseRingSimulationResult {
  state: SimulationState;
  scenarioId: ScenarioId;
  isRunning: boolean;
  runScenario: (id: ScenarioId) => void;
  reset: () => void;
  setPlaying: (playing: boolean) => void;
  animation: TreatmentAnimation | null;
}

export function useRingSimulation(): UseRingSimulationResult {
  const stateRef = useRef<SimulationState>(createInitialState(NORMAL_CONFIG));
  const pendingEventsRef = useRef<PacingEvent[]>([]);
  const pendingTreatmentsRef = useRef<TreatmentEvent[]>([]);
  const animationIdRef = useRef(0);
  const [scenarioId, setScenarioId] = useState<ScenarioId>('normal');
  const [isRunning, setIsRunning] = useState(false);
  const [animation, setAnimation] = useState<TreatmentAnimation | null>(null);
  const [, bumpVersion] = useState(0);

  const forceRender = useCallback(() => bumpVersion((v) => v + 1), []);

  // Simulation loop driven by rAF with a fixed-timestep accumulator.
  useEffect(() => {
    if (!isRunning) return;
    let raf = 0;
    let lastTs = performance.now();
    let accumulator = 0;

    const frame = (ts: number) => {
      const dt = ts - lastTs;
      lastTs = ts;
      accumulator += dt;
      let advanced = false;
      while (accumulator >= MS_PER_TICK_DEFAULT) {
        const s = stateRef.current;
        let eventFired = false;
        while (
          pendingEventsRef.current.length > 0 &&
          pendingEventsRef.current[0].atTick === s.tick
        ) {
          const ev = pendingEventsRef.current.shift()!;
          stimulate(s, ev.siteIndex);
          eventFired = true;
        }
        // Scheduled treatments fire on their tick and trigger the matching
        // overlay animation. They do not replace the step on that tick.
        while (
          pendingTreatmentsRef.current.length > 0 &&
          pendingTreatmentsRef.current[0].atTick === s.tick
        ) {
          const tr = pendingTreatmentsRef.current.shift()!;
          if (tr.kind === 'ablation' && tr.targetIndex !== undefined) {
            ablateCell(s, tr.targetIndex);
          } else if (tr.kind === 'drug') {
            applyDrug(s);
          }
          animationIdRef.current += 1;
          setAnimation({
            id: animationIdRef.current,
            kind: tr.kind,
            targetIndex: tr.targetIndex,
          });
        }
        // On a tick that fires a pacing event, render the stimulated state
        // without propagating — so viewers see the initiating cell light up
        // alone before the wave spreads to its neighbours on the next tick.
        if (eventFired) {
          s.tick += 1;
        } else {
          step(s);
        }
        accumulator -= MS_PER_TICK_DEFAULT;
        advanced = true;
      }
      if (advanced) forceRender();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, forceRender]);

  const reset = useCallback(() => {
    const scenario = getScenario(scenarioId);
    stateRef.current = createInitialState(scenario.config);
    pendingEventsRef.current = [];
    pendingTreatmentsRef.current = [];
    setAnimation(null);
    setIsRunning(false);
    forceRender();
  }, [forceRender, scenarioId]);

  const runScenario = useCallback(
    (id: ScenarioId) => {
      const scenario = getScenario(id);
      stateRef.current = createInitialState(scenario.config);
      // Events store absolute tick indices, which start from 0 on a fresh state.
      pendingEventsRef.current = scenario.events.map((e) => ({ ...e }));
      pendingTreatmentsRef.current = (scenario.treatments ?? []).map((t) => ({
        ...t,
      }));
      setScenarioId(id);
      setAnimation(null);
      setIsRunning(true);
      forceRender();
    },
    [forceRender],
  );

  const setPlaying = useCallback((playing: boolean) => {
    setIsRunning(playing);
  }, []);

  // Auto-clear the animation flag after the overlay finishes so the DOM
  // stays clean between scenarios.
  useEffect(() => {
    if (!animation) return;
    const id = setTimeout(() => setAnimation(null), ANIMATION_CLEAR_MS);
    return () => clearTimeout(id);
  }, [animation]);

  // Auto-pause when a scenario has quiesced to save CPU for embedded pages.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      if (
        !hasActivity(stateRef.current) &&
        pendingEventsRef.current.length === 0 &&
        pendingTreatmentsRef.current.length === 0
      ) {
        // Give a short grace period to let any trailing refractory
        // transitions settle, then stop the loop.
        setIsRunning(false);
      }
    }, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  return {
    state: snapshot(stateRef.current),
    scenarioId,
    isRunning,
    runScenario,
    reset,
    setPlaying,
    animation,
  };
}
