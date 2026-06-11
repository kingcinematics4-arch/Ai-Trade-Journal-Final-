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
  Info,
  Target,
  TrendingUp,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTrades } from '@/contexts/TradesContext';
import { getTradePnL, normalizeStatus } from '@/lib/trades/analytics';
import { useCalendarGoalsStore } from '@/stores/useCalendarGoalsStore';

import EventModal from './EventModal';
import GoalModal from './GoalModal';

import type { CalendarEvent } from '@/components/index';

type CalendarFilter =
  | 'all'
  | 'tradeCount'
  | 'profitTrades'
  | 'lossTrades'
  | 'tasks'
  | 'dailyPnL'
  | 'performance';

// Mock holidays list - can be moved to a separate config file or fetched from an API
const HOLIDAYS = [
  "2026-06-10",
  "2026-06-15",
  "2024-01-01",
  "2024-12-25"
];

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);

  const [activeFilters, setActiveFilters] = useState<CalendarFilter[]>(['all']);
  const toggleFilter = (filter: CalendarFilter) => {
    setActiveFilters((prev) => {
      if (filter === 'all') return ['all'];
      const newFilters = prev.filter((f) => f !== 'all');
      if (newFilters.includes(filter)) {
        const remaining = newFilters.filter((f) => f !== filter);
        return remaining.length === 0 ? ['all'] : remaining;
      }
      return [...newFilters, filter];
    });
  };
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarEvents();

  const { trades: realTrades } = useTrades();

  const {
    goals,
    addGoal: addCGoal,
    updateGoal: updateCGoal,
    deleteGoal: deleteCGoal,
    toggleGoalStatus,
    deleteTrade: deleteCTrade,
  } = useCalendarGoalsStore();

  const days = useMemo(() => {
    const monthStart =
      startOfMonth(currentMonth);

    const monthEnd =
      endOfMonth(monthStart);

    const startDate =
      startOfWeek(monthStart);

    const endDate =
      endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(
      subMonths(currentMonth, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      addMonths(currentMonth, 1)
    );
  };

  const handleToday = () => {
    const today = new Date();

    setCurrentMonth(today);

    setSelectedDate(today);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);

    setIsModalOpen(true);
  };

  const handleEditEvent = (
    e: React.MouseEvent,
    event: CalendarEvent
  ) => {
    e.stopPropagation();

    setEditingEvent(event);

    setIsModalOpen(true);
  };

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const onSaveGoal = (data: any) => {
    if (editingGoal) {
      updateCGoal(editingGoal.id, data);
    } else {
      const targetDate = selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
      addCGoal({ ...data, date: targetDate });
    }
    setIsGoalModalOpen(false);
  };

  const onSaveEvent = (data: any) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }

    setIsModalOpen(false);
  };

  const getEventsForDay = (day: Date) => {
    const dateStr = format(
      day,
      'yyyy-MM-dd'
    );

    return events
      .filter(
        (e: CalendarEvent) =>
          e.date === dateStr
      )
      .sort(
        (
          a: CalendarEvent,
          b: CalendarEvent
        ) =>
          a.startTime.localeCompare(
            b.startTime
          )
      );
  };

  const getGoalsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return goals.filter(
      (g) =>
        g.date === dateStr
    );
  };

  const getTradesForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return realTrades.filter(
      (t) => (t.trade_date || t.date) === dateStr
    );
  };

  const getColorClass = (
    color: string
  ) => {
    switch (color) {
      case 'green':
        return 'bg-green-500/20 text-green-400 border-green-500/30';

      case 'purple':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';

      case 'red':
        return 'bg-red-500/20 text-red-400 border-red-500/30';

      case 'orange':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';

      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const filterOptions: { id: CalendarFilter; label: string }[] = [
    { id: 'all', label: 'Show All' },
    { id: 'tradeCount', label: 'Trade Count' },
    { id: 'profitTrades', label: 'Profit Trades' },
    { id: 'lossTrades', label: 'Loss Trades' },
    { id: 'tasks', label: 'Tasks/Events' },
    { id: 'dailyPnL', label: 'Daily PnL' },
    { id: 'performance', label: 'Day Performance' },
  ];

  return (
    <div className="space-y-2 animate-in fade-in duration-200">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CalendarIcon
              size={20}
              className="text-primary"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {format(
                currentMonth,
                'MMMM yyyy'
              )}
            </h1>

            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Trading Events & Reminders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">

            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={handleToday}
              className="px-4 py-1.5 text-xs font-bold rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              Today
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* FILTER DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all",
                (activeFilters.includes('all') && activeFilters.length === 1)
                  ? "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground" 
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              )}
            >
              <ListFilter size={14} />
              <span className="hidden sm:inline">
                {activeFilters.includes('all') 
                  ? 'Show All' 
                  : activeFilters.length === 1 
                    ? filterOptions.find(o => o.id === activeFilters[0])?.label 
                    : 'Multiple Filters'}
              </span>
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 py-2 overflow-hidden"
                  >
                    {filterOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFilter(opt.id)}
                        className={cn(
                          "w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between",
                          activeFilters.includes(opt.id) 
                            ? "bg-blue-500/20 text-white border-l-2 border-blue-500/40" 
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {opt.label}
                        {activeFilters.includes(opt.id) && <Check size={12} />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleAddEvent}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-lg shadow-primary/20"
          >
            <Plus size={16} />

            <span className="hidden sm:inline">
              Add Event
            </span>
          </button>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="card-elevated overflow-hidden border-border/40 bg-card">

        {/* WEEK HEADER */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">

          {[
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
          ].map((d) => (
            <div
              key={d}
              className="py-3 text-center text-[10px] font-black uppercase tracking-tighter text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* DAYS */}
        <div className="grid grid-cols-7 auto-rows-auto">

          {days.map((day: Date) => {
            const dayEvents =
              getEventsForDay(day);
            const dayGoals =
              getGoalsForDay(day);

            const dayTrades = realTrades.filter(
              trade => isSameDay(new Date(trade.trade_date || trade.date), day)
            );

            const netPnL = dayTrades.reduce(
              (sum, trade) => sum + getTradePnL(trade),
              0
            );

            const profitCount = dayTrades.filter(t => {
              const status = String(t.trade_status || t.result || '').toLowerCase();
              return status === 'win' || status === 'profit' || status === 'p' || (status === '' && getTradePnL(t) > 0);
            }).length;

            const lossCount = dayTrades.filter(t => {
              const status = String(t.trade_status || t.result || '').toLowerCase();
              return status === 'loss' || status === 'l' || (status === '' && getTradePnL(t) < 0);
            }).length;

            // CONDITIONAL VISIBILITY FLAGS
            const showColors = activeFilters.includes('all') || activeFilters.includes('performance');
            const showTasks = activeFilters.includes('all') || activeFilters.includes('tasks');
            const showCount = activeFilters.includes('all') || activeFilters.includes('tradeCount');
            const showProfit = activeFilters.includes('all') || activeFilters.includes('profitTrades');
            const showLoss = activeFilters.includes('all') || activeFilters.includes('lossTrades');
            const showPnLText = activeFilters.includes('all') || activeFilters.includes('dailyPnL');

            const hasVisibleContent = 
              (showTasks && (dayEvents.length > 0 || dayGoals.length > 0)) ||
              (showCount && dayTrades.length > 0) ||
              ((showProfit || showLoss) && dayTrades.length > 0) ||
              (showPnLText && netPnL !== 0);

            const dateStr = format(day, 'yyyy-MM-dd');
            const isHoliday = HOLIDAYS.includes(dateStr);
            const isSunday = day.getDay() === 0;

            const isCurrentMonth =
              isSameMonth(
                day,
                currentMonth
              );

            const isSelected =
              selectedDate !== null &&
              isSameDay(
                day,
                selectedDate
              );

            const isCurrentToday =
              isToday(day);

            return (
              <div
                key={day.toString()}
                onClick={() =>
                  setSelectedDate(day)
                }
                className={cn(
                  'relative border p-1.5 flex flex-col cursor-pointer transition-all duration-200 ease-in-out select-none outline-none appearance-none',
                  hasVisibleContent ? 'min-h-[120px] lg:min-h-[140px]' : 'min-h-[60px] sm:min-h-[80px]',
                  !isCurrentMonth
                    ? 'bg-muted/5 opacity-40 border-transparent border-r-border/40 border-b-border/40'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : netPnL > 0 && showColors
                    ? 'bg-green-500/20 border-green-500'
                    : netPnL < 0 && showColors
                    ? 'bg-red-500/20 border-red-500'
                    : isCurrentToday
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-transparent text-foreground border-transparent border-r-border/40 border-b-border/40 hover:bg-blue-500/10 hover:text-white'
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >

                <span
                  className={cn(
                    'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-xl transition-colors duration-200',
                    isSelected
                      ? 'text-white'
                      : netPnL > 0 && showColors
                      ? 'text-green-500'
                      : netPnL < 0 && showColors
                      ? 'text-red-500'
                      : (isHoliday || isSunday)
                      ? 'text-red-500'
                      : isCurrentToday
                      ? 'text-blue-400'

                      : 'text-foreground/70'
                  )}
                >
                  {format(day, 'd')}
                </span>

                <div className="flex-1 flex flex-col space-y-1 mt-0.5">
                  {/* EVENTS SECTION */}
                  {showTasks && <div className="space-y-0.5 flex-shrink-0">
                    {dayEvents.slice(0, 2).map((event: CalendarEvent) => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEditEvent(e, event)}
                        className={`px-1 py-0.5 text-[7px] font-bold rounded border truncate ${getColorClass(event.color)}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[7px] text-muted-foreground font-bold px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>}

                  {/* GOAL INDICATORS */}
                  {showTasks && dayGoals.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1 px-0.5">
                      {dayGoals.slice(0, 5).map((g) => (
                        <div
                          key={g.id}
                          className={cn(
                            'w-1 h-1 rounded-full',
                            g.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-primary'
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* TRADE SUMMARY SECTION - Stacks below events/goals */}
                  {dayTrades.length > 0 && (
                    <div className={cn("mt-auto pt-1 text-[10px] leading-tight", (showCount || showProfit || showLoss || showPnLText) && "border-t border-border/10")}>
                      {showCount && (
                        <div className="text-muted-foreground/50 truncate">
                          {dayTrades.length} Trades
                        </div>
                      )}
                      
                      {showPnLText && netPnL !== 0 && (
                        <div className={cn("font-bold mt-1 truncate", netPnL > 0 ? "text-green-500" : "text-red-500")}>
                          {netPnL > 0 ? '+' : ''}₹{netPnL.toLocaleString()}
                        </div>
                      )}

                      <div className="flex gap-1 mt-2 flex-wrap">
                        {showProfit && profitCount > 0 && (
                          <span className="bg-green-500/20 text-white border border-green-500/40 rounded-md px-1.5 py-0.5 font-semibold text-[10px]">
                            {profitCount}P
                          </span>
                        )}
                        {showLoss && lossCount > 0 && (
                          <span className="bg-red-500/20 text-white border border-red-500/40 rounded-md px-1.5 py-0.5 font-semibold text-[10px]">
                            {lossCount}L
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DAY */}
      {selectedDate && (
        <AnimatePresence mode="wait">

          <motion.div
            key={selectedDate.toString()}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="card-elevated p-6 bg-gradient-to-br from-card to-muted/20"
          >

            <div className="flex items-center justify-between mb-4">

              <h2 className="font-bold text-lg flex items-center gap-2">

                Events for{' '}
                {format(
                  selectedDate,
                  'PPP'
                )}

                {isToday(
                  selectedDate
                ) && (
                  <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase">
                    Today
                  </span>
                )}
              </h2>

              <button
                onClick={
                  handleAddEvent
                }
                className="text-xs font-bold text-primary hover:underline"
              >
                Add Event
              </button>
            </div>

            <div className="space-y-3">

              {getEventsForDay(
                selectedDate
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl">

                  <Info
                    className="text-muted-foreground/30 mb-2"
                    size={24}
                  />

                  <p className="text-sm text-muted-foreground font-medium">
                    No events scheduled.
                  </p>
                </div>
              ) : (
                getEventsForDay(
                  selectedDate
                ).map(
                  (
                    event: CalendarEvent
                  ) => (
                    <div
                      key={event.id}
                      onClick={(e) =>
                        handleEditEvent(
                          e,
                          event
                        )
                      }
                      className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/40 transition-colors cursor-pointer group"
                    >

                      <div className="flex items-center gap-4">

                        <div
                          className={`w-1 h-10 rounded-full ${
                            event.color ===
                            'blue'
                              ? 'bg-blue-500'
                              : event.color ===
                                'green'
                              ? 'bg-green-500'
                              : event.color ===
                                'red'
                              ? 'bg-red-500'
                              : event.color ===
                                'orange'
                              ? 'bg-orange-500'
                              : 'bg-purple-500'
                          }`}
                        />

                        <div>
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {
                              event.title
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              event.startTime
                            }{' '}
                            -{' '}
                            {
                              event.endTime
                            }
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  )
                )
              )}
            </div>

            {/* DAILY TRADES SECTION */}
            <div className="mt-8 pt-6 border-t border-border/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" /> Daily Trades
                </h3>
                {getTradesForDay(selectedDate).length > 0 && (
                  <div className="text-xs font-bold px-2 py-1 rounded bg-muted/30">
                    Net: <span className={cn(
                      getTradesForDay(selectedDate).reduce((s, t) => s + getTradePnL(t), 0) >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      ₹{getTradesForDay(selectedDate).reduce((s, t) => s + getTradePnL(t), 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {getTradesForDay(selectedDate).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No trades logged for this day.
                  </p>
                ) : (
                  getTradesForDay(selectedDate).map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                          normalizeStatus(trade.trade_status || trade.result) === 'win' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {normalizeStatus(trade.trade_status || trade.result) === 'win' ? 'P' : normalizeStatus(trade.trade_status || trade.result) === 'loss' ? 'L' : 'BE'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            Trade Result
                          </p>
                          <p className={cn(
                            "text-xs font-medium",
                            getTradePnL(trade) >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {getTradePnL(trade) >= 0 ? '+' : ''}₹{getTradePnL(trade).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCTrade(trade.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DAILY GOALS SECTION */}
            <div className="mt-8 pt-6 border-t border-border/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Target size={16} className="text-primary" /> Daily Goals
                </h3>
                <button
                  onClick={() => {
                    setEditingGoal(null);
                    setIsGoalModalOpen(true);
                  }}
                  className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                >
                  + Add Goal
                </button>
              </div>

              <div className="space-y-2">
                {getGoalsForDay(selectedDate).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No goals set for this day.
                  </p>
                ) : (
                  getGoalsForDay(selectedDate).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-xl group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={goal.status === 'completed'}
                          onChange={() => toggleGoalStatus(goal.id)}
                          className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/40 cursor-pointer"
                        />
                        <div
                          className="cursor-pointer flex-1"
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsGoalModalOpen(true);
                          }}
                        >
                          <p
                            className={cn(
                              'text-sm font-semibold',
                              goal.status === 'completed'
                                ? 'line-through text-muted-foreground opacity-60'
                                : 'text-foreground'
                            )}
                          >
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCGoal(goal.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <EventModal
        isOpen={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        onSave={onSaveEvent}
        onDelete={(id) => {
          deleteEvent(id);

          setIsModalOpen(false);
        }}
        initialDate={
          selectedDate
            ? format(
                selectedDate,
                'yyyy-MM-dd'
              )
            : format(
                new Date(),
                'yyyy-MM-dd'
              )
        }
        editingEvent={editingEvent}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={onSaveGoal}
        onDelete={(id) => {
          deleteCGoal(id);
          setIsGoalModalOpen(false);
        }}
        initialDate={
          selectedDate
            ? format(selectedDate, 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd')
        }
        editingGoal={editingGoal}
      />
    </div>
  );
}