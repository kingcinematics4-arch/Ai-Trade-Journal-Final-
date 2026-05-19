import type {
  DbTrade,
  MarketDistributionPoint,
  PnlTrendPoint,
  TradeAnalytics,
  TradeInsight,
  TradeStatus,
} from './types';
import { mapDbTrade } from './mapTrade';

const EMPTY_ANALYTICS: TradeAnalytics = {
  isEmpty: true,
  totalTrades: 0,
  totalPnl: 0,
  winCount: 0,
  lossCount: 0,
  breakevenCount: 0,
  winRate: 0,
  avgRr: 0,
  currentStreak: { type: 'none', count: 0 },
  bestTrade: null,
  pnlTrend: [],
  marketDistribution: [],
};

// SAFE NUMBER PARSER
export function parseSafeNumber(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;

  const cleaned = value
    .toString()
    .replace(/[$,]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// PNL CALCULATION FROM PRICES (FALLBACK ONLY)
export function calculatePnL(t: any): number {
  const entry = Number(t.entry_price);
  const exit = Number(t.exit_price);
  const lots = Number(t.lot_size || 1);

  if (isNaN(entry) || isNaN(exit)) return 0;

  const diff = t.trade_direction === 'buy' ? exit - entry : entry - exit;

  return Number((diff * lots).toFixed(2));
}

// GET TRADE PNL — prefers the user-entered pnl_amount, falls back to price calc
export function getTradePnL(t: any): number {
  // 1. Check pnl_amount first (the field users actually fill in)
  const pnlAmount = parseSafeNumber(t.pnl_amount ?? t.pnl);
  if (pnlAmount !== 0) return pnlAmount;

  // 2. Fallback: compute from entry/exit prices
  return calculatePnL(t);
}

// EQUITY CURVE — cumulative running total using pnl_amount
export function buildEquity(trades: any[]): PnlTrendPoint[] {
  if (!trades || trades.length === 0) return [];

  // Sort chronologically: oldest first
  // Primary sort: trade_date. Tiebreaker: created_at (has full timestamp precision)
  const sorted = [...trades].sort((a, b) => {
    const dateA = new Date(a.trade_date ?? a.created_at ?? 0).getTime();
    const dateB = new Date(b.trade_date ?? b.created_at ?? 0).getTime();
    if (dateA !== dateB) return dateA - dateB;
    // Same trade_date → use created_at as tiebreaker (oldest entry first)
    return (
      new Date(a.created_at ?? 0).getTime() -
      new Date(b.created_at ?? 0).getTime()
    );
  });

  let runningTotal = 0;

  const curve: PnlTrendPoint[] = sorted.map((t, index) => {
    const pnl = getTradePnL(t);
    runningTotal = Number((runningTotal + pnl).toFixed(2));

    const rawDate = t.trade_date || t.created_at;
    const parsed = rawDate ? new Date(rawDate) : null;
    const dateLabel = parsed
      ? parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : `Trade ${index + 1}`;

    const asset = String(t.asset_name ?? t.asset ?? 'Unknown');

    return {
      date: dateLabel,
      pnl,
      cumulative: runningTotal,
      tradeNumber: index + 1,
      asset,
    };
  });

  // Prepend the zero-origin point
  return [{ date: 'Start', pnl: 0, cumulative: 0, tradeNumber: 0, asset: '—' }, ...curve];
}

// NORMALIZE STATUS
function normalizeStatus(status: string | null | undefined): TradeStatus {
  if (!status) return 'breakeven';
  const s = status.toLowerCase();
  if (s === 'win' || s === 'profit') return 'win';
  if (s === 'loss') return 'loss';
  return 'breakeven';
}

// MAIN ANALYTICS ENGINE
export function computeTradeAnalytics(trades: DbTrade[]): TradeAnalytics {
  if (!trades.length) return { ...EMPTY_ANALYTICS };

  const pnlTrend = buildEquity(trades);
  const totalPnl = pnlTrend.length > 0 ? pnlTrend[pnlTrend.length - 1].cumulative : 0;

  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let rrSum = 0;
  let rrCount = 0;
  let bestTrade: TradeAnalytics['bestTrade'] = null;

  for (const t of trades) {
    const pnl = getTradePnL(t);
    const status = normalizeStatus(t.trade_status);

    if (status === 'win') winCount++;
    else if (status === 'loss') lossCount++;
    else breakevenCount++;

    const rr = parseSafeNumber(t.rr_ratio);
    if (rr > 0) {
      rrSum += rr;
      rrCount++;
    }

    if (!bestTrade || pnl > bestTrade.pnl) {
      const mapped = mapDbTrade(t as any);
      bestTrade = {
        pnl,
        asset: mapped.asset,
        strategy: mapped.strategy,
        date: mapped.date,
      };
    }
  }

  const totalDecided = winCount + lossCount;
  const winRate = totalDecided ? (winCount / totalDecided) * 100 : 0;
  const avgRr = rrCount ? rrSum / rrCount : 0;

  // STREAK
  const getTime = (t: any) => new Date(t.trade_date ?? t.created_at ?? 0).getTime();
  const getCreatedTime = (t: any) => new Date(t.created_at ?? 0).getTime();

  const sortedDesc = [...trades].sort((a, b) => {
    const diff = getTime(b) - getTime(a);
    return diff !== 0 ? diff : getCreatedTime(b) - getCreatedTime(a);
  });

  let streakType: 'win' | 'loss' | 'none' = 'none';
  let streakCount = 0;

  if (sortedDesc.length > 0) {
    const first = normalizeStatus(sortedDesc[0].trade_status);

    if (first === 'win' || first === 'loss') {
      streakType = first;

      for (const t of sortedDesc) {
        if (normalizeStatus(t.trade_status) === streakType) {
          streakCount++;
        } else break;
      }
    }
  }

  // MARKET DISTRIBUTION
  const marketMap = new Map<string, { trades: number; pnl: number }>();

  for (const t of trades) {
    const market = String(t.market_type ?? 'Other').trim() || 'Other';
    const entry = marketMap.get(market) ?? { trades: 0, pnl: 0 };

    entry.trades++;
    entry.pnl += getTradePnL(t);

    marketMap.set(market, entry);
  }

  const marketDistribution: MarketDistributionPoint[] = [...marketMap.entries()]
    .map(([name, stats], index) => ({
      id: `mkt-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      value: Math.round((stats.trades / trades.length) * 100),
      trades: stats.trades,
      pnl: stats.pnl,
    }))
    .sort((a, b) => b.trades - a.trades);

  return {
    isEmpty: false,
    totalTrades: trades.length,
    totalPnl,
    winCount,
    lossCount,
    breakevenCount,
    winRate,
    avgRr,
    currentStreak: { type: streakType, count: streakCount },
    bestTrade,
    pnlTrend,
    marketDistribution,
  };
}

// INSIGHTS
export function generateTradeInsights(trades: DbTrade[]): TradeInsight[] {
  if (trades.length < 2) return [];

  const analytics = computeTradeAnalytics(trades);
  const insights: TradeInsight[] = [];

  if (analytics.totalTrades > 0) {
    insights.push({
      id: 'win-rate',
      type: analytics.winRate >= 50 ? 'positive' : 'warning',
      text: `Win rate ${analytics.winRate.toFixed(1)}% across ${analytics.totalTrades} trades.`,
    });
  }

  const best = analytics.bestTrade;

  if (best && (best.pnl ?? 0) > 0) {
    insights.push({
      id: 'best-trade',
      type: 'positive',
      text: `Best trade ${best.asset} +$${(best.pnl ?? 0).toFixed(2)}.`,
    });
  }

  if (analytics.currentStreak.type === 'loss' && analytics.currentStreak.count >= 2) {
    insights.push({
      id: 'loss-streak',
      type: 'warning',
      text: `${analytics.currentStreak.count} loss streak.`,
    });
  }

  const top = analytics.marketDistribution[0];
  if (top && analytics.marketDistribution.length > 1) {
    insights.push({
      id: 'market',
      type: 'positive',
      text: `${top.name} leads with ${top.value}%.`,
    });
  }

  return insights.slice(0, 4);
}

// FORMAT CURRENCY
export function formatCurrency(value: number, options?: { showSign?: boolean }): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);

  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = isNegative ? '-' : options?.showSign && value > 0 ? '+' : '';

  return `${sign}$${formatted}`;
}
