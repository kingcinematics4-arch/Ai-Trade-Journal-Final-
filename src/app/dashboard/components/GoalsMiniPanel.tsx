'use client';

import React, { useEffect, useMemo } from 'react';
import { Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useTrades } from '@/contexts/TradesContext';

export default function GoalsMiniPanel() {
  const { trades, isLoading } = useTrades();
  const goals = useGoalsStore(state => state.goals);
  const syncProgress = useGoalsStore(state => state.syncProgress);

  useEffect(() => {
    if (!isLoading) {
      syncProgress(trades);
    }
  }, [trades, isLoading, goals.length, syncProgress]);

  // 4. Verify rerender dependencies and 5. Ensure selector updates correctly
  const activeGoals = useMemo(() => {
    return goals.filter(g => g.status === 'active').slice(0, 3);
  }, [goals]);

  // 6. Add temporary debug to verify sync
  // This log will show the values used for rendering the progress bar
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && activeGoals.length > 0) {
      console.log('[Goal UI Sync] Progress data:', activeGoals.map(g => ({
        title: g.title,
        profit: g.currentValue,
        target: g.targetValue,
        status: g.status,
        progress: g.progress,
        finalWidth: `${g.status?.toLowerCase() === 'completed' ? 100 : Math.min(Math.max(Number(g.progress) || 0, 0), 100)}%`
      })));
    }
  }, [activeGoals]);

  return (
    <div className="card-elevated p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Active Goals</h4>
        </div>
        <Link href="/goals" className="text-xs text-muted-foreground hover:text-primary transition flex items-center">
          View all <ChevronRight size={14} />
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <EmptyState
            title="No goals set"
            description="Set trading goals to track your discipline and targets."
            actionLabel="Set a goal"
            actionHref="/goals"
            className="py-2"
          />
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {activeGoals.map(goal => {
            // Use the progress from the store if it exists, otherwise calculate safely
            const progress = typeof goal.progress === 'number' 
              ? goal.progress 
              : goal.targetValue > 0 
                ? Math.min(Math.max((Number(goal.currentValue || 0) / Number(goal.targetValue)) * 100, 0), 100) 
                : 0;

            console.log(`[GoalsMiniPanel] Rendering "${goal.title}": ${progress}%`);

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
