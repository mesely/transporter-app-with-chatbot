'use client';

export const LANG_STORAGE_KEY = 'Transport_lang';

export type AppLang =
  | 'tr'
  | 'en'
  | 'de'
  | 'fr'
  | 'it'
  | 'es'
  | 'pt'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar';

const SUPPORTED_LANGS: AppLang[] = ['tr', 'en', 'de', 'fr', 'it', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

export function normalizeLang(value?: string | null): AppLang {
  const v = (value || '').toLowerCase();
  if (!v) return 'tr';
  const code = v.split('-')[0] as AppLang;
  if (SUPPORTED_LANGS.includes(code)) return code;
  if (code === 'tr') return 'tr';
  if (code === 'en') return 'en';
  return 'tr';
}

export function getPreferredLang(): AppLang {
  if (typeof window === 'undefined') return 'tr';
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored) return normalizeLang(stored);
  return normalizeLang(window.navigator.language);
}
