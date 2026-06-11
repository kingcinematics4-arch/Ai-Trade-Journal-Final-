import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CalendarGoal {
  id: string;
  date: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
}

export interface CalendarTrade {
  id: string;
  date: string;
  pnl: number;
  result: 'P' | 'L';
}

interface CalendarGoalsState {
  goals: CalendarGoal[];
  trades: CalendarTrade[];
  addGoal: (goal: Omit<CalendarGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<CalendarGoal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalStatus: (id: string) => void;
  addTrade: (trade: Omit<CalendarTrade, 'id'>) => void;
  updateTrade: (id: string, updates: Partial<CalendarTrade>) => void;
  deleteTrade: (id: string) => void;
}

export const useCalendarGoalsStore = create<CalendarGoalsState>()(
  persist(
    (set) => ({
      goals: [],
      trades: [],
      addGoal: (goalData) =>
        set((state) => ({
          goals: [...state.goals, { ...goalData, id: crypto.randomUUID() }],
        })),
      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
      toggleGoalStatus: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: g.status === 'pending' ? 'completed' : 'pending' } : g
          ),
        })),
      addTrade: (tradeData) =>
        set((state) => ({
          trades: [...state.trades, { ...tradeData, id: crypto.randomUUID() }],
        })),
      updateTrade: (id, updates) =>
        set((state) => ({
          trades: state.trades.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        })),
    }),
    { name: 'calendar-goals-storage' }
  )
);