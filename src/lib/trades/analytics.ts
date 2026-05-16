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

function tradeTimestamp(trade: DbTrade): number {
  const dateStr = trade.trade_date || trade.created_at;
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
}

export function parseSafeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  
  const str = String(val).trim();
  
  // 1. Identify loss/win indicators from text before stripping characters
  // We check for (Red), (Green), and common sign symbols.
  const isExplicitLoss = str.includes('(Red)') || str.includes('loss') || str.includes('-');
  const isExplicitWin = str.includes('(Green)') || str.includes('win') || str.includes('+');
  
  // 2. Extract only numeric characters (digits, dot, and negative sign)
  // We keep the first minus sign if it exists, and the first dot.
  // This removes "$", ",", "(Green)", etc.
  const cleaned = str.replace(/[^0-9.-]+/g, '');
  
  // Handle edge case where multiple minus signs might exist or be misplaced
  let parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return 0;
  
  // 3. Apply logic for color-based signs if the numeric parsing was ambiguous
  // If the string says "(Red)" but the number is positive, flip it to negative.
  if (isExplicitLoss && parsed > 0) {
    parsed = -parsed;
  } 
  // If the string says "(Green)" or has a "+", ensure it's positive.
  else if (isExplicitWin && parsed < 0) {
    parsed = Math.abs(parsed);
  }
  
  // Return a clean number rounded to 2 decimals to avoid floating point noise
  return Number(parsed.toFixed(2));
}

function normalizeStatus(status: string | null | undefined): TradeStatus {
  if (status === 'win' || status === 'loss' || status === 'breakeven') return status;
  return 'breakeven';
}

export function computeTradeAnalytics(trades: DbTrade[]): TradeAnalytics {
  if (!trades.length) return { ...EMPTY_ANALYTICS };

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Raw trades received from DB:', trades);
  }

  const sorted = [...trades].sort((a, b) => {
    const timeA = tradeTimestamp(a);
    const timeB = tradeTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    // Stable fallback if dates are identical
    return (a.id ?? '').localeCompare(b.id ?? '');
  });

  // State for metrics
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let rrSum = 0;
  let rrCount = 0;
  let bestTrade: TradeAnalytics['bestTrade'] = null;

  // State for P&L trend
  let runningTotal = 0;
  const pnlTrend: PnlTrendPoint[] = [];

  // Add an initial starting point at 0 so the chart has a baseline
  if (sorted.length > 0) {
    pnlTrend.push({ date: 'Start', pnl: 0, cumulative: 0 });
  }

  for (const trade of sorted) {
    const pnl = parseSafeNumber(trade.pnl_amount ?? (trade as any).pnl);
    const rr = parseSafeNumber(trade.rr_ratio ?? (trade as any).rr);
    const status = normalizeStatus(trade.trade_status);

    runningTotal = Number((runningTotal + pnl).toFixed(2));
    
    if (status === 'win') winCount += 1;
    else if (status === 'loss') lossCount += 1;
    else breakevenCount += 1;

    if (rr > 0) {
      rrSum += rr;
      rrCount += 1;
    }

    if (!bestTrade || pnl > bestTrade.pnl) {
      const mapped = mapDbTrade(trade as unknown as Record<string, unknown>);
      bestTrade = {
        pnl,
        asset: mapped.asset,
        strategy: mapped.strategy,
        date: mapped.date,
      };
    }

    const dateObj = new Date(trade.trade_date ?? trade.created_at ?? Date.now());
    const label = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    pnlTrend.push({ 
      date: label, 
      pnl, 
      cumulative: runningTotal 
    });
  }

  // Final totals
  const totalPnl = runningTotal;
  const decided = winCount + lossCount;
  const winRate = decided > 0 ? (winCount / decided) * 100 : 0;
  const avgRr = rrCount > 0 ? rrSum / rrCount : 0;

  // Streak calculation
  const chronological = [...sorted].sort((a, b) => tradeTimestamp(b) - tradeTimestamp(a));
  let streakType: 'win' | 'loss' | 'none' = 'none';
  let streakCount = 0;

  if (chronological.length > 0) {
    const firstStatus = normalizeStatus(chronological[0].trade_status);
    if (firstStatus === 'win' || firstStatus === 'loss') {
      streakType = firstStatus;
      for (const trade of chronological) {
        if (normalizeStatus(trade.trade_status) === streakType) streakCount += 1;
        else break;
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Final computed total P&L:', totalPnl);
    console.log('[Analytics] P&L Trend dataset points:', pnlTrend.length);
  }

  const marketMap = new Map<string, { trades: number; pnl: number }>();
  for (const trade of sorted) {
    const market = String(trade.market_type ?? 'Other').trim() || 'Other';
    const entry = marketMap.get(market) ?? { trades: 0, pnl: 0 };
    entry.trades += 1;
    entry.pnl += parseSafeNumber(trade.pnl_amount ?? (trade as any).pnl);
    marketMap.set(market, entry);
  }

  const totalForShare = sorted.length;
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
    totalTrades: sorted.length,
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
  
  // Use explicit minus sign if negative, or plus sign if requested and positive
  const sign = isNegative ? '-' : (options?.showSign && value > 0 ? '+' : '');
  return `${sign}$${formattedValue}`;
}
