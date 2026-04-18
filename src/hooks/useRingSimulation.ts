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
} from '../simulation/types';

/** Real-time milliseconds per simulation tick. Lower = faster animation. */
const MS_PER_TICK_DEFAULT = 250;

interface UseRingSimulationResult {
  state: SimulationState;
  scenarioId: ScenarioId;
  isRunning: boolean;
  runScenario: (id: ScenarioId) => void;
  reset: () => void;
  setPlaying: (playing: boolean) => void;
  ablate: (index: number) => void;
  addDrug: () => void;
  drugApplied: boolean;
  ablationCount: number;
}

export function useRingSimulation(): UseRingSimulationResult {
  const stateRef = useRef<SimulationState>(createInitialState(NORMAL_CONFIG));
  const pendingEventsRef = useRef<PacingEvent[]>([]);
  const [scenarioId, setScenarioId] = useState<ScenarioId>('normal');
  const [isRunning, setIsRunning] = useState(false);
  const [drugApplied, setDrugApplied] = useState(false);
  const [ablationCount, setAblationCount] = useState(0);
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
    setDrugApplied(false);
    setAblationCount(0);
    setIsRunning(false);
    forceRender();
  }, [forceRender, scenarioId]);

  const runScenario = useCallback(
    (id: ScenarioId) => {
      const scenario = getScenario(id);
      stateRef.current = createInitialState(scenario.config);
      // Events store absolute tick indices, which start from 0 on a fresh state.
      pendingEventsRef.current = scenario.events.map((e) => ({ ...e }));
      setScenarioId(id);
      setDrugApplied(false);
      setAblationCount(0);
      setIsRunning(true);
      forceRender();
    },
    [forceRender],
  );

  const setPlaying = useCallback((playing: boolean) => {
    setIsRunning(playing);
  }, []);

  const ablate = useCallback(
    (index: number) => {
      ablateCell(stateRef.current, index);
      setAblationCount((n) => n + 1);
      forceRender();
    },
    [forceRender],
  );

  const addDrug = useCallback(() => {
    applyDrug(stateRef.current);
    setDrugApplied(true);
    forceRender();
  }, [forceRender]);

  // Auto-pause when a scenario has quiesced to save CPU for embedded pages.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      if (!hasActivity(stateRef.current) && pendingEventsRef.current.length === 0) {
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
    ablate,
    addDrug,
    drugApplied,
    ablationCount,
  };
}
