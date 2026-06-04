'use client';
import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PsychologySectionProps {
  form: UseFormReturn<TradeFormData>;
}

const strategies = [
  'Breakout',
  'Trend Following',
  'Reversal',
  'Range Trading',
  'Momentum',
  'Scalping',
  'News Trading',
  'Support/Resistance',
  'Moving Average Cross',
  'VWAP',
  'ICT/SMC',
  'Elliott Wave',
  'Custom',
];

const emotions = [
  { value: 'calm', label: '😌 Calm & Focused' },
  { value: 'confident', label: '💪 Confident' },
  { value: 'excited', label: '🔥 Excited / FOMO' },
  { value: 'anxious', label: '😰 Anxious' },
  { value: 'fearful', label: '😨 Fearful' },
  { value: 'greedy', label: '🤑 Greedy' },
  { value: 'revenge', label: '😤 Revenge Trading' },
  { value: 'bored', label: '😑 Bored / Overtrading' },
  { value: 'neutral', label: '😐 Neutral' },
];

const mistakeCategories = [
  'No mistake',
  'Entered too early',
  'Entered too late',
  'Moved stop loss',
  'Took profit too early',
  'Held too long',
  'Ignored stop loss',
  'Overtraded',
  'Revenge traded',
  'Broke trading rules',
  'Poor risk management',
  'FOMO entry',
  'Emotional decision',
  'News event ignored',
];

export default function PsychologySection({ form }: PsychologySectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const selectedStrategy = watch('strategyUsed');
  const selectedEmotionBefore = watch('emotionBefore');
  const selectedEmotionAfter = watch('emotionAfter');
  const selectedMistake = watch('mistakeCategory');

  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isMistakeOpen, setIsMistakeOpen] = useState(false);

  const strategyRef = useRef<HTMLDivElement>(null);
  const mistakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (strategyRef.current && !strategyRef.current.contains(event.target as Node)) setIsStrategyOpen(false);
      if (mistakeRef.current && !mistakeRef.current.contains(event.target as Node)) setIsMistakeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-5">
      {/* Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative" ref={strategyRef}>
          <label className="form-label" htmlFor="strategy-used">Strategy Used</label>
          <p className="form-helper">Which trading strategy was applied</p>
          
          <button
            type="button"
            onClick={() => setIsStrategyOpen(!isStrategyOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all bg-zinc-950 border-zinc-800 text-white ${
              isStrategyOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50' : ''
            }`}
          >
            <span className={selectedStrategy ? 'text-white' : 'text-zinc-500'}>
              {selectedStrategy || 'Select strategy'}
            </span>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isStrategyOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isStrategyOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {strategies.map((s) => (
                    <button
                      key={`strat-${s}`}
                      type="button"
                      onClick={() => { setValue('strategyUsed', s, { shouldDirty: true, shouldValidate: true }); setIsStrategyOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedStrategy === s ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('strategyUsed', { required: 'Strategy is required for AI analysis' })} />
          {errors.strategyUsed && <p className="form-error">{errors.strategyUsed.message}</p>}
        </div>

        <div className="relative" ref={mistakeRef}>
          <label className="form-label" htmlFor="mistake-category">Mistake Category</label>
          <p className="form-helper">Identify what went wrong (if anything)</p>
          
          <button
            type="button"
            onClick={() => setIsMistakeOpen(!isMistakeOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all bg-zinc-950 border-zinc-800 text-white ${
              isMistakeOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50' : ''
            }`}
          >
            <span className={selectedMistake ? 'text-white' : 'text-zinc-500'}>
              {selectedMistake || 'Select category'}
            </span>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isMistakeOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isMistakeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setValue('mistakeCategory', '', { shouldDirty: true }); setIsMistakeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                      !selectedMistake ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    Select category
                  </button>
                  {mistakeCategories.map((m) => (
                    <button
                      key={`mistake-${m}`}
                      type="button"
                      onClick={() => { setValue('mistakeCategory', m, { shouldDirty: true }); setIsMistakeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedMistake === m ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('mistakeCategory')} />
        </div>
      </div>

      {/* Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Emotion Before Trade</label>
          <p className="form-helper">How were you feeling when you entered?</p>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {emotions.map((e) => (
              <button
                key={`emo-before-${e.value}`}
                type="button"
                onClick={() => setValue('emotionBefore', e.value, { shouldDirty: true, shouldValidate: true })}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all duration-150 text-left truncate ${
                  selectedEmotionBefore === e.value
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                    : 'border-white/[0.05] bg-white/[0.02] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
                title={e.label}
              >
                {e.label}
              </button>
            ))}
          </div>
          <input type="hidden" {...register('emotionBefore')} />
          {errors.emotionBefore && <p className="form-error">{errors.emotionBefore.message}</p>}
        </div>
        <div>
          <label className="form-label">Emotion After Trade</label>
          <p className="form-helper">How did you feel after closing?</p>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {emotions.map((e) => (
              <button
                key={`emo-after-${e.value}`}
                type="button"
                onClick={() => setValue('emotionAfter', e.value, { shouldDirty: true })}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all duration-150 text-left truncate ${
                  selectedEmotionAfter === e.value
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                    : 'border-white/[0.05] bg-white/[0.02] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
                title={e.label}
              >
                {e.label}
              </button>
            ))}
          </div>
          <input type="hidden" {...register('emotionAfter')} />
        </div>
      </div>

      {/* Lessons Learned */}
      <div>
        <label className="form-label" htmlFor="lessons-learned">
          Lessons Learned
        </label>
        <p className="form-helper">
          What would you do differently? This feeds AI coaching analysis.
        </p>
        <textarea
          id="lessons-learned"
          rows={3}
          className="form-input mt-1.5 resize-none bg-zinc-950 border-zinc-800 text-white"
          placeholder="e.g. I should have waited for a confirmed close above resistance before entering. The volume wasn't supporting the breakout."
          {...register('lessonsLearned')}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="form-label" htmlFor="trade-notes">
          Additional Notes
        </label>
        <p className="form-helper">Market context, news events, or anything else relevant</p>
        <textarea
          id="trade-notes"
          rows={2}
          className="form-input mt-1.5 resize-none bg-zinc-950 border-zinc-800 text-white"
          placeholder="e.g. Fed announcement at 2PM caused unexpected volatility. News-driven move, not pure technical."
          {...register('notes')}
        />
      </div>
    </div>
  );
}
