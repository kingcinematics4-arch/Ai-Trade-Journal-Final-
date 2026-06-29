'use client';
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from '@/i18n/hooks/useTranslation';
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
  const { t } = useTranslation();
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
    setStrategies(
      s ? JSON.parse(s) : defaultStrategies.map((x) => ({ id: x, label: x, value: x }))
    );

    const m = localStorage.getItem('v2-mistakes');
    setMistakes(m ? JSON.parse(m) : defaultMistakes.map((x) => ({ id: x, label: x, value: x })));

    const e = localStorage.getItem('v2-emotions');
    setEmotions(e ? JSON.parse(e) : defaultEmotions.map((x) => ({ id: x, label: x, value: x })));
  }, []);

  const handleAdd = (
    val: string,
    setter: any,
    storageKey: string,
    setValueKey: keyof TradeFormData
  ) => {
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

  const handleDelete = (
    item: any,
    setter: any,
    storageKey: string,
    setValueKeys: (keyof TradeFormData)[]
  ) => {
    if (!window.confirm(t('trading.addTrade.psychology.confirmRemove', { item: item.label })))
      return;
    setter((prev: any) => {
      const updated = prev.filter((x: any) => x.id !== item.id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setValueKeys.forEach((key) => {
      if (watch(key) === item.value) {
        setValue(key, '', { shouldDirty: true, shouldValidate: true });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label={t('trading.addTrade.psychology.strategyUsed')}
          helperText={t('trading.addTrade.psychology.strategyHelper')}
          items={strategies}
          value={selectedStrategy}
          onSelect={(val) => setValue('strategyUsed', val, { shouldDirty: true })}
          onDelete={(item) => handleDelete(item, setStrategies, 'v2-strategies', ['strategyUsed'])}
          onAddCustom={(val) => handleAdd(val, setStrategies, 'v2-strategies', 'strategyUsed')}
          error={errors.strategyUsed?.message}
        />

        <SearchableSelect
          label={t('trading.addTrade.psychology.mistakeCategory')}
          helperText={t('trading.addTrade.psychology.mistakeHelper')}
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
          label={t('trading.addTrade.psychology.emotionBefore')}
          helperText={t('trading.addTrade.psychology.emotionBeforeHelper')}
          items={emotions}
          value={selectedEmotionBefore}
          onSelect={(val) => setValue('emotionBefore', val, { shouldDirty: true })}
          onDelete={(item) =>
            handleDelete(item, setEmotions, 'v2-emotions', ['emotionBefore', 'emotionAfter'])
          }
          onAddCustom={(val) => handleAdd(val, setEmotions, 'v2-emotions', 'emotionBefore')}
          error={errors.emotionBefore?.message}
        />

        <SearchableSelect
          label={t('trading.addTrade.psychology.emotionAfter')}
          helperText={t('trading.addTrade.psychology.emotionAfterHelper')}
          items={emotions}
          value={selectedEmotionAfter}
          onSelect={(val) => setValue('emotionAfter', val, { shouldDirty: true })}
          onDelete={(item) =>
            handleDelete(item, setEmotions, 'v2-emotions', ['emotionBefore', 'emotionAfter'])
          }
          onAddCustom={(val) => handleAdd(val, setEmotions, 'v2-emotions', 'emotionAfter')}
          error={errors.emotionAfter?.message}
        />
      </div>

      {/* Lessons Learned */}
      <div>
        <label className="form-label" htmlFor="lessons-learned">
          {t('trading.addTrade.psychology.lessonsLearned')}
        </label>
        <p className="form-helper">{t('trading.addTrade.psychology.lessonsHelper')}</p>
        <textarea
          id="lessons-learned"
          rows={3}
          className="form-input mt-1.5 resize-none transition-all"
          placeholder={t('trading.addTrade.psychology.lessonsPlaceholder')}
          {...register('lessonsLearned')}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="form-label" htmlFor="trade-notes">
          {t('trading.addTrade.psychology.notes')}
        </label>
        <p className="form-helper">{t('trading.addTrade.psychology.notesHelper')}</p>
        <textarea
          id="trade-notes"
          rows={2}
          className="form-input mt-1.5 resize-none transition-all"
          placeholder={t('trading.addTrade.psychology.notesPlaceholder')}
          {...register('notes')}
        />
      </div>
    </div>
  );
}
