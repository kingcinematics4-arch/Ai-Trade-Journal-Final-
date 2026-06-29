import {
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import { computeReportDateRange } from './pdfAnalytics';

export type ReportPeriodKind =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'custom_range'
  | 'all_time';

export interface ReportPeriodIdentity {
  kind: ReportPeriodKind;
  badgeLabel: string;
  bannerTitle: string;
  bannerSubtitle: string;
  typeLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  startDateLabel: string;
  endDateLabel: string;
  generatedOnLabel: string;
  performanceSubtitle: string;
  fileNameSuffix: string;
}

const PERIOD_META: Record<
  ReportPeriodKind,
  { badge: string; banner: string; type: string; filePrefix: string }
> = {
  this_month: {
    badge: 'THIS MONTH',
    banner: 'THIS MONTH REPORT',
    type: 'This Month',
    filePrefix: 'ThisMonth',
  },
  last_month: {
    badge: 'LAST MONTH',
    banner: 'LAST MONTH REPORT',
    type: 'Last Month',
    filePrefix: 'LastMonth',
  },
  last_3_months: {
    badge: 'LAST 3 MONTHS',
    banner: 'LAST 3 MONTHS REPORT',
    type: 'Last 3 Months',
    filePrefix: 'Last3Months',
  },
  last_6_months: {
    badge: 'LAST 6 MONTHS',
    banner: 'LAST 6 MONTHS REPORT',
    type: 'Last 6 Months',
    filePrefix: 'Last6Months',
  },
  this_year: {
    badge: 'THIS YEAR',
    banner: 'THIS YEAR REPORT',
    type: 'This Year',
    filePrefix: 'ThisYear',
  },
  custom_range: {
    badge: 'CUSTOM RANGE',
    banner: 'CUSTOM RANGE REPORT',
    type: 'Custom Range',
    filePrefix: 'Custom',
  },
  all_time: {
    badge: 'ALL TIME',
    banner: 'ALL TIME REPORT',
    type: 'All Time',
    filePrefix: 'AllTime',
  },
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function compactDate(date: Date): string {
  return format(date, 'ddMMMyyyy');
}

function monthYear(date: Date): string {
  return format(date, 'MMMM yyyy').replace(/\s/g, '');
}

function monthRangeLabel(from: Date, to: Date): string {
  return `${format(from, 'MMM yyyy')} - ${format(to, 'MMM yyyy')}`;
}

function buildPerformanceSubtitle(
  kind: ReportPeriodKind,
  from: Date | null,
  to: Date | null
): string {
  if (!from || !to) return 'Performance Report — All Time';

  if (kind === 'this_month' || kind === 'last_month') {
    return `Performance Report for ${format(to, 'MMMM yyyy')}`;
  }

  if (kind === 'this_year') {
    return `Performance Report for ${format(from, 'yyyy')}`;
  }

  if (isSameDay(from, to)) {
    return `Performance Report for ${format(from, 'dd MMM yyyy')}`;
  }

  return `Performance Report from ${format(from, 'dd MMM yyyy')} to ${format(to, 'dd MMM yyyy')}`;
}

function buildFileNameSuffix(kind: ReportPeriodKind, from: Date | null, to: Date | null): string {
  const meta = PERIOD_META[kind];

  if (!from || !to) {
    return meta.filePrefix;
  }

  switch (kind) {
    case 'this_month':
      return `${meta.filePrefix}_${monthYear(to)}`;
    case 'last_month':
      return `${meta.filePrefix}_${monthYear(from)}`;
    case 'last_3_months':
    case 'last_6_months':
      return `${meta.filePrefix}_${format(from, 'MMM')}-${format(to, 'MMM yyyy')}`.replace(
        /\s/g,
        ''
      );
    case 'this_year':
      return `${meta.filePrefix}_${format(from, 'yyyy')}`;
    case 'custom_range':
      return `${meta.filePrefix}_${compactDate(from)}_${compactDate(to)}`;
    default:
      return `${meta.filePrefix}_${compactDate(from)}_${compactDate(to)}`;
  }
}

function buildBannerSubtitle(kind: ReportPeriodKind, from: Date | null, to: Date | null): string {
  if (!from || !to) return 'Complete Trading History';

  switch (kind) {
    case 'this_month':
    case 'last_month':
      return format(to, 'MMMM yyyy');
    case 'last_3_months':
    case 'last_6_months':
      return monthRangeLabel(from, to);
    case 'this_year':
      return format(from, 'yyyy');
    case 'custom_range':
      return `${format(from, 'dd MMM yyyy')} - ${format(to, 'dd MMM yyyy')}`;
    default:
      return monthRangeLabel(from, to);
  }
}

function detectPeriodKind(from: Date, to: Date, reference: Date): ReportPeriodKind {
  const fromDay = startOfDay(from);
  const toDay = startOfDay(to);

  const thisMonthStart = startOfDay(startOfMonth(reference));
  const thisMonthEnd = startOfDay(endOfMonth(reference));
  const lastMonthStart = startOfDay(startOfMonth(subMonths(reference, 1)));
  const lastMonthEnd = startOfDay(endOfMonth(subMonths(reference, 1)));
  const last3Start = startOfDay(startOfMonth(subMonths(reference, 2)));
  const last6Start = startOfDay(startOfMonth(subMonths(reference, 5)));
  const yearStart = startOfDay(startOfYear(reference));
  const yearEnd = startOfDay(endOfYear(reference));

  if (
    fromDay.getTime() === lastMonthStart.getTime() &&
    toDay.getTime() === lastMonthEnd.getTime()
  ) {
    return 'last_month';
  }

  if (fromDay.getTime() === thisMonthStart.getTime() && toDay.getTime() <= thisMonthEnd.getTime()) {
    return 'this_month';
  }

  if (fromDay.getTime() === last3Start.getTime() && toDay.getTime() <= thisMonthEnd.getTime()) {
    return 'last_3_months';
  }

  if (fromDay.getTime() === last6Start.getTime() && toDay.getTime() <= thisMonthEnd.getTime()) {
    return 'last_6_months';
  }

  if (fromDay.getTime() === yearStart.getTime() && toDay.getTime() <= yearEnd.getTime()) {
    return 'this_year';
  }

  return 'custom_range';
}

function buildIdentity(
  kind: ReportPeriodKind,
  from: Date | null,
  to: Date | null,
  generatedAt: Date
): ReportPeriodIdentity {
  const meta = PERIOD_META[kind];
  const generatedOnLabel = format(generatedAt, 'dd MMM yyyy');

  return {
    kind,
    badgeLabel: meta.badge,
    bannerTitle: meta.banner,
    bannerSubtitle: buildBannerSubtitle(kind, from, to),
    typeLabel: meta.type,
    startDate: from,
    endDate: to,
    startDateLabel: from ? format(from, 'dd MMM yyyy') : '—',
    endDateLabel: to ? format(to, 'dd MMM yyyy') : '—',
    generatedOnLabel,
    performanceSubtitle: buildPerformanceSubtitle(kind, from, to),
    fileNameSuffix: buildFileNameSuffix(kind, from, to),
  };
}

/** Infer report period branding from exported trade dates */
export function resolveReportIdentity(
  data: Record<string, unknown>[],
  generatedAt: Date = new Date()
): ReportPeriodIdentity {
  const range = computeReportDateRange(data);

  if (!range.from || !range.to) {
    return buildIdentity('all_time', null, null, generatedAt);
  }

  const kind = detectPeriodKind(range.from, range.to, generatedAt);
  return buildIdentity(kind, range.from, range.to, generatedAt);
}

export function buildBrandedPdfFileName(identity: ReportPeriodIdentity): string {
  return `AITradeJournal_${identity.fileNameSuffix}`;
}
