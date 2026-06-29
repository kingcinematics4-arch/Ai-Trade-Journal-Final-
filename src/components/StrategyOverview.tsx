'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Zap, Activity, PieChart } from 'lucide-react';

export default function StrategyOverview({ analytics }: { analytics: any }) {
  const bestWr = [...analytics.strategies].sort((a, b) => b.winRate - a.winRate)[0];
  const worstWr = [...analytics.strategies].sort((a, b) => a.winRate - b.winRate)[0];
  const mostUsed = analytics.strategies[0];
  const leastUsed = analytics.strategies[analytics.strategies.length - 1];

  const cards = [
    {
      label: 'Total Strategies',
      value: analytics.strategies.length,
      sub: `${analytics.totalAssigned} Trades with Strategy`,
      icon: <PieChart size={20} className="text-blue-500" />,
    },
    {
      label: 'Most Used',
      value: mostUsed.name,
      sub: `${mostUsed.totalTrades} Trades`,
      icon: <Activity size={20} className="text-indigo-500" />,
    },
    {
      label: 'Best Win Rate',
      value: `${bestWr.winRate.toFixed(1)}%`,
      sub: bestWr.name,
      icon: <TrendingUp size={20} className="text-emerald-500" />,
      trend: 'up',
    },
    {
      label: 'Worst Win Rate',
      value: `${worstWr.winRate.toFixed(1)}%`,
      sub: worstWr.name,
      icon: <TrendingDown size={20} className="text-rose-500" />,
      trend: 'down',
    },
    {
      label: 'Strategy PnL',
      value: `$${analytics.strategies.reduce((a: any, b: any) => a + b.netPnL, 0).toLocaleString()}`,
      sub: 'Cumulative Edge',
      icon: <Zap size={20} className="text-amber-500" />,
    },
    {
      label: 'Least Used',
      value: leastUsed.name,
      sub: `${leastUsed.totalTrades} Trades`,
      icon: <Target size={20} className="text-slate-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card-premium p-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              {card.icon}
            </div>
            {card.trend && (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${card.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
              >
                {card.trend === 'up' ? 'TOP' : 'LOW'}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
              {card.label}
            </p>
            <h4 className="text-base font-bold text-white truncate">{card.value}</h4>
            <p className="text-xs text-muted-foreground/60 font-medium mt-1 truncate">{card.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
