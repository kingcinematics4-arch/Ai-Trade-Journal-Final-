import type { ReportPeriodKind } from './pdfReportIdentity';

/** PDF theme aligned with app CSS variables (dark dashboard) */
export const PDF_THEME = {
  bg: [5, 5, 7] as [number, number, number], // #050507
  card: [17, 24, 39] as [number, number, number], // #111827
  cardElevated: [22, 30, 48] as [number, number, number],
  header: [31, 41, 55] as [number, number, number], // #1F2937
  border: [55, 65, 81] as [number, number, number], // #374151
  primary: [59, 130, 246] as [number, number, number], // #3b82f6
  text: [249, 250, 251] as [number, number, number],
  muted: [156, 163, 175] as [number, number, number],
  profit: [34, 197, 94] as [number, number, number], // #22c55e
  loss: [239, 68, 68] as [number, number, number], // #ef4444
  amber: [245, 158, 11] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export const PDF_LAYOUT = {
  marginX: 14,
  marginTop: 14,
  marginBottom: 16,
  footerY: 282,
  cardRadius: 2.5,
  cardGap: 6,
  sectionGap: 10,
  lineHeight: 5,
  labelSize: 9,
  valueSize: 11,
  titleSize: 18,
  subtitleSize: 10,
  cardTitleSize: 12,
  tableFontSize: 10,
  standardTableFontSize: 10,
  summaryCardHeight: 24,
  summaryCardGap: 5,
  tradeCardPadding: 5,
  tradeCardHeaderHeight: 9,
  maxTableColumns: 8,
  reportBannerHeight: 34,
  reportPeriodCardHeight: 34,
  bannerTitleSize: 16,
  bannerSubtitleSize: 12,
};

export const PERIOD_BADGE_COLORS: Record<ReportPeriodKind, Rgb> = {
  this_month: [59, 130, 246],
  last_month: [245, 158, 11],
  last_3_months: [139, 92, 246],
  last_6_months: [20, 184, 166],
  this_year: [34, 197, 94],
  custom_range: [236, 72, 153],
  all_time: [107, 114, 128],
};

export type Rgb = [number, number, number];
