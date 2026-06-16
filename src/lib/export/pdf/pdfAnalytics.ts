import { format, isValid, parseISO } from 'date-fns';
import { computeTradeAnalytics, formatCurrency } from '@/lib/trades/analytics';
import type { TradeAnalytics } from '@/lib/trades/types';

export interface ReportDateRange {
  label: string;
  from: Date | null;
  to: Date | null;
}

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  tone: 'default' | 'profit' | 'loss' | 'primary' | 'muted';
}

function parseTradeDate(value: unknown): Date | null {
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
}

export function computeReportDateRange(data: Record<string, unknown>[]): ReportDateRange {
  const dates = data
    .map((row) => parseTradeDate(row.trade_date ?? row.date ?? row.created_at))
    .filter((d): d is Date => d !== null);

  if (dates.length === 0) {
    return { label: 'All Time', from: null, to: null };
  }

  const from = new Date(Math.min(...dates.map((d) => d.getTime())));
  const to = new Date(Math.max(...dates.map((d) => d.getTime())));

  const label =
    from.getTime() === to.getTime()
      ? format(from, 'dd MMM yyyy')
      : `${format(from, 'dd MMM yyyy')} – ${format(to, 'dd MMM yyyy')}`;

  return { label, from, to };
}

export function buildSummaryMetrics(analytics: TradeAnalytics): SummaryMetric[] {
  return [
    {
      id: 'net-pnl',
      label: 'Net P&L',
      value: formatCurrency(analytics.totalPnl, { showSign: true }),
      tone: analytics.totalPnl >= 0 ? 'profit' : 'loss',
    },
    {
      id: 'total-trades',
      label: 'Total Trades',
      value: String(analytics.totalTrades),
      tone: 'default',
    },
    {
      id: 'wins',
      label: 'Winning Trades',
      value: String(analytics.winCount),
      tone: 'profit',
    },
    {
      id: 'losses',
      label: 'Losing Trades',
      value: String(analytics.lossCount),
      tone: 'loss',
    },
    {
      id: 'win-rate',
      label: 'Win Rate',
      value: `${analytics.winRate.toFixed(1)}%`,
      tone: analytics.winRate >= 50 ? 'profit' : analytics.winRate > 0 ? 'loss' : 'muted',
    },
    {
      id: 'avg-rr',
      label: 'Average Risk Reward',
      value: analytics.avgRr > 0 ? analytics.avgRr.toFixed(2) : '—',
      tone: 'primary',
    },
  ];
}

export function getReportAnalytics(data: Record<string, unknown>[]) {
  return computeTradeAnalytics(data as never[]);
}
