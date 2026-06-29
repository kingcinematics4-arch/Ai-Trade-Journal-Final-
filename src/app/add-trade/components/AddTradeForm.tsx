'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  X,
  Zap,
  Info,
  TrendingUp,
  Brain,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradesContext';
import { createClient } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';
import { parseSafeNumber } from '@/lib/trades/analytics';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import TradeInfoSection from './TradeInfoSection';
import PerformanceSection from './PerformanceSection';
import PsychologySection from './PsychologySection';
import MediaMetaSection from './MediaMetaSection';

export interface TradeFormData {
  // Trade Info
  tradeTitle: string;
  tradeDate: string;
  marketType: string;
  assetName: string;
  tradeDirection: 'buy' | 'sell' | '';
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  riskAmount: string;
  tradeDuration: string;
  // Performance
  pnlAmount: string;
  rrRatio: string;
  tradeStatus: 'win' | 'loss' | 'breakeven' | '';
  // Psychology
  strategyUsed: string;
  emotionBefore: string;
  emotionAfter: string;
  mistakeCategory: string;
  lessonsLearned: string;
  notes: string;
  // Meta
  tags: string[];
  confidenceLevel: number;
  tradeRating: number;
  goalId?: string;
}

type SectionKey = 'tradeInfo' | 'performance' | 'psychology' | 'media';

export default function AddTradeForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { refetch } = useTrades();
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    tradeInfo: true,
    performance: true,
    psychology: true,
    media: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryImages, setEntryImages] = useState<File[]>([]);
  const [exitImages, setExitImages] = useState<File[]>([]);
  const [chartImages, setChartImages] = useState<File[]>([]);

  const form = useForm<TradeFormData>({
    defaultValues: {
      tradeTitle: '',
      tradeDate: new Date().toISOString().split('T')[0],
      marketType: '',
      assetName: '',
      tradeDirection: '',
      entryPrice: '',
      exitPrice: '',
      stopLoss: '',
      takeProfit: '',
      lotSize: '1',
      riskAmount: '',
      tradeDuration: '',
      pnlAmount: '',
      rrRatio: '',
      tradeStatus: '',
      strategyUsed: '',
      emotionBefore: '',
      emotionAfter: '',
      mistakeCategory: '',
      lessonsLearned: '',
      notes: '',
      tags: [],
      confidenceLevel: 5,
      tradeRating: 3,
      goalId: '',
    },
  });

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Watch relevant fields for auto-calculation
  // form.watch triggers a re-render only when these specific fields change
  const entryPrice = useWatch({ control: form.control, name: 'entryPrice' });
  const exitPrice = useWatch({ control: form.control, name: 'exitPrice' });
  const stopLoss = useWatch({ control: form.control, name: 'stopLoss' });
  const takeProfit = useWatch({ control: form.control, name: 'takeProfit' });
  const lotSize = useWatch({ control: form.control, name: 'lotSize' });
  const tradeDirection = useWatch({ control: form.control, name: 'tradeDirection' });

  // Auto-calculate PnL and RR when prices or direction change
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const lots = parseFloat(lotSize) || 1;
    const dir = tradeDirection;

    let pnlAmount = '';
    let tradeStatus = '';
    let rrRatio = '';

    // 1. Calculate P&L and Outcome if entry and exit are available
    if (!isNaN(entry) && !isNaN(exit) && dir) {
      const priceDiff = dir === 'buy' ? exit - entry : entry - exit;
      const pnl = priceDiff * lots;
      pnlAmount = isFinite(pnl) ? pnl.toFixed(2) : '0.00';
      tradeStatus = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven';
    }

    // 2. Calculate RR Ratio (Actual if exited, Target if open)
    if (!isNaN(entry) && !isNaN(sl) && dir) {
      const riskPts = Math.abs(entry - sl);
      if (riskPts > 0) {
        if (!isNaN(exit)) {
          const rewardPts = Math.abs(exit - entry);
          rrRatio = isFinite(rewardPts / riskPts) ? (rewardPts / riskPts).toFixed(2) : '0.00';
        } else if (!isNaN(tp)) {
          const rewardPts = Math.abs(tp - entry);
          rrRatio = isFinite(rewardPts / riskPts) ? (rewardPts / riskPts).toFixed(2) : '0.00';
        }
      }
    }

    // Guarded setValue calls: Only update if the value has actually changed to prevent
    // redundant re-renders and "Update during render" clashes.
    const { pnlAmount: curPnl, tradeStatus: curStatus, rrRatio: curRr } = form.getValues();
    const dirtyFields = form.formState.dirtyFields;

    // Only auto-update if the user hasn't manually touched (dirtied) these fields
    if (!dirtyFields.pnlAmount && curPnl !== pnlAmount) {
      form.setValue('pnlAmount', pnlAmount, { shouldValidate: true });
    }
    if (!dirtyFields.tradeStatus && curStatus !== tradeStatus) {
      form.setValue('tradeStatus', (tradeStatus as 'win' | 'loss' | 'breakeven' | '') || '', {
        shouldValidate: true,
      });
    }
    if (!dirtyFields.rrRatio && curRr !== rrRatio) {
      form.setValue('rrRatio', rrRatio, { shouldValidate: true });
    }
  }, [entryPrice, exitPrice, stopLoss, takeProfit, lotSize, tradeDirection, form]);

  const uploadImages = async (supabase: any, files: File[], bucket: string, path: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user!.id}/${path}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (data: TradeFormData) => {
    if (!user) {
      toast.error(t('trading.addTrade.mustBeSignedIn'));
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    // Capture the ID to update the toast later
    const toastId = toast.loading(t('trading.addTrade.loggingTrade'));

    try {
      // 1. Upload Images
      const [entryUrls, exitUrls, chartUrls] = await Promise.all([
        uploadImages(supabase, entryImages, 'trade-media', 'entry'),
        uploadImages(supabase, exitImages, 'trade-media', 'exit'),
        uploadImages(supabase, chartImages, 'trade-media', 'charts'),
      ]);

      // 2. Insert Trade Record
      const tradePayload = {
        user_id: user.id,
        trade_title: data.tradeTitle || `Trade: ${data.assetName} ${data.tradeDirection}`,
        trade_date: data.tradeDate,
        market_type: data.marketType,
        asset_name: data.assetName,
        trade_direction: data.tradeDirection,
        entry_price: parseSafeNumber(data.entryPrice),
        exit_price: parseSafeNumber(data.exitPrice),
        stop_loss: parseSafeNumber(data.stopLoss),
        take_profit: parseSafeNumber(data.takeProfit),
        lot_size: parseSafeNumber(data.lotSize),
        risk_amount: parseSafeNumber(data.riskAmount),
        trade_duration: data.tradeDuration || null,
        pnl_amount: parseSafeNumber(data.pnlAmount),
        rr_ratio: parseSafeNumber(data.rrRatio),
        trade_status: data.tradeStatus || null,
        strategy_used: data.strategyUsed || null,
        emotion_before: data.emotionBefore || null,
        emotion_after: data.emotionAfter || null,
        mistake_category: data.mistakeCategory || null,
        lessons_learned: data.lessonsLearned || null,
        notes: data.notes || null,
        tags: data.tags,
        confidence_level: data.confidenceLevel,
        trade_rating: data.tradeRating,
        goal_id: data.goalId || null,
        entry_images: entryUrls,
        exit_images: exitUrls,
        chart_images: chartUrls,
      };

      console.log('[Supabase Insert Debug] Payload:', tradePayload);

      const { error } = await supabase.from('trades').insert(tradePayload);

      if (error) throw error;

      await refetch();

      // 3. Create Notification
      await notificationService.createNotification({
        userId: user.id,
        title: t('trading.addTrade.tradeLogged'),
        message: t('trading.addTrade.successfullyRecorded', {
          direction: data.tradeDirection,
          asset: data.assetName,
        }),
        type: 'trade',
        link: '/dashboard',
      });

      // Update the existing loading toast to success
      toast.success(t('trading.addTrade.tradeLoggedSuccessfully'), { id: toastId });
      router.push('/dashboard');
    } catch (error: any) {
      // Update the loading toast to error
      toast.error(error.message || t('trading.addTrade.failedToSave'), { id: toastId });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (confirm(t('trading.addTrade.unsavedChanges'))) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const sections: { key: SectionKey; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'tradeInfo',
      label: t('trading.addTrade.sections.tradeInfo.label'),
      icon: <TrendingUp size={15} />,
      desc: t('trading.addTrade.sections.tradeInfo.desc'),
    },
    {
      key: 'performance',
      label: t('trading.addTrade.sections.performance.label'),
      icon: <Zap size={15} />,
      desc: t('trading.addTrade.sections.performance.desc'),
    },
    {
      key: 'psychology',
      label: t('trading.addTrade.sections.psychology.label'),
      icon: <Brain size={15} />,
      desc: t('trading.addTrade.sections.psychology.desc'),
    },
    {
      key: 'media',
      label: t('trading.addTrade.sections.media.label'),
      icon: <Camera size={15} />,
      desc: t('trading.addTrade.sections.media.desc'),
    },
  ];

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {sections.map((section, index) => (
        <div
          key={`section-${section.key}`}
          className={`card-premium relative transition-all duration-300 ${openSections[section.key] ? 'overflow-visible' : 'overflow-hidden hover:scale-[1.005] hover:shadow-xl'}`}
          style={{ zIndex: openSections[section.key] ? 40 - index : 0 }}
        >
          {/* Section Header */}
          <button
            type="button"
            onClick={() => toggleSection(section.key)}
            className="w-full flex items-center justify-between px-7 py-6 hover:bg-white/[0.02] transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-white border border-white/[0.05] shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:shadow-primary/20">
                {section.icon}
              </div>
              <div className="text-left">
                <p className="text-[17px] font-bold text-white tracking-tight">{section.label}</p>
                <p className="text-[11px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">
                  {section.desc}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: openSections[section.key] ? 0 : 180 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <ChevronDown size={16} className="text-muted-foreground" />
            </motion.div>
          </button>

          {/* Section Content */}
          <AnimatePresence initial={false}>
            {openSections[section.key] && (
              <motion.div
                key="content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="border-t border-border px-5 py-5 overflow-hidden"
              >
                {section.key === 'tradeInfo' && <TradeInfoSection form={form} />}
                {section.key === 'performance' && <PerformanceSection form={form} />}
                {section.key === 'psychology' && <PsychologySection form={form} />}
                {section.key === 'media' && (
                  <MediaMetaSection
                    form={form}
                    entryImages={entryImages}
                    setEntryImages={setEntryImages}
                    exitImages={exitImages}
                    setExitImages={setExitImages}
                    chartImages={chartImages}
                    setChartImages={setChartImages}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Sticky Save Bar - Premium Mobile Safe Area */}
      <div className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-2xl border-t border-white/[0.08] -mx-4 sm:-mx-6 px-5 py-5 pb-10 md:pb-5 md:px-6 shadow-[0_-15px_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom duration-500">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Info size={13} />
            <span>{t('trading.addTrade.aiInsights')}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-black h-14 md:h-10 md:px-8 rounded-2xl md:rounded-xl transition-all duration-200 active:scale-95"
            >
              <X size={16} />
              {t('trading.addTrade.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-[2] md:flex-none flex items-center justify-center gap-3 text-sm font-black h-14 md:h-10 md:px-10 rounded-2xl md:rounded-xl shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:brightness-110 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t('trading.addTrade.savingTrade')}
                </>
              ) : (
                <>
                  <Save size={14} />
                  {t('trading.addTrade.saveTrade')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
