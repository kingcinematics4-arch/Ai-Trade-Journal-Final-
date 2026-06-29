import { useI18n } from '../provider/I18nProvider';

/**
 * Convenience hook for translation
 *
 * @example
 * const { t } = useTranslation();
 * const title = t('dashboard.title');
 */
export function useTranslation() {
  const {
    t,
    locale,
    setLocale,
    isRtl,
    formatDate,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatRelativeTime,
  } = useI18n();

  return {
    t,
    locale,
    setLocale,
    isRtl,
    formatDate,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatRelativeTime,
  };
}
