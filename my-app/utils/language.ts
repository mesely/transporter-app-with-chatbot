'use client';

export const LANG_STORAGE_KEY = 'Transport_lang';

export type AppLang = 'tr' | 'en';

export function normalizeLang(value?: string | null): AppLang {
  const v = (value || '').toLowerCase();
  return v.startsWith('en') ? 'en' : 'tr';
}

export function getPreferredLang(): AppLang {
  if (typeof window === 'undefined') return 'tr';
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored) return normalizeLang(stored);
  return normalizeLang(window.navigator.language);
}
