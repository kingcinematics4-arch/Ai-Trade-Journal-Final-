'use client';

import React from 'react';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { Target } from 'lucide-react';

interface GoalSelectorProps {
  value: string;
  onChange: (goalId: string) => void;
}

export default function GoalSelector({ value, onChange }: GoalSelectorProps) {
  const activeGoals = useGoalsStore(state => state.getActiveGoals());

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Target size={14} className="text-primary" />
        Assign To Goal
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
      >
        <option value="">No Goal</option>
        {activeGoals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </select>
    </div>
  );
}