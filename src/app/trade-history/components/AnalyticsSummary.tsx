'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import type { TradeAnalytics } from '@/lib/trades/types';
import { formatCurrency } from '@/lib/trades/analytics';

interface AnalyticsSummaryProps {
  analytics: TradeAnalytics;
}

export default function AnalyticsSummary({ analytics }: AnalyticsSummaryProps) {
  const cards = [
    {
      label: 'Total Trades',
      value: String(analytics.totalTrades),
      icon: <BarChart3 size={18} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      gradient: 'gradient-primary',
    },
    {
      label: 'Win Rate',
      value: `${analytics.winRate.toFixed(1)}%`,
      icon: <Target size={18} />,
      iconBg: analytics.winRate >= 50 ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400',
      gradient: analytics.winRate >= 50 ? 'gradient-profit' : 'gradient-warning',
      subtitle: `${analytics.winCount}W / ${analytics.lossCount}L`,
    },
    {
      label: 'Total P&L',
      value: formatCurrency(analytics.totalPnl, { showSign: true }),
      icon: analytics.totalPnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      iconBg: analytics.totalPnl >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400',
      gradient: analytics.totalPnl >= 0 ? 'gradient-profit' : 'gradient-loss',
      valueColor: analytics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Average RR',
      value: `${analytics.avgRr.toFixed(2)}R`,
      icon: <Target size={18} />,
      iconBg: 'bg-blue-500/15 text-blue-400',
      gradient: 'gradient-primary',
    },
    {
      label: 'Best Trade',
      value: formatCurrency(analytics.bestTrade?.pnl ?? 0, { showSign: true }),
      icon: <Trophy size={18} />,
      iconBg: 'bg-green-500/15 text-green-400',
      gradient: 'gradient-profit',
      valueColor: 'text-green-400',
      subtitle: analytics.bestTrade?.asset ?? '—',
    },
    {
      label: 'Worst Trade',
      value: formatCurrency(analytics.worstTrade?.pnl ?? 0, { showSign: true }),
      icon: <AlertTriangle size={18} />,
      iconBg: 'bg-red-500/15 text-red-400',
      gradient: 'gradient-loss',
      valueColor: 'text-red-400',
      subtitle: analytics.worstTrade?.asset ?? '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
          className={`card-elevated card-hover p-4 ${card.gradient}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-1">{card.label}</p>
          <p className={`text-lg font-bold font-tabular ${card.valueColor || 'text-foreground'}`}>
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
