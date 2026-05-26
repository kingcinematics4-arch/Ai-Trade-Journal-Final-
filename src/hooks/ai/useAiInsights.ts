'use client';

import { useMemo } from 'react';
import type { DbTrade } from '@/lib/trades/types';
import { getTradePnL, normalizeStatus, parseSafeNumber } from '@/lib/trades/analytics';
import { computeAdvancedAnalytics } from '@/lib/trades/analyticsEngine';
import type { AiInsightsResult, AiScores, AiCoachFeedback, SessionPerformance, DayPerformance, MistakePattern, StreakAnalysis, EmotionAnalysis, SmartAlert, WeeklyReport } from '@/types/ai';

// ────────────────────── Emotion Scoring Map ──────────────────────
const EMOTION_SCORE: Record<string, number> = {
  calm: 5,
  confident: 4,
  neutral: 3,
  excited: 2,
  anxious: 2,
  bored: 1,
  fearful: 1,
  greedy: 1,
  revenge: 0,
};

// ────────────────────── Core compute functions ──────────────────────

function computeScores(trades: DbTrade[]): AiScores {
  if (trades.length === 0) {
    return { disciplineScore: 0, riskManagementScore: 0, emotionalControlScore: 0, executionQualityScore: 0, consistencyScore: 0, overallScore: 0 };
  }

  // Discipline: based on mistake_category frequency
  const noMistakeCount = trades.filter(t => (t.mistake_category ?? '').toLowerCase() === 'no mistake' || !t.mistake_category).length;
  const disciplineScore = Math.round((noMistakeCount / trades.length) * 100);

  // Risk Management: consistency of risk_amount
  const riskAmounts = trades.map(t => parseSafeNumber(t.risk_amount)).filter(r => r > 0);
  let riskManagementScore = 50;
  if (riskAmounts.length >= 2) {
    const avgRisk = riskAmounts.reduce((a, b) => a + b, 0) / riskAmounts.length;
    const variance = riskAmounts.reduce((a, r) => a + Math.pow(r - avgRisk, 2), 0) / riskAmounts.length;
    const cv = avgRisk > 0 ? Math.sqrt(variance) / avgRisk : 1;
    riskManagementScore = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
  }

  // Avg loss vs avg win
  const wins = trades.filter(t => normalizeStatus(t.trade_status) === 'win');
  const losses = trades.filter(t => normalizeStatus(t.trade_status) === 'loss');
  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / losses.length : 0;
  if (avgLoss > 0 && avgWin > 0) {
    const ratio = avgWin / avgLoss;
    riskManagementScore = Math.round((riskManagementScore + Math.min(100, ratio * 40)) / 2);
  }

  // Emotional Control: calm/confident/neutral emotion percentage
  const emotionalTrades = trades.filter(t => t.emotion_before);
  const calmTrades = emotionalTrades.filter(t => ['calm', 'confident', 'neutral'].includes((t.emotion_before ?? '').toLowerCase()));
  const revengeTrades = trades.filter(t => (t.emotion_before ?? '').toLowerCase() === 'revenge' || (t.mistake_category ?? '').toLowerCase().includes('revenge'));
  let emotionalControlScore = emotionalTrades.length > 0 ? Math.round((calmTrades.length / emotionalTrades.length) * 100) : 50;
  emotionalControlScore = Math.max(0, emotionalControlScore - revengeTrades.length * 10);

  // Execution Quality: RR ratio consistency, win rate
  const totalDecided = wins.length + losses.length;
  const winRate = totalDecided > 0 ? (wins.length / totalDecided) * 100 : 0;
  const executionQualityScore = Math.round(Math.min(100, winRate * 1.2));

  // Consistency: stability of daily trade counts
  const dayMap = new Map<string, number>();
  trades.forEach(t => {
    const d = t.trade_date ?? t.created_at ?? '';
    const key = d.split('T')[0];
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  });
  const dayCounts = Array.from(dayMap.values());
  let consistencyScore = 50;
  if (dayCounts.length >= 2) {
    const avgCount = dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length;
    const v = dayCounts.reduce((a, c) => a + Math.pow(c - avgCount, 2), 0) / dayCounts.length;
    const cv = avgCount > 0 ? Math.sqrt(v) / avgCount : 1;
    consistencyScore = Math.round(Math.max(0, Math.min(100, (1 - cv * 0.5) * 100)));
  }

  const overallScore = Math.round((disciplineScore + riskManagementScore + emotionalControlScore + executionQualityScore + consistencyScore) / 5);

  return { disciplineScore, riskManagementScore, emotionalControlScore, executionQualityScore, consistencyScore, overallScore };
}

function generateFeedback(trades: DbTrade[]): AiCoachFeedback[] {
  if (trades.length === 0) return [];
  const feedback: AiCoachFeedback[] = [];

  const wins = trades.filter(t => normalizeStatus(t.trade_status) === 'win');
  const losses = trades.filter(t => normalizeStatus(t.trade_status) === 'loss');
  const totalDecided = wins.length + losses.length;
  const winRate = totalDecided > 0 ? ((wins.length / totalDecided) * 100).toFixed(1) : '0';
  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / losses.length : 0;

  if (parseFloat(winRate) >= 55) {
    feedback.push({ message: `Your win rate of ${winRate}% is strong. Keep maintaining your edge.`, type: 'positive', category: 'Performance' });
  } else if (parseFloat(winRate) < 40 && totalDecided > 5) {
    feedback.push({ message: `Your win rate is ${winRate}%. Focus on higher-probability setups and be more selective.`, type: 'warning', category: 'Performance' });
  }

  if (avgLoss > 0 && avgWin > 0) {
    const ratio = (avgLoss / avgWin).toFixed(1);
    if (avgLoss > avgWin * 1.5) {
      feedback.push({ message: `Your average losing trade is ${ratio}x bigger than your average winner. Tighten your stop losses.`, type: 'negative', category: 'Risk Management' });
    } else if (avgWin > avgLoss * 1.5) {
      feedback.push({ message: `Great risk-reward profile! Your winners are ${(avgWin / avgLoss).toFixed(1)}x larger than your losers.`, type: 'positive', category: 'Risk Management' });
    }
  }

  // Strategy analysis
  const strategyMap = new Map<string, { wins: number; total: number; pnl: number }>();
  trades.forEach(t => {
    const s = t.strategy_used || 'General';
    const e = strategyMap.get(s) ?? { wins: 0, total: 0, pnl: 0 };
    e.total++;
    if (normalizeStatus(t.trade_status) === 'win') e.wins++;
    e.pnl += getTradePnL(t);
    strategyMap.set(s, e);
  });
  const bestStrategy = Array.from(strategyMap.entries())
    .filter(([, v]) => v.total >= 3)
    .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0];
  if (bestStrategy) {
    const wr = ((bestStrategy[1].wins / bestStrategy[1].total) * 100).toFixed(0);
    feedback.push({ message: `You perform best with ${bestStrategy[0]} strategy (${wr}% win rate across ${bestStrategy[1].total} trades).`, type: 'positive', category: 'Strategy' });
  }

  // Revenge trading
  const revengeTrades = trades.filter(t => (t.emotion_before ?? '').toLowerCase() === 'revenge' || (t.mistake_category ?? '').toLowerCase().includes('revenge'));
  if (revengeTrades.length > 0) {
    feedback.push({ message: `${revengeTrades.length} revenge trades detected. Step away after consecutive losses to reset mentally.`, type: 'negative', category: 'Psychology' });
  }

  // Overtrading detection
  const dayTradeCount = new Map<string, { count: number; pnl: number }>();
  trades.forEach(t => {
    const d = (t.trade_date ?? t.created_at ?? '').split('T')[0];
    const e = dayTradeCount.get(d) ?? { count: 0, pnl: 0 };
    e.count++;
    e.pnl += getTradePnL(t);
    dayTradeCount.set(d, e);
  });
  const overtradeDays = Array.from(dayTradeCount.values()).filter(d => d.count > 5 && d.pnl < 0);
  if (overtradeDays.length > 0) {
    feedback.push({ message: `Overtrading detected on ${overtradeDays.length} day(s). More trades don't mean more profit.`, type: 'warning', category: 'Discipline' });
  }

  return feedback;
}

function analyzeSessionPerformance(trades: DbTrade[]): SessionPerformance[] {
  const sessions: Record<string, { wins: number; total: number; pnl: number }> = {
    Asian: { wins: 0, total: 0, pnl: 0 },
    London: { wins: 0, total: 0, pnl: 0 },
    'New York': { wins: 0, total: 0, pnl: 0 },
    'Off-hours': { wins: 0, total: 0, pnl: 0 },
  };

  trades.forEach(t => {
    const date = new Date(t.trade_date ?? t.created_at ?? '');
    const hour = date.getUTCHours();
    let session = 'Off-hours';
    if (hour >= 0 && hour < 8) session = 'Asian';
    else if (hour >= 8 && hour < 13) session = 'London';
    else if (hour >= 13 && hour < 21) session = 'New York';

    sessions[session].total++;
    sessions[session].pnl += getTradePnL(t);
    if (normalizeStatus(t.trade_status) === 'win') sessions[session].wins++;
  });

  return Object.entries(sessions).map(([session, data]) => ({
    session,
    trades: data.total,
    winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
    pnl: Math.round(data.pnl * 100) / 100,
  }));
}

function analyzeDayPerformance(trades: DbTrade[]): DayPerformance[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData = days.map(() => ({ wins: 0, total: 0, pnl: 0 }));

  trades.forEach(t => {
    const d = new Date(t.trade_date ?? t.created_at ?? '');
    const dayIdx = d.getDay();
    dayData[dayIdx].total++;
    dayData[dayIdx].pnl += getTradePnL(t);
    if (normalizeStatus(t.trade_status) === 'win') dayData[dayIdx].wins++;
  });

  return days.map((day, idx) => ({
    day,
    trades: dayData[idx].total,
    winRate: dayData[idx].total > 0 ? Math.round((dayData[idx].wins / dayData[idx].total) * 100) : 0,
    pnl: Math.round(dayData[idx].pnl * 100) / 100,
  }));
}

function detectMistakePatterns(trades: DbTrade[]): MistakePattern[] {
  const mistakeMap = new Map<string, { count: number; totalLoss: number }>();
  trades.forEach(t => {
    const m = t.mistake_category;
    if (m && m !== 'No mistake') {
      const e = mistakeMap.get(m) ?? { count: 0, totalLoss: 0 };
      e.count++;
      const pnl = getTradePnL(t);
      if (pnl < 0) e.totalLoss += Math.abs(pnl);
      mistakeMap.set(m, e);
    }
  });

  return Array.from(mistakeMap.entries())
    .map(([mistake, data]) => ({
      mistake,
      frequency: data.count,
      avgLoss: data.count > 0 ? Math.round((data.totalLoss / data.count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

function analyzeStreaks(trades: DbTrade[]): StreakAnalysis {
  const sorted = [...trades].sort((a, b) => {
    const da = new Date(a.trade_date ?? a.created_at ?? '').getTime();
    const db = new Date(b.trade_date ?? b.created_at ?? '').getTime();
    return da - db;
  });

  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
  const afterWinTrades: DbTrade[] = [];
  const afterLossTrades: DbTrade[] = [];

  sorted.forEach((t, i) => {
    const s = normalizeStatus(t.trade_status);
    if (s === 'win') { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
    else if (s === 'loss') { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
    else { curWin = 0; curLoss = 0; }

    if (i > 0) {
      const prev = normalizeStatus(sorted[i - 1].trade_status);
      if (prev === 'win') afterWinTrades.push(t);
      if (prev === 'loss') afterLossTrades.push(t);
    }
  });

  const lastStatus = sorted.length > 0 ? normalizeStatus(sorted[sorted.length - 1].trade_status) : 'none';
  let currentCount = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (normalizeStatus(sorted[i].trade_status) === lastStatus) currentCount++;
    else break;
  }

  const afterWinWins = afterWinTrades.filter(t => normalizeStatus(t.trade_status) === 'win').length;
  const afterLossWins = afterLossTrades.filter(t => normalizeStatus(t.trade_status) === 'win').length;

  return {
    currentStreak: { type: (lastStatus === 'win' || lastStatus === 'loss') ? lastStatus : 'none', count: currentCount },
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
    behaviorAfterWins: {
      winRate: afterWinTrades.length > 0 ? Math.round((afterWinWins / afterWinTrades.length) * 100) : 0,
      avgPnl: afterWinTrades.length > 0 ? Math.round(afterWinTrades.reduce((a, t) => a + getTradePnL(t), 0) / afterWinTrades.length * 100) / 100 : 0,
      count: afterWinTrades.length,
    },
    behaviorAfterLosses: {
      winRate: afterLossTrades.length > 0 ? Math.round((afterLossWins / afterLossTrades.length) * 100) : 0,
      avgPnl: afterLossTrades.length > 0 ? Math.round(afterLossTrades.reduce((a, t) => a + getTradePnL(t), 0) / afterLossTrades.length * 100) / 100 : 0,
      count: afterLossTrades.length,
    },
  };
}

function analyzeEmotions(trades: DbTrade[]): EmotionAnalysis {
  const emoMap = new Map<string, { count: number; wins: number; pnlSum: number }>();
  const timeline: { date: string; score: number }[] = [];

  const sorted = [...trades].sort((a, b) => new Date(a.trade_date ?? a.created_at ?? '').getTime() - new Date(b.trade_date ?? b.created_at ?? '').getTime());

  sorted.forEach(t => {
    const emo = (t.emotion_before ?? '').toLowerCase();
    if (emo) {
      const e = emoMap.get(emo) ?? { count: 0, wins: 0, pnlSum: 0 };
      e.count++;
      if (normalizeStatus(t.trade_status) === 'win') e.wins++;
      e.pnlSum += getTradePnL(t);
      emoMap.set(emo, e);

      timeline.push({
        date: new Date(t.trade_date ?? t.created_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: EMOTION_SCORE[emo] ?? 3,
      });
    }
  });

  const calmData = emoMap.get('calm');
  const revengeTrades = trades.filter(t => (t.emotion_before ?? '').toLowerCase() === 'revenge' || (t.mistake_category ?? '').toLowerCase().includes('revenge'));

  return {
    emotionDistribution: Array.from(emoMap.entries()).map(([emotion, data]) => ({
      emotion,
      count: data.count,
      winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
      avgPnl: data.count > 0 ? Math.round((data.pnlSum / data.count) * 100) / 100 : 0,
    })).sort((a, b) => b.count - a.count),
    emotionalTrend: timeline,
    revengeTradeCount: revengeTrades.length,
    calmTradeWinRate: calmData && calmData.count > 0 ? Math.round((calmData.wins / calmData.count) * 100) : 0,
  };
}

function generateSmartAlerts(trades: DbTrade[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = Date.now();

  // Today's trades
  const today = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => (t.trade_date ?? t.created_at ?? '').startsWith(today));
  if (todayTrades.length > 5) {
    const todayPnl = todayTrades.reduce((a, t) => a + getTradePnL(t), 0);
    if (todayPnl < 0) {
      alerts.push({ id: 'overtrade-today', type: 'danger', message: `You've taken ${todayTrades.length} trades today with negative PnL. Consider stopping.`, timestamp: now });
    } else {
      alerts.push({ id: 'many-trades-today', type: 'warning', message: `${todayTrades.length} trades today. Make sure each one follows your plan.`, timestamp: now });
    }
  }

  // Loss streak
  const sorted = [...trades].sort((a, b) => new Date(b.trade_date ?? b.created_at ?? '').getTime() - new Date(a.trade_date ?? a.created_at ?? '').getTime());
  let lossStreak = 0;
  for (const t of sorted) {
    if (normalizeStatus(t.trade_status) === 'loss') lossStreak++;
    else break;
  }
  if (lossStreak >= 3) {
    alerts.push({ id: 'loss-streak', type: 'danger', message: `${lossStreak} consecutive losses. Take a break and reassess your strategy.`, timestamp: now });
  }

  // Risk increasing after losses
  if (sorted.length >= 3) {
    const recent3 = sorted.slice(0, 3);
    const risks = recent3.map(t => parseSafeNumber(t.risk_amount));
    if (risks[0] > 0 && risks[1] > 0 && risks[0] > risks[1] * 1.3 && normalizeStatus(sorted[1].trade_status) === 'loss') {
      alerts.push({ id: 'risk-increase', type: 'warning', message: 'Your risk is increasing after losses. Stick to your risk rules.', timestamp: now });
    }
  }

  // Weekly mistake frequency
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekTrades = trades.filter(t => new Date(t.trade_date ?? t.created_at ?? '').getTime() >= weekAgo);
  const weekMistakes = weekTrades.filter(t => t.mistake_category && t.mistake_category !== 'No mistake');
  if (weekMistakes.length >= 4) {
    alerts.push({ id: 'rule-breaks', type: 'warning', message: `You broke your trading rules ${weekMistakes.length} times this week.`, timestamp: now });
  }

  return alerts;
}

function determineTradingPersonality(trades: DbTrade[]): string {
  if (trades.length < 5) return 'New Trader';

  const totalDecided = trades.filter(t => ['win', 'loss'].includes(normalizeStatus(t.trade_status))).length;
  const winRate = totalDecided > 0 ? (trades.filter(t => normalizeStatus(t.trade_status) === 'win').length / totalDecided) * 100 : 0;
  const dayMap = new Map<string, number>();
  trades.forEach(t => {
    const d = (t.trade_date ?? t.created_at ?? '').split('T')[0];
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  });
  const avgTradesPerDay = dayMap.size > 0 ? trades.length / dayMap.size : 0;
  const noMistakeRate = trades.filter(t => !t.mistake_category || t.mistake_category === 'No mistake').length / trades.length;
  const emotionalTrades = trades.filter(t => ['revenge', 'greedy', 'fearful', 'anxious'].includes((t.emotion_before ?? '').toLowerCase())).length;
  const emotionalRate = emotionalTrades / trades.length;

  if (emotionalRate > 0.3) return 'The Emotional Trader';
  if (noMistakeRate > 0.8 && winRate > 50) return 'The Disciplined Trader';
  if (avgTradesPerDay > 5) return 'The Scalper';
  if (avgTradesPerDay <= 2 && winRate > 55) return 'The Sniper';
  if (avgTradesPerDay <= 3) return 'The Swing Trader';
  return 'The Risk Taker';
}

function generateWeeklyReport(trades: DbTrade[]): WeeklyReport | null {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekTrades = trades.filter(t => new Date(t.trade_date ?? t.created_at ?? '').getTime() >= weekAgo);
  if (weekTrades.length === 0) return null;

  const wins = weekTrades.filter(t => normalizeStatus(t.trade_status) === 'win');
  const totalDecided = weekTrades.filter(t => ['win', 'loss'].includes(normalizeStatus(t.trade_status))).length;
  const pnl = weekTrades.reduce((a, t) => a + getTradePnL(t), 0);

  let best: { asset: string; pnl: number } | null = null;
  let worst: { asset: string; pnl: number } | null = null;
  weekTrades.forEach(t => {
    const p = getTradePnL(t);
    if (!best || p > best.pnl) best = { asset: t.asset_name || 'Unknown', pnl: p };
    if (!worst || p < worst.pnl) worst = { asset: t.asset_name || 'Unknown', pnl: p };
  });

  const mistakes = weekTrades.filter(t => t.mistake_category && t.mistake_category !== 'No mistake');
  const mistakeFreq = new Map<string, number>();
  mistakes.forEach(t => {
    const m = t.mistake_category!;
    mistakeFreq.set(m, (mistakeFreq.get(m) ?? 0) + 1);
  });
  const topMistake = Array.from(mistakeFreq.entries()).sort((a, b) => b[1] - a[1])[0];

  const emotionalTrades = weekTrades.filter(t => t.emotion_before);
  const calmCount = emotionalTrades.filter(t => ['calm', 'confident', 'neutral'].includes((t.emotion_before ?? '').toLowerCase())).length;
  const emotionalTrend = emotionalTrades.length > 0 ? (calmCount / emotionalTrades.length > 0.6 ? 'Stable' : 'Volatile') : 'No data';

  return {
    weekStart: new Date(weekAgo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekEnd: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalTrades: weekTrades.length,
    pnl: Math.round(pnl * 100) / 100,
    winRate: totalDecided > 0 ? Math.round((wins.length / totalDecided) * 100) : 0,
    bestTrade: best,
    worstTrade: worst,
    mainMistake: topMistake ? topMistake[0] : 'None detected',
    mainImprovement: pnl > 0 ? 'Profitable week – keep it consistent' : 'Focus on reducing losses and being more selective',
    emotionalTrend,
    recommendations: [
      pnl < 0 ? 'Review your losing trades and identify common patterns' : 'Document what worked well this week',
      mistakes.length > 3 ? 'Create a pre-trade checklist to avoid recurring mistakes' : 'Maintain your disciplined approach',
      'Set clear daily loss limits for next week',
    ],
  };
}

function identifyStrengths(trades: DbTrade[]): string[] {
  if (trades.length === 0) return ['Start logging trades to discover your strengths'];
  const strengths: string[] = [];

  const wins = trades.filter(t => normalizeStatus(t.trade_status) === 'win');
  const totalDecided = trades.filter(t => ['win', 'loss'].includes(normalizeStatus(t.trade_status))).length;
  const winRate = totalDecided > 0 ? (wins.length / totalDecided) * 100 : 0;
  if (winRate >= 55) strengths.push(`Strong win rate of ${winRate.toFixed(1)}%`);

  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / wins.length : 0;
  const losses = trades.filter(t => normalizeStatus(t.trade_status) === 'loss');
  const avgLoss = losses.length > 0 ? losses.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / losses.length : 0;
  if (avgWin > avgLoss * 1.5) strengths.push(`Winners are ${(avgWin / avgLoss).toFixed(1)}x larger than losers`);

  const noMistake = trades.filter(t => !t.mistake_category || t.mistake_category === 'No mistake').length;
  if (noMistake / trades.length > 0.7) strengths.push('High discipline – following trading rules consistently');

  const calmTrades = trades.filter(t => (t.emotion_before ?? '').toLowerCase() === 'calm');
  if (calmTrades.length > trades.length * 0.5) strengths.push('Emotionally controlled – trading with calm mindset');

  if (strengths.length === 0) strengths.push('Building your trading edge – keep journaling consistently');
  return strengths.slice(0, 5);
}

function identifyWeaknesses(trades: DbTrade[]): string[] {
  if (trades.length === 0) return ['Not enough data – log more trades'];
  const weaknesses: string[] = [];

  const wins = trades.filter(t => normalizeStatus(t.trade_status) === 'win');
  const losses = trades.filter(t => normalizeStatus(t.trade_status) === 'loss');
  const totalDecided = wins.length + losses.length;
  const winRate = totalDecided > 0 ? (wins.length / totalDecided) * 100 : 0;
  if (winRate < 45 && totalDecided > 5) weaknesses.push(`Low win rate of ${winRate.toFixed(1)}% – review entry criteria`);

  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, t) => a + Math.abs(getTradePnL(t)), 0) / losses.length : 0;
  if (avgLoss > avgWin * 1.5 && avgWin > 0) weaknesses.push(`Losses ${(avgLoss / avgWin).toFixed(1)}x bigger than wins – tighten stops`);

  const revengeTrades = trades.filter(t => (t.emotion_before ?? '').toLowerCase() === 'revenge');
  if (revengeTrades.length > 0) weaknesses.push(`${revengeTrades.length} revenge trades detected – emotional discipline needed`);

  const mistakes = trades.filter(t => t.mistake_category && t.mistake_category !== 'No mistake');
  if (mistakes.length / trades.length > 0.3) weaknesses.push(`Trading rules broken in ${Math.round(mistakes.length / trades.length * 100)}% of trades`);

  if (weaknesses.length === 0) weaknesses.push('No major weaknesses detected – maintain consistency');
  return weaknesses.slice(0, 5);
}

function generateRecommendations(trades: DbTrade[]): string[] {
  if (trades.length === 0) return ['Start by logging at least 10 trades to get personalized recommendations'];
  const recs: string[] = [];

  const scores = computeScores(trades);
  if (scores.disciplineScore < 60) recs.push('Create a pre-trade checklist and commit to following it every trade');
  if (scores.riskManagementScore < 60) recs.push('Standardize your risk per trade – keep it consistent at 1-2% of capital');
  if (scores.emotionalControlScore < 60) recs.push('Practice mindfulness before trading sessions and set a max daily loss limit');
  if (scores.consistencyScore < 60) recs.push('Set a fixed trading schedule and stick to your preferred sessions');

  const dayPerf = analyzeDayPerformance(trades);
  const bestDay = dayPerf.filter(d => d.trades >= 3).sort((a, b) => b.pnl - a.pnl)[0];
  const worstDay = dayPerf.filter(d => d.trades >= 3).sort((a, b) => a.pnl - b.pnl)[0];
  if (bestDay && worstDay && bestDay.day !== worstDay.day && worstDay.pnl < 0) {
    recs.push(`Consider avoiding ${worstDay.day}s – your worst performing day. Focus on ${bestDay.day}s instead.`);
  }

  if (recs.length === 0) recs.push('Keep up the good work! Focus on maintaining consistency.');
  return recs.slice(0, 5);
}

// ────────────────────── Main Hook ──────────────────────

export function useAiInsights(trades: DbTrade[]): {
  insights: AiInsightsResult | null;
  loading: boolean;
  error: Error | null;
} {
  const insights = useMemo<AiInsightsResult | null>(() => {
    if (!trades || trades.length === 0) return null;

    try {
      const scores = computeScores(trades);
      const feedback = generateFeedback(trades);
      const sessionPerformance = analyzeSessionPerformance(trades);
      const dayPerformance = analyzeDayPerformance(trades);
      const mistakePatterns = detectMistakePatterns(trades);
      const streakAnalysis = analyzeStreaks(trades);
      const emotionAnalysis = analyzeEmotions(trades);
      const smartAlerts = generateSmartAlerts(trades);
      const tradingPersonality = determineTradingPersonality(trades);
      const weeklyReport = generateWeeklyReport(trades);
      const strengths = identifyStrengths(trades);
      const weaknesses = identifyWeaknesses(trades);
      const recommendations = generateRecommendations(trades);

      const dayTradeCount = new Map<string, { count: number; pnl: number }>();
      trades.forEach(t => {
        const d = (t.trade_date ?? t.created_at ?? '').split('T')[0];
        const e = dayTradeCount.get(d) ?? { count: 0, pnl: 0 };
        e.count++;
        e.pnl += getTradePnL(t);
        dayTradeCount.set(d, e);
      });
      const overtradingDetected = Array.from(dayTradeCount.values()).some(d => d.count > 5 && d.pnl < 0);

      const sorted = [...trades].sort((a, b) => new Date(a.trade_date ?? a.created_at ?? '').getTime() - new Date(b.trade_date ?? b.created_at ?? '').getTime());
      let revengeTradeDetected = false;
      for (let i = 2; i < sorted.length; i++) {
        if (
          normalizeStatus(sorted[i - 1].trade_status) === 'loss' &&
          normalizeStatus(sorted[i - 2].trade_status) === 'loss'
        ) {
          const prevRisk = parseSafeNumber(sorted[i - 1].risk_amount);
          const curRisk = parseSafeNumber(sorted[i].risk_amount);
          if (prevRisk > 0 && curRisk > prevRisk * 1.3) {
            revengeTradeDetected = true;
            break;
          }
        }
      }

      return {
        scores,
        feedback,
        strengths,
        weaknesses,
        recommendations,
        sessionPerformance,
        dayPerformance,
        mistakePatterns,
        streakAnalysis,
        emotionAnalysis,
        smartAlerts,
        tradingPersonality,
        weeklyReport,
        overtradingDetected,
        revengeTradeDetected,
      };
    } catch {
      return null;
    }
  }, [trades]);

  return {
    insights,
    loading: false,
    error: null,
  };
}
