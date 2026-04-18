/**
 * Top-level App component for the reentry education tool.
 *
 * Layout: header with title + language switcher, a ring-simulation
 * panel with description, a controls panel (scenario + treatments),
 * and a legend.
 */

import { useCallback, useEffect } from 'react';
import { RingSimulation } from './components/RingSimulation';
import { Controls } from './components/Controls';
import { Legend } from './components/Legend';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useI18n } from './i18n/useI18n';
import { useRingSimulation } from './hooks/useRingSimulation';
import { startAutoResize } from './iframe/autoResize';
import type { ScenarioId } from './simulation/types';

function ScenarioDescription({ id }: { id: ScenarioId }) {
  const { t } = useI18n();
  return (
    <p className="description">
      {id === 'reentry' ? t.reentryDescription : t.normalDescription}
    </p>
  );
}

export default function App() {
  const { t } = useI18n();
  const sim = useRingSimulation();

  // Start the iframe auto-resize notifier once on mount.
  useEffect(() => {
    const stop = startAutoResize();
    return stop;
  }, []);

  const handleAblate = useCallback(() => {
    // Ablate the first non-ablated damaged cell.
    const { config, cells } = sim.state;
    for (let k = 0; k < config.damagedLength; k += 1) {
      const idx = (config.damagedStart + k) % config.cellCount;
      if (cells[idx].state !== 'ablated') {
        sim.ablate(idx);
        return;
      }
    }
  }, [sim]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (sim.scenarioId !== 'reentry') return;
      sim.ablate(index);
    },
    [sim],
  );

  const handleTogglePlay = useCallback(() => {
    sim.setPlaying(!sim.isRunning);
  }, [sim]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{t.appTitle}</h1>
          <p>{t.appIntro}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="ring-panel" aria-live="polite">
        <RingSimulation
          state={sim.state}
          onCellClick={handleCellClick}
          interactive={sim.scenarioId === 'reentry'}
        />
        <ScenarioDescription id={sim.scenarioId} />
      </section>

      <aside>
        <Controls
          scenarioId={sim.scenarioId}
          state={sim.state}
          isRunning={sim.isRunning}
          drugApplied={sim.drugApplied}
          ablationCount={sim.ablationCount}
          onRun={sim.runScenario}
          onReset={sim.reset}
          onTogglePlay={handleTogglePlay}
          onAblate={handleAblate}
          onAddDrug={sim.addDrug}
        />
        <Legend />
      </aside>

      <footer className="app-footer">
        <small>{t.footerDisclaimer}</small>
      </footer>
    </div>
  );
}
