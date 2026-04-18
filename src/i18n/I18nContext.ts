import { createContext } from 'react';
import type { Language, Strings } from './strings';

export interface I18nContextValue {
  lang: Language;
  t: Strings;
  setLang: (lang: Language) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
