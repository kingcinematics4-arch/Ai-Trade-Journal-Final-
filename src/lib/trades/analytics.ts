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

// TASK 2 — IMPLEMENT FUNCTION (STRICT)
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

function normalizeStatus(status: string | null | undefined): TradeStatus {
  if (!status) return 'breakeven';
  const s = status.toLowerCase();
  if (s === 'win' || s === 'profit') return 'win';
  if (s === 'loss') return 'loss';
  return 'breakeven';
}

export function computeTradeAnalytics(trades: DbTrade[]): TradeAnalytics {
  if (!trades.length) return { ...EMPTY_ANALYTICS };

  // 1. Mandatory Date Parsing & Sorting
  const parseDate = (d: string) => new Date(Date.parse(d)).getTime();
  
  // Create cleaned trades with ONLY numeric pnl
  const cleanedTrades = trades.map(t => ({
    ...t,
    pnl: parseSafeNumber(t.pnl_amount ?? (t as any).pnl),
    date: t.trade_date || t.created_at || new Date().toISOString()
  }));

  // Strict sorting by timestamp
  cleanedTrades.sort((a, b) => parseDate(a.date) - parseDate(b.date));

  // 5. Debug Log: SORTED
  console.log("SORTED:", cleanedTrades);

  // 3. Rebuild cumulative equity curve
  let runningTotal = 0;
  const equityCurve = cleanedTrades.map(t => {
    runningTotal = Number((runningTotal + t.pnl).toFixed(2));
    
    const dateObj = new Date(parseDate(t.date));
    const label = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    // 4. Chart input restriction (STRICT) - ONLY date and cumulative
    return {
      date: label,
      cumulative: runningTotal
    };
  });

  // Add initial baseline
  equityCurve.unshift({ date: "Start", cumulative: 0 });

  // 5. Debug Log: EQUITY
  console.log("EQUITY:", equityCurve.map(e => e.cumulative));

  // Metrics calculation
  let totalPnl = runningTotal;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let rrSum = 0;
  let rrCount = 0;
  let bestTrade: TradeAnalytics['bestTrade'] = null;

  for (const t of cleanedTrades) {
    const statusStr = t.trade_status?.toLowerCase() || '';
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
  const chronological = [...cleanedTrades].sort((a, b) => parseDate(b.date) - parseDate(a.date));
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
  for (const t of cleanedTrades) {
    const market = String(t.market_type ?? 'Other').trim() || 'Other';
    const entry = marketMap.get(market) ?? { trades: 0, pnl: 0 };
    entry.trades += 1;
    entry.pnl += t.pnl;
    marketMap.set(market, entry);
  }

  const totalForShare = cleanedTrades.length;
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
    totalTrades: cleanedTrades.length,
    totalPnl,
    winCount,
    lossCount,
    breakevenCount,
    winRate,
    avgRr,
    currentStreak: { type: streakType, count: streakCount },
    bestTrade,
    pnlTrend: equityCurve as PnlTrendPoint[],
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
