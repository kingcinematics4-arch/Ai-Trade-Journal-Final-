'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';
import SearchableSelect from './SearchableSelect'; // Verified PascalCase relative import

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

  const [customStrategies, setCustomStrategies] = useState<any[]>([]);
  const [customMistakes, setCustomMistakes] = useState<any[]>([]);
  const [customEmotions, setCustomEmotions] = useState<any[]>([]);

  useEffect(() => {
    const s = localStorage.getItem('custom-strategies');
    if (s) setCustomStrategies(JSON.parse(s));
    const p = localStorage.getItem('custom-psychology');
    if (p) setCustomMistakes(JSON.parse(p));
    const e = localStorage.getItem('custom-emotions');
    if (e) setCustomEmotions(JSON.parse(e));
  }, []);

  const onDeleteStrategy = (item: any) => {
    const updated = customStrategies.filter((x) => x.id !== item.id);
    setCustomStrategies(updated);
    localStorage.setItem('custom-strategies', JSON.stringify(updated));
    if (selectedStrategy === (item.value || item.id)) {
      setValue('strategyUsed', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const onDeletePsychology = (item: any) => {
    const updated = customMistakes.filter((x) => x.id !== item.id);
    setCustomMistakes(updated);
    localStorage.setItem('custom-psychology', JSON.stringify(updated));
    if (selectedMistake === (item.value || item.id)) {
      setValue('mistakeCategory', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const onDeleteEmotion = (item: any) => {
    const updated = customEmotions.filter((x) => x.id !== item.id);
    setCustomEmotions(updated);
    localStorage.setItem('custom-emotions', JSON.stringify(updated));
    if (selectedEmotionBefore === (item.value || item.id)) {
      setValue('emotionBefore', '', { shouldDirty: true, shouldValidate: true });
    }
    if (selectedEmotionAfter === (item.value || item.id)) {
      setValue('emotionAfter', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  const allStrategies = useMemo(() => {
    const defaults = defaultStrategies.map((s) => ({ id: s, label: s, value: s, isCustom: false }));
    const customs = customStrategies.map((s) => ({ ...s, isCustom: true }));
    return [...customs, ...defaults];
  }, [customStrategies]);

  const allMistakes = useMemo(() => {
    const defaults = defaultMistakes.map((m) => ({ id: m, label: m, value: m, isCustom: false }));
    const customs = customMistakes.map((m) => ({ ...m, isCustom: true }));
    return [...customs, ...defaults];
  }, [customMistakes]);

  const allEmotions = useMemo(() => {
    const defaults = defaultEmotions.map((e) => ({ id: e, label: e, value: e, isCustom: false }));
    const customs = customEmotions.map((e) => ({ ...e, isCustom: true }));
    return [...customs, ...defaults];
  }, [customEmotions]);

  const handleAddCustom = (val: string, setter: any, storageKey: string, setValueKey: keyof TradeFormData) => {
    const name = val?.trim();
    if (!name) return;

    const newItem = {
      id: crypto.randomUUID(),
      label: name,
      value: name,
      isCustom: true
    };

    setter((prev: any) => {
      // Prevent duplicates in custom list
      if (prev.some((item: any) => item.value === name)) return prev;
      
      const updated = [newItem, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });

    setValue(setValueKey, name, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Strategy Used"
          helperText="Which trading strategy was applied"
          items={allStrategies}
          value={selectedStrategy}
          onSelect={(val) => setValue('strategyUsed', val, { shouldDirty: true, shouldValidate: true })}
          onDelete={onDeleteStrategy}
          onAddCustom={(val) => handleAddCustom(val, setCustomStrategies, 'custom-strategies', 'strategyUsed')}
          error={errors.strategyUsed?.message}
        />

        <SearchableSelect
          label="Mistake Category"
          helperText="Identify what went wrong (if anything)"
          items={allMistakes}
          value={selectedMistake}
          onSelect={(val) => setValue('mistakeCategory', val, { shouldDirty: true, shouldValidate: true })}
          onDelete={onDeletePsychology}
          onAddCustom={(val) => handleAddCustom(val, setCustomMistakes, 'custom-psychology', 'mistakeCategory')}
          error={errors.mistakeCategory?.message}
        />
      </div>

      {/* Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Emotion Before Trade"
          helperText="How were you feeling when you entered?"
          items={allEmotions}
          value={selectedEmotionBefore}
          onSelect={(val) => setValue('emotionBefore', val, { shouldDirty: true, shouldValidate: true })}
          onDelete={onDeleteEmotion}
          onAddCustom={(val) => handleAddCustom(val, setCustomEmotions, 'custom-emotions', 'emotionBefore')}
          error={errors.emotionBefore?.message}
        />

        <SearchableSelect
          label="Emotion After Trade"
          helperText="How did you feel after closing?"
          items={allEmotions}
          value={selectedEmotionAfter}
          onSelect={(val) => setValue('emotionAfter', val, { shouldDirty: true, shouldValidate: true })}
          onDelete={onDeleteEmotion}
          onAddCustom={(val) => handleAddCustom(val, setCustomEmotions, 'custom-emotions', 'emotionAfter')}
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
