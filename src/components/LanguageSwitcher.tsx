import { useI18n } from '../i18n/useI18n';
import type { Language } from '../i18n/strings';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switcher" role="group" aria-label={t.languageLabel}>
      <label htmlFor="lang-select" className="sr-only">
        {t.languageLabel}
      </label>
      <select
        id="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
      >
        <option value="en">{t.languageEn}</option>
        <option value="fr">{t.languageFr}</option>
      </select>
    </div>
  );
}
