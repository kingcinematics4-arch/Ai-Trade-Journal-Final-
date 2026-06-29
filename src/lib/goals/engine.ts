import type { Goal } from './types';
import type { DbTrade, TradeInsight } from '@/lib/trades/types';
import { getTradePnL, normalizeStatus, parseSafeNumber } from '@/lib/trades/analytics';

export function calculateGoalProgress(
  goal: Goal,
  trades: (DbTrade & { goalId?: string; goal_id?: string })[],
  aiInsights: TradeInsight[] = []
): Goal {
  const updatedGoal = { ...goal };

  // ROOT CAUSE FIX: Convert target to number and sanitize potential string input (commas/symbols)
  const rawTarget = String(goal.targetValue || '').replace(/[^\d.-]/g, '');
  const targetValue = Number(rawTarget || 0);
  const safeTarget = isNaN(targetValue) ? 0 : targetValue;

  let currentValue = 0;
  let targetAchieved = false;

  // Task 6 & 7: Only consider trades explicitly linked to this goal ID
  // Ensure we handle both camelCase and snake_case for compatibility
  const relevantTrades = trades.filter((t) => t.goalId === goal.id || t.goal_id === goal.id);

  console.log(
    `[Goal Engine Debug] Goal: "${goal.title}", Relevant Trades found: ${relevantTrades.length}`
  );

  switch (goal.type) {
    case 'profit': {
      const goalProfit = relevantTrades.reduce((acc, t) => acc + Number(getTradePnL(t) || 0), 0);
      currentValue = Number(goalProfit.toFixed(2));
      targetAchieved = safeTarget > 0 && currentValue >= safeTarget;
      break;
    }

    case 'win_rate': {
      const wins = relevantTrades.filter((t) => normalizeStatus(t.trade_status) === 'win').length;
      const totalDecided = relevantTrades.filter((t) =>
        ['win', 'loss'].includes(normalizeStatus(t.trade_status))
      ).length;
      const winRate = totalDecided > 0 ? (wins / totalDecided) * 100 : 0;
      currentValue = Number(winRate.toFixed(2));
      targetAchieved = safeTarget > 0 && currentValue >= safeTarget;
      break;
    }

    case 'trade_count':
      currentValue = Number(relevantTrades.length);
      targetAchieved = safeTarget > 0 && currentValue >= safeTarget;
      break;

    case 'max_loss': {
      // The max loss goal is to KEEP loss smaller than the target.
      // Current value is the largest loss magnitude.
      const losses = relevantTrades
        .map((t) => Number(getTradePnL(t) || 0))
        .filter((pnl) => pnl < 0);
      const maxLoss = losses.length > 0 ? Math.abs(Math.min(...losses)) : 0;
      currentValue = Number(maxLoss.toFixed(2));

      // If current value (a single loss) exceeds the limit, it's failed.
      if (safeTarget > 0 && currentValue > safeTarget) {
        updatedGoal.status = 'failed';
      }

      // Progress calculation for max loss is tricky. Let's do a percentage of the limit reached.
      const maxLossProgress = safeTarget > 0 ? Math.min(100, (currentValue / safeTarget) * 100) : 0;
      updatedGoal.currentValue = currentValue;
      updatedGoal.progress = maxLossProgress;

      // Max loss goals stay active until failed; they don't auto-complete.
      return updatedGoal;
    }

    case 'rr_ratio': {
      const rrs = relevantTrades.map((t) => parseSafeNumber(t.rr_ratio)).filter((rr) => rr > 0);
      const avgRr = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0;
      currentValue = Number(avgRr.toFixed(2));
      targetAchieved = safeTarget > 0 && currentValue >= safeTarget;
      break;
    }

    case 'discipline': {
      const noMistakeCount = relevantTrades.filter(
        (t) => (t.mistake_category ?? '').toLowerCase() === 'no mistake' || !t.mistake_category
      ).length;
      const discScore =
        relevantTrades.length > 0 ? (noMistakeCount / relevantTrades.length) * 100 : 0;
      currentValue = Number(discScore.toFixed(2));
      targetAchieved = safeTarget > 0 && currentValue >= safeTarget;
      break;
    }

    default:
      currentValue = Number(goal.currentValue || 0); // Fallback to manually tracked
      targetAchieved = safeTarget > 0 && currentValue >= safeTarget;
      break;
  }

  // Debug logs for verification in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Goal Engine] Recalculating "${goal.title}":`, {
      goalType: goal.type,
      relevantTradesCount: relevantTrades.length,
      startingPnL: goal.startingPnL,
      currentValue,
      targetValue: safeTarget,
      isAchieved: targetAchieved,
      comparison: `${currentValue} >= ${safeTarget}`,
    });
  }

  // Extra safety logging for progress calculation
  console.log(`[Goal Engine Calculation]`, {
    title: goal.title,
    current: currentValue,
    target: safeTarget,
    progress: (currentValue / safeTarget) * 100,
  });

  // Normalize and calculate progress percentage
  updatedGoal.currentValue = currentValue;
  const current = Number(currentValue || 0);
  const target = Number(safeTarget || 0);

  // 1. Calculate raw percentage and 2. Clamp between 0 and 100
  const rawProgress = target > 0 ? (current / target) * 100 : 0;
  const clampedProgress = Math.min(Math.max(rawProgress, 0), 100);
  const finalProgress = isNaN(clampedProgress) ? 0 : clampedProgress;

  updatedGoal.progress = Number(finalProgress.toFixed(2));

  // Check completion status using the logic determined in the switch
  if ((targetAchieved || (target > 0 && current >= target)) && updatedGoal.status === 'active') {
    updatedGoal.status = 'completed';
    updatedGoal.progress = 100; // Force 100% on completion
  }

  // Check deadline
  if (updatedGoal.deadline && updatedGoal.status === 'active') {
    const now = new Date().getTime();
    const deadline = new Date(updatedGoal.deadline).getTime();
    if (now > deadline) {
      updatedGoal.status = 'failed';
    }
  }

  return updatedGoal;
}

export function generateAiGoalSuggestions(trades: DbTrade[]): Partial<Goal>[] {
  const suggestions: Partial<Goal>[] = [];

  if (trades.length < 5) {
    suggestions.push({
      title: 'Log Your First 10 Trades',
      description: 'Build the habit of journaling every single trade.',
      type: 'trade_count',
      targetValue: 10,
      category: 'consistency',
    });
    return suggestions;
  }

  const wins = trades.filter((t) => normalizeStatus(t.trade_status) === 'win').length;
  const totalDecided = trades.filter((t) =>
    ['win', 'loss'].includes(normalizeStatus(t.trade_status))
  ).length;
  const winRate = totalDecided > 0 ? (wins / totalDecided) * 100 : 0;

  if (winRate < 45) {
    suggestions.push({
      title: 'Improve Win Rate to 50%',
      description: 'Focus on higher probability setups.',
      type: 'win_rate',
      targetValue: 50,
      category: 'performance',
    });
  }

  const mistakes = trades.filter((t) => t.mistake_category && t.mistake_category !== 'No mistake');
  if (mistakes.length / trades.length > 0.3) {
    suggestions.push({
      title: 'Maintain 80% Discipline',
      description: 'Follow your rules closely and reduce mistakes.',
      type: 'discipline',
      targetValue: 80,
      category: 'psychology',
    });
  }

  const losses = trades.map((t) => getTradePnL(t)).filter((pnl) => pnl < 0);
  if (losses.length > 0) {
    const avgLoss = Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length);
    suggestions.push({
      title: `Keep Max Loss under $${Math.round(avgLoss * 1.5)}`,
      description: 'Protect your capital by honoring stop losses.',
      type: 'max_loss',
      targetValue: Math.round(avgLoss * 1.5),
      category: 'risk',
    });
  }

  return suggestions.slice(0, 3);
}
