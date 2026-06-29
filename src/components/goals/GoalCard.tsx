'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import type { Goal } from '@/lib/goals/types';

interface GoalCardProps {
  goal: Goal;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const getIcon = () => {
    switch (goal.category) {
      case 'performance':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'risk':
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case 'psychology':
        return <Zap className="w-5 h-5 text-purple-500" />;
      default:
        return <Target className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (goal.status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'failed':
        return 'bg-loss/20 text-loss border-loss/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  // 5. Add debug logs for verification (development mode only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const currentProfit = Number(goal.currentValue || 0);
      const targetValue = Number(goal.targetValue || 0);

      const progressPercentage = targetValue > 0 ? (currentProfit / targetValue) * 100 : 0;
      const safeProgress = Math.min(Math.max(progressPercentage, 0), 100);

      const isCompleted = goal.status?.toLowerCase() === 'completed';
      const visualWidth = isCompleted ? 100 : safeProgress;

      console.log(`[GoalCard UI Trace] Rendering goal: ${goal.title}`, {
        currentProfit,
        targetValue,
        status: goal.status,
        safeProgress,
        visualWidth: `${visualWidth}%`,
      });
    }
  }, [goal]); // Re-log when the goal prop changes

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background border border-border rounded-xl">{getIcon()}</div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor()} capitalize font-medium`}
            >
              {goal.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-primary">
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-loss">
              Delete
            </button>
          )}
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-muted-foreground mb-4 relative z-10">{goal.description}</p>
      )}

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-foreground">
            {goal.type === 'max_loss' && goal.currentValue > 0 ? '-' : ''}
            {(goal.currentValue || 0).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{' '}
            / {(goal.targetValue || 0).toLocaleString()}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${
                goal.targetValue > 0
                  ? Math.min(Math.max((goal.currentValue / goal.targetValue) * 100, 0), 100)
                  : 0
              }%`,
            }}
          />
        </div>
        {goal.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <AlertTriangle className="w-3 h-3" />
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Confetti celebration background for completed goals */}
      {goal.status === 'completed' && (
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
      )}
    </motion.div>
  );
}
