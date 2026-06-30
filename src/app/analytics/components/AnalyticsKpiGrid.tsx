'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  Percent,
  Scale,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/trades/analytics';
import type { AdvancedAnalytics } from '@/lib/trades/analyticsEngine';

interface AnalyticsKpiGridProps {
  stats: AdvancedAnalytics;
}

export default function AnalyticsKpiGrid({ stats }: AnalyticsKpiGridProps) {
  const { t } = useTranslation();
  const cards = [
    {
      label: t('analytics.kpi.totalTrades'),
      value: String(stats.totalTrades),
      icon: <Activity size={18} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      gradient: 'gradient-primary',
    },
    {
      label: t('analytics.kpi.totalPnl'),
      value: formatCurrency(stats.totalPnl, { showSign: true }),
      icon: stats.totalPnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      iconBg: stats.totalPnl >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400',
      gradient: stats.totalPnl >= 0 ? 'gradient-profit' : 'gradient-loss', // Keep gradient for visual distinction
      valueColor: stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: t('analytics.kpi.winRate'),
      value: `${stats.winRate.toFixed(1)}%`,
      icon: <Target size={18} />,
      iconBg: 'bg-green-500/15 text-green-400',
      gradient: 'gradient-profit', // Keep gradient
      subtitle: `${stats.winCount} ${t('analytics.kpi.wins')}`,
    },
    {
      label: t('analytics.kpi.lossRate'),
      value: `${stats.lossRate.toFixed(1)}%`,
      icon: <Target size={18} />,
      iconBg: 'bg-red-500/15 text-red-400',
      gradient: 'gradient-loss', // Keep gradient
      subtitle: `${stats.lossCount} ${t('analytics.kpi.losses')}`,
    },
    {
      label: t('analytics.kpi.profitFactor'),
      value: stats.profitFactor >= 10 ? '10.0+' : stats.profitFactor.toFixed(2),
      icon: <Scale size={18} />,
      iconBg:
        stats.profitFactor >= 1.5
          ? 'bg-green-500/15 text-green-400'
          : stats.profitFactor >= 1.0
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-red-500/15 text-red-400',
      gradient: stats.profitFactor >= 1.0 ? 'gradient-profit' : 'gradient-loss', // Keep gradient
      valueColor:
        stats.profitFactor >= 1.5
          ? 'text-green-400'
          : stats.profitFactor >= 1.0
            ? 'text-amber-400'
            : 'text-red-400',
    },
    {
      label: t('analytics.kpi.avgRr'),
      value: `${stats.avgRr.toFixed(2)}R`,
      icon: <Percent size={18} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      gradient: 'gradient-primary', // Keep gradient
    },
    {
      label: t('analytics.kpi.avgWin'),
      value: formatCurrency(stats.averageWin),
      icon: <TrendingUp size={18} />,
      iconBg: 'bg-green-500/15 text-green-400',
      gradient: 'gradient-profit', // Keep gradient
      valueColor: 'text-green-400',
    },
    {
      label: t('analytics.kpi.avgLoss'),
      value: formatCurrency(stats.averageLoss),
      icon: <TrendingDown size={18} />,
      iconBg: 'bg-red-500/15 text-red-400',
      gradient: 'gradient-loss', // Keep gradient
      valueColor: 'text-red-400',
    },
    {
      label: t('analytics.kpi.bestTrade'),
      value: formatCurrency(stats.bestTrade?.pnl ?? 0, { showSign: true }),
      icon: <Trophy size={18} />,
      iconBg: 'bg-green-500/15 text-green-400',
      gradient: 'gradient-profit', // Keep gradient
      valueColor: 'text-green-400',
      subtitle: stats.bestTrade?.asset ?? '—',
    },
    {
      label: t('analytics.kpi.worstTrade'),
      value: formatCurrency(stats.worstTrade?.pnl ?? 0, { showSign: true }),
      icon: <AlertTriangle size={18} />,
      iconBg: 'bg-red-500/15 text-red-400',
      gradient: 'gradient-loss', // Keep gradient
      valueColor: 'text-red-400',
      subtitle: stats.worstTrade?.asset ?? '—',
    },
    {
      label: t('analytics.kpi.winningStreak'),
      value: `${stats.maxWinningStreak}${t('analytics.kpi.winsSuffix')}`,
      icon: <Flame size={18} />,
      iconBg: 'bg-amber-500/15 text-amber-400',
      gradient: 'gradient-warning', // Keep gradient
      subtitle:
        stats.currentStreak.type === 'win'
          ? t('analytics.kpi.currentStreak', { count: stats.currentStreak.count })
          : t('analytics.kpi.noActiveStreak'),
    },
    {
      label: t('analytics.kpi.losingStreak'),
      value: `${stats.maxLosingStreak}${t('analytics.kpi.lossesSuffix')}`,
      icon: <Flame size={18} />,
      iconBg: 'bg-red-500/15 text-red-400',
      gradient: 'gradient-loss', // Keep gradient
      subtitle:
        stats.currentStreak.type === 'loss'
          ? t('analytics.kpi.currentStreak', { count: stats.currentStreak.count })
          : t('analytics.kpi.noActiveStreak'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.03, ease: 'easeOut' }}
          className={`card-elevated card-hover p-4 ${card.gradient}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-1 truncate">{card.label}</p>
          <p
            className={`text-lg font-bold font-tabular truncate ${card.valueColor || 'text-foreground'}`}
          >
            {card.value}
          </p>
          {card.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
