'use client';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Loader2, Save, X, Zap, Info, TrendingUp, Brain, Camera,  } from 'lucide-react';
import { toast } from 'sonner';
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
}

type SectionKey = 'tradeInfo' | 'performance' | 'psychology' | 'media';

export default function AddTradeForm() {
  const router = useRouter();
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
    },
  });

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Auto-calculate PnL and RR when prices change
  const recalculate = useCallback(() => {
    const values = form.getValues();
    const entry = parseFloat(values.entryPrice);
    const exit = parseFloat(values.exitPrice);
    const sl = parseFloat(values.stopLoss);
    const tp = parseFloat(values.takeProfit);
    const lots = parseFloat(values.lotSize) || 1;
    const risk = parseFloat(values.riskAmount) || 100;
    const dir = values.tradeDirection;

    if (!isNaN(entry) && !isNaN(exit) && dir) {
      const priceDiff = dir === 'buy' ? exit - entry : entry - exit;
      const pnl = priceDiff * lots * 10; // simplified calculation
      form.setValue('pnlAmount', pnl.toFixed(2));
      form.setValue('tradeStatus', pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven');
    }

    if (!isNaN(entry) && !isNaN(sl) && !isNaN(tp) && dir) {
      const riskPts = Math.abs(entry - sl);
      const rewardPts = Math.abs(tp - entry);
      if (riskPts > 0) {
        const rr = rewardPts / riskPts;
        form.setValue('rrRatio', rr.toFixed(2));
      }
    }
  }, [form]);

  const handleSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    // BACKEND: POST /api/trades — save trade to database with images
    // BACKEND: POST /api/ai-insights/generate — trigger rule-based analysis
    await new Promise((r) => setTimeout(r, 1400));

    toast.success('Trade logged successfully! AI analysis generated.');
    setTimeout(() => router.push('/dashboard'), 1000);
    setIsSubmitting(false);
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
    { key: 'tradeInfo', label: 'Trade Information', icon: <TrendingUp size={15} />, desc: 'Asset, direction, prices' },
    { key: 'performance', label: 'Performance Metrics', icon: <Zap size={15} />, desc: 'P&L, RR ratio, outcome' },
    { key: 'psychology', label: 'Psychology & Strategy', icon: <Brain size={15} />, desc: 'Emotions, mistakes, lessons' },
    { key: 'media', label: 'Media & Metadata', icon: <Camera size={15} />, desc: 'Screenshots, tags, rating' },
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
                <TradeInfoSection form={form} onPriceChange={recalculate} />
              )}
              {section.key === 'performance' && (
                <PerformanceSection form={form} />
              )}
              {section.key === 'psychology' && (
                <PsychologySection form={form} />
              )}
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