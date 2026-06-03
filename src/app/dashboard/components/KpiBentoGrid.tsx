'use client';

import React from 'react';
import { TrendingUp, Target, Trophy, AlertTriangle, BarChart2, Flame, Inbox } from 'lucide-react';
import { useTrades } from '@/contexts/TradesContext';
import { formatCurrency } from '@/lib/trades/analytics';
import { KpiCardSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import KpiCard from './KpiCard';

export default function KpiBentoGrid() {
  const { analytics, isLoading, isEmpty } = useTrades();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`kpi-skel-${i}`} className={(i === 0 || i === 5) ? 'col-span-2' : 'col-span-1'}>
            <KpiCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="card-premium p-8">
        <EmptyState
          icon={<Inbox size={28} />}
          title="No performance data yet"
          description="Log your first trade to see P&L, win rate, streaks, and other analytics on your dashboard."
          actionLabel="Log your first trade"
          actionHref="/add-trade"
        />
      </div>
    );
  }

  const { totalPnl, winRate, winCount, lossCount, avgRr, currentStreak, bestTrade } = analytics;
  const pnlFormatted = formatCurrency(totalPnl, { showSign: true });
  const pnlVariant = totalPnl >= 0 ? 'profit' : 'loss';

  const streakLabel =
    currentStreak.type === 'none'
      ? '—'
      : `${currentStreak.type === 'win' ? 'W' : 'L'}${currentStreak.count}`;

  const streakSubtext =
    currentStreak.type === 'none'
      ? 'No active streak'
      : `${currentStreak.count} consecutive ${currentStreak.type === 'win' ? 'wins' : 'losses'}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 lg:gap-6 w-full min-w-0">
      <div className="col-span-2 lg:col-span-2">
        <KpiCard
          id="kpi-total-pnl"
          label="Total P&L"
          value={pnlFormatted}
          subtext={`${analytics.totalTrades} trade${analytics.totalTrades === 1 ? '' : 's'} logged`}
          trend={totalPnl >= 0 ? 'up' : 'down'}
          trendValue={analytics.totalTrades > 0 ? 'All time' : '—'}
          icon={<TrendingUp size={20} />}
          variant={pnlVariant}
          isHero
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-win-rate"
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtext={`${winCount} wins / ${lossCount} losses`}
          trend={winRate >= 50 ? 'up' : winRate > 0 ? 'down' : 'neutral'}
          trendValue={winCount + lossCount > 0 ? 'Closed trades' : '—'}
          icon={<Target size={18} />}
          variant="info"
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-rr-ratio"
          label="Avg RR Ratio"
          value={avgRr > 0 ? avgRr.toFixed(2) : '—'}
          subtext={avgRr > 0 ? 'Across logged trades' : 'No RR data yet'}
          trend="neutral"
          trendValue="—"
          icon={<BarChart2 size={18} />}
          variant="neutral"
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-streak"
          label="Current Streak"
          value={streakLabel}
          subtext={streakSubtext}
          trend={
            currentStreak.type === 'win' ? 'up' : currentStreak.type === 'loss' ? 'down' : 'neutral'
          }
          trendValue={currentStreak.type === 'none' ? '—' : 'Latest trades'}
          icon={<Flame size={18} />}
          variant={
            currentStreak.type === 'win'
              ? 'profit'
              : currentStreak.type === 'loss'
                ? 'loss'
                : 'neutral'
          }
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-best-trade"
          label="Best Trade"
          value={bestTrade ? formatCurrency(bestTrade.pnl, { showSign: true }) : '—'}
          subtext={bestTrade ? `${bestTrade.asset} — ${bestTrade.strategy}` : 'No trades yet'}
          trend={bestTrade && bestTrade.pnl > 0 ? 'up' : 'neutral'}
          trendValue={bestTrade?.date ?? '—'}
          icon={<Trophy size={18} />}
          variant={bestTrade && bestTrade.pnl > 0 ? 'profit' : 'neutral'}
        />
      </div>

      <div className="col-span-2 lg:col-span-2">
        <KpiCard
          id="kpi-discipline"
          label="Journal Activity"
          value={`${analytics.totalTrades}`}
          subtext="Trades in your journal — keep logging for deeper insights"
          trend="neutral"
          trendValue="All time"
          icon={<AlertTriangle size={18} />}
          variant="neutral"
        />
      </div>
    </div>
  );
}
