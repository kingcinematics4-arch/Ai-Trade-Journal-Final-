'use client';

import React from 'react';
import { Target } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function GoalsMiniPanel() {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target size={15} className="text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Goals</h4>
      </div>

      <EmptyState
        title="No goals set"
        description="Trading goals and progress tracking will appear here once you configure targets in a future update."
        actionLabel="Focus on journaling"
        actionHref="/add-trade"
        className="py-4"
      />
    </div>
  );
}
