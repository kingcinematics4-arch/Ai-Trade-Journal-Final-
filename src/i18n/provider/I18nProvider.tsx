'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Locale } from '../config';
import { defaultLocale, locales, isRtlLocale, isValidLocale } from '../config';
import type { I18nContext, Translations, TranslationValue } from '../types';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

const I18nContext = createContext<I18nContext | undefined>(undefined);

/**
 * Enterprise-grade i18n Provider
 *
 * Features:
 * - Automatic language detection (browser -> saved -> default)
 * - Lazy loading of translation files
 * - Fallback to English for missing translations
 * - RTL support detection
 * - Localization utilities (date, currency, number)
 * - Smooth language transitions
 * - Persistent language preference
 */
export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [englishTranslations, setEnglishTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load translations for a specific locale with lazy loading
  const loadTranslations = useCallback(async (targetLocale: Locale) => {
    try {
      setIsLoading(true);

      // Helper to load a translation file with fallback to English
      const loadWithFallback = async (namespace: string): Promise<any> => {
        try {
          const transModule = await import(`../locales/${targetLocale}/${namespace}.json`);
          return transModule.default;
        } catch {
          // If file doesn't exist for target locale, fall back to English
          if (targetLocale !== defaultLocale) {
            console.warn(
              `Translation file not found for ${targetLocale}/${namespace}.json, falling back to English`
            );
            try {
              const fallbackModule = await import(`../locales/${defaultLocale}/${namespace}.json`);
              return fallbackModule.default;
            } catch (fallbackError) {
              console.error(`Failed to load fallback translation for ${namespace}`, fallbackError);
              return {};
            }
          }
          return {};
        }
      };

      // Load English translations for fallback
      const loadEnglish = async (namespace: string): Promise<any> => {
        try {
          const enModule = await import(`../locales/${defaultLocale}/${namespace}.json`);
          return enModule.default;
        } catch {
          console.error(`Failed to load English translation for ${namespace}`);
          return {};
        }
      };

      // Load all translation files with individual fallbacks
      const loadedTranslations: Translations = {
        common: await loadWithFallback('common'),
        landing: await loadWithFallback('landing'),
        dashboard: await loadWithFallback('dashboard'),
        auth: await loadWithFallback('auth'),
        profile: await loadWithFallback('profile'),
        settings: await loadWithFallback('settings'),
        trading: await loadWithFallback('trading'),
        analytics: await loadWithFallback('analytics'),
        calendar: await loadWithFallback('calendar'),
        strategies: await loadWithFallback('strategies'),
        ai: await loadWithFallback('ai'),
        errors: await loadWithFallback('errors'),
        validation: await loadWithFallback('validation'),
      };

      // Load English translations for fallback
      const loadedEnglish: Translations = {
        common: await loadEnglish('common'),
        landing: await loadEnglish('landing'),
        dashboard: await loadEnglish('dashboard'),
        auth: await loadEnglish('auth'),
        profile: await loadEnglish('profile'),
        settings: await loadEnglish('settings'),
        trading: await loadEnglish('trading'),
        analytics: await loadEnglish('analytics'),
        calendar: await loadEnglish('calendar'),
        strategies: await loadEnglish('strategies'),
        ai: await loadEnglish('ai'),
        errors: await loadEnglish('errors'),
        validation: await loadEnglish('validation'),
      };

      setTranslations(loadedTranslations);
      setEnglishTranslations(loadedEnglish);
    } catch (error) {
      console.error(`Failed to load translations for locale: ${targetLocale}`, error);
      // Fallback to English if loading fails completely
      if (targetLocale !== defaultLocale) {
        await loadTranslations(defaultLocale);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get nested translation value by key path (e.g., "auth.login.title")
  const getTranslation = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!translations) return key;

      // Helper to get value from a translation object
      const getValue = (obj: Translations | null, keyPath: string): string | null => {
        if (!obj) return null;
        const keys = keyPath.split('.');
        let value: TranslationValue = obj;

        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return null;
          }
        }

        if (typeof value !== 'string') {
          return null;
        }

        return value;
      };

      // Try direct key lookup first (e.g., "auth.login.title")
      let value = getValue(translations, key);

      // If not found directly, search across ALL namespaces for the key
      // This handles keys like "sidebar.nav.dashboard" which live in common.json
      if (!value && translations) {
        const namespaceKeys = Object.keys(translations);
        for (const ns of namespaceKeys) {
          const nsKey = ns as keyof Translations;
          const partial: Record<string, unknown> = {};
          partial[ns] = translations[nsKey];
          value = getValue(partial as unknown as Translations, `${ns}.${key}`);
          if (value) break;
        }
      }

      // If not found and not English, try English fallback
      if (!value && locale !== defaultLocale && englishTranslations) {
        // Try direct fallback first
        value = getValue(englishTranslations, key);
        
        // Try searching across all English namespaces
        if (!value) {
          const namespaceKeys = Object.keys(englishTranslations);
          for (const ns of namespaceKeys) {
            const nsKey = ns as keyof Translations;
            const partial: Record<string, unknown> = {};
            partial[ns] = englishTranslations[nsKey];
            value = getValue(partial as unknown as Translations, `${ns}.${key}`);
            if (value) break;
          }
        }
        
        if (value && process.env.NODE_ENV === 'development') {
          console.warn(`Translation key "${key}" not found for locale "${locale}", using English fallback`);
        }
      }

      // If still not found, return the key
      if (!value) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Translation key "${key}" not found in any locale`);
        }
        return key;
      }

      // Replace parameters in the translation string
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    },
    [translations, englishTranslations, locale]
  );

  // Format date according to locale
  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, options).format(dateObj);
    },
    [locale]
  );

  // Format number according to locale
  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, options).format(num);
    },
    [locale]
  );

  // Format currency according to locale
  const formatCurrency = useCallback(
    (num: number, currency: string = 'USD'): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(num);
    },
    [locale]
  );

  // Format percentage according to locale
  const formatPercent = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
      }).format(num / 100);
    },
    [locale]
  );

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = useCallback(
    (date: Date | string): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
      } else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      } else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      } else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      } else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
      }
    },
    [locale]
  );

  // Set locale with smooth transition
  const setLocale = useCallback(
    async (newLocale: Locale) => {
      if (!isValidLocale(newLocale)) {
        console.error(`Invalid locale: ${newLocale}`);
        return;
      }

      if (newLocale === locale) return;

      setIsTransitioning(true);

      // Save preference to localStorage
      try {
        localStorage.setItem('preferred-locale', newLocale);
      } catch (error) {
        console.error('Failed to save locale preference:', error);
      }

      // Update document direction for RTL
      document.documentElement.dir = isRtlLocale(newLocale) ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;

      // Load new translations
      await loadTranslations(newLocale);
      setLocaleState(newLocale);

      // Smooth transition delay
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    },
    [locale, loadTranslations]
  );

  // Detect initial locale on mount
  useEffect(() => {
    const detectInitialLocale = async () => {
      let detectedLocale: Locale = defaultLocale;

      // 1. Check saved preference
      try {
        const savedLocale = localStorage.getItem('preferred-locale');
        if (savedLocale && isValidLocale(savedLocale)) {
          detectedLocale = savedLocale;
        }
      } catch (error) {
        console.error('Failed to read saved locale:', error);
      }

      // 2. Check browser language
      if (detectedLocale === defaultLocale) {
        const browserLang = navigator.language;
        // Map common browser language codes to our locales
        const localeMap: Record<string, Locale> = {
          en: 'en',
          'en-US': 'en',
          'en-GB': 'en',
          zh: 'zh-CN',
          'zh-CN': 'zh-CN',
          'zh-TW': 'zh-CN',
          hi: 'hi',
          'hi-IN': 'hi',
          es: 'es',
          'es-ES': 'es',
          'es-MX': 'es',
          ar: 'ar',
          'ar-SA': 'ar',
          fr: 'fr',
          'fr-FR': 'fr',
          bn: 'bn',
          'bn-BD': 'bn',
          pt: 'pt',
          'pt-BR': 'pt',
          'pt-PT': 'pt',
          id: 'id',
          'id-ID': 'id',
          ur: 'ur',
          'ur-PK': 'ur',
        };

        if (browserLang in localeMap) {
          detectedLocale = localeMap[browserLang];
        }
      }

      // 3. Use provided initial locale or detected locale
      const finalLocale = initialLocale || detectedLocale;

      // Set initial document direction
      document.documentElement.dir = isRtlLocale(finalLocale) ? 'rtl' : 'ltr';
      document.documentElement.lang = finalLocale;

      setLocaleState(finalLocale);
      await loadTranslations(finalLocale);
    };

    detectInitialLocale();
  }, [initialLocale, loadTranslations]);

  const value: I18nContext = useMemo(
    () => ({
      locale,
      setLocale,
      t: getTranslation,
      isRtl: isRtlLocale(locale),
      formatDate,
      formatNumber,
      formatCurrency,
      formatPercent,
      formatRelativeTime,
    }),
    [
      locale,
      setLocale,
      getTranslation,
      formatDate,
      formatNumber,
      formatCurrency,
      formatPercent,
      formatRelativeTime,
    ]
  );

  // Show loading state while translations are being loaded
  if (isLoading && !translations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <I18nContext.Provider value={value}>
      <div
        className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
      >
        {children}
      </div>
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n context
 *
 * @example
 * const { t, locale, setLocale } = useI18n();
 * const title = t('dashboard.title');
 */
export function useI18n(): I18nContext {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
