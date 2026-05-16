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

// RULE 2 — HARD PARSER (NO EXCEPTIONS)
export function parsePnL(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (value === null || value === undefined) return 0;
  
  const str = String(value).trim();
  
  // Remove everything inside parentheses (e.g. "(Green)")
  // Remove $, commas, and all spaces
  const cleaned = str.replace(/\(.*?\)/g, '').replace(/[$,\s]/g, '');
  
  // Convert to float
  const parsed = parseFloat(cleaned);
  
  // Return NaN-free float. If invalid → return 0
  return isNaN(parsed) ? 0 : parsed;
}

function tradeTimestamp(trade: DbTrade): number {
  const dateStr = trade.trade_date || trade.created_at;
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
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

  // RULE 3 — FORCE DATA SANITIZATION (In case not done at entry)
  // RULE 1 — CANONICAL DATA MODEL (Simplified for existing types)
  const cleanedTrades = trades.map(t => {
    const pnl = parsePnL(t.pnl_amount ?? (t as any).pnl);
    const statusStr = t.trade_status?.toLowerCase() || '';
    
    // Rule 2 — Force pnl = 0 for B/E
    const finalPnl = (statusStr === 'b/e' || statusStr === 'breakeven') ? 0 : pnl;
    
    return {
      ...t,
      pnl: finalPnl, // Rule 1: ONLY this is used for calculation
      rr: parsePnL(t.rr_ratio ?? (t as any).rr)
    };
  });

  // RULE 4 — FIX DATE ORDER (MANDATORY)
  cleanedTrades.sort((a, b) => {
    const timeA = new Date(a.trade_date ?? a.created_at ?? 0).getTime();
    const timeB = new Date(b.trade_date ?? b.created_at ?? 0).getTime();
    return timeA - timeB;
  });

  // RULE 5 — CUMULATIVE EQUITY ENGINE (REWRITE)
  let running = 0;
  const pnlArray: number[] = [];
  const cumulativeArray: number[] = [];
  
  const pnlTrend = cleanedTrades.map(t => {
    running = Number((running + t.pnl).toFixed(2));
    pnlArray.push(t.pnl);
    cumulativeArray.push(running);
    
    const dateObj = new Date(t.trade_date ?? t.created_at ?? Date.now());
    const label = dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return {
      date: label,
      pnl: t.pnl,
      cumulative: running
    };
  });

  // RULE 5 — Add initial point
  pnlTrend.unshift({ date: "Start", pnl: 0, cumulative: 0 });
  
  // RULE 7 — DEBUG LOCK (TEMP)
  console.log('[Source of Truth] Parsed P&L values:', pnlArray);
  console.log('[Source of Truth] Sorted dates:', cleanedTrades.map(t => t.trade_date));
  console.log('[Source of Truth] Cumulative progression:', cumulativeArray);
  
  // RULE 7 — FAIL if any string exists in pnl field
  if (pnlArray.some(p => typeof p !== 'number' || isNaN(p))) {
    throw new Error('BUILD FAIL: Invalid non-numeric data detected in P&L pipeline');
  }

  // Metrics calculation using cleaned data
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let rrSum = 0;
  let rrCount = 0;
  let bestTrade: TradeAnalytics['bestTrade'] = null;

  for (const t of cleanedTrades) {
    const status = normalizeStatus(t.trade_status);
    if (status === 'win') winCount += 1;
    else if (status === 'loss') lossCount += 1;
    else breakevenCount += 1;

    if (t.rr > 0) {
      rrSum += t.rr;
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

  const totalPnl = running;
  const decided = winCount + lossCount;
  const winRate = decided > 0 ? (winCount / decided) * 100 : 0;
  const avgRr = rrCount > 0 ? rrSum / rrCount : 0;

  // Streak (chronological DESC)
  const chronological = [...cleanedTrades].sort((a, b) => {
    const timeA = new Date(a.trade_date ?? a.created_at ?? 0).getTime();
    const timeB = new Date(b.trade_date ?? b.created_at ?? 0).getTime();
    return timeB - timeA;
  });
  
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
  
  const sign = isNegative ? '-' : (options?.showSign && value > 0 ? '+' : '');
  return `${sign}$${formattedValue}`;
}
