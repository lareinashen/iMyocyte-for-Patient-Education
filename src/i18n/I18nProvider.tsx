/**
 * Minimal i18n provider. Exposes the current language, the translation
 * table, and a setter. Initial language is taken from the ?lang= URL
 * query string if present (so the iframe embed can force EN or FR),
 * otherwise from <html lang>, otherwise from navigator.language.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { tables, type Language } from './strings';
import { I18nContext, type I18nContextValue } from './I18nContext';

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const q = params.get('lang');
  if (q === 'fr' || q === 'en') return q;
  const htmlLang = document.documentElement.lang?.toLowerCase();
  if (htmlLang?.startsWith('fr')) return 'fr';
  if (navigator.language?.toLowerCase().startsWith('fr')) return 'fr';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectInitialLanguage);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, t: tables[lang], setLang }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
