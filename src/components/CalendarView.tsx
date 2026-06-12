'use client';

import React, { useState, useMemo } from 'react';

import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

import { motion, AnimatePresence } from 'framer-motion';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  ListFilter,
  Calendar as CalendarIcon,
  Trash2,
  TrendingUp,
  Target,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTrades } from '@/contexts/TradesContext';
import { getTradePnL, normalizeStatus } from '@/lib/trades/analytics';
import { useCalendarGoalsStore } from '@/stores/useCalendarGoalsStore';

import EventModal from './EventModal';
import GoalModal from './GoalModal';

/** SAFE LOCAL TYPE */
type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  color?: string;
};

type CalendarFilter =
  | 'all'
  | 'tradeCount'
  | 'profitTrades'
  | 'lossTrades'
  | 'tasks'
  | 'dailyPnL'
  | 'performance';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const [activeFilters, setActiveFilters] = useState<CalendarFilter[]>(['all']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { trades: realTrades } = useTrades();

  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useCalendarGoalsStore();

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth)),
      end: endOfWeek(endOfMonth(currentMonth)),
    });
  }, [currentMonth]);

  const getEventsForDay = (day: Date) =>
    events.filter((e: CalendarEvent) => e.date === format(day, 'yyyy-MM-dd'));

  const getGoalsForDay = (day: Date) =>
    goals.filter((g) => g.date === format(day, 'yyyy-MM-dd'));

  const getTradesForDay = (day: Date) =>
    realTrades.filter(
      (t) => (t.trade_date || t.date) === format(day, 'yyyy-MM-dd')
    );

  const onSaveEvent = (data: any) => {
    if (editingEvent) updateEvent(editingEvent.id, data);
    else addEvent(data);
    setIsModalOpen(false);
  };

  const onSaveGoal = (data: any) => {
    if (editingGoal) updateGoal(editingGoal.id, data);
    else addGoal(data);
    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-2 animate-in fade-in duration-200">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CalendarIcon size={20} className="text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <p className="text-xs text-muted-foreground">
              Trading Events & Reminders
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* CALENDAR */}
      <div className="card-elevated overflow-hidden border-border/40 bg-card">

        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="py-3 text-center text-[10px] font-bold">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-auto">

          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const dayTrades = getTradesForDay(day);

            const netPnL = dayTrades.reduce(
              (s, t) => s + getTradePnL(t),
              0
            );

            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "border p-2 min-h-[90px] cursor-pointer",
                  isSameMonth(day, currentMonth)
                    ? "bg-transparent"
                    : "opacity-30",
                  isToday(day) && "border-blue-500/40"
                )}
              >
                <div className="text-xs font-bold">
                  {format(day, 'd')}
                </div>

                {dayEvents.slice(0, 2).map((e) => (
                  <div key={e.id} className="text-[9px] truncate text-blue-400">
                    {e.title}
                  </div>
                ))}

                {dayTrades.length > 0 && (
                  <div className={cn(
                    "text-[10px] mt-1 font-bold",
                    netPnL >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    ₹{netPnL.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* EVENT MODAL */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveEvent}
        onDelete={(id) => {
          deleteEvent(id);
          setIsModalOpen(false);
        }}
        initialDate={format(new Date(), 'yyyy-MM-dd')}
        editingEvent={editingEvent}
      />

      {/* GOAL MODAL */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={onSaveGoal}
        onDelete={(id) => {
          deleteGoal(id);
          setIsGoalModalOpen(false);
        }}
        initialDate={format(new Date(), 'yyyy-MM-dd')}
        editingGoal={editingGoal}
      />
    </div>
  );
}