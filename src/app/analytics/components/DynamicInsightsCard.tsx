'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type { AdvancedAnalytics } from '@/lib/trades/analyticsEngine';
import { formatCurrency } from '@/lib/trades/analytics';

interface DynamicInsightsCardProps {
  stats: AdvancedAnalytics;
}

interface InsightItem {
  id: string;
  type: 'positive' | 'warning' | 'negative';
  title: string;
  text: string;
}

export default function DynamicInsightsCard({ stats }: DynamicInsightsCardProps) {
  const insights = useMemo(() => {
    const list: InsightItem[] = [];

    if (stats.isEmpty || stats.totalTrades < 2) return list;

    // 1. Best Pair Insight
    if (stats.pairPerformance.length > 0) {
      const best = stats.pairPerformance[0];
      if (best.pnl > 0) {
        list.push({
          id: 'insight-best-pair',
          type: 'positive',
          title: `Asset Optimization — ${best.pair}`,
          text: `You perform exceptionally well on ${best.pair}. It is your top asset, generating a net return of ${formatCurrency(best.pnl)} over ${best.totalTrades} trades with an accurate win rate of ${best.winRate.toFixed(1)}%. Consider focusing more on setups in this market.`,
        });
      }
    }

    // 2. Risk/Reward (R-Ratio) Check
    if (stats.avgRr > 0) {
      if (stats.avgRr >= 2.0) {
        list.push({
          id: 'insight-r-ratio-high',
          type: 'positive',
          title: 'Outstanding Risk Management',
          text: `Your average reward-to-risk ratio is ${stats.avgRr.toFixed(2)}R. This is mathematically superior and guarantees that your account stays profitable even during brief drawdowns or low win-rate environments.`,
        });
      } else if (stats.avgRr < 1.1) {
        list.push({
          id: 'insight-r-ratio-low',
          type: 'warning',
          title: 'Risk/Reward Ratio Alert',
          text: `Your average reward-to-risk ratio is currently ${stats.avgRr.toFixed(2)}R. With an R-ratio below 1.0, your losing trades are bigger than your winners. Try squeezing more target yield out of high-confidence setups or setting tighter, structure-based stop losses.`,
        });
      }
    }

    // 3. Average Winner vs Average Loser
    const absAvgLoss = Math.abs(stats.averageLoss);
    if (stats.averageWin > 0 && absAvgLoss > 0) {
      const ratio = stats.averageWin / absAvgLoss;
      if (ratio >= 1.8) {
        list.push({
          id: 'insight-win-loss-ratio',
          type: 'positive',
          title: 'Strong Win/Loss Skewness',
          text: `Superb scaling! Your average winning trade (${formatCurrency(stats.averageWin)}) is ${ratio.toFixed(1)}x larger than your average losing trade (${formatCurrency(stats.averageLoss)}). This positive skewness represents professional risk-reward management.`,
        });
      } else if (ratio < 0.9) {
        list.push({
          id: 'insight-win-loss-ratio-low',
          type: 'negative',
          title: 'Negative Profit Distribution',
          text: `Warning: Your average losing trade (${formatCurrency(stats.averageLoss)}) is larger than your average winning trade (${formatCurrency(stats.averageWin)}) by ${((1 / ratio) * 100).toFixed(0)}%. You are cutting winners too short or holding losers too long. Practice taking partial profits at targets and strictly cutting trades at stop-loss structure.`,
        });
      }
    }

    // 4. Worst Pair Insight
    if (stats.pairPerformance.length > 1) {
      const worst = stats.pairPerformance[stats.pairPerformance.length - 1];
      if (worst.pnl < 0) {
        list.push({
          id: 'insight-worst-pair',
          type: 'warning',
          title: `Market Friction — ${worst.pair}`,
          text: `You are experiencing friction trading ${worst.pair}, resulting in a net loss of ${formatCurrency(worst.pnl)} across ${worst.totalTrades} trades. Consider lowering your trade size on this specific asset, checking for spread friction, or adapting strategy entry points.`,
        });
      }
    }

    // 5. Underperforming Strategy
    if (stats.strategyPerformance.length > 1) {
      const worstStrat = stats.strategyPerformance[stats.strategyPerformance.length - 1];
      if (worstStrat.pnl < 0) {
        list.push({
          id: 'insight-worst-strategy',
          type: 'warning',
          title: `Strategy Adaptation — ${worstStrat.strategy}`,
          text: `Your strategy "${worstStrat.strategy}" is currently underperforming with a total loss of ${formatCurrency(worstStrat.pnl)} and a win rate of ${worstStrat.winRate.toFixed(1)}%. Review whether market conditions (e.g. range vs. trend) are mismatching your setup parameters.`,
        });
      }
    }

    // 6. Streaks and Drawdowns Check
    if (stats.maxLosingStreak >= 4) {
      list.push({
        id: 'insight-losing-streak',
        type: 'negative',
        title: 'Drawdown Resilience Check',
        text: `You encountered a consecutive streak of ${stats.maxLosingStreak} losses. When entering a streak of 3+ consecutive losses, consider taking a 24-hour cooling-off period to prevent emotional trading (revenge trading) and preserve capital.`,
      });
    }

    // 7. General positive reinforcement if positive expectancy
    if (stats.expectancy > 0 && list.length < 3) {
      list.push({
        id: 'insight-expectancy-positive',
        type: 'positive',
        title: 'Mathematically Viable System',
        text: `Your overall system expectancy is positive at ${formatCurrency(stats.expectancy)} per trade. Your trading rules and executions represent a mathematically sound edge over the market. Trust your system and stick to your strict execution rules.`,
      });
    }

    return list.slice(0, 4); // Limit to top 4 insights for visual polish
  }, [stats]);

  const typeStyles = {
    positive: 'text-green-400 bg-green-500/10 border-green-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    negative: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const typeIcons = {
    positive: <CheckCircle2 size={15} />,
    warning: <AlertTriangle size={15} />,
    negative: <TrendingDown size={15} />,
  };

  if (insights.length === 0) {
    return (
      <div className="card-elevated p-5 flex flex-col items-center justify-center text-center py-10">
        <BrainCircuit size={32} className="text-violet-400 mb-3 animate-pulse" />
        <h4 className="font-semibold text-foreground text-sm mb-1">
          Generating Performance Insights
        </h4>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Log at least 2 trades with P&L information to unlock automated dynamic insights.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <BrainCircuit size={16} className="text-violet-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">AI Performance Insights</h4>
            <p className="text-[10px] text-muted-foreground">
              Pattern-based recommendations from your logged data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold rounded-full border border-violet-500/20">
          <Sparkles size={11} />
          COACH ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`flex items-start gap-3 p-4 rounded-xl border ${typeStyles[insight.type]}`}
          >
            <span className="flex-shrink-0 mt-0.5">{typeIcons[insight.type]}</span>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground leading-normal">{insight.title}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{insight.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
