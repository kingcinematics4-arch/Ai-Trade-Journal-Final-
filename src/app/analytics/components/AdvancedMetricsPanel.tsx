'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import {
  Percent,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  TrendingDown,
  Hourglass,
  Award,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/trades/analytics';
import type { AdvancedAnalytics } from '@/lib/trades/analyticsEngine';

interface AdvancedMetricsPanelProps {
  stats: AdvancedAnalytics;
}

export default function AdvancedMetricsPanel({ stats }: AdvancedMetricsPanelProps) {
  const { t } = useTranslation();
  const advancedItems = [
    {
      title: t('analytics.advanced.expectancy'),
      value: formatCurrency(stats.expectancy, { showSign: true }),
      desc: t('analytics.advanced.expectancyDesc'),
      icon: <Percent size={16} />,
      iconBg:
        stats.expectancy >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400',
      valueColor: stats.expectancy >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      title: t('analytics.advanced.sharpeRatio'),
      value: stats.sharpeRatio.toFixed(2),
      desc: t('analytics.advanced.sharpeRatioDesc'),
      icon: <Award size={16} />,
      iconBg:
        stats.sharpeRatio >= 1.0
          ? 'bg-green-500/15 text-green-400'
          : stats.sharpeRatio >= 0
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-red-500/15 text-red-400',
      valueColor:
        stats.sharpeRatio >= 1.0
          ? 'text-green-400'
          : stats.sharpeRatio >= 0
            ? 'text-amber-400'
            : 'text-red-400',
    },
    {
      title: t('analytics.advanced.maxDrawdown'),
      value: formatCurrency(-stats.maxDrawdown),
      desc: t('analytics.advanced.maxDrawdownDesc'),
      icon: <ShieldAlert size={16} />,
      iconBg: 'bg-red-500/15 text-red-400',
      valueColor: 'text-red-400',
    },
    {
      title: t('analytics.advanced.recoveryFactor'),
      value: stats.recoveryFactor.toFixed(2),
      desc: t('analytics.advanced.recoveryFactorDesc'),
      icon: <TrendingUp size={16} />,
      iconBg:
        stats.recoveryFactor >= 2.0
          ? 'bg-green-500/15 text-green-400'
          : stats.recoveryFactor >= 1.0
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-red-500/15 text-red-400',
      valueColor: stats.recoveryFactor >= 2.0 ? 'text-green-400' : 'text-foreground',
    },
    {
      title: t('analytics.advanced.avgHoldingTime'),
      value: stats.averageHoldingTime,
      desc: t('analytics.advanced.avgHoldingTimeDesc'),
      icon: <Hourglass size={16} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      valueColor: 'text-foreground',
    },
    {
      title: t('analytics.advanced.roi'),
      value: `${stats.roi.toFixed(1)}%`,
      desc: t('analytics.advanced.roiDesc'),
      icon: <Percent size={16} />,
      iconBg: stats.roi >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400',
      valueColor: stats.roi >= 0 ? 'text-green-400' : 'text-red-400',
    },
  ];

  return (
    <div className="card-elevated p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {t('analytics.advanced.title')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('analytics.advanced.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advancedItems.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="flex items-start gap-4 p-4.5 bg-muted/20 border border-border/50 rounded-xl hover:border-border transition-all duration-150"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
            >
              {item.icon}
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground font-semibold">{item.title}</p>
                <div className="group relative cursor-help">
                  <HelpCircle
                    size={12}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors"
                  />
                  <div className="absolute bottom-full right-0 mb-2 w-48 scale-0 group-hover:scale-100 transition-transform origin-bottom-right p-2.5 bg-card border border-border text-[10px] text-muted-foreground rounded-lg shadow-xl z-30 leading-relaxed font-normal">
                    {item.desc}
                  </div>
                </div>
              </div>
              <p className={`text-xl font-bold font-tabular leading-tight ${item.valueColor}`}>
                {item.value}
              </p>
              <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2 md:line-clamp-none">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
