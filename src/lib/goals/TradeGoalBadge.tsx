'use client';

import React from 'react';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { Target } from 'lucide-react';

export default function TradeGoalBadge({ goalId }: { goalId?: string }) {
  const goals = useGoalsStore(state => state.goals);
  const assignedGoal = goals.find(g => g.id === goalId);

  if (!assignedGoal) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-500">
      <Target size={10} />
      <span className="truncate max-w-[120px]">Assigned: {assignedGoal.title}</span>
    </div>
  );
}