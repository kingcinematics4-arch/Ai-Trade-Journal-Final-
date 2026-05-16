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

export function parseSafeNumber(value: string | number): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (!value) return 0;

  const cleaned = value
    .toString()
    .replace(/[$,]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim();

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// STEP 1 & 2 — SINGLE SOURCE OF TRUTH PIPELINE
export type EquityPoint = {
  date: string;
  pnl: number;
  cumulative: number;
};

export function buildEquityCurve(trades: any[]): EquityPoint[] {
  const parseDate = (d: string) => new Date(Date.parse(d)).getTime();

  // STEP 2 — Build full pipeline in one place
  const sorted = [...trades].sort((a, b) =>
    parseDate(a.date || a.trade_date || a.created_at) - parseDate(b.date || b.trade_date || b.created_at)
  );

  let running = 0;

  const curve = sorted.map(t => {
    // Ensure pnl is numeric
    const pnl = typeof t.pnl === "number" ? t.pnl : parseSafeNumber(t.pnl_amount ?? t.pnl);

    running = Number((running + pnl).toFixed(2));

    const dateStr = t.date || t.trade_date || t.created_at;
    const label = new Date(parseDate(dateStr)).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    return {
      date: label,
      pnl,
      cumulative: running
    };
  });

  // STEP 5 — DEBUG CHECK
  console.log('[Source of Truth] buildEquityCurve output:', curve);
  
  return curve;
}

function normalizeStatus(status: string | null | undefined): TradeStatus {
  if (!status) return 'breakeven';
  const s = status.toLowerCase();
  if (s === 'win' || s === 'profit') return 'win';
  if (s === 'loss') return 'loss';
  return 'breakeven';
}

export function computeTradeAnalytics(trades: DbTrade[]): TradeAnalytics {
  if (!trades.length) return { ...EMPTY_ANALYTICS };

  // Mapping to initial numeric structure
  const mappedTrades = trades.map(t => ({
    ...t,
    pnl: parseSafeNumber(t.pnl_amount ?? (t as any).pnl),
    date: t.trade_date || t.created_at || new Date().toISOString()
  }));

  // STEP 3 & 4 — Use the single pipeline
  const equityCurve = buildEquityCurve(mappedTrades);

  // Add initial baseline for chart smoothness
  const pnlTrend = [
    { date: 'Start', pnl: 0, cumulative: 0 },
    ...equityCurve
  ];

  // Metrics calculation
  let totalPnl = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].cumulative : 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let rrSum = 0;
  let rrCount = 0;
  let bestTrade: TradeAnalytics['bestTrade'] = null;

  for (const t of mappedTrades) {
    const status = normalizeStatus(t.trade_status);
    if (status === 'win') winCount += 1;
    else if (status === 'loss') lossCount += 1;
    else breakevenCount += 1;

    const rr = parseSafeNumber(t.rr_ratio);
    if (rr > 0) {
      rrSum += rr;
      rrCount += 1;
    }

    if (!bestTrade || t.pnl > bestTrade.pnl) {
      const mapped = mapDbTrade(t as unknown as Record<string, unknown>);
      bestTrade = {
        pnl: t.pnl,
        asset: mapped.asset,
        strategy: mapped.strategy,
        date: mapped.date,
      };
    }
  }

  const decided = winCount + lossCount;
  const winRate = decided > 0 ? (winCount / decided) * 100 : 0;
  const avgRr = rrCount > 0 ? rrSum / rrCount : 0;

  // Streak (chronological DESC)
  const chronological = [...mappedTrades].sort((a, b) => 
    new Date(Date.parse(b.date)).getTime() - new Date(Date.parse(a.date)).getTime()
  );
  
  let streakType: 'win' | 'loss' | 'none' = 'none';
  let streakCount = 0;
  if (chronological.length > 0) {
    const firstStatus = normalizeStatus(chronological[0].trade_status);
    if (firstStatus === 'win' || firstStatus === 'loss') {
      streakType = firstStatus;
      for (const t of chronological) {
        if (normalizeStatus(t.trade_status) === streakType) streakCount += 1;
        else break;
      }
    }
  }

  const marketMap = new Map<string, { trades: number; pnl: number }>();
  for (const t of mappedTrades) {
    const market = String(t.market_type ?? 'Other').trim() || 'Other';
    const entry = marketMap.get(market) ?? { trades: 0, pnl: 0 };
    entry.trades += 1;
    entry.pnl += t.pnl;
    marketMap.set(market, entry);
  }

  const totalForShare = mappedTrades.length;
  const marketDistribution: MarketDistributionPoint[] = [...marketMap.entries()]
    .map(([name, stats], index) => ({
      id: `mkt-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      value: Math.round((stats.trades / totalForShare) * 100),
      trades: stats.trades,
      pnl: stats.pnl,
    }))
    .sort((a, b) => b.trades - a.trades);

  return {
    isEmpty: false,
    totalTrades: mappedTrades.length,
    totalPnl,
    winCount,
    lossCount,
    breakevenCount,
    winRate,
    avgRr,
    currentStreak: { type: streakType, count: streakCount },
    bestTrade,
    pnlTrend: pnlTrend as PnlTrendPoint[],
    marketDistribution,
  };
}

export function generateTradeInsights(trades: DbTrade[]): TradeInsight[] {
  if (trades.length < 2) return [];

  const analytics = computeTradeAnalytics(trades);
  const insights: TradeInsight[] = [];

  if (analytics.totalTrades > 0) {
    insights.push({
      id: 'insight-win-rate',
      type: analytics.winRate >= 50 ? 'positive' : 'warning',
      text: `Your win rate is ${analytics.winRate.toFixed(1)}% across ${analytics.totalTrades} logged trade${analytics.totalTrades === 1 ? '' : 's'}.`,
    });
  }

  if (analytics.bestTrade && analytics.bestTrade.pnl > 0) {
    insights.push({
      id: 'insight-best-trade',
      type: 'positive',
      text: `Best trade: ${analytics.bestTrade.asset} (${analytics.bestTrade.strategy}) at +$${analytics.bestTrade.pnl.toFixed(2)}.`,
    });
  }

  if (analytics.currentStreak.type === 'loss' && analytics.currentStreak.count >= 2) {
    insights.push({
      id: 'insight-loss-streak',
      type: 'warning',
      text: `${analytics.currentStreak.count} consecutive losses — review your recent entries before the next trade.`,
    });
  }

  const topMarket = analytics.marketDistribution[0];
  if (topMarket && analytics.marketDistribution.length > 1) {
    insights.push({
      id: 'insight-market',
      type: 'positive',
      text: `Most activity is in ${topMarket.name} (${topMarket.trades} trade${topMarket.trades === 1 ? '' : 's'}, ${topMarket.value}% of journal).`,
    });
  }

  return insights.slice(0, 4);
}

export function formatCurrency(value: number, options?: { showSign?: boolean }): string {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formattedValue = absValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  const sign = isNegative ? '-' : (options?.showSign && value > 0 ? '+' : '');
  return `${sign}$${formattedValue}`;
}
