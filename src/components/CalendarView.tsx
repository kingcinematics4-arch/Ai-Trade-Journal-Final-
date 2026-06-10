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
  Calendar as CalendarIcon,
  Info,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useCalendarEvents } from '@/hooks/useCalendarEvents';

import EventModal from './EventModal';

import type { CalendarEvent } from '@/components/index';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);

  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarEvents();

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

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
        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[140px]">

          {days.map((day: Date) => {
            const dayEvents =
              getEventsForDay(day);

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

                <span
                  className={cn(
                    'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-xl transition-colors duration-200',

                    isSelected
                      ? 'text-white'

                      : isCurrentToday
                      ? 'text-blue-400'

                      : 'text-foreground/70'
                  )}
                >
                  {format(day, 'd')}
                </span>

                <div className="mt-1.5 space-y-1 overflow-hidden h-[calc(100%-24px)]">

                  {dayEvents
                    .slice(0, 3)
                    .map(
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
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded border truncate ${getColorClass(
                            event.color
                          )}`}
                        >
                          {
                            event.startTime
                          }{' '}
                          {event.title}
                        </div>
                      )
                    )}

                  {dayEvents.length >
                    3 && (
                    <div className="text-[9px] text-muted-foreground font-bold px-1">
                      +{' '}
                      {dayEvents.length -
                        3}{' '}
                      more
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
    </div>
  );
}