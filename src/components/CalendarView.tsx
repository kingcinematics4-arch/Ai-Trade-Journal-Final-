'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  TrendingUp,
  Target,
  Info,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTrades } from '@/contexts/TradesContext';
import { getTradePnL, normalizeStatus } from '@/lib/trades/analytics';
import { useCalendarGoalsStore } from '@/stores/useCalendarGoalsStore';
import EventModal from './EventModal';
import GoalModal from './GoalModal';
import DayDetailsModal from "@/components/DayDetailsModal";

/** TYPE DEFINITIONS */
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  [key: string]: any;
}

interface Trade {
  id: string;
  trade_date?: string;
  date?: string;
  asset_name?: string;
  pnl_amount?: number;
  trade_status?: string;
  result?: string;
  [key: string]: any;
}

interface Goal {
  id: string;
  title: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  [key: string]: any;
}

type CalendarFilter = 'all' | 'tradeCount' | 'profitTrades' | 'lossTrades' | 'tasks' | 'dailyPnL' | 'performance';

interface CalendarTableProps {
  headers: { key: string; label: string }[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
}

const filterOptions = [
  { id: 'all', label: 'Show All' },
  { id: 'tradeCount', label: 'Trade Count' },
  { id: 'profitTrades', label: 'Winning Trades' },
  { id: 'lossTrades', label: 'Losing Trades' },
  { id: 'tasks', label: 'Goals & Tasks' },
  { id: 'dailyPnL', label: 'Net P&L' },
  { id: 'performance', label: 'Performance Stats' },
];

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null as CalendarEvent | null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null as any);
  const [activeFilters, setActiveFilters] = useState(['all'] as CalendarFilter[]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { trades: realTrades } = useTrades();
  const { goals, addGoal, updateGoal, deleteGoal } = useCalendarGoalsStore();

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth)),
      end: endOfWeek(endOfMonth(currentMonth)),
    });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDayDoubleClick = (day: Date) => {
    setSelectedDate(day);
    setIsDayDetailsOpen(true);
  };

  const toggleFilter = (filter: CalendarFilter) => {
    setActiveFilters((prev) => {
      if (filter === 'all') return ['all'];
      const withoutAll = prev.filter((f) => f !== 'all');
      if (withoutAll.includes(filter)) {
        const next = withoutAll.filter((f) => f !== filter);
        return next.length === 0 ? ['all'] : next;
      }
      return [...withoutAll, filter];
    });
  };

  const clearFilters = () => {
    setActiveFilters(['all']);
  };

  const handleEditEvent = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((e: CalendarEvent) => e.date === format(day, 'yyyy-MM-dd'));
  };

  const getGoalsForDay = (day: Date) => {
    return goals.filter((g: any) => g.date === format(day, 'yyyy-MM-dd'));
  };

  const getTradesForDay = (day: Date) => {
    const trades = realTrades || [];
    return trades.filter(
      (t: Trade) => (t.trade_date || t.date) === format(day, 'yyyy-MM-dd')
    );
  };

  const onSaveEvent = (data: any) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }

    setIsModalOpen(false);
  };

  const onSaveGoal = (data: any) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }

    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 w-full max-w-6xl mx-auto px-2 sm:px-4 min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_30%),#050816] text-[#94a3b8] font-sans selection:bg-blue-500/30">
      {/* Institutional Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-sm bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
            <CalendarIcon size={18} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white tracking-tighter leading-none uppercase">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-[#64748b] font-bold uppercase tracking-[0.15em]">Terminal System</span>
              <span className="w-1 h-1 rounded-full bg-white/[0.05]" />
              <span className="text-[9px] text-blue-500/50 font-bold uppercase tracking-[0.15em]">Performance Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Controls */}
          <div className="flex bg-[#0b0f1a] border border-white/[0.05] p-0.5 rounded-sm">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/[0.03] text-[#64748b] transition-colors" title="Previous Month">
              <ChevronLeft size={14} />
            </button>
            <button onClick={handleToday} className="px-3 py-1 text-[10px] font-black uppercase tracking-tighter hover:bg-white/[0.03] text-[#94a3b8] transition-colors border-x border-white/[0.05]">
              Today
            </button>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/[0.03] text-[#64748b] transition-colors" title="Next Month">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Filters Overlay */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "px-3 h-8 rounded-sm border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight",
                isFilterOpen ? "bg-zinc-800 border-zinc-700 text-white" : "bg-[#0b0f1a] border-white/[0.05] text-[#94a3b8] hover:text-white"
              )}
            >
              <Filter size={14} className={isFilterOpen ? "text-blue-400" : ""} />
              <span className="hidden md:inline">Analytics Filter</span>
              {activeFilters.length > 0 && !activeFilters.includes('all') && (
                <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm ml-1">
                  {activeFilters.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 mt-2 w-52 bg-[#0b0f1a] border border-white/[0.05] rounded-sm shadow-2xl z-[110] p-1 overflow-hidden backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/[0.05] mb-1">
                    <span className="text-[9px] font-black uppercase text-[#64748b] tracking-wider">Data Segments</span>
                    <button onClick={clearFilters} className="text-[9px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Reset</button>
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {filterOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFilter(opt.id)}
                        className={cn(
                          "w-full text-left px-2.5 py-2 rounded-sm text-[10px] font-bold transition-all flex items-center justify-between",
                          activeFilters.includes(opt.id) ? "bg-blue-600/10 text-blue-400" : "text-[#94a3b8] hover:bg-white/[0.03] hover:text-white"
                        )}
                      >
                        {opt.label}
                        {activeFilters.includes(opt.id) && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} 
            className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 px-4 h-8 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-blue-600/10"
          >
            <Plus size={14} />
            <span>New Monitor</span>
          </button>
        </div>
      </div>

      {/* Professional Grid Structure */}
      <div className="w-full min-w-0 border-0 bg-transparent">
        <div className="grid grid-cols-7 gap-4 bg-transparent mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#8da2c0]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 w-full gap-4 auto-rows-auto">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const dayTrades = getTradesForDay(day);
            const dayGoals = getGoalsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentToday = isToday(day);
            
            const netPnL = dayTrades.reduce((acc, t) => acc + (getTradePnL(t) || 0), 0);
            const wins = dayTrades.filter(t => normalizeStatus(t.trade_status || t.result) === 'win').length;
            const losses = dayTrades.filter(t => normalizeStatus(t.trade_status || t.result) === 'loss').length;

            const filterAll = activeFilters.includes('all');
            const showPnL = filterAll || activeFilters.includes('dailyPnL') || activeFilters.includes('performance');
            const showTrades = filterAll || activeFilters.includes('tradeCount') || activeFilters.includes('performance');
            const showProfitLossCount = filterAll || activeFilters.includes('profitTrades') || activeFilters.includes('lossTrades') || activeFilters.includes('performance');
            const showTasks = filterAll || activeFilters.includes('tasks');

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={cn(
                  'relative flex flex-col justify-start gap-3 p-4 transition-all duration-300 ease-out cursor-pointer select-none group border border-white/[0.07] shadow-[0_15px_50px_rgba(0,0,0,0.50)] rounded-[28px] backdrop-blur-2xl bg-[linear-gradient(180deg,rgba(22,28,45,0.92)_0%,rgba(10,14,24,0.98)_100%)]',
                  'h-auto',
                  dayTrades.length === 0 && dayEvents.length === 0 && dayGoals.length === 0 ? 'min-h-[80px] opacity-70' : 'min-h-[110px]',
                  'before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%)] before:pointer-events-none',
                  'after:absolute after:-top-10 after:right-[-20px] after:w-24 after:h-24 after:rounded-full after:bg-blue-400/10 after:blur-3xl after:pointer-events-none after:transition-all after:duration-500',
                  'hover:-translate-y-[6px] hover:scale-[1.025] hover:border-cyan-400/30 hover:shadow-[0_25px_80px_rgba(59,130,246,0.20)] hover:after:bg-cyan-400/20',
                  isSelected 
                    ? 'ring-2 ring-blue-500/50 border-cyan-400/50 z-10 shadow-[0_0_40px_rgba(59,130,246,0.3)] bg-[linear-gradient(180deg,rgba(28,35,58,0.96)_0%,rgba(15,20,35,0.98)_100%)]' 
                    : '',
                  !isCurrentMonth
                    ? 'opacity-30 grayscale-[0.2] pointer-events-none border-transparent'
                    : isCurrentToday
                    ? 'border-cyan-400/30'
                    : '',
                  dayTrades.length > 0 && netPnL > 0 && 'border-l-[4px] border-l-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.10)] before:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_60%)]',
                  dayTrades.length > 0 && netPnL < 0 && 'border-l-[4px] border-l-red-400 shadow-[0_0_40px_rgba(239,68,68,0.10)] before:bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.18),transparent_60%)]'
                )}
              >
                {/* Tiny glossy top highlight */}
                <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

                {/* Header: Date & Task Indicators */}
                <div className="flex justify-between items-start w-full">
                  <span className={cn(
                    "text-[20px] font-black tabular-nums tracking-tight transition-colors",
                    isSelected ? "text-white" : isCurrentToday ? "text-blue-400" : "text-zinc-500 group-hover:text-white"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="flex gap-0.5">
                    {showTasks && dayGoals.map((g: any) => (
                      <div key={g.id} className={cn("w-1 h-1 rounded-full", 
                        g.status === 'completed' ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-white/10"
                      )} />
                    ))}
                  </div>
                </div>

                {/* Center: Event Micro-Labels */}
                <div className="mt-1 flex-1 overflow-hidden pointer-events-none">
                  {dayEvents.slice(0, 1).map((e) => (
                    <div key={e.id} className="text-[8px] font-bold text-zinc-600 truncate leading-tight uppercase tracking-tighter group-hover:text-zinc-400 transition-colors">
                      {e.title}
                    </div>
                  ))}
                </div>

                {/* Footer: Financial Signals */}
                <div className="mt-auto flex flex-col items-end leading-none space-y-0.5">
                  {(showProfitLossCount || showTrades) && (dayTrades.length > 0) && (
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {showTrades && (
                        <span className="text-[9px] font-semibold text-[#9db0cf] uppercase tracking-tight">{dayTrades.length}T</span>
                      )}
                      {showProfitLossCount && (wins > 0) && (
                        <span className="text-[9px] font-semibold text-emerald-300">{wins}W</span>
                      )}
                      {showProfitLossCount && (losses > 0) && (
                        <span className="text-[9px] font-semibold text-red-300">{losses}L</span>
                      )}
                    </div>
                  )}

                  {showPnL && (dayTrades.length > 0) && (
                    <div className={cn(
                      "text-[12px] sm:text-[17px] font-black font-mono tabular-nums tracking-tight px-1 rounded-sm",
                      netPnL > 0 ? "text-emerald-300" : netPnL < 0 ? "text-red-300" : "text-[#9db0cf]"
                    )}>
                      {netPnL > 0 ? '+' : netPnL < 0 ? '-' : ''}{Math.abs(netPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toString()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-[#0b0f1a] border border-white/[0.05] space-y-8 shadow-2xl rounded-2xl backdrop-blur-xl relative overflow-hidden after:absolute after:top-0 after:left-0 after:w-full after:h-px after:bg-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-blue-500/80 uppercase tracking-widest leading-none">Activity Stream // {format(selectedDate, 'dd.MM.yy')}</span>
                {isToday(selectedDate) && (
                  <span className="bg-blue-600/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider border border-blue-500/20">Today</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }} className="text-xs font-bold text-primary hover:underline">+ Goal</button>
                <span className="text-muted-foreground/30">|</span>
                <button onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} className="text-xs font-bold text-primary hover:underline">+ Event</button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <CalendarIcon size={12} /> Scheduled Events
              </h3>
              <CalendarTable
                headers={[
                  { key: 'title', label: 'Name' },
                  { key: 'startTime', label: 'Time' },
                  { key: 'description', label: 'Description' },
                ]}
                data={getEventsForDay(selectedDate)}
                renderRow={(event: CalendarEvent) => (
                  <tr key={event.id} className="hover:bg-zinc-900/50 border-b border-zinc-900/50 last:border-0 transition-colors cursor-pointer group" onClick={(e) => handleEditEvent(e, event)}>
                    <td className="px-4 py-2 font-bold text-zinc-300">{event.title}</td>
                    <td className="px-4 py-2 text-zinc-600 font-mono text-[11px] whitespace-nowrap tabular-nums">{event.startTime}</td>
                    <td className="px-4 py-2 text-right text-zinc-600 truncate max-w-[200px] text-[11px]">{event.description || '-'}</td>
                  </tr>
                )}
                emptyMessage="No events scheduled."
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <TrendingUp size={12} /> Daily Trades
              </h3>
              <CalendarTable
                headers={[
                  { key: 'asset_name', label: 'Name' },
                  { key: 'trade_date', label: 'Date' },
                  { key: 'pnl_amount', label: 'Profit' },
                ]}
                data={getTradesForDay(selectedDate)}
                renderRow={(trade: any) => (
                  <tr key={trade.id} className="hover:bg-zinc-900/50 border-b border-zinc-900/50 last:border-0 transition-colors">
                    <td className="px-4 py-2 font-bold text-zinc-300">{trade.asset_name}</td>
                    <td className="px-4 py-2 text-zinc-600 font-mono text-[10px] uppercase tracking-tighter">
                      {format(new Date(trade.trade_date || trade.date), 'dd-MM-yy')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={cn("font-black font-mono tracking-tight tabular-nums", getTradePnL(trade) >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {getTradePnL(trade) >= 0 ? '+' : ''}{getTradePnL(trade).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                )}
                emptyMessage="No trades logged for this day."
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Target size={12} /> Daily Goals
              </h3>
              <CalendarTable
                headers={[
                  { key: 'title', label: 'Name' },
                  { key: 'date', label: 'Target Date' },
                  { key: 'status', label: 'Status' },
                ]}
                data={getGoalsForDay(selectedDate)}
                renderRow={(goal: any) => (
                  <tr key={goal.id} className="hover:bg-zinc-900/50 border-b border-zinc-900/50 last:border-0 transition-colors cursor-pointer" onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}>
                    <td className="px-4 py-2 font-bold text-zinc-300">{goal.title}</td>
                    <td className="px-4 py-2 text-zinc-600 font-mono text-[10px] uppercase tracking-tighter">
                      {format(new Date(goal.date), 'dd-MM-yy')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm tabular-nums", goal.status === 'completed' ? 'bg-green-950/40 text-green-500 border border-green-500/20' : 'bg-blue-950/40 text-blue-500 border border-blue-500/20')}>
                        {goal.status}
                      </span>
                    </td>
                  </tr>
                )}
                emptyMessage="No goals set for this day."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveEvent}
        onDelete={(id) => { deleteEvent(id); setIsModalOpen(false); }}
        initialDate={format(selectedDate || new Date(), 'yyyy-MM-dd')}
        editingEvent={editingEvent}
      />
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={onSaveGoal}
        onDelete={(id) => { deleteGoal(id); setIsGoalModalOpen(false); }}
        initialDate={format(selectedDate || new Date(), 'yyyy-MM-dd')}
        editingGoal={editingGoal}
      />
      
      <DayDetailsModal
        isOpen={isDayDetailsOpen}
        onClose={() => setIsDayDetailsOpen(false)}
        date={selectedDate}
        trades={getTradesForDay(selectedDate)}
        events={getEventsForDay(selectedDate)}
        goals={getGoalsForDay(selectedDate)}
      />
    </div>
  );
}

function CalendarTable({ headers, data, renderRow, emptyMessage }: CalendarTableProps) {
  return (
    <div className="overflow-x-auto border border-zinc-900 bg-black/50">
      {data.length === 0 ? (
        <div className="text-center py-8 text-zinc-700 font-black uppercase tracking-widest text-[9px] flex flex-col items-center gap-2">
          <span className="opacity-40">{emptyMessage}</span>
        </div>
      ) : (
        <table className="w-full table-auto text-left text-[11px]">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-600 font-black uppercase tracking-[0.15em] text-[8px]">
              {headers.map((header) => (
                <th key={header.key} className={cn("px-4 py-4", (header.key === 'pnl_amount' || header.key === 'status' || header.key === 'description' || header.key === 'value') ? "text-right" : "")}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(renderRow)}
          </tbody>
        </table>
      )}
    </div>
  );
}