import { createContext, useContext, useState, type ReactNode } from 'react';
import { TRANSLATIONS, LOCALE_FOR_LANG, type Lang } from '../i18n/translations';

const STORAGE_KEY = 'centralscore-lang';

function detectDefaultLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in TRANSLATIONS) return saved as Lang;
  } catch {
    // ignore
  }
  return 'ro';
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectDefaultLang);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    const dict = TRANSLATIONS[lang];
    let str = dict[key] ?? TRANSLATIONS.ro[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, locale: LOCALE_FOR_LANG[lang], t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// Pentru cod care rulează în afara arborelui React (hooks de notificări
// programate) — citește direct din localStorage aceeași cheie.
export function getStoredLang(): Lang {
  return detectDefaultLang();
}

export function translate(key: string, vars?: Record<string, string | number>): string {
  const lang = getStoredLang();
  const dict = TRANSLATIONS[lang];
  let str = dict[key] ?? TRANSLATIONS.ro[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
