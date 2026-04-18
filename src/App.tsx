/**
 * Top-level App component for the reentry education tool.
 *
 * Layout: header with title + language switcher, a ring-simulation
 * panel with description, a controls panel (scenario + treatments),
 * and a legend.
 */

import { useCallback, useEffect, useState } from 'react';
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
  switch (id) {
    case 'reentry':
      return <p className="description">{t.reentryDescription}</p>;
    case 'reentry-ablation':
      return <p className="description">{t.reentryAblationDescription}</p>;
    case 'reentry-drug':
      return <p className="description">{t.reentryDrugDescription}</p>;
    case 'normal':
    default:
      return <p className="description">{t.normalDescription}</p>;
  }
}

export default function App() {
  const { t } = useI18n();
  const sim = useRingSimulation();
  const [showHeart, setShowHeart] = useState(false);

  // Start the iframe auto-resize notifier once on mount.
  useEffect(() => {
    const stop = startAutoResize();
    return stop;
  }, []);

  const handleTogglePlay = useCallback(() => {
    sim.setPlaying(!sim.isRunning);
  }, [sim]);

  const handleToggleHeart = useCallback(() => {
    setShowHeart((v) => !v);
  }, []);

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
          animation={sim.animation}
          showHeart={showHeart}
        />
        <ScenarioDescription id={sim.scenarioId} />
      </section>

      <aside>
        <Controls
          scenarioId={sim.scenarioId}
          isRunning={sim.isRunning}
          showHeart={showHeart}
          onRun={sim.runScenario}
          onReset={sim.reset}
          onTogglePlay={handleTogglePlay}
          onToggleHeart={handleToggleHeart}
        />
        <Legend />
      </aside>

      <footer className="app-footer">
        <small>{t.footerDisclaimer}</small>
      </footer>
    </div>
  );
}
