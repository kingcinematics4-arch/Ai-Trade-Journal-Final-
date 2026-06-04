'use client';
import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PsychologySectionProps {
  form: UseFormReturn<TradeFormData>;
}

const strategies = ['Breakout', 'Retest', 'Scalp', 'Swing', 'Trend Following', 'Counter-trend', 'News', 'Arbitrage', 'Other'];
const emotions = ['Neutral', 'Calm', 'Anxious', 'Greedy', 'Fearful', 'Excitement', 'Revenge', 'Disappointed', 'Confident'];
const mistakes = ['None', 'FOMO', 'Chasing', 'Over-leveraged', 'Early Exit', 'Stop-loss Moved', 'Ignored Plan', 'Hesitation', 'Other'];

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
  const [isEmotionBeforeOpen, setIsEmotionBeforeOpen] = useState(false);
  const [isEmotionAfterOpen, setIsEmotionAfterOpen] = useState(false);
  const [isMistakeOpen, setIsMistakeOpen] = useState(false);

  const strategyRef = useRef<HTMLDivElement>(null);
  const emotionBeforeRef = useRef<HTMLDivElement>(null);
  const emotionAfterRef = useRef<HTMLDivElement>(null);
  const mistakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (strategyRef.current && !strategyRef.current.contains(event.target as Node)) setIsStrategyOpen(false);
      if (emotionBeforeRef.current && !emotionBeforeRef.current.contains(event.target as Node)) setIsEmotionBeforeOpen(false);
      if (emotionAfterRef.current && !emotionAfterRef.current.contains(event.target as Node)) setIsEmotionAfterOpen(false);
      if (mistakeRef.current && !mistakeRef.current.contains(event.target as Node)) setIsMistakeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Dropdown */}
        <div className="relative" ref={strategyRef}>
          <label className="form-label text-white">Strategy Used</label>
          <p className="form-helper text-zinc-500">Which setup did you follow?</p>
          <button
            type="button"
            onClick={() => setIsStrategyOpen(!isStrategyOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4 ${
              isStrategyOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50 shadow-lg' : ''
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
                  {strategies.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setValue('strategyUsed', opt, { shouldDirty: true }); setIsStrategyOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedStrategy === opt ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('strategyUsed')} />
        </div>

        {/* Mistake Dropdown */}
        <div className="relative" ref={mistakeRef}>
          <label className="form-label text-white">Mistake Category</label>
          <p className="form-helper text-zinc-500">Did you break any rules?</p>
          <button
            type="button"
            onClick={() => setIsMistakeOpen(!isMistakeOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4 ${
              isMistakeOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50 shadow-lg' : ''
            }`}
          >
            <span className={selectedMistake ? 'text-white' : 'text-zinc-500'}>
              {selectedMistake || 'Select mistake'}
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
                  {mistakes.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setValue('mistakeCategory', opt, { shouldDirty: true }); setIsMistakeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedMistake === opt ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('mistakeCategory')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emotion Before Dropdown */}
        <div className="relative" ref={emotionBeforeRef}>
          <label className="form-label text-white">Emotion Before</label>
          <p className="form-helper text-zinc-500">Your mindset before entry</p>
          <button
            type="button"
            onClick={() => setIsEmotionBeforeOpen(!isEmotionBeforeOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4 ${
              isEmotionBeforeOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50 shadow-lg' : ''
            }`}
          >
            <span className={selectedEmotionBefore ? 'text-white' : 'text-zinc-500'}>
              {selectedEmotionBefore || 'Select emotion'}
            </span>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isEmotionBeforeOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isEmotionBeforeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {emotions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setValue('emotionBefore', opt, { shouldDirty: true }); setIsEmotionBeforeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedEmotionBefore === opt ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('emotionBefore')} />
        </div>

        {/* Emotion After Dropdown */}
        <div className="relative" ref={emotionAfterRef}>
          <label className="form-label text-white">Emotion After</label>
          <p className="form-helper text-zinc-500">How did you feel after exit?</p>
          <button
            type="button"
            onClick={() => setIsEmotionAfterOpen(!isEmotionAfterOpen)}
            className={`w-full flex items-center justify-between form-input mt-1.5 text-left transition-all bg-zinc-950 border-zinc-800 text-white rounded-xl py-3 px-4 ${
              isEmotionAfterOpen ? 'border-zinc-700 ring-2 ring-zinc-800/50 shadow-lg' : ''
            }`}
          >
            <span className={selectedEmotionAfter ? 'text-white' : 'text-zinc-500'}>
              {selectedEmotionAfter || 'Select emotion'}
            </span>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isEmotionAfterOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isEmotionAfterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                  {emotions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setValue('emotionAfter', opt, { shouldDirty: true }); setIsEmotionAfterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        selectedEmotionAfter === opt ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="hidden" {...register('emotionAfter')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="form-label text-white">Lessons Learned</label>
          <p className="form-helper text-zinc-500">Key takeaway from this specific trade</p>
          <textarea
            className="form-input mt-1.5 w-full h-24 resize-none bg-zinc-950 border-zinc-800 text-white rounded-xl p-4 focus:ring-1 focus:ring-zinc-700 outline-none transition-all placeholder:text-zinc-600"
            placeholder="What will you do differently next time?"
            {...register('lessonsLearned')}
          />
        </div>
        <div>
          <label className="form-label text-white">Notes & Details</label>
          <p className="form-helper text-zinc-500">Additional context or journal entry</p>
          <textarea
            className="form-input mt-1.5 w-full h-32 resize-none bg-zinc-950 border-zinc-800 text-white rounded-xl p-4 focus:ring-1 focus:ring-zinc-700 outline-none transition-all placeholder:text-zinc-600"
            placeholder="Describe the trade context, price action, or market sentiment..."
            {...register('notes')}
          />
        </div>
      </div>
    </div>
  );
}