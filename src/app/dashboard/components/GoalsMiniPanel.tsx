'use client';

import React, { useEffect, useMemo } from 'react';
import { Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useTrades } from '@/contexts/TradesContext';
import { useTranslation } from '@/i18n/hooks/useTranslation';

export default function GoalsMiniPanel() {
  const { t } = useTranslation();
  const { trades, isLoading } = useTrades();
  const goals = useGoalsStore((state) => state.goals);
  const syncProgress = useGoalsStore((state) => state.syncProgress);

  useEffect(() => {
    if (!isLoading) {
      syncProgress(trades);
    }
  }, [trades, isLoading, syncProgress]);

  const activeGoals = useMemo(() => {
    return goals.filter((g) => g.status === 'active').slice(0, 3);
  }, [goals]);

  return (
    <div className="card-elevated p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{t('dashboard.goals.title')}</h4>
        </div>
        <Link
          href="/goals"
          className="text-xs text-muted-foreground hover:text-primary transition flex items-center"
        >
          {t('dashboard.goals.viewAll')} <ChevronRight size={14} />
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <EmptyState
            title={t('dashboard.goals.emptyTitle')}
            description={t('dashboard.goals.emptyDescription')}
            actionLabel={t('dashboard.goals.emptyAction')}
            actionHref="/goals"
            className="py-2"
          />
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {activeGoals.map((goal) => {
            // Use the progress from the store if it exists, otherwise calculate safely
            const progress =
              typeof goal.progress === 'number'
                ? goal.progress
                : goal.targetValue > 0
                  ? Math.min(
                      Math.max(
                        (Number(goal.currentValue || 0) / Number(goal.targetValue)) * 100,
                        0
                      ),
                      100
                    )
                  : 0;

            return (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground truncate">{goal.title}</span>
                  <span className="text-muted-foreground shrink-0">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
