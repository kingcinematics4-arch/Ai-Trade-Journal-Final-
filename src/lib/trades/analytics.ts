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
  const raw = trade.trade_date ?? trade.created_at;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function normalizeStatus(status: string | null | undefined): TradeStatus {
  if (status === 'win' || status === 'loss' || status === 'breakeven') return status;
  return 'breakeven';
}

export function computeTradeAnalytics(trades: DbTrade[]): TradeAnalytics {
  if (!trades.length) return { ...EMPTY_ANALYTICS };

  const sorted = [...trades].sort((a, b) => tradeTimestamp(a) - tradeTimestamp(b));

  let totalPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let rrSum = 0;
  let rrCount = 0;
  let bestTrade: TradeAnalytics['bestTrade'] = null;

  for (const trade of sorted) {
    const pnl = Number(trade.pnl_amount ?? 0);
    const rr = Number(trade.rr_ratio ?? 0);
    const status = normalizeStatus(trade.trade_status);

    totalPnl += pnl;
    if (status === 'win') winCount += 1;
    else if (status === 'loss') lossCount += 1;
    else breakevenCount += 1;

    if (!Number.isNaN(rr) && rr > 0) {
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
  }

  const decided = winCount + lossCount;
  const winRate = decided > 0 ? (winCount / decided) * 100 : 0;
  const avgRr = rrCount > 0 ? rrSum / rrCount : 0;

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

  let cumulative = 0;
  const pnlTrend: PnlTrendPoint[] = sorted.map((trade) => {
    const pnl = Number(trade.pnl_amount ?? 0);
    cumulative += pnl;
    const label = new Date(trade.trade_date ?? trade.created_at ?? Date.now()).toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric' },
    );
    return { date: label, pnl, cumulative };
  });

  const marketMap = new Map<string, { trades: number; pnl: number }>();
  for (const trade of sorted) {
    const market = String(trade.market_type ?? 'Other').trim() || 'Other';
    const entry = marketMap.get(market) ?? { trades: 0, pnl: 0 };
    entry.trades += 1;
    entry.pnl += Number(trade.pnl_amount ?? 0);
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
  const sign = options?.showSign && value > 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
