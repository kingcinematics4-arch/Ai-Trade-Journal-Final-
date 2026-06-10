export type EventColor = 'blue' | 'green' | 'purple' | 'red' | 'orange';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO format YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: EventColor;
  createdAt: number;
}

export type CalendarViewMode = 'month' | 'week' | 'day';