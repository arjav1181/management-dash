'use client';

import { useEffect, useState } from 'react';

type Locale = 'en' | 'hi';

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    'nav.overview': 'Overview',
    'nav.hf': 'HF Spaces',
    'nav.vercel': 'Vercel',
    'nav.github': 'GitHub',
    'nav.search': 'Search',
    'nav.agent': 'AI Agent',
    'nav.settings': 'Settings',
    'nav.notifications': 'Notifications',
    'common.loading': 'Loading...',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
  },
  hi: {
    'nav.overview': 'अवलोकन',
    'nav.hf': 'HF स्पेसेस',
    'nav.vercel': 'Vercel',
    'nav.github': 'GitHub',
    'nav.search': 'खोजें',
    'nav.agent': 'AI एजेंट',
    'nav.settings': 'सेटिंग्स',
    'nav.notifications': 'सूचनाएं',
    'common.loading': 'लोड हो रहा है...',
    'common.retry': 'पुनः प्रयास',
    'common.cancel': 'रद्द करें',
  },
};

const STORAGE_KEY = 'bridge-locale';

export function useLocale(): { locale: Locale; t: (k: string) => string; setLocale: (l: Locale) => void } {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem(STORAGE_KEY) as Locale | null) || 'en';
  });
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = (l: Locale): void => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  };
  return {
    locale,
    setLocale,
    t: (k: string) => STRINGS[locale][k] || STRINGS.en[k] || k,
  };
}

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
      className="rounded-lg border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
    >
      <option value="en">English</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}
