import { useI18n } from '../i18n/useI18n';
import type { ScenarioId, SimulationState } from '../simulation/types';
import { hasActivity, isInDamagedZone } from '../simulation/ringModel';

interface Props {
  scenarioId: ScenarioId;
  state: SimulationState;
  isRunning: boolean;
  drugApplied: boolean;
  ablationCount: number;
  onRun: (id: ScenarioId) => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onAblate: () => void;
  onAddDrug: () => void;
}

/** Pick the first non-ablated cell in the damaged zone to ablate. */
function nextAblationTarget(state: SimulationState): number | null {
  const { config, cells } = state;
  for (let k = 0; k < config.damagedLength; k += 1) {
    const idx = (config.damagedStart + k) % config.cellCount;
    if (cells[idx].state !== 'ablated') return idx;
  }
  // fall back: any non-ablated cell
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i].state !== 'ablated') return i;
  }
  return null;
}

export function Controls({
  scenarioId,
  state,
  isRunning,
  drugApplied,
  ablationCount,
  onRun,
  onReset,
  onTogglePlay,
  onAblate,
  onAddDrug,
}: Props) {
  const { t } = useI18n();
  const reentryActive = scenarioId === 'reentry' && hasActivity(state);
  const canAblate = reentryActive && nextAblationTarget(state) !== null;
  const canDrug = reentryActive && !drugApplied;
  // Expose damaged-zone count & ablation count via aria-live for screen readers.
  const damagedCount = state.cells.filter(
    (_, i) => isInDamagedZone(i, state.config),
  ).length;

  return (
    <div className="controls" aria-label={t.scenarioLabel}>
      <fieldset className="scenario-group">
        <legend>{t.scenarioLabel}</legend>
        <div className="button-row">
          <button
            type="button"
            className={
              scenarioId === 'normal' && isRunning ? 'primary active' : 'primary'
            }
            onClick={() => onRun('normal')}
          >
            {t.scenarioNormal}
          </button>
          <button
            type="button"
            className={
              scenarioId === 'reentry' && isRunning ? 'primary active' : 'primary'
            }
            onClick={() => onRun('reentry')}
          >
            {t.scenarioReentry}
          </button>
        </div>
        <div className="button-row">
          <button type="button" onClick={onTogglePlay}>
            {isRunning ? t.pauseButton : t.playButton}
          </button>
          <button type="button" onClick={onReset}>
            {t.resetButton}
          </button>
        </div>
      </fieldset>

      <fieldset className="treatment-group">
        <legend>{t.treatmentHeading}</legend>
        <p className="hint">{t.treatmentIntro}</p>
        <div className="button-row">
          <button
            type="button"
            className="treatment"
            disabled={!canAblate}
            onClick={onAblate}
            aria-describedby="ablate-hint"
          >
            {t.ablateButton}
          </button>
          <button
            type="button"
            className="treatment"
            disabled={!canDrug}
            onClick={onAddDrug}
            aria-describedby="drug-hint"
          >
            {t.drugButton}
          </button>
        </div>
        <p id="ablate-hint" className="hint">
          {t.ablateHint}
        </p>
        <p id="drug-hint" className="hint">
          {t.drugHint}
        </p>
        {drugApplied ? <p className="note">{t.drugNote}</p> : null}
        <p className="sr-only" aria-live="polite">
          {ablationCount > 0
            ? `${ablationCount} / ${damagedCount}`
            : ''}
        </p>
      </fieldset>
    </div>
  );
}
