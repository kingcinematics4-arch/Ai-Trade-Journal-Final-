'use client';

import React from 'react';
import { TrendingUp, Target, Trophy, AlertTriangle, BarChart2, Flame, Inbox } from 'lucide-react';
import { useTrades } from '@/contexts/TradesContext';
import { formatCurrency } from '@/lib/trades/analytics';
import { KpiCardSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import KpiCard from './KpiCard';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export default function KpiBentoGrid() {
  const { t } = useTranslation();
  const { analytics, isLoading, isEmpty } = useTrades();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`kpi-skel-${i}`} className={i === 0 || i === 5 ? 'col-span-2' : 'col-span-1'}>
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
          title={t('dashboard.emptyState.title')}
          description={t('dashboard.emptyState.description')}
          actionLabel={t('dashboard.emptyState.actionLabel')}
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
      ? '0'
      : `${currentStreak.type === 'win' ? 'W' : 'L'}${currentStreak.count}`;

  const streakSubtext = t('dashboard.streak.consecutive', {
    count: currentStreak.type === 'none' ? 0 : currentStreak.count,
    type:
      currentStreak.type === 'none'
        ? t('dashboard.streak.trades')
        : currentStreak.type === 'win'
          ? t('dashboard.streak.wins')
          : t('dashboard.streak.losses'),
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 lg:gap-6 w-full min-w-0">
      <div className="col-span-2 lg:col-span-2">
        <KpiCard
          id="kpi-total-pnl"
          label="TOTAL P&L"
          value={pnlFormatted}
          subtext={`${analytics.totalTrades} trades`}
          trend={totalPnl >= 0 ? 'up' : 'down'}
          trendValue={analytics.totalTrades > 0 ? t('dashboard.kpi.allTime') : ''}
          icon={<TrendingUp size={20} />}
          variant={pnlVariant}
          isHero
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-win-rate"
          label="WIN RATE"
          value={`${winRate.toFixed(1)}%`}
          subtext={`${winCount}W / ${lossCount}L`}
          trend={winRate >= 50 ? 'up' : winRate > 0 ? 'down' : 'neutral'}
          trendValue={winCount + lossCount > 0 ? t('dashboard.kpi.closedTrades') : ''}
          icon={<Target size={18} />}
          variant="info"
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-rr-ratio"
          label="RISK/REWARD"
          value={avgRr > 0 ? `1 : ${avgRr.toFixed(1)}` : '1 : 0.0'}
          subtext="Portfolio average"
          trend={avgRr > 1.5 ? 'up' : avgRr > 0 ? 'neutral' : 'neutral'}
          trendValue={avgRr > 0 ? t('dashboard.kpi.allTime') : ''}
          icon={<BarChart2 size={18} />}
          variant={avgRr > 1.5 ? 'profit' : 'neutral'}
        />
      </div>

      <div className="col-span-1">
        <KpiCard
          id="kpi-streak"
          label="STREAK"
          value={streakLabel}
          subtext={currentStreak.type === 'none' ? 'No active streak' : streakSubtext}
          trend={
            currentStreak.type === 'win' ? 'up' : currentStreak.type === 'loss' ? 'down' : 'neutral'
          }
          trendValue={currentStreak.type === 'none' ? '' : t('dashboard.kpi.latestTrades')}
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
          label="BEST TRADE"
          value={bestTrade ? formatCurrency(bestTrade.pnl, { showSign: true }) : '$0.00'}
          subtext={bestTrade ? bestTrade.asset : t('dashboard.kpi.noTradesYet')}
          trend={bestTrade && bestTrade.pnl > 0 ? 'up' : 'neutral'}
          trendValue={bestTrade?.date ?? ''}
          icon={<Trophy size={18} />}
          variant={bestTrade && bestTrade.pnl > 0 ? 'profit' : 'neutral'}
        />
      </div>

      <div className="col-span-2 lg:col-span-2">
        <KpiCard
          id="kpi-discipline"
          label="TOTAL TRADES"
          value={`${analytics.totalTrades}`}
          subtext="Journal activity"
          trend="neutral"
          trendValue={analytics.totalTrades > 0 ? t('dashboard.kpi.allTime') : ''}
          icon={<AlertTriangle size={18} />}
          variant="neutral"
        />
      </div>
    </div>
  );
}
