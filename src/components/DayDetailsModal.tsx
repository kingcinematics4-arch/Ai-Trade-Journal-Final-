'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Target,
  TrendingUp,
  ArrowUpRight, 
  ArrowDownRight,
  ClipboardList,
  StickyNote,
  DollarSign,
  Calendar as CalendarIcon,
  Activity,
  CheckCircle2,
  BarChart3,
  Plus,
  Flag,
  Clock,
  ChevronDown,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getTradePnL, normalizeStatus, formatCurrency } from '@/lib/trades/analytics';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  trades: any[];
  events: any[];
  goals: any[];
  onUpdateTask: (id: string, data: any) => void;
  onAddTask: (data: any) => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring', 
      damping: 25, 
      stiffness: 400,
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export default function DayDetailsModal({
  isOpen,
  onClose,
  date,
  trades,
  events,
  goals,
  onUpdateTask,
  onAddTask,
}: DayDetailsModalProps) {
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    startTime: '09:00',
    endTime: '10:00'
  });

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const { netPnL, winRate } = useMemo(() => {
    const pnl = trades.reduce((acc, t) => acc + (getTradePnL(t) || 0), 0);
    const wr = trades.length > 0 
      ? (trades.filter(t => normalizeStatus(t.trade_status || t.result) === 'win').length / trades.length) * 100 
      : 0;
    return { netPnL: pnl, winRate: wr };
  }, [trades]);

  const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed').length, [goals]);

  const taskStats = useMemo(() => {
    const total = events.length;
    const completed = events.filter(e => e.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, pending, rate };
  }, [events]);

  const filteredTasks = useMemo(() => 
    events
      .filter(e => {
        if (taskFilter === 'active') return !e.completed;
        if (taskFilter === 'completed') return e.completed;
        return true;
      })
      .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
  , [events, taskFilter]);

  const handleAddTask = useCallback(() => {
    if (!newTaskData.title.trim()) return;
    onAddTask({
      ...newTaskData,
      date: format(date, 'yyyy-MM-dd'),
      completed: false
    });
    setNewTaskData({ title: '', description: '', priority: 'medium', startTime: '09:00', endTime: '10:00' });
    setIsAddingTask(false);
  }, [newTaskData, date, onAddTask]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#070911]/90 border border-white/[0.08] shadow-[0_48px_128px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[32px] overflow-hidden flex flex-col backdrop-blur-3xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-7 border-b border-white/[0.04] bg-[#070911]/50 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/5 border border-blue-500/20 flex items-center justify-center shadow-[0_8px_20px_rgba(59,130,246,0.1)]">
                <CalendarIcon size={22} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter leading-tight">Day Overview</h2>
                <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-[0.25em] mt-0.5">
                  {format(date, 'EEEE, MMMM do, yyyy')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-muted-foreground hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-90 group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 scrollbar-thin scrollbar-thumb-white/[0.05] scrollbar-track-transparent custom-scrollbar">
            
            {/* Analytics Pulse Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.04] flex flex-col gap-3 group hover:bg-white/[0.04] transition-all relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Net Outcome</span>
                  <DollarSign size={14} className="text-blue-500" />
                </div>
                <div className={cn(
                  "text-2xl font-black tabular-nums tracking-tighter",
                  netPnL > 0 ? "text-emerald-400" : netPnL < 0 ? "text-rose-500" : "text-white"
                )}>
                  {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
                </div>
                <div className={cn("absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500")} />
              </div>
              
              <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.04] flex flex-col gap-3 group hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Execution Pulse</span>
                  <Activity size={14} className="text-purple-500" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                  {trades.length} <span className="text-xs text-muted-foreground/40 font-bold ml-1 uppercase">Positions</span>
                </div>
              </div>

              <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.04] flex flex-col gap-3 group hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Performance</span>
                  <BarChart3 size={14} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                  {winRate.toFixed(0)}% <span className="text-xs text-muted-foreground/40 font-bold ml-1 uppercase">Win Rate</span>
                </div>
              </div>

              <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.04] flex flex-col gap-3 group hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Goal Status</span>
                  <CheckCircle2 size={14} className="text-orange-500" />
                </div>
                <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                  {completedGoals}/{goals.length} <span className="text-xs text-muted-foreground/40 font-bold ml-1 uppercase">Cleared</span>
                </div>
              </div>
            </motion.div>

            {/* Goals Section */}
            <motion.section variants={itemVariants} className="space-y-5">
              <div className="flex items-center gap-3 ml-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Institutional Goals</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.length > 0 ? goals.map(goal => (
                  <div key={goal.id} className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                    <p className="text-sm font-bold text-white leading-relaxed group-hover:text-emerald-400 transition-colors">{goal.title}</p>
                    <div className="flex items-center justify-between mt-5">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                        goal.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/[0.03] text-zinc-500 border-white/5"
                      )}>
                        {goal.status}
                      </span>
                      <Target size={14} className="text-white/10 group-hover:text-emerald-500/30 transition-colors" />
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.06] bg-white/[0.01]">
                    <Target size={24} className="text-white/5 mb-3" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Zero active targets for this cycle</p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Trades Section */}
            <motion.section variants={itemVariants} className="space-y-5">
              <div className="flex items-center gap-3 ml-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Trading Operations</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {trades.length > 0 ? trades.map(trade => {
                  const pnl = getTradePnL(trade);
                  const isWin = pnl >= 0;
                  return (
                    <div key={trade.id} className="group relative p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300",
                          isWin 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] group-hover:bg-emerald-500/20" 
                            : "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)] group-hover:bg-rose-500/20"
                        )}>
                          {isWin ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-white text-lg tracking-tight">{trade.asset_name || trade.asset}</h4>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.05] text-zinc-400 uppercase">
                              {trade.market_type || trade.market}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            {trade.trade_direction || trade.direction} <span className="w-1 h-1 rounded-full bg-white/10" /> STRTGY: {trade.strategy_used || 'Standard'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center sm:text-right justify-between sm:justify-end gap-10">
                        <div className="hidden lg:block text-right">
                          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Execution Metrics</p>
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-white/60">ENTRY: {trade.entry_price || '--'}</span>
                            <span className="text-[10px] font-bold text-white/60">EXIT: {trade.exit_price || '--'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-2xl font-black tabular-nums tracking-tighter", isWin ? "text-emerald-400" : "text-rose-500")}>
                            {isWin ? '+' : ''}{formatCurrency(pnl)}
                          </p>
                          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1.5">Net Realized P&L</p>
                        </div>
                      </div>
                      
                      {/* Hover background glow */}
                      <div className={cn(
                        "absolute right-0 top-0 w-48 h-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl pointer-events-none",
                        isWin ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                    </div>
                  );
                }) : (
                  <div className="py-12 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.06] bg-white/[0.01]">
                    <BarChart3 size={24} className="text-white/5 mb-3" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">No market execution logs found</p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Interactive Task Management Section */}
            <motion.section variants={itemVariants} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Task Execution</h3>
                </div>

                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] p-1 rounded-xl">
                  {(['all', 'active', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTaskFilter(filter)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        taskFilter === filter ? "bg-white/[0.08] text-white" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                  <div className="w-px h-3 bg-white/[0.05] mx-1" />
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-[9px] font-black uppercase tracking-widest"
                  >
                    <Plus size={12} />
                    New Task
                  </button>
                </div>
              </div>

              {/* Task Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: taskStats.total, color: 'blue' },
                  { label: 'Completed', value: taskStats.completed, color: 'emerald' },
                  { label: 'Pending', value: taskStats.pending, color: 'rose' },
                  { label: 'Done', value: `${taskStats.rate.toFixed(0)}%`, color: 'amber' },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] flex flex-col items-center justify-center gap-1 group hover:bg-white/[0.03] transition-all">
                    <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">{stat.label}</span>
                    <span className={cn("text-lg font-black tracking-tighter", {
                      'text-blue-400': stat.color === 'blue',
                      'text-emerald-400': stat.color === 'emerald',
                      'text-rose-400': stat.color === 'rose',
                      'text-amber-400': stat.color === 'amber',
                    })}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Inline Add Task Form */}
              <AnimatePresence>
                {isAddingTask && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="p-6 rounded-[28px] bg-white/[0.03] border border-blue-500/20 shadow-[0_20px_40px_rgba(59,130,246,0.1)] space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        autoFocus
                        placeholder="What needs to be done?"
                        className="bg-transparent text-white font-bold text-sm placeholder:text-muted-foreground/30 outline-none w-full"
                        value={newTaskData.title}
                        onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/[0.05] p-1 rounded-lg">
                          {(['low', 'medium', 'high'] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => setNewTaskData({ ...newTaskData, priority: p })}
                              className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all",
                                newTaskData.priority === p ? PRIORITY_COLORS[p] : "border-transparent text-muted-foreground/40 hover:text-white"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 bg-white/[0.05] px-2 py-1 rounded-lg text-muted-foreground">
                          <Clock size={12} />
                          <input type="time" className="bg-transparent text-[10px] font-bold outline-none" value={newTaskData.startTime} onChange={(e) => setNewTaskData({ ...newTaskData, startTime: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <textarea placeholder="Optional details..." className="bg-transparent text-xs text-muted-foreground/60 placeholder:text-muted-foreground/20 outline-none w-full resize-none h-16" value={newTaskData.description} onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })} />
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={() => setIsAddingTask(false)} className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-white">Cancel</button>
                      <button onClick={handleAddTask} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Save Task</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 min-h-[100px]">
                {filteredTasks.length > 0 ? filteredTasks.map(event => (
                  <motion.div layout key={event.id} className={cn("p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-between hover:bg-white/[0.04] transition-all group", event.completed && "opacity-50")}>
                    <div className="flex items-center gap-4 flex-1">
                      <button onClick={(e) => { e.stopPropagation(); onUpdateTask(event.id, { ...event, completed: !event.completed }); }} className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0", event.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5 border-white/10 text-transparent hover:border-emerald-500/50")}>
                        <CheckCircle2 size={14} className={cn("transition-transform duration-300", event.completed ? "scale-100" : "scale-0")} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className={cn("font-bold text-white text-sm transition-all duration-300", event.completed && "line-through text-zinc-500")}>{event.title}</p>
                          {event.priority && (
                            <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0", PRIORITY_COLORS[event.priority])}>{event.priority}</span>
                          )}
                        </div>
                        {event.description && (
                          <p className={cn("text-[11px] text-muted-foreground/40 mt-1 line-clamp-1", event.completed && "opacity-30")}>{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground/30 font-black text-[10px] uppercase tracking-widest">
                      <Clock size={12} className="group-hover:text-blue-500 transition-colors" />
                      {event.startTime} — {event.endTime}
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-12 text-center rounded-[28px] border border-dashed border-white/[0.06] bg-white/[0.01]">
                    <Filter size={24} className="text-white/5 mb-3 mx-auto" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">No matching tasks found</p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Schedule & Notes */}
            <div className="grid grid-cols-1 gap-10">
              <motion.section variants={itemVariants} className="space-y-5">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Insights & Notes</h3>
                </div>
                <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
                  <StickyNote size={16} className="text-orange-500/40 mb-4" />
                  <div className="text-sm text-zinc-400 leading-relaxed font-medium italic">
                    "Institutional performance summary for {format(date, 'MMM do')}: Markets showed significant volatility. Key lessons derived from execution logs should be applied to the next trading cycle."
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">AI Performance Synthesizer Active</span>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>

          {/* Glass footer hint */}
          <div className="px-8 py-4 bg-white/[0.02] border-t border-white/[0.04] flex items-center justify-center">
            <div className="flex items-center gap-2 opacity-20">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Institutional Terminal v1.4</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}