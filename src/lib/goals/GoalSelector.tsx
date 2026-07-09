'use client';

import React, { useMemo } from 'react';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { Target } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface GoalSelectorProps {
  value: string;
  onChange: (goalId: string) => void;
}

export default function GoalSelector({ value, onChange }: GoalSelectorProps) {
  const activeGoals = useGoalsStore((state) => state.getActiveGoals());

  const items = useMemo(() => {
    return [
      { id: '', label: 'No Goal', value: '' },
      ...activeGoals.map((goal) => ({
        id: goal.id,
        label: goal.title,
        value: goal.id,
      })),
    ];
  }, [activeGoals]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Target size={14} className="text-primary" />
        Assign To Goal
      </label>
      <SearchableSelect
        items={items}
        value={value || ''}
        onSelect={onChange}
        placeholder="No Goal"
        searchable={false}
        buttonClassName="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
      />
    </div>
  );
}
