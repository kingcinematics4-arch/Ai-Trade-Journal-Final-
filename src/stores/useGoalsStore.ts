import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal } from '@/lib/goals/types';
import { calculateGoalProgress } from '@/lib/goals/engine';
import { getTradePnL } from '@/lib/trades/analytics'; // Import getTradePnL
import type { DbTrade } from '@/lib/trades/types';

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'progress' | 'currentValue' | 'status' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  syncProgress: (trades: (DbTrade & { goalId?: string })[]) => void;
  lastCompletedGoal: Goal | null;
  clearLastCompletedGoal: () => void;

  // Analytics
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getFailedGoals: () => Goal[];
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      lastCompletedGoal: null,
      clearLastCompletedGoal: () => set({ lastCompletedGoal: null }),

      addGoal: (goalData) => {
        const newGoal: Goal = {
          ...goalData,
          id: crypto.randomUUID(),
          currentValue: 0,
          progress: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      syncProgress: (trades) => {
        set((state) => {
          let hasChanges = false;
          let newlyCompleted: Goal | null = null;
          const updatedGoals = state.goals.map((goal) => {
            // Migration safety: Provide defaults for fields removed from persistence
            const currentGoal = {
              ...goal,
              status: goal.status || 'active',
              currentValue: goal.currentValue || 0,
              progress: goal.progress || 0,
            } as Goal;

            const updated = calculateGoalProgress(currentGoal, trades);

            const safeProgress = isNaN(Number(updated.progress)) ? 0 : Number(updated.progress);
            const safeCurrentValue = isNaN(updated.currentValue) ? 0 : updated.currentValue;

            if (
              Math.abs(safeProgress - (goal.progress || 0)) > 0.001 ||
              Math.abs(safeCurrentValue - (goal.currentValue || 0)) > 0.01 ||
              updated.status !== goal.status ||
              updated.startingPnL !== goal.startingPnL
            ) {
              hasChanges = true;

              if (updated.status === 'completed' && goal.status === 'active') {
                newlyCompleted = {
                  ...updated,
                  completedAt: new Date().toISOString(),
                  progress: 100,
                };
              }
              return { ...updated, progress: safeProgress, currentValue: safeCurrentValue };
            }
            return goal;
          });

          return hasChanges
            ? {
                goals: updatedGoals,
                lastCompletedGoal: newlyCompleted || state.lastCompletedGoal,
              }
            : state;
        });
      },

      getActiveGoals: () => get().goals.filter((g) => g.status === 'active'),
      getCompletedGoals: () => get().goals.filter((g) => g.status === 'completed'),
      getFailedGoals: () => get().goals.filter((g) => g.status === 'failed'),
    }),
    {
      name: 'ai-trade-journal-goals',
      // Persist ONLY configuration. Computed fields are recalculated on load.
      partialize: (state) => ({
        goals: state.goals.map(
          ({
            id,
            title,
            description,
            type,
            targetValue,
            startingPnL,
            createdAt,
            deadline,
            category,
          }) => ({
            id,
            title,
            description,
            type,
            targetValue,
            startingPnL,
            createdAt,
            deadline,
            category,
          })
        ),
      }),
    }
  )
);
