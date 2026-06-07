'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './src/app/add-trade/components/AddTradeForm';
import { ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PsychologySectionProps {
  form: UseFormReturn<TradeFormData>;
}

interface DropdownState {
  strategy: boolean;
  emotionBefore: boolean;
  emotionAfter: boolean;
  mistake: boolean;
}

const DEFAULT_STRATEGIES = [
  'Breakout', 'Retest', 'Scalp', 'Swing',
  'Trend Following', 'Counter-trend', 'News', 'Arbitrage', 'Other'
];

const DEFAULT_EMOTIONS = [
  'Neutral', 'Calm', 'Anxious', 'Greedy',
  'Fearful', 'Excitement', 'Revenge', 'Disappointed', 'Confident'
];

const DEFAULT_MISTAKES = [
  'None', 'FOMO', 'Chasing', 'Over-leveraged',
  'Early Exit', 'Stop-loss Moved', 'Ignored Plan', 'Hesitation', 'Other'
];

export default function PsychologySection({ form }: PsychologySectionProps) {
  const { register, watch, setValue } = form;

  const selectedStrategy = watch('strategyUsed');
  const selectedEmotionBefore = watch('emotionBefore');
  const selectedEmotionAfter = watch('emotionAfter');
  const selectedMistake = watch('mistakeCategory');

  const [isOpen, setIsOpen] = useState<DropdownState>({
    strategy: false,
    emotionBefore: false,
    emotionAfter: false,
    mistake: false,
  });

  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES);
  const [emotionsBefore, setEmotionsBefore] = useState(DEFAULT_EMOTIONS);
  const [emotionsAfter, setEmotionsAfter] = useState(DEFAULT_EMOTIONS);
  const [mistakes, setMistakes] = useState(DEFAULT_MISTAKES);

  const refs = {
    strategy: useRef<HTMLDivElement>(null),
    emotionBefore: useRef<HTMLDivElement>(null),
    emotionAfter: useRef<HTMLDivElement>(null),
    mistake: useRef<HTMLDivElement>(null),
  };

  // Load saved data
  useEffect(() => {
    const s = localStorage.getItem('strategies');
    const eb = localStorage.getItem('emotionsBefore');
    const ea = localStorage.getItem('emotionsAfter');
    const m = localStorage.getItem('mistakes');

    if (s) setStrategies(JSON.parse(s));
    if (eb) setEmotionsBefore(JSON.parse(eb));
    if (ea) setEmotionsAfter(JSON.parse(ea));
    if (m) setMistakes(JSON.parse(m));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      (Object.keys(refs) as Array<keyof typeof refs>).forEach((key) => {
        const ref = refs[key];
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setIsOpen(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const deleteItem = (type: keyof TradeFormData, item: string) => {
    const ok = window.confirm(`Delete "${item}"?`);
    if (!ok) return;

    if (type === 'strategyUsed') {
      const updated = strategies.filter(i => i !== item);
      setStrategies(updated);
      localStorage.setItem('strategies', JSON.stringify(updated));

      if (selectedStrategy === item) setValue('strategyUsed', '' as any);
    }

    if (type === 'emotionBefore') {
      const updated = emotionsBefore.filter(i => i !== item);
      setEmotionsBefore(updated);
      localStorage.setItem('emotionsBefore', JSON.stringify(updated));

      if (selectedEmotionBefore === item) setValue('emotionBefore', '' as any);
    }

    if (type === 'emotionAfter') {
      const updated = emotionsAfter.filter(i => i !== item);
      setEmotionsAfter(updated);
      localStorage.setItem('emotionsAfter', JSON.stringify(updated));

      if (selectedEmotionAfter === item) setValue('emotionAfter', '' as any);
    }

    if (type === 'mistakeCategory') {
      const updated = mistakes.filter(i => i !== item);
      setMistakes(updated);
      localStorage.setItem('mistakes', JSON.stringify(updated));

      if (selectedMistake === item) setValue('mistakeCategory', '' as any);
    }
  };

  const renderDropdown = (
    label: string,
    helper: string,
    value: string,
    setValueFn: (v: string) => void,
    list: string[],
    isDropdownOpen: boolean,
    toggleKey: keyof DropdownState,
    type: keyof TradeFormData,
    ref: React.RefObject<HTMLDivElement | null>
  ) => (
    <div className="relative" ref={ref}>
      <label className="form-label text-white">{label}</label>
      <p className="form-helper text-zinc-500">{helper}</p>

      <button
        type="button"
        onClick={() =>
          setIsOpen(prev => ({ ...prev, [toggleKey]: !prev[toggleKey] }))
        }
        className="w-full flex items-center justify-between form-input mt-1.5 bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4"
      >
        <span className={value ? 'text-white' : 'text-zinc-500'}>
          {value || 'Select'}
        </span>
        <ChevronDown size={14} />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {list.map(opt => (
                <div
                  key={opt}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800 cursor-pointer"
                  onClick={() => {
                    setValueFn(opt);
                    setValue(type as any, opt as any, { shouldDirty: true });
                    setIsOpen(prev => ({ ...prev, [toggleKey]: false }));
                  }}
                >
                  <span>{opt}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(type, opt);
                    }}
                    className="text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="hidden" {...register(type as any)} />
    </div>
  );

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderDropdown(
          'Strategy Used',
          'Which setup did you follow?',
          selectedStrategy,
          v => setValue('strategyUsed', v),
          strategies,
          isOpen.strategy,
          'strategy',
          'strategyUsed',
          refs.strategy
        )}

        {renderDropdown(
          'Mistake Category',
          'Did you break any rules?',
          selectedMistake,
          v => setValue('mistakeCategory', v),
          mistakes,
          isOpen.mistake,
          'mistake',
          'mistakeCategory',
          refs.mistake
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderDropdown(
          'Emotion Before',
          'Your mindset before entry',
          selectedEmotionBefore,
          v => setValue('emotionBefore', v),
          emotionsBefore,
          isOpen.emotionBefore,
          'emotionBefore',
          'emotionBefore',
          refs.emotionBefore
        )}

        {renderDropdown(
          'Emotion After',
          'How did you feel after exit?',
          selectedEmotionAfter,
          v => setValue('emotionAfter', v),
          emotionsAfter,
          isOpen.emotionAfter,
          'emotionAfter',
          'emotionAfter',
          refs.emotionAfter
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="form-label text-white">Lessons Learned</label>
          <textarea
            className="form-input mt-1.5 w-full h-24 bg-zinc-950 border-zinc-800 text-white rounded-xl p-4"
            {...register('lessonsLearned')}
          />
        </div>

        <div>
          <label className="form-label text-white">Notes & Details</label>
          <textarea
            className="form-input mt-1.5 w-full h-32 bg-zinc-950 border-zinc-800 text-white rounded-xl p-4"
            {...register('notes')}
          />
        </div>
      </div>
    </div>
  );
}
