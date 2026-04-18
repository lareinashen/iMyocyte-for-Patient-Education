import { useI18n } from '../i18n/useI18n';
import type { ScenarioId } from '../simulation/types';

interface Props {
  scenarioId: ScenarioId;
  isRunning: boolean;
  showHeart: boolean;
  onRun: (id: ScenarioId) => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onToggleHeart: () => void;
}

interface ScenarioButton {
  id: ScenarioId;
  labelKey:
    | 'scenarioNormal'
    | 'scenarioReentry'
    | 'scenarioReentryAblation'
    | 'scenarioReentryDrug';
}

const SCENARIOS: ScenarioButton[] = [
  { id: 'normal', labelKey: 'scenarioNormal' },
  { id: 'reentry', labelKey: 'scenarioReentry' },
  { id: 'reentry-ablation', labelKey: 'scenarioReentryAblation' },
  { id: 'reentry-drug', labelKey: 'scenarioReentryDrug' },
];

export function Controls({
  scenarioId,
  isRunning,
  showHeart,
  onRun,
  onReset,
  onTogglePlay,
  onToggleHeart,
}: Props) {
  const { t } = useI18n();
  return (
    <div className="controls" aria-label={t.scenarioLabel}>
      <fieldset className="scenario-group">
        <legend>{t.scenarioLabel}</legend>
        <div className="button-row">
          {SCENARIOS.map(({ id, labelKey }) => {
            const isActive = scenarioId === id && isRunning;
            return (
              <button
                key={id}
                type="button"
                className={isActive ? 'primary active' : 'primary'}
                onClick={() => onRun(id)}
              >
                {t[labelKey]}
              </button>
            );
          })}
        </div>
        <div className="button-row">
          <button type="button" onClick={onTogglePlay}>
            {isRunning ? t.pauseButton : t.playButton}
          </button>
          <button type="button" onClick={onReset}>
            {t.resetButton}
          </button>
          <button
            type="button"
            onClick={onToggleHeart}
            aria-pressed={showHeart}
          >
            {showHeart ? t.hideHeartButton : t.showHeartButton}
          </button>
        </div>
      </fieldset>
    </div>
  );
}
