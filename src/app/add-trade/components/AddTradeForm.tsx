'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/contexts/TradesContext';
import { createClient } from '@/lib/supabase';
import { parseSafeNumber } from '@/lib/trades/analytics';
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
  const loadingToastId = useRef<string | number | null>(null);
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

  // Stable no-op to satisfy TradeInfoSection requirements after logic migration to useEffect
  const handlePriceChange = useCallback(() => {
    // Intentionally empty: Calculation is now handled automatically by the watch effect
  }, []);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Watch relevant fields for auto-calculation
  // form.watch triggers a re-render only when these specific fields change
  const entryPrice = form.watch('entryPrice');
  const exitPrice = form.watch('exitPrice');
  const stopLoss = form.watch('stopLoss');
  const takeProfit = form.watch('takeProfit');
  const lotSize = form.watch('lotSize');
  const tradeDirection = form.watch('tradeDirection');

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
    const currentValues = form.getValues(['pnlAmount', 'tradeStatus', 'rrRatio']);

    if (currentValues[0] !== pnlAmount) {
      form.setValue('pnlAmount', pnlAmount, { shouldDirty: true });
    }
    if (currentValues[1] !== tradeStatus) {
      form.setValue('tradeStatus', (tradeStatus as 'win' | 'loss' | 'breakeven' | '') || '', { shouldDirty: true });
    }
    if (currentValues[2] !== rrRatio) {
      form.setValue('rrRatio', rrRatio, { shouldDirty: true });
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
      toast.error('You must be signed in to log a trade.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    // Capture the ID to update the toast later
    const toastId = toast.loading('Logging trade and syncing goals...');

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
        // goal_id removed — column does not exist in Supabase trades table yet
        // To re-enable: run ALTER TABLE public.trades ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;
        entry_images: entryUrls,
        exit_images: exitUrls,
        chart_images: chartUrls,
      };

      console.log('[Supabase Insert Debug] Payload:', tradePayload);

      const { error } = await supabase.from('trades').insert(tradePayload);

      if (error) throw error;

      // Update the existing loading toast to success
      toast.success('Trade logged successfully!', { id: toastId });
      router.push('/dashboard');
    } catch (error: any) {
      // Update the loading toast to error
      toast.error(error.message || 'Failed to save trade.', { id: toastId });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const sections: { key: SectionKey; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'tradeInfo',
      label: 'Trade Information',
      icon: <TrendingUp size={15} />,
      desc: 'Asset, direction, prices',
    },
    {
      key: 'performance',
      label: 'Performance Metrics',
      icon: <Zap size={15} />,
      desc: 'P&L, RR ratio, outcome',
    },
    {
      key: 'psychology',
      label: 'Psychology & Strategy',
      icon: <Brain size={15} />,
      desc: 'Emotions, mistakes, lessons',
    },
    {
      key: 'media',
      label: 'Media & Metadata',
      icon: <Camera size={15} />,
      desc: 'Screenshots, tags, rating',
    },
  ];

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {sections.map((section) => (
        <div key={`section-${section.key}`} className="card-elevated overflow-hidden">
          {/* Section Header */}
          <button
            type="button"
            onClick={() => toggleSection(section.key)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {section.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.desc}</p>
              </div>
            </div>
            {openSections[section.key] ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </button>

          {/* Section Content */}
          {openSections[section.key] && (
            <div className="border-t border-border px-5 py-5">
              {section.key === 'tradeInfo' && (
                <TradeInfoSection form={form} onPriceChange={handlePriceChange} />
              )}
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
            </div>
          )}
        </div>
      ))}

      {/* Sticky Save Bar */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border -mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 px-6 lg:px-8 xl:px-10 2xl:px-12 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info size={13} />
            <span>AI insights will be generated automatically after saving</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 text-sm min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving Trade...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Trade
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
