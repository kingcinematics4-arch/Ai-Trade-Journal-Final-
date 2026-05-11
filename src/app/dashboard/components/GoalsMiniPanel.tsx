'use client';
import React from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

// BACKEND: GET /api/goals/progress — replace with real goal progress data
const goals = [
  {
    id: 'goal-001',
    label: 'Monthly Profit Target',
    target: '$5,000',
    current: 4287,
    max: 5000,
    progress: 85.7,
    status: 'on-track' as const,
  },
  {
    id: 'goal-002',
    label: 'Max Daily Loss Limit',
    target: '$400',
    current: 320,
    max: 400,
    progress: 80,
    status: 'warning' as const,
    note: '80% of daily limit used',
  },
  {
    id: 'goal-003',
    label: 'Monthly Trade Count',
    target: '60 trades',
    current: 59,
    max: 60,
    progress: 98.3,
    status: 'on-track' as const,
  },
];

const statusConfig = {
  'on-track': { color: 'bg-green-500', textColor: 'text-green-400', icon: <CheckCircle2 size={12} /> },
  'warning': { color: 'bg-amber-500', textColor: 'text-amber-400', icon: <AlertCircle size={12} /> },
  'exceeded': { color: 'bg-red-500', textColor: 'text-red-400', icon: <AlertCircle size={12} /> },
};

export default function GoalsMiniPanel() {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target size={15} className="text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Goals Progress</h4>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const config = statusConfig[goal.status];
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-foreground">{goal.label}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${config.textColor}`}>
                  {config.icon}
                  <span className="font-tabular">{goal.progress.toFixed(0)}%</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.color}`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">{goal.note ?? `Target: ${goal.target}`}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-4 w-full text-xs text-primary hover:text-blue-400 font-medium transition-colors text-center">
        Manage Goals →
      </button>
    </div>
  );
}