'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, AlignLeft, Target } from 'lucide-react';
import type { CalendarGoal } from '@/stores/useCalendarGoalsStore';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialDate?: string;
  editingGoal?: CalendarGoal | null;
}

export default function GoalModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  editingGoal,
}: GoalModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: editingGoal || {
      title: '',
      description: '',
      date: initialDate || new Date().toISOString().split('T')[0],
      status: 'pending' as const,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        editingGoal || {
          title: '',
          description: '',
          date: initialDate || new Date().toISOString().split('T')[0],
          status: 'pending' as const,
        }
      );
    }
  }, [isOpen, editingGoal, initialDate, reset]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Target size={18} className="text-primary" />
              {editingGoal ? 'Edit Goal' : 'Add Daily Goal'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Goal Title
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., Complete 5 backtesting sessions"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
              {errors.title && (
                <p className="text-[10px] text-red-500 mt-1">{errors.title.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                <AlignLeft size={12} /> Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="What specifically do you want to achieve?"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              {editingGoal ? (
                <button
                  type="button"
                  onClick={() => onDelete?.(editingGoal.id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={14} /> Delete
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
                  <Save size={14} /> {editingGoal ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
