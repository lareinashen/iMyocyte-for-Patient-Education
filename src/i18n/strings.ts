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

  normalDescription:
    'A single electrical pulse spreads in both directions around the ring. The two waves meet on the far side and cancel out. This is normal heart conduction.',
  reentryDescription:
    'Two closely spaced pulses are delivered. Because the damaged tissue takes longer to recover after the first wave, it blocks the second wave in that direction. The second wave ends up travelling around the ring unidirectionally in a loop that becomes sustained; this is reentry, and it can cause an abnormal heart rhythm.',

  treatmentHeading: 'Treatment',
  treatmentIntro:
    'Once the reentry loop has been initiated, try a treatment to see how it affects the wave.',
  ablateButton: 'Ablate damaged cell',
  ablateHint: 'Ablation: physically destroys cells in the damaged tissue, preventing them from firing.',
  drugButton: 'Add drug',
  drugHint:
    'Drug: lengthens how long each cell needs to recover after firing.',
  drugNote:
    'With a longer recovery time, the wave travelling around the ring catches up to tissue that is still recovering from its last beat, stopping reentry.',
  runButton: 'Run scenario',
  resetButton: 'Reset',
  pauseButton: 'Pause',
  playButton: 'Play',
  speedLabel: 'Speed',

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
  appTitle: 'Réentrée cardiaque — origine et traitement',
  appIntro:
    'Cette animation montre un anneau de cellules du muscle cardiaque. Observez comment une onde électrique se propage dans un tissu sain et comment une zone endommagée peut piéger l’onde en boucle — un phénomène appelé réentrée.',

  scenarioLabel: 'Scénario',
  scenarioNormal: 'Conduction normale',
  scenarioReentry: 'Réentrée',

  normalDescription:
    'Une seule impulsion électrique se propage dans les deux sens autour de l’anneau. Les deux ondes se rencontrent de l’autre côté et s’annulent. C’est la conduction normale du cœur.',
  reentryDescription:
    'Deux impulsions rapprochées sont délivrées. Comme une partie du tissu est endommagée et met plus de temps à récupérer, une direction est bloquée alors que l’autre conduit encore. L’onde se met à circuler en boucle autour de l’anneau sans s’arrêter — cette boucle entretenue est la réentrée, et elle peut causer un rythme cardiaque anormal.',

  treatmentHeading: 'Traitement',
  treatmentIntro:
    'Une fois la réentrée établie, essayez un traitement pour voir son effet sur l’onde qui circule.',
  ablateButton: 'Abler une cellule endommagée',
  ablateHint:
    'Bloque physiquement une cellule de la zone endommagée pour rompre la boucle.',
  drugButton: 'Ajouter un médicament',
  drugHint:
    'Allonge le temps que chaque cellule met à récupérer après s’être activée. L’onde qui revient arrive alors sur du tissu encore en récupération et s’arrête.',
  drugNote:
    'Avec un temps de récupération plus long, l’onde qui tourne autour de l’anneau rattrape du tissu qui n’a pas encore fini de récupérer de sa dernière activation — elle ne peut donc plus progresser, et la réentrée cesse.',

  runButton: 'Lancer le scénario',
  resetButton: 'Réinitialiser',
  pauseButton: 'Pause',
  playButton: 'Lecture',
  speedLabel: 'Vitesse',

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
