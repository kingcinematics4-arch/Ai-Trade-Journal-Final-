'use client';
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';
import SearchableSelect from './SearchableSelect';

interface PsychologySectionProps {
  form: UseFormReturn<TradeFormData>;
}

const defaultStrategies = [
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

const defaultEmotions = [
  '😌 Calm & Focused',
  '💪 Confident',
  '🔥 Excited / FOMO',
  '😰 Anxious',
  '😨 Fearful',
  '🤑 Greedy',
  '😤 Revenge Trading',
  '😑 Bored / Overtrading',
  '😐 Neutral',
];

const defaultMistakes = [
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

  const [strategies, setStrategies] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [emotions, setEmotions] = useState<any[]>([]);

  useEffect(() => {
    const s = localStorage.getItem('v2-strategies');
    setStrategies(s ? JSON.parse(s) : defaultStrategies.map(x => ({ id: x, label: x, value: x })));
    
    const m = localStorage.getItem('v2-mistakes');
    setMistakes(m ? JSON.parse(m) : defaultMistakes.map(x => ({ id: x, label: x, value: x })));
    
    const e = localStorage.getItem('v2-emotions');
    setEmotions(e ? JSON.parse(e) : defaultEmotions.map(x => ({ id: x, label: x, value: x })));
  }, []);

  const handleAdd = (val: string, setter: any, storageKey: string, setValueKey: keyof TradeFormData) => {
    const name = val?.trim();
    if (!name) return;
    const newItem = { id: crypto.randomUUID(), label: name, value: name };
    setter((prev: any) => {
      if (prev.some((item: any) => item.value === name)) return prev;
      const updated = [newItem, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setValue(setValueKey, name, { shouldDirty: true, shouldValidate: true });
  };

  const handleDelete = (item: any, setter: any, storageKey: string, setValueKeys: (keyof TradeFormData)[]) => {
    if (!window.confirm(`Remove "${item.label}" from options?`)) return;
    setter((prev: any) => {
      const updated = prev.filter((x: any) => x.id !== item.id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setValueKeys.forEach(key => {
      if (watch(key) === item.value) {
        setValue(key, '', { shouldDirty: true, shouldValidate: true });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Strategy Used"
          helperText="Which trading strategy was applied"
          items={strategies}
          value={selectedStrategy}
          onSelect={(val) => setValue('strategyUsed', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setStrategies, 'v2-strategies', ['strategyUsed'])}
          onAddCustom={(val) => handleAdd(val, setStrategies, 'v2-strategies', 'strategyUsed')}
          error={errors.strategyUsed?.message}
        />

        <SearchableSelect
          label="Mistake Category"
          helperText="Identify what went wrong (if anything)"
          items={mistakes}
          value={selectedMistake}
          onSelect={(val) => setValue('mistakeCategory', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setMistakes, 'v2-mistakes', ['mistakeCategory'])}
          onAddCustom={(val) => handleAdd(val, setMistakes, 'v2-mistakes', 'mistakeCategory')}
          error={errors.mistakeCategory?.message}
        />
      </div>

      {/* Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Emotion Before Trade"
          helperText="How were you feeling when you entered?"
          items={emotions}
          value={selectedEmotionBefore}
          onSelect={(val) => setValue('emotionBefore', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setEmotions, 'v2-emotions', ['emotionBefore', 'emotionAfter'])}
          onAddCustom={(val) => handleAdd(val, setEmotions, 'v2-emotions', 'emotionBefore')}
          error={errors.emotionBefore?.message}
        />

        <SearchableSelect
          label="Emotion After Trade"
          helperText="How did you feel after closing?"
          items={emotions}
          value={selectedEmotionAfter}
          onSelect={(val) => setValue('emotionAfter', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setEmotions, 'v2-emotions', ['emotionBefore', 'emotionAfter'])}
          onAddCustom={(val) => handleAdd(val, setEmotions, 'v2-emotions', 'emotionAfter')}
          error={errors.emotionAfter?.message}
        />
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
          className="form-input mt-1.5 resize-none transition-all"
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
          className="form-input mt-1.5 resize-none transition-all"
          placeholder="e.g. Fed announcement at 2PM caused unexpected volatility. News-driven move, not pure technical."
          {...register('notes')}
        />
      </div>
    </div>
  );
}
