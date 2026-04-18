/**
 * User-facing strings for the two supported UI languages (EN, FR).
 *
 * Keep this file flat and typed on the English table so that adding a
 * new key automatically surfaces as a TypeScript error in the French
 * table until translated.
 */

export const en = {
  appTitle: 'Cardiac reentry: how it starts and how we treat it',
  appIntro:
    'This animation shows a ring of heart muscle cells. Watch how an electrical wave travels through healthy tissue and how a damaged area can trap the wave in a circle, a condition called reentry.',

  scenarioLabel: 'Scenario',
  scenarioNormal: 'Normal conduction',
  scenarioReentry: 'Reentry',
  scenarioReentryAblation: 'Reentry + ablation',
  scenarioReentryDrug: 'Reentry + drug',

  normalDescription:
    'A single electrical pulse spreads in both directions around the ring. The two waves meet on the far side and cancel out. This is normal heart conduction.',
  reentryDescription:
    'Two closely spaced pulses are delivered. Because the damaged tissue takes longer to recover after the first wave, it blocks the second wave in that direction. The second wave ends up travelling around the ring unidirectionally in a loop that becomes sustained; this is reentry, and it can cause an abnormal heart rhythm.',
  reentryAblationDescription:
    'Reentry is induced as before. After a few seconds, a targeted energy pulse (ablation) destroys the damaged cell. The circulating wave hits the ablated spot and the loop is broken.',
  reentryDrugDescription:
    'Reentry is induced as before. After a few seconds, a medication is delivered that lengthens how long each cell needs to recover. The circulating wave catches up to tissue that is still recovering from its last beat and stops.',

  resetButton: 'Reset',
  pauseButton: 'Pause',
  playButton: 'Play',
  showHeartButton: 'Show in heart',
  hideHeartButton: 'Hide heart',

  legendHeading: 'Legend',
  legendHealthy: 'Healthy cell',
  legendDamaged: 'Damaged cell',
  legendExcited: 'Electrically active',
  legendRefractory: 'Recovering',
  legendAblated: 'Ablated',

  a11yRingLabel: 'Ring of cardiac cells',
  a11yCell: 'Cell {index}',

  footerDisclaimer:
    'Educational illustration only. Simplified model, not a diagnostic or clinical tool.',

  languageLabel: 'Language',
  languageEn: 'English',
  languageFr: 'Français',
} as const;

export type Strings = { [K in keyof typeof en]: string };

export const fr: Strings = {
  appTitle: 'Réentrée cardiaque: origine et traitement',
  appIntro:
    'Cette animation montre un anneau de cellules du muscle cardiaque. Observez comment une onde électrique se propage dans un tissu sain et comment une zone endommagée peut piéger l’onde en boucle, un phénomène appelé réentrée.',

  scenarioLabel: 'Scénario',
  scenarioNormal: 'Conduction normale',
  scenarioReentry: 'Réentrée',
  scenarioReentryAblation: 'Réentrée + ablation',
  scenarioReentryDrug: 'Réentrée + médicament',

  normalDescription:
    'Une seule impulsion électrique se propage dans les deux sens autour de l’anneau. Les deux ondes se rencontrent de l’autre côté et s’annulent. C’est la conduction normale du cœur.',
  reentryDescription:
    'Deux impulsions rapprochées sont délivrées. Comme une partie du tissu est endommagée et met plus de temps à récupérer, une direction est bloquée alors que l’autre conduit encore. L’onde se met à circuler en boucle autour de l’anneau sans s’arrêter; cette boucle entretenue est la réentrée, et elle peut causer un rythme cardiaque anormal.',
  reentryAblationDescription:
    'La réentrée est induite comme précédemment. Après quelques secondes, une impulsion d’énergie ciblée (ablation) détruit la cellule endommagée. L’onde qui circule atteint la zone détruite et la boucle est rompue.',
  reentryDrugDescription:
    'La réentrée est induite comme précédemment. Après quelques secondes, un médicament est administré; il allonge le temps dont chaque cellule a besoin pour récupérer. L’onde qui tourne rattrape du tissu encore en récupération et s’arrête.',

  resetButton: 'Réinitialiser',
  pauseButton: 'Pause',
  playButton: 'Lecture',
  showHeartButton: 'Afficher dans le cœur',
  hideHeartButton: 'Masquer le cœur',

  legendHeading: 'Légende',
  legendHealthy: 'Cellule saine',
  legendDamaged: 'Cellule endommagée',
  legendExcited: 'Électriquement active',
  legendRefractory: 'En récupération',
  legendAblated: 'Ablée',

  a11yRingLabel: 'Anneau de cellules cardiaques',
  a11yCell: 'Cellule {index}',

  footerDisclaimer:
    'Illustration pédagogique. Modèle simplifié — ce n’est pas un outil diagnostique ou clinique.',

  languageLabel: 'Langue',
  languageEn: 'English',
  languageFr: 'Français',
};

export type Language = 'en' | 'fr';

export const tables: Record<Language, Strings> = { en, fr };
