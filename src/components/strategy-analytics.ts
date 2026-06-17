import { format, parseISO } from 'date-fns';

export interface StrategyStats {
  name: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  lastUsed: string;
  largestWin: number;
  largestLoss: number;
  trades: any[];
}

export interface DailyUsage {
  date: string;
  totalTrades: number;
  strategies: { name: string; count: number }[];
}

export function calculateStrategyAnalytics(trades: any[]) {
  const strategyMap: Record<string, StrategyStats> = {};
  const dailyMap: Record<string, Record<string, number>> = {};

  trades.forEach((trade) => {
    const name = trade.strategy_used || 'Unassigned';
    const pnl = parseFloat(trade.pnl_amount || '0');
    const date = trade.trade_date || format(new Date(), 'yyyy-MM-dd');

    // 1. Group by Strategy
    if (!strategyMap[name]) {
      strategyMap[name] = {
        name,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        lastUsed: date,
        largestWin: 0,
        largestLoss: 0,
        trades: [],
      };
    }

    const stats = strategyMap[name];
    stats.totalTrades++;
    stats.netPnL += pnl;
    stats.trades.push(trade);
    
    if (new Date(date) > new Date(stats.lastUsed)) stats.lastUsed = date;

    if (pnl > 0) {
      stats.wins++;
      stats.totalProfit += pnl;
      if (pnl > stats.largestWin) stats.largestWin = pnl;
    } else if (pnl < 0) {
      stats.losses++;
      stats.totalLoss += Math.abs(pnl);
      if (pnl < stats.largestLoss) stats.largestLoss = pnl;
    } else {
      stats.breakevens++;
    }

    // 2. Group by Date for Timeline
    if (!dailyMap[date]) dailyMap[date] = {};
    dailyMap[date][name] = (dailyMap[date][name] || 0) + 1;
  });

  // Finalize Strategy Stats
  const finalizedStrategies = Object.values(strategyMap).map((s) => {
    const winRate = s.totalTrades > 0 ? (s.wins / s.totalTrades) * 100 : 0;
    const avgProfit = s.wins > 0 ? s.totalProfit / s.wins : 0;
    const avgLoss = s.losses > 0 ? s.totalLoss / s.losses : 0;
    const profitFactor = s.totalLoss > 0 ? s.totalProfit / s.totalLoss : s.totalProfit > 0 ? 100 : 0;

    return {
      ...s,
      winRate,
      avgProfit,
      avgLoss,
      profitFactor,
    };
  });

  // Finalize Daily Usage
  const finalizedTimeline: DailyUsage[] = Object.entries(dailyMap)
    .map(([date, strategies]) => ({
      date,
      totalTrades: Object.values(strategies).reduce((a, b) => a + b, 0),
      strategies: Object.entries(strategies).map(([name, count]) => ({ name, count })),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    strategies: finalizedStrategies.sort((a, b) => b.totalTrades - a.totalTrades),
    timeline: finalizedTimeline,
    totalAssigned: trades.filter(t => !!t.strategy_used).length
  };
}