// src/app/ai-coach/page.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { TradesProvider, useTrades } from '@/contexts/TradesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAiInsights } from '@/hooks/ai/useAiInsights';
import { notify } from '@/lib/notify';
import AiCoachHero from '@/components/ai-coach/AiCoachHero';
import AiMetricsGrid from '@/components/ai-coach/AiMetricsGrid';
import AiChartsSection from '@/components/ai-coach/AiChartsSection';
import AiInsightsFeed from '@/components/ai-coach/AiInsightsFeed';
import AiPsychologyPanel from '@/components/ai-coach/AiPsychologyPanel';
import AiChatWidget from '@/components/ai-coach/AiChatWidget';
import { Loader2 } from 'lucide-react';

function AiCoachContent() {
  const { user } = useAuth();
  const { trades, isLoading: tradesLoading } = useTrades();
  const { insights, loading: aiLoading, error } = useAiInsights(trades);
  const notifiedRef = useRef(false);

  const isLoading = tradesLoading || aiLoading;

  useEffect(() => {
    if (isLoading || error || !insights || !user?.id || notifiedRef.current) return;
    if (trades.length === 0) return;

    notifiedRef.current = true;
    const key = `ai_notify_${user.id}`;
    const last = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
    const today = new Date().toISOString().slice(0, 10);
    if (last === today) return;

    sessionStorage.setItem(key, today);
    void notify.aiAnalysisCompleted(user.id);
    void notify.aiCoachReady(user.id);
  }, [isLoading, error, insights, user?.id, trades.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Analyzing your trading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-loss bg-loss/10 rounded-xl border border-loss/20 mt-8">
        Failed to load AI insights: {error.message}
      </div>
    );
  }

  // Calculate high-level stats for Hero
  const wins = trades.filter((t) => (t.trade_status || '').toLowerCase() === 'win');
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

  // Calculate recent PnL (last 5 trades)
  const sortedTrades = [...trades].sort(
    (a, b) =>
      new Date(b.trade_date || b.created_at || '').getTime() -
      new Date(a.trade_date || a.created_at || '').getTime()
  );
  const recentPnl = sortedTrades.slice(0, 5).reduce((acc, t) => {
    const pnlValue = t.pnl_amount ?? (t as any).pnl ?? '0';
    const pnl = parseFloat(String(pnlValue));
    return acc + (isNaN(pnl) ? 0 : pnl);
  }, 0);

  // Safe fallbacks if no insights are generated yet
  const defaultScores = {
    disciplineScore: 0,
    riskManagementScore: 0,
    emotionalControlScore: 0,
    consistencyScore: 0,
    overallScore: 0,
  };
  const defaultEmotion = {
    emotionDistribution: [],
    emotionalTrend: [],
    revengeTradeCount: 0,
    calmTradeWinRate: 0,
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-8">
      {/* Hero Section */}
      <AiCoachHero
        overallScore={insights?.scores?.overallScore || 0}
        winRate={winRate}
        recentPnl={recentPnl}
        streak={insights?.streakAnalysis?.currentStreak?.count || 0}
      />

      {/* Advanced Metrics Grid */}
      <AiMetricsGrid scores={insights?.scores || defaultScores} />

      {/* Charts & Psychology (2/3 + 1/3 split) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AiChartsSection
            dayPerformance={insights?.dayPerformance || []}
            emotionalTrend={insights?.emotionAnalysis?.emotionalTrend || []}
          />
        </div>
        <div className="xl:col-span-1">
          <AiPsychologyPanel
            emotionAnalysis={insights?.emotionAnalysis || defaultEmotion}
            personality={insights?.tradingPersonality || 'New Trader'}
          />
        </div>
      </div>

      {/* Live AI Insights Feed */}
      <AiInsightsFeed feedback={insights?.feedback || []} />

      {/* Sticky AI Chat Assistant */}
      <AiChatWidget />
    </div>
  );
}

export default function AICoachPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout>
          <AiCoachContent />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
