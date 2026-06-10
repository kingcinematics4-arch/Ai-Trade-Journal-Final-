'use client';

import { useState, useEffect } from 'react';
import type { CalendarEvent } from '@/components/index';

const STORAGE_KEY = 'ai_trade_journal_calendar_events';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load events
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse calendar events', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save events
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isInitialized]);

  const addEvent = (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updatedData: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, ...updatedData } : event))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return { events, addEvent, updateEvent, deleteEvent, isInitialized };
}