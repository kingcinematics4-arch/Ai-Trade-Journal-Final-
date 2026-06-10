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
  isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import EventModal from './EventModal';
import type { CalendarEvent } from '@/types/calendar';
import { toast } from 'sonner';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const onSaveEvent = (data: any) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
      toast.success('Event updated');
    } else {
      addEvent(data);
      toast.success('Event scheduled');
    }
    setIsModalOpen(false);
  };

  const getEventsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'red': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'orange': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h1>
            <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">Trading Schedule & Sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-blue-500/5 p-1.5 rounded-2xl border border-blue-500/10">
            <button onClick={handlePrevMonth} className="p-2.5 hover:bg-blue-500/10 rounded-xl transition-colors text-zinc-400 hover:text-white"><ChevronLeft size={18} /></button>
            <button onClick={handleToday} className="px-5 text-xs font-black hover:bg-blue-500/10 rounded-xl transition-colors text-zinc-400 hover:text-white">Today</button>
            <button onClick={handleNextMonth} className="p-2.5 hover:bg-blue-500/10 rounded-xl transition-colors text-zinc-400 hover:text-white"><ChevronRight size={18} /></button>
          </div>
          <button onClick={handleAddEvent} className="btn-primary h-12 px-6 text-xs font-black rounded-2xl shadow-2xl shadow-blue-500/20">
            <Plus size={16} className="mr-2 inline" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card-premium overflow-hidden border-white/[0.05] bg-zinc-900/40 backdrop-blur-3xl">
        <div className="grid grid-cols-7 border-b border-blue-500/10 bg-blue-500/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[140px]">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentToday = isToday(day);

            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative border-r border-b border-border/40 p-1.5 overflow-hidden cursor-pointer transition-all duration-200 ease-in-out select-none outline-none ring-0 focus:outline-none focus:ring-0 active:outline-none active:ring-0 appearance-none',
                  !isCurrentMonth
                    ? 'bg-muted/5 opacity-40'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : isCurrentToday
                    ? 'bg-blue-500/10 border border-blue-500/40 text-blue-400'
                    : 'bg-transparent text-foreground hover:bg-blue-500/10 hover:text-white'
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <span className={cn(
                  "text-xs font-bold w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-200",
                  isSelected ? "text-white" : isCurrentToday ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}>
                  {format(day, 'd')}
                </span>

                <div className="mt-2 space-y-1 overflow-hidden h-[calc(100%-32px)]">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEditEvent(e, event)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border truncate transition-transform hover:scale-[1.02] active:scale-95 ${getColorClass(event.color)}`}
                    >
                      {event.startTime} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-muted-foreground/50 font-black px-1 uppercase tracking-tighter">+ {dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate.toString()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-7 bg-white/[0.02]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="font-bold text-xl text-white tracking-tight">
                {format(selectedDate, 'EEEE, MMMM do')}
              </h2>
              {isToday(selectedDate) && (
                <span className="inline-block px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                  Today
                </span>
              )}
            </div>
            <button onClick={handleAddEvent} className="text-xs font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
              Add Event
            </button>
          </div>

          <div className="space-y-4">
            {getEventsForDay(selectedDate).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.05] rounded-[24px]">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center text-zinc-600 mb-3">
                  <Info size={20} />
                </div>
                <p className="text-sm text-zinc-500 font-medium">No trading events scheduled for this day.</p>
              </div>
            ) : (
              getEventsForDay(selectedDate).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => handleEditEvent(e, event)}
                  className="flex items-center justify-between p-5 bg-white/[0.01] border border-white/[0.03] rounded-[20px] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-1.5 h-12 rounded-full ${
                      event.color === 'blue' ? 'bg-blue-500' :
                      event.color === 'green' ? 'bg-emerald-500' :
                      event.color === 'red' ? 'bg-red-500' :
                      event.color === 'orange' ? 'bg-orange-500' : 'bg-purple-500'
                    } shadow-[0_0_15px_rgba(59,130,246,0.3)]`} />
                    <div>
                      <p className="font-bold text-[15px] text-white group-hover:text-blue-500 transition-colors">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                         <span className="flex items-center gap-1"><Clock size={12} /> {event.startTime} - {event.endTime}</span>
                         {event.description && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
                         {event.description && <span className="truncate max-w-[200px] italic">{event.description}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center text-zinc-600 group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveEvent}
        onDelete={(id) => { 
          deleteEvent(id); 
          setIsModalOpen(false); 
          toast.success('Event deleted');
        }}
        initialDate={format(selectedDate, 'yyyy-MM-dd')}
        editingEvent={editingEvent}
      />
    </div>
  );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}