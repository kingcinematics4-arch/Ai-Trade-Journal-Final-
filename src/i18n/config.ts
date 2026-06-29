export const locales = ['en', 'zh-CN', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'id', 'ur'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Locales that use right-to-left text direction */
export const rtlLocales: readonly Locale[] = ['ar', 'ur'];

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/** Map locale code → native language name for display in settings */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '中文（简体）',
  hi: 'हिन्दी',
  es: 'Español',
  ar: 'العربية',
  fr: 'Français',
  bn: 'বাংলা',
  pt: 'Português',
  id: 'Bahasa Indonesia',
  ur: 'اردو',
};

/** Map locale code → English label (for aria-label etc.) */
export const localeEnglishNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': 'Mandarin Chinese (Simplified)',
  hi: 'Hindi',
  es: 'Spanish',
  ar: 'Arabic',
  fr: 'French',
  bn: 'Bengali',
  pt: 'Portuguese',
  id: 'Indonesian',
  ur: 'Urdu',
};

/** Map locale code → country flag emoji */
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  'zh-CN': '🇨🇳',
  hi: '🇮🇳',
  es: '🇪🇸',
  ar: '🇸🇦',
  fr: '🇫🇷',
  bn: '🇧🇩',
  pt: '🇧🇷',
  id: '🇮🇩',
  ur: '🇵🇰',
};
