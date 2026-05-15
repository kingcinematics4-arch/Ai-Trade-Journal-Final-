'use client';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';

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
  const emotionBefore = watch('emotionBefore');
  const emotionAfter = watch('emotionAfter');

  return (
    <div className="space-y-5">
      {/* Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="strategy-used">
            Strategy Used
          </label>
          <p className="form-helper">Which trading strategy was applied</p>
          <select
            id="strategy-used"
            className="form-input mt-1.5"
            {...register('strategyUsed', { required: 'Strategy is required for AI analysis' })}
          >
            <option value="">Select strategy</option>
            {strategies.map((s) => (
              <option key={`strat-${s}`} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.strategyUsed && <p className="form-error">{errors.strategyUsed.message}</p>}
        </div>
        <div>
          <label className="form-label" htmlFor="mistake-category">
            Mistake Category
          </label>
          <p className="form-helper">Identify what went wrong (if anything)</p>
          <select
            id="mistake-category"
            className="form-input mt-1.5"
            {...register('mistakeCategory')}
          >
            <option value="">Select category</option>
            {mistakeCategories.map((m) => (
              <option key={`mistake-${m}`} value={m}>
                {m}
              </option>
            ))}
          </select>
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
                onClick={() => setValue('emotionBefore', e.value)}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all duration-150 text-left truncate ${
                  emotionBefore === e.value
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-zinc-600 hover:text-foreground'
                }`}
                title={e.label}
              >
                {e.label}
              </button>
            ))}
          </div>
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
                onClick={() => setValue('emotionAfter', e.value)}
                className={`px-2 py-1.5 rounded-lg border text-xs transition-all duration-150 text-left truncate ${
                  emotionAfter === e.value
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-zinc-600 hover:text-foreground'
                }`}
                title={e.label}
              >
                {e.label}
              </button>
            ))}
          </div>
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
          className="form-input mt-1.5 resize-none"
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
          className="form-input mt-1.5 resize-none"
          placeholder="e.g. Fed announcement at 2PM caused unexpected volatility. News-driven move, not pure technical."
          {...register('notes')}
        />
      </div>
    </div>
  );
}
