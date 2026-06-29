import type { DbTrade, TradeStatus } from './types';
import { getTradePnL, parseSafeNumber, normalizeStatus } from './analytics';

export interface AdvancedAnalytics {
  isEmpty: boolean;
  totalTrades: number;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  avgRr: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: { pnl: number; asset: string; date: string } | null;
  worstTrade: { pnl: number; asset: string; date: string } | null;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  maxWinningStreak: number;
  maxLosingStreak: number;

  // Advanced Math
  expectancy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  averageHoldingTime: string;
  roi: number;

  // Aggregated charts datasets
  dailyPerformance: { day: string; pnl: number; trades: number }[];
  monthlyPerformance: { month: string; pnl: number; trades: number }[];
  pairPerformance: { pair: string; pnl: number; winRate: number; totalTrades: number }[];
  strategyPerformance: { strategy: string; pnl: number; winRate: number; totalTrades: number }[];
  equityCurve: { tradeNumber: number; date: string; cumulative: number; pnl: number }[];
  tradeFrequency: { date: string; count: number }[];
}

// DURATION PARSING HELPERS
export function parseDurationToMinutes(durationStr: string | null | undefined): number | null {
  if (!durationStr) return null;
  const str = durationStr.toLowerCase().trim();

  let totalMinutes = 0;
  let matched = false;

  const dayRegex = /(\d+(?:\.\d+)?)\s*(?:days|day|d)/g;
  const hourRegex = /(\d+(?:\.\d+)?)\s*(?:hours|hour|hr|h)/g;
  const minRegex = /(\d+(?:\.\d+)?)\s*(?:mins|min|m)/g;

  let match;
  while ((match = dayRegex.exec(str)) !== null) {
    totalMinutes += parseFloat(match[1]) * 24 * 60;
    matched = true;
  }
  dayRegex.lastIndex = 0; // Reset state

  while ((match = hourRegex.exec(str)) !== null) {
    totalMinutes += parseFloat(match[1]) * 60;
    matched = true;
  }
  hourRegex.lastIndex = 0;

  while ((match = minRegex.exec(str)) !== null) {
    totalMinutes += parseFloat(match[1]);
    matched = true;
  }
  minRegex.lastIndex = 0;

  if (!matched) {
    const rawNum = parseFloat(str);
    if (!isNaN(rawNum)) {
      if (str.includes('day') || str.includes('d')) return rawNum * 24 * 60;
      if (str.includes('hour') || str.includes('hr') || str.includes('h')) return rawNum * 60;
      return rawNum; // default to minutes
    }
    return null;
  }

  return totalMinutes;
}

export function formatMinutesToDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '—';

  const d = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60);
  const m = Math.round(totalMinutes % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);

  return parts.join(' ');
}

// MAIN ANALYTICS ENGINE EXPORT
export function computeAdvancedAnalytics(trades: DbTrade[]): AdvancedAnalytics {
  if (!trades || trades.length === 0) {
    return {
      isEmpty: true,
      totalTrades: 0,
      totalPnl: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: 0,
      lossRate: 0,
      profitFactor: 0,
      avgRr: 0,
      averageWin: 0,
      averageLoss: 0,
      bestTrade: null,
      worstTrade: null,
      currentStreak: { type: 'none', count: 0 },
      maxWinningStreak: 0,
      maxLosingStreak: 0,
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      recoveryFactor: 0,
      averageHoldingTime: '—',
      roi: 0,
      dailyPerformance: [],
      monthlyPerformance: [],
      pairPerformance: [],
      strategyPerformance: [],
      equityCurve: [],
      tradeFrequency: [],
    };
  }

  // Chronological sort for equity, streaks, drawdowns
  const chronologicalTrades = [...trades].sort((a, b) => {
    const dateA = new Date(a.trade_date || a.created_at || '').getTime();
    const dateB = new Date(b.trade_date || b.created_at || '').getTime();
    return dateA - dateB;
  });

  const totalTrades = trades.length;
  let totalPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let winPnlSum = 0;
  let lossPnlSum = 0;
  let rrSum = 0;
  let rrCount = 0;
  let totalRiskAmount = 0;

  let bestTrade: AdvancedAnalytics['bestTrade'] = null;
  let worstTrade: AdvancedAnalytics['worstTrade'] = null;

  // Streaks Tracking
  let maxWinningStreak = 0;
  let maxLosingStreak = 0;
  let currentStreakCount = 0;
  let currentStreakType: 'win' | 'loss' | 'none' = 'none';

  // Duration Parsing
  let totalDurationMinutes = 0;
  let durationCount = 0;

  // Equity Curve Construction
  let runningPnl = 0;
  let peakEquity = 0;
  let maxDrawdown = 0;
  const equityCurve: AdvancedAnalytics['equityCurve'] = [
    { tradeNumber: 0, date: 'Start', cumulative: 0, pnl: 0 },
  ];

  chronologicalTrades.forEach((t, index) => {
    const pnl = getTradePnL(t);
    const status = normalizeStatus(t.trade_status);
    const rr = parseSafeNumber(t.rr_ratio);
    const risk = parseSafeNumber(t.risk_amount);
    const dateLabel = new Date(t.trade_date || t.created_at || '').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    totalPnl += pnl;
    runningPnl += pnl;

    // Standard KPI sums
    if (status === 'win') {
      winCount++;
      winPnlSum += pnl;
    } else if (status === 'loss') {
      lossCount++;
      lossPnlSum += pnl; // will be negative or absolute based on data
    } else {
      breakevenCount++;
    }

    if (rr > 0) {
      rrSum += rr;
      rrCount++;
    }

    if (risk > 0) {
      totalRiskAmount += risk;
    }

    // Best/Worst Trade
    if (!bestTrade || pnl > bestTrade.pnl) {
      bestTrade = {
        pnl,
        asset: t.asset_name || 'Unknown',
        date: new Date(t.trade_date || t.created_at || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    }

    if (!worstTrade || pnl < worstTrade.pnl) {
      worstTrade = {
        pnl,
        asset: t.asset_name || 'Unknown',
        date: new Date(t.trade_date || t.created_at || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    }

    // Dynamic streaks parsing
    if (status === 'win') {
      if (currentStreakType === 'win') {
        currentStreakCount++;
      } else {
        currentStreakType = 'win';
        currentStreakCount = 1;
      }
      maxWinningStreak = Math.max(maxWinningStreak, currentStreakCount);
    } else if (status === 'loss') {
      if (currentStreakType === 'loss') {
        currentStreakCount++;
      } else {
        currentStreakType = 'loss';
        currentStreakCount = 1;
      }
      maxLosingStreak = Math.max(maxLosingStreak, currentStreakCount);
    } else {
      // Breakeven breaks active win/loss streaks
      currentStreakType = 'none';
      currentStreakCount = 0;
    }

    // Average holding time
    const minutes = parseDurationToMinutes(t.trade_duration);
    if (minutes !== null) {
      totalDurationMinutes += minutes;
      durationCount++;
    }

    // Equity Curve & Max Drawdown Peak mapping
    equityCurve.push({
      tradeNumber: index + 1,
      date: dateLabel,
      cumulative: Number(runningPnl.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
    });

    peakEquity = Math.max(peakEquity, runningPnl);
    const dd = peakEquity - runningPnl;
    maxDrawdown = Math.max(maxDrawdown, dd);
  });

  // Safe KPI calculations
  const totalDecided = winCount + lossCount;
  const winRate = totalTrades ? (winCount / totalTrades) * 100 : 0;
  const lossRate = totalTrades ? (lossCount / totalTrades) * 100 : 0;

  const absLossSum = Math.abs(lossPnlSum);
  const profitFactor =
    absLossSum > 0 ? Number((winPnlSum / absLossSum).toFixed(2)) : winPnlSum > 0 ? 10.0 : 0;

  const avgRr = rrCount ? Number((rrSum / rrCount).toFixed(2)) : 0;
  const averageWin = winCount ? Number((winPnlSum / winCount).toFixed(2)) : 0;
  const averageLoss = lossCount ? Number((lossPnlSum / lossCount).toFixed(2)) : 0;

  // Expectancy calculation
  // (Win% * AvgWin) + (Loss% * AvgLoss) -> since AvgLoss is negative, it correctly subtracts
  const expectancy = Number(
    ((winRate / 100) * averageWin + (lossRate / 100) * averageLoss).toFixed(2)
  );

  // Sharpe Ratio
  // Sharpe = average trade P&L / standard deviation of P&Ls
  let sharpeRatio = 0;
  if (totalTrades >= 2) {
    const pnls = trades.map((t) => getTradePnL(t));
    const mean = totalPnl / totalTrades;
    const variance = pnls.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / totalTrades;
    const stdDev = Math.sqrt(variance);
    sharpeRatio = stdDev > 0 ? Number((mean / stdDev).toFixed(2)) : 0;
  }

  // Recovery Factor
  const recoveryFactor =
    maxDrawdown > 0 ? Number((totalPnl / maxDrawdown).toFixed(2)) : totalPnl > 0 ? 10.0 : 0;

  // ROI
  const roi = totalRiskAmount > 0 ? Number(((totalPnl / totalRiskAmount) * 100).toFixed(1)) : 0;

  // Average Holding Time Formatted
  const averageHoldingTime = durationCount
    ? formatMinutesToDuration(totalDurationMinutes / durationCount)
    : '—';

  // Current Streak at end of timeline
  // We already computed this sequentially, so currentStreak holds chronological ending streak
  const lastStatus =
    trades.length > 0
      ? normalizeStatus(chronologicalTrades[chronologicalTrades.length - 1].trade_status)
      : 'breakeven';
  let finalStreakType: 'win' | 'loss' | 'none' = 'none';
  let finalStreakCount = 0;

  if (lastStatus === 'win' || lastStatus === 'loss') {
    finalStreakType = lastStatus;
    for (let i = chronologicalTrades.length - 1; i >= 0; i--) {
      if (normalizeStatus(chronologicalTrades[i].trade_status) === finalStreakType) {
        finalStreakCount++;
      } else {
        break;
      }
    }
  }

  // CHART DATASET AGGREGATIONS

  // 1. Daily Performance (Monday - Sunday)
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailyPnls = Array(7).fill(0);
  const dailyTrades = Array(7).fill(0);

  trades.forEach((t) => {
    const date = new Date(t.trade_date || t.created_at || '');
    // getDay() is 0 (Sunday) to 6 (Saturday). We map Sunday to index 6, Monday-Saturday to 0-5.
    const day = date.getDay();
    const index = day === 0 ? 6 : day - 1;
    dailyPnls[index] += getTradePnL(t);
    dailyTrades[index]++;
  });

  const dailyPerformance = weekdays.map((day, idx) => ({
    day,
    pnl: Number(dailyPnls[idx].toFixed(2)),
    trades: dailyTrades[idx],
  }));

  // 2. Monthly Performance (e.g. Jan 2026)
  const monthlyMap = new Map<string, { pnl: number; trades: number; sortKey: number }>();
  trades.forEach((t) => {
    const date = new Date(t.trade_date || t.created_at || '');
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const sortKey = date.getFullYear() * 12 + date.getMonth();

    const entry = monthlyMap.get(monthName) ?? { pnl: 0, trades: 0, sortKey };
    entry.pnl += getTradePnL(t);
    entry.trades++;
    monthlyMap.set(monthName, entry);
  });

  const monthlyPerformance = Array.from(monthlyMap.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([month, data]) => ({
      month,
      pnl: Number(data.pnl.toFixed(2)),
      trades: data.trades,
    }));

  // 3. Trade Frequency (by unique dates)
  const frequencyMap = new Map<string, { count: number; sortKey: number }>();
  trades.forEach((t) => {
    const date = new Date(t.trade_date || t.created_at || '');
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const sortKey = date.getTime();

    const entry = frequencyMap.get(dateStr) ?? { count: 0, sortKey };
    entry.count++;
    frequencyMap.set(dateStr, entry);
  });

  const tradeFrequency = Array.from(frequencyMap.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([date, data]) => ({
      date,
      count: data.count,
    }));

  // 4. Pair / Asset Performance
  const pairMap = new Map<string, { pnl: number; wins: number; total: number }>();
  trades.forEach((t) => {
    const asset = t.asset_name || 'Unknown';
    const entry = pairMap.get(asset) ?? { pnl: 0, wins: 0, total: 0 };
    entry.pnl += getTradePnL(t);
    entry.total++;
    if (normalizeStatus(t.trade_status) === 'win') {
      entry.wins++;
    }
    pairMap.set(asset, entry);
  });

  const pairPerformance = Array.from(pairMap.entries())
    .map(([pair, data]) => ({
      pair,
      pnl: Number(data.pnl.toFixed(2)),
      winRate: Number(((data.wins / data.total) * 100).toFixed(1)),
      totalTrades: data.total,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // 5. Strategy Performance
  const strategyMap = new Map<string, { pnl: number; wins: number; total: number }>();
  trades.forEach((t) => {
    const strategy = t.strategy_used || 'General';
    const entry = strategyMap.get(strategy) ?? { pnl: 0, wins: 0, total: 0 };
    entry.pnl += getTradePnL(t);
    entry.total++;
    if (normalizeStatus(t.trade_status) === 'win') {
      entry.wins++;
    }
    strategyMap.set(strategy, entry);
  });

  const strategyPerformance = Array.from(strategyMap.entries())
    .map(([strategy, data]) => ({
      strategy,
      pnl: Number(data.pnl.toFixed(2)),
      winRate: Number(((data.wins / data.total) * 100).toFixed(1)),
      totalTrades: data.total,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  return {
    isEmpty: false,
    totalTrades,
    totalPnl: Number(totalPnl.toFixed(2)),
    winCount,
    lossCount,
    breakevenCount,
    winRate: Number(winRate.toFixed(1)),
    lossRate: Number(lossRate.toFixed(1)),
    profitFactor,
    avgRr,
    averageWin,
    averageLoss,
    bestTrade,
    worstTrade,
    currentStreak: { type: finalStreakType, count: finalStreakCount },
    maxWinningStreak,
    maxLosingStreak,
    expectancy,
    sharpeRatio,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    recoveryFactor,
    averageHoldingTime,
    roi,
    dailyPerformance,
    monthlyPerformance,
    pairPerformance,
    strategyPerformance,
    equityCurve,
    tradeFrequency,
  };
}
