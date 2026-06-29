'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Clock, AlignLeft, Tag } from 'lucide-react';
import type { CalendarEvent, EventColor } from '@/components/index';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialDate?: string;
  editingEvent?: CalendarEvent | null;
}

const COLORS: { value: EventColor; class: string }[] = [
  { value: 'blue', class: 'bg-blue-500' },
  { value: 'green', class: 'bg-green-500' },
  { value: 'purple', class: 'bg-purple-500' },
  { value: 'red', class: 'bg-red-500' },
  { value: 'orange', class: 'bg-orange-500' },
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  editingEvent,
}: EventModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: editingEvent || {
      title: '',
      description: '',
      date: initialDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      color: 'blue' as EventColor,
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (isOpen) {
      reset(
        editingEvent || {
          title: '',
          description: '',
          date: initialDate || new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          color: 'blue' as EventColor,
        }
      );
    }
  }, [isOpen, editingEvent, initialDate, reset]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-bold text-lg text-foreground">
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Event Title
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Weekly Market Review"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
              {errors.title && (
                <p className="text-[10px] text-red-500 mt-1">{errors.title.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  {...register('date', { required: true })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Tag size={12} /> Color
                </label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setValue('color', c.value)}
                      className={`w-6 h-6 rounded-full ${c.class} transition-transform ${selectedColor === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'opacity-40 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Clock size={12} /> Start Time
                </label>
                <input
                  type="time"
                  {...register('startTime')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Clock size={12} /> End Time
                </label>
                <input
                  type="time"
                  {...register('endTime')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                <AlignLeft size={12} /> Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Details about this event..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              {editingEvent ? (
                <button
                  type="button"
                  onClick={() => onDelete?.(editingEvent.id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold"
                >
                  <Save size={14} />
                  {editingEvent ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
