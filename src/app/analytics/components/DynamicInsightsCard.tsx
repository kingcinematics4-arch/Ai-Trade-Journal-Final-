'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/hooks/useTranslation';
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
  const { t } = useTranslation();
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
          title: t('analytics.insights.assetOptimization', { pair: best.pair }),
          text: t('analytics.insights.assetOptimizationText', {
            pair: best.pair,
            pnl: formatCurrency(best.pnl),
            trades: best.totalTrades,
            winRate: best.winRate.toFixed(1)
          }),
        });
      }
    }

    // 2. Risk/Reward (R-Ratio) Check
    if (stats.avgRr > 0) {
      if (stats.avgRr >= 2.0) {
        list.push({
          id: 'insight-r-ratio-high',
          type: 'positive',
          title: t('analytics.insights.outstandingRisk'),
          text: t('analytics.insights.outstandingRiskText', { ratio: stats.avgRr.toFixed(2) }),
        });
      } else if (stats.avgRr < 1.1) {
        list.push({
          id: 'insight-r-ratio-low',
          type: 'warning',
          title: t('analytics.insights.rrRatioAlert'),
          text: t('analytics.insights.rrRatioAlertText', { ratio: stats.avgRr.toFixed(2) }),
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
          title: t('analytics.insights.strongWinLoss'),
          text: t('analytics.insights.strongWinLossText', {
            avgWin: formatCurrency(stats.averageWin),
            avgLoss: formatCurrency(stats.averageLoss),
            ratio: ratio.toFixed(1)
          }),
        });
      } else if (ratio < 0.9) {
        list.push({
          id: 'insight-win-loss-ratio-low',
          type: 'negative',
          title: t('analytics.insights.negativeDistribution'),
          text: t('analytics.insights.negativeDistributionText', {
            avgLoss: formatCurrency(stats.averageLoss),
            avgWin: formatCurrency(stats.averageWin),
            percent: ((1 / ratio) * 100).toFixed(0)
          }),
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
          title: t('analytics.insights.marketFriction', { pair: worst.pair }),
          text: t('analytics.insights.marketFrictionText', {
            pair: worst.pair,
            pnl: formatCurrency(worst.pnl),
            trades: worst.totalTrades
          }),
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
          title: t('analytics.insights.strategyAdaptation', { strategy: worstStrat.strategy }),
          text: t('analytics.insights.strategyAdaptationText', {
            strategy: worstStrat.strategy,
            pnl: formatCurrency(worstStrat.pnl),
            winRate: worstStrat.winRate.toFixed(1)
          }),
        });
      }
    }

    // 6. Streaks and Drawdowns Check
    if (stats.maxLosingStreak >= 4) {
      list.push({
        id: 'insight-losing-streak',
        type: 'negative',
        title: t('analytics.insights.drawdownResilience'),
        text: t('analytics.insights.drawdownResilienceText', { streak: stats.maxLosingStreak }),
      });
    }

    // 7. General positive reinforcement if positive expectancy
    if (stats.expectancy > 0 && list.length < 3) {
      list.push({
        id: 'insight-expectancy-positive',
        type: 'positive',
        title: t('analytics.insights.viableSystem'),
        text: t('analytics.insights.viableSystemText', { expectancy: formatCurrency(stats.expectancy) }),
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
          {t('analytics.insights.generating')}
        </h4>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {t('analytics.insights.generatingDesc')}
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
            <h4 className="text-sm font-semibold text-foreground">{t('analytics.insights.title')}</h4>
            <p className="text-[10px] text-muted-foreground">
              {t('analytics.insights.description')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold rounded-full border border-violet-500/20">
          <Sparkles size={11} />
          {t('analytics.insights.coachActive')}
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
