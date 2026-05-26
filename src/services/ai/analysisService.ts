// src/services/ai/analysisService.ts
'use client';
import { computeAdvancedAnalytics } from '@/lib/trades/analyticsEngine';
import type { DbTrade } from '@/lib/trades/types';
import type { AdvancedAnalytics } from '@/lib/trades/analyticsEngine';

/**
 * Wrapper service that computes AI insights from trade data.
 * Currently uses the local deterministic analytics engine.
 * Later can be swapped for an LLM‑based provider.
 */
export async function getAiInsights(trades: DbTrade[]): Promise<AdvancedAnalytics> {
  // In a real app this could be async (e.g., fetch from API).
  // The analytics engine is pure and fast, so we just call it.
  return computeAdvancedAnalytics(trades);
}

/**
 * Derive high‑level scores (0‑100) from the advanced analytics.
 */
export function deriveScores(analytics: AdvancedAnalytics) {
  const disciplineScore = Math.min(100, Math.max(0, analytics.maxWinningStreak * 5)); // placeholder
  const riskScore = analytics.riskConsistency?.score ?? 0;
  const emotionalScore = analytics.emotionalLosses?.score ?? 0;
  const consistencyScore = analytics.maxWinningStreak / (analytics.maxLosingStreak + 1) * 10;
  return {
    disciplineScore: Math.round(disciplineScore),
    riskScore: Math.round(riskScore),
    emotionalScore: Math.round(emotionalScore),
    consistencyScore: Math.round(consistencyScore),
  };
}
