'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { GoalType } from '@/lib/goals/types';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function GoalFormModal({ isOpen, onClose, onSubmit }: GoalFormModalProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [type, setType] = React.useState<GoalType>('profit');
  const [targetValue, setTargetValue] = React.useState('');
  const [deadline, setDeadline] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetValue) return;

    let category: 'performance' | 'risk' | 'psychology' | 'custom' = 'custom';
    if (['profit', 'win_rate', 'trade_count'].includes(type)) category = 'performance';
    if (['max_loss', 'rr_ratio'].includes(type)) category = 'risk';
    if (['discipline'].includes(type)) category = 'psychology';

    onSubmit({
      title,
      description,
      type,
      // Remove commas or currency symbols that might break parseFloat
      targetValue: parseFloat(targetValue.replace(/[^\d.-]/g, '')),
      deadline: deadline || undefined,
      category,
    });
    onClose();
    // Reset
    setTitle('');
    setDescription('');
    setTargetValue('');
    setDeadline('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-foreground mb-6">Create New Goal</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Goal Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. Hit $1k Profit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Goal Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as GoalType)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value="profit">Profit Target ($)</option>
                  <option value="win_rate">Win Rate Target (%)</option>
                  <option value="consistency">Consistency Target</option>
                  <option value="max_loss">Max Drawdown / Loss Limit ($)</option>
                  <option value="rr_ratio">Average RR Target</option>
                  <option value="trade_count">Number of Trades</option>
                  <option value="discipline">Discipline Score (%)</option>
                  <option value="custom">Custom Value</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Target Value
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors mt-6"
              >
                Create Goal
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
